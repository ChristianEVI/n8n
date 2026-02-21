import { Router } from 'express';
import { getDb } from '../db';

const router = Router();

router.get('/molecules', (_req, res) => {
  const db = getDb();
  const data = db.prepare(`SELECT * FROM molecule_lookup ORDER BY inn, brand_name`).all();
  res.json(data);
});

router.post('/molecules', (req, res) => {
  const db = getDb();
  const { inn, brand_name, atc_code, is_biosimilar, ema_url, notes } = req.body;

  if (!inn) return res.status(400).json({ error: 'inn is required' });

  const result = db.prepare(`
    INSERT OR IGNORE INTO molecule_lookup (inn, brand_name, atc_code, is_biosimilar, ema_url, notes)
    VALUES (@inn, @brand_name, @atc_code, @is_biosimilar, @ema_url, @notes)
  `).run({
    inn: inn.toLowerCase().trim(),
    brand_name: brand_name || null,
    atc_code: atc_code || null,
    is_biosimilar: is_biosimilar ? 1 : 0,
    ema_url: ema_url || null,
    notes: notes || null,
  });

  if (result.changes === 0) {
    return res.status(409).json({ error: 'Entry already exists for this INN + brand combination' });
  }

  res.status(201).json(db.prepare(`SELECT * FROM molecule_lookup WHERE id = ?`).get(result.lastInsertRowid));
});

router.put('/molecules/:id', (req, res) => {
  const db = getDb();
  const id = parseInt(req.params.id);
  const { inn, brand_name, atc_code, is_biosimilar, ema_url, notes } = req.body;

  db.prepare(`
    UPDATE molecule_lookup SET
      inn = COALESCE(@inn, inn),
      brand_name = COALESCE(@brand_name, brand_name),
      atc_code = COALESCE(@atc_code, atc_code),
      is_biosimilar = COALESCE(@is_biosimilar, is_biosimilar),
      ema_url = COALESCE(@ema_url, ema_url),
      notes = COALESCE(@notes, notes)
    WHERE id = @id
  `).run({
    id,
    inn: inn ? inn.toLowerCase().trim() : null,
    brand_name: brand_name !== undefined ? brand_name : null,
    atc_code: atc_code !== undefined ? atc_code : null,
    is_biosimilar: is_biosimilar !== undefined ? (is_biosimilar ? 1 : 0) : null,
    ema_url: ema_url !== undefined ? ema_url : null,
    notes: notes !== undefined ? notes : null,
  });

  res.json(db.prepare(`SELECT * FROM molecule_lookup WHERE id = ?`).get(id));
});

router.delete('/molecules/:id', (req, res) => {
  const db = getDb();
  db.prepare(`DELETE FROM molecule_lookup WHERE id = ?`).run(parseInt(req.params.id));
  res.json({ success: true });
});

export default router;
