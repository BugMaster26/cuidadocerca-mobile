import { useEffect, useRef, type PropsWithChildren } from 'react';
import { AccessibilityInfo, Animated, Platform, type StyleProp, type ViewStyle } from 'react-native';

export function SoftAppear({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    let active = true;
    let animation: Animated.CompositeAnimation | undefined;
    const reduced = Platform.OS === 'web' ? Promise.resolve(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false) : AccessibilityInfo.isReduceMotionEnabled();
    void reduced.then(value => {
      if (!active || value) return;
      opacity.setValue(0.45);
      animation = Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: Platform.OS !== 'web', isInteraction: false });
      animation.start();
    }).catch(() => {});
    return () => { active = false; animation?.stop(); };
  }, [opacity]);
  return <Animated.View style={[style, { opacity }]}>{children}</Animated.View>;
}
