import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, Plus, Check, Trash2, AlertTriangle, Clock, Calendar, X } from 'lucide-react';
import { fetchTasks, createTask, updateTask, deleteTask, fetchEmails, fetchFollowups } from '../lib/api';
import { formatDate, getPriorityClass, getTaskStatusClass, cn } from '../lib/utils';
import { searchAccounts, fetchAccountContacts } from '../lib/api';

const TASK_TYPES = ['FOLLOW_UP_EMAIL', 'QUOTE_REMINDER', 'REORDER_REMINDER', 'QUALIFICATION_CHECK', 'GENERAL'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const STATUSES = ['OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED'];

function TaskForm({ onSave, onCancel, initial = {} }: {
  onSave: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  initial?: Record<string, unknown>;
}) {
  const [form, setForm] = useState({
    title: (initial.title as string) || '',
    description: (initial.description as string) || '',
    due_date: (initial.due_date as string) || '',
    priority: (initial.priority as string) || 'MEDIUM',
    task_type: (initial.task_type as string) || 'GENERAL',
    account_name: (initial.account_name as string) || '',
    account_id: (initial.account_id as number) || undefined as number | undefined,
  });
  const [suggestions, setSuggestions] = useState<{ id: number; name: string }[]>([]);
  const [showSug, setShowSug] = useState(false);

  return (
    <div className="p-5 bg-gray-50 border-b border-gray-200">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="label">Title *</label>
          <input className="input" value={form.title} onChange={e => setForm(d => ({ ...d, title: e.target.value }))} />
        </div>
        <div className="relative">
          <label className="label">Account</label>
          <input className="input" value={form.account_name}
            onChange={async e => {
              setForm(d => ({ ...d, account_name: e.target.value, account_id: undefined }));
              if (e.target.value.length >= 2) {
                const r = await searchAccounts(e.target.value);
                setSuggestions(r);
                setShowSug(true);
              }
            }}
            onBlur={() => setTimeout(() => setShowSug(false), 150)}
          />
          {showSug && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded shadow-lg z-10 max-h-40 overflow-y-auto">
              {suggestions.map(s => (
                <button key={s.id} onMouseDown={() => {
                  setForm(d => ({ ...d, account_name: s.name, account_id: s.id }));
                  setShowSug(false);
                }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="label">Due Date</label>
          <input className="input" type="date" value={form.due_date} onChange={e => setForm(d => ({ ...d, due_date: e.target.value }))} />
        </div>
        <div>
          <label className="label">Priority</label>
          <select className="select" value={form.priority} onChange={e => setForm(d => ({ ...d, priority: e.target.value }))}>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Type</label>
          <select className="select" value={form.task_type} onChange={e => setForm(d => ({ ...d, task_type: e.target.value }))}>
            {TASK_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="label">Description</label>
          <textarea className="input h-16 resize-none" value={form.description}
            onChange={e => setForm(d => ({ ...d, description: e.target.value }))} />
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button className="btn-primary btn-sm" onClick={() => onSave({ ...form })}>
          <Check className="w-3 h-3" /> Save
        </button>
        <button className="btn-secondary btn-sm" onClick={onCancel}>
          <X className="w-3 h-3" /> Cancel
        </button>
      </div>
    </div>
  );
}

export default function EmailPlanner() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'emails' | 'followups'>('tasks');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState<number | null>(null);
  const [prefillTask, setPrefillTask] = useState<Record<string, unknown>>({});

  const qc = useQueryClient();

  const { data: tasksData } = useQuery({
    queryKey: ['tasks', statusFilter, priorityFilter],
    queryFn: () => {
      const p: Record<string, string> = {};
      if (statusFilter) p.status = statusFilter;
      if (priorityFilter) p.priority = priorityFilter;
      return fetchTasks(p);
    },
  });

  const { data: emailsData } = useQuery({
    queryKey: ['emails'],
    queryFn: () => fetchEmails({ limit: '50' }),
    enabled: activeTab === 'emails',
  });

  const { data: followupsData } = useQuery({
    queryKey: ['followups'],
    queryFn: fetchFollowups,
    enabled: activeTab === 'followups',
  });

  const createTaskMut = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      setShowAddTask(false);
      setPrefillTask({});
    },
  });

  const updateTaskMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) => updateTask(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const deleteTaskMut = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().split('T')[0];

  function getTaskRowClass(task: { due_date: string; status: string }) {
    if (!task.due_date || task.status === 'DONE' || task.status === 'CANCELLED') return '';
    if (task.due_date < today) return 'bg-red-50';
    if (task.due_date === today) return 'bg-orange-50';
    if (task.due_date <= nextWeekStr) return 'bg-yellow-50';
    return '';
  }

  function openCreateTaskFromFollowup(accountId: number, accountName: string, type: string) {
    setPrefillTask({
      account_id: accountId,
      account_name: accountName,
      task_type: type === 'RE_ENGAGEMENT' ? 'FOLLOW_UP_EMAIL' :
                 type === 'REFRESH_CONTACT' ? 'FOLLOW_UP_EMAIL' :
                 'QUALIFICATION_CHECK',
      title: type === 'RE_ENGAGEMENT' ? `Re-engage ${accountName}` :
             type === 'REFRESH_CONTACT' ? `Refresh contact with ${accountName}` :
             `Check qualification for ${accountName}`,
      priority: type === 'RE_ENGAGEMENT' ? 'HIGH' : 'MEDIUM',
    });
    setShowAddTask(true);
    setActiveTab('tasks');
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Email & Task Manager</h1>
        <p className="text-sm text-gray-500 mt-1">Track communications and manage follow-up tasks</p>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="flex border-b border-gray-200 px-4">
          {[
            { id: 'tasks', label: 'Open Tasks', icon: Clock },
            { id: 'emails', label: 'Email Log', icon: Mail },
            { id: 'followups', label: 'Follow-Up Recommendations', icon: AlertTriangle },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'tasks' | 'emails' | 'followups')}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'tasks' && tasksData?.total ? (
                <span className="badge-blue text-xs">{tasksData.total}</span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div>
            <div className="p-4 border-b border-gray-100 flex items-center gap-3 flex-wrap">
              <select className="select w-auto text-xs" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">All Statuses</option>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select className="select w-auto text-xs" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
                <option value="">All Priorities</option>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <div className="flex-1" />
              <button onClick={() => { setShowAddTask(true); setPrefillTask({}); }} className="btn-primary btn-sm">
                <Plus className="w-3 h-3" /> New Task
              </button>
            </div>

            {showAddTask && (
              <TaskForm
                initial={prefillTask}
                onSave={(data) => createTaskMut.mutate(data)}
                onCancel={() => { setShowAddTask(false); setPrefillTask({}); }}
              />
            )}

            <div className="table-container rounded-none border-0">
              <table className="table">
                <thead>
                  <tr>
                    <th>Due Date</th>
                    <th>Title</th>
                    <th>Account</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Type</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(tasksData?.data || []).map((task: {
                    id: number; due_date: string; title: string; account_name: string;
                    priority: string; status: string; task_type: string; description: string;
                  }) => (
                    <tr key={task.id} className={getTaskRowClass(task)}>
                      <td>
                        <div className="flex items-center gap-2">
                          {task.due_date && task.due_date < today && task.status !== 'DONE' && (
                            <AlertTriangle className="w-3 h-3 text-red-500" />
                          )}
                          <span className={cn(
                            'text-sm',
                            task.due_date && task.due_date < today && task.status !== 'DONE' ? 'text-red-600 font-medium' : ''
                          )}>
                            {task.due_date ? formatDate(task.due_date) : '—'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="font-medium text-gray-900 text-sm">{task.title}</div>
                        {task.description && <div className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{task.description}</div>}
                      </td>
                      <td className="text-gray-600">{task.account_name || '—'}</td>
                      <td><span className={cn('badge text-xs', getPriorityClass(task.priority))}>{task.priority}</span></td>
                      <td><span className={cn('badge text-xs', getTaskStatusClass(task.status))}>{task.status}</span></td>
                      <td><span className="text-xs text-gray-400">{task.task_type?.replace(/_/g, ' ')}</span></td>
                      <td>
                        <div className="flex gap-1">
                          {task.status !== 'DONE' && (
                            <button
                              className="btn-secondary btn-sm p-1.5 text-green-600"
                              title="Mark as done"
                              onClick={() => updateTaskMut.mutate({ id: task.id, data: { status: 'DONE' } })}
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            className="btn-secondary btn-sm p-1.5 text-red-500"
                            onClick={() => { if (confirm('Delete this task?')) deleteTaskMut.mutate(task.id); }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!tasksData?.data || tasksData.data.length === 0) && (
                <div className="py-12 text-center text-sm text-gray-400">
                  No tasks found. Create one with the "New Task" button.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Emails Tab */}
        {activeTab === 'emails' && (
          <div>
            <div className="table-container rounded-none border-0">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Subject</th>
                    <th>Account</th>
                    <th>Contact</th>
                    <th>Direction</th>
                    <th>Status</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {(emailsData?.data || []).map((e: {
                    id: number; sent_date: string; subject: string; account_name: string;
                    contact_name: string; direction: string; status: string; notes: string;
                  }) => (
                    <tr key={e.id}>
                      <td>{formatDate(e.sent_date)}</td>
                      <td className="font-medium">{e.subject || '(no subject)'}</td>
                      <td>{e.account_name || '—'}</td>
                      <td className="text-gray-500">{e.contact_name || '—'}</td>
                      <td>
                        <span className={cn('badge text-xs', e.direction === 'OUTBOUND' ? 'badge-blue' : 'badge-green')}>
                          {e.direction === 'OUTBOUND' ? 'Out' : 'In'}
                        </span>
                      </td>
                      <td><span className="badge-gray text-xs">{e.status}</span></td>
                      <td className="text-xs text-gray-400 max-w-[150px] truncate">{e.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!emailsData?.data || emailsData.data.length === 0) && (
                <div className="py-12 text-center text-sm text-gray-400">No emails logged yet.</div>
              )}
            </div>
          </div>
        )}

        {/* Follow-ups Tab */}
        {activeTab === 'followups' && followupsData && (
          <div className="divide-y divide-gray-100">
            {followupsData.reEngagement?.length > 0 && (
              <div className="p-5">
                <h3 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Re-Engagement Required — No contact in 12+ months ({followupsData.reEngagement.length})
                </h3>
                <div className="space-y-2">
                  {followupsData.reEngagement.map((r: {
                    client_name: string; account_id: number; last_inquiry: string; total_projects: number; recommendation_type: string;
                  }) => (
                    <div key={r.client_name} className="flex items-center justify-between bg-red-50 rounded-lg px-4 py-3">
                      <div>
                        <span className="font-medium text-gray-900 text-sm">{r.client_name}</span>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Last inquiry: {formatDate(r.last_inquiry)} · {r.total_projects} projects
                        </div>
                      </div>
                      <button
                        className="btn-sm bg-red-600 text-white hover:bg-red-700 rounded-lg px-3 py-1.5 text-xs font-medium"
                        onClick={() => openCreateTaskFromFollowup(r.account_id, r.client_name, 'RE_ENGAGEMENT')}
                      >
                        <Plus className="w-3 h-3 inline mr-1" />Create Task
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {followupsData.refreshContact?.length > 0 && (
              <div className="p-5">
                <h3 className="text-sm font-semibold text-yellow-700 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Refresh Contact — 6–12 months without contact ({followupsData.refreshContact.length})
                </h3>
                <div className="space-y-2">
                  {followupsData.refreshContact.map((r: {
                    client_name: string; account_id: number; last_inquiry: string; total_projects: number;
                  }) => (
                    <div key={r.client_name} className="flex items-center justify-between bg-yellow-50 rounded-lg px-4 py-3">
                      <div>
                        <span className="font-medium text-gray-900 text-sm">{r.client_name}</span>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Last inquiry: {formatDate(r.last_inquiry)} · {r.total_projects} projects
                        </div>
                      </div>
                      <button
                        className="btn-sm bg-yellow-600 text-white hover:bg-yellow-700 rounded-lg px-3 py-1.5 text-xs font-medium"
                        onClick={() => openCreateTaskFromFollowup(r.account_id, r.client_name, 'REFRESH_CONTACT')}
                      >
                        <Plus className="w-3 h-3 inline mr-1" />Create Task
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {followupsData.openQualifications?.length > 0 && (
              <div className="p-5">
                <h3 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Open Qualifications ({followupsData.openQualifications.length})
                </h3>
                <div className="space-y-2">
                  {followupsData.openQualifications.map((r: {
                    client_name: string; account_id: number; project_key: string;
                    inquiry_date: string; qualified: string;
                  }, i: number) => (
                    <div key={i} className="flex items-center justify-between bg-blue-50 rounded-lg px-4 py-3">
                      <div>
                        <span className="font-medium text-gray-900 text-sm">{r.client_name}</span>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Project: {r.project_key} · {formatDate(r.inquiry_date)}
                        </div>
                      </div>
                      <button
                        className="btn-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg px-3 py-1.5 text-xs font-medium"
                        onClick={() => openCreateTaskFromFollowup(r.account_id, r.client_name, 'QUALIFICATION')}
                      >
                        <Plus className="w-3 h-3 inline mr-1" />Create Task
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {followupsData.reEngagement?.length === 0 &&
              followupsData.refreshContact?.length === 0 &&
              followupsData.openQualifications?.length === 0 && (
              <div className="py-12 text-center text-sm text-gray-400">
                No follow-up recommendations at this time.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
