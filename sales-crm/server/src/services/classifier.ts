export type ItemType = 'INN' | 'BRAND' | 'UNKNOWN';

export interface ClassificationResult {
  inn: string | null;
  brand_name: string | null;
  item_type: ItemType;
  classification_reason: string;
}

const INN_SUFFIXES = [
  'mab', 'zumab', 'ximab', 'umab', 'mumab', 'limab', 'tumab',
  'cept',
  'nib', 'tinib', 'ciclib', 'lisib',
  'vir', 'navir', 'previr',
  'statin',
  'pril', 'sartan', 'olol', 'dipine',
  'ase', 'plase', 'kinase',
  'tide', 'reotide',
  'grastim', 'poetin', 'leukin',
  'gliptin', 'gliflozin', 'glutide',
  'fusp', 'parib',
];

const KNOWN_BRANDS = new Set([
  'Humira', 'Avastin', 'Herceptin', 'MabThera', 'Remicade', 'Enbrel', 'Erbitux',
  'Opdivo', 'Keytruda', 'Bavencio', 'Imfinzi', 'Tysabri', 'Synagis', 'Simponi',
  'Perjeta', 'RoActemra', 'Stelara', 'Cosentyx', 'Dupixent', 'Prolia', 'Xolair',
  'Entyvio', 'Darzalex', 'Cyramza', 'Blincyto', 'Adcetris', 'Soliris', 'Lucentis',
  'Eylea', 'Cimzia', 'Simulect', 'Nulojix', 'Tremfya', 'Skyrizi', 'Ocrevus',
  'Tecentriq', 'Gazyvaro', 'Kadcyla', 'Hemlibra', 'Xgeva', 'Fasenra', 'Nucala',
  'Benlysta', 'Lemtrada', 'Ilaris', 'Cerezyme', 'Fabrazyme', 'Aldurazyme',
  'Idelvion', 'Abraxane', 'Avonex', 'Trulicity', 'Praluent', 'Repatha',
  'Vectibix', 'Yervoy', 'Libtayo',
]);

const KNOWN_BRANDS_LOWER = new Map<string, string>();
for (const b of KNOWN_BRANDS) {
  KNOWN_BRANDS_LOWER.set(b.toLowerCase(), b);
}

const BRACKET_RE = /^(.+?)\s*\((.+?)\)\s*$/;

function isInnBySuffix(word: string): string | null {
  const lower = word.toLowerCase();
  for (const suffix of INN_SUFFIXES) {
    if (lower.endsWith(suffix) && lower.length > suffix.length + 2) {
      return `inn_suffix_${suffix}`;
    }
  }
  return null;
}

function isBatchOrFreetext(text: string): boolean {
  if (/^\d/.test(text)) return true;
  const lc = text.toLowerCase();
  const freetextPhrases = ['various', 'not named', 'on-stock', 'on stock', 'mabs', 'tbd', 'unknown', 'n/a'];
  return freetextPhrases.some(p => lc.includes(p));
}

export function classifyFragment(fragment: string): ClassificationResult {
  const trimmed = fragment.trim();

  // Check for batch numbers / freetext
  if (isBatchOrFreetext(trimmed)) {
    return { inn: null, brand_name: null, item_type: 'UNKNOWN', classification_reason: 'freetext_or_batch' };
  }

  // Try bracket format: inn (brand) or brand (inn)
  const bracketMatch = trimmed.match(BRACKET_RE);
  if (bracketMatch) {
    const part1 = bracketMatch[1].trim();
    const part2 = bracketMatch[2].trim();

    const innSuffix1 = isInnBySuffix(part1);
    const innSuffix2 = isInnBySuffix(part2);
    const isBrand1 = KNOWN_BRANDS_LOWER.has(part1.toLowerCase());
    const isBrand2 = KNOWN_BRANDS_LOWER.has(part2.toLowerCase());

    if (innSuffix1 || (!isBrand1 && !isBrand2 && !innSuffix2)) {
      return {
        inn: part1.toLowerCase(),
        brand_name: part2,
        item_type: 'INN',
        classification_reason: innSuffix1 || 'bracket_format_assumed_inn_first',
      };
    } else if (innSuffix2) {
      return {
        inn: part2.toLowerCase(),
        brand_name: part1,
        item_type: 'INN',
        classification_reason: innSuffix2,
      };
    } else if (isBrand1) {
      return {
        inn: part2.toLowerCase(),
        brand_name: part1,
        item_type: 'INN',
        classification_reason: 'known_brand_in_brackets',
      };
    } else if (isBrand2) {
      return {
        inn: part1.toLowerCase(),
        brand_name: part2,
        item_type: 'INN',
        classification_reason: 'known_brand_in_brackets',
      };
    }
    return {
      inn: part1.toLowerCase(),
      brand_name: part2,
      item_type: 'INN',
      classification_reason: 'bracket_format',
    };
  }

  // No brackets — check single word
  const innSuffix = isInnBySuffix(trimmed);
  if (innSuffix) {
    return {
      inn: trimmed.toLowerCase(),
      brand_name: null,
      item_type: 'INN',
      classification_reason: innSuffix,
    };
  }

  const knownBrand = KNOWN_BRANDS_LOWER.get(trimmed.toLowerCase());
  if (knownBrand) {
    return {
      inn: null,
      brand_name: knownBrand,
      item_type: 'BRAND',
      classification_reason: 'known_brand',
    };
  }

  // Check if it looks like a batch: e.g. "Atezolizumab B0006B01"
  const batchLike = trimmed.match(/^(\S+)\s+[A-Z0-9]{5,}$/);
  if (batchLike) {
    const candidate = batchLike[1];
    const batchInnSuffix = isInnBySuffix(candidate);
    if (batchInnSuffix) {
      return {
        inn: candidate.toLowerCase(),
        brand_name: null,
        item_type: 'INN',
        classification_reason: `${batchInnSuffix}_with_batch`,
      };
    }
  }

  return { inn: null, brand_name: null, item_type: 'UNKNOWN', classification_reason: 'ambiguous' };
}

export function splitDrugField(rawValue: string): string[] {
  if (!rawValue || rawValue.trim() === '') return [];

  // Split by comma, then also handle slash-separated within each part
  const parts: string[] = [];
  const commaFragments = rawValue.split(',');
  for (const cf of commaFragments) {
    // Some entries use ' / ' as separator
    const slashFragments = cf.split('/');
    for (const sf of slashFragments) {
      const trimmed = sf.trim();
      if (trimmed.length > 0) {
        parts.push(trimmed);
      }
    }
  }
  return parts;
}
