const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const { migrateDatabase } = require('../src/data/database.ts');
const { loadCaregiverRecords } = require('../src/data/caregiverRecords.ts');
async function main() {
  const sql = new DatabaseSync(':memory:');
  const db = { execAsync: async s => sql.exec(s), getAllAsync: async (s,...a) => sql.prepare(s).all(...a) };
  sql.exec("CREATE TABLE local_documents (id INTEGER PRIMARY KEY, title TEXT, kind TEXT, recognized_text TEXT, source TEXT, created_at TEXT); INSERT INTO local_documents VALUES (1,'Antiguo','Receta','Texto','ocr','2026-11-18')");
  await migrateDatabase(db); await migrateDatabase(db);
  assert.equal(sql.prepare('SELECT image_uri FROM local_documents WHERE id=1').get().image_uri, null);
  sql.exec("INSERT INTO local_documents (id,title,kind,recognized_text,source,created_at,image_uri) VALUES (2,'Original','Receta','OCR','ocr','2026-11-18','documents/original.jpg')");
  assert.equal((await loadCaregiverRecords(db,'documents')).documentos, undefined);
  sql.exec("INSERT INTO preferences VALUES ('share:documentos','true')");
  let rows = (await loadCaregiverRecords(db,'documents')).documentos;
  assert.equal(rows.length,2); assert.equal(rows[0].imageUri,'documents/original.jpg');
  assert.equal(rows[0].body,'OCR'); assert.equal(rows[1].imageUri,null);
  sql.exec("UPDATE preferences SET value='false' WHERE key='share:documentos'");
  assert.equal((await loadCaregiverRecords(db,'documents')).documentos, undefined);
  sql.exec("INSERT INTO activities(title,category,scheduled_at) VALUES ('Cita','Cita','2026-11-20T10:30'); INSERT INTO preferences VALUES ('share:actividades','true')");
  const records = await loadCaregiverRecords(db,'activities');
  assert.equal(records.actividades[0].category,'Cita');
  assert.equal(records.actividades[0].at,'2026-11-20T10:30');
  assert.equal(records.citas,undefined);
  sql.close(); console.log('Documentos antiguos, imágenes originales y revocación de permisos verificados.');
}
main().catch(e => { console.error(e); process.exitCode=1; });
