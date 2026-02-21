import * as XLSX from 'xlsx';
import Database from 'better-sqlite3';
import { getDb } from '../db';
import { normalizeProjectNumber, normalizeDate, normalizeClientName } from './normalizer';
import { splitDrugField, classifyFragment } from './classifier';

export interface ImportStats {
  rowsRead: number;
  rowsProcessed: number;
  rowsSplit: number;
  newAccounts: number;
  newContacts: number;
  innCount: number;
  brandCount: number;
  unknownCount: number;
  errors: string[];
  warnings: string[];
}

interface OldFileRow {
  source_id: string;
  project_number_raw: string;
  client_name: string;
  inquiry_date: unknown;
  drug_raw: string;
  inquiry_type: string;
  quantity: string;
  transportation: string;
  contact_name: string;
  qualified: string;
  trigger_qualification: string;
  intended_use: string;
}

interface NewFileRow {
  source_id: string;
  project_number_raw: string;
  client_name: string;
  inquiry_date: unknown;
  drug_raw: string;
  inquiry_type: string;
  quantity: string;
  contact_name: string;
  qualified: string;
  trigger_qualification: string;
  contact_email: string;
  ema_medicine_name: string;
  ema_active_substance: string;
  ema_atc_code: string;
  ema_biosimilar: string;
  ema_url: string;
}

function getCellValue(row: unknown[], index: number): string {
  const val = (row as unknown[])[index];
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

function getCellValueRaw(row: unknown[], index: number): unknown {
  return (row as unknown[])[index];
}

export async function importOldFile(filePath: string): Promise<ImportStats> {
  const stats: ImportStats = {
    rowsRead: 0, rowsProcessed: 0, rowsSplit: 0,
    newAccounts: 0, newContacts: 0,
    innCount: 0, brandCount: 0, unknownCount: 0,
    errors: [], warnings: [],
  };

  const db = getDb();
  const workbook = XLSX.readFile(filePath, { cellDates: false });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as unknown[][];

  // Skip header row
  const dataRows = rows.slice(1).filter(r => (r as unknown[]).some(c => c !== ''));
  stats.rowsRead = dataRows.length;

  const insertInquiry = db.prepare(`
    INSERT INTO inquiries (
      project_key, project_suffix, project_number_raw, source_id, data_source,
      client_name, inquiry_date, drug_raw, inn, brand_name, item_type,
      classification_reason, inquiry_type, quantity, contact_name, contact_email,
      qualified, trigger_qualification, intended_use, transportation
    ) VALUES (
      @project_key, @project_suffix, @project_number_raw, @source_id, @data_source,
      @client_name, @inquiry_date, @drug_raw, @inn, @brand_name, @item_type,
      @classification_reason, @inquiry_type, @quantity, @contact_name, @contact_email,
      @qualified, @trigger_qualification, @intended_use, @transportation
    )
  `);

  const importMany = db.transaction((rows: unknown[][]) => {
    for (const row of rows) {
      try {
        const r: OldFileRow = {
          source_id: getCellValue(row, 0),
          project_number_raw: getCellValue(row, 1),
          client_name: getCellValue(row, 2),
          inquiry_date: getCellValueRaw(row, 3),
          drug_raw: getCellValue(row, 4),
          inquiry_type: getCellValue(row, 5),
          quantity: getCellValue(row, 6),
          transportation: getCellValue(row, 7),
          contact_name: getCellValue(row, 8),
          qualified: getCellValue(row, 9),
          trigger_qualification: getCellValue(row, 10),
          intended_use: getCellValue(row, 11),
        };

        stats.rowsProcessed++;

        const normalized = normalizeProjectNumber(r.project_number_raw);
        if (!normalized) {
          stats.warnings.push(`Row ${stats.rowsProcessed}: Invalid project number "${r.project_number_raw}"`);
        }

        const inquiryDate = normalizeDate(r.inquiry_date);
        const fragments = splitDrugField(r.drug_raw);

        if (fragments.length === 0) {
          // Insert one row with no drug
          const base = {
            project_key: normalized?.project_key || r.project_number_raw || 'UNKNOWN',
            project_suffix: normalized?.project_suffix || '',
            project_number_raw: r.project_number_raw,
            source_id: r.source_id,
            data_source: 'OLD',
            client_name: r.client_name,
            inquiry_date: inquiryDate,
            drug_raw: null,
            inn: null,
            brand_name: null,
            item_type: 'UNKNOWN',
            classification_reason: 'no_drug_field',
            inquiry_type: r.inquiry_type,
            quantity: r.quantity,
            contact_name: r.contact_name,
            contact_email: null,
            qualified: r.qualified,
            trigger_qualification: r.trigger_qualification,
            intended_use: r.intended_use,
            transportation: r.transportation,
          };
          insertInquiry.run(base);
          stats.unknownCount++;
          stats.rowsSplit++;
        } else {
          for (const fragment of fragments) {
            const cls = classifyFragment(fragment);
            if (cls.item_type === 'INN') stats.innCount++;
            else if (cls.item_type === 'BRAND') stats.brandCount++;
            else stats.unknownCount++;

            insertInquiry.run({
              project_key: normalized?.project_key || r.project_number_raw || 'UNKNOWN',
              project_suffix: normalized?.project_suffix || '',
              project_number_raw: r.project_number_raw,
              source_id: r.source_id,
              data_source: 'OLD',
              client_name: r.client_name,
              inquiry_date: inquiryDate,
              drug_raw: fragment,
              inn: cls.inn,
              brand_name: cls.brand_name,
              item_type: cls.item_type,
              classification_reason: cls.classification_reason,
              inquiry_type: r.inquiry_type,
              quantity: r.quantity,
              contact_name: r.contact_name,
              contact_email: null,
              qualified: r.qualified,
              trigger_qualification: r.trigger_qualification,
              intended_use: r.intended_use,
              transportation: r.transportation,
            });
            stats.rowsSplit++;
          }
        }
      } catch (err) {
        stats.errors.push(`Row ${stats.rowsProcessed}: ${(err as Error).message}`);
      }
    }
  });

  importMany(dataRows);
  return stats;
}

export async function importNewFile(filePath: string): Promise<ImportStats> {
  const stats: ImportStats = {
    rowsRead: 0, rowsProcessed: 0, rowsSplit: 0,
    newAccounts: 0, newContacts: 0,
    innCount: 0, brandCount: 0, unknownCount: 0,
    errors: [], warnings: [],
  };

  const db = getDb();
  const workbook = XLSX.readFile(filePath, { cellDates: false });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as unknown[][];

  const dataRows = rows.slice(1).filter(r => (r as unknown[]).some(c => c !== ''));
  stats.rowsRead = dataRows.length;

  const insertInquiry = db.prepare(`
    INSERT INTO inquiries (
      project_key, project_suffix, project_number_raw, source_id, data_source,
      client_name, inquiry_date, drug_raw, inn, brand_name, item_type,
      classification_reason, inquiry_type, quantity, contact_name, contact_email,
      qualified, trigger_qualification, ema_medicine_name, ema_active_substance,
      ema_atc_code, ema_biosimilar, ema_url
    ) VALUES (
      @project_key, @project_suffix, @project_number_raw, @source_id, @data_source,
      @client_name, @inquiry_date, @drug_raw, @inn, @brand_name, @item_type,
      @classification_reason, @inquiry_type, @quantity, @contact_name, @contact_email,
      @qualified, @trigger_qualification, @ema_medicine_name, @ema_active_substance,
      @ema_atc_code, @ema_biosimilar, @ema_url
    )
  `);

  const upsertMolecule = db.prepare(`
    INSERT OR IGNORE INTO molecule_lookup (inn, brand_name, atc_code, is_biosimilar, ema_url)
    VALUES (@inn, @brand_name, @atc_code, @is_biosimilar, @ema_url)
  `);

  const importMany = db.transaction((rows: unknown[][]) => {
    for (const row of rows) {
      try {
        const r: NewFileRow = {
          source_id: getCellValue(row, 0),
          project_number_raw: getCellValue(row, 1),
          client_name: getCellValue(row, 2),
          inquiry_date: getCellValueRaw(row, 3),
          drug_raw: getCellValue(row, 4),
          inquiry_type: getCellValue(row, 5),
          quantity: getCellValue(row, 6),
          contact_name: getCellValue(row, 7),
          qualified: getCellValue(row, 8),
          trigger_qualification: getCellValue(row, 9),
          contact_email: getCellValue(row, 19),
          ema_medicine_name: getCellValue(row, 12),
          ema_active_substance: getCellValue(row, 13),
          ema_atc_code: getCellValue(row, 14),
          ema_biosimilar: getCellValue(row, 15),
          ema_url: getCellValue(row, 16),
        };

        stats.rowsProcessed++;

        const normalized = normalizeProjectNumber(r.project_number_raw);
        if (!normalized) {
          stats.warnings.push(`Row ${stats.rowsProcessed}: Invalid project number "${r.project_number_raw}"`);
        }

        const inquiryDate = normalizeDate(r.inquiry_date);
        const fragments = splitDrugField(r.drug_raw);

        if (fragments.length === 0) {
          const base = {
            project_key: normalized?.project_key || r.project_number_raw || 'UNKNOWN',
            project_suffix: normalized?.project_suffix || '',
            project_number_raw: r.project_number_raw,
            source_id: r.source_id,
            data_source: 'NEW',
            client_name: r.client_name,
            inquiry_date: inquiryDate,
            drug_raw: null,
            inn: null,
            brand_name: null,
            item_type: 'UNKNOWN',
            classification_reason: 'no_drug_field',
            inquiry_type: r.inquiry_type,
            quantity: r.quantity,
            contact_name: r.contact_name,
            contact_email: r.contact_email || null,
            qualified: r.qualified,
            trigger_qualification: r.trigger_qualification,
            ema_medicine_name: r.ema_medicine_name || null,
            ema_active_substance: r.ema_active_substance || null,
            ema_atc_code: r.ema_atc_code || null,
            ema_biosimilar: r.ema_biosimilar || null,
            ema_url: r.ema_url || null,
          };
          insertInquiry.run(base);
          stats.unknownCount++;
          stats.rowsSplit++;
        } else {
          for (const fragment of fragments) {
            const cls = classifyFragment(fragment);
            if (cls.item_type === 'INN') stats.innCount++;
            else if (cls.item_type === 'BRAND') stats.brandCount++;
            else stats.unknownCount++;

            insertInquiry.run({
              project_key: normalized?.project_key || r.project_number_raw || 'UNKNOWN',
              project_suffix: normalized?.project_suffix || '',
              project_number_raw: r.project_number_raw,
              source_id: r.source_id,
              data_source: 'NEW',
              client_name: r.client_name,
              inquiry_date: inquiryDate,
              drug_raw: fragment,
              inn: cls.inn,
              brand_name: cls.brand_name,
              item_type: cls.item_type,
              classification_reason: cls.classification_reason,
              inquiry_type: r.inquiry_type,
              quantity: r.quantity,
              contact_name: r.contact_name,
              contact_email: r.contact_email || null,
              qualified: r.qualified,
              trigger_qualification: r.trigger_qualification,
              ema_medicine_name: r.ema_medicine_name || null,
              ema_active_substance: r.ema_active_substance || null,
              ema_atc_code: r.ema_atc_code || null,
              ema_biosimilar: r.ema_biosimilar || null,
              ema_url: r.ema_url || null,
            });
            stats.rowsSplit++;
          }
        }

        // Populate molecule_lookup from EMA data
        if (r.ema_active_substance && r.ema_medicine_name) {
          try {
            upsertMolecule.run({
              inn: r.ema_active_substance.toLowerCase().trim(),
              brand_name: r.ema_medicine_name.trim(),
              atc_code: r.ema_atc_code || null,
              is_biosimilar: r.ema_biosimilar ? 1 : 0,
              ema_url: r.ema_url || null,
            });
          } catch {
            // ignore duplicate
          }
        }
      } catch (err) {
        stats.errors.push(`Row ${stats.rowsProcessed}: ${(err as Error).message}`);
      }
    }
  });

  importMany(dataRows);
  return stats;
}

export function buildAccountsAndContacts(): { newAccounts: number; newContacts: number } {
  const db = getDb();

  const upsertAccount = db.prepare(`
    INSERT OR IGNORE INTO accounts (name, normalized_name)
    VALUES (@name, @normalized_name)
  `);

  const getAccount = db.prepare(`SELECT id FROM accounts WHERE name = ?`);

  const upsertContact = db.prepare(`
    INSERT OR IGNORE INTO contacts (account_id, full_name, email, role)
    VALUES (@account_id, @full_name, @email, 'OTHER')
  `);

  const allClients = db.prepare(`
    SELECT DISTINCT client_name, contact_name, contact_email
    FROM inquiries
    WHERE client_name IS NOT NULL AND client_name != ''
  `).all() as { client_name: string; contact_name: string; contact_email: string }[];

  let newAccounts = 0;
  let newContacts = 0;

  const process = db.transaction(() => {
    const accountCache = new Map<string, number>();

    for (const row of allClients) {
      const clientName = row.client_name.trim();
      if (!clientName) continue;

      let accountId = accountCache.get(clientName);
      if (accountId === undefined) {
        const result = upsertAccount.run({
          name: clientName,
          normalized_name: normalizeClientName(clientName),
        });
        if (result.changes > 0) newAccounts++;
        const acc = getAccount.get(clientName) as { id: number } | undefined;
        accountId = acc?.id;
        if (accountId) accountCache.set(clientName, accountId);
      }

      if (!accountId) continue;

      if (row.contact_name && row.contact_name.trim()) {
        const result = upsertContact.run({
          account_id: accountId,
          full_name: row.contact_name.trim(),
          email: row.contact_email || null,
        });
        if (result.changes > 0) newContacts++;
      }
    }
  });

  process();
  return { newAccounts, newContacts };
}

export async function exportToExcel(): Promise<Buffer> {
  const db = getDb();

  const inquiries = db.prepare(`
    SELECT i.*, a.name as account_name
    FROM inquiries i
    LEFT JOIN accounts a ON lower(trim(a.name)) = lower(trim(i.client_name))
    ORDER BY i.inquiry_date DESC, i.project_key DESC
  `).all();

  const ws = XLSX.utils.json_to_sheet(inquiries);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Inquiries');

  const accounts = db.prepare(`SELECT * FROM accounts ORDER BY name`).all();
  const wsAcc = XLSX.utils.json_to_sheet(accounts);
  XLSX.utils.book_append_sheet(wb, wsAcc, 'Accounts');

  const contacts = db.prepare(`
    SELECT c.*, a.name as account_name
    FROM contacts c
    LEFT JOIN accounts a ON c.account_id = a.id
    ORDER BY a.name, c.full_name
  `).all();
  const wsCont = XLSX.utils.json_to_sheet(contacts);
  XLSX.utils.book_append_sheet(wb, wsCont, 'Contacts');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}
