import { useEffect, useRef, type ComponentProps } from 'react';
import { AccessibilityInfo, Animated, Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { PlatformPressable } from 'expo-router/react-navigation';
import type { BottomTabBarButtonProps } from 'expo-router/js-tabs';
import { useAccessibility } from '../accessibility/AccessibilityContext';
import { DesignIcon } from './DesignIcon';

type Props = BottomTabBarButtonProps & { label: string; icon: ComponentProps<typeof DesignIcon>['name'] };
export function CaregiverTabButton({ label, icon, children: _children, style, ...props }: Props) {
  const selected = props['aria-selected'] === true;
  const { textScale } = useAccessibility();
  const { width } = useWindowDimensions();
  const opacity = useRef(new Animated.Value(selected ? 1 : 0)).current;
  useEffect(() => {
    let active = true;
    let animation: Animated.CompositeAnimation | undefined;
    const reduced = Platform.OS === 'web' ? Promise.resolve(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false) : AccessibilityInfo.isReduceMotionEnabled();
    void reduced.then(value => {
      if (!active) return;
      if (value) { opacity.setValue(selected ? 1 : 0); return; }
      animation = Animated.timing(opacity, { toValue: selected ? 1 : 0, duration: 180, useNativeDriver: Platform.OS !== 'web', isInteraction: false });
      animation.start();
    }).catch(() => opacity.setValue(selected ? 1 : 0));
    return () => { active = false; animation?.stop(); };
  }, [selected, opacity]);
  const color = selected ? '#167B70' : '#52636B';
  return <PlatformPressable {...props} accessibilityLabel={label} accessibilityState={{ selected }} style={[style, s.button]}>
    <View pointerEvents="none" style={s.content} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={[s.capsule, { opacity }]} />
      <View style={{ zIndex: 1 }}><DesignIcon name={icon} color={color} size={26} /></View>
      <Text style={[s.label, { color, fontSize: (width < 360 ? 10 : 11) * textScale, lineHeight: 15 * textScale, fontFamily: selected ? 'Poppins_700Bold' : 'Poppins_400Regular' }]}>{label}</Text>
    </View>
  </PlatformPressable>;
}
const s = StyleSheet.create({
  button: { flex: 1, minHeight: 64, padding: 0, backgroundColor: 'transparent', justifyContent: 'center' },
  content: { flex: 1, width: '100%', minHeight: 64, paddingVertical: 7, paddingHorizontal: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  capsule: { position: 'absolute', top: 1, bottom: 1, left: 2, right: 2, borderRadius: 18, backgroundColor: '#E6F4F1' },
  label: { textAlign: 'center', alignSelf: 'center', width: '116%', zIndex: 1, flexShrink: 1 },
});
