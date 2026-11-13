import * as Notifications from 'expo-notifications';
import type { SQLiteDatabase } from 'expo-sqlite';

export async function requestReminderPermission() {
  await Notifications.setNotificationChannelAsync('care-reminders', {
    name: 'Recordatorios de CuidadoCerca',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 150, 250],
    lightColor: '#A94324',
  });
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  return (await Notifications.requestPermissionsAsync()).granted;
}

export async function scheduleMedicationReminders(db: SQLiteDatabase, medicationId: number, medicationName: string, times: string) {
  const existing = await db.getAllAsync<{ notification_id: string }>('SELECT notification_id FROM medication_reminders WHERE medication_id=?', medicationId);
  await Promise.all(existing.map(item => Notifications.cancelScheduledNotificationAsync(item.notification_id).catch(() => undefined)));
  await db.runAsync('DELETE FROM medication_reminders WHERE medication_id=?', medicationId);
  if (!(await requestReminderPermission())) return false;
  const validTimes = [...new Set(times.split(',').map(value => value.trim()).filter(value => /^\d{2}:\d{2}$/.test(value)))];
  for (const time of validTimes) {
    const [hour, minute] = time.split(':').map(Number);
    if (hour > 23 || minute > 59) continue;
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: { title: 'Recordatorio de horario registrado', body: `Revisa la indicación guardada para ${medicationName}. No es una verificación de toma.`, data: { medicationId } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId: 'care-reminders', delivery: 'bestEffort' },
    });
    await db.runAsync('INSERT INTO medication_reminders (medication_id,time,notification_id) VALUES (?,?,?)', medicationId, time, notificationId);
  }
  return true;
}

export async function scheduleActivityReminder(db: SQLiteDatabase, activityId: number, title: string, scheduledAt: string) {
  const existing = await db.getAllAsync<{ notification_id: string }>('SELECT notification_id FROM activity_reminders WHERE activity_id=?', activityId);
  await Promise.all(existing.map(item => Notifications.cancelScheduledNotificationAsync(item.notification_id).catch(() => undefined)));
  await db.runAsync('DELETE FROM activity_reminders WHERE activity_id=?', activityId);
  const date = new Date(scheduledAt);
  if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) return false;
  if (!(await requestReminderPermission())) return false;
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: { title: 'Actividad de CuidadoCerca', body: title, data: { activityId } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
  });
  await db.runAsync('INSERT INTO activity_reminders (activity_id,notification_id) VALUES (?,?)', activityId, notificationId);
  return true;
}

export async function cancelActivityReminder(db: SQLiteDatabase, activityId: number) {
  const items = await db.getAllAsync<{ notification_id: string }>('SELECT notification_id FROM activity_reminders WHERE activity_id=?', activityId);
  await Promise.all(items.map(item => Notifications.cancelScheduledNotificationAsync(item.notification_id).catch(() => undefined)));
  await db.runAsync('DELETE FROM activity_reminders WHERE activity_id=?', activityId);
}

export async function scheduleSnoozeNotification(title: string, seconds = 15 * 60) {
  if (!(await requestReminderPermission())) return false;
  await Notifications.scheduleNotificationAsync({
    content: { title: 'Recordatorio de CuidadoCerca', body: title },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds, channelId: 'care-reminders' },
  });
  return true;
}
