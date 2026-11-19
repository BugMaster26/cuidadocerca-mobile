import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccessibility } from '../../src/accessibility/AccessibilityContext';
import { CaregiverTabButton } from '../../src/ui/CaregiverTabButton';
import { colors } from '../../src/ui/theme';
const entries = [
  ['index', 'Inicio', 'home'], ['activities', 'Actividades', 'calendarPlain'], ['requests', 'Solicitudes', 'heart'], ['documents', 'Documentos', 'file'], ['profile', 'Perfil', 'person'],
] as const;
export default function CaregiverTabs() {
  const insets = useSafeAreaInsets();
  const { textScale } = useAccessibility();
  const bottom = Math.max(8, insets.bottom);
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#167B70', tabBarInactiveTintColor: '#52636B', tabBarActiveBackgroundColor: 'transparent',
    tabBarItemStyle: { flex: 1, minHeight: 64, marginHorizontal: 0 },
    tabBarStyle: { height: Math.ceil(72 + Math.max(0, textScale - 1) * 44) + bottom, paddingTop: 7, paddingBottom: bottom, paddingHorizontal: 3, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: '#FFFFFF', borderTopWidth: 0.5, borderTopColor: '#DCE7E4', shadowColor: '#253238', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 5 }, sceneStyle: { backgroundColor: colors.canvas } }}>
    {entries.map(([name, title, icon]) => <Tabs.Screen key={name} name={name} options={{ title, tabBarAccessibilityLabel: title, tabBarButton: props => <CaregiverTabButton {...props} label={title} icon={icon} /> }} />)}
    <Tabs.Screen name="summary" options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }} /><Tabs.Screen name="medicines" options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }} />
  </Tabs>;
}
