const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
(async () => {
  try {
    const db = await open({ filename: 'data.sqlite', driver: sqlite3.Database });
    const users = await db.all('SELECT id, email FROM users');
    const items = await db.all(`SELECT items.id, items.sku, items.name, items.primary_detail, items.category_id, categories.name as category_name, items.updated_by, users.email as updated_by_email, items.updated_at FROM items LEFT JOIN categories ON items.category_id = categories.id LEFT JOIN users ON items.updated_by = users.id`);
    console.log('USERS:');
    console.log(JSON.stringify(users, null, 2));
    console.log('\nITEMS:');
    console.log(JSON.stringify(items, null, 2));
    await db.close();
  } catch (err) {
    console.error('Error reading database:', err);
    process.exit(1);
  }
})();
