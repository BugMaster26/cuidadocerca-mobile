import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { NativePage, SectionHeader } from '../ui/NativeScreens';
import { DesignIcon } from '../ui/DesignIcon';
import { SosFooterWaves } from '../ui/CareVisuals';
import { useAccessibility } from '../accessibility/AccessibilityContext';

const modules = [
  { title: 'Actividades compartidas', icon: 'calendar', route: '/(caregiver)/activities' },
  { title: 'Solicitudes', icon: 'heart', route: '/(caregiver)/requests' },
  { title: 'Documentos autorizados', icon: 'file', route: '/(caregiver)/documents' },
  { title: 'Medicamentos', icon: 'pill', route: '/(caregiver)/medicines' },
  { title: 'Directorio de trámites y servicios', icon: 'location', route: '/services' },
  { title: 'Resumen de cuidado', icon: 'chart', route: '/(caregiver)/summary' },
] as const;
export function CaregiverHomeScreen() {
  const { textScale, highContrast } = useAccessibility();
  const { width, fontScale } = useWindowDimensions();
  const singleColumn = width < 600 && textScale * fontScale > 1.1;
  const threeColumns = width >= 700 && textScale <= 1.15;
  return <NativePage compactHeader title="Acompaña a tu manera" intro="">
    <View style={s.hero}><Text style={s.eyebrow}>ESPACIO FAMILIAR</Text><View style={s.heroRow}><Text accessibilityRole="header" style={[s.title, { fontSize: 28 * textScale, lineHeight: 37 * textScale }]}>Acompaña a tu manera</Text><Image source={require('../../assets/abuelitos-transparente.png')} resizeMode="contain" accessible={false} style={s.illustration} /></View><Text style={[s.copy, { fontSize: 17 * textScale, lineHeight: 26 * textScale }]}>Organiza el cuidado y consulta solo la información que una persona mayor te autorice.</Text></View>
    <View style={[s.welcome, highContrast && { backgroundColor: '#FFFFFF', borderColor: '#000000', borderWidth: 2 }]}><View style={s.welcomeIcon}><DesignIcon name="users" size={34} /></View><View style={{ flex: 1 }}><Text style={[s.welcomeTitle, { fontSize: 20 * textScale }]}>Tu espacio de familiar</Text><Text style={[s.copy, { fontSize: 15 * textScale, lineHeight: 24 * textScale }]}>Consulta los registros autorizados y responde a solicitudes guardadas en este teléfono.</Text></View></View>
    <SectionHeader title="Accesos rápidos" />
    <View style={s.grid}>{modules.map(item => <Pressable key={item.title} accessibilityRole="button" accessibilityLabel={item.title} onPress={() => router.push(item.route)} style={({ pressed }) => [s.card, { width: singleColumn ? '100%' : threeColumns ? '31.5%' : '47.5%' }, highContrast && { borderColor: '#000000', borderWidth: 2 }, pressed && { backgroundColor: '#E6F4F1', opacity: 0.8 }]}>
      <View style={s.moduleIcon}><DesignIcon name={item.icon} size={38} /></View><Text style={[s.cardTitle, { fontSize: 17 * textScale }]}>{item.title}</Text>
    </Pressable>)}</View>
    <View style={{ marginTop: 'auto', marginHorizontal: -20, marginBottom: -28, paddingTop: 22 }}><SosFooterWaves /></View>
  </NativePage>;
}
const s = StyleSheet.create({
  hero: { gap: 11 }, eyebrow: { color: '#126B62', fontFamily: 'Poppins_700Bold', fontSize: 13, letterSpacing: 1 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, title: { flex: 1, color: '#253238', fontFamily: 'Poppins_700Bold' },
  illustration: { width: '35%', height: 110 }, copy: { color: '#52636B', fontFamily: 'Poppins_400Regular' },
  welcome: { padding: 17, flexDirection: 'row', alignItems: 'center', gap: 13, borderRadius: 22, backgroundColor: '#E6F4F1' },
  welcomeIcon: { backgroundColor: '#D5F4E8', width: 55, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  welcomeTitle: { fontFamily: 'Poppins_700Bold', color: '#253238', marginBottom: 7 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  card: { padding: 12, borderRadius: 19, borderWidth: 1, borderColor: '#DCE7E4', backgroundColor: '#FFFFFF', alignItems: 'center', gap: 12 },
  moduleIcon: { width: 62, height: 62, borderRadius: 18, backgroundColor: '#E6F4F1', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { color: '#253238', fontFamily: 'Poppins_700Bold', textAlign: 'center', minHeight: 48 },
});

