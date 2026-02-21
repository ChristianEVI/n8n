import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Save, X, ExternalLink } from 'lucide-react';
import { fetchMoleculeLookup, addMoleculeLookup, updateMoleculeLookup, deleteMoleculeLookup } from '../lib/api';
import { cn } from '../lib/utils';

interface MoleculeLookup {
  id: number;
  inn: string;
  brand_name: string | null;
  atc_code: string | null;
  is_biosimilar: number;
  ema_url: string | null;
  notes: string | null;
}

const emptyForm = { inn: '', brand_name: '', atc_code: '', is_biosimilar: false, ema_url: '', notes: '' };

export default function Settings() {
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);

  const qc = useQueryClient();

  const { data: molecules } = useQuery({
    queryKey: ['molecule-lookup'],
    queryFn: fetchMoleculeLookup,
  });

  const addMut = useMutation({
    mutationFn: addMoleculeLookup,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['molecule-lookup'] });
      setShowAdd(false);
      setAddForm(emptyForm);
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof emptyForm }) => updateMoleculeLookup(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['molecule-lookup'] });
      setEditingId(null);
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteMoleculeLookup,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['molecule-lookup'] }),
  });

  const filtered = (molecules || []).filter((m: MoleculeLookup) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.inn?.toLowerCase().includes(q) ||
      m.brand_name?.toLowerCase().includes(q) ||
      m.atc_code?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage molecule lookup table and system configuration</p>
      </div>

      {/* Molecule Lookup Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="font-semibold text-gray-900">Molecule Lookup Table</h3>
            <p className="text-xs text-gray-400 mt-0.5">INN ↔ Brand ↔ ATC mapping — auto-populated from File B imports</p>
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input w-40 text-xs py-1.5"
            />
            <button onClick={() => setShowAdd(true)} className="btn-primary btn-sm">
              <Plus className="w-3 h-3" /> Add Entry
            </button>
          </div>
        </div>

        {/* Add Form */}
        {showAdd && (
          <div className="p-5 bg-gray-50 border-b border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">New Molecule Entry</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">INN *</label>
                <input className="input" placeholder="e.g. rituximab" value={addForm.inn}
                  onChange={e => setAddForm(d => ({ ...d, inn: e.target.value }))} />
              </div>
              <div>
                <label className="label">Brand Name</label>
                <input className="input" placeholder="e.g. MabThera" value={addForm.brand_name}
                  onChange={e => setAddForm(d => ({ ...d, brand_name: e.target.value }))} />
              </div>
              <div>
                <label className="label">ATC Code</label>
                <input className="input" placeholder="e.g. L01XC02" value={addForm.atc_code}
                  onChange={e => setAddForm(d => ({ ...d, atc_code: e.target.value }))} />
              </div>
              <div>
                <label className="label">EMA URL</label>
                <input className="input" type="url" value={addForm.ema_url}
                  onChange={e => setAddForm(d => ({ ...d, ema_url: e.target.value }))} />
              </div>
              <div className="flex items-center gap-2 mt-5">
                <input type="checkbox" id="bs-add" checked={addForm.is_biosimilar}
                  onChange={e => setAddForm(d => ({ ...d, is_biosimilar: e.target.checked }))} />
                <label htmlFor="bs-add" className="text-sm text-gray-700">Biosimilar</label>
              </div>
              <div>
                <label className="label">Notes</label>
                <input className="input" value={addForm.notes}
                  onChange={e => setAddForm(d => ({ ...d, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button className="btn-primary btn-sm"
                onClick={() => addMut.mutate(addForm)}>
                <Save className="w-3 h-3" /> Save
              </button>
              <button className="btn-secondary btn-sm" onClick={() => { setShowAdd(false); setAddForm(emptyForm); }}>
                <X className="w-3 h-3" /> Cancel
              </button>
            </div>
            {addMut.isError && (
              <div className="mt-2 text-xs text-red-600">{(addMut.error as Error).message}</div>
            )}
          </div>
        )}

        {/* Table */}
        <div className="table-container rounded-none border-0">
          <table className="table">
            <thead>
              <tr>
                <th>INN</th>
                <th>Brand Name</th>
                <th>ATC Code</th>
                <th>Biosimilar</th>
                <th>EMA URL</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m: MoleculeLookup) => (
                editingId === m.id ? (
                  <tr key={m.id} className="bg-blue-50">
                    <td>
                      <input className="input py-1 text-xs" value={editForm.inn}
                        onChange={e => setEditForm(d => ({ ...d, inn: e.target.value }))} />
                    </td>
                    <td>
                      <input className="input py-1 text-xs" value={editForm.brand_name}
                        onChange={e => setEditForm(d => ({ ...d, brand_name: e.target.value }))} />
                    </td>
                    <td>
                      <input className="input py-1 text-xs" value={editForm.atc_code}
                        onChange={e => setEditForm(d => ({ ...d, atc_code: e.target.value }))} />
                    </td>
                    <td>
                      <input type="checkbox" checked={editForm.is_biosimilar}
                        onChange={e => setEditForm(d => ({ ...d, is_biosimilar: e.target.checked }))} />
                    </td>
                    <td>
                      <input className="input py-1 text-xs" value={editForm.ema_url}
                        onChange={e => setEditForm(d => ({ ...d, ema_url: e.target.value }))} />
                    </td>
                    <td>
                      <input className="input py-1 text-xs" value={editForm.notes}
                        onChange={e => setEditForm(d => ({ ...d, notes: e.target.value }))} />
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button className="btn-primary btn-sm p-1.5"
                          onClick={() => updateMut.mutate({ id: m.id, data: editForm })}>
                          <Save className="w-3 h-3" />
                        </button>
                        <button className="btn-secondary btn-sm p-1.5"
                          onClick={() => setEditingId(null)}>
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={m.id}>
                    <td className="font-medium capitalize">{m.inn}</td>
                    <td>{m.brand_name || '—'}</td>
                    <td className="font-mono text-xs">{m.atc_code || '—'}</td>
                    <td>
                      <span className={cn('badge text-xs', m.is_biosimilar ? 'badge-orange' : 'badge-blue')}>
                        {m.is_biosimilar ? 'Biosimilar' : 'Originator'}
                      </span>
                    </td>
                    <td>
                      {m.ema_url ? (
                        <a href={m.ema_url} target="_blank" rel="noopener noreferrer"
                          className="text-primary hover:underline text-xs flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" /> EMA
                        </a>
                      ) : '—'}
                    </td>
                    <td className="text-xs text-gray-500 max-w-[150px] truncate">{m.notes || '—'}</td>
                    <td>
                      <div className="flex gap-1">
                        <button className="btn-secondary btn-sm p-1.5"
                          onClick={() => {
                            setEditingId(m.id);
                            setEditForm({
                              inn: m.inn,
                              brand_name: m.brand_name || '',
                              atc_code: m.atc_code || '',
                              is_biosimilar: !!m.is_biosimilar,
                              ema_url: m.ema_url || '',
                              notes: m.notes || '',
                            });
                          }}>
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          className="btn-secondary btn-sm p-1.5 text-red-500"
                          onClick={() => { if (confirm('Delete this entry?')) deleteMut.mutate(m.id); }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-400">
              {search ? 'No entries match your search.' : 'No molecule lookup entries yet. They are auto-created from File B imports.'}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-200 text-xs text-gray-400">
          {filtered.length} of {(molecules || []).length} entries
        </div>
      </div>

      {/* About */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 mb-3">About</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <div><strong>aRMP Sales Intelligence & CRM</strong> — Internal tool for tracking antibody aliquot inquiries</div>
          <div>Data sources: Two Excel files covering 2017–2026</div>
          <div>Database: SQLite (local, portable)</div>
          <div>INN/Brand classification: Automatic via suffix matching + known brand list</div>
        </div>
      </div>
    </div>
  );
}
