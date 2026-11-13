import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { type ActivityRow, type AppointmentRow, type MedicationRow } from '../data/database';
import { cancelActivityReminder, scheduleActivityReminder } from '../services/LocalReminders';
import { NativePage, PrimaryButton, SecondaryButton, SectionHeader, StatusBadge, EmptyState } from '../ui/NativeScreens';
import { VoiceAssistant } from '../ui/VoiceAssistant';
import { colors } from '../ui/theme';

type Period = 'today' | 'week';
type Category = 'Medicamento' | 'Cita' | 'Examen' | 'Trámite' | 'Actividad personal';
type TimelineItem = { key: string; title: string; detail: string; at: string | null; kind: Category; activity?: ActivityRow };
const categories: Category[] = ['Medicamento', 'Cita', 'Examen', 'Trámite', 'Actividad personal'];

export function SeniorDayScreen() {
  const db = useSQLiteContext();
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [medications, setMedications] = useState<MedicationRow[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [period, setPeriod] = useState<Period>('today');
  const [form, setForm] = useState(false);
  const [editing, setEditing] = useState<ActivityRow | null>(null);
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [category, setCategory] = useState<Category>('Actividad personal');
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setRows(await db.getAllAsync<ActivityRow>('SELECT * FROM activities ORDER BY CASE WHEN scheduled_at IS NULL THEN 1 ELSE 0 END, scheduled_at ASC, id DESC'));
    setMedications(await db.getAllAsync<MedicationRow>('SELECT * FROM medications ORDER BY name COLLATE NOCASE'));
    setAppointments(await db.getAllAsync<AppointmentRow>('SELECT * FROM appointments ORDER BY scheduled_at'));
  }, [db]);
  useEffect(() => { void load(); }, [load]);

  const timeRange = useMemo(() => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(start); if (period === 'today') end.setDate(start.getDate() + 1); else end.setDate(start.getDate() + 7);
    return [start, end];
  }, [period]);
  const within = (value: string | null) => { if (!value) return period === 'today'; const date = new Date(value); return date >= timeRange[0] && date < timeRange[1]; };
  const agenda: TimelineItem[] = useMemo(() => {
    const activityItems = rows.filter(row => within(row.scheduled_at)).map(row => ({ key: `activity-${row.id}`, title: row.title, detail: row.detail, at: row.scheduled_at, kind: (categories.includes(row.category as Category) ? row.category : 'Actividad personal') as Category, activity: row }));
    const appointmentItems = appointments.filter(row => within(row.scheduled_at)).map(row => ({ key: `appointment-${row.id}`, title: row.specialty, detail: `${row.clinic}${row.clinician ? ` · ${row.clinician}` : ''}`, at: row.scheduled_at, kind: 'Cita' as Category }));
    const medicationItems = period === 'today' ? medications.flatMap(row => row.times.split(',').map((time, index) => time.trim()).filter(time => /^\d{2}:\d{2}$/.test(time)).map((time, index) => ({ key: `medication-${row.id}-${index}`, title: row.name, detail: `Horario indicado · ${row.dose}`, at: `${localDate(new Date())}T${time}`, kind: 'Medicamento' as Category }))) : [];
    return [...activityItems, ...appointmentItems, ...medicationItems].sort((a, b) => (a.at ?? '9999').localeCompare(b.at ?? '9999'));
  }, [rows, appointments, medications, period, timeRange]);

  const resetForm = () => { setForm(false); setEditing(null); setTitle(''); setDetail(''); setDateTime(''); setCategory('Actividad personal'); setError(''); };
  const openNew = () => { resetForm(); setForm(true); };
  const openEdit = (row: ActivityRow) => { setEditing(row); setTitle(row.title); setDetail(row.detail); setDateTime(row.scheduled_at?.replace('T', ' ') ?? ''); setCategory((categories.includes(row.category as Category) ? row.category : 'Actividad personal') as Category); setForm(true); setError(''); };
  const save = () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) { setError('Escribe un nombre para la actividad.'); return; }
    const normalized = dateTime.trim() ? dateTime.trim().replace(' ', 'T') : null;
    if (normalized && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized)) { setError('Usa el formato AAAA-MM-DD HH:MM, o deja la fecha vacía.'); return; }
    const review = `${cleanTitle}${normalized ? `\n${normalized.replace('T', ' ')}` : ''}${detail.trim() ? `\n${detail.trim()}` : ''}\n${category}`;
    Alert.alert('Revisar actividad', review, [
      { text: 'Seguir editando', style: 'cancel' },
      { text: editing ? 'Guardar cambios' : 'Guardar', onPress: async () => {
        if (editing) {
          await db.runAsync('UPDATE activities SET title=?,detail=?,scheduled_at=?,category=? WHERE id=?', cleanTitle, detail.trim(), normalized, category, editing.id);
          await cancelActivityReminder(db, editing.id);
          if (normalized) await scheduleActivityReminder(db, editing.id, cleanTitle, normalized);
        } else {
          const result = await db.runAsync('INSERT INTO activities (title,detail,scheduled_at,category) VALUES (?,?,?,?)', cleanTitle, detail.trim(), normalized, category);
          if (normalized) await scheduleActivityReminder(db, Number(result.lastInsertRowId), cleanTitle, normalized);
        }
        resetForm(); await load();
      } },
    ]);
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

  return <NativePage title="Mi día" intro="Tus compromisos en orden. Marca una actividad cuando termines o pospón su horario.">
    <View style={s.periodRow}>{([['today', 'Hoy'], ['week', 'Próximos 7 días']] as const).map(([value, label]) => <Pressable key={value} accessibilityRole="tab" accessibilityState={{ selected: period === value }} onPress={() => setPeriod(value)} style={[s.periodTab, period === value && s.periodActive]}><Text style={[s.periodText, period === value && s.periodTextActive]}>{label}</Text></Pressable>)}</View>
    <PrimaryButton label={form ? 'Cancelar' : '+ Agregar actividad'} onPress={() => form ? resetForm() : openNew()} />
    {form && <View style={s.form}>
      <Text style={s.fieldLabel}>¿Qué quieres recordar?</Text>
      <TextInput accessibilityLabel="Nombre de la actividad" value={title} onChangeText={setTitle} placeholder="Ej. Llamar al centro de salud" style={s.input} maxLength={100} />
      <VoiceAssistant label="Dictar título" onTranscript={value => setTitle(current => current ? `${current} ${value}` : value)} />
      <Text style={s.fieldLabel}>Tipo de actividad</Text><View style={s.categories}>{categories.map(item => <Pressable key={item} accessibilityRole="radio" accessibilityState={{ selected: category === item }} onPress={() => setCategory(item)} style={[s.category, category === item && s.categorySelected]}><Text style={[s.categoryText, category === item && s.categoryTextSelected]}>{item}</Text></Pressable>)}</View>
      <Text style={s.fieldLabel}>Fecha y hora (opcional)</Text>
      <TextInput accessibilityLabel="Fecha y hora de la actividad" value={dateTime} onChangeText={setDateTime} placeholder="AAAA-MM-DD HH:MM" style={s.input} />
      <Text style={s.fieldLabel}>Detalle o indicación</Text>
      <TextInput accessibilityLabel="Detalle de actividad" value={detail} onChangeText={setDetail} placeholder="Información adicional (opcional)" multiline style={[s.input, s.multiline]} />
      {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
      <Text style={s.local}>Los recordatorios son notificaciones locales y dependen del permiso del teléfono.</Text>
      <PrimaryButton label={editing ? 'Revisar y guardar cambios' : 'Revisar y guardar'} onPress={save} />
    </View>}
    <SectionHeader title={period === 'today' ? 'Agenda de hoy' : 'Próximos días'} />
    {agenda.length === 0 ? <EmptyState title={period === 'today' ? 'Hoy no tienes actividades registradas' : 'No hay actividades próximas'} body="Agrega un medicamento, una cita, un trámite o una actividad personal para organizarla aquí." action="Agregar actividad" onAction={openNew} /> : agenda.map(item => <View key={item.key} style={s.item}>
      <View style={s.time}><Text style={s.timeText}>{item.at ? item.at.slice(11, 16) || '—' : '—'}</Text></View>
      <View style={s.itemBody}><View style={s.itemHead}><Text style={s.kind}>{item.kind}</Text>{item.activity && <StatusBadge label={item.activity.state === 'done' ? 'Completada' : 'Pendiente'} tone={item.activity.state === 'done' ? 'positive' : 'neutral'} />}</View><Text style={s.itemTitle}>{item.title}</Text>{item.at && <Text style={s.itemDate}>{item.at.slice(0, 10)}</Text>}{!!item.detail && <Text style={s.itemDetail}>{item.detail}</Text>}
        {item.activity && <View style={s.itemActions}><SecondaryButton label={item.activity.state === 'done' ? 'Deshacer' : 'Marcar completada'} onPress={() => void toggle(item.activity!)} /><View style={s.inlineActions}><Pressable accessibilityRole="button" accessibilityLabel={`Editar ${item.title}`} onPress={() => openEdit(item.activity!)} style={s.smallAction}><Text style={s.smallActionText}>Editar</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Posponer ${item.title} 15 minutos`} onPress={() => void postpone(item.activity!)} style={s.smallAction}><Text style={s.smallActionText}>+15 min</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Eliminar ${item.title}`} onPress={() => remove(item.activity!)} style={s.smallAction}><Text style={s.deleteText}>Eliminar</Text></Pressable></View></View>}
      </View>
    </View>)}
  </NativePage>;
}

function localDate(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }

const s = StyleSheet.create({ periodRow: { flexDirection: 'row', gap: 7, padding: 4, borderRadius: 13, backgroundColor: colors.surfaceAlt }, periodTab: { minHeight: 48, flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 10 }, periodActive: { backgroundColor: colors.primary }, periodText: { color: colors.primary, fontSize: 15, fontFamily: 'Poppins_600SemiBold' }, periodTextActive: { color: colors.white }, form: { gap: 10, padding: 15, borderRadius: 17, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white }, fieldLabel: { color: colors.ink, fontSize: 16, fontWeight: '700', fontFamily: 'Poppins_600SemiBold' }, input: { minHeight: 52, paddingHorizontal: 13, borderWidth: 1, borderColor: '#8A746B', borderRadius: 12, backgroundColor: colors.white, color: colors.ink, fontSize: 16, fontFamily: 'Poppins_400Regular' }, multiline: { minHeight: 90, textAlignVertical: 'top', paddingTop: 12 }, categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, category: { minHeight: 42, justifyContent: 'center', paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.border }, categorySelected: { borderColor: colors.primary, backgroundColor: '#FFF2EC' }, categoryText: { color: colors.ink, fontSize: 13, fontFamily: 'Poppins_600SemiBold' }, categoryTextSelected: { color: colors.primary }, local: { color: colors.muted, fontSize: 13, lineHeight: 19 }, error: { color: '#8A1C12', fontSize: 15 }, item: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 16, backgroundColor: colors.white }, time: { minWidth: 54, minHeight: 50, borderRadius: 13, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surfaceAlt }, timeText: { color: colors.primary, fontSize: 14, fontWeight: '700', fontFamily: 'Poppins_700Bold' }, itemBody: { flex: 1, gap: 5 }, itemHead: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 5 }, kind: { color: colors.accent, fontSize: 13, fontWeight: '700', fontFamily: 'Poppins_600SemiBold' }, itemTitle: { color: colors.ink, fontSize: 17, lineHeight: 24, fontWeight: '700', fontFamily: 'Poppins_700Bold' }, itemDate: { color: colors.muted, fontSize: 14 }, itemDetail: { color: colors.muted, fontSize: 15, lineHeight: 21 }, itemActions: { gap: 8, marginTop: 5 }, inlineActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, smallAction: { minHeight: 44, paddingHorizontal: 10, justifyContent: 'center', borderRadius: 11, backgroundColor: colors.surfaceAlt }, smallActionText: { color: colors.primary, fontSize: 14, fontWeight: '700' }, deleteText: { color: '#8A1C12', fontSize: 14, fontWeight: '700' } });
