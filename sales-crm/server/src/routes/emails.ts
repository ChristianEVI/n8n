import { Router } from 'express';
import { getDb } from '../db';

const router = Router();

router.get('/', (req, res) => {
  const db = getDb();
  const { account_id, contact_id } = req.query;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;

  let where = '1=1';
  const params: (string | number)[] = [];

  if (account_id) { where += ` AND e.account_id = ?`; params.push(parseInt(account_id as string)); }
  if (contact_id) { where += ` AND e.contact_id = ?`; params.push(parseInt(contact_id as string)); }

  const total = (db.prepare(`SELECT COUNT(*) as count FROM email_log e WHERE ${where}`).get(...params) as { count: number }).count;

  const emails = db.prepare(`
    SELECT e.*, a.name as account_name, c.full_name as contact_name
    FROM email_log e
    LEFT JOIN accounts a ON e.account_id = a.id
    LEFT JOIN contacts c ON e.contact_id = c.id
    WHERE ${where}
    ORDER BY e.sent_date DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  res.json({ total, page, limit, data: emails });
});

router.post('/', (req, res) => {
  const db = getDb();
  const { account_id, contact_id, inquiry_id, subject, sent_date, direction, status, notes } = req.body;

  const result = db.prepare(`
    INSERT INTO email_log (account_id, contact_id, inquiry_id, subject, sent_date, direction, status, notes)
    VALUES (@account_id, @contact_id, @inquiry_id, @subject, @sent_date, @direction, @status, @notes)
  `).run({
    account_id: account_id || null,
    contact_id: contact_id || null,
    inquiry_id: inquiry_id || null,
    subject: subject || null,
    sent_date: sent_date || new Date().toISOString().split('T')[0],
    direction: direction || 'OUTBOUND',
    status: status || 'SENT',
    notes: notes || null,
  });

  res.status(201).json(db.prepare(`SELECT * FROM email_log WHERE id = ?`).get(result.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const id = parseInt(req.params.id);
  const { subject, sent_date, direction, status, notes } = req.body;

  db.prepare(`
    UPDATE email_log SET
      subject = COALESCE(@subject, subject),
      sent_date = COALESCE(@sent_date, sent_date),
      direction = COALESCE(@direction, direction),
      status = COALESCE(@status, status),
      notes = COALESCE(@notes, notes)
    WHERE id = @id
  `).run({ id, subject: subject || null, sent_date: sent_date || null, direction: direction || null, status: status || null, notes: notes !== undefined ? notes : null });

  res.json(db.prepare(`SELECT * FROM email_log WHERE id = ?`).get(id));
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  db.prepare(`DELETE FROM email_log WHERE id = ?`).run(parseInt(req.params.id));
  res.json({ success: true });
});

export default router;
