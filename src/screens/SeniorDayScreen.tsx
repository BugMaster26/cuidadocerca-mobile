import { useAccessibility } from '../accessibility/AccessibilityContext';
import { useScaledStyles } from '../ui/useScaledStyles';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { DesignIcon } from '../ui/DesignIcon';
import { SosFooterWaves } from '../ui/CareVisuals';
import { DateTimeFields } from '../ui/ScheduleFields';
import { displayDateTime, parseDateTime } from '../ui/dateTime';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Alert } from '../ui/AppAlert';
import { type ActivityRow, type AppointmentRow, type MedicationRow } from '../data/database';
import { cancelActivityReminder, scheduleActivityReminder } from '../services/LocalReminders';
import { NativePage, PrimaryButton, SecondaryButton, SectionHeader, StatusBadge, EmptyState } from '../ui/NativeScreens';
import { VoiceAssistant } from '../ui/VoiceAssistant';
import { colors } from '../ui/theme';

type Period = 'today' | 'week';
type Category = 'Medicamento' | 'Cita' | 'Examen' | 'Trámite' | 'Actividad personal';
type TimelineItem = { key: string; title: string; detail: string; at: string | null; kind: Category; activity?: ActivityRow };
const categories: Category[] = ['Medicamento', 'Cita', 'Examen', 'Trámite', 'Actividad personal'];

export function SeniorDayScreen({ registration = false }: { registration?: boolean }) {
  const s = useScaledStyles(baseStyles);
  const { textScale } = useAccessibility();
  const params = useLocalSearchParams<{ id?: string }>();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const db = useSQLiteContext();
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [medications, setMedications] = useState<MedicationRow[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [period, setPeriod] = useState<Period>('today');
  const [form, setForm] = useState(registration);
  const [editing, setEditing] = useState<ActivityRow | null>(null);
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [dateTime, setDateTime] = useState(registration ? displayDateTime() : '');
  const [category, setCategory] = useState<Category>('Actividad personal');
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setRows(await db.getAllAsync<ActivityRow>('SELECT * FROM activities ORDER BY CASE WHEN scheduled_at IS NULL THEN 1 ELSE 0 END, scheduled_at ASC, id DESC'));
    setMedications(await db.getAllAsync<MedicationRow>('SELECT * FROM medications ORDER BY name COLLATE NOCASE'));
    setAppointments(await db.getAllAsync<AppointmentRow>('SELECT * FROM appointments ORDER BY scheduled_at'));
  }, [db]);
  useFocusEffect(useCallback(() => { void load().catch(() => setError('No se pudo consultar la agenda.')); }, [load]));
  useEffect(() => {
    if (!registration || !params.id) return;
    void db.getFirstAsync<ActivityRow>('SELECT * FROM activities WHERE id=?', Number(params.id)).then(row => {
      if (!row) { setError('No se encontró la actividad.'); return; }
      setEditing(row); setTitle(row.title); setDetail(row.detail);
      setDateTime(row.scheduled_at ? displayDateTime(new Date(row.scheduled_at)) : '');
      setCategory(categories.includes(row.category as Category) ? row.category as Category : 'Actividad personal');
    }).catch(() => setError('No se pudo abrir la actividad.'));
  }, [db, registration, params.id]);

  const timeRange = useMemo(() => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(start); if (period === 'today') end.setDate(start.getDate() + 1); else end.setDate(start.getDate() + 7);
    return [start, end];
  }, [period]);
  const within = (value: string | null) => { if (!value) return period === 'today'; const date = new Date(value); return date >= timeRange[0] && date < timeRange[1]; };
  const agenda: TimelineItem[] = useMemo(() => {
    const activityItems = rows.filter(row => within(row.scheduled_at)).map(row => ({ key: `activity-${row.id}`, title: row.title, detail: row.detail, at: row.scheduled_at, kind: (categories.includes(row.category as Category) ? row.category : 'Actividad personal') as Category, activity: row }));
    const appointmentItems = appointments.filter(row => within(row.scheduled_at)).map(row => ({ key: `appointment-${row.id}`, title: row.specialty, detail: `${row.clinic}${row.clinician ? ` · ${row.clinician}` : ''}`, at: row.scheduled_at, kind: 'Cita' as Category }));
    const medicationItems = period === 'today' ? medications.filter(row => !row.paused).flatMap(row => row.times.split(',').map((time, index) => time.trim()).filter(time => /^\d{2}:\d{2}$/.test(time)).map((time, index) => ({ key: `medication-${row.id}-${index}`, title: row.name, detail: `Horario indicado · ${row.dose}`, at: `${localDate(new Date())}T${time}`, kind: 'Medicamento' as Category }))) : [];
    return [...activityItems, ...appointmentItems, ...medicationItems].sort((a, b) => (a.at ?? '9999').localeCompare(b.at ?? '9999'));
  }, [rows, appointments, medications, period, timeRange]);

  const openNew = () => router.push('/activity-register');
  const openEdit = (row: ActivityRow) => router.push({ pathname: '/activity-register', params: { id: String(row.id) } });
  const save = () => {
    if (params.id && !editing) { setError('Espera a que se cargue la actividad.'); return; }
    if (!title.trim()) { setError('Escribe un nombre para la actividad.'); return; }
    if (dateTime.trim() && !parseDateTime(dateTime)) { setError('Revisa la fecha y la hora, o borra ambos campos.'); return; }
    setError(''); setReviewOpen(true);
  };
  const confirmSave = async () => {
    if (savingRef.current) return;
    savingRef.current = true; setSaving(true);
    const normalized = parseDateTime(dateTime);
    let id: number;
    try {
      if (editing) {
        id = editing.id;
        await db.runAsync('UPDATE activities SET title=?,detail=?,scheduled_at=?,category=? WHERE id=?', title.trim(), detail.trim(), normalized, category, id);
      } else {
        const result = await db.runAsync('INSERT INTO activities (title,detail,scheduled_at,category) VALUES (?,?,?,?)', title.trim(), detail.trim(), normalized, category);
        id = Number(result.lastInsertRowId);
      }
    } catch {
      setError('No se pudo guardar. Tus datos siguen en el formulario.');
      setReviewOpen(false); setSaving(false); savingRef.current = false; return;
    }
    try {
      if (normalized) {
        const scheduled = await scheduleActivityReminder(db, id, title.trim(), normalized);
        if (!scheduled) Alert.alert('Actividad guardada', 'Revisa el permiso de notificaciones para activar el recordatorio.');
      } else if (editing) await cancelActivityReminder(db, id);
    } catch { Alert.alert('Actividad guardada', 'El registro quedó guardado, pero no se pudo programar el aviso.'); }
    setReviewOpen(false); router.back();
  };
  const toggle = async (row: ActivityRow) => {
    await db.runAsync('UPDATE activities SET state=? WHERE id=?', row.state === 'done' ? 'pending' : 'done', row.id); await load();
  };
  const remove = (row: ActivityRow) => Alert.alert('Eliminar actividad', `¿Quieres eliminar “${row.title}”?`, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Eliminar', style: 'destructive', onPress: async () => { await cancelActivityReminder(db, row.id); await db.runAsync('DELETE FROM activities WHERE id=?', row.id); await load(); } }]);
  const postpone = async (row: ActivityRow) => {
    const next = new Date(Date.now() + 15 * 60 * 1000);
    const value = `${localDate(next)}T${String(next.getHours()).padStart(2, '0')}:${String(next.getMinutes()).padStart(2, '0')}`;
    await db.runAsync('UPDATE activities SET scheduled_at=?,state=\'pending\' WHERE id=?', value, row.id);
    await scheduleActivityReminder(db, row.id, row.title, value); await load();
  };

  return <NativePage compactHeader title="Mi día" intro="">
    {!registration && <><View style={{ minHeight: 155, position: 'relative' }}><Text style={{ color: colors.primary, fontFamily: 'Poppins_700Bold', fontSize: 13 }}>TU ESPACIO</Text><Text style={{ color: colors.ink, fontFamily: 'Poppins_700Bold', fontSize: 30, marginVertical: 10 }}>Mi día</Text><Text style={{ color: colors.ink, fontFamily: 'Poppins_400Regular', fontSize: 14, lineHeight: 22, width: '65%' }}>Organiza tus actividades y mantén todo bajo control.</Text><Image source={require('../../assets/abuelitos-transparente.png')} resizeMode="contain" style={{ width: '38%', height: 120, position: 'absolute', right: 0, top: 8 }} /></View>
    <SectionHeader title="Tu agenda" />
    <View style={s.periodRow}>{([['today', 'Hoy'], ['week', 'Próximos 7 días']] as const).map(([value, label]) => <Pressable key={value} accessibilityRole="tab" accessibilityState={{ selected: period === value }} onPress={() => setPeriod(value)} style={[s.periodTab, period === value && s.periodActive]}><Text style={[s.periodText, period === value && s.periodTextActive]}>{label}</Text></Pressable>)}</View>
    <Pressable accessibilityRole="button" onPress={openNew} style={{ minHeight: 56, borderRadius: 25, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 }}><View style={{ backgroundColor: '#FFFFFF', padding: 3, borderRadius: 18 }}><DesignIcon name="plus" /></View><Text style={{ color: '#FFFFFF', fontFamily: 'Poppins_700Bold', fontSize: 19 }}>Agregar actividad</Text></Pressable></>}
    {registration && form && <><SecondaryButton label="← Volver a Mi día" onPress={() => router.back()} /><View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}><DesignIcon name="calendar" size={34} /><View style={{ flex: 1 }}><Text style={{ fontFamily: 'Poppins_700Bold', color: colors.ink, fontSize: 23 }}>{editing ? 'Editar actividad' : 'Agregar actividad'}</Text><Text style={s.local}>Registra una nueva actividad en tu agenda.</Text></View></View><View style={s.form}>
      <Text style={s.fieldLabel}>¿Qué quieres recordar?</Text>
      <TextInput accessibilityLabel="Nombre de la actividad" value={title} onChangeText={setTitle} placeholder="Ej. Llamar al centro de salud" style={s.input} maxLength={100} />
      <VoiceAssistant label="Dictar título" onTranscript={value => setTitle(value.slice(0, 100))} />
      <Text style={s.fieldLabel}>Tipo de actividad</Text><View style={s.categories}>{categories.map(item => <Pressable key={item} accessibilityRole="radio" accessibilityState={{ selected: category === item }} onPress={() => setCategory(item)} style={[s.category, (item === 'Actividad personal' || textScale > 1.1) && { width: '100%' }, category === item && s.categorySelected]}><DesignIcon name={item === 'Medicamento' ? 'pill' : item === 'Cita' ? 'calendar' : item === 'Examen' ? 'exam' : item === 'Trámite' ? 'file' : 'person'} size={30} /><Text style={[s.categoryText, category === item && s.categoryTextSelected]}>{item}</Text>{category === item && <Text style={{ position: 'absolute', top: 3, right: 5, color: colors.primary }}>✓</Text>}</Pressable>)}</View>
      <DateTimeFields grouped value={dateTime} onChange={setDateTime} />
      <Text style={s.fieldLabel}>Detalle o indicación</Text>
      <TextInput accessibilityLabel="Detalle de actividad" value={detail} onChangeText={setDetail} placeholder="Información adicional (opcional)" multiline style={[s.input, s.multiline]} />
      <VoiceAssistant label="Dictar detalle" onTranscript={setDetail} />
      {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
      <Text style={s.local}>Los recordatorios son notificaciones locales y dependen del permiso del teléfono.</Text>
      <PrimaryButton label={editing ? 'Revisar y guardar cambios' : 'Revisar y guardar'} onPress={save} />
    </View></>}
    {!registration && <><SectionHeader title={period === 'today' ? 'Agenda de hoy' : 'Próximos días'} />
    {agenda.length === 0 ? <View style={{ padding: 24, borderRadius: 22, backgroundColor: '#E6F4F1', alignItems: 'center', gap: 14 }}><View style={{ backgroundColor: '#D5F4E8', padding: 17, borderRadius: 42 }}><DesignIcon name="calendar" size={45} /></View><Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 24, color: colors.ink }}>¡Tu día está libre!</Text><Text style={{ fontFamily: 'Poppins_400Regular', textAlign: 'center', fontSize: 17, color: colors.ink }}>Todavía no tienes actividades registradas. Puedes agregar un medicamento, una cita o un trámite.</Text><SecondaryButton label="+ Agregar actividad" onPress={openNew} /></View> : agenda.map(item => <View key={item.key} style={s.item}>
      <View style={s.time}><Text style={s.timeText}>{item.at ? item.at.slice(11, 16) || '—' : '—'}</Text></View>
      <View style={s.itemBody}><View style={s.itemHead}><Text style={s.kind}>{item.kind}</Text>{item.activity && <StatusBadge label={item.activity.state === 'done' ? 'Completada' : 'Pendiente'} tone={item.activity.state === 'done' ? 'positive' : 'neutral'} />}</View><Text style={s.itemTitle}>{item.title}</Text>{item.at && <Text style={s.itemDate}>{item.at.slice(0, 10)}</Text>}{!!item.detail && <Text style={s.itemDetail}>{item.detail}</Text>}
        {item.activity && <View style={s.itemActions}><SecondaryButton label={item.activity.state === 'done' ? 'Deshacer' : 'Marcar completada'} onPress={() => void toggle(item.activity!)} /><View style={s.inlineActions}><Pressable accessibilityRole="button" accessibilityLabel={`Editar ${item.title}`} onPress={() => openEdit(item.activity!)} style={s.smallAction}><Text style={s.smallActionText}>Editar</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Posponer ${item.title} 15 minutos`} onPress={() => void postpone(item.activity!)} style={s.smallAction}><Text style={s.smallActionText}>+15 min</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Eliminar ${item.title}`} onPress={() => remove(item.activity!)} style={s.smallAction}><Text style={s.deleteText}>Eliminar</Text></Pressable></View></View>}
      </View>
    </View>)}</>}
    <View style={{ marginHorizontal: -20, marginBottom: -28, marginTop: 'auto', paddingTop: 24 }}><SosFooterWaves /></View>
    <Modal transparent visible={reviewOpen} animationType="none" onRequestClose={() => { if (!saving) setReviewOpen(false); }}>
      <View style={{ flex: 1, padding: 22, backgroundColor: '#13292088', justifyContent: 'center' }}><View accessibilityViewIsModal style={{ backgroundColor: '#FFFFFF', padding: 22, borderRadius: 26, maxHeight: '90%' }}>
      <ScrollView contentContainerStyle={{ gap: 15 }}><View style={{ alignSelf: 'center', padding: 16, backgroundColor: '#D5F4E8', borderRadius: 40 }}><DesignIcon name="calendar" size={42} /></View><Text accessibilityRole="header" style={{ fontSize: 25, color: colors.ink, fontFamily: 'Poppins_700Bold', textAlign: 'center' }}>Revisar actividad</Text>
      {([['Fecha', dateTime.split(' ')[0]], ['Hora', dateTime.split(' ')[1]], ['Tipo de actividad', category], ['Título', title], ['Detalle', detail]]).filter(([,value]) => !!value).map(([label,value]) => <View key={label} style={{ borderBottomWidth: 1, borderColor: colors.border, paddingVertical: 10, flexDirection: 'row', gap: 12 }}><DesignIcon name={label === 'Hora' ? 'clock' : label === 'Fecha' ? 'calendar' : 'file'} /><View style={{ flex: 1 }}><Text style={s.fieldLabel}>{label}</Text><Text style={{ color: colors.ink, fontFamily: 'Poppins_400Regular', fontSize: 17 }}>{value}</Text></View></View>)}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}><Pressable disabled={saving} accessibilityRole="button" onPress={() => setReviewOpen(false)} style={{ flexGrow: 1, minHeight: 56, padding: 12, justifyContent: 'center', borderRadius: 15, borderWidth: 1, borderColor: colors.primary }}><Text style={s.smallActionText}>Seguir editando</Text></Pressable><Pressable disabled={saving} accessibilityRole="button" onPress={() => void confirmSave()} style={{ flexGrow: 1, minHeight: 56, padding: 12, justifyContent: 'center', borderRadius: 15, backgroundColor: colors.primary }}><Text style={{ color: '#FFFFFF', fontFamily: 'Poppins_700Bold', fontSize: 17 }}>{saving ? 'Guardando…' : 'Guardar'}</Text></Pressable></View>
      </ScrollView></View></View>
    </Modal>
  </NativePage>;
}

function localDate(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }

const baseStyles = StyleSheet.create({ periodRow: { flexDirection: 'row', gap: 7, padding: 4, borderRadius: 13, backgroundColor: colors.surfaceAlt }, periodTab: { minHeight: 48, flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 10 }, periodActive: { backgroundColor: colors.primary }, periodText: { color: colors.primary, fontSize: 15, fontFamily: 'Poppins_600SemiBold' }, periodTextActive: { color: colors.white }, form: { gap: 10, padding: 15, borderRadius: 17, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white }, fieldLabel: { color: colors.ink, fontSize: 16, fontWeight: '700', fontFamily: 'Poppins_600SemiBold' }, input: { minHeight: 52, paddingHorizontal: 13, borderWidth: 1, borderColor: '#8A746B', borderRadius: 12, backgroundColor: colors.white, color: colors.ink, fontSize: 16, fontFamily: 'Poppins_400Regular' }, multiline: { minHeight: 90, textAlignVertical: 'top', paddingTop: 12 }, categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, category: { width: '48.5%', minHeight: 86, alignItems: 'center', gap: 7, paddingVertical: 10, justifyContent: 'center', paddingHorizontal: 5, borderRadius: 12, borderWidth: 1, borderColor: colors.border }, categorySelected: { borderColor: colors.primary, backgroundColor: '#D5F4E8' }, categoryText: { textAlign: 'center', color: colors.ink, fontSize: 15, fontFamily: 'Poppins_600SemiBold' }, categoryTextSelected: { color: colors.primary }, local: { color: colors.muted, fontSize: 13, lineHeight: 19 }, error: { color: '#8A1C12', fontSize: 15 }, item: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 16, backgroundColor: colors.white }, time: { minWidth: 54, minHeight: 50, borderRadius: 13, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surfaceAlt }, timeText: { color: colors.primary, fontSize: 14, fontWeight: '700', fontFamily: 'Poppins_700Bold' }, itemBody: { flex: 1, gap: 5 }, itemHead: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 5 }, kind: { color: colors.primary, fontSize: 13, fontWeight: '700', fontFamily: 'Poppins_600SemiBold' }, itemTitle: { color: colors.ink, fontSize: 17, lineHeight: 24, fontWeight: '700', fontFamily: 'Poppins_700Bold' }, itemDate: { color: colors.muted, fontSize: 14 }, itemDetail: { color: colors.muted, fontSize: 15, lineHeight: 21 }, itemActions: { gap: 8, marginTop: 5 }, inlineActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, smallAction: { minHeight: 44, paddingHorizontal: 10, justifyContent: 'center', borderRadius: 11, backgroundColor: colors.surfaceAlt }, smallActionText: { color: colors.primary, fontSize: 14, fontWeight: '700' }, deleteText: { color: '#8A1C12', fontSize: 14, fontWeight: '700' } });


