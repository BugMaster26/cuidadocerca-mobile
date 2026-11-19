import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { router } from 'expo-router';
import { useAccessibility } from '../accessibility/AccessibilityContext';
import { DesignIcon } from './DesignIcon';

export function FamilySectionHeading({ title, description, icon }: { title: string; description: string; icon: 'calendar' | 'file' | 'users' | 'pill' | 'chart' }) {
  const { textScale } = useAccessibility();
  const { width } = useWindowDimensions();
  const artWidth = Math.max(54, 108 / textScale - (width < 360 ? 20 : 0));
  return <>
    <Text style={s.eyebrow}>ESPACIO FAMILIAR</Text>
    <View style={s.hero}>
      <View style={{ flex: 1, gap: 10 }}><Pressable accessibilityRole="button" accessibilityLabel="Volver al inicio familiar" onPress={() => router.navigate('/(caregiver)')} style={({ pressed }) => [s.back, pressed && { opacity: 0.7 }]}><DesignIcon name="arrowLeft" /></Pressable><Text accessibilityRole="header" style={[s.title, { fontSize: 28 * textScale, lineHeight: 37 * textScale }]}>{title}</Text></View>
      <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[s.art, { width: artWidth }]}><Svg width="100%" height="100%" viewBox="0 0 150 150" style={{ position: 'absolute' }}><Path d="M24 20C56-3 130 6 141 51S137 124 101 136 0 147 11 102 0 46 24 20Z" fill="#D5F4E8" /></Svg><View style={{ zIndex: 1 }}><DesignIcon name={icon} size={Math.min(76, artWidth - 8)} /></View>{icon === 'users' && <View style={s.heart}><DesignIcon name="heart" size={32} /></View>}</View>
    </View>
    <Text style={[s.description, { fontSize: 17 * textScale, lineHeight: 26 * textScale }]}>{description}</Text>
  </>;
}
const s = StyleSheet.create({
  eyebrow: { color: '#126B62', fontFamily: 'Poppins_700Bold', fontSize: 12, letterSpacing: 1 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: '#253238', fontFamily: 'Poppins_700Bold' },
  back: { width: 48, minHeight: 48, borderRadius: 24, backgroundColor: '#D5F4E8', alignItems: 'center', justifyContent: 'center' },
  art: { width: 108, height: 128, alignItems: 'center', justifyContent: 'center' },
  heart: { position: 'absolute', zIndex: 2, top: 0, alignSelf: 'center', padding: 4, backgroundColor: '#E6F4F1', borderRadius: 20 },
  description: { color: '#52636B', fontFamily: 'Poppins_400Regular' },
});
