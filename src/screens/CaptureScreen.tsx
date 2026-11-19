import { useScaledStyles } from '../ui/useScaledStyles';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions, type CameraView as CameraViewType } from 'expo-camera';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useRef, useState } from 'react';
import { type DocumentRow } from '../data/database';
import { Image, Linking, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Alert } from '../ui/AppAlert';
import { NativePage, PrimaryButton, SecondaryButton, SectionHeader, EmptyState } from '../ui/NativeScreens';
import { VoiceAssistant } from '../ui/VoiceAssistant';
import { colors } from '../ui/theme';
import { preserveDocumentPhoto, discardDocumentPhoto, documentPhotoUri } from '../services/DocumentPhoto';
import { saveLocalDocument } from '../data/documentSave';
import { DocumentViewer } from '../ui/DocumentViewer';
import { useAccessibility } from '../accessibility/AccessibilityContext';

type Mode = 'scan' | 'dictate' | 'manual';
const kinds = ['Receta', 'Medicamento', 'Cita', 'Resultado', 'Trámite', 'Otro'];

export function CaptureScreen() {
  const s = useScaledStyles(baseStyles);
  const db = useSQLiteContext();
  const { textScale } = useAccessibility();
  const { mode: initialMode } = useLocalSearchParams<{ mode?: Mode }>();
  const [focused, setFocused] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  useFocusEffect(useCallback(() => {
    setFocused(true);
    return () => { setFocused(false); setCameraReady(false); };
  }, []));
  const camera = useRef<CameraViewType>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<Mode>(initialMode ?? (Platform.OS === 'web' ? 'manual' : 'scan'));
  const [kind, setKind] = useState('Receta');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [review, setReview] = useState(false);
  const [savedDocuments, setSavedDocuments] = useState<DocumentRow[]>([]);
  const [openedDocument, setOpenedDocument] = useState<DocumentRow | null>(null);
  const saving = useRef(false);
  const loadDocuments = useCallback(async () => setSavedDocuments(await db.getAllAsync<DocumentRow>('SELECT * FROM local_documents ORDER BY id DESC LIMIT 10')), [db]);
  useFocusEffect(useCallback(() => { void loadDocuments().catch(() => setError('No se pudieron cargar los documentos guardados. Vuelve a abrir esta pantalla.')); return () => setOpenedDocument(null); }, [loadDocuments]));

  const scan = async () => {
    if (!camera.current || !cameraReady) return;
    setWorking(true); setError(''); setImageUri('');
    try {
      const photo = await camera.current.takePictureAsync({ quality: 0.85, exif: false });
      if (!photo?.uri) throw new Error('No se obtuvo la imagen.');
      setImageUri(photo.uri);
      setTitle(kind === 'Receta' ? 'Receta escaneada' : `${kind} escaneado`);
      setText('');
      try {
      const { recognizeText } = await import('expo-ocr-kit');
      const result = await recognizeText(photo.uri);
      setText(result.text);
      setTitle(kind === 'Receta' ? 'Receta escaneada' : `${kind} escaneado`);
      setReview(true);
      if (!result.text.trim()) setError('No se detectó texto legible. Puedes volver a fotografiar o escribirlo manualmente.');
      } catch { setError('La fotografía está lista. No se pudo leer el texto automáticamente; puedes guardar la imagen o escribir el texto.'); }
      finally { setReview(true); }
    } catch (e) {
      const message = e instanceof Error ? e.message : '';
      setError(message || 'No se pudo procesar la imagen. Verifica la iluminación y vuelve a intentarlo.');
    } finally { setWorking(false); }
  };

  const beginReview = () => {
    if (!title.trim() || (!text.trim() && !(mode === 'scan' && imageUri))) { setError('Completa el título y añade texto o una fotografía antes de revisar.'); return; }
    setReview(true); setError('');
  };

  const save = () => Alert.alert('Revisar antes de guardar', (mode === 'scan' && imageUri ? 'Se guardará la fotografía original y el texto que hayas revisado. ' : 'Se guardará exactamente el texto que ves aquí. ') + 'CuidadoCerca no verifica ni interpreta dosis, fechas u horarios.', [
    { text: 'Seguir editando', style: 'cancel' },
    { text: 'Guardar en este teléfono', onPress: async () => {
      if (saving.current) return;
      saving.current = true;
      let stored = false;
      try {
      await saveLocalDocument(db, { title, kind, text, source: mode === 'scan' ? 'ocr' : mode, photoUri: mode === 'scan' ? imageUri : null }, { preserve: preserveDocumentPhoto, discard: discardDocumentPhoto });
      stored = true;
      await loadDocuments();
      setReview(false); setImageUri(''); setText(''); setTitle(''); setError('');
      Alert.alert('Guardado localmente', 'Este documento permanece en este teléfono. No se ha compartido ni enviado.');
      } catch {
        Alert.alert(stored ? 'Documento guardado' : 'No se pudo guardar', stored ? 'El registro se guardó, pero no se pudo actualizar la lista. Vuelve a abrir esta pantalla.' : 'Conservamos el formulario. Revisa el almacenamiento disponible y vuelve a intentarlo.');
      } finally { saving.current = false; }
    } },
  ]);

  return <NativePage title="Captura inteligente" intro="Fotografía, dicta o escribe una indicación. Revisa el contenido antes de guardarlo.">
    <View style={s.modeRow} accessibilityRole="tablist">
      {([['scan', 'Escanear'], ['dictate', 'Dictar'], ['manual', 'Escribir']] as const).map(([value, label]) => <Pressable key={value} accessibilityRole="tab" accessibilityState={{ selected: mode === value }} onPress={() => { setMode(value); setCameraReady(false); setReview(false); setError(''); }} style={[s.mode, mode === value && s.modeSelected]}><Text style={[s.modeText, mode === value && s.modeTextSelected]}>{label}</Text></Pressable>)}
    </View>

    {!review && mode === 'scan' && Platform.OS === 'web' && (
      <EmptyState title="Escaneo disponible en Android" body="Puedes probar el guardado de documentos escribiendo el texto o usando el dictado si tu navegador lo admite." action="Escribir texto" onAction={() => setMode('manual')} />
    )}
    {!review && mode === 'scan' && Platform.OS !== 'web' && focused && <>
      <SectionHeader title="Escanea un documento" />
      <Text style={s.helper}>Recetas, envases, citas, resultados o trámites. El reconocimiento ocurre en el dispositivo.</Text>
      {!permission ? <EmptyState title="Comprobando cámara" body="Espera un momento y vuelve a intentarlo." /> : !permission.granted ? <AccessibleCameraPermission canAskAgain={permission.canAskAgain} request={() => void requestPermission().catch(() => setError('No se pudo solicitar permiso para la cámara.'))} /> : <>
        <View style={s.cameraFrame}><CameraView ref={camera} style={StyleSheet.absoluteFill} facing="back" onCameraReady={() => setCameraReady(true)} onMountError={() => { setCameraReady(false); setError('No se pudo iniciar la cámara. Cierra otras aplicaciones que la usen e inténtalo de nuevo.'); }} /></View>
        <PrimaryButton label={working ? 'Leyendo texto…' : 'Tomar foto y leer texto'} disabled={working || !cameraReady} onPress={() => void scan()} />
      </>}
    </>}

    {!review && mode === 'dictate' && <>
      <SectionHeader title="Dicta la información" />
      <Text style={s.helper}>Tu voz se convierte en texto para que puedas corregirlo. No se guarda hasta que confirmes.</Text>
      <VoiceAssistant label="Empezar dictado" onTranscript={value => setText(current => current ? `${current} ${value}` : value)} />
      <TextInput accessibilityLabel="Texto dictado, editable" value={text} onChangeText={setText} placeholder="La transcripción aparecerá aquí para revisarla" multiline style={[s.input, s.multiline]} />
      <DocumentDetails kind={kind} setKind={setKind} title={title} setTitle={setTitle} />
      <PrimaryButton label="Revisar transcripción" onPress={beginReview} />
    </>}

    {!review && mode === 'manual' && <>
      <SectionHeader title="Escribe la información" />
      <DocumentDetails kind={kind} setKind={setKind} title={title} setTitle={setTitle} />
      <TextInput accessibilityLabel="Texto del documento o indicación" value={text} onChangeText={setText} placeholder="Escribe exactamente lo que quieres guardar" multiline style={[s.input, s.multiline]} />
      <PrimaryButton label="Revisar información" onPress={beginReview} />
    </>}

    {review && <>
      <SectionHeader title="Revisa y corrige" />
      <Text style={s.helper}>Nada se guardará hasta que confirmes. Verifica especialmente nombres, dosis, fechas y horarios contra el documento original.</Text>
      {!!imageUri && <Image accessibilityLabel="Foto del documento escaneado" source={{ uri: imageUri }} resizeMode="contain" style={s.previewImage} />}
      <DocumentDetails kind={kind} setKind={setKind} title={title} setTitle={setTitle} />
      <Text style={s.fieldLabel}>Texto reconocido o dictado</Text>
      <TextInput accessibilityLabel="Texto reconocido, editable" value={text} onChangeText={setText} multiline style={[s.input, s.multiline, s.reviewText]} />
      {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
      <PrimaryButton label={working ? 'Leyendo texto…' : 'Confirmar y guardar localmente'} disabled={working} onPress={save} />
      <SecondaryButton label="Volver a editar sin guardar" onPress={() => setReview(false)} />
    </>}
    {!!error && !review && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    <SectionHeader title="Documentos guardados en este teléfono" />
    {savedDocuments.length ? savedDocuments.map(document => <Pressable accessibilityRole="button" accessibilityLabel={`Abrir documento: ${document.title}`} key={document.id} onPress={() => setOpenedDocument(document)} style={s.savedDocument}><Text style={[s.savedTitle, { fontSize: 17 * textScale }]}>{document.title}</Text><Text style={s.helper}>{document.kind} · {document.source === 'ocr' ? 'Escaneado' : document.source === 'dictate' ? 'Dictado' : 'Escrito'}</Text>{!!document.image_uri && <Image accessibilityLabel={`Fotografía original de ${document.title}`} source={{ uri: documentPhotoUri(document.image_uri) }} resizeMode="contain" style={s.previewImage} />}<Text numberOfLines={4} style={s.savedText}>{document.recognized_text}</Text><Text style={{ fontFamily: 'Poppins_700Bold', color: '#167B70', fontSize: 15 * textScale }}>Abrir documento y ampliar</Text></Pressable>) : <Text style={s.helper}>Todavía no has guardado documentos.</Text>}
    {openedDocument && <DocumentViewer key={openedDocument.id} document={{ key: String(openedDocument.id), title: openedDocument.title, category: openedDocument.kind, at: openedDocument.created_at, body: openedDocument.recognized_text, imageUri: openedDocument.image_uri }} returnLabel="Volver a captura" onClose={() => setOpenedDocument(null)} />}
    <SecondaryButton label="Volver" onPress={() => router.back()} />
    <Text style={s.privacy}>El OCR puede equivocarse. El texto no es consejo médico ni reemplaza la prescripción original.</Text>
  </NativePage>;
}

function AccessibleCameraPermission({ canAskAgain, request }: { canAskAgain: boolean; request: () => void }) {
  return <EmptyState title="Permite usar la cámara" body="CuidadoCerca solo accede a la cámara cuando eliges escanear un documento."
    action={canAskAgain ? 'Dar permiso a la cámara' : 'Abrir ajustes de Android'}
    onAction={canAskAgain ? request : () => void Linking.openSettings().catch(() => Alert.alert('Abre los ajustes de Android para conceder el permiso'))} />;
}
function DocumentDetails({ kind, setKind, title, setTitle }: { kind: string; setKind: (value: string) => void; title: string; setTitle: (value: string) => void }) {
  const s = useScaledStyles(baseStyles);
  return <>
    <Text style={s.fieldLabel}>Tipo de documento</Text>
    <View style={s.kindRow}>{kinds.map(item => <Pressable key={item} accessibilityRole="radio" accessibilityState={{ selected: kind === item }} onPress={() => setKind(item)} style={[s.kindChip, kind === item && s.kindChipSelected]}><Text style={[s.kindText, kind === item && s.kindTextSelected]}>{item}</Text></Pressable>)}</View>
    <Text style={s.fieldLabel}>Título</Text>
    <TextInput accessibilityLabel="Título del documento" value={title} onChangeText={setTitle} placeholder="Ej. Receta de junio" style={s.input} />
  </>;
}

const baseStyles = StyleSheet.create({ modeRow: { flexDirection: 'row', gap: 7, padding: 4, borderRadius: 14, backgroundColor: colors.surfaceAlt }, mode: { flex: 1, minHeight: 48, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center', borderRadius: 11 }, modeSelected: { backgroundColor: colors.primary }, modeText: { color: colors.primary, fontFamily: 'Poppins_600SemiBold', fontSize: 15 }, modeTextSelected: { color: colors.white }, helper: { color: colors.muted, fontSize: 16, lineHeight: 23, fontFamily: 'Poppins_400Regular' }, cameraFrame: { height: 275, overflow: 'hidden', borderRadius: 18, backgroundColor: '#292421' }, input: { minHeight: 52, paddingHorizontal: 13, borderWidth: 1, borderColor: '#8A746B', borderRadius: 12, backgroundColor: colors.white, color: colors.ink, fontSize: 16, fontFamily: 'Poppins_400Regular' }, multiline: { minHeight: 150, textAlignVertical: 'top', paddingTop: 13 }, reviewText: { minHeight: 220 }, fieldLabel: { color: colors.ink, fontSize: 16, fontWeight: '700', fontFamily: 'Poppins_600SemiBold' }, kindRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, kindChip: { minHeight: 43, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white }, kindChipSelected: { borderColor: colors.primary, backgroundColor: '#FFF2EC' }, kindText: { color: colors.ink, fontSize: 14, fontFamily: 'Poppins_600SemiBold' }, kindTextSelected: { color: colors.primary }, previewImage: { width: '100%', height: 190, borderRadius: 16, backgroundColor: colors.surfaceAlt }, error: { color: '#8B2118', fontSize: 15, lineHeight: 21 }, savedDocument: { padding: 14, gap: 5, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white }, savedTitle: { color: colors.ink, fontSize: 17, fontFamily: 'Poppins_700Bold' }, savedText: { color: colors.ink, fontSize: 15, lineHeight: 22 }, privacy: { color: colors.muted, fontSize: 13, lineHeight: 18, fontFamily: 'Poppins_400Regular' } });


