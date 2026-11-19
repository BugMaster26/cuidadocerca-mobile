import { requireOptionalNativeModule } from 'expo';
import { startActivityAsync } from 'expo-intent-launcher';
import * as Location from 'expo-location';
import { Linking, PermissionsAndroid, Platform } from 'react-native';

const CALL_PHONE = 'android.permission.CALL_PHONE';
const SEND_SMS = 'android.permission.SEND_SMS';

export async function requestSosPermissions() {
  if (Platform.OS !== 'android') return 'La llamada automática y el SMS requieren la app de Android.';
  const grants = await PermissionsAndroid.requestMultiple([CALL_PHONE, SEND_SMS]);
  const location = await Location.requestForegroundPermissionsAsync();
  const enabled = [
    grants[CALL_PHONE] === 'granted' && 'llamada',
    grants[SEND_SMS] === 'granted' && 'SMS',
    location.granted && 'ubicación',
  ].filter(Boolean);
  return enabled.length ? `Permisos concedidos: ${enabled.join(', ')}.` : 'Permisos pendientes. Puedes usar las opciones manuales.';
}

export const helpMessage = 'Necesito ayuda. Por favor, llámame lo antes posible.';

export async function prepareHelpMessage() {
  if (Platform.OS !== 'android') return helpMessage;
  try {
    if (!(await Location.getForegroundPermissionsAsync()).granted) return helpMessage;
    const location = await Location.getLastKnownPositionAsync({ maxAge: 120_000, requiredAccuracy: 250 });
    if (!location) return helpMessage;
    const { latitude, longitude } = location.coords;
    return `${helpMessage}\nUbicación reciente: https://maps.google.com/?q=${latitude},${longitude}`;
  } catch {
    return helpMessage;
  }
}

export async function requestRecentLocation() {
  if (Platform.OS !== 'android' || !(await Location.getForegroundPermissionsAsync()).granted) return;
  await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
}

export async function sendHelpSms(phone: string, message: string) {
  if (Platform.OS !== 'android' || !(await PermissionsAndroid.check(SEND_SMS))) return false;
  const module = requireOptionalNativeModule<{ sendSms(phone: string, message: string): Promise<void> }>('CuidadoSos');
  if (!module) return false;
  await module.sendSms(phone, message);
  return true;
}

export async function openHelpSms(phone: string, message: string) {
  if (Platform.OS === 'android') {
    await startActivityAsync('android.intent.action.SENDTO', { data: `smsto:${phone}`, extra: { sms_body: message } });
  } else {
    await Linking.openURL(`sms:${phone}?body=${encodeURIComponent(message)}`);
  }
}

export async function openSosCall(phone: string, direct: boolean, onDialer: () => void) {
  if (direct && Platform.OS === 'android' && await PermissionsAndroid.check(CALL_PHONE)) {
    try {
      await startActivityAsync('android.intent.action.CALL', { data: `tel:${phone}` });
      return;
    } catch {
      // Keep the dialer available if Android rejects direct calls.
    }
  }
  await Linking.openURL(`tel:${phone}`);
  onDialer();
}


export async function openHelpWhatsApp(phone: string, message: string) {
  const digits = phone.replace(/\D/g, '');
  const international = !phone.startsWith('+') && /^9\d{8}$/.test(digits) ? '51' + digits : digits;
  if (!/^\d{8,15}$/.test(international)) throw new Error('Guarda el número de WhatsApp con código de país.');
  await Linking.openURL(`https://wa.me/${international}?text=${encodeURIComponent(message)}`);
}
