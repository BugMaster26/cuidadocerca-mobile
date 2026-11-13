import { Stack } from 'expo-router';
import { AssistanceInfoPage } from '../src/ui/NativeScreens';
export default function AssistanceRoute() { return <><Stack.Screen options={{ title: 'Asistencia SOS', headerShown: true, headerTintColor: '#873018', headerStyle: { backgroundColor: '#FFF8F1' } }} /><AssistanceInfoPage /></>; }
