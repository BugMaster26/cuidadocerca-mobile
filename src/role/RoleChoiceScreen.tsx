import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRole, type CareRole } from './RoleContext';
import { colors, typeScale } from '../ui/theme';

export function RoleChoiceScreen() {
  const { chooseRole } = useRole();
  const insets = useSafeAreaInsets();
  const select = async (role: CareRole) => { await chooseRole(role); router.replace(role === 'older-adult' ? '/(senior)' : '/(caregiver)'); };
  return <ScrollView contentContainerStyle={[s.page, { paddingTop: Math.max(insets.top, 24) + 20, paddingBottom: Math.max(insets.bottom, 20) + 24 }]}>
    <View style={s.brand}><View style={s.brandMark}><Text style={s.brandHeart}>♡</Text></View><Text style={s.brandName}>CuidadoCerca</Text></View>
    <Text style={s.eyebrow}>CUIDADO COMPARTIDO</Text><Text accessibilityRole="header" style={s.title}>¿Cómo quieres usar CuidadoCerca?</Text>
    <Text style={s.copy}>Elige tu experiencia. Puedes cambiarla después desde tu perfil.</Text>
    <RoleCard icon="☀" title="Soy una persona mayor" detail="Una vista sencilla para mi día, mi salud y mi familia." onPress={() => void select('older-adult')} />
    <RoleCard icon="♡" title="Soy familiar o cuidador" detail="Una vista para organizar y acompañar con autorización." onPress={() => void select('caregiver')} />
    <View style={s.note}><Text style={s.noteText}>Esta primera etapa guarda la preferencia de rol solo en este dispositivo. No crea cuentas ni sincroniza información.</Text></View>
  </ScrollView>;
}
function RoleCard({ icon, title, detail, onPress }: { icon: string; title: string; detail: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [s.card, pressed && s.pressed]}><View style={s.icon}><Text style={s.iconText}>{icon}</Text></View><View style={s.cardText}><Text style={s.cardTitle}>{title}</Text><Text style={s.cardDetail}>{detail}</Text></View><Text style={s.arrow}>›</Text></Pressable>;
}
const s = StyleSheet.create({ page: { flexGrow: 1, paddingHorizontal: 24, gap: 14, backgroundColor: colors.canvas }, brand: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 32 }, brandMark: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary }, brandHeart: { color: colors.white, fontSize: 26 }, brandName: { color: colors.ink, fontSize: 19, fontWeight: '700', fontFamily: 'Poppins_700Bold' }, eyebrow: { color: colors.accent, fontSize: 14, fontWeight: '700', letterSpacing: 1, fontFamily: 'Poppins_700Bold' }, title: { color: colors.ink, fontSize: typeScale.title, lineHeight: 36, fontWeight: '700', fontFamily: 'Poppins_700Bold' }, copy: { color: colors.muted, fontSize: typeScale.body, lineHeight: 27, marginBottom: 10, fontFamily: 'Poppins_400Regular' }, card: { minHeight: 112, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderWidth: 1, borderColor: colors.border, borderRadius: 18, backgroundColor: colors.white }, pressed: { backgroundColor: colors.surfaceAlt, transform: [{ scale: 0.99 }] }, icon: { width: 54, height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: colors.surfaceAlt }, iconText: { color: colors.primary, fontSize: 28 }, cardText: { flex: 1, gap: 5 }, cardTitle: { color: colors.ink, fontSize: typeScale.subtitle, fontWeight: '700', fontFamily: 'Poppins_700Bold' }, cardDetail: { color: colors.muted, fontSize: typeScale.bodySmall, lineHeight: 22, fontFamily: 'Poppins_400Regular' }, arrow: { color: colors.primary, fontSize: 30 }, note: { marginTop: 'auto', padding: 14, borderRadius: 12, backgroundColor: colors.surfaceAlt }, noteText: { color: colors.ink, fontSize: 14, lineHeight: 20, fontFamily: 'Poppins_400Regular' } });
