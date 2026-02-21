import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Stats
export const fetchStats = () => api.get('/stats').then(r => r.data);
export const fetchTimeline = () => api.get('/stats/timeline').then(r => r.data);
export const fetchTopMolecules = (limit = 10) => api.get(`/stats/top-molecules?limit=${limit}`).then(r => r.data);
export const fetchTopClients = (limit = 10) => api.get(`/stats/top-clients?limit=${limit}`).then(r => r.data);

// Molecules
export const searchMolecules = (q: string) => api.get(`/molecules/search?q=${encodeURIComponent(q)}`).then(r => r.data);
export const fetchMolecule = (inn: string) => api.get(`/molecules/${encodeURIComponent(inn)}`).then(r => r.data);
export const fetchMoleculeCustomers = (inn: string) => api.get(`/molecules/${encodeURIComponent(inn)}/customers`).then(r => r.data);

// Accounts
export const searchAccounts = (q: string) => api.get(`/accounts/search?q=${encodeURIComponent(q)}`).then(r => r.data);
export const fetchAccount = (id: number) => api.get(`/accounts/${id}`).then(r => r.data);
export const fetchAccountInquiries = (id: number, page = 1) => api.get(`/accounts/${id}/inquiries?page=${page}`).then(r => r.data);
export const fetchAccountContacts = (id: number) => api.get(`/accounts/${id}/contacts`).then(r => r.data);
export const fetchAccountEmails = (id: number) => api.get(`/accounts/${id}/emails`).then(r => r.data);
export const addContact = (accountId: number, data: Record<string, unknown>) => api.post(`/accounts/${accountId}/contacts`, data).then(r => r.data);
export const updateAccount = (id: number, data: Record<string, unknown>) => api.put(`/accounts/${id}`, data).then(r => r.data);

// Contacts
export const updateContact = (id: number, data: Record<string, unknown>) => api.put(`/contacts/${id}`, data).then(r => r.data);
export const deleteContact = (id: number) => api.delete(`/contacts/${id}`).then(r => r.data);

// Inquiries
export const searchInquiries = (q: string) => api.get(`/inquiries/search?q=${encodeURIComponent(q)}`).then(r => r.data);
export const fetchInquiry = (projectKey: string) => api.get(`/inquiries/${encodeURIComponent(projectKey)}`).then(r => r.data);

// Tasks
export const fetchTasks = (params: Record<string, string> = {}) => {
  const qs = new URLSearchParams(params).toString();
  return api.get(`/tasks?${qs}`).then(r => r.data);
};
export const createTask = (data: Record<string, unknown>) => api.post('/tasks', data).then(r => r.data);
export const updateTask = (id: number, data: Record<string, unknown>) => api.put(`/tasks/${id}`, data).then(r => r.data);
export const deleteTask = (id: number) => api.delete(`/tasks/${id}`).then(r => r.data);

// Emails
export const fetchEmails = (params: Record<string, string> = {}) => {
  const qs = new URLSearchParams(params).toString();
  return api.get(`/emails?${qs}`).then(r => r.data);
};
export const createEmail = (data: Record<string, unknown>) => api.post('/emails', data).then(r => r.data);
export const updateEmail = (id: number, data: Record<string, unknown>) => api.put(`/emails/${id}`, data).then(r => r.data);
export const deleteEmail = (id: number) => api.delete(`/emails/${id}`).then(r => r.data);

// Follow-ups
export const fetchFollowups = () => api.get('/followups').then(r => r.data);

// Lookup
export const fetchMoleculeLookup = () => api.get('/lookup/molecules').then(r => r.data);
export const addMoleculeLookup = (data: Record<string, unknown>) => api.post('/lookup/molecules', data).then(r => r.data);
export const updateMoleculeLookup = (id: number, data: Record<string, unknown>) => api.put(`/lookup/molecules/${id}`, data).then(r => r.data);
export const deleteMoleculeLookup = (id: number) => api.delete(`/lookup/molecules/${id}`).then(r => r.data);

// Import
export const importOldFile = (file: File) => {
  const fd = new FormData();
  fd.append('file', file);
  return api.post('/import/old', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
};
export const importNewFile = (file: File) => {
  const fd = new FormData();
  fd.append('file', file);
  return api.post('/import/new', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
};
export const resetDatabase = () => api.post('/import/reset').then(r => r.data);
export const exportData = () => {
  window.location.href = '/api/import/export';
};
