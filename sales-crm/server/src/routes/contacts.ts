import { Router } from 'express';
import { getDb } from '../db';

const router = Router();

router.put('/:id', (req, res) => {
  const db = getDb();
  const id = parseInt(req.params.id);
  const { full_name, email, phone, role, role_description, is_primary, notes } = req.body;

  const existing = db.prepare(`SELECT * FROM contacts WHERE id = ?`).get(id) as {
    id: number; account_id: number; role: string;
  } | undefined;
  if (!existing) return res.status(404).json({ error: 'Contact not found' });

  // Check SPOC uniqueness (if changing to SPOC)
  if (role === 'SPOC' && existing.role !== 'SPOC') {
    const existingSpoc = db.prepare(`
      SELECT id FROM contacts WHERE account_id = ? AND role = 'SPOC' AND id != ?
    `).get(existing.account_id, id);
    if (existingSpoc) {
      return res.status(400).json({ error: 'Account already has a SPOC.' });
    }
  }

  db.prepare(`
    UPDATE contacts SET
      full_name = COALESCE(@full_name, full_name),
      email = COALESCE(@email, email),
      phone = COALESCE(@phone, phone),
      role = COALESCE(@role, role),
      role_description = COALESCE(@role_description, role_description),
      is_primary = COALESCE(@is_primary, is_primary),
      notes = COALESCE(@notes, notes),
      updated_at = datetime('now')
    WHERE id = @id
  `).run({
    id,
    full_name: full_name || null,
    email: email !== undefined ? email : null,
    phone: phone !== undefined ? phone : null,
    role: role || null,
    role_description: role_description !== undefined ? role_description : null,
    is_primary: is_primary !== undefined ? (is_primary ? 1 : 0) : null,
    notes: notes !== undefined ? notes : null,
  });

  res.json(db.prepare(`SELECT * FROM contacts WHERE id = ?`).get(id));
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  const id = parseInt(req.params.id);
  db.prepare(`DELETE FROM contacts WHERE id = ?`).run(id);
  res.json({ success: true });
});

export default router;
