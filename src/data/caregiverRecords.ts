import type { SQLiteDatabase } from 'expo-sqlite';
import type { ActivityRow, AppointmentRow, DocumentRow, MedicationRow } from './database.ts';
export type RecordsPage = 'activities' | 'documents' | 'medicines' | 'summary';
export type Scope = 'actividades' | 'citas' | 'medicamentos' | 'documentos';
export type SharedCard = { key: string; title: string; body: string; at?: string | null; state?: string; category?: string; imageUri?: string | null };
export type SharedRecords = Partial<Record<Scope, SharedCard[]>>;
export async function loadCaregiverRecords(db: Pick<SQLiteDatabase, 'getAllAsync'>, page: RecordsPage): Promise<SharedRecords> {
  const permissions = await db.getAllAsync<{ key: string }>("SELECT key FROM preferences WHERE key LIKE 'share:%' AND value='true'");
  const allowed = new Set(permissions.map(item => item.key));
  const data: SharedRecords = {};
  if (allowed.has('share:actividades') && (page === 'summary' || page === 'activities')) {
    data.actividades = (await db.getAllAsync<ActivityRow>('SELECT * FROM activities ORDER BY scheduled_at DESC')).map(row => ({ key: String(row.id), title: row.title, body: row.detail, at: row.scheduled_at, category: row.category, state: row.state === 'done' ? 'Completada' : 'Pendiente' }));
  }
  if (allowed.has('share:citas') && (page === 'summary' || page === 'activities')) {
    data.citas = (await db.getAllAsync<AppointmentRow>('SELECT * FROM appointments ORDER BY scheduled_at')).map(row => ({ key: String(row.id), title: row.specialty, body: [row.clinic, row.clinician, row.reason].filter(Boolean).join('\n'), at: row.scheduled_at, category: 'Cita', state: row.state === 'scheduled' ? 'Programada' : row.state }));
  }
  if (allowed.has('share:medicamentos') && (page === 'summary' || page === 'medicines')) {
    data.medicamentos = (await db.getAllAsync<MedicationRow>('SELECT * FROM medications ORDER BY name')).map(row => ({ key: String(row.id), title: row.name, body: `Cantidad por toma: ${row.dose}\nFrecuencia de toma: ${row.frequency}\nHorario: ${row.times}`, category: 'Medicamento' }));
  }
  if (allowed.has('share:documentos') && page === 'documents') {
    data.documentos = (await db.getAllAsync<DocumentRow>('SELECT * FROM local_documents ORDER BY id DESC')).map(row => ({ key: String(row.id), title: row.title, body: row.recognized_text, category: row.kind, at: row.created_at, imageUri: row.image_uri }));
  }
  return data;
}
