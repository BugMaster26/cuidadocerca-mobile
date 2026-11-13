import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { type AppointmentRow, type MedicationRow } from '../data/database';
import { NativePage } from '../ui/NativeScreens';
import { colors } from '../ui/theme';
import { scheduleMedicationReminders } from '../services/LocalReminders';

type Section = 'medications' | 'appointments';
export function SeniorHealthScreen() {
  const db = useSQLiteContext();
  const [section, setSection] = useState<Section>('medications');
  const [meds, setMeds] = useState<MedicationRow[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [form, setForm] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const load = useCallback(async () => {
    setMeds(await db.getAllAsync<MedicationRow>(`SELECT m.*,
      (SELECT status FROM medication_events e WHERE e.medication_id=m.id ORDER BY e.happened_at DESC,e.id DESC LIMIT 1) AS last_status,
      (SELECT happened_at FROM medication_events e WHERE e.medication_id=m.id ORDER BY e.happened_at DESC,e.id DESC LIMIT 1) AS last_time
      FROM medications m ORDER BY m.name COLLATE NOCASE`));
    setAppointments(await db.getAllAsync<AppointmentRow>('SELECT * FROM appointments ORDER BY scheduled_at'));
  }, [db]);
  useEffect(() => { void load(); }, [load]);
  const val = (name: string) => fields[name] || '';
  const set = (name: string, value: string) => setFields(current => ({ ...current, [name]: value }));
  const saveMedication = () => {
    if (!val('name').trim() || !val('dose').trim() || !val('frequency').trim() || !val('times').trim()) { setError('Completa nombre, dosis prescrita, frecuencia y horario.'); return; }
    Alert.alert('Revisar medicamento', `${val('name').trim()}\nDosis indicada: ${val('dose').trim()}\n${val('frequency').trim()} · ${val('times').trim()}`, [{text:'Editar',style:'cancel'},{text:'Guardar',onPress:async()=>{try { const result = await db.runAsync('INSERT INTO medications (name, dose, frequency, times, starts_on, ends_on) VALUES (?, ?, ?, ?, ?, ?)',val('name').trim(),val('dose').trim(),val('frequency').trim(),val('times').trim(),val('starts').trim()||null,val('ends').trim()||null); const scheduled = await scheduleMedicationReminders(db, Number(result.lastInsertRowId), val('name').trim(), val('times').trim()); setFields({});setError('');setForm(false);await load(); if (!scheduled) Alert.alert('Medicamento guardado', 'El registro se guardó en este teléfono, pero no se activaron avisos. Revisa el permiso de notificaciones en Android.'); } catch { setError('No se pudo guardar el medicamento. Inténtalo de nuevo.'); Alert.alert('No se pudo programar', 'Comprueba los permisos de notificaciones. El formulario sigue disponible.'); }}}]);
  };
  const saveAppointment = async () => {
    if (!val('specialty').trim() || !val('clinic').trim() || !val('datetime').trim()) { setError('Completa especialidad, centro médico y fecha y hora.'); return; }
    const when = val('datetime').trim().replace(' ', 'T');
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(when)) { setError('Usa el formato AAAA-MM-DD HH:MM.'); return; }
    Alert.alert('Revisar cita', `${val('specialty').trim()}\n${val('clinic').trim()} · ${when.replace('T',' ')}${val('clinician').trim() ? `\n${val('clinician').trim()}` : ''}`, [{text:'Editar',style:'cancel'},{text:'Guardar',onPress:async()=>{await db.runAsync('INSERT INTO appointments (specialty, clinician, clinic, scheduled_at, reason) VALUES (?, ?, ?, ?, ?)',val('specialty').trim(),val('clinician').trim(),val('clinic').trim(),when,val('reason').trim());setFields({});setError('');setForm(false);await load();}}]);
  };
  const logStatus = (id: number, status: string) => Alert.alert('Registrar estado de la toma', 'Este registro solo guarda lo que indiques. No cambia tu tratamiento.', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Confirmar', onPress: async () => { await db.runAsync('INSERT INTO medication_events (medication_id, status) VALUES (?, ?)', id, status); await load(); } }]);
  const active = section === 'medications';
  return <NativePage title="Mi salud" intro="Guarda tus propios datos. Comprueba siempre la indicación con el envase o el profesional que te atiende.">
    <View style={s.switchRow}><Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={() => { setSection('medications'); setForm(false); setError(''); }} style={[s.tab, active && s.tabSelected]}><Text style={[s.tabText, active && s.tabTextSelected]}>Medicamentos</Text></Pressable><Pressable accessibilityRole="tab" accessibilityState={{ selected: !active }} onPress={() => { setSection('appointments'); setForm(false); setError(''); }} style={[s.tab, !active && s.tabSelected]}><Text style={[s.tabText, !active && s.tabTextSelected]}>Citas</Text></Pressable></View>
    <Pressable accessibilityRole="button" onPress={() => { setForm(!form); setError(''); }} style={s.add}><Text style={s.addText}>{form ? 'Cancelar' : active ? '+ Registrar medicamento' : '+ Registrar cita'}</Text></Pressable>
    {form && <View style={s.form}>{active ? <>
      <Field label="Nombre del medicamento" value={val('name')} onChangeText={v => set('name',v)} />
      <Field label="Dosis prescrita (copia de la indicación)" value={val('dose')} onChangeText={v => set('dose',v)} />
      <Field label="Frecuencia indicada" value={val('frequency')} onChangeText={v => set('frequency',v)} />
      <Field label="Horario(s), separados por coma" value={val('times')} onChangeText={v => set('times',v)} placeholder="Ej. 08:00, 20:00" />
      <Field label="Fecha de inicio (opcional)" value={val('starts')} onChangeText={v => set('starts',v)} placeholder="AAAA-MM-DD" />
      <Field label="Fecha de fin (opcional)" value={val('ends')} onChangeText={v => set('ends',v)} placeholder="AAAA-MM-DD" />
    </> : <>
      <Field label="Especialidad" value={val('specialty')} onChangeText={v => set('specialty',v)} />
      <Field label="Profesional (opcional)" value={val('clinician')} onChangeText={v => set('clinician',v)} />
      <Field label="Centro médico" value={val('clinic')} onChangeText={v => set('clinic',v)} />
      <Field label="Fecha y hora · AAAA-MM-DD HH:MM" value={val('datetime')} onChangeText={v => set('datetime',v)} placeholder="2026-12-20 09:30" />
      <Field label="Motivo o documentos necesarios (opcional)" value={val('reason')} onChangeText={v => set('reason',v)} />
    </>}{!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}<Text style={s.local}>{active ? 'Los avisos son notificaciones locales según el horario que escribas y requieren permiso. No confirman una toma.' : 'La cita se guarda solo en este dispositivo; todavía no se comparte ni sincroniza.'}</Text><Pressable accessibilityRole="button" onPress={active ? saveMedication : saveAppointment} style={s.save}><Text style={s.saveText}>Revisar antes de guardar</Text></Pressable></View>}
    {active ? meds.length ? meds.map(m => <View key={m.id} style={s.card}><Text style={s.cardTitle}>{m.name}</Text><Text style={s.copy}>Dosis: {m.dose}</Text><Text style={s.copy}>{m.frequency} · {m.times}</Text>{!!(m.starts_on || m.ends_on) && <Text style={s.copy}>Vigencia: {m.starts_on || 'sin inicio'} – {m.ends_on || 'sin fin'}</Text>}<Text style={s.local}>La falta de confirmación no indica si la toma ocurrió. Los avisos dependen del permiso de Android.</Text>{!!m.last_status && <Text style={s.copy}>Último registro: {({taken:'Tomé',postponed:'Pospuse',unconfirmed:'No confirmado'} as Record<string,string>)[m.last_status] || m.last_status} · {m.last_time}</Text>}<View style={s.actions}>{[['taken','Tomé'],['postponed','Pospuse'],['unconfirmed','No confirmado']].map(([status,label]) => <Pressable key={status} accessibilityRole="button" onPress={() => logStatus(m.id,status)} style={s.statusButton}><Text style={s.statusText}>{status === 'unconfirmed' ? 'No lo recuerdo' : label}</Text></Pressable>)}</View></View>) : <Empty text="Todavía no hay medicamentos registrados." /> : appointments.length ? appointments.map(a => <View key={a.id} style={s.card}><Text style={s.cardTitle}>{a.specialty}</Text><Text style={s.copy}>{a.scheduled_at.replace('T',' ')}</Text><Text style={s.copy}>{a.clinic}{a.clinician ? ` · ${a.clinician}` : ''}</Text>{!!a.reason && <Text style={s.copy}>{a.reason}</Text>}<Text style={s.local}>Cita guardada solo en este dispositivo. No se envió a familiares.</Text></View>) : <Empty text="Todavía no hay citas registradas." />}
  </NativePage>;
}
function Field({ label, value, onChangeText, placeholder }: { label: string; value: string; onChangeText: (v: string) => void; placeholder?: string }) { return <View style={s.field}><Text style={s.label}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} placeholder={placeholder} style={s.input} /></View>; }
function Empty({text}:{text:string}) { return <View style={s.empty}><Text style={s.copy}>{text}</Text><Text style={s.local}>Los registros que añadas aquí permanecen locales.</Text></View>; }
const s = StyleSheet.create({ switchRow: { flexDirection: 'row', padding: 4, backgroundColor: colors.surfaceAlt, borderRadius: 14, gap: 4 }, tab: { minHeight: 50, flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 11, paddingHorizontal: 6 }, tabSelected: { backgroundColor: colors.primary }, tabText: { color: colors.ink, fontSize: 16, fontWeight: '600' }, tabTextSelected: { color: colors.white }, add: { minHeight: 52, justifyContent: 'center', alignItems: 'center', borderRadius: 12, backgroundColor: colors.primary }, addText: { color: colors.white, fontSize: 17, fontWeight: '700' }, form: { gap: 11, padding: 15, backgroundColor: colors.surfaceAlt, borderRadius: 16 }, field: { gap: 5 }, label: { color: colors.ink, fontSize: 16, fontWeight: '600' }, input: { minHeight: 52, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.muted, borderRadius: 10, backgroundColor: colors.white, color: colors.ink, fontSize: 16 }, error: { color: '#8A1C12', fontSize: 16 }, local: { color: colors.muted, fontSize: 13, lineHeight: 19 }, save: { minHeight: 52, justifyContent: 'center', alignItems: 'center', borderRadius: 11, backgroundColor: colors.accent }, saveText: { color: colors.white, fontSize: 16, fontWeight: '700' }, card: { padding: 15, gap: 6, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 15 }, cardTitle: { color: colors.ink, fontSize: 19, fontWeight: '700', fontFamily: 'Poppins_700Bold' }, copy: { color: colors.ink, fontSize: 16, lineHeight: 22 }, actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 5 }, statusButton: { flexGrow: 1, minHeight: 48, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8, borderWidth: 1, borderColor: colors.primary, borderRadius: 10 }, statusText: { color: colors.primary, fontSize: 14, fontWeight: '700' }, empty: { padding: 16, gap: 8, borderRadius: 14, backgroundColor: colors.surfaceAlt } });
