import { useState } from 'react';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import { colors } from './theme';

export function VoiceAssistant({ label = 'Dictar información', onTranscript }: { label?: string; onTranscript: (text: string) => void }) {
  const [recognizing, setRecognizing] = useState(false);
  const [status, setStatus] = useState('Listo para escuchar cuando pulses el botón.');
  useSpeechRecognitionEvent('start', () => { setRecognizing(true); setStatus('Escuchando. Puedes detener cuando termines.'); });
  useSpeechRecognitionEvent('end', () => { setRecognizing(false); setStatus('Transcripción lista para revisar.'); });
  useSpeechRecognitionEvent('result', event => {
    const text = event.results[0]?.transcript?.trim();
    if (text) onTranscript(text);
  });
  useSpeechRecognitionEvent('error', event => {
    setRecognizing(false);
    setStatus('No se pudo reconocer la voz. Puedes escribir la información.');
    if (event.error !== 'aborted' && event.error !== 'no-speech') Alert.alert('Dictado no disponible', 'Comprueba que el teléfono tenga un servicio de reconocimiento de voz y vuelve a intentarlo o escribe la información.');
  });
  const start = async () => {
    try {
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) { setStatus('Permiso de micrófono denegado. Puedes escribir la información.'); return; }
      setStatus('Preparando reconocimiento en español…');
      ExpoSpeechRecognitionModule.start({ lang: 'es-PE', interimResults: true, continuous: false, maxAlternatives: 1 });
    } catch {
      setRecognizing(false);
      setStatus('El reconocimiento requiere una versión nativa instalada. Puedes escribir la información.');
    }
  };
  const stop = () => { ExpoSpeechRecognitionModule.stop(); setStatus('Procesando transcripción…'); };
  return <>
    <Pressable accessibilityRole="button" accessibilityState={{ busy: recognizing }} onPress={() => void (recognizing ? stop() : start())} style={({ pressed }) => [s.button, recognizing && s.listening, pressed && { opacity: 0.8 }]}><Text style={s.icon}>{recognizing ? '■' : '●'}</Text><Text style={s.label}>{recognizing ? 'Detener dictado' : label}</Text></Pressable>
    <Text accessibilityLiveRegion="polite" style={s.status}>{status}</Text>
  </>;
}

const s = StyleSheet.create({ button: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: 15, borderRadius: 14, backgroundColor: colors.surfaceAlt }, listening: { backgroundColor: '#FFE1D9', borderWidth: 1, borderColor: colors.accent }, icon: { color: colors.primary, fontSize: 18, fontWeight: '700' }, label: { color: colors.primary, fontSize: 16, fontWeight: '700', fontFamily: 'Poppins_600SemiBold' }, status: { color: colors.muted, fontSize: 14, lineHeight: 20, fontFamily: 'Poppins_400Regular' } });
