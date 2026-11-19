import type { AlertButton, AlertOptions } from 'react-native';

export type AppAlertEntry = {
  id: number;
  title: string;
  message: string;
  buttons: AlertButton[];
  options?: AlertOptions;
};
let nextId = 1;
let entries: AppAlertEntry[] = [];
const listeners = new Set<() => void>();
function publish() { listeners.forEach(listener => listener()); }
export function subscribeAlerts(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export function getAlertSnapshot() { return entries; }
export const Alert = {
  alert(title: string, message = '', buttons: AlertButton[] = [], options?: AlertOptions) {
    entries = [...entries, { id: nextId++, title, message, buttons: buttons.length ? buttons : [{ text: 'Entendido' }], options }];
    publish();
  },
};
export function closeAlert(id: number) {
  entries = entries.filter(entry => entry.id !== id);
  publish();
}
export async function chooseAlert(entry: AppAlertEntry, button: AlertButton) {
  if (!entries.some(item => item.id === entry.id)) return;
  closeAlert(entry.id);
  try { await button.onPress?.(); }
  catch { Alert.alert('No se pudo completar la acción', 'Revisa la información e inténtalo de nuevo.'); }
}
export function dismissAlert(entry: AppAlertEntry) {
  if (entry.options?.cancelable === false) return;
  closeAlert(entry.id);
  entry.options?.onDismiss?.();
}
