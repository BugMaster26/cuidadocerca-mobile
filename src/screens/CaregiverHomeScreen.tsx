import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { AccessibleCard, EmptyState, NativePage, PrimaryButton, SecondaryButton, SectionHeader } from '../ui/NativeScreens';
import { colors } from '../ui/theme';

export function CaregiverHomeScreen() {
  return <NativePage title="Acompaña a tu manera" intro="Organiza el cuidado y consulta solo la información que una persona mayor te autorice.">
    <View style={s.note}><Text style={s.noteTitle}>Tu espacio de familiar</Text><Text style={s.noteBody}>La experiencia familiar funciona independientemente. En esta instalación todavía no hay cuentas vinculadas ni datos compartidos.</Text></View>
    <EmptyState title="Aún no hay personas vinculadas" body="Las actividades, citas y datos de salud solo aparecerán después de una autorización explícita y una vinculación de cuentas." />
    <SectionHeader title="Accesos" />
    <AccessibleCard title="Actividades compartidas" body="Consulta compromisos que la persona mayor haya autorizado." icon="◷"><SecondaryButton label="Abrir actividades" onPress={() => router.push('/(caregiver)/activities')} /></AccessibleCard>
    <AccessibleCard title="Solicitudes" body="Responde cuando una solicitud llegue a una cuenta vinculada." icon="♡"><SecondaryButton label="Ver solicitudes" onPress={() => router.push('/(caregiver)/requests')} /></AccessibleCard>
    <AccessibleCard title="Documentos autorizados" body="Los documentos privados no se muestran automáticamente." icon="▣"><SecondaryButton label="Abrir documentos" onPress={() => router.push('/(caregiver)/documents')} /></AccessibleCard>
    <AccessibleCard title="Resumen de cuidado" body="El resumen incluirá únicamente datos autorizados y sincronizados." icon="▤"><PrimaryButton label="Ver resumen" onPress={() => router.push('/(caregiver)/summary')} /></AccessibleCard>
  </NativePage>;
}

const s = StyleSheet.create({ note: { padding: 16, gap: 5, borderRadius: 16, backgroundColor: '#F6EEE9' }, noteTitle: { color: colors.primary, fontSize: 17, fontWeight: '700', fontFamily: 'Poppins_700Bold' }, noteBody: { color: colors.muted, fontSize: 15, lineHeight: 22 } });
