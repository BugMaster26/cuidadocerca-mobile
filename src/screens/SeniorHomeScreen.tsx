import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { type ActivityRow, type AppointmentRow, type MedicationRow } from '../data/database';
import { useAccessibility } from '../accessibility/AccessibilityContext';
import { scheduleSnoozeNotification } from '../services/LocalReminders';
import { AccessibleCard, EmptyState, NativePage, PrimaryButton, SecondaryButton, SectionHeader, SosCard, StatusBadge } from '../ui/NativeScreens';
import { colors } from '../ui/theme';

export function SeniorHomeScreen() {
  const db = useSQLiteContext();
  const access = useAccessibility();
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [medications, setMedications] = useState<MedicationRow[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [greeting, setGreeting] = useState('Hola');
  const load = useCallback(async () => {
    setActivities(await db.getAllAsync<ActivityRow>("SELECT * FROM activities WHERE state='pending' ORDER BY CASE WHEN scheduled_at IS NULL THEN 1 ELSE 0 END, scheduled_at LIMIT 8"));
    setMedications(await db.getAllAsync<MedicationRow>('SELECT * FROM medications ORDER BY name COLLATE NOCASE'));
    setAppointments(await db.getAllAsync<AppointmentRow>('SELECT * FROM appointments ORDER BY scheduled_at'));
  }, [db]);
  useEffect(() => { const h = new Date().getHours(); setGreeting(h < 12 ? '¡Buenos días!' : h < 19 ? '¡Buenas tardes!' : '¡Buenas noches!'); void load(); }, [load]);

  const date = useMemo(() => new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()), []);
  const todayKey = new Date().toLocaleDateString('en-CA');
  const todayActivities = activities.filter(a => !a.scheduled_at || a.scheduled_at.slice(0, 10) === todayKey);
  const appointment = appointments.find(a => a.scheduled_at.slice(0, 10) === todayKey) ?? appointments[0];
  const nextMedication = useMemo(() => {
    const now = new Date();
    const candidates = medications.flatMap(m => m.times.split(',').map(v => v.trim()).filter(v => /^\d{2}:\d{2}$/.test(v)).map(time => ({ medication: m, time })));
    return candidates.find(item => { const [h, min] = item.time.split(':').map(Number); return h > now.getHours() || (h === now.getHours() && min >= now.getMinutes()); }) ?? (candidates.length ? candidates[0] : null);
  }, [medications]);
  const nextActivity = todayActivities[0];

  const log = (status: 'taken' | 'postponed') => {
    if (!nextMedication) return;
    const title = status === 'taken' ? 'Confirmar toma' : 'Recordarme más tarde';
    const body = status === 'taken' ? 'Este registro solo guarda lo que indiques. No cambia tu tratamiento.' : 'Se programará un aviso local dentro de 15 minutos, si concedes permiso.';
    Alert.alert(title, body, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', onPress: async () => {
        await db.runAsync('INSERT INTO medication_events (medication_id,status) VALUES (?,?)', nextMedication.medication.id, status);
        if (status === 'postponed') {
          try {
            const scheduled = await scheduleSnoozeNotification(`Revisa el horario registrado para ${nextMedication.medication.name}.`);
            if (!scheduled) Alert.alert('Aviso no programado', 'El permiso de notificaciones está desactivado. El registro sí quedó guardado.');
          } catch { Alert.alert('Aviso no programado', 'Este dispositivo no permitió programar una notificación. El registro sí quedó guardado.'); }
        }
        await load();
      } },
    ]);
  };

  return <NativePage title={greeting} intro={`${date.charAt(0).toLocaleUpperCase('es-PE')}${date.slice(1)} · Aquí tienes lo importante para hoy.`}>
    <SosCard />

    <SectionHeader title="Tu día de hoy" action="Ver Mi día" onAction={() => router.push('/(senior)/day')} />
    <AccessibleCard title={`${todayActivities.length + (appointment ? 1 : 0)} compromisos registrados`} body={nextActivity ? `${nextActivity.scheduled_at ? `${nextActivity.scheduled_at.slice(11, 16)} · ` : ''}${nextActivity.title}` : appointment ? `Próxima cita: ${appointment.specialty} · ${appointment.scheduled_at.replace('T', ' ')}` : 'Hoy todavía no tienes actividades registradas.'} icon="◷" />
    {!nextActivity && !appointment && <SecondaryButton label="Agregar actividad" onPress={() => router.push('/(senior)/day')} />}

    {!access.simpleMode && <>
      <SectionHeader title="Próximo medicamento" action="Ver Mi salud" onAction={() => router.push('/(senior)/health')} />
      {nextMedication ? <AccessibleCard title={nextMedication.medication.name} body={`Dosis indicada: ${nextMedication.medication.dose} · Horario registrado: ${nextMedication.time}`} icon="✚">
        <Text style={s.caution}>Comprueba el envase o tu indicación original. La falta de confirmación no indica si tomaste la dosis.</Text>
        <StatusBadge label="Sin confirmación" />
        <View style={s.medActions}><PrimaryButton label="Ya lo tomé" onPress={() => log('taken')} /><SecondaryButton label="Recordarme más tarde" onPress={() => log('postponed')} /></View>
      </AccessibleCard> : <EmptyState title="Aún no has registrado medicamentos" body="Guarda lo que indica tu receta para tenerlo organizado en Mi salud." action="Registrar mi primer medicamento" onAction={() => router.push('/(senior)/health')} />}
      {appointment && <AccessibleCard title={`Próxima cita · ${appointment.specialty}`} body={`${appointment.scheduled_at.replace('T', ' ')} · ${appointment.clinic}`} icon="＋"><SecondaryButton label="Ver mis citas" onPress={() => router.push('/(senior)/health')} /></AccessibleCard>}
      <SectionHeader title="Guardar una indicación" />
      <AccessibleCard title="Captura inteligente" body="Escanea una receta, cita o documento; revisa el texto antes de guardarlo." icon="▣"><PrimaryButton label="Escanear o dictar" onPress={() => router.push('/(senior)/capture')} /><SecondaryButton label="Escribir manualmente" onPress={() => router.push('/(senior)/capture?mode=manual')} /></AccessibleCard>
      <SectionHeader title="Mi familia" action="Abrir" onAction={() => router.push('/(senior)/family')} />
      <AccessibleCard title="Pide acompañamiento" body="Guarda una solicitud en tu teléfono. Se enviará cuando haya una cuenta vinculada." icon="♡"><SecondaryButton label="Pedir ayuda a mi familia" onPress={() => router.push('/(senior)/family')} /></AccessibleCard>
    </>}
  </NativePage>;
}

const s = StyleSheet.create({ caution: { color: colors.muted, fontSize: 14, lineHeight: 21 }, medActions: { gap: 8, marginTop: 2 } });
