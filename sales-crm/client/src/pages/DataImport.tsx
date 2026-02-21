import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, RefreshCw, CheckCircle, AlertTriangle, X, FileSpreadsheet } from 'lucide-react';
import { importOldFile, importNewFile, resetDatabase, exportData } from '../lib/api';
import { cn } from '../lib/utils';

interface ImportStats {
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

function FileDropZone({ label, description, onFile, file, disabled }: {
  label: string;
  description: string;
  onFile: (f: File) => void;
  file: File | null;
  disabled: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div
      className={cn(
        'border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer',
        dragging ? 'border-primary bg-primary-50' : 'border-gray-200 hover:border-primary-300',
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      )}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => {
        e.preventDefault();
        setDragging(false);
        if (!disabled && e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]);
      }}
      onClick={() => !disabled && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={e => { if (e.target.files?.[0]) onFile(e.target.files[0]); }}
      />
      {file ? (
        <div className="flex flex-col items-center gap-2">
          <FileSpreadsheet className="w-10 h-10 text-green-500" />
          <div className="font-medium text-gray-900">{file.name}</div>
          <div className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Upload className="w-10 h-10 text-gray-300" />
          <div className="font-semibold text-gray-700">{label}</div>
          <div className="text-sm text-gray-400">{description}</div>
          <div className="text-xs text-gray-300 mt-1">Drop .xlsx file here or click to browse</div>
        </div>
      )}
    </div>
  );
}

function StatsCard({ stats, title }: { stats: ImportStats; title: string }) {
  return (
    <div className="card p-5">
      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <CheckCircle className="w-4 h-4 text-green-500" />
        {title} — Import Complete
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.rowsRead.toLocaleString()}</div>
          <div className="text-xs text-gray-400">Rows Read</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.rowsSplit.toLocaleString()}</div>
          <div className="text-xs text-gray-400">Rows After Split</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{stats.newAccounts}</div>
          <div className="text-xs text-gray-400">New Accounts</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.newContacts}</div>
          <div className="text-xs text-gray-400">New Contacts</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Drug Classification</div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
            <span className="text-xs text-gray-600">INN: <strong>{stats.innCount}</strong></span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
            <span className="text-xs text-gray-600">Brand: <strong>{stats.brandCount}</strong></span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
            <span className="text-xs text-gray-600">Unknown: <strong>{stats.unknownCount}</strong></span>
          </div>
        </div>
        <div className="mt-2 w-full h-2 rounded-full bg-gray-100 overflow-hidden">
          {(() => {
            const total = stats.innCount + stats.brandCount + stats.unknownCount;
            const innPct = total > 0 ? (stats.innCount / total) * 100 : 0;
            const brandPct = total > 0 ? (stats.brandCount / total) * 100 : 0;
            return (
              <div className="h-full flex">
                <div className="h-full bg-blue-500" style={{ width: `${innPct}%` }} />
                <div className="h-full bg-orange-500" style={{ width: `${brandPct}%` }} />
                <div className="h-full bg-gray-300" style={{ width: `${100 - innPct - brandPct}%` }} />
              </div>
            );
          })()}
        </div>
      </div>

      {stats.warnings.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-medium text-yellow-700 mb-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> {stats.warnings.length} Warnings
          </div>
          <div className="bg-yellow-50 rounded p-2 max-h-24 overflow-y-auto">
            {stats.warnings.slice(0, 10).map((w, i) => (
              <div key={i} className="text-xs text-yellow-800">{w}</div>
            ))}
            {stats.warnings.length > 10 && (
              <div className="text-xs text-yellow-600 mt-1">…and {stats.warnings.length - 10} more</div>
            )}
          </div>
        </div>
      )}

      {stats.errors.length > 0 && (
        <div>
          <div className="text-xs font-medium text-red-700 mb-1 flex items-center gap-1">
            <X className="w-3 h-3" /> {stats.errors.length} Errors
          </div>
          <div className="bg-red-50 rounded p-2 max-h-24 overflow-y-auto">
            {stats.errors.slice(0, 10).map((e, i) => (
              <div key={i} className="text-xs text-red-800">{e}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DataImport() {
  const [oldFile, setOldFile] = useState<File | null>(null);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [oldStats, setOldStats] = useState<ImportStats | null>(null);
  const [newStats, setNewStats] = useState<ImportStats | null>(null);

  const qc = useQueryClient();

  const importOldMut = useMutation({
    mutationFn: (f: File) => importOldFile(f),
    onSuccess: (data) => {
      setOldStats(data.stats);
      qc.invalidateQueries();
    },
  });

  const importNewMut = useMutation({
    mutationFn: (f: File) => importNewFile(f),
    onSuccess: (data) => {
      setNewStats(data.stats);
      qc.invalidateQueries();
    },
  });

  const resetMut = useMutation({
    mutationFn: resetDatabase,
    onSuccess: () => {
      setOldStats(null);
      setNewStats(null);
      setOldFile(null);
      setNewFile(null);
      qc.invalidateQueries();
    },
  });

  const isAnyLoading = importOldMut.isPending || importNewMut.isPending || resetMut.isPending;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Data Import</h1>
        <p className="text-sm text-gray-500 mt-1">Upload Excel files to populate the database</p>
      </div>

      {/* Upload Area */}
      <div className="card p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">File Upload</h3>
          <p className="text-xs text-gray-400">
            Upload both files to build the complete dataset. File A covers 2017–2022, File B covers 2022–2026.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-medium text-gray-600 mb-2">
              File A — Historical (2017–2022)
              <span className="ml-1 badge-gray">aRMP-2017 to aRMP-2022-030</span>
            </div>
            <FileDropZone
              label="Historical File"
              description="aRMP_Anfragen_Export_*.xlsx"
              onFile={setOldFile}
              file={oldFile}
              disabled={isAnyLoading}
            />
            {oldFile && !oldStats && (
              <button
                className="btn-primary w-full mt-2"
                disabled={importOldMut.isPending}
                onClick={() => importOldMut.mutate(oldFile)}
              >
                {importOldMut.isPending ? (
                  <span className="flex items-center gap-2 justify-center">
                    <RefreshCw className="w-4 h-4 animate-spin" /> Importing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2 justify-center">
                    <Upload className="w-4 h-4" /> Import Historical File
                  </span>
                )}
              </button>
            )}
            {importOldMut.isError && (
              <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                Error: {(importOldMut.error as Error).message}
              </div>
            )}
          </div>

          <div>
            <div className="text-xs font-medium text-gray-600 mb-2">
              File B — Current (2022–2026)
              <span className="ml-1 badge-gray">aRMP-2022-031 to present</span>
            </div>
            <FileDropZone
              label="Current File"
              description="aRMP_Enquiry_Sharepoint_Export_*.xlsx"
              onFile={setNewFile}
              file={newFile}
              disabled={isAnyLoading}
            />
            {newFile && !newStats && (
              <button
                className="btn-primary w-full mt-2"
                disabled={importNewMut.isPending}
                onClick={() => importNewMut.mutate(newFile)}
              >
                {importNewMut.isPending ? (
                  <span className="flex items-center gap-2 justify-center">
                    <RefreshCw className="w-4 h-4 animate-spin" /> Importing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2 justify-center">
                    <Upload className="w-4 h-4" /> Import Current File
                  </span>
                )}
              </button>
            )}
            {importNewMut.isError && (
              <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                Error: {(importNewMut.error as Error).message}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      {oldStats && <StatsCard stats={oldStats} title="File A (Historical)" />}
      {newStats && <StatsCard stats={newStats} title="File B (Current)" />}

      {/* Actions */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Database Actions</h3>
        <div className="flex gap-3 flex-wrap">
          <button
            className="btn-secondary"
            onClick={() => exportData()}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export to Excel
          </button>
          <button
            className="btn-danger"
            disabled={isAnyLoading}
            onClick={() => {
              if (confirm('This will delete ALL data and reset the database. Are you sure?')) {
                resetMut.mutate();
              }
            }}
          >
            {resetMut.isPending ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" /> Resetting...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" /> Reset Database
              </span>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Reset will permanently delete all imported data, accounts, contacts, emails, and tasks.
        </p>
      </div>

      {/* Column mapping info */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Expected Column Mapping</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">File A Columns</div>
            <div className="text-xs text-gray-600 space-y-1">
              {[
                ['Col 0', 'ID → source_id'],
                ['Col 1', 'ProjektNr → project_number'],
                ['Col 2', 'Client Name → client_name'],
                ['Col 3', 'Anfragedatum → inquiry_date'],
                ['Col 4', 'aRMP → drug (split & classified)'],
                ['Col 5', 'Inquiry type'],
                ['Col 6', 'Mengen → quantity'],
                ['Col 7', 'Transportation'],
                ['Col 8', 'Contact Name'],
              ].map(([col, desc]) => (
                <div key={col} className="flex gap-2">
                  <span className="font-mono text-gray-400 w-12 flex-shrink-0">{col}</span>
                  <span>{desc}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">File B Columns</div>
            <div className="text-xs text-gray-600 space-y-1">
              {[
                ['Col 0', 'ID → source_id'],
                ['Col 1', 'Project number'],
                ['Col 2', 'Client name'],
                ['Col 3', 'Project date → inquiry_date'],
                ['Col 4', 'EMA Drug Inquiry (split & classified)'],
                ['Col 5', 'Inquiry type'],
                ['Col 6', 'Quantity'],
                ['Col 7', 'Client Contact Name'],
                ['Col 19', 'Email → contact_email'],
                ['Col 12-16', 'EMA metadata'],
              ].map(([col, desc]) => (
                <div key={col} className="flex gap-2">
                  <span className="font-mono text-gray-400 w-12 flex-shrink-0">{col}</span>
                  <span>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
