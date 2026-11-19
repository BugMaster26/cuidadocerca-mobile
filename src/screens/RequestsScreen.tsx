import { useScaledStyles } from '../ui/useScaledStyles';
import { VoiceAssistant } from '../ui/VoiceAssistant';
import { DateTimeFields } from '../ui/ScheduleFields';
import { displayDateTime, parseDateTime } from '../ui/dateTime';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { localRequests, type LocalRequest } from '../data/requestsRepository';
import { useAccessibility } from '../accessibility/AccessibilityContext';
import { Alert } from '../ui/AppAlert';
import { EmptyState, NativePage, PrimaryButton, SecondaryButton, SectionHeader } from '../ui/NativeScreens';
import { DesignIcon } from '../ui/DesignIcon';
import { FamilySectionHeading } from '../ui/FamilySectionHeading';
import { SoftAppear } from '../ui/SoftAppear';
import { SosFooterWaves } from '../ui/CareVisuals';
import { colors } from '../ui/theme';

const kinds = ['Compañía en casa', 'Acompañamiento médico', 'Ayuda para un trámite', 'Acompañamiento para compras', 'Llamada familiar', 'Videollamada', 'Ayuda en casa', 'Ayuda con medicamentos', 'Ayuda para trasladarme', 'Orientación', 'Otro tipo de ayuda'];
const kindIcons = ['heart', 'cross', 'file', 'cart', 'phone', 'video', 'home', 'pill', 'car', 'help', 'plus'] as const;
const labels: Record<string, string> = {
  draft: 'Pendiente en este dispositivo', accepted: 'Aceptada en este dispositivo',
  rejected: 'Rechazada en este dispositivo', completed: 'Completada en este dispositivo', cancelled: 'Cancelada en este dispositivo',
  sent: 'Registro local', received: 'Registro local',
};
const badgeLabels: Record<string, string> = { draft: 'Pendiente', accepted: 'Aceptada', rejected: 'Rechazada', completed: 'Completada', cancelled: 'Cancelada' };
function requestIcon(kind: string) { return kindIcons[kinds.indexOf(kind)] ?? 'heart'; }

export function RequestsScreen({ caregiver = false, registration = false }: { caregiver?: boolean; registration?: boolean }) {
  const s = useScaledStyles(baseStyles);
  const db = useSQLiteContext();
  const params = useLocalSearchParams<{ kind?: string }>();
  const repository = useMemo(() => localRequests(db), [db]);
  const preferences = useAccessibility();
  const [items, setItems] = useState<LocalRequest[]>([]);
  const [requestFilter, setRequestFilter] = useState<'pending' | 'completed' | 'all'>('pending');
  const [kind, setKind] = useState(kinds.includes(params.kind ?? '') ? params.kind! : '');
  const [message, setMessage] = useState('');
  const [date, setDate] = useState(displayDateTime);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState(false);
  const [choosing, setChoosing] = useState(false);
  const [review, setReview] = useState(false);
  const [reviewDate, setReviewDate] = useState<string | null>(null);
  const load = useCallback(async () => {
    try { setItems(await repository.list()); setError(false); }
    catch { setError(true); }
  }, [repository]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const inputStyle = {
    minHeight: 96, padding: 12, borderWidth: 1, borderColor: colors.muted,
    backgroundColor: colors.white, color: colors.ink, borderRadius: 12,
    fontSize: 18 * preferences.textScale, fontFamily: 'Poppins_400Regular',
  };
  async function apply(action: () => Promise<boolean | void>) {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true);
    try {
      if (await action() === false) Alert.alert('La solicitud cambió', 'Revisa el estado actualizado.');
      await load();
    } catch { Alert.alert('No se pudo guardar', 'Inténtalo nuevamente.'); }
    finally { busyRef.current = false; setBusy(false); }
  }
  function create() {
    if (!kind) return Alert.alert('Elige el tipo de ayuda');
    if (kind === 'Otro tipo de ayuda' && !message.trim()) return Alert.alert('Describe qué ayuda necesitas');
    const candidate = parseDateTime(date);
    if (date.trim() && !candidate) return Alert.alert('Revisa la fecha y la hora', 'Usa DD/MM/AAAA y HH:MM.');
    setReviewDate(candidate);
    setReview(true);
  }
  function confirmSave() {
    void apply(async () => {
      await repository.create(kind, message.trim(), reviewDate ? new Date(reviewDate).toISOString() : null);
      setReview(false); setKind(''); setMessage(''); setDate(displayDateTime());
      router.back();
    });
  }
  function respond(id: number, state: 'accepted' | 'rejected') {
    const responder = name.trim();
    if (!responder) return Alert.alert('Escribe el nombre de quien responde');
    Alert.alert(state === 'accepted' ? 'Confirmar disponibilidad' : 'Rechazar solicitud',
      state === 'accepted' ? responder + ' quedará como responsable en este dispositivo.' : 'La respuesta quedará registrada en este dispositivo.',
      [{ text: 'Volver', style: 'cancel' }, { text: 'Confirmar', onPress: () => void apply(() => repository.respond(id, state, responder)) }]);
  }
  function openRegistration(selected: string) {
    setChoosing(false);
    router.push({ pathname: '/request-register', params: { kind: selected } });
  }
  const categoryRows = (inForm = false) => <View style={s.categoryList}>{kinds.map((item, index) =>
    <Pressable key={item} accessibilityRole="button" accessibilityLabel={item}
      onPress={() => { if (inForm) { setKind(item); setChoosing(false); } else openRegistration(item); }}
      style={[s.categoryRow, index === kinds.length - 1 && { backgroundColor: '#D5F4E8' }]}>
      <DesignIcon name={kindIcons[index]} color={index === 4 ? '#C62828' : '#126B62'} />
      <Text style={[s.categoryLabel, { fontSize: 17 * preferences.textScale }]}>{item}</Text>
      <Text accessible={false} style={s.chevron}>›</Text>
    </Pressable>)}</View>;

  const pendingCount = items.filter(item => ['draft', 'accepted'].includes(item.state)).length;
  const completedCount = items.filter(item => item.state === 'completed').length;
  const displayItems = !caregiver || requestFilter === 'all' ? items : items.filter(item =>
    requestFilter === 'pending' ? ['draft', 'accepted'].includes(item.state) : item.state === 'completed');
  return <NativePage compactHeader showSos={!caregiver} title={caregiver ? 'Solicitudes' : 'Mi familia y acompañamiento'}
    intro="Las solicitudes y respuestas se guardan en este dispositivo. Para contactar a alguien, usa el teléfono.">
    {caregiver ? <>
      <FamilySectionHeading title="Solicitudes" icon="users" description="Las solicitudes y respuestas se guardan en este dispositivo. Para contactar a alguien, usa el teléfono." />
      <View style={{ flexDirection: 'row', padding: 3, gap: 4, borderRadius: 15, backgroundColor: '#E6F4F1' }}>
        {([['pending', 'Pendientes (' + pendingCount + ')'], ['completed', 'Completadas (' + completedCount + ')']] as const).map(([filter, label]) =>
          <Pressable accessibilityRole="tab" accessibilityState={{ selected: requestFilter === filter }} aria-selected={requestFilter === filter} key={filter} onPress={() => setRequestFilter(filter)} style={{ flex: 1, minHeight: 54, padding: 8, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: requestFilter === filter ? '#167B70' : 'transparent' }}>
            <Text style={{ color: requestFilter === filter ? '#FFFFFF' : '#126B62', fontFamily: 'Poppins_700Bold', fontSize: 16 * preferences.textScale, textAlign: 'center' }}>{label}</Text>
          </Pressable>)}
      </View>
      <Pressable accessibilityRole="button" accessibilityState={{ selected: requestFilter === 'all' }} onPress={() => setRequestFilter('all')} style={{ minHeight: 52, borderWidth: 1, borderColor: '#DCE7E4', backgroundColor: requestFilter === 'all' ? '#D5F4E8' : '#FFFFFF', borderRadius: 13, alignItems: 'center', justifyContent: 'center', padding: 10 }}><Text style={{ color: '#126B62', fontFamily: 'Poppins_600SemiBold', fontSize: 15 }}>Historial completo</Text></Pressable>
      {displayItems.some(item => item.state === 'draft') && <View style={{ padding: 15, borderRadius: 17, borderWidth: 1, borderColor: '#DCE7E4', backgroundColor: '#FFFFFF', gap: 8 }}><Text style={s.label}>Nombre de quien responde</Text><TextInput accessibilityLabel="Nombre de quien responde" placeholder="Nombre de quien responde" placeholderTextColor={colors.muted} maxLength={100} value={name} onChangeText={setName} style={[inputStyle, { minHeight: 56 }]} /></View>}
    </>
    : registration ? <>
      <View style={s.formHeading}><Pressable accessibilityRole="button" accessibilityLabel="Volver a Mi familia" onPress={() => router.back()} style={s.back}><Text style={s.backText}>←</Text></Pressable><View style={{ flex: 1 }}><Text accessibilityRole="header" style={[s.formTitle, { fontSize: 23 * preferences.textScale }]}>Nueva solicitud de ayuda</Text><Text style={s.small}>Registra la ayuda que necesitas.</Text></View></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Cambiar tipo de ayuda" onPress={() => setChoosing(!choosing)} style={s.typeCard}>
        <DesignIcon name={requestIcon(kind)} size={32} /><View style={{ flex: 1 }}><Text style={s.label}>Tipo de ayuda</Text><Text style={[s.copy, { fontSize: 18 * preferences.textScale }]}>{kind || 'Selecciona una ayuda'}</Text></View><Text accessible={false} style={s.chevron}>›</Text>
      </Pressable>
      {choosing && categoryRows(true)}
      <DateTimeFields grouped value={date} onChange={setDate} />
      <Text style={s.label}>Detalle (opcional)</Text>
      <TextInput accessibilityLabel="Detalle opcional" placeholder="Cuéntanos qué ayuda necesitas" placeholderTextColor={colors.muted}
        value={message} onChangeText={setMessage} maxLength={500} multiline style={[inputStyle, { textAlignVertical: 'top' }]} />
      <VoiceAssistant label="Dictar qué ayuda necesitas" onTranscript={value => setMessage(value.slice(0, 500))} />
      <View style={s.notice}><DesignIcon name="help" size={21} /><Text style={[s.small, { flex: 1 }]}>La solicitud se guarda en este dispositivo. Para contactar a alguien, utiliza el teléfono.</Text></View>
      <PrimaryButton label="Revisar y guardar solicitud" disabled={busy} onPress={create} />
    </> : <>
      <View style={s.hero}><Text style={s.eyebrow}>TU ESPACIO</Text><Text accessibilityRole="header" style={[s.heroTitle, { fontSize: 24 * preferences.textScale }]}>Mi familia y acompañamiento</Text><Image source={require('../../assets/abuelitos-transparente.png')} resizeMode="contain" accessible={false} style={s.grandparents} /></View>
      <Text style={[s.copy, { fontSize: 17 * preferences.textScale }]}>Las solicitudes y respuestas se guardan en este dispositivo. Para contactar a alguien, usa el teléfono.</Text>
      {(!items.length || choosing) ? <><SectionHeader title="¿Qué ayuda necesitas?" />{categoryRows()}</> :
        <Pressable accessibilityRole="button" onPress={() => setChoosing(true)} style={s.newButton}><View style={s.plus}><DesignIcon name="plus" size={24} /></View><Text style={s.newLabel}>Nueva solicitud de ayuda</Text></Pressable>}
    </>}
    {!registration && <>
      {!caregiver && <SectionHeader title="Historial local" />}
      {error ? <EmptyState title="No se pudieron cargar las solicitudes" body="Vuelve a intentar la consulta." action="Reintentar" onAction={() => void load()} />
        : !displayItems.length && <View style={s.empty}><DesignIcon name={caregiver ? 'heart' : 'handshake'} size={43} /><Text style={s.emptyTitle}>{caregiver ? requestFilter === 'pending' ? 'No hay solicitudes pendientes' : requestFilter === 'completed' ? 'No hay solicitudes completadas' : 'Todavía no hay solicitudes' : 'Todavía no hay solicitudes'}</Text><Text style={[s.small, { textAlign: 'center' }]}>{caregiver ? 'Cuando existan solicitudes disponibles, aparecerán aquí.' : 'Las solicitudes registradas en este dispositivo aparecerán aquí.'}</Text></View>}
      {displayItems.map(item => {
        const when = item.scheduled_at ? new Date(item.scheduled_at) : null;
        const valid = when && Number.isFinite(when.getTime());
        return <SoftAppear key={caregiver ? `${requestFilter}-${item.id}` : item.id} style={s.historyCard}>
          <View style={s.cardHeading}><View style={s.kindIcon}><DesignIcon name={requestIcon(item.kind)} /></View><Text style={[s.cardTitle, { fontSize: 18 * preferences.textScale }]}>{item.kind}</Text><Text style={[s.badge, ['cancelled', 'rejected'].includes(item.state) && { backgroundColor: '#FCE8E6', color: '#A32323' }]}>{badgeLabels[item.state] ?? 'Registro local'}</Text></View>
          <Text style={s.localState}>{labels[item.state] ?? 'Estado local'}</Text>
          {!!item.responder && <Text style={s.copy}>{item.state === 'rejected' ? 'Respondió' : 'Responsable'}: {item.responder}</Text>}
          {valid && <><View style={s.dataRow}><DesignIcon name="calendar" size={21} /><Text style={s.copy}>{when.toLocaleDateString('es-PE')}</Text></View><View style={s.dataRow}><DesignIcon name="clock" size={21} /><Text style={s.copy}>{when.toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit' })}</Text></View></>}
          {!!item.message && <View style={s.dataRow}><DesignIcon name="file" size={21} /><Text style={[s.copy, { flex: 1 }]}>{item.message}</Text></View>}
          {!busy && caregiver && item.state === 'draft' && <View style={s.responseActions}>
            <Pressable accessibilityRole="button" onPress={() => respond(item.id, 'accepted')} style={({ pressed }) => [s.acceptAction, pressed && { opacity: 0.75 }]}><DesignIcon name="check" color="#FFFFFF" size={23} /><Text style={[s.actionText, { color: '#FFFFFF', fontSize: 15 * preferences.textScale }]}>Aceptar solicitud</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Rechazar solicitud" onPress={() => respond(item.id, 'rejected')} style={({ pressed }) => [s.rejectAction, pressed && { opacity: 0.75 }]}><DesignIcon name="trash" color="#C62828" size={22} /><Text style={[s.actionText, { color: '#C62828', fontSize: 15 * preferences.textScale }]}>Rechazar</Text></Pressable>
          </View>}
          {!busy && caregiver && item.state === 'accepted' && <SecondaryButton label="Completar" onPress={() => void apply(() => repository.close(item.id, 'completed'))} />}
          {!busy && !caregiver && ['draft', 'accepted'].includes(item.state) && <Pressable accessibilityRole="button" style={s.cancelRequest} onPress={() => Alert.alert('Cancelar solicitud', '¿Quieres cancelar esta solicitud?', [{ text: 'Volver', style: 'cancel' }, { text: 'Cancelar solicitud', style: 'destructive', onPress: () => void apply(() => repository.close(item.id, 'cancelled')) }])}><Text style={s.cancelText}>Cancelar solicitud</Text></Pressable>}
        </SoftAppear>;
      })}
    </>}
    <View style={{ marginHorizontal: -20, marginBottom: -28, marginTop: 'auto', paddingTop: 24 }}><SosFooterWaves /></View>
    <Modal transparent visible={review} animationType="none" onRequestClose={() => { if (!busy) setReview(false); }}>
      <View style={s.backdrop}><View accessibilityViewIsModal style={s.modal}>
        <ScrollView contentContainerStyle={{ gap: 12 }} keyboardShouldPersistTaps="handled">
          <Pressable accessibilityRole="button" accessibilityLabel="Cerrar revisión sin guardar" disabled={busy} onPress={() => setReview(false)} style={s.close}><Text style={s.closeText}>×</Text></Pressable>
          <View style={s.reviewIcon}><DesignIcon name="handshake" size={35} /></View>
          <Text accessibilityRole="header" style={[s.reviewTitle, { fontSize: 25 * preferences.textScale }]}>Guardar solicitud</Text>
          <View style={s.summary}>
            {([['Tipo de ayuda', kind], ['Fecha', date.split(' ')[0] || 'Sin fecha'], ['Hora', date.split(' ')[1] || 'Sin hora'], ['Detalle', message.trim() || 'Sin detalle']]).map(([label, value]) => <View key={label} style={s.summaryRow}>
              <DesignIcon name={label === 'Tipo de ayuda' ? requestIcon(kind) : label === 'Fecha' ? 'calendar' : label === 'Hora' ? 'clock' : 'file'} size={24} />
              <View style={{ flex: 1 }}><Text style={[s.label, { fontSize: 14 * preferences.textScale, lineHeight: 19 * preferences.textScale }]}>{label}</Text><Text style={[s.copy, { fontSize: 16 * preferences.textScale, lineHeight: 23 * preferences.textScale }]}>{value}</Text></View>
            </View>)}
          </View>
          <Text style={s.small}>Disponible en este dispositivo.</Text>
          <View style={s.reviewButtons}><Pressable accessibilityRole="button" disabled={busy} onPress={() => setReview(false)} style={s.cancel}><Text style={s.cancelLabel}>Cancelar</Text></Pressable><Pressable accessibilityRole="button" disabled={busy} onPress={confirmSave} style={s.save}><Text style={s.saveLabel}>{busy ? 'Guardando…' : 'Guardar'}</Text></Pressable></View>
        </ScrollView>
      </View></View>
    </Modal>
  </NativePage>;
}
const baseStyles = StyleSheet.create({
  responseActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  acceptAction: { flex: 1.4, minWidth: 150, minHeight: 56, borderRadius: 14, backgroundColor: '#167B70', padding: 10, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center' },
  rejectAction: { flex: 1, minWidth: 114, minHeight: 56, borderRadius: 14, borderWidth: 1, borderColor: '#C62828', backgroundColor: '#FFFFFF', padding: 10, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontFamily: 'Poppins_700Bold', textAlign: 'center', flexShrink: 1 },
  hero: { minHeight: 116, paddingTop: 6 }, eyebrow: { color: '#126B62', fontFamily: 'Poppins_700Bold', fontSize: 13 },
  heroTitle: { color: '#253238', fontFamily: 'Poppins_700Bold', lineHeight: 32, width: '76%', marginTop: 9 },
  grandparents: { position: 'absolute', right: 0, top: 15, width: '28%', height: 100 },
  copy: { fontFamily: 'Poppins_400Regular', color: '#253238', fontSize: 17, lineHeight: 26 },
  small: { fontFamily: 'Poppins_400Regular', color: '#52636B', fontSize: 14, lineHeight: 22 },
  label: { fontFamily: 'Poppins_700Bold', color: '#253238', fontSize: 16 },
  categoryList: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DCE7E4', borderRadius: 17, overflow: 'hidden' },
  categoryRow: { minHeight: 56, paddingHorizontal: 13, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#DCE7E4' },
  categoryLabel: { flex: 1, fontFamily: 'Poppins_400Regular', color: '#253238', lineHeight: 25 },
  chevron: { fontSize: 28, color: '#126B62', lineHeight: 30 },
  formHeading: { flexDirection: 'row', gap: 12, alignItems: 'center' }, formTitle: { fontFamily: 'Poppins_700Bold', color: '#253238', lineHeight: 30 },
  back: { width: 48, minHeight: 48, borderRadius: 15, backgroundColor: '#E6F4F1', alignItems: 'center', justifyContent: 'center' }, backText: { color: '#126B62', fontSize: 28 },
  typeCard: { flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: '#D5F4E8', borderRadius: 17, padding: 16 },
  notice: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  newButton: { minHeight: 56, backgroundColor: '#126B62', borderRadius: 17, padding: 12, flexDirection: 'row', gap: 10, justifyContent: 'center', alignItems: 'center' },
  plus: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 3 }, newLabel: { fontFamily: 'Poppins_700Bold', color: '#FFFFFF', fontSize: 17, flexShrink: 1 },
  empty: { padding: 24, borderRadius: 20, backgroundColor: '#E6F4F1', alignItems: 'center', gap: 12 }, emptyTitle: { fontFamily: 'Poppins_700Bold', color: '#253238', fontSize: 22, textAlign: 'center' },
  historyCard: { padding: 15, borderWidth: 1, borderColor: '#DCE7E4', backgroundColor: '#FFFFFF', borderRadius: 19, gap: 10 },
  cardHeading: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }, cardTitle: { fontFamily: 'Poppins_700Bold', color: '#253238', flex: 1 },
  kindIcon: { width: 45, height: 45, borderRadius: 14, backgroundColor: '#E6F4F1', alignItems: 'center', justifyContent: 'center' },
  badge: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 12, backgroundColor: '#FFF4D6', color: '#66510C', fontFamily: 'Poppins_700Bold', fontSize: 12 },
  localState: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#52636B' }, dataRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cancelRequest: { minHeight: 52, padding: 12, backgroundColor: '#FCE8E6', borderRadius: 13, justifyContent: 'center', alignItems: 'center' }, cancelText: { color: '#A32323', fontFamily: 'Poppins_700Bold', fontSize: 16 },
  backdrop: { flex: 1, padding: 22, backgroundColor: '#13292088', justifyContent: 'center', alignItems: 'center' },
  modal: { backgroundColor: '#FFFFFF', borderRadius: 26, padding: 20, width: '100%', maxWidth: 440, maxHeight: '94%' },
  close: { position: 'absolute', right: 0, top: 0, zIndex: 1, width: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' }, closeText: { color: '#52636B', fontSize: 27 },
  reviewIcon: { alignSelf: 'center', width: 64, height: 64, borderRadius: 32, backgroundColor: '#D5F4E8', alignItems: 'center', justifyContent: 'center' },
  reviewTitle: { fontFamily: 'Poppins_700Bold', color: '#253238', textAlign: 'center' },
  summary: { borderWidth: 1, borderColor: '#DCE7E4', borderRadius: 17, paddingHorizontal: 12 },
  summaryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#DCE7E4' },
  reviewButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 11 }, cancel: { flex: 1, minHeight: 56, borderWidth: 1.5, borderColor: '#167B70', borderRadius: 15, alignItems: 'center', justifyContent: 'center', padding: 12 },
  cancelLabel: { fontFamily: 'Poppins_700Bold', fontSize: 17, color: '#126B62' }, save: { flex: 1, minHeight: 56, backgroundColor: '#126B62', borderRadius: 15, alignItems: 'center', justifyContent: 'center', padding: 12 }, saveLabel: { fontFamily: 'Poppins_700Bold', fontSize: 17, color: '#FFFFFF' },
});
