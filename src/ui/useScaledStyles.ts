import { useMemo } from 'react';
import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';
import { useAccessibility } from '../accessibility/AccessibilityContext';

// Scale typography together; keep dimensions and spacing independent of font size.
export function useScaledStyles<T extends Record<string, ViewStyle | TextStyle | ImageStyle>>(styles: T): T {
  const { textScale } = useAccessibility();
  return useMemo(() => Object.fromEntries(Object.entries(styles).map(([name, value]) => {
    const flat = StyleSheet.flatten(value) as TextStyle;
    return [name, { ...flat,
      ...(typeof flat.fontSize === 'number' ? { fontSize: flat.fontSize * textScale } : {}),
      ...(typeof flat.lineHeight === 'number' ? { lineHeight: flat.lineHeight * textScale } : {}),
    }];
  })) as T, [styles, textScale]);
}
