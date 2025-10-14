const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data.sqlite');

let db;

async function init() {
  db = await open({ filename: DB_PATH, driver: sqlite3.Database });
  await db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      sku TEXT NOT NULL,
      name TEXT NOT NULL,
      primary_detail TEXT,
      category_id TEXT,
      updated_by TEXT,
      updated_at INTEGER,
      FOREIGN KEY(category_id) REFERENCES categories(id),
      FOREIGN KEY(updated_by) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS password_resets (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS upload_records (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      file_size INTEGER,
      file_path TEXT,
      items_created INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      dedupe_mode TEXT DEFAULT 'skip',
      created_at INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS upload_rows (
      id TEXT PRIMARY KEY,
      upload_id TEXT NOT NULL,
      row_number INTEGER,
      raw_data TEXT,
      status TEXT,
      message TEXT,
      FOREIGN KEY(upload_id) REFERENCES upload_records(id)
    );
  `);

  // migration: ensure 'role' column exists on users
  const cols = await db.all("PRAGMA table_info('users')");
  const hasRole = cols.some(c => c.name === 'role');
  if (!hasRole) {
    // add role column with default
    await db.run("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'annotator'");
    await db.run("UPDATE users SET role = 'annotator' WHERE role IS NULL");
  }

  // migration: ensure 'name' column exists on users
  const hasName = cols.some(c => c.name === 'name');
  if (!hasName) {
    // add name column with default value derived from email
    await db.run("ALTER TABLE users ADD COLUMN name TEXT");
    await db.run("UPDATE users SET name = SUBSTR(email, 1, INSTR(email, '@') - 1) WHERE name IS NULL");
    await db.run("UPDATE users SET name = 'User' WHERE name IS NULL OR name = ''");
  }

  // migration: ensure 'file_path' column exists on upload_records
  const uploadCols = await db.all("PRAGMA table_info('upload_records')");
  const hasFilePath = uploadCols.some(c => c.name === 'file_path');
  if (!hasFilePath) {
    // SQLite doesn't support DROP COLUMN; adding new column is safe
    await db.run("ALTER TABLE upload_records ADD COLUMN file_path TEXT");
  }
  // ensure status column exists
  const hasStatus = uploadCols.some(c => c.name === 'status');
  if (!hasStatus) {
    await db.run("ALTER TABLE upload_records ADD COLUMN status TEXT DEFAULT 'pending'");
  }
  // ensure dedupe_mode column exists
  const hasDedupe = uploadCols.some(c => c.name === 'dedupe_mode');
  if (!hasDedupe) {
    await db.run("ALTER TABLE upload_records ADD COLUMN dedupe_mode TEXT DEFAULT 'skip'");
  }
  // ensure items_created column exists
  const hasItemsCreated = uploadCols.some(c => c.name === 'items_created');
  if (!hasItemsCreated) {
    await db.run("ALTER TABLE upload_records ADD COLUMN items_created INTEGER DEFAULT 0");
  }

  // seed categories and items if empty
  // ensure a set of useful categories exist; insert any that are missing
  const defaultCats = ['Electronics','Home & Kitchen','Clothing','Beauty & Personal Care','Sports & Outdoors','Books','Toys & Games','Automotive','Grocery','Office Products','Health & Household','Tools & Home Improvement','Garden & Outdoor','Pet Supplies','Other'];
  for (let i = 0; i < defaultCats.length; i++) {
    const name = defaultCats[i];
    const exists = await db.get('SELECT id FROM categories WHERE name = ?', [name]);
    if (!exists) {
      await db.run('INSERT INTO categories(id, name) VALUES (?, ?)', [`cat_seed_${i+1}`, name]);
    }
  }

  // migration: convert seeded categories to deterministic slug IDs (e.g. 'electronics')
  const slugMap = [
    { id: 'electronics', name: 'Electronics' },
    { id: 'home-kitchen', name: 'Home & Kitchen' },
    { id: 'clothing', name: 'Clothing' },
    { id: 'beauty-personal-care', name: 'Beauty & Personal Care' },
    { id: 'sports-outdoors', name: 'Sports & Outdoors' },
    { id: 'books', name: 'Books' },
    { id: 'toys-games', name: 'Toys & Games' },
    { id: 'automotive', name: 'Automotive' },
    { id: 'grocery', name: 'Grocery' },
    { id: 'office-products', name: 'Office Products' },
    { id: 'health-household', name: 'Health & Household' },
    { id: 'tools-home-improvement', name: 'Tools & Home Improvement' },
    { id: 'garden-outdoor', name: 'Garden & Outdoor' },
    { id: 'pet-supplies', name: 'Pet Supplies' },
    { id: 'other', name: 'Other' },
  ];

  for (const c of slugMap) {
    const byName = await db.get('SELECT id FROM categories WHERE name = ?', [c.name]);
    const bySlug = await db.get('SELECT id FROM categories WHERE id = ?', [c.id]);
    if (byName && byName.id === c.id) {
      // already good
      continue;
    }
    if (byName && byName.id !== c.id) {
      // there is a category with this name but id is non-slug (old seeded). Move items to slug id.
      if (!bySlug) {
        // create the slug row
        await db.run('INSERT INTO categories(id, name) VALUES (?, ?)', [c.id, c.name]);
      }
      // update items referencing old id to new slug id
      await db.run('UPDATE items SET category_id = ? WHERE category_id = ?', [c.id, byName.id]);
      // remove old category id
      await db.run('DELETE FROM categories WHERE id = ?', [byName.id]);
      continue;
    }
    if (!byName && !bySlug) {
      // neither name nor slug exists; insert slug
      await db.run('INSERT INTO categories(id, name) VALUES (?, ?)', [c.id, c.name]);
    }
  }

  const itemCount = await db.get('SELECT COUNT(*) as c FROM items');
  if (itemCount.c === 0) {
    await db.run('INSERT INTO items(id, sku, name, primary_detail) VALUES (?, ?, ?, ?)', ['i1','SKU-100','Smartphone','Brand X']);
    await db.run('INSERT INTO items(id, sku, name, primary_detail) VALUES (?, ?, ?, ?)', ['i2','SKU-200','T-Shirt','Cotton, Size M']);
    await db.run('INSERT INTO items(id, sku, name, primary_detail) VALUES (?, ?, ?, ?)', ['i3','SKU-300','Vacuum Cleaner','Bagless, 1200W']);
  }
}

async function insertUploadRecord({ id, user_id, filename, file_size, items_created }) {
  const now = Date.now();
  return db.run('INSERT INTO upload_records(id, user_id, filename, file_size, file_path, items_created, status, dedupe_mode, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [id, user_id, filename, file_size || 0, null, items_created || 0, 'pending', 'skip', now]);
}

async function listUploadRecords({ userId } = {}) {
  if (userId) return db.all('SELECT upload_records.*, COALESCE(users.name, users.email) as user_name FROM upload_records JOIN users ON upload_records.user_id = users.id WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  return db.all('SELECT upload_records.*, COALESCE(users.name, users.email) as user_name FROM upload_records JOIN users ON upload_records.user_id = users.id ORDER BY created_at DESC');
}

async function setUploadFilePath(uploadId, filePath) {
  return db.run('UPDATE upload_records SET file_path = ? WHERE id = ?', [filePath, uploadId]);
}

async function updateUploadStatus(uploadId, status) {
  return db.run('UPDATE upload_records SET status = ? WHERE id = ?', [status, uploadId]);
}

async function setUploadItemsCreated(uploadId, count) {
  return db.run('UPDATE upload_records SET items_created = ? WHERE id = ?', [count, uploadId]);
}

async function setUploadDedupeMode(uploadId, mode) {
  return db.run('UPDATE upload_records SET dedupe_mode = ? WHERE id = ?', [mode, uploadId]);
}

async function getUploadById(id) {
  return db.get('SELECT * FROM upload_records WHERE id = ?', [id]);
}

async function insertUploadRow({ id, upload_id, row_number, raw_data, status, message }) {
  return db.run('INSERT INTO upload_rows(id, upload_id, row_number, raw_data, status, message) VALUES (?, ?, ?, ?, ?, ?)', [id, upload_id, row_number, raw_data, status, message]);
}

async function listUploadRows(uploadId) {
  return db.all('SELECT * FROM upload_rows WHERE upload_id = ? ORDER BY row_number', [uploadId]);
}

async function getItemBySku(sku) {
  return db.get('SELECT * FROM items WHERE sku = ?', [sku]);
}

async function getUserByEmail(email) {
  return db.get('SELECT * FROM users WHERE email = ?', [email]);
}

async function getUserById(id) {
  return db.get('SELECT * FROM users WHERE id = ?', [id]);
}

async function createUser({ id, email, password_hash, name }) {
  return db.run('INSERT INTO users(id, email, password_hash, role, name) VALUES (?, ?, ?, ?, ?)', [id, email, password_hash, 'annotator', name]);
}

async function setUserRole(userId, role) {
  return db.run('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
}

async function savePasswordResetToken({ user_id, token, expires }) {
  return db.run('INSERT INTO password_resets(token, user_id, expires) VALUES (?, ?, ?)', [token, user_id, expires]);
}

async function getPasswordReset(token) {
  return db.get('SELECT * FROM password_resets WHERE token = ?', [token]);
}

async function deletePasswordReset(token) {
  return db.run('DELETE FROM password_resets WHERE token = ?', [token]);
}

async function updateUserPassword(userId, password_hash) {
  return db.run('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash, userId]);
}

async function listCategories() {
  return db.all('SELECT * FROM categories ORDER BY name');
}

async function listItems() {
  return db.all(`SELECT items.*, categories.name as category_name, 
    COALESCE(users.name, users.email) as updated_by_name
    FROM items
    LEFT JOIN categories ON items.category_id = categories.id
    LEFT JOIN users ON items.updated_by = users.id
    ORDER BY items.name
  `);
}

async function countItems({ search, categoryId } = {}) {
  let where = [];
  let params = [];
  if (search) {
    where.push('(items.sku LIKE ? OR items.name LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  if (categoryId) {
    if (categoryId === '__uncategorized__') {
      where.push('items.category_id IS NULL');
    } else {
      where.push('items.category_id = ?');
      params.push(categoryId);
    }
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const row = await db.get(`SELECT COUNT(*) as c FROM items ${whereSql}`, params);
  return row.c;
}

async function listItemsPaged({ page = 1, pageSize = 20, search, categoryId } = {}) {
  const offset = (page - 1) * pageSize;
  let where = [];
  let params = [];
  if (search) {
    where.push('(items.sku LIKE ? OR items.name LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  if (categoryId) {
    if (categoryId === '__uncategorized__') {
      where.push('items.category_id IS NULL');
    } else {
      where.push('items.category_id = ?');
      params.push(categoryId);
    }
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const rows = await db.all(`SELECT items.*, categories.name as category_name, 
    COALESCE(users.name, users.email) as updated_by_name
    FROM items
    LEFT JOIN categories ON items.category_id = categories.id
    LEFT JOIN users ON items.updated_by = users.id
    ${whereSql}
    ORDER BY items.name
    LIMIT ? OFFSET ?`, [...params, pageSize, offset]);
  return rows;
}

async function updateItemCategory(itemId, categoryId, updatedBy) {
  const now = Date.now();
  return db.run('UPDATE items SET category_id = ?, updated_by = ?, updated_at = ? WHERE id = ?', [categoryId || null, updatedBy, now, itemId]);
}

async function runInsertItem({ id, sku, name, primary_detail, category_id, updated_by }) {
  const now = Date.now();
  return db.run('INSERT INTO items(id, sku, name, primary_detail, category_id, updated_by, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)', [id, sku, name, primary_detail, category_id || null, updated_by || null, now]);
}

async function getItemById(id) {
  return db.get('SELECT * FROM items WHERE id = ?', [id]);
}

async function updateItem(id, { sku, name, primary_detail, category_id, updated_by }) {
  const now = Date.now();
  return db.run('UPDATE items SET sku = ?, name = ?, primary_detail = ?, category_id = ?, updated_by = ?, updated_at = ? WHERE id = ?', [sku, name, primary_detail, category_id || null, updated_by || null, now, id]);
}

module.exports = {
  init,
  getUserByEmail,
  getUserById,
  getAllUsers: async function() { return db.all('SELECT id,email,role FROM users ORDER BY email'); },
  createUser,
  setUserRole,
  savePasswordResetToken,
  getPasswordReset,
  deletePasswordReset,
  updateUserPassword,
  listCategories,
  listItems,
  listItemsPaged,
  countItems,
  updateItemCategory,
  runInsertItem,
  getItemById,
  updateItem,
  insertUploadRecord,
  listUploadRecords,
  setUploadFilePath,
  updateUploadStatus,
  setUploadItemsCreated,
  setUploadDedupeMode,
  getUploadById,
  insertUploadRow,
  listUploadRows,
  getItemBySku,
};
