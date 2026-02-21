import { Router } from 'express';
import { getDb } from '../db';

const router = Router();

router.get('/', (_req, res) => {
  const db = getDb();

  const totalInquiries = (db.prepare(`SELECT COUNT(*) as count FROM inquiries`).get() as { count: number }).count;
  const uniqueClients = (db.prepare(`SELECT COUNT(DISTINCT client_name) as count FROM inquiries WHERE client_name != ''`).get() as { count: number }).count;
  const uniqueMolecules = (db.prepare(`SELECT COUNT(DISTINCT inn) as count FROM inquiries WHERE inn IS NOT NULL`).get() as { count: number }).count;
  const thisYear = new Date().getFullYear().toString();
  const inquiriesThisYear = (db.prepare(`SELECT COUNT(*) as count FROM inquiries WHERE inquiry_date LIKE ?`).get(`${thisYear}%`) as { count: number }).count;

  const recentActivity = db.prepare(`
    SELECT 'inquiry' as type, project_key, client_name, inquiry_date as date, drug_raw as detail
    FROM inquiries
    ORDER BY created_at DESC
    LIMIT 10
  `).all();

  res.json({
    totalInquiries,
    uniqueClients,
    uniqueMolecules,
    inquiriesThisYear,
    recentActivity,
  });
});

router.get('/timeline', (_req, res) => {
  const db = getDb();
  const data = db.prepare(`
    SELECT
      strftime('%Y-%m', inquiry_date) as month,
      COUNT(*) as count
    FROM inquiries
    WHERE inquiry_date IS NOT NULL
    GROUP BY month
    ORDER BY month ASC
  `).all();
  res.json(data);
});

router.get('/top-molecules', (req, res) => {
  const db = getDb();
  const limit = parseInt(req.query.limit as string) || 10;
  const data = db.prepare(`
    SELECT
      inn,
      COUNT(*) as count,
      COUNT(DISTINCT client_name) as unique_clients
    FROM inquiries
    WHERE inn IS NOT NULL AND inn != ''
    GROUP BY inn
    ORDER BY count DESC
    LIMIT ?
  `).all(limit);
  res.json(data);
});

router.get('/top-clients', (req, res) => {
  const db = getDb();
  const limit = parseInt(req.query.limit as string) || 10;
  const data = db.prepare(`
    SELECT
      client_name,
      COUNT(*) as count,
      MAX(inquiry_date) as last_inquiry
    FROM inquiries
    WHERE client_name IS NOT NULL AND client_name != ''
    GROUP BY client_name
    ORDER BY count DESC
    LIMIT ?
  `).all(limit);
  res.json(data);
});

export default router;
