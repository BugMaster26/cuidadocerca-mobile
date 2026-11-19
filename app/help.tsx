import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAccessibility } from '../src/accessibility/AccessibilityContext';
import { useRole } from '../src/role/RoleContext';
import { NativePage } from '../src/ui/NativeScreens';
import { DesignIcon } from '../src/ui/DesignIcon';
import { TutorialIllustration } from '../src/ui/TutorialIllustration';
import { SosFooterWaves } from '../src/ui/CareVisuals';
import { Alert } from '../src/ui/AppAlert';

const steps = [
  ['Organiza tu día', 'En Mi día puedes consultar tu agenda y agregar actividades. En Mi salud puedes organizar citas y medicamentos.'],
  ['Pide compañía', 'En Mi familia puedes guardar una solicitud y revisar su estado en este dispositivo. Para contactar a una persona, llama a tu contacto de confianza.'],
  ['Usa SOS', 'Pulsa SOS para abrir las opciones de emergencia. Si tienes un contacto guardado, podrás confirmar la apertura del marcador.'],
];
const icons = ['calendar', 'heart', 'siren'] as const;
export default function Help() {
  const [step, setStep] = useState(0);
  const { textScale, highContrast, update } = useAccessibility();
  const { role } = useRole();
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    let active = true;
    let animation: Animated.CompositeAnimation | undefined;
    opacity.setValue(1);
    const reduced = Platform.OS === 'web' ? Promise.resolve(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false) : AccessibilityInfo.isReduceMotionEnabled();
    void reduced.then(value => {
      if (!active || value) return;
      opacity.setValue(0.25);
      animation = Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: Platform.OS !== 'web', isInteraction: false });
      animation.start();
    }).catch(() => {});
    return () => { active = false; animation?.stop(); };
  }, [step, opacity]);
  const configure = async (patch: Parameters<typeof update>[0]) => {
    try { await update(patch); }
    catch { Alert.alert('No se pudo guardar el ajuste', 'Inténtalo nuevamente.'); }
  };
  return <NativePage compactHeader title="Cómo usar CuidadoCerca" intro="" showSos={false}>
    <Text style={s.eyebrow}>{role === 'caregiver' ? 'ESPACIO FAMILIAR' : role === 'older-adult' ? 'TU ESPACIO' : 'CUIDADO COMPARTIDO'}</Text>
    <View style={s.hero}><View style={{ flex: 1, gap: 14 }}><Text accessibilityRole="header" style={[s.title, { fontSize: 28 * textScale, lineHeight: 37 * textScale }]}>Cómo usar CuidadoCerca</Text><Text accessibilityLiveRegion="polite" style={s.step}>Paso {step + 1} de {steps.length}</Text></View><TutorialIllustration step={step} /></View>
    <View accessible={false} style={s.progress}>{steps.map((_, index) => <View key={index} style={[s.progressPart, { backgroundColor: index <= step ? '#167B70' : '#DCE7E4' }]} />)}</View>
    <Animated.View style={[s.card, highContrast && { borderColor: '#000000', borderWidth: 2 }, { opacity }]}>
      <View style={s.icon}><DesignIcon name={icons[step]} size={36} /></View>
      <View style={{ flex: 1, gap: 12 }}><Text accessibilityRole="header" style={[s.cardTitle, { fontSize: 22 * textScale }]}>{steps[step][0]}</Text><Text style={[s.copy, { fontSize: 18 * textScale, lineHeight: 28 * textScale }]}>{steps[step][1]}</Text></View>
    </Animated.View>
    <Pressable accessibilityRole="button" onPress={() => void configure({ textScale: textScale > 1 ? 1 : 1.3 })} style={({ pressed }) => [s.outline, pressed && { opacity: 0.75 }]}><DesignIcon name="text" size={29} /><Text style={[s.outlineText, { fontSize: 17 * textScale }]}>{textScale > 1 ? 'Usar letra estándar' : 'Usar letra grande'}</Text></Pressable>
    <Pressable accessibilityRole="button" onPress={() => void configure({ highContrast: !highContrast })} style={({ pressed }) => [s.outline, pressed && { opacity: 0.75 }]}><DesignIcon name="contrast" size={29} /><Text style={[s.outlineText, { fontSize: 17 * textScale }]}>{highContrast ? 'Usar contraste estándar' : 'Activar contraste alto'}</Text></Pressable>
    <Pressable accessibilityRole="button" onPress={() => step === steps.length - 1 ? router.back() : setStep(step + 1)} style={({ pressed }) => [s.primary, pressed && { opacity: 0.8 }]}><Text style={[s.primaryText, { fontSize: 18 * textScale }]}>{step === steps.length - 1 ? 'Finalizar' : 'Siguiente paso'}</Text><DesignIcon name={step === steps.length - 1 ? 'check' : 'arrowRight'} size={25} color="#FFFFFF" /></Pressable>
    <Pressable accessibilityRole="button" onPress={() => step ? setStep(step - 1) : router.back()} style={s.outline}><DesignIcon name="arrowLeft" size={25} /><Text style={[s.outlineText, { fontSize: 17 * textScale }]}>{step ? 'Paso anterior' : 'Volver'}</Text></Pressable>
    <View style={{ marginTop: 'auto', marginHorizontal: -20, marginBottom: -28, paddingTop: 25 }}><SosFooterWaves /></View>
  </NativePage>;
}
const s = StyleSheet.create({
  eyebrow: { color: '#126B62', fontFamily: 'Poppins_700Bold', fontSize: 13, letterSpacing: 1 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 8 }, title: { color: '#253238', fontFamily: 'Poppins_700Bold' },
  step: { color: '#253238', fontFamily: 'Poppins_400Regular', fontSize: 16, paddingVertical: 7, paddingHorizontal: 11, borderRadius: 12, backgroundColor: '#E6F4F1', alignSelf: 'flex-start' },
  progress: { flexDirection: 'row', gap: 8 }, progressPart: { height: 5, flex: 1, borderRadius: 4 },
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: 13, padding: 19, borderWidth: 1, borderColor: '#DCE7E4', borderRadius: 23, backgroundColor: '#FFFFFF', minHeight: 180 },
  icon: { width: 56, height: 60, borderRadius: 17, backgroundColor: '#E6F4F1', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { color: '#253238', fontFamily: 'Poppins_700Bold' }, copy: { color: '#253238', fontFamily: 'Poppins_400Regular' },
  outline: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 13, borderRadius: 18, borderWidth: 1.5, borderColor: '#167B70', backgroundColor: '#FFFFFF' },
  outlineText: { color: '#126B62', fontFamily: 'Poppins_700Bold', textAlign: 'center', flexShrink: 1 },
  primary: { marginTop: 10, minHeight: 58, backgroundColor: '#167B70', borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 15 },
  primaryText: { color: '#FFFFFF', fontFamily: 'Poppins_700Bold', textAlign: 'center', flexShrink: 1 },
});
