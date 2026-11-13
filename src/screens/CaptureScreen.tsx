import { CameraView, useCameraPermissions, type CameraView as CameraViewType } from 'expo-camera';
import { recognizeText } from 'expo-ocr-kit';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useRef, useState } from 'react';
import { type DocumentRow } from '../data/database';
import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativePage, PrimaryButton, SecondaryButton, SectionHeader, EmptyState } from '../ui/NativeScreens';
import { VoiceAssistant } from '../ui/VoiceAssistant';
import { colors } from '../ui/theme';

type Mode = 'scan' | 'dictate' | 'manual';
const kinds = ['Receta', 'Medicamento', 'Cita', 'Resultado', 'Trámite', 'Otro'];

export function CaptureScreen() {
  const db = useSQLiteContext();
  const camera = useRef<CameraViewType>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<Mode>('scan');
  const [kind, setKind] = useState('Receta');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [review, setReview] = useState(false);
  const [savedDocuments, setSavedDocuments] = useState<DocumentRow[]>([]);
  const loadDocuments = useCallback(async () => setSavedDocuments(await db.getAllAsync<DocumentRow>('SELECT * FROM local_documents ORDER BY id DESC LIMIT 10')), [db]);
  useEffect(() => { void loadDocuments(); }, [loadDocuments]);

  const scan = async () => {
    if (!camera.current) return;
    setWorking(true); setError('');
    try {
      const photo = await camera.current.takePictureAsync({ quality: 0.85, exif: false });
      if (!photo?.uri) throw new Error('No se obtuvo la imagen.');
      setImageUri(photo.uri);
      const result = await recognizeText(photo.uri);
      setText(result.text);
      setTitle(kind === 'Receta' ? 'Receta escaneada' : `${kind} escaneado`);
      setReview(true);
      if (!result.text.trim()) setError('No se detectó texto legible. Puedes volver a fotografiar o escribirlo manualmente.');
    } catch (e) {
      const message = e instanceof Error ? e.message : '';
      setError(message || 'No se pudo procesar la imagen. Verifica la iluminación y vuelve a intentarlo.');
    } finally { setWorking(false); }
  };

  const beginReview = () => {
    if (!title.trim() || !text.trim()) { setError('Completa el título y el texto antes de revisar.'); return; }
    setReview(true); setError('');
  };

  const save = () => Alert.alert('Revisar antes de guardar', 'Se guardará exactamente el texto que ves aquí. CuidadoCerca no verifica ni interpreta dosis, fechas u horarios.', [
    { text: 'Seguir editando', style: 'cancel' },
    { text: 'Guardar en este teléfono', onPress: async () => {
      await db.runAsync('INSERT INTO local_documents (title,kind,recognized_text,source) VALUES (?,?,?,?)', title.trim(), kind, text.trim(), mode === 'scan' ? 'ocr' : mode);
      await loadDocuments();
      setReview(false); setImageUri(''); setText(''); setTitle(''); setError('');
      Alert.alert('Guardado localmente', 'Este documento permanece en este teléfono. No se ha compartido ni enviado.');
    } },
  ]);

  return <NativePage title="Captura inteligente" intro="Fotografía, dicta o escribe una indicación. Revisa el contenido antes de guardarlo.">
    <View style={s.modeRow} accessibilityRole="tablist">
      {([['scan', 'Escanear'], ['dictate', 'Dictar'], ['manual', 'Escribir']] as const).map(([value, label]) => <Pressable key={value} accessibilityRole="tab" accessibilityState={{ selected: mode === value }} onPress={() => { setMode(value); setReview(false); setError(''); }} style={[s.mode, mode === value && s.modeSelected]}><Text style={[s.modeText, mode === value && s.modeTextSelected]}>{label}</Text></Pressable>)}
    </View>

    {!review && mode === 'scan' && <>
      <SectionHeader title="Escanea un documento" />
      <Text style={s.helper}>Recetas, envases, citas, resultados o trámites. El reconocimiento ocurre en el dispositivo.</Text>
      {!permission ? <EmptyState title="Comprobando cámara" body="Espera un momento y vuelve a intentarlo." /> : !permission.granted ? <AccessibleCameraPermission granted={permission.granted} request={() => void requestPermission()} /> : <>
        <View style={s.cameraFrame}><CameraView ref={camera} style={StyleSheet.absoluteFill} facing="back" autofocus="on" /></View>
        <PrimaryButton label={working ? 'Leyendo texto…' : 'Tomar foto y leer texto'} disabled={working} onPress={() => void scan()} />
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
      <PrimaryButton label="Confirmar y guardar localmente" onPress={save} />
      <SecondaryButton label="Volver a editar sin guardar" onPress={() => setReview(false)} />
    </>}
    {!!error && !review && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    <SectionHeader title="Documentos guardados en este teléfono" />
    {savedDocuments.length ? savedDocuments.map(document => <View key={document.id} style={s.savedDocument}><Text style={s.savedTitle}>{document.title}</Text><Text style={s.helper}>{document.kind} · {document.source === 'ocr' ? 'Texto OCR' : document.source === 'dictate' ? 'Dictado' : 'Escrito'}</Text><Text numberOfLines={4} style={s.savedText}>{document.recognized_text}</Text></View>) : <Text style={s.helper}>Todavía no has guardado documentos.</Text>}
    <Text style={s.privacy}>El OCR puede equivocarse. El texto no es consejo médico ni reemplaza la prescripción original.</Text>
  </NativePage>;
}

function AccessibleCameraPermission({ granted, request }: { granted: boolean; request: () => void }) {
  return <EmptyState title={granted ? 'Cámara lista' : 'Permite usar la cámara'} body="CuidadoCerca solo accede a la cámara cuando eliges escanear un documento." action="Dar permiso a la cámara" onAction={request} />;
}

function DocumentDetails({ kind, setKind, title, setTitle }: { kind: string; setKind: (value: string) => void; title: string; setTitle: (value: string) => void }) {
  return <>
    <Text style={s.fieldLabel}>Tipo de documento</Text>
    <View style={s.kindRow}>{kinds.map(item => <Pressable key={item} accessibilityRole="radio" accessibilityState={{ selected: kind === item }} onPress={() => setKind(item)} style={[s.kindChip, kind === item && s.kindChipSelected]}><Text style={[s.kindText, kind === item && s.kindTextSelected]}>{item}</Text></Pressable>)}</View>
    <Text style={s.fieldLabel}>Título</Text>
    <TextInput accessibilityLabel="Título del documento" value={title} onChangeText={setTitle} placeholder="Ej. Receta de junio" style={s.input} />
  </>;
}

const s = StyleSheet.create({ modeRow: { flexDirection: 'row', gap: 7, padding: 4, borderRadius: 14, backgroundColor: colors.surfaceAlt }, mode: { flex: 1, minHeight: 48, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center', borderRadius: 11 }, modeSelected: { backgroundColor: colors.primary }, modeText: { color: colors.primary, fontFamily: 'Poppins_600SemiBold', fontSize: 15 }, modeTextSelected: { color: colors.white }, helper: { color: colors.muted, fontSize: 16, lineHeight: 23, fontFamily: 'Poppins_400Regular' }, cameraFrame: { height: 275, overflow: 'hidden', borderRadius: 18, backgroundColor: '#292421' }, input: { minHeight: 52, paddingHorizontal: 13, borderWidth: 1, borderColor: '#8A746B', borderRadius: 12, backgroundColor: colors.white, color: colors.ink, fontSize: 16, fontFamily: 'Poppins_400Regular' }, multiline: { minHeight: 150, textAlignVertical: 'top', paddingTop: 13 }, reviewText: { minHeight: 220 }, fieldLabel: { color: colors.ink, fontSize: 16, fontWeight: '700', fontFamily: 'Poppins_600SemiBold' }, kindRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, kindChip: { minHeight: 43, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white }, kindChipSelected: { borderColor: colors.primary, backgroundColor: '#FFF2EC' }, kindText: { color: colors.ink, fontSize: 14, fontFamily: 'Poppins_600SemiBold' }, kindTextSelected: { color: colors.primary }, previewImage: { width: '100%', height: 190, borderRadius: 16, backgroundColor: colors.surfaceAlt }, error: { color: '#8B2118', fontSize: 15, lineHeight: 21 }, savedDocument: { padding: 14, gap: 5, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white }, savedTitle: { color: colors.ink, fontSize: 17, fontFamily: 'Poppins_700Bold' }, savedText: { color: colors.ink, fontSize: 15, lineHeight: 22 }, privacy: { color: colors.muted, fontSize: 13, lineHeight: 18, fontFamily: 'Poppins_400Regular' } });
