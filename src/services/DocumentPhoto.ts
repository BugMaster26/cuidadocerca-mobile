import { Directory, File, Paths } from 'expo-file-system';

export async function preserveDocumentPhoto(uri: string): Promise<string> {
  const directory = new Directory(Paths.document, 'documents');
  directory.create({ idempotent: true, intermediates: true });
  const name = `scan-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const destination = new File(directory, name);
  await new File(uri).copy(destination);
  return `documents/${name}`;
}
export function documentPhotoUri(path: string): string {
  return path.startsWith('documents/') ? new File(Paths.document, path).uri : path;
}
export function discardDocumentPhoto(path: string) {
  const file = new File(documentPhotoUri(path));
  if (file.exists) file.delete();
}
