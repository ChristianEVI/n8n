import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { initializeSchema } from './schema';

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'armp_crm.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    initializeSchema(_db);
  }
  return _db;
}

export function resetDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
  }
  getDb(); // reinitialize
}
