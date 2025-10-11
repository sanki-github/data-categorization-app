const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const db = require('../src/db');
const { v4: uuidv4 } = require('uuid');

(async () => {
  try {
    await db.init();
    const email = `uploadtest-${Date.now()}@example.com`;
    const id = uuidv4();
    const bcrypt = require('bcrypt');
    const hash = await bcrypt.hash('uploadpass', 10);
    await db.createUser({ id, email, password_hash: hash });

    const csvPath = path.join(__dirname, 'sample_upload.csv');
    const csv = 'sku,name,primary_detail,category\nU1,Uploaded Item 1,Detail1,Electronics\nU2,Uploaded Item 2,Detail2,Apparel\n';
    fs.writeFileSync(csvPath, csv);

  const base = 'http://127.0.0.1:3000';
    // axios cookie jar using axios-cookiejar-support could be added, but we'll do manual cookie using fetch login response header
    const loginRes = await axios.post(base + '/login', new URLSearchParams({ email, password: 'uploadpass' }).toString(), { maxRedirects: 0, headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, validateStatus: s => s === 302 || s === 200 });
    // extract cookies
    const setCookie = loginRes.headers['set-cookie'];
    const cookies = Array.isArray(setCookie) ? setCookie.map(c => c.split(';')[0]).join('; ') : (setCookie ? setCookie.split(';')[0] : '');

    const form = new FormData();
    form.append('file', fs.createReadStream(csvPath));
    const res = await axios.post(base + '/uploads', form, { headers: { ...form.getHeaders(), Cookie: cookies } });
    console.log('Upload response status:', res.status);
    fs.unlinkSync(csvPath);
    process.exit(0);
  } catch (err) {
    console.error('Upload test failed:', err.message || err);
    process.exit(1);
  }
})();

