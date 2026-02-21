import express from 'express';
import cors from 'cors';
import path from 'path';
import statsRouter from './routes/stats';
import moleculesRouter from './routes/molecules';
import accountsRouter from './routes/accounts';
import contactsRouter from './routes/contacts';
import inquiriesRouter from './routes/inquiries';
import tasksRouter from './routes/tasks';
import emailsRouter from './routes/emails';
import followupsRouter from './routes/followups';
import lookupRouter from './routes/lookup';
import importRouter from './routes/import';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/stats', statsRouter);
app.use('/api/molecules', moleculesRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/contacts', contactsRouter);
app.use('/api/inquiries', inquiriesRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/emails', emailsRouter);
app.use('/api/followups', followupsRouter);
app.use('/api/lookup', lookupRouter);
app.use('/api/import', importRouter);
app.get('/api/export', (_req, res) => {
  res.redirect('/api/import/export');
});

// Serve static frontend in production
const clientBuildPath = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientBuildPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`aRMP CRM Server running on http://localhost:${PORT}`);
});

export default app;
