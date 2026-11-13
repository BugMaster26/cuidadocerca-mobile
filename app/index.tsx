import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useRole } from '../src/role/RoleContext';
import { RoleChoiceScreen } from '../src/role/RoleChoiceScreen';
import { colors } from '../src/ui/theme';

export default function Entry() {
  const { role, ready } = useRole();
  if (!ready) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas }}><ActivityIndicator color={colors.primary} /></View>;
  if (role === 'older-adult') return <Redirect href="/(senior)" />;
  if (role === 'caregiver') return <Redirect href="/(caregiver)" />;
  return <RoleChoiceScreen />;
}
