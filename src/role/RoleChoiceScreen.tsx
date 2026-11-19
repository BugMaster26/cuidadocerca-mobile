import { router, usePathname } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRole, type CareRole } from './RoleContext';
import { AppHeader } from '../ui/NativeScreens';
import { SosFooterWaves } from '../ui/CareVisuals';
import { DesignIcon } from '../ui/DesignIcon';
import { useAccessibility } from '../accessibility/AccessibilityContext';
import { Alert } from '../ui/AppAlert';

export function RoleChoiceScreen() {
  const { chooseRole, role } = useRole();
  const access = useAccessibility();
  const changing = usePathname() === '/experience';
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const select = async (next: CareRole) => {
    if (busy) return;
    setBusy(true);
    try { await chooseRole(next); router.dismissTo(next === 'older-adult' ? '/(senior)' : '/(caregiver)'); }
    catch { Alert.alert('No se pudo cambiar la experiencia', 'Inténtalo nuevamente.'); }
    finally { setBusy(false); }
  };
  return <ScrollView contentContainerStyle={[s.page, { paddingTop: Math.max(insets.top, 14), paddingBottom: Math.max(insets.bottom, 18), backgroundColor: access.highContrast ? '#FFFFFF' : '#F7F9F8' }]} keyboardShouldPersistTaps="handled">
    <AppHeader showSos={false} />
    <View style={s.hero}><Text style={s.eyebrow}>CUIDADO COMPARTIDO</Text><Image source={require('../../assets/abuelitos-transparente.png')} resizeMode="contain" accessible={false} style={s.illustration} /></View>
    <Text accessibilityRole="header" style={[s.title, { fontSize: 29 * access.textScale, lineHeight: 38 * access.textScale }]}>¿Cómo quieres usar CuidadoCerca?</Text>
    <Text style={[s.copy, { fontSize: 17 * access.textScale, lineHeight: 26 * access.textScale }]}>Elige tu experiencia. Puedes cambiarla después desde tu perfil.</Text>
    {([
      ['older-adult', 'Soy una persona mayor', 'Una vista sencilla para mi día, mi salud y mi familia.', 'sun'],
      ['caregiver', 'Soy familiar o cuidador', 'Una vista para organizar y acompañar con autorización.', 'users'],
    ] as const).map(([value, title, detail, icon]) => <Pressable key={value} accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ selected: role === value, disabled: busy }} aria-pressed={role === value} disabled={busy} onPress={() => void select(value)} style={({ pressed }) => [s.card, role === value && s.selected, access.highContrast && { borderColor: '#000000', borderWidth: 2 }, pressed && { opacity: 0.8 }]}>
      <View style={s.icon}><DesignIcon name={icon} color={icon === 'sun' ? '#D99B00' : '#126B62'} size={38} /></View>
      <View style={{ flex: 1, gap: 6 }}><Text style={[s.cardTitle, { fontSize: 21 * access.textScale }]}>{title}</Text><Text style={[s.copy, { fontSize: 16 * access.textScale, lineHeight: 24 * access.textScale }]}>{detail}</Text></View>
      {role === value ? <View style={s.check}><DesignIcon name="check" size={20} color="#FFFFFF" /></View> : <DesignIcon name="arrowRight" size={22} />}
    </Pressable>)}
    <View style={{ gap: 12, marginTop: 6 }}>
      {changing && <Pressable accessibilityRole="button" onPress={() => router.back()} disabled={busy} style={s.outline}><Text style={s.buttonText}>Cancelar cambio</Text></Pressable>}
      <Pressable accessibilityRole="button" onPress={() => router.push('/help')} style={s.outline}><DesignIcon name="headphones" /><Text style={s.buttonText}>Ayuda y accesibilidad</Text></Pressable>
    </View>
    <Text style={s.note}>La experiencia se guarda en este dispositivo. Los registros y permisos permanecen locales.</Text>
    <View style={{ marginTop: 'auto', marginHorizontal: -22, marginBottom: -Math.max(insets.bottom, 18) }}><SosFooterWaves /></View>
  </ScrollView>;
}
const s = StyleSheet.create({
  page: { flexGrow: 1, paddingHorizontal: 22, gap: 17 },
  hero: { minHeight: 78, justifyContent: 'center', marginTop: 7 },
  eyebrow: { color: '#126B62', fontFamily: 'Poppins_700Bold', fontSize: 13, letterSpacing: 1 },
  illustration: { width: 113, height: 86, position: 'absolute', right: -6, top: 0 },
  title: { color: '#253238', fontFamily: 'Poppins_700Bold' },
  copy: { color: '#52636B', fontFamily: 'Poppins_400Regular' },
  card: { minHeight: 145, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderWidth: 1, borderColor: '#DCE7E4', borderRadius: 22, backgroundColor: '#FFFFFF' },
  selected: { backgroundColor: '#E6F4F1', borderColor: '#167B70', borderWidth: 1.5 },
  icon: { width: 56, height: 64, alignItems: 'center', justifyContent: 'center', borderRadius: 19, backgroundColor: '#D5F4E8' },
  cardTitle: { color: '#253238', fontFamily: 'Poppins_700Bold' },
  check: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#167B70', alignItems: 'center', justifyContent: 'center' },
  outline: { minHeight: 56, padding: 12, gap: 11, borderRadius: 17, borderWidth: 1.5, borderColor: '#167B70', backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#126B62', fontFamily: 'Poppins_700Bold', fontSize: 17 },
  note: { color: '#52636B', fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 20 },
});
