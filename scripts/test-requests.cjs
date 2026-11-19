const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const { migrateDatabase } = require('../src/data/database.ts');
const { localRequests } = require('../src/data/requestsRepository.ts');

async function main() {
  const sqlite = new DatabaseSync(':memory:');
  const db = {
    execAsync: async sql => sqlite.exec(sql),
    getAllAsync: async (sql, ...args) => sqlite.prepare(sql).all(...args),
    runAsync: async (sql, ...args) => sqlite.prepare(sql).run(...args),
  };
  sqlite.exec("CREATE TABLE care_requests (id INTEGER PRIMARY KEY, kind TEXT NOT NULL, message TEXT NOT NULL, state TEXT NOT NULL); INSERT INTO care_requests VALUES (1,'Compañía','','draft')");
  await migrateDatabase(db);
  await migrateDatabase(db);
  const requests = localRequests(db);
  assert.equal((await requests.list())[0].kind, 'Compañía');
  await requests.create('Cita', 'Ir juntos', '2027-01-01T16:00:00.000Z');
  let [latest] = await requests.list();
  assert.equal(latest.scheduled_at, '2027-01-01T16:00:00.000Z');
  assert.equal(await requests.close(latest.id, 'completed'), false);
  assert.equal(await requests.respond(latest.id, 'accepted', '  Ana  '), true);
  assert.equal(await requests.respond(latest.id, 'rejected', 'Luis'), false);
  [latest] = await requests.list();
  assert.equal(latest.responder, 'Ana');
  assert.equal(await requests.close(latest.id, 'completed'), true);
  assert.equal(await requests.close(latest.id, 'cancelled'), false);
  assert.equal(await requests.respond(1, 'rejected', 'Luis'), true);
  sqlite.close();
  console.log('Migración repetible, registros previos y transiciones de solicitudes verificados.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
