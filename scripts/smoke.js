const db = require('../src/db');
const { v4: uuidv4 } = require('uuid');

(async () => {
  try {
    await db.init();
    const email = 'smoketest@example.com';
    let user = await db.getUserByEmail(email);
    if (!user) {
      const id = uuidv4();
      const bcrypt = require('bcrypt');
      const hash = await bcrypt.hash('Sm0keTest!', 10);
      await db.createUser({ id, email, password_hash: hash });
      user = { id, email };
      console.log('Created user', email);
    } else {
      console.log('User exists:', email);
    }

    // categorize item i1 as c1
    await db.updateItemCategory('i1', 'c1', user.id);
    console.log('Categorized item i1 as c1 by', user.email);

    // dump items
    const items = await db.listItems();
    console.log('ITEMS:\n', JSON.stringify(items, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
