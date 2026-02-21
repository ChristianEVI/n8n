import { Router } from 'express';
import { getDb } from '../db';

const router = Router();

router.get('/', (req, res) => {
  const db = getDb();
  const { status, priority, due } = req.query;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;

  let where = '1=1';
  const params: (string | number)[] = [];

  if (status) { where += ` AND t.status = ?`; params.push(status as string); }
  if (priority) { where += ` AND t.priority = ?`; params.push(priority as string); }
  if (due === 'today') {
    const today = new Date().toISOString().split('T')[0];
    where += ` AND t.due_date = ?`; params.push(today);
  } else if (due === 'overdue') {
    const today = new Date().toISOString().split('T')[0];
    where += ` AND t.due_date < ? AND t.status != 'DONE' AND t.status != 'CANCELLED'`; params.push(today);
  } else if (due === 'week') {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];
    where += ` AND t.due_date BETWEEN ? AND ?`; params.push(today, nextWeekStr);
  }

  const total = (db.prepare(`
    SELECT COUNT(*) as count FROM tasks t WHERE ${where}
  `).get(...params) as { count: number }).count;

  const tasks = db.prepare(`
    SELECT t.*, a.name as account_name, c.full_name as contact_name
    FROM tasks t
    LEFT JOIN accounts a ON t.account_id = a.id
    LEFT JOIN contacts c ON t.contact_id = c.id
    WHERE ${where}
    ORDER BY
      CASE t.priority WHEN 'URGENT' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END,
      t.due_date ASC NULLS LAST
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  res.json({ total, page, limit, data: tasks });
});

router.post('/', (req, res) => {
  const db = getDb();
  const { account_id, contact_id, inquiry_id, title, description, due_date, priority, status, task_type } = req.body;

  if (!title) return res.status(400).json({ error: 'title is required' });

  const result = db.prepare(`
    INSERT INTO tasks (account_id, contact_id, inquiry_id, title, description, due_date, priority, status, task_type)
    VALUES (@account_id, @contact_id, @inquiry_id, @title, @description, @due_date, @priority, @status, @task_type)
  `).run({
    account_id: account_id || null,
    contact_id: contact_id || null,
    inquiry_id: inquiry_id || null,
    title,
    description: description || null,
    due_date: due_date || null,
    priority: priority || 'MEDIUM',
    status: status || 'OPEN',
    task_type: task_type || 'GENERAL',
  });

  res.status(201).json(db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(result.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const id = parseInt(req.params.id);
  const { title, description, due_date, priority, status, task_type } = req.body;

  db.prepare(`
    UPDATE tasks SET
      title = COALESCE(@title, title),
      description = COALESCE(@description, description),
      due_date = COALESCE(@due_date, due_date),
      priority = COALESCE(@priority, priority),
      status = COALESCE(@status, status),
      task_type = COALESCE(@task_type, task_type),
      updated_at = datetime('now')
    WHERE id = @id
  `).run({
    id,
    title: title || null,
    description: description !== undefined ? description : null,
    due_date: due_date !== undefined ? due_date : null,
    priority: priority || null,
    status: status || null,
    task_type: task_type || null,
  });

  res.json(db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(id));
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  db.prepare(`DELETE FROM tasks WHERE id = ?`).run(parseInt(req.params.id));
  res.json({ success: true });
});

export default router;
