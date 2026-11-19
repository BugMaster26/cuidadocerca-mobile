import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccessibility } from '../../src/accessibility/AccessibilityContext';
import { colors } from '../../src/ui/theme';

const entries = [['index', 'Inicio', '⌂'], ['day', 'Mi día', '◷'], ['health', 'Mi salud', '✚'], ['family', 'Mi familia', '♡'], ['profile', 'Perfil', '◉']];
export default function SeniorTabs() {
  const { textScale } = useAccessibility();
  const { bottom } = useSafeAreaInsets();
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.muted, tabBarLabelStyle: { fontSize: 12, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' }, tabBarActiveBackgroundColor: colors.surfaceAlt, tabBarItemStyle: { borderRadius: 12, marginHorizontal: 2, minHeight: 48 }, tabBarIconStyle: { marginTop: 4 }, tabBarStyle: { height: 72 + Math.max(0, textScale - 1) * 44 + Math.max(8, bottom), minHeight: 68, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 5, paddingBottom: Math.max(8, bottom), backgroundColor: colors.white, borderTopColor: colors.border }, sceneStyle: { backgroundColor: colors.white } }}>
    {entries.map(([name, title, icon]) => <Tabs.Screen key={name} name={name} options={{ title, tabBarAccessibilityLabel: title, tabBarLabel: ({ color }) => <Text style={{ color, fontFamily: 'Poppins_600SemiBold', fontSize: 11 * textScale, lineHeight: 15 * textScale, textAlign: 'center' }}>{title}</Text>, tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>{icon}</Text> }} />)}
  </Tabs>;
}


