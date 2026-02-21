import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { importOldFile, importNewFile, buildAccountsAndContacts, exportToExcel } from '../services/importer';
import { resetDb } from '../db';

const router = Router();

const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => {
    const ts = Date.now();
    cb(null, `${ts}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.includes('spreadsheet') || file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.xls')) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'));
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

router.post('/old', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const stats = await importOldFile(req.file.path);
    const accountStats = buildAccountsAndContacts();
    stats.newAccounts = accountStats.newAccounts;
    stats.newContacts = accountStats.newContacts;

    // Clean up
    fs.unlink(req.file.path, () => {});

    res.json({ success: true, stats });
  } catch (err) {
    fs.unlink(req.file.path, () => {});
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/new', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const stats = await importNewFile(req.file.path);
    const accountStats = buildAccountsAndContacts();
    stats.newAccounts = accountStats.newAccounts;
    stats.newContacts = accountStats.newContacts;

    fs.unlink(req.file.path, () => {});

    res.json({ success: true, stats });
  } catch (err) {
    fs.unlink(req.file.path, () => {});
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/reset', (_req, res) => {
  try {
    resetDb();
    res.json({ success: true, message: 'Database has been reset' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/export', async (_req, res) => {
  try {
    const buffer = await exportToExcel();
    const filename = `armp_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
