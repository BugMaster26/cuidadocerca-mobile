import { useSyncExternalStore } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { getAlertSnapshot, subscribeAlerts, chooseAlert, dismissAlert } from './alertStore';
import { DesignIcon } from './DesignIcon';
import { useAccessibility } from '../accessibility/AccessibilityContext';

export function AppAlertHost() {
  const queue = useSyncExternalStore(subscribeAlerts, getAlertSnapshot, getAlertSnapshot);
  const current = queue[0];
  const { textScale } = useAccessibility();
  if (!current) return null;
  const destructive = current.buttons.some(button => button.style === 'destructive');
  return <Modal key={current.id} transparent visible animationType="none" onRequestClose={() => dismissAlert(current)}>
    <View style={{ flex: 1, padding: 22, backgroundColor: '#13292088', justifyContent: 'center', alignItems: 'center' }}>
      <View accessibilityViewIsModal style={{ backgroundColor: '#FFFFFF', borderRadius: 26, padding: 24, maxHeight: '90%', width: '100%', maxWidth: 420 }}>
        <ScrollView contentContainerStyle={{ gap: 18 }} keyboardShouldPersistTaps="handled">
          <View style={{ alignSelf: 'center', width: 74, height: 74, borderRadius: 37, backgroundColor: destructive ? '#FCE8E6' : '#D5F4E8', alignItems: 'center', justifyContent: 'center' }}>
            <DesignIcon name={destructive ? 'trash' : 'calendar'} color={destructive ? '#A32323' : '#126B62'} size={36} />
          </View>
          <Text accessibilityRole="header" style={{ fontFamily: 'Poppins_700Bold', fontSize: 23 * textScale, lineHeight: 30 * textScale, color: '#253238', textAlign: 'center' }}>{current.title}</Text>
          {!!current.message && <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 17 * textScale, lineHeight: 26 * textScale, color: '#52636B', textAlign: 'center' }}>{current.message}</Text>}
          <View style={{ gap: 10 }}>
            {current.buttons.map((button, index) => {
              const cancel = button.style === 'cancel';
              const danger = button.style === 'destructive';
              return <Pressable key={index} accessibilityRole="button" onPress={() => void chooseAlert(current, button)}
                style={({ pressed }) => ({ minHeight: 56, padding: 13, borderRadius: 15, borderWidth: cancel ? 1.5 : 0, borderColor: '#B8D3C7',
                  backgroundColor: cancel ? '#FFFFFF' : danger ? '#C62828' : '#126B62', alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.8 : 1 })}>
                <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 17 * textScale, textAlign: 'center', color: cancel ? '#126B62' : '#FFFFFF' }}>{button.text || 'Entendido'}</Text>
              </Pressable>;
            })}
          </View>
        </ScrollView>
      </View>
    </View>
  </Modal>;
}
