import type { SQLiteDatabase } from 'expo-sqlite';

export type LocalRequest = {
  id: number;
  kind: string;
  message: string;
  state: string;
  scheduled_at: string | null;
  responder: string | null;
};

export interface RequestsRepository {
  list(): Promise<LocalRequest[]>;
  create(kind: string, message: string, scheduledAt: string | null): Promise<void>;
  respond(id: number, state: 'accepted' | 'rejected', responder: string): Promise<boolean>;
  close(id: number, state: 'completed' | 'cancelled'): Promise<boolean>;
}

export function localRequests(db: SQLiteDatabase): RequestsRepository {
  return {
    list: () => db.getAllAsync<LocalRequest>(
      'SELECT id,kind,message,state,scheduled_at,responder FROM care_requests ORDER BY id DESC',
    ),
    async create(kind, message, scheduledAt) {
      await db.runAsync(
        "INSERT INTO care_requests (kind,message,scheduled_at,state) VALUES (?,?,?,'draft')",
        kind, message, scheduledAt,
      );
    },
    async respond(id, state, responder) {
      if (!responder.trim()) return false;
      const result = await db.runAsync(
        "UPDATE care_requests SET state=?,responder=? WHERE id=? AND state='draft'",
        state, responder.trim(), id,
      );
      return result.changes === 1;
    },
    async close(id, state) {
      const result = await db.runAsync(
        "UPDATE care_requests SET state=? WHERE id=? AND (state='accepted' OR (state='draft' AND ?='cancelled'))",
        state, id, state,
      );
      return result.changes === 1;
    },
  };
}
