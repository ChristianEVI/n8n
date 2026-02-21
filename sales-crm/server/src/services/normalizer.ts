const PROJECT_NUMBER_RE = /^aRMP-(\d{4})-(\d+)(.*)$/i;

export interface NormalizedProjectNumber {
  project_key: string;    // aRMP-YYYY-NNN (zero-padded to 3 digits)
  project_suffix: string; // optional suffix like -PO92504
  year: string;
  number: string;
}

export function normalizeProjectNumber(raw: string | null | undefined): NormalizedProjectNumber | null {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  const match = trimmed.match(PROJECT_NUMBER_RE);
  if (!match) return null;

  const year = match[1];
  const number = match[2].padStart(3, '0');
  const suffix = match[3] || '';

  return {
    project_key: `aRMP-${year}-${number}`,
    project_suffix: suffix,
    year,
    number,
  };
}

export function normalizeDate(value: unknown): string | null {
  if (!value) return null;

  // If it's a number (Excel serial date)
  if (typeof value === 'number') {
    // Excel date serial: days since Jan 1, 1900 (with leap year bug)
    const date = new Date((value - 25569) * 86400 * 1000);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;

    // Try common formats
    // DD.MM.YYYY
    const ddmmyyyy = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (ddmmyyyy) {
      const d = ddmmyyyy[1].padStart(2, '0');
      const m = ddmmyyyy[2].padStart(2, '0');
      return `${ddmmyyyy[3]}-${m}-${d}`;
    }

    // YYYY-MM-DD
    const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return trimmed.slice(0, 10);

    // MM/DD/YYYY
    const mmddyyyy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (mmddyyyy) {
      const m = mmddyyyy[1].padStart(2, '0');
      const d = mmddyyyy[2].padStart(2, '0');
      return `${mmddyyyy[3]}-${m}-${d}`;
    }

    // Try Date constructor as fallback
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  }

  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }

  return null;
}

export function normalizeClientName(name: string | null | undefined): string {
  if (!name) return '';
  return String(name)
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}
