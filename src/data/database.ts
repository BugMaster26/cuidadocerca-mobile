import type { SQLiteDatabase } from 'expo-sqlite';

export async function migrateDatabase(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS preferences (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, detail TEXT NOT NULL DEFAULT '',
      scheduled_at TEXT, state TEXT NOT NULL DEFAULT 'pending', category TEXT NOT NULL DEFAULT 'activity',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS medications (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, dose TEXT NOT NULL,
      frequency TEXT NOT NULL, times TEXT NOT NULL, starts_on TEXT, ends_on TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT, specialty TEXT NOT NULL, clinician TEXT NOT NULL DEFAULT '',
      clinic TEXT NOT NULL, scheduled_at TEXT NOT NULL, reason TEXT NOT NULL DEFAULT '',
      state TEXT NOT NULL DEFAULT 'scheduled', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS medication_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT, medication_id INTEGER NOT NULL, status TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '', happened_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(medication_id) REFERENCES medications(id)
    );
    CREATE TABLE IF NOT EXISTS access_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT, person_id TEXT NOT NULL, scope TEXT NOT NULL,
      granted INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(person_id, scope)
    );
    CREATE TABLE IF NOT EXISTS emergency_contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone TEXT NOT NULL,
      relationship TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS local_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, kind TEXT NOT NULL,
      recognized_text TEXT NOT NULL DEFAULT '', source TEXT NOT NULL DEFAULT 'manual',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS care_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL, message TEXT NOT NULL DEFAULT '',
      state TEXT NOT NULL DEFAULT 'draft', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS appointment_extra (
      appointment_id INTEGER PRIMARY KEY NOT NULL, address TEXT NOT NULL DEFAULT '',
      documents TEXT NOT NULL DEFAULT '', questions TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '',
      FOREIGN KEY(appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS activity_reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT, activity_id INTEGER NOT NULL,
      notification_id TEXT NOT NULL, FOREIGN KEY(activity_id) REFERENCES activities(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS medication_reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT, medication_id INTEGER NOT NULL,
      time TEXT NOT NULL, notification_id TEXT NOT NULL,
      FOREIGN KEY(medication_id) REFERENCES medications(id) ON DELETE CASCADE
    );
  `);
}

export type ActivityRow = { id: number; title: string; detail: string; scheduled_at: string | null; state: 'pending' | 'done'; category: string };
export type MedicationRow = { id: number; name: string; dose: string; frequency: string; times: string; starts_on: string | null; ends_on: string | null; last_status?: string | null; last_time?: string | null };
export type AppointmentRow = { id: number; specialty: string; clinician: string; clinic: string; scheduled_at: string; reason: string; state: string };
export type EmergencyContactRow = { id: number; name: string; phone: string; relationship: string };
export type DocumentRow = { id: number; title: string; kind: string; recognized_text: string; source: string; created_at: string };
export type CareRequestRow = { id: number; kind: string; message: string; state: 'draft' | 'sent' | 'received' | 'accepted' | 'completed'; created_at: string };
