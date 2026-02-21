import { Router } from 'express';
import { getDb } from '../db';

const router = Router();

router.get('/search', (req, res) => {
  const db = getDb();
  const q = (req.query.q as string) || '';
  if (!q || q.length < 2) {
    return res.json([]);
  }
  const pattern = `%${q.toLowerCase()}%`;
  const results = db.prepare(`
    SELECT a.id, a.name, a.industry, a.country,
      (SELECT COUNT(*) FROM inquiries WHERE lower(trim(client_name)) = lower(trim(a.name))) as inquiry_count
    FROM accounts a
    WHERE lower(a.normalized_name) LIKE ?
    ORDER BY inquiry_count DESC
    LIMIT 20
  `).all(pattern);
  res.json(results);
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const id = parseInt(req.params.id);

  const account = db.prepare(`SELECT * FROM accounts WHERE id = ?`).get(id);
  if (!account) return res.status(404).json({ error: 'Account not found' });

  const stats = db.prepare(`
    SELECT COUNT(*) as total_inquiries,
      MIN(inquiry_date) as first_contact,
      MAX(inquiry_date) as last_contact,
      COUNT(DISTINCT project_key) as total_projects
    FROM inquiries
    WHERE lower(trim(client_name)) = lower(trim((SELECT name FROM accounts WHERE id = ?)))
  `).get(id);

  res.json({ ...account as object, stats });
});

router.get('/:id/inquiries', (req, res) => {
  const db = getDb();
  const id = parseInt(req.params.id);
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;

  const account = db.prepare(`SELECT name FROM accounts WHERE id = ?`).get(id) as { name: string } | undefined;
  if (!account) return res.status(404).json({ error: 'Account not found' });

  const total = (db.prepare(`
    SELECT COUNT(*) as count FROM inquiries
    WHERE lower(trim(client_name)) = lower(trim(?))
  `).get(account.name) as { count: number }).count;

  const inquiries = db.prepare(`
    SELECT * FROM inquiries
    WHERE lower(trim(client_name)) = lower(trim(?))
    ORDER BY inquiry_date DESC
    LIMIT ? OFFSET ?
  `).all(account.name, limit, offset);

  res.json({ total, page, limit, data: inquiries });
});

router.get('/:id/contacts', (req, res) => {
  const db = getDb();
  const id = parseInt(req.params.id);
  const contacts = db.prepare(`
    SELECT * FROM contacts WHERE account_id = ? ORDER BY is_primary DESC, full_name ASC
  `).all(id);
  res.json(contacts);
});

router.post('/:id/contacts', (req, res) => {
  const db = getDb();
  const id = parseInt(req.params.id);
  const { full_name, email, phone, role, role_description, is_primary, notes } = req.body;

  if (!full_name) return res.status(400).json({ error: 'full_name is required' });

  // Check SPOC uniqueness
  if (role === 'SPOC') {
    const existingSpoc = db.prepare(`
      SELECT id FROM contacts WHERE account_id = ? AND role = 'SPOC'
    `).get(id);
    if (existingSpoc) {
      return res.status(400).json({ error: 'Account already has a SPOC. Please update the existing SPOC instead.' });
    }
  }

  const result = db.prepare(`
    INSERT INTO contacts (account_id, full_name, email, phone, role, role_description, is_primary, notes)
    VALUES (@account_id, @full_name, @email, @phone, @role, @role_description, @is_primary, @notes)
  `).run({
    account_id: id,
    full_name: full_name.trim(),
    email: email || null,
    phone: phone || null,
    role: role || 'OTHER',
    role_description: role_description || null,
    is_primary: is_primary ? 1 : 0,
    notes: notes || null,
  });

  const newContact = db.prepare(`SELECT * FROM contacts WHERE id = ?`).get(result.lastInsertRowid);
  res.status(201).json(newContact);
});

router.get('/:id/emails', (req, res) => {
  const db = getDb();
  const id = parseInt(req.params.id);
  const emails = db.prepare(`
    SELECT e.*, c.full_name as contact_name
    FROM email_log e
    LEFT JOIN contacts c ON e.contact_id = c.id
    WHERE e.account_id = ?
    ORDER BY e.sent_date DESC
  `).all(id);
  res.json(emails);
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const id = parseInt(req.params.id);
  const { name, industry, country, website, notes } = req.body;

  db.prepare(`
    UPDATE accounts SET
      name = COALESCE(@name, name),
      industry = COALESCE(@industry, industry),
      country = COALESCE(@country, country),
      website = COALESCE(@website, website),
      notes = COALESCE(@notes, notes),
      updated_at = datetime('now')
    WHERE id = @id
  `).run({ id, name: name || null, industry: industry || null, country: country || null, website: website || null, notes: notes || null });

  res.json(db.prepare(`SELECT * FROM accounts WHERE id = ?`).get(id));
});

export default router;
