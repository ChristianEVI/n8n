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
    SELECT DISTINCT inn, brand_name
    FROM inquiries
    WHERE (lower(inn) LIKE ? OR lower(brand_name) LIKE ?)
      AND inn IS NOT NULL
    ORDER BY inn ASC
    LIMIT 20
  `).all(pattern, pattern);
  res.json(results);
});

router.get('/:inn', (req, res) => {
  const db = getDb();
  const inn = req.params.inn.toLowerCase();

  const lookup = db.prepare(`
    SELECT * FROM molecule_lookup WHERE lower(inn) = ? LIMIT 1
  `).get(inn);

  const inquiries = db.prepare(`
    SELECT
      i.*,
      a.id as account_id
    FROM inquiries i
    LEFT JOIN accounts a ON lower(trim(a.name)) = lower(trim(i.client_name))
    WHERE lower(i.inn) = ?
    ORDER BY i.inquiry_date DESC
  `).all(inn);

  const stats = db.prepare(`
    SELECT
      COUNT(*) as total_inquiries,
      COUNT(DISTINCT client_name) as unique_clients,
      MIN(inquiry_date) as first_inquiry,
      MAX(inquiry_date) as last_inquiry
    FROM inquiries
    WHERE lower(inn) = ?
  `).get(inn) as {
    total_inquiries: number;
    unique_clients: number;
    first_inquiry: string;
    last_inquiry: string;
  };

  // Re-engagement: last inquiry > 12 months ago
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const thresholdDate = twelveMonthsAgo.toISOString().split('T')[0];

  const reEngagement = db.prepare(`
    SELECT client_name, MAX(inquiry_date) as last_inquiry_date
    FROM inquiries
    WHERE lower(inn) = ?
    GROUP BY client_name
    HAVING last_inquiry_date < ?
    ORDER BY last_inquiry_date ASC
  `).all(inn, thresholdDate);

  res.json({ lookup, inquiries, stats, reEngagement });
});

router.get('/:inn/customers', (req, res) => {
  const db = getDb();
  const inn = req.params.inn.toLowerCase();
  const data = db.prepare(`
    SELECT
      client_name,
      COUNT(*) as inquiry_count,
      MIN(inquiry_date) as first_inquiry,
      MAX(inquiry_date) as last_inquiry
    FROM inquiries
    WHERE lower(inn) = ?
    GROUP BY client_name
    ORDER BY last_inquiry DESC
  `).all(inn);
  res.json(data);
});

export default router;
