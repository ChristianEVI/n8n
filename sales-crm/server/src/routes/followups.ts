import { Router } from 'express';
import { getDb } from '../db';

const router = Router();

router.get('/', (_req, res) => {
  const db = getDb();

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const sixMonthsStr = sixMonthsAgo.toISOString().split('T')[0];

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const twelveMonthsStr = twelveMonthsAgo.toISOString().split('T')[0];

  // Re-engagement (> 12 months)
  const reEngagement = db.prepare(`
    SELECT
      i.client_name,
      a.id as account_id,
      MAX(i.inquiry_date) as last_inquiry,
      COUNT(DISTINCT i.project_key) as total_projects,
      'RE_ENGAGEMENT' as recommendation_type
    FROM inquiries i
    LEFT JOIN accounts a ON lower(trim(a.name)) = lower(trim(i.client_name))
    WHERE i.client_name IS NOT NULL AND i.client_name != ''
    GROUP BY i.client_name
    HAVING last_inquiry < ?
    ORDER BY last_inquiry ASC
    LIMIT 50
  `).all(twelveMonthsStr);

  // Refresh contact (> 6 months but < 12 months)
  const refreshContact = db.prepare(`
    SELECT
      i.client_name,
      a.id as account_id,
      MAX(i.inquiry_date) as last_inquiry,
      COUNT(DISTINCT i.project_key) as total_projects,
      'REFRESH_CONTACT' as recommendation_type
    FROM inquiries i
    LEFT JOIN accounts a ON lower(trim(a.name)) = lower(trim(i.client_name))
    WHERE i.client_name IS NOT NULL AND i.client_name != ''
    GROUP BY i.client_name
    HAVING last_inquiry >= ? AND last_inquiry < ?
    ORDER BY last_inquiry ASC
    LIMIT 50
  `).all(sixMonthsStr, twelveMonthsStr);

  // Open qualifications
  const openQualifications = db.prepare(`
    SELECT
      i.client_name,
      a.id as account_id,
      i.project_key,
      i.inquiry_date,
      i.qualified,
      'QUALIFICATION_NEEDED' as recommendation_type
    FROM inquiries i
    LEFT JOIN accounts a ON lower(trim(a.name)) = lower(trim(i.client_name))
    WHERE (i.qualified IS NULL OR i.qualified = '' OR lower(i.qualified) NOT IN ('yes', 'true', '1'))
      AND i.trigger_qualification IS NOT NULL AND i.trigger_qualification != ''
      AND lower(i.trigger_qualification) IN ('yes', 'true', '1')
    ORDER BY i.inquiry_date DESC
    LIMIT 50
  `).all();

  res.json({ reEngagement, refreshContact, openQualifications });
});

export default router;
