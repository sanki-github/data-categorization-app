const db = require('../src/db');
const { v4: uuidv4 } = require('uuid');

beforeAll(async () => {
  await db.init();
});

test('create user and item CRUD', async () => {
  const email = `test-${Date.now()}@example.com`;
  const id = uuidv4();
  const bcrypt = require('bcrypt');
  const hash = await bcrypt.hash('testpass', 10);
  await db.createUser({ id, email, password_hash: hash });
  const user = await db.getUserByEmail(email);
  expect(user).toBeTruthy();

  const itemId = uuidv4();
  await db.runInsertItem({ id: itemId, sku: 'TST-1', name: 'Test item', primary_detail: 'pd', category_id: null, updated_by: user.id });
  const item = await db.getItemById(itemId);
  expect(item).toBeTruthy();

  await db.updateItem(itemId, { sku: 'TST-1', name: 'Test item updated', primary_detail: 'pd2', category_id: null, updated_by: user.id });
  const updated = await db.getItemById(itemId);
  expect(updated.name).toBe('Test item updated');
});

