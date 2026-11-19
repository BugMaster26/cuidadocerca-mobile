import type { SQLiteDatabase } from 'expo-sqlite';
type Input = { title: string; kind: string; text: string; source: string; photoUri?: string | null };
export async function saveLocalDocument(db: Pick<SQLiteDatabase, 'runAsync'>, input: Input, photos: { preserve: (uri: string) => Promise<string>; discard: (path: string) => void | Promise<void> }) {
  if (!input.title.trim() || (!input.text.trim() && !input.photoUri)) throw new Error('Completa el título y añade una fotografía o un texto.');
  let savedPhoto: string | null = null;
  try {
    if (input.photoUri) savedPhoto = await photos.preserve(input.photoUri);
    return await db.runAsync('INSERT INTO local_documents (title,kind,recognized_text,source,image_uri) VALUES (?,?,?,?,?)', input.title.trim(), input.kind, input.text.trim(), input.source, savedPhoto);
  } catch (error) {
    if (savedPhoto) { try { await photos.discard(savedPhoto); } catch {} }
    throw error;
  }
}
