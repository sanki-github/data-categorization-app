const path = require('path');
const fs = require('fs');
const { parse: csvParse } = require('csv-parse');
const XLSX = require('xlsx');
const { v4: uuidv4 } = require('uuid');

module.exports = function startUploadWorker(db, intervalMs = 2000) {
  let running = false;
  async function tick() {
    if (running) return;
    running = true;
    try {
      const pending = await db.listUploadRecords();
      const queue = pending.filter(u => u.status === 'pending');
      for (const u of queue) {
        await db.updateUploadStatus(u.id, 'processing');
        const filePath = u.file_path;
        if (!filePath || !fs.existsSync(filePath)) {
          await db.updateUploadStatus(u.id, 'failed');
          continue;
        }
        let created = 0;
        try {
          // Use original filename for extension detection, not the temp file path
          const ext = path.extname(u.filename).toLowerCase();
          console.log(`Processing file: ${u.filename} (extension: ${ext})`);
          let rows = [];
          if (ext === '.xlsx' || ext === '.xls') {
            console.log('Processing as Excel file');
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
          } else {
            console.log('Processing as CSV file');
            const content = fs.readFileSync(filePath);
            rows = await new Promise((resolve, reject) => {
              csvParse(content, { columns: true, skip_empty_lines: true }, (err, out) => err ? reject(err) : resolve(out));
            });
          }

          for (let i = 0; i < rows.length; i++) {
            const record = rows[i];
            const sku = (record.sku || record.SKU || '').toString().trim();
            const name = (record.name || record.Name || '').toString().trim();
            const primary_detail = (record.primary_detail || record.Primary || '').toString().trim();
            const categoryName = (record.category || '').toString().trim();
            const raw = JSON.stringify(record);
            try {
              // dedupe modes: skip | update | duplicate
              const upload = await db.getUploadById(u.id);
              const mode = upload.dedupe_mode || 'skip';
              const existing = sku ? await db.getItemBySku(sku) : null;
              let action = 'created';
              if (existing) {
                if (mode === 'skip') {
                  await db.insertUploadRow({ id: uuidv4(), upload_id: u.id, row_number: i + 1, raw_data: raw, status: 'skipped', message: 'SKU exists, skipped' });
                  continue;
                } else if (mode === 'update') {
                  // update item
                  const categories = await db.listCategories();
                  const found = categories.find(c => c.name.toLowerCase() === (categoryName || '').toLowerCase());
                  await db.updateItem(existing.id, { sku: existing.sku, name: name || existing.name, primary_detail: primary_detail || existing.primary_detail, category_id: found ? found.id : existing.category_id, updated_by: u.user_id });
                  await db.insertUploadRow({ id: uuidv4(), upload_id: u.id, row_number: i + 1, raw_data: raw, status: 'updated', message: 'Updated existing item' });
                  created++;
                  continue;
                } else if (mode === 'duplicate') {
                  // create new duplicate
                  action = 'created-duplicate';
                }
              }

              // not existing or creating duplicate
              // ensure category exists or create it
              let categories = await db.listCategories();
              let found = categories.find(c => c.name.toLowerCase() === (categoryName || '').toLowerCase());
              if (!found && categoryName) {
                const cid = uuidv4();
                await db.run('INSERT INTO categories(id, name) VALUES (?, ?)', [cid, categoryName]);
                found = { id: cid, name: categoryName };
                // refresh categories variable if needed
              }
              const itemId = uuidv4();
              await db.runInsertItem({ id: itemId, sku, name, primary_detail, category_id: found ? found.id : null, updated_by: u.user_id });
              await db.insertUploadRow({ id: uuidv4(), upload_id: u.id, row_number: i + 1, raw_data: raw, status: 'created', message: 'Item created' });
              created++;
            } catch (rowErr) {
              await db.insertUploadRow({ id: uuidv4(), upload_id: u.id, row_number: i + 1, raw_data: raw, status: 'error', message: String(rowErr) });
            }
          }
          await db.setUploadItemsCreated(u.id, created);
          await db.updateUploadStatus(u.id, 'done');
        } catch (procErr) {
          console.error('Processing error', procErr);
          await db.updateUploadStatus(u.id, 'failed');
        } finally {
          // cleanup file
          try { fs.unlinkSync(filePath); } catch (e) {}
        }
      }
    } catch (err) {
      console.error('Upload worker error', err);
    } finally {
      running = false;
    }
  }

  const timer = setInterval(tick, intervalMs);
  return { stop: () => clearInterval(timer) };
};
