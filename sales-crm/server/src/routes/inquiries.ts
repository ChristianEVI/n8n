import { Router } from 'express';
import { getDb } from '../db';

const router = Router();

router.get('/search', (req, res) => {
  const db = getDb();
  const q = (req.query.q as string) || '';
  if (!q || q.length < 2) return res.json([]);

  const pattern = `%${q}%`;
  const results = db.prepare(`
    SELECT DISTINCT project_key, client_name, inquiry_date
    FROM inquiries
    WHERE project_key LIKE ? OR project_number_raw LIKE ?
    ORDER BY inquiry_date DESC
    LIMIT 20
  `).all(pattern, pattern);
  res.json(results);
});

router.get('/:project_key', (req, res) => {
  const db = getDb();
  const key = req.params.project_key;

  const inquiries = db.prepare(`
    SELECT * FROM inquiries WHERE project_key = ? ORDER BY id ASC
  `).all(key);

  if (inquiries.length === 0) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const first = inquiries[0] as { client_name: string };

  // Get account
  const account = db.prepare(`
    SELECT * FROM accounts WHERE lower(trim(name)) = lower(trim(?))
  `).get(first.client_name);

  // Get contacts for this project
  const contacts = db.prepare(`
    SELECT c.* FROM contacts c
    JOIN inquiry_contacts ic ON ic.contact_id = c.id
    WHERE ic.inquiry_id IN (SELECT id FROM inquiries WHERE project_key = ?)
  `).all(key);

  res.json({ project_key: key, inquiries, account, contacts });
});

export default router;
