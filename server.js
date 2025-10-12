const express = require('express');
const path = require('path');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const db = require('./src/db');
const nodemailer = require('nodemailer');
const multer = require('multer');
const { parse: csvParse } = require('csv-parse');
const XLSX = require('xlsx');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000; // Updated for Azure Container Apps deployment

// CORS configuration for React frontend
app.use(cors({
  origin: [
    'https://localhost:5173',
    'http://localhost:5173', 
    'https://victorious-sand-03c6e7910.5.azurestaticapps.net',
    /\.azurestaticapps\.net$/
  ],
  credentials: true
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json()); // Add JSON parsing for API calls

app.use(session({
  store: new SQLiteStore({ db: 'sessions.sqlite' }),
  secret: 'change-me-in-prod',
  resave: false,
  saveUninitialized: false,
}));

// simple middleware to expose user to views
app.use((req, res, next) => {
  res.locals.currentUser = req.session.userId ? { id: req.session.userId, email: req.session.userEmail } : null;
  next();
});

// ensure common template variables exist to avoid ReferenceError inside EJS template literals
app.use((req, res, next) => {
  res.locals.error = null;
  res.locals.info = null;
  res.locals.token = null;
  next();
});

const upload = multer({ dest: path.join(__dirname, 'tmp_uploads') });

// Home
app.get('/', async (req, res) => {
  res.redirect('/items');
});

// Register
app.get('/register', (req, res) => res.render('register'));
app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.render('register', { error: 'Email and password required' });
  const existing = await db.getUserByEmail(email);
  if (existing) return res.render('register', { error: 'Email already registered' });
  const hash = await bcrypt.hash(password, 10);
  const id = uuidv4();
  await db.createUser({ id, email, password_hash: hash });
  req.session.userId = id;
  req.session.userEmail = email;
  res.redirect('/items');
});

// Login
app.get('/login', (req, res) => res.render('login'));
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await db.getUserByEmail(email);
  if (!user) return res.render('login', { error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.render('login', { error: 'Invalid credentials' });
  req.session.userId = user.id;
  req.session.userEmail = user.email;
  res.redirect('/items');
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// Upload form
app.get('/uploads/new', requireAuth, async (req, res) => {
  res.render('upload_form');
});

// Handle CSV upload (single file)
app.post('/uploads', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.render('upload_form', { error: 'No file uploaded' });
  const filePath = req.file.path;
  const fileName = req.file.originalname;
  const fileSize = req.file.size;
  const uploadId = uuidv4();
  try {
    // create DB record and set file path so background worker can process it
    await db.insertUploadRecord({ id: uploadId, user_id: req.session.userId, filename: fileName, file_size: fileSize, items_created: 0 });
    await db.setUploadFilePath(uploadId, filePath);
    // optionally allow dedupe mode selection from the form
    const mode = req.body.dedupe_mode || 'skip';
    await db.setUploadDedupeMode(uploadId, mode);
    res.render('upload_form', { info: `Upload queued for processing (${fileName})` });
  } catch (err) {
    console.error('Upload queue error', err);
    // cleanup temp file on error
    try { fs.unlinkSync(filePath); } catch (e) {}
    res.render('upload_form', { error: 'Error queuing file for processing' });
  }
});

// List uploads with optional user filter
app.get('/uploads', requireAuth, async (req, res) => {
  const raw = req.query.user_id || null;
  let uploads = [];
  if (raw) {
    // allow passing either a user id or an email address
    let userId = raw;
    if (raw.includes('@')) {
      const user = await db.getUserByEmail(raw);
      if (!user) {
        // no such user -> show empty list
        return res.render('uploads', { uploads: [] });
      }
      userId = user.id;
    }
    uploads = await db.listUploadRecords({ userId });
  } else {
    uploads = await db.listUploadRecords();
  }
  res.render('uploads', { uploads });
});

app.get('/uploads/:id', requireAuth, async (req, res) => {
  const id = req.params.id;
  const upload = await db.getUploadById(id);
  if (!upload) return res.status(404).send('Not found');
  const rows = await db.listUploadRows(id);
  res.render('upload_report', { upload, rows });
});

app.get('/uploads/:id/failed.csv', requireAuth, async (req, res) => {
  const id = req.params.id;
  const rows = await db.listUploadRows(id);
  const failed = rows.filter(r => r.status === 'error');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="upload_${id}_failed.csv"`);
  // simple CSV: row_number,message,raw_data
  res.write('row_number,message,raw_data\n');
  for (const r of failed) {
    const safeMessage = `"${(r.message || '').replace(/"/g,'""')}"`;
    const safeRaw = `"${(r.raw_data || '').replace(/"/g,'""')}"`;
    res.write(`${r.row_number},${safeMessage},${safeRaw}\n`);
  }
  res.end();
});

// Password reset request
app.get('/reset', (req, res) => res.render('reset_request'));
app.post('/reset', async (req, res) => {
  const { email } = req.body;
  const user = await db.getUserByEmail(email);
  if (!user) return res.render('reset_request', { info: 'If that email exists, a reset link was sent' });
  const token = uuidv4();
  const expires = Date.now() + 1000 * 60 * 60; // 1 hour
  await db.savePasswordResetToken({ user_id: user.id, token, expires });

  // For demo: we won't send real emails by default. Instead, print the link to console.
  const link = `${req.protocol}://${req.get('host')}/reset/${token}`;
  console.log('Password reset link:', link);

  // If SMTP configured, send email (optional)
  if (process.env.SMTP_HOST) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({
      to: user.email,
      subject: 'Password reset',
      text: `Reset link: ${link}`,
    });
  }

  res.render('reset_request', { info: 'If that email exists, a reset link was sent (check console for link in local dev)' });
});

app.get('/reset/:token', async (req, res) => {
  const token = req.params.token;
  const rec = await db.getPasswordReset(token);
  if (!rec || rec.expires < Date.now()) return res.render('reset_password', { error: 'Token invalid or expired' });
  res.render('reset_password', { token });
});

app.post('/reset/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  const rec = await db.getPasswordReset(token);
  if (!rec || rec.expires < Date.now()) return res.render('reset_password', { error: 'Token invalid or expired' });
  const hash = await bcrypt.hash(password, 10);
  await db.updateUserPassword(rec.user_id, hash);
  await db.deletePasswordReset(token);
  res.render('reset_password', { info: 'Password reset successful. You can now login.' });
});

// Auth guard
function requireAuth(req, res, next) {
  if (!req.session.userId) return res.redirect('/login');
  next();
}

// admin guard
async function requireAdmin(req, res, next) {
  if (!req.session.userId) return res.redirect('/login');
  const user = await db.getUserById(req.session.userId);
  if (!user || user.role !== 'admin') return res.status(403).send('Forbidden');
  next();
}

// Users admin
app.get('/admin/users', requireAdmin, async (req, res) => {
  const users = await db.getAllUsers();
  res.render('admin_users', { users });
});

app.post('/admin/users/:id/promote', requireAdmin, async (req, res) => {
  const id = req.params.id;
  await db.setUserRole(id, 'admin');
  res.redirect('/admin/users');
});

// Items list & edit
app.get('/items', requireAuth, async (req, res) => {
  const page = parseInt(req.query.page || '1', 10) || 1;
  const pageSize = parseInt(req.query.pageSize || '20', 10) || 20;
  const search = req.query.search || null;
  const categoryId = req.query.category_id || null;
  const [items, categories, total] = await Promise.all([
    db.listItemsPaged({ page, pageSize, search, categoryId }),
    db.listCategories(),
    db.countItems({ search, categoryId }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  res.render('items', { items, categories, page, pageSize, total, totalPages, search, categoryId });
});

// Item create
app.get('/items/new', requireAuth, async (req, res) => {
  const categories = await db.listCategories();
  res.render('item_form', { item: null, categories });
});

app.post('/items', requireAuth, async (req, res) => {
  const { sku, name, primary_detail, category_id } = req.body;
  const id = uuidv4();
  await db.runInsertItem ? await db.runInsertItem({ id, sku, name, primary_detail, category_id, updated_by: req.session.userId }) : null;
  res.redirect('/items');
});

// Item edit
app.get('/items/:id/edit', requireAuth, async (req, res) => {
  const id = req.params.id;
  const item = await db.getItemById ? await db.getItemById(id) : null;
  const categories = await db.listCategories();
  res.render('item_form', { item, categories });
});

// Bulk assign selected items to a category
app.post('/items/bulk_assign', requireAuth, async (req, res) => {
  // item_ids may be a single value or array
  let ids = req.body.item_ids || [];
  if (!Array.isArray(ids)) ids = [ids];
  const categoryId = req.body.category_id || null;
  for (const id of ids) {
    try {
      await db.updateItem(id, { sku: (await db.getItemById(id)).sku, name: (await db.getItemById(id)).name, primary_detail: (await db.getItemById(id)).primary_detail, category_id: categoryId, updated_by: req.session.userId });
    } catch (e) {
      console.error('Bulk assign error for', id, e);
    }
  }
  res.redirect('/items');
});

app.post('/items/:id', requireAuth, async (req, res) => {
  const id = req.params.id;
  const { sku, name, primary_detail, category_id } = req.body;
  if (db.updateItem) {
    await db.updateItem(id, { sku, name, primary_detail, category_id, updated_by: req.session.userId });
  }
  res.redirect('/items');
});

// API endpoints (JSON)
app.get('/api/items', requireAuth, async (req, res) => {
  const items = await db.listItems();
  res.json(items);
});

app.post('/api/items', requireAuth, async (req, res) => {
  const { sku, name, primary_detail, category_id } = req.body;
  const id = uuidv4();
  if (db.runInsertItem) {
    await db.runInsertItem({ id, sku, name, primary_detail, category_id, updated_by: req.session.userId });
    const item = await db.getItemById(id);
    return res.status(201).json(item);
  }
  res.status(501).json({ error: 'Create not implemented' });
});

app.put('/api/items/:id', requireAuth, async (req, res) => {
  const id = req.params.id;
  const { sku, name, primary_detail, category_id } = req.body;
  if (db.updateItem) {
    await db.updateItem(id, { sku, name, primary_detail, category_id, updated_by: req.session.userId });
    const item = await db.getItemById(id);
    return res.json(item);
  }
  res.status(501).json({ error: 'Update not implemented' });
});

app.post('/items/:id/categorize', requireAuth, async (req, res) => {
  const id = req.params.id;
  const { category_id } = req.body;
  await db.updateItemCategory(id, category_id, req.session.userId);
  res.redirect('/items');
});

// Start server
async function start() {
  await db.init();
  app.listen(PORT, () => console.log(`Server started at http://localhost:${PORT}`));
  // start background upload worker
  try {
    const startUploadWorker = require('./src/uploadWorker');
    startUploadWorker(db);
    console.log('Upload worker started');
  } catch (e) {
    console.error('Could not start upload worker', e);
  }
}

start().catch(err => { console.error(err); process.exit(1); });
