import { useScaledStyles } from '../ui/useScaledStyles';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useRef, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Alert } from '../ui/AppAlert';
import { VoiceAssistant } from '../ui/VoiceAssistant';
import { DateTimeFields, ScheduleField } from '../ui/ScheduleFields';
import { displayDateTime, parseDate, parseDateTime, validTime } from '../ui/dateTime';
import { type AppointmentRow, type MedicationRow } from '../data/database';
import { NativePage, SecondaryButton } from '../ui/NativeScreens';
import { SosFooterWaves } from '../ui/CareVisuals';
import { useAccessibility } from '../accessibility/AccessibilityContext';
import { cancelMedicationReminders, scheduleMedicationReminders, scheduleSnoozeNotification } from '../services/LocalReminders';

const paths = {
  pill: 'M9.5 19.5a5 5 0 0 1-7-7l10-10a5 5 0 0 1 7 7Z M8 8l8 8',
  calendar: 'M8 2v5m8-5v5M3 10h18M5 5h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z M8 15l3 3 5-5',
  edit: 'm4 16 12-12 4 4L8 20H4z M14 6l4 4',
  clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20 M12 6v6l4 2',
  trash: 'M3 6h18M9 6V3h6v3M5 6l1 16h12l1-16M10 10v8m4-8v8',
  pause: 'M8 5v14m8-14v14',
  save: 'M4 3h13l4 4v14H3V3zM7 3v6h10V3M7 21v-8h10v8',
};
function Icon({ name, size = 26, color = '#126B62' }: { name: keyof typeof paths; size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden><Path d={paths[name]} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
}
type Section = 'medications' | 'appointments';
export function SeniorHealthScreen({ registration = false }: { registration?: boolean }) {
  const s = useScaledStyles(baseStyles);
  const db = useSQLiteContext();
  const params = useLocalSearchParams<{ section?: string; id?: string }>();
  const [section, setSection] = useState<Section>(params.section === 'appointments' ? 'appointments' : 'medications');
  const active = section === 'medications';
  const access = useAccessibility();
  const [meds, setMeds] = useState<MedicationRow[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [fields, setFields] = useState<Record<string, string>>({ datetime: displayDateTime(), times: displayDateTime().split(' ')[1] });
  const [error, setError] = useState('');
  const [review, setReview] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [ready, setReady] = useState(!registration || !params.id);
  const val = (name: string) => fields[name] || '';
  const set = (name: string, value: string) => setFields(current => ({ ...current, [name]: value }));
  const load = useCallback(async () => {
    setMeds(await db.getAllAsync<MedicationRow>(`SELECT m.*,
      (SELECT status FROM medication_events e WHERE e.medication_id=m.id ORDER BY e.happened_at DESC,e.id DESC LIMIT 1) AS last_status,
      (SELECT happened_at FROM medication_events e WHERE e.medication_id=m.id ORDER BY e.happened_at DESC,e.id DESC LIMIT 1) AS last_time
      FROM medications m ORDER BY m.name COLLATE NOCASE`));
    setAppointments(await db.getAllAsync<AppointmentRow>('SELECT * FROM appointments ORDER BY scheduled_at'));
  }, [db]);
  useFocusEffect(useCallback(() => {
    void load().catch(() => setError('No se pudieron consultar tus registros.'));
    if (registration && params.id) {
      const read = async () => {
        if (active) {
          const row = await db.getFirstAsync<MedicationRow>('SELECT * FROM medications WHERE id=?', Number(params.id));
          if (!row) throw new Error();
          setFields({ name: row.name, dose: row.dose, frequency: row.frequency, times: row.times, starts: dateInput(row.starts_on), ends: dateInput(row.ends_on) });
        } else {
          const row = await db.getFirstAsync<AppointmentRow>('SELECT * FROM appointments WHERE id=?', Number(params.id));
          if (!row) throw new Error();
          const [date, time] = row.scheduled_at.split('T');
          setFields({ specialty: row.specialty, clinician: row.clinician, clinic: row.clinic, datetime: dateInput(date) + ' ' + time.slice(0, 5), reason: row.reason });
        }
        setReady(true);
      };
      void read().catch(() => setError('No se pudo abrir el registro. Vuelve a Mi salud e inténtalo nuevamente.'));
    }
  }, [load, registration, params.id, active, db]));
  function openForm(id?: number) {
    router.push({ pathname: '/health-register', params: { section, ...(id ? { id: String(id) } : {}) } });
  }
  function validate() {
    if (active) {
      if (!val('name').trim() || !val('dose').trim() || !val('frequency').trim() || !val('times').trim()) return 'Completa nombre, cantidad por toma, frecuencia y horario.';
      if (!val('times').split(',').every(time => validTime(time.trim()))) return 'Revisa los horarios. Usa HH:MM.';
      const starts = parseDate(val('starts')), ends = parseDate(val('ends'));
      if ((val('starts') && !starts) || (val('ends') && !ends) || (starts && ends && ends < starts)) return 'Revisa las fechas de inicio y fin.';
    } else {
      if (!val('specialty').trim() || !val('clinic').trim()) return 'Completa especialidad y centro médico.';
      if (!parseDateTime(val('datetime'))) return 'Escribe una fecha y una hora válidas.';
    }
    return '';
  }
  async function save() {
    if (savingRef.current) return;
    const invalid = validate();
    if (invalid) { setError(invalid); setReview(false); return; }
    savingRef.current = true; setSaving(true);
    let medicationId: number | undefined;
    try {
      if (active) {
        const args = [val('name').trim(), val('dose').trim(), val('frequency').trim(), val('times').split(',').map(t => t.trim()).join(','), parseDate(val('starts')), parseDate(val('ends'))] as const;
        if (params.id) {
          medicationId = Number(params.id);
          await db.runAsync('UPDATE medications SET name=?,dose=?,frequency=?,times=?,starts_on=?,ends_on=? WHERE id=?', ...args, medicationId);
        } else {
          const result = await db.runAsync('INSERT INTO medications (name,dose,frequency,times,starts_on,ends_on) VALUES (?,?,?,?,?,?)', ...args);
          medicationId = Number(result.lastInsertRowId);
        }
      } else {
        const args = [val('specialty').trim(), val('clinician').trim(), val('clinic').trim(), parseDateTime(val('datetime'))!, val('reason').trim()] as const;
        if (params.id) await db.runAsync('UPDATE appointments SET specialty=?,clinician=?,clinic=?,scheduled_at=?,reason=? WHERE id=?', ...args, Number(params.id));
        else await db.runAsync('INSERT INTO appointments (specialty,clinician,clinic,scheduled_at,reason) VALUES (?,?,?,?,?)', ...args);
      }
    } catch {
      setReview(false); setError('No se pudo guardar. Tus datos siguen en el formulario.');
      savingRef.current = false; setSaving(false); return;
    }
    // Reminder failures must never make a successfully saved record look unsaved.
    if (medicationId !== undefined) {
      let scheduled = false;
      try {
        const row = await db.getFirstAsync<MedicationRow>('SELECT * FROM medications WHERE id=?', medicationId);
        scheduled = row?.paused ? true : await scheduleMedicationReminders(db, medicationId, val('name'), val('times'));
      } catch {}
      if (!scheduled) Alert.alert('Medicamento guardado', 'El registro quedó guardado. Revisa el permiso de notificaciones para activar los avisos.');
    }
    setReview(false);
    router.back();
  }
  function confirmDelete(id: number) {
    Alert.alert('Eliminar registro', '¿Quieres eliminar este registro de Mi salud?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try {
          if (active) {
            await cancelMedicationReminders(db, id);
            await db.withTransactionAsync(async () => {
              await db.runAsync('DELETE FROM medication_events WHERE medication_id=?', id);
              await db.runAsync('DELETE FROM medications WHERE id=?', id);
            });
          } else await db.runAsync('DELETE FROM appointments WHERE id=?', id);
          await load();
        } catch { setError('No se pudo eliminar el registro. Inténtalo otra vez.'); }
      } },
    ]);
  }
  async function togglePause(m: MedicationRow) {
    try {
      if (!m.paused) {
        await cancelMedicationReminders(db, m.id);
        await db.runAsync('UPDATE medications SET paused=1 WHERE id=?', m.id);
      } else {
        await db.runAsync('UPDATE medications SET paused=0 WHERE id=?', m.id);
        if (!await scheduleMedicationReminders(db, m.id, m.name, m.times)) Alert.alert('Avisos pendientes', 'Revisa el permiso de notificaciones del teléfono.');
      }
      await load();
    } catch (error) { console.warn('No se pudo cambiar la pausa del medicamento', error); setError('No se pudo cambiar el estado. Revisa los permisos e inténtalo de nuevo.'); await load(); }
  }
  function logStatus(id: number, status: string) {
    Alert.alert('Registrar estado de la toma', 'Este registro solo guarda lo que indiques. No cambia tu tratamiento.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', onPress: async () => {
        await db.runAsync('INSERT INTO medication_events (medication_id,status) VALUES (?,?)', id, status); await load();
      } },
    ]);
  }
  function remindLater(m: MedicationRow) {
    Alert.alert('Recordarme más tarde', 'Se programará un aviso local para dentro de 15 minutos si el teléfono lo permite.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', onPress: async () => {
        await db.runAsync('INSERT INTO medication_events (medication_id,status) VALUES (?,?)', m.id, 'postponed');
        try { if (!await scheduleSnoozeNotification(m.name)) throw new Error(); }
        catch { Alert.alert('Aviso no programado', 'El registro quedó guardado. Revisa los permisos de notificaciones.'); }
        await load();
      } },
    ]);
  }
  const summary: [string, string][] = active
    ? [['Medicamento', val('name')], ['Cantidad por toma', val('dose')], ['Frecuencia', val('frequency')], ['Horarios', val('times')], ['Fecha de inicio', val('starts')], ['Fecha de fin', val('ends')]]
    : [['Especialidad', val('specialty')], ['Profesional', val('clinician')], ['Centro médico', val('clinic')], ['Fecha y hora', val('datetime')], ['Motivo o documentos', val('reason')]];
  const action = (label: string, onPress: () => void, icon: keyof typeof paths, destructive = false) =>
    <Pressable accessibilityRole="button" onPress={onPress} style={[s.smallButton, destructive && s.destructive]}><Icon name={icon} size={21} color={destructive ? '#A32222' : '#126B62'} /><Text style={[s.actionText, destructive && { color: '#A32222' }]}>{label}</Text></Pressable>;
  return <NativePage compactHeader title="Mi salud" intro="">
    {registration ? <>
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={s.back}><Text style={s.actionText}>← Volver a Mi salud</Text></Pressable>
      <View style={s.formHeading}><Icon name={active ? 'pill' : 'calendar'} size={34} /><View style={{ flex: 1 }}><Text accessibilityRole="header" style={[s.title, { fontSize: 23 * access.textScale }]}>{params.id ? 'Editar' : 'Registrar'} {active ? 'medicamento' : 'cita'}</Text><Text style={s.local}>Completa los datos de {active ? 'tu medicamento' : 'tu cita médica'}.</Text></View></View>
      {ready && <View style={s.form}>{active ? <>      <Field label="Nombre del medicamento" value={val('name')} onChangeText={v => set('name',v)} />
      <Field label="Cantidad por toma (según la indicación)" value={val('dose')} onChangeText={v => set('dose',v)} />
      <Field label="Frecuencia de toma" value={val('frequency')} onChangeText={v => set('frequency',v)} />
      {val('times').split(',').map((time, index, times) => <ScheduleField key={index} label={`Hora ${index + 1}`} kind="time" value={time}
        onChange={value => set('times', times.map((entry, position) => position === index ? value : entry).join(','))} />)}
      <SecondaryButton label="Agregar otro horario" onPress={() => set('times', val('times') + ',')} />
      {val('times').includes(',') && <SecondaryButton label="Quitar último horario" onPress={() => set('times', val('times').split(',').slice(0, -1).join(','))} />}
      <ScheduleField label="Fecha de inicio (opcional)" kind="date" value={val('starts')} onChange={v => set('starts', v)} />
      <ScheduleField label="Fecha de fin (opcional)" kind="date" value={val('ends')} onChange={v => set('ends', v)} />
    </> : <>
      <Field label="Especialidad" value={val('specialty')} onChangeText={v => set('specialty',v)} />
      <Field label="Profesional (opcional)" value={val('clinician')} onChangeText={v => set('clinician',v)} />
      <Field label="Centro médico" value={val('clinic')} onChangeText={v => set('clinic',v)} />
      <DateTimeFields grouped value={val('datetime')} onChange={v => set('datetime', v)} />
      <Field multiline label="Motivo o documentos necesarios (opcional)" value={val('reason')} onChangeText={v => set('reason',v)} />

      </>}{!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
      <Text style={s.local}>{active ? 'Los avisos son notificaciones locales según el horario que escribas y requieren permiso.' : 'La cita se guarda solo en este dispositivo; todavía no se comparte ni sincroniza.'}</Text>
      <Pressable accessibilityRole="button" onPress={() => { const message = validate(); setError(message); if (!message) setReview(true); }} style={s.save}><Icon name="save" color="#FFFFFF" /><Text style={s.saveText}>Revisar antes de guardar</Text></Pressable></View>}
      {!ready && !!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    </> : <>
      <View style={s.hero}><Text style={s.eyebrow}>TU ESPACIO</Text><View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><Text accessibilityRole="header" style={[s.title, { flex: 1, fontSize: 30 * access.textScale, lineHeight: 40 * access.textScale }]}>Mi salud</Text><Image accessible={false} source={require('../../assets/abuelitos-transparente.png')} style={{ width: '30%', height: 90 }} resizeMode="contain" /></View><Text style={[s.intro, { width: '100%', fontSize: 16 * access.textScale, lineHeight: 25 * access.textScale }]}>Guarda tus propios datos. Comprueba siempre la indicación con el envase o el profesional que te atiende.</Text></View>
      <View style={s.switchRow}>{(['medications', 'appointments'] as const).map(value => <Pressable key={value} accessibilityRole="tab" accessibilityState={{ selected: section === value }} onPress={() => { setSection(value); setError(''); }} style={[s.tab, section === value && s.tabSelected]}><Text style={[s.tabText, section === value && s.tabSelectedText]}>{value === 'medications' ? 'Medicamentos' : 'Citas'}</Text></Pressable>)}</View>
      <Pressable accessibilityRole="button" onPress={() => openForm()} style={s.save}><Text style={s.saveText}>+ Registrar {active ? 'medicamento' : 'cita'}</Text></Pressable>
      {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
      {(active ? meds.length === 0 : appointments.length === 0) && <View style={s.empty}><View style={s.symbol}><Icon name={active ? 'pill' : 'calendar'} size={40} /></View><Text style={s.emptyTitle}>{active ? 'Aún no tienes medicamentos registrados' : 'Aún no tienes citas registradas'}</Text><Text style={s.emptyCopy}>{active ? 'Agrega tus medicamentos para recibir recordatorios y seguir tu tratamiento.' : 'Agrega tus citas médicas para recordarlas y mantener tu atención en orden.'}</Text></View>}
      {active ? meds.map(m => <View key={m.id} style={s.card}><View style={s.cardHeading}><Icon name="pill" /><Text style={s.cardTitle}>{m.name}</Text><Text style={s.badge}>{m.paused ? 'Pausado' : 'Activo'}</Text></View><Text style={s.copy}>Cantidad por toma: {m.dose}</Text><Text style={s.copy}>{m.frequency} · {m.times}</Text><Text style={s.copy}>{dateInput(m.starts_on) || 'Sin inicio'} – {dateInput(m.ends_on) || 'Sin fin'}</Text><View style={s.actions}>{action('Editar', () => openForm(m.id), 'edit')}{action(m.paused ? 'Reanudar' : 'Pausar', () => void togglePause(m), 'pause')}{action('Eliminar', () => confirmDelete(m.id), 'trash', true)}</View><Text style={s.local}>Los avisos no confirman una toma.</Text>{!!m.last_status && <Text style={s.copy}>Último registro: {({ taken: 'Tomé', postponed: 'Pospuse', unconfirmed: 'No confirmado' } as Record<string,string>)[m.last_status] || m.last_status} · {m.last_time}</Text>}<View style={s.actions}>{[['taken','Tomé'],['postponed','Pospuse'],['unconfirmed','No lo recuerdo']].map(([status,label]) => <Pressable accessibilityRole="button" key={status} onPress={() => logStatus(m.id,status)} style={s.smallButton}><Text style={s.actionText}>{label}</Text></Pressable>)}</View><SecondaryButton label="Recordarme más tarde" onPress={() => remindLater(m)} /></View>)
      : appointments.map(a => <View key={a.id} style={s.card}><View style={s.cardHeading}><Icon name="calendar" /><Text style={s.cardTitle}>{a.specialty}</Text><Text style={s.badge}>{a.state === 'scheduled' ? 'Programada' : a.state}</Text></View>{!!a.clinician && <Text style={s.copy}>{a.clinician}</Text>}<Text style={s.copy}>{a.clinic}</Text><Text style={s.copy}>{dateInput(a.scheduled_at.split('T')[0])} · {a.scheduled_at.split('T')[1]?.slice(0,5)}</Text>{!!a.reason && <Text style={s.copy}>{a.reason}</Text>}<View style={s.actions}>{action('Editar', () => openForm(a.id), 'edit')}{action('Reprogramar', () => openForm(a.id), 'clock')}{action('Eliminar', () => confirmDelete(a.id), 'trash', true)}</View></View>)}
    </>}
    <View style={{ marginHorizontal: -20, marginBottom: -28, marginTop: 'auto', paddingTop: 24 }}><SosFooterWaves /></View>
    <Modal visible={review} transparent animationType="none" onRequestClose={() => { if (!saving) setReview(false); }}>
      <View style={s.overlay}><View accessibilityViewIsModal style={s.modal}><ScrollView contentContainerStyle={{ gap: 14 }} keyboardShouldPersistTaps="handled"><Pressable accessibilityRole="button" accessibilityLabel="Cerrar revisión y seguir editando" disabled={saving} onPress={() => setReview(false)} style={{ alignSelf: 'flex-end', minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 26, color: '#253238' }}>×</Text></Pressable><View style={[s.symbol, { alignSelf: 'center' }]}><Icon name={active ? 'pill' : 'calendar'} size={40} /></View><Text accessibilityRole="header" style={[s.title, { textAlign: 'center', fontSize: 24 * access.textScale }]}>Revisar {active ? 'medicamento' : 'cita'}</Text><View style={s.reviewCard}>{summary.filter(([,value]) => value.trim()).map(([label,value]) => <View key={label} style={s.reviewRow}><Icon name={label.includes('Hora') ? 'clock' : active ? 'pill' : 'calendar'} size={23} /><View style={{ flex: 1 }}><Text style={s.label}>{label}</Text><Text style={s.copy}>{value}</Text></View></View>)}</View><View style={s.actions}><Pressable accessibilityRole="button" disabled={saving} onPress={() => setReview(false)} style={s.smallButton}><Text style={s.actionText}>Editar</Text></Pressable><Pressable accessibilityRole="button" disabled={saving} onPress={() => void save()} style={[s.save,{flex:1}]}><Text style={s.saveText}>{saving ? 'Guardando…' : 'Guardar'}</Text></Pressable></View></ScrollView></View></View>
    </Modal>
  </NativePage>;
}
function dateInput(value: string | null) { return value?.split('-').reverse().join('/') ?? ''; }
function Field({ label, value, onChangeText, multiline = false }: { label: string; value: string; onChangeText: (value: string) => void; multiline?: boolean }) {
  const s = useScaledStyles(baseStyles);
  return <View style={s.field}><Text style={s.label}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} multiline={multiline} style={[s.input, multiline && { minHeight: 96, paddingTop: 12, textAlignVertical: 'top' }]} /><VoiceAssistant label={'Dictar ' + label.split(' (')[0].toLowerCase()} onTranscript={onChangeText} /></View>;
}
const baseStyles = StyleSheet.create({
  hero:{minHeight:180,paddingTop:8},eyebrow:{fontFamily:'Poppins_700Bold',color:'#126B62',fontSize:13},title:{fontFamily:'Poppins_700Bold',color:'#17202B'},
  intro:{fontFamily:'Poppins_400Regular',color:'#253238',lineHeight:25,width:'72%',marginTop:10},grandparents:{position:'absolute',right:0,top:12,width:'34%',height:110},
  switchRow:{flexDirection:'row',backgroundColor:'#E6F4F1',borderRadius:14,padding:3,gap:3},tab:{flex:1,minHeight:52,alignItems:'center',justifyContent:'center',borderRadius:12},tabSelected:{backgroundColor:'#126B62'},tabText:{fontFamily:'Poppins_700Bold',fontSize:16,color:'#126B62'},tabSelectedText:{color:'#fff'},
  save:{backgroundColor:'#126B62',minHeight:56,borderRadius:15,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:9,padding:12},saveText:{fontFamily:'Poppins_700Bold',fontSize:17,color:'#fff',textAlign:'center'},back:{minHeight:48,justifyContent:'center'},
  formHeading:{flexDirection:'row',alignItems:'center',gap:12},form:{gap:16},field:{gap:7},label:{fontFamily:'Poppins_600SemiBold',fontSize:16,color:'#253238'},input:{fontFamily:'Poppins_400Regular',minHeight:54,borderWidth:1,borderColor:'#849D96',borderRadius:12,paddingHorizontal:12,fontSize:18,color:'#253238',backgroundColor:'#fff'},
  local:{fontFamily:'Poppins_400Regular',fontSize:13,lineHeight:20,color:'#52636B'},copy:{fontFamily:'Poppins_400Regular',fontSize:16,lineHeight:24,color:'#253238'},error:{fontSize:16,color:'#A32121'},
  empty:{padding:24,borderRadius:22,backgroundColor:'#E6F4F1',alignItems:'center',gap:12},symbol:{width:76,height:76,borderRadius:38,backgroundColor:'#D5F4E8',alignItems:'center',justifyContent:'center'},emptyTitle:{fontFamily:'Poppins_700Bold',fontSize:22,textAlign:'center',color:'#17202B'},emptyCopy:{fontFamily:'Poppins_400Regular',fontSize:16,textAlign:'center',lineHeight:25,color:'#253238'},
  card:{padding:16,borderWidth:1,borderColor:'#DCE7E4',borderRadius:19,backgroundColor:'#fff',gap:9},cardHeading:{flexDirection:'row',alignItems:'center',gap:10,flexWrap:'wrap'},cardTitle:{flex:1,fontFamily:'Poppins_700Bold',fontSize:20,color:'#17202B'},badge:{padding:6,borderRadius:10,backgroundColor:'#D5F4E8',color:'#126B62',fontFamily:'Poppins_600SemiBold',fontSize:13},
  actions:{flexDirection:'row',flexWrap:'wrap',gap:8},smallButton:{flexGrow:1,minHeight:52,padding:10,borderRadius:13,backgroundColor:'#E6F4F1',alignItems:'center',justifyContent:'center',flexDirection:'row',gap:6},actionText:{fontFamily:'Poppins_700Bold',fontSize:15,color:'#126B62'},destructive:{backgroundColor:'#FCE8E6'},
  overlay:{flex:1,backgroundColor:'#13292088',justifyContent:'center',padding:22},modal:{maxHeight:'90%',padding:22,borderRadius:26,backgroundColor:'#fff'},reviewCard:{borderWidth:1,borderColor:'#DCE7E4',borderRadius:16,paddingHorizontal:12},reviewRow:{paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#DCE7E4',flexDirection:'row',gap:12},
});
