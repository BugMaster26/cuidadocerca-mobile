import { useScaledStyles } from './useScaledStyles';
import Svg, { Path } from 'react-native-svg';
import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { AppState, Linking, Modal, PermissionsAndroid, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from './theme';

let activeSession: symbol | null = null;

export function VoiceAssistant({ label = 'Dictar información', onTranscript, friendlyErrors = false }: { label?: string; friendlyErrors?: boolean; onTranscript: (text: string) => void }) {
  const s = useScaledStyles(baseStyles);
  const session = useRef(Symbol());
  const delivered = useRef(false);
  const attempts = useRef(0);
  const generation = useRef(0);
  const checkingPermission = useRef(false);
  const [showHelp, setShowHelp] = useState(false);
  const watchdog = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ownsSession = () => activeSession === session.current;
  const [recognizing, setRecognizing] = useState(false);
  const [status, setStatus] = useState('');
  const release = useCallback((abort = false) => {
    if (activeSession !== session.current) return;
    activeSession = null;
    generation.current++;
    checkingPermission.current = false;
    if (watchdog.current) clearTimeout(watchdog.current);
    watchdog.current = null;
    setRecognizing(false);
    if (abort) {
      try { ExpoSpeechRecognitionModule.abort(); } catch { /* Native service unavailable. */ }
    }
  }, []);
  useFocusEffect(useCallback(() => {
    const listener = AppState.addEventListener('change', state => {
      if (state === 'background' && !checkingPermission.current) release(true);
    });
    return () => { listener.remove(); release(true); };
  }, [release]));
  function timeout(ms: number, message = 'El dictado se detuvo. Pulsa para reintentarlo.') {
    if (watchdog.current) clearTimeout(watchdog.current);
    watchdog.current = setTimeout(() => {
      release(true);
      setStatus(message);
    }, ms);
  }
  useSpeechRecognitionEvent('start', () => { if (!ownsSession()) return; timeout(30000); setRecognizing(true); setStatus('Escuchando. Puedes detener cuando termines.'); });
  useSpeechRecognitionEvent('end', () => { if (!ownsSession()) return; release(); setStatus(delivered.current ? 'Transcripción lista para revisar.' : 'Puedes volver a dictar o escribir.'); });
  useSpeechRecognitionEvent('result', event => {
    const text = event.results[0]?.transcript?.trim();
    if (ownsSession() && event.isFinal && text && !delivered.current) {
      delivered.current = true;
      attempts.current = 0;
      timeout(4000);
      setStatus('Transcripción lista para revisar.');
      onTranscript(text);
    }
  });
  useSpeechRecognitionEvent('error', event => {
    if (!ownsSession()) return;
    release();
    if (event.error === 'not-allowed') setShowHelp(true);
    setStatus(event.error === 'no-speech' ? 'No se detectó voz. Acércate al micrófono y vuelve a pulsar.' : friendlyErrors ? 'No pudimos completar la búsqueda por voz. Vuelve a intentarlo o escribe lo que necesitas.' : 'No se pudo iniciar o completar el dictado (' + event.error + '). Pulsa para reintentar.');
  });
  const start = async () => {
    if (activeSession) { setStatus('Hay otro dictado en curso. Detenlo antes de empezar otro.'); return; }
    activeSession = session.current;
    delivered.current = false;
    const request = ++generation.current;
    setStatus('Comprobando el micrófono…');
    checkingPermission.current = true;
    timeout(15000, 'Android no respondió a la comprobación del micrófono. Revisa el permiso y vuelve a intentar.');
    try {
      const microphone = 'android.permission.RECORD_AUDIO';
      const granted = Platform.OS === 'android'
        ? await PermissionsAndroid.check(microphone) || await PermissionsAndroid.request(microphone) === 'granted'
        : (await ExpoSpeechRecognitionModule.requestPermissionsAsync()).granted;
      if (!ownsSession() || generation.current !== request) return;
      checkingPermission.current = false;
      if (!granted) { release(); setStatus('Permiso de micrófono pendiente.'); setShowHelp(true); return; }
      setRecognizing(true);
      timeout(10000, 'El servicio de voz no respondió al iniciar. Pulsa para reintentar.');
      setStatus('Preparando reconocimiento en español…');
      const services = Platform.OS === 'android' ? ExpoSpeechRecognitionModule.getSpeechRecognitionServices() : [];
      const defaultService = Platform.OS === 'android' ? ExpoSpeechRecognitionModule.getDefaultRecognitionService().packageName : null;
      if (!ExpoSpeechRecognitionModule.isRecognitionAvailable() && services.length === 0) {
        release();
        setStatus('El teléfono no tiene un servicio de reconocimiento disponible. Revisa el servicio de voz en los ajustes de Android.');
        return;
      }
      const alternative = services.find(service => service !== defaultService);
      const attempt = attempts.current++;
      const provider = attempt % 2 === 1 ? alternative : undefined;
      ExpoSpeechRecognitionModule.start({
        lang: attempt % 2 === 1 ? 'es-ES' : 'es-PE',
        interimResults: false, continuous: false, maxAlternatives: 1,
        ...(provider ? { androidRecognitionServicePackage: provider } : {}),
      });
    } catch {
      if (!ownsSession() || generation.current !== request) return;
      release(true);
      setStatus('No se pudo abrir el servicio de voz. Pulsa para reintentar o escribe la información.');
    }
  };
  const stop = () => { try { ExpoSpeechRecognitionModule.stop(); timeout(4000); setStatus('Procesando transcripción…'); } catch { release(true); setStatus('Pulsa para volver a dictar.'); } };
  return <>
    <Pressable accessibilityRole="button" accessibilityState={{ busy: recognizing }} onPress={() => void (recognizing ? stop() : start())} style={({ pressed }) => [s.button, recognizing && s.listening, pressed && { opacity: 0.8 }]}><Svg width={23} height={23} viewBox="0 0 24 24" accessibilityElementsHidden><Path d={recognizing ? 'M6 6h12v12H6Z' : 'M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0Z M5 10v2a7 7 0 0 0 14 0v-2 M12 19v3m-4 0h8'} fill={recognizing ? colors.primary : 'none'} stroke={colors.primary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg><Text style={s.label}>{recognizing ? 'Detener dictado' : label}</Text></Pressable>
    {!!status && <Text accessibilityLiveRegion="polite" style={s.status}>{status}</Text>}
    <Modal visible={showHelp} transparent animationType="none" onRequestClose={() => setShowHelp(false)}>
      <View style={s.overlay}>
        <View accessibilityViewIsModal style={s.dialog}>
          <ScrollView style={s.dialogScroll} contentContainerStyle={s.dialogContent}>
          <Text style={s.dialogEyebrow}>DICTADO POR VOZ</Text>
          <Text accessibilityRole="header" style={s.dialogTitle}>Activa el micrófono</Text>
          <Text style={s.dialogText}>{Platform.OS === 'web'
            ? 'Permite el micrófono para este sitio si tu navegador admite el reconocimiento de voz.'
            : 'En Android, abre Ajustes → Aplicaciones → CuidadoCerca → Permisos → Micrófono. Elige «Permitir solo mientras se usa la aplicación».'}</Text>
          {Platform.OS === 'android' && <Text style={s.dialogText}>Si ya lo permitiste, verifica que Android tenga habilitado el acceso general al micrófono y un servicio de reconocimiento en español.</Text>}
          </ScrollView>
          {Platform.OS !== 'web' && <Pressable accessibilityRole="button" style={[s.button, s.dialogPrimary]} onPress={() => {
            setShowHelp(false);
            void Linking.openSettings().catch(() => setStatus('Abre los ajustes de CuidadoCerca desde Android.'));
          }}><Text style={[s.label, s.dialogPrimaryLabel]}>Abrir ajustes</Text></Pressable>}
          <Pressable accessibilityRole="button" style={s.button} onPress={() => setShowHelp(false)}><Text style={s.label}>Cerrar</Text></Pressable>
        </View>
      </View>
    </Modal>
  </>;
}

const baseStyles = StyleSheet.create({
  overlay: { flex: 1, padding: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#25323899' },
  dialog: { backgroundColor: colors.white, width: '100%', maxWidth: 460, maxHeight: '90%', borderRadius: 24, padding: 20, gap: 10, borderWidth: 1, borderColor: colors.border },
  dialogScroll: { flexShrink: 1 },
  dialogContent: { gap: 10, paddingBottom: 8 },
  dialogEyebrow: { color: colors.primary, fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  dialogPrimary: { backgroundColor: colors.primary },
  dialogPrimaryLabel: { color: colors.white },
  dialogTitle: { fontSize: 22, fontFamily: 'Poppins_600SemiBold', color: colors.ink },
  dialogText: { fontSize: 16, lineHeight: 24, color: colors.ink },
  button: { minHeight: 52, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: 15, borderRadius: 14, backgroundColor: colors.surfaceAlt }, listening: { backgroundColor: '#FFE1D9', borderWidth: 1, borderColor: colors.accent }, icon: { color: colors.primary, fontSize: 18, fontWeight: '700' }, label: { flexShrink: 1, textAlign: 'center', color: colors.primary, fontSize: 16, fontWeight: '700', fontFamily: 'Poppins_600SemiBold' }, status: { color: colors.muted, fontSize: 14, lineHeight: 20, fontFamily: 'Poppins_400Regular' } });








