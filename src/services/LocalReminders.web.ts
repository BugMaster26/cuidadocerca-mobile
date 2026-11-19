// Android schedules reminders through the operating system. The browser
// keeps the agenda records, but reports that no Android reminder was set.
export async function requestReminderPermission() { return false; }
export async function scheduleMedicationReminders(..._args: Parameters<typeof import('./LocalReminders').scheduleMedicationReminders>) { return false; }
export async function scheduleActivityReminder(..._args: Parameters<typeof import('./LocalReminders').scheduleActivityReminder>) { return false; }
export async function cancelActivityReminder(..._args: Parameters<typeof import('./LocalReminders').cancelActivityReminder>) {}
export async function scheduleSnoozeNotification(..._args: Parameters<typeof import('./LocalReminders').scheduleSnoozeNotification>) { return false; }

export async function cancelMedicationReminders(...args: Parameters<typeof import('./LocalReminders').cancelMedicationReminders>) {
  const [db, medicationId] = args;
  await db.runAsync('DELETE FROM medication_reminders WHERE medication_id=?', medicationId);
}
