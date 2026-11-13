import { Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SQLiteProvider } from 'expo-sqlite';
import { RoleProvider } from '../src/role/RoleContext';
import { colors } from '../src/ui/theme';
import { migrateDatabase } from '../src/data/database';
import { AccessibilityProvider } from '../src/accessibility/AccessibilityContext';

export default function RootLayout() {
  const [loaded] = useFonts({ Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold });
  if (!loaded) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas }}><ActivityIndicator color={colors.primary} /></View>;
  return (
    <SafeAreaProvider>
      <SQLiteProvider databaseName="cuidadocerca-local.db" onInit={migrateDatabase}>
        <RoleProvider>
          <AccessibilityProvider>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFF8F1' } }} />
          </AccessibilityProvider>
        </RoleProvider>
      </SQLiteProvider>
    </SafeAreaProvider>
  );
}
