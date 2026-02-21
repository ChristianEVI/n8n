import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2, Plus, Mail, Edit2, Trash2, Save, X, ChevronLeft, ChevronRight,
  AlertTriangle, Phone, User
} from 'lucide-react';
import {
  searchAccounts, fetchAccount, fetchAccountInquiries, fetchAccountContacts,
  fetchAccountEmails, addContact, updateContact, deleteContact, createEmail,
} from '../lib/api';
import { formatDate, getProjectBadgeClass, getRoleTagClass, getRoleLabel, getTimelineDotClass, daysSince, cn } from '../lib/utils';

const ROLES = ['SCIENTIST', 'ECONOMIC_BUYER', 'LOGISTICS', 'SPOC', 'OTHER'] as const;

export default function AccountSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{ id: number; name: string; inquiry_count: number }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(
    searchParams.get('id') ? parseInt(searchParams.get('id')!) : null
  );
  const [page, setPage] = useState(1);
  const [editingContact, setEditingContact] = useState<number | null>(null);
  const [editContactData, setEditContactData] = useState<Record<string, string>>({});
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ full_name: '', email: '', phone: '', role: 'OTHER', role_description: '', notes: '' });
  const [showAddEmail, setShowAddEmail] = useState(false);
  const [newEmail, setNewEmail] = useState({ subject: '', sent_date: new Date().toISOString().split('T')[0], direction: 'OUTBOUND', status: 'SENT', notes: '', contact_id: '' });
  const [activeTab, setActiveTab] = useState<'products' | 'contacts' | 'emails' | 'tasks'>('products');

  const qc = useQueryClient();

  const { data: account } = useQuery({
    queryKey: ['account', selectedId],
    queryFn: () => fetchAccount(selectedId!),
    enabled: !!selectedId,
  });

  const { data: inquiriesData } = useQuery({
    queryKey: ['account-inquiries', selectedId, page],
    queryFn: () => fetchAccountInquiries(selectedId!, page),
    enabled: !!selectedId,
  });

  const { data: contacts } = useQuery({
    queryKey: ['account-contacts', selectedId],
    queryFn: () => fetchAccountContacts(selectedId!),
    enabled: !!selectedId,
  });

  const { data: emails } = useQuery({
    queryKey: ['account-emails', selectedId],
    queryFn: () => fetchAccountEmails(selectedId!),
    enabled: !!selectedId,
  });

  useEffect(() => {
    if (query.length >= 2) {
      searchAccounts(query).then(r => {
        setSuggestions(r);
        setShowSuggestions(true);
      });
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query]);

  const addContactMut = useMutation({
    mutationFn: (data: Record<string, unknown>) => addContact(selectedId!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['account-contacts', selectedId] });
      setShowAddContact(false);
      setNewContact({ full_name: '', email: '', phone: '', role: 'OTHER', role_description: '', notes: '' });
    },
  });

  const updateContactMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) => updateContact(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['account-contacts', selectedId] });
      setEditingContact(null);
    },
  });

  const deleteContactMut = useMutation({
    mutationFn: (id: number) => deleteContact(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['account-contacts', selectedId] }),
  });

  const addEmailMut = useMutation({
    mutationFn: (data: Record<string, unknown>) => createEmail(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['account-emails', selectedId] });
      setShowAddEmail(false);
    },
  });

  function selectAccount(id: number, name: string) {
    setSelectedId(id);
    setQuery(name);
    setShowSuggestions(false);
    setSearchParams({ id: String(id) });
    setPage(1);
    setActiveTab('products');
  }

  const daysLastContact = account?.stats?.last_contact ? daysSince(account.stats.last_contact) : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account Search</h1>
        <p className="text-sm text-gray-500 mt-1">View customer history, contacts, and communication</p>
      </div>

      {/* Search */}
      <div className="card p-5">
        <div className="relative max-w-xl">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search account name..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary"
          />
          {showSuggestions && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
              {suggestions.map(s => (
                <button
                  key={s.id}
                  onMouseDown={() => selectAccount(s.id, s.name)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
                >
                  <span className="text-sm font-medium text-gray-900">{s.name}</span>
                  <span className={cn('badge', getProjectBadgeClass(s.inquiry_count))}>
                    {s.inquiry_count} inquiries
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Account Detail */}
      {account && (
        <div className="space-y-4">
          {/* Account Header */}
          <div className="card p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900">{account.name}</h2>
                    <span className={cn('badge', getProjectBadgeClass(account.stats?.total_projects || 0))}>
                      {account.stats?.total_projects || 0} projects
                    </span>
                    {daysLastContact !== null && daysLastContact > 365 && (
                      <span className="flex items-center gap-1 badge bg-yellow-100 text-yellow-700">
                        <AlertTriangle className="w-3 h-3" />
                        {Math.floor(daysLastContact / 30)}mo no contact
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4 mt-2 text-sm text-gray-500">
                    {account.stats?.first_contact && (
                      <span>First contact: <strong className="text-gray-700">{formatDate(account.stats.first_contact)}</strong></span>
                    )}
                    {account.stats?.last_contact && (
                      <span>Last contact: <strong className="text-gray-700">{formatDate(account.stats.last_contact)}</strong></span>
                    )}
                    {account.stats?.total_inquiries && (
                      <span>Total inquiries: <strong className="text-gray-700">{account.stats.total_inquiries}</strong></span>
                    )}
                  </div>
                  {account.industry && <div className="text-xs text-gray-400 mt-1">{account.industry}</div>}
                  {account.country && <div className="text-xs text-gray-400">{account.country}</div>}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-4 flex gap-1 border-b border-gray-200">
              {(['products', 'contacts', 'emails'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize',
                    activeTab === tab
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  )}
                >
                  {tab === 'products' ? 'Product History' : tab === 'contacts' ? `Contacts (${contacts?.length || 0})` : `Emails (${emails?.length || 0})`}
                </button>
              ))}
            </div>
          </div>

          {/* Tab: Product History */}
          {activeTab === 'products' && (
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold text-gray-900">Product Inquiry History</h3>
                <div className="flex items-center gap-2">
                  <span className="badge-gray">{inquiriesData?.total || 0} total</span>
                </div>
              </div>
              <div className="table-container rounded-none border-0">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Project</th>
                      <th>INN</th>
                      <th>Brand</th>
                      <th>Type</th>
                      <th>Quantity</th>
                      <th>Contact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(inquiriesData?.data || []).map((inq: Record<string, string>, i: number) => (
                      <tr key={i}>
                        <td>
                          <div className="flex items-center gap-2">
                            <span className={getTimelineDotClass(inq.inquiry_type)} />
                            {formatDate(inq.inquiry_date)}
                          </div>
                        </td>
                        <td className="font-mono text-xs text-primary">{inq.project_key}</td>
                        <td className="font-medium capitalize">{inq.inn || '—'}</td>
                        <td className="text-gray-500">{inq.brand_name || '—'}</td>
                        <td>
                          {inq.inquiry_type ? (
                            <span className={cn('badge text-xs', inq.inquiry_type.toLowerCase().includes('stock') ? 'badge-green' : 'badge-blue')}>
                              {inq.inquiry_type}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="text-gray-500">{inq.quantity || '—'}</td>
                        <td className="text-gray-500">{inq.contact_name || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(!inquiriesData?.data || inquiriesData.data.length === 0) && (
                  <div className="py-10 text-center text-sm text-gray-400">No inquiries found.</div>
                )}
              </div>
              {inquiriesData && inquiriesData.total > inquiriesData.limit && (
                <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Page {page} of {Math.ceil(inquiriesData.total / inquiriesData.limit)}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="btn-secondary btn-sm disabled:opacity-50"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setPage(p => p + 1)}
                      disabled={page >= Math.ceil(inquiriesData.total / inquiriesData.limit)}
                      className="btn-secondary btn-sm disabled:opacity-50"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab: Contacts */}
          {activeTab === 'contacts' && (
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold text-gray-900">Contacts</h3>
                <button onClick={() => setShowAddContact(true)} className="btn-primary btn-sm">
                  <Plus className="w-3 h-3" /> Add Contact
                </button>
              </div>

              {/* Add Contact Form */}
              {showAddContact && (
                <div className="p-5 bg-gray-50 border-b border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">New Contact</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Full Name *</label>
                      <input className="input" value={newContact.full_name} onChange={e => setNewContact(d => ({ ...d, full_name: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">Email</label>
                      <input className="input" type="email" value={newContact.email} onChange={e => setNewContact(d => ({ ...d, email: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">Phone</label>
                      <input className="input" value={newContact.phone} onChange={e => setNewContact(d => ({ ...d, phone: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">Role</label>
                      <select className="select" value={newContact.role} onChange={e => setNewContact(d => ({ ...d, role: e.target.value }))}>
                        {ROLES.map(r => <option key={r} value={r}>{getRoleLabel(r)}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="label">Notes</label>
                      <input className="input" value={newContact.notes} onChange={e => setNewContact(d => ({ ...d, notes: e.target.value }))} />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button className="btn-primary btn-sm" onClick={() => addContactMut.mutate(newContact)}>
                      <Save className="w-3 h-3" /> Save
                    </button>
                    <button className="btn-secondary btn-sm" onClick={() => setShowAddContact(false)}>
                      <X className="w-3 h-3" /> Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="divide-y divide-gray-100">
                {(contacts || []).map((c: {
                  id: number; full_name: string; email: string; phone: string;
                  role: string; role_description: string; is_primary: number; notes: string;
                }) => (
                  <div key={c.id} className="px-5 py-4">
                    {editingContact === c.id ? (
                      <div>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="label">Full Name</label>
                            <input className="input" value={editContactData.full_name || c.full_name}
                              onChange={e => setEditContactData(d => ({ ...d, full_name: e.target.value }))} />
                          </div>
                          <div>
                            <label className="label">Email</label>
                            <input className="input" value={editContactData.email ?? c.email ?? ''}
                              onChange={e => setEditContactData(d => ({ ...d, email: e.target.value }))} />
                          </div>
                          <div>
                            <label className="label">Phone</label>
                            <input className="input" value={editContactData.phone ?? c.phone ?? ''}
                              onChange={e => setEditContactData(d => ({ ...d, phone: e.target.value }))} />
                          </div>
                          <div>
                            <label className="label">Role</label>
                            <select className="select" value={editContactData.role || c.role}
                              onChange={e => setEditContactData(d => ({ ...d, role: e.target.value }))}>
                              {ROLES.map(r => <option key={r} value={r}>{getRoleLabel(r)}</option>)}
                            </select>
                          </div>
                          <div className="col-span-2">
                            <label className="label">Notes</label>
                            <input className="input" value={editContactData.notes ?? c.notes ?? ''}
                              onChange={e => setEditContactData(d => ({ ...d, notes: e.target.value }))} />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="btn-primary btn-sm" onClick={() => updateContactMut.mutate({ id: c.id, data: editContactData })}>
                            <Save className="w-3 h-3" /> Save
                          </button>
                          <button className="btn-secondary btn-sm" onClick={() => setEditingContact(null)}>
                            <X className="w-3 h-3" /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-gray-500" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{c.full_name}</span>
                              <span className={getRoleTagClass(c.role)}>{getRoleLabel(c.role)}</span>
                              {c.is_primary ? <span className="badge badge-purple">Primary</span> : null}
                            </div>
                            <div className="flex gap-3 mt-1 text-xs text-gray-500">
                              {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>}
                              {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>}
                            </div>
                            {c.notes && <div className="text-xs text-gray-400 mt-1">{c.notes}</div>}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button className="btn-secondary btn-sm p-1.5"
                            onClick={() => { setEditingContact(c.id); setEditContactData({}); }}>
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button className="btn-secondary btn-sm p-1.5 text-red-500 hover:text-red-700"
                            onClick={() => { if (confirm('Delete this contact?')) deleteContactMut.mutate(c.id); }}>
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {(!contacts || contacts.length === 0) && (
                  <div className="py-10 text-center text-sm text-gray-400">No contacts yet.</div>
                )}
              </div>
            </div>
          )}

          {/* Tab: Emails */}
          {activeTab === 'emails' && (
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold text-gray-900">Email Log</h3>
                <button onClick={() => setShowAddEmail(true)} className="btn-primary btn-sm">
                  <Plus className="w-3 h-3" /> Log Email
                </button>
              </div>

              {showAddEmail && (
                <div className="p-5 bg-gray-50 border-b border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Log Email</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="label">Subject</label>
                      <input className="input" value={newEmail.subject} onChange={e => setNewEmail(d => ({ ...d, subject: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">Date</label>
                      <input className="input" type="date" value={newEmail.sent_date} onChange={e => setNewEmail(d => ({ ...d, sent_date: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">Contact</label>
                      <select className="select" value={newEmail.contact_id} onChange={e => setNewEmail(d => ({ ...d, contact_id: e.target.value }))}>
                        <option value="">— Select —</option>
                        {(contacts || []).map((c: { id: number; full_name: string }) => (
                          <option key={c.id} value={c.id}>{c.full_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">Direction</label>
                      <select className="select" value={newEmail.direction} onChange={e => setNewEmail(d => ({ ...d, direction: e.target.value }))}>
                        <option value="OUTBOUND">Outbound</option>
                        <option value="INBOUND">Inbound</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Status</label>
                      <select className="select" value={newEmail.status} onChange={e => setNewEmail(d => ({ ...d, status: e.target.value }))}>
                        <option value="SENT">Sent</option>
                        <option value="RECEIVED">Received</option>
                        <option value="DRAFT">Draft</option>
                        <option value="PLANNED">Planned</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="label">Notes</label>
                      <textarea className="input h-16 resize-none" value={newEmail.notes} onChange={e => setNewEmail(d => ({ ...d, notes: e.target.value }))} />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button className="btn-primary btn-sm" onClick={() =>
                      addEmailMut.mutate({ ...newEmail, account_id: selectedId, contact_id: newEmail.contact_id || null })
                    }>
                      <Save className="w-3 h-3" /> Save
                    </button>
                    <button className="btn-secondary btn-sm" onClick={() => setShowAddEmail(false)}>
                      <X className="w-3 h-3" /> Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="divide-y divide-gray-100">
                {(emails || []).map((e: {
                  id: number; subject: string; sent_date: string; direction: string;
                  status: string; contact_name: string; notes: string;
                }) => (
                  <div key={e.id} className="px-5 py-3 flex items-start gap-3">
                    <div className={cn('w-2 h-2 rounded-full mt-2 flex-shrink-0',
                      e.direction === 'OUTBOUND' ? 'bg-blue-500' : 'bg-green-500')} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{e.subject || '(no subject)'}</span>
                        <span className={cn('badge text-xs', e.direction === 'OUTBOUND' ? 'badge-blue' : 'badge-green')}>
                          {e.direction === 'OUTBOUND' ? 'Out' : 'In'}
                        </span>
                        <span className="badge-gray text-xs">{e.status}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {formatDate(e.sent_date)} · {e.contact_name || 'Unknown contact'}
                      </div>
                      {e.notes && <div className="text-xs text-gray-500 mt-1">{e.notes}</div>}
                    </div>
                  </div>
                ))}
                {(!emails || emails.length === 0) && (
                  <div className="py-10 text-center text-sm text-gray-400">No emails logged yet.</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {!selectedId && (
        <div className="card p-16 text-center">
          <Building2 className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Search for an account to view its details, contacts, and history.</p>
        </div>
      )}
    </div>
  );
}
