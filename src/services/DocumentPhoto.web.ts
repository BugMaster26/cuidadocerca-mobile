export async function preserveDocumentPhoto(uri: string): Promise<string> {
  if (!uri.startsWith('data:image/')) throw new Error('El escaneo de fotografías está disponible en Android.');
  return uri;
}
export function documentPhotoUri(path: string) { return path; }
export function discardDocumentPhoto(_path: string) {}
