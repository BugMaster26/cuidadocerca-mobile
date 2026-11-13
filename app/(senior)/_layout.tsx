import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '../../src/ui/theme';

const entries = [['index', 'Inicio', '⌂'], ['day', 'Mi día', '◷'], ['health', 'Mi salud', '✚'], ['family', 'Mi familia', '♡'], ['profile', 'Perfil', '◉']];
export default function SeniorTabs() {
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.muted, tabBarLabelStyle: { fontSize: 12, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' }, tabBarIconStyle: { marginTop: 4 }, tabBarStyle: { minHeight: 68, paddingTop: 5, paddingBottom: 4, backgroundColor: colors.white, borderTopColor: colors.border }, sceneStyle: { backgroundColor: colors.canvas } }}>
    {entries.map(([name, title, icon]) => <Tabs.Screen key={name} name={name} options={{ title, tabBarAccessibilityLabel: title, tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>{icon}</Text> }} />)}
    <Tabs.Screen name="capture" options={{ href: null }} />
  </Tabs>;
}
