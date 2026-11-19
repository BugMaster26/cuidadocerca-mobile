const assert=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite');
const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
const {migrateDatabase}=require('../src/data/database.ts');
const {saveLocalDocument}=require('../src/data/documentSave.ts');
const {loadCaregiverRecords}=require('../src/data/caregiverRecords.ts');
async function main(){
 const folder=await fs.mkdtemp(path.join(os.tmpdir(),'cuidadocerca-photo-test-'));
 const dbpath=path.join(folder,'test.db');let sql=new DatabaseSync(dbpath);
 const adapter=()=>({execAsync:async s=>sql.exec(s),getAllAsync:async(s,...a)=>sql.prepare(s).all(...a),runAsync:async(s,...a)=>sql.prepare(s).run(...a)});
 const db=adapter();await migrateDatabase(db);const original=path.join(folder,'camera.jpg');await fs.writeFile(original,Buffer.from([255,216,255,217]));
 let removed=0;const photo=path.join(folder,'saved.jpg');const storage={preserve:async uri=>{await fs.copyFile(uri,photo);return photo},discard:async uri=>{removed++;await fs.unlink(uri)}};
 await saveLocalDocument(db,{title:'Foto sin OCR',kind:'Receta',text:'',source:'ocr',photoUri:original},storage);
 sql.close();sql=new DatabaseSync(dbpath);const row=sql.prepare('SELECT * FROM local_documents').get();assert.equal(row.image_uri,photo);assert.deepEqual(await fs.readFile(photo),await fs.readFile(original));
 assert.equal((await loadCaregiverRecords(adapter(),'documents')).documentos,undefined);
 sql.exec("INSERT INTO preferences VALUES ('share:documentos','true')");assert.equal((await loadCaregiverRecords(adapter(),'documents')).documentos[0].imageUri,photo);
 await assert.rejects(()=>saveLocalDocument({runAsync:async()=>{throw Error('disk')}},{title:'Error',kind:'Receta',text:'',source:'ocr',photoUri:original},storage));assert.equal(removed,1);
 await assert.rejects(()=>saveLocalDocument(adapter(),{title:'',kind:'Receta',text:'',source:'manual'},storage));
 sql.close();console.log('Foto sin OCR, reapertura de SQLite, permiso familiar y limpieza al fallar verificados.');
}
main().catch(e=>{console.error(e);process.exitCode=1});
