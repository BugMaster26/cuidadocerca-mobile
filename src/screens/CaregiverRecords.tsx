import { useScaledStyles } from '../ui/useScaledStyles';
import { Image, StyleSheet, Text, View, Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useRef, useState } from 'react';
import { loadCaregiverRecords, type RecordsPage, type Scope, type SharedCard, type SharedRecords } from '../data/caregiverRecords';
import { DesignIcon } from '../ui/DesignIcon';
import { SosFooterWaves } from '../ui/CareVisuals';
import { FamilySectionHeading } from '../ui/FamilySectionHeading';
import { DocumentViewer } from '../ui/DocumentViewer';
import { SoftAppear } from '../ui/SoftAppear';
import { documentPhotoUri } from '../services/DocumentPhoto';
import { useAccessibility } from '../accessibility/AccessibilityContext';
import { Alert } from '../ui/AppAlert';
import { EmptyState, NativePage, SecondaryButton, SectionHeader } from '../ui/NativeScreens';

const titles = { activities: 'Actividades compartidas', documents: 'Documentos autorizados', medicines: 'Medicamentos', summary: 'Resumen de cuidado' };
const labels = { actividades: 'Actividades', citas: 'Citas médicas', medicamentos: 'Medicamentos', documentos: 'Documentos' };
const icons = { actividades: 'calendar', citas: 'calendar', medicamentos: 'pill', documentos: 'file' } as const;
const activityIcons: Record<string, 'pill' | 'calendar' | 'exam' | 'file' | 'person'> = { Medicamento: 'pill', Cita: 'calendar', Examen: 'exam', Trámite: 'file', 'Actividad personal': 'person' };
function dateParts(at?: string | null) {
  if (!at) return null;
  const date = at.slice(0, 10);
  return { date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date.split('-').reverse().join('/') : at, time: at.length >= 16 ? at.slice(11, 16) : '' };
}
export function CaregiverRecords({ page }: { page: RecordsPage }) {
  const s = useScaledStyles(baseStyles);
  const db = useSQLiteContext();
  const { textScale, highContrast } = useAccessibility();
  const [records, setRecords] = useState<SharedRecords | null>(null);
  const [error, setError] = useState(false);
  const [document, setDocument] = useState<SharedCard | null>(null);
  const focusVersion = useRef(0);
  useFocusEffect(useCallback(() => {
    const version = ++focusVersion.current;
    setRecords(null); setError(false); setDocument(null);
    void loadCaregiverRecords(db, page).then(data => { if (version === focusVersion.current) setRecords(data); }).catch(() => { if (version === focusVersion.current) setError(true); });
    return () => { ++focusVersion.current; setDocument(null); };
  }, [db, page]));
  async function openDocument(card: SharedCard) {
    const version = focusVersion.current;
    try {
      const current = await loadCaregiverRecords(db, 'documents');
      if (version !== focusVersion.current) return;
      setRecords(current);
      const authorized = current.documentos?.find(item => item.key === card.key);
      if (authorized) setDocument(authorized);
      else Alert.alert('Documento no disponible', 'La autorización puede haber cambiado. Solo puedes consultar documentos compartidos en este dispositivo.');
    } catch { Alert.alert('No se pudo abrir el documento', 'Vuelve a intentarlo.'); }
  }
  const scopes: Scope[] = page === 'activities' ? ['actividades', 'citas'] : page === 'documents' ? ['documentos'] : page === 'medicines' ? ['medicamentos'] : ['actividades', 'citas', 'medicamentos'];
  return <NativePage compactHeader showSos={false} title={titles[page]} intro="">
    <FamilySectionHeading title={titles[page]} description="Consulta los registros que la persona mayor habilitó desde su perfil en este dispositivo." icon={page === 'documents' ? 'file' : page === 'medicines' ? 'pill' : page === 'summary' ? 'chart' : 'calendar'} />
    {(page === 'activities' || page === 'documents') && <View style={s.authorization}><View style={s.icon}><DesignIcon name={page === 'documents' ? 'shieldCheck' : 'users'} size={32} /></View><View style={{ flex: 1, gap: 5 }}><Text style={[s.bold, { fontSize: 18 * textScale }]}>{page === 'documents' ? 'Documentos autorizados' : 'Actividades autorizadas'}</Text><Text style={[s.copy, { fontSize: 15 * textScale }]}>{page === 'documents' ? 'Solo ves los documentos que la persona mayor decidió compartir.' : 'Solo ves la información que la persona mayor decidió compartir.'}</Text></View></View>}
    {error ? <EmptyState title="No se pudieron cargar los registros" body="Vuelve a abrir esta pantalla." /> : records === null ? <SectionHeader title="Cargando registros…" /> : scopes.map(scope => {
      const cards = records[scope];
      return <View key={scope} style={{ gap: 14 }}><SectionHeader title={labels[scope]} />
        {cards === undefined ? <View style={s.empty}><DesignIcon name="shield" size={36} /><Text style={[s.bold, { fontSize: 20 * textScale }]}>Consulta sin autorización</Text><Text style={s.copy}>La persona mayor puede habilitarla desde su perfil.</Text></View>
        : cards.length === 0 ? <View style={s.empty}><DesignIcon name={icons[scope]} size={36} /><Text style={[s.bold, { fontSize: 20 * textScale }]}>{scope === 'documentos' ? 'Sin documentos compartidos' : 'Sin registros guardados'}</Text><Text style={s.copy}>{scope === 'documentos' ? 'Los documentos aparecerán aquí cuando la persona mayor los registre y autorice su consulta.' : 'Los registros aparecerán aquí cuando se agreguen.'}</Text></View>
        : cards.map(card => {
          const when = dateParts(card.at);
          const content = <>
            <View style={s.cardHeader}><View style={s.icon}><DesignIcon name={activityIcons[card.category ?? ''] ?? icons[scope]} size={31} /></View><View style={{ flex: 1, gap: 5 }}><Text style={[s.bold, { fontSize: 18 * textScale }]}>{card.title}</Text>{scope === 'documentos' && <Text style={s.copy}>{card.category}</Text>}</View>{card.state && <Text style={[s.badge, card.state === 'Completada' && { backgroundColor: '#D5F4E8' }]}>{card.state}</Text>}{scope === 'documentos' && <DesignIcon name="arrowRight" size={22} />}</View>
            {scope === 'documentos' && <Text style={s.authorized}>Documento autorizado</Text>}
            {when && <><View style={s.row}><DesignIcon name="calendar" size={21} /><Text style={[s.copy, { fontSize: 16 * textScale }]}>{when.date}</Text></View>{scope !== 'documentos' && !!when.time && <View style={s.row}><DesignIcon name="clock" size={21} /><Text style={[s.copy, { fontSize: 16 * textScale }]}>{when.time}</Text></View>}</>}
            {!!card.body && <Text numberOfLines={scope === 'documentos' ? 3 : undefined} style={[s.copy, { fontSize: 16 * textScale, lineHeight: 25 * textScale }]}>{card.body}</Text>}
            {scope === 'documentos' && (card.imageUri ? <DocumentThumbnail uri={documentPhotoUri(card.imageUri)} title={card.title} /> : <Text style={s.note}>Este registro conserva texto, sin fotografía original.</Text>)}
          </>;
          const style = [s.card, highContrast && { borderColor: '#000000', borderWidth: 2 }];
          return <SoftAppear key={card.key}>{scope === 'documentos' ? <Pressable accessibilityRole="button" accessibilityLabel={`Abrir documento autorizado: ${card.title}`} onPress={() => void openDocument(card)} style={({ pressed }) => [...style, pressed && { opacity: 0.75 }]}>{content}</Pressable> : <View style={style}>{content}</View>}</SoftAppear>;
        })}
      </View>;
    })}
    {page === 'summary' && <><SecondaryButton label="Gestionar solicitudes y acompañamiento" onPress={() => router.push('/(caregiver)/requests')} /><SecondaryButton label="Consultar documentos autorizados" onPress={() => router.push('/(caregiver)/documents')} /></>}
    <View style={{ marginTop: 'auto', marginHorizontal: -20, marginBottom: -28, paddingTop: 24 }}><SosFooterWaves /></View>
    {document && <DocumentViewer key={document.key} document={document} onClose={() => setDocument(null)} />}
  </NativePage>;
}
function DocumentThumbnail({ uri, title }: { uri: string; title: string }) {
  const s = useScaledStyles(baseStyles);
  const [failed, setFailed] = useState(false);
  return failed ? <Text style={s.note}>Fotografía no disponible en este dispositivo. Abre el registro para consultar el texto.</Text> : <Image source={{ uri }} accessibilityLabel={`Fotografía original de ${title}`} resizeMode="contain" style={s.thumbnail} onError={() => setFailed(true)} />;
}
const baseStyles = StyleSheet.create({
  authorization: { padding: 15, borderRadius: 21, backgroundColor: '#E6F4F1', flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 51, height: 56, borderRadius: 16, backgroundColor: '#D5F4E8', alignItems: 'center', justifyContent: 'center' },
  bold: { color: '#253238', fontFamily: 'Poppins_700Bold' }, copy: { color: '#52636B', fontFamily: 'Poppins_400Regular', fontSize: 16, lineHeight: 25 },
  card: { padding: 15, borderRadius: 20, borderWidth: 1, borderColor: '#DCE7E4', backgroundColor: '#FFFFFF', gap: 9 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 12, backgroundColor: '#FFF4D6', color: '#66510C', fontFamily: 'Poppins_700Bold', fontSize: 12 },
  row: { flexDirection: 'row', gap: 11, alignItems: 'center' }, empty: { padding: 22, borderRadius: 20, backgroundColor: '#E6F4F1', gap: 12 },
  thumbnail: { height: 220, width: '100%', backgroundColor: '#F7F9F8', borderRadius: 14 },
  authorized: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: '#126B62' }, note: { fontFamily: 'Poppins_400Regular', fontSize: 14, lineHeight: 22, color: '#52636B' },
});

