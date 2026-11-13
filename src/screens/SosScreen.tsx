import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { type EmergencyContactRow } from '../data/database';
import { AccessibleCard, EmptyState, NativePage, PrimaryButton, SecondaryButton, SectionHeader } from '../ui/NativeScreens';
import { VoiceAssistant } from '../ui/VoiceAssistant';
import { colors } from '../ui/theme';

export function SosScreen() {
  const db = useSQLiteContext();
  const [contact, setContact] = useState<EmergencyContactRow | null>(null);
  const [command, setCommand] = useState('');
  const load = useCallback(async () => setContact(await db.getFirstAsync<EmergencyContactRow>('SELECT * FROM emergency_contacts ORDER BY id LIMIT 1')), [db]);
  useEffect(() => { void load(); }, [load]);

  const openDialer = () => {
    if (!contact) { router.push('/(senior)/profile'); return; }
    Alert.alert('Confirmar llamada', `Se abrirá el marcador para llamar a ${contact.name}. La llamada no se iniciará hasta que la confirmes en el teléfono.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Abrir marcador', onPress: () => { void Linking.openURL(`tel:${contact.phone}`).catch(() => Alert.alert('No se pudo abrir el teléfono', 'Comprueba que el dispositivo permite realizar llamadas.')); } },
    ]);
  };

  const onVoice = (text: string) => {
    setCommand(text);
    const normalized = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-PE');
    if (/(ayuda|auxilio|emergencia|socorro)/.test(normalized)) {
      if (contact) Alert.alert('Escuché una solicitud de ayuda', `¿Quieres abrir el marcador para llamar a ${contact.name}?`, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Abrir marcador', onPress: () => void Linking.openURL(`tel:${contact.phone}`).catch(() => Alert.alert('No se pudo abrir el teléfono', 'Comprueba que el dispositivo permite realizar llamadas.')) }]);
      else Alert.alert('Escuché una solicitud de ayuda', 'Primero guarda un contacto SOS desde Perfil.');
    }
  };

  return <NativePage title="Pedir ayuda" intro="Usa el botón o dicta una palabra de ayuda. Siempre podrás cancelar antes de llamar.">
    <View style={s.alertHeader}><Text style={s.alertSymbol}>!</Text><Text style={s.alertTitle}>Tu seguridad importa</Text></View>
    {contact ? <AccessibleCard title="Contacto de emergencia" body={`${contact.name}${contact.relationship ? ` · ${contact.relationship}` : ''} · ${contact.phone}`} /> : <EmptyState title="Aún no guardaste un contacto SOS" body="Añade a una persona de confianza desde Perfil para que CuidadoCerca pueda abrir el marcador con su número." action="Configurar contacto SOS" onAction={() => router.push('/(senior)/profile')} />}
    <PrimaryButton label={contact ? `Llamar a ${contact.name}` : 'Configurar contacto'} onPress={openDialer} />
    <Text style={s.note}>La llamada se realiza desde la aplicación Teléfono. CuidadoCerca no llama automáticamente ni envía mensajes o ubicación.</Text>
    <SectionHeader title="Asistencia por voz" />
    <AccessibleCard title="Escucha solo cuando tú pulsas" body="Dicta “ayuda”, “auxilio” o “emergencia”. El reconocimiento se detiene al terminar y pide confirmación antes de abrir el marcador." />
    <VoiceAssistant label="Hablar para pedir ayuda" onTranscript={onVoice} />
    {!!command && <View style={s.transcript}><Text style={s.transcriptLabel}>Transcripción para revisar</Text><Text style={s.transcriptText}>{command}</Text></View>}
    <SecondaryButton label="Volver sin llamar" onPress={() => router.back()} />
    <Text style={s.footnote}>El comando por voz funciona solo con la aplicación abierta, permiso concedido y un servicio de reconocimiento disponible. No funciona como escucha permanente en segundo plano.</Text>
  </NativePage>;
}

const s = StyleSheet.create({ alertHeader: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, backgroundColor: '#FFF1EC', borderRadius: 17, borderWidth: 1, borderColor: '#E8B9AA' }, alertSymbol: { width: 42, height: 42, textAlign: 'center', textAlignVertical: 'center', borderRadius: 15, backgroundColor: '#A12D20', color: colors.white, fontSize: 27, fontWeight: '700' }, alertTitle: { flex: 1, color: '#6F221A', fontSize: 19, fontWeight: '700', fontFamily: 'Poppins_700Bold' }, note: { color: colors.muted, fontSize: 14, lineHeight: 21 }, transcript: { padding: 14, borderRadius: 14, backgroundColor: colors.surfaceAlt, gap: 5 }, transcriptLabel: { color: colors.primary, fontSize: 14, fontWeight: '700', fontFamily: 'Poppins_600SemiBold' }, transcriptText: { color: colors.ink, fontSize: 17, lineHeight: 24 }, footnote: { color: colors.muted, fontSize: 13, lineHeight: 19 } });
