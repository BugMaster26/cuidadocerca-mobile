import { DesignIcon } from './DesignIcon';
import Svg, { Circle, ClipPath, Defs, Image as SvgImage, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, Modal, ScrollView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAccessibility } from '../accessibility/AccessibilityContext';

const illustration = require('../../assets/abuelitos.png');
const red = '#C62828';

function Grandparents({ variant }: { variant: 'hero' | 'banner' }) {
  const clip = 'grandparents-' + variant;
  return <Svg viewBox="0 0 185 148" style={variant === 'hero' ? styles.heroImage : styles.bannerImage}
    accessibilityElementsHidden aria-hidden={true} pointerEvents="none">
    <Defs><ClipPath id={clip}><Path d="M12 93C9 84 13 76 17 75L20 63Q25 55 29 62L32 78L43 74L52 68L49 55Q37 52 39 41L43 33L42 24Q42 15 51 13Q54 4 68 3Q85 0 94 12Q103 15 103 30L105 40Q111 31 125 28Q144 25 155 39Q164 46 166 60Q176 68 174 76Q177 86 166 96Q183 104 184 130Q181 143 171 147H28Q13 143 13 128Z M1 39L17 36L18 44L1 46Z M3 20L21 27L18 34L1 27Z M15 8L21 7L30 20L24 24Z" /></ClipPath></Defs>
    <SvgImage href={illustration} width={185} height={148} clipPath={`url(#${clip})`} />
  </Svg>;
}
export function SosHero({ onPress, greeting, date }: { onPress: () => void; greeting?: string; date?: string }) {
  const wave = useRef(new Animated.Value(0)).current;
  useFocusEffect(useCallback(() => {
    let active = true;
    let animation: Animated.CompositeAnimation | undefined;
    const configure = (reduced: boolean) => {
      if (!active) return;
      animation?.stop();
      wave.setValue(0);
      if (!reduced) {
        animation = Animated.loop(Animated.timing(wave, {
          toValue: 1, duration: 2600, useNativeDriver: Platform.OS !== 'web', isInteraction: false,
        }));
        animation.start();
      }
    };
    const media = Platform.OS === 'web' ? globalThis.matchMedia?.('(prefers-reduced-motion: reduce)') : undefined;
    const onMedia = (event: MediaQueryListEvent) => configure(event.matches);
    media?.addEventListener('change', onMedia);
    const listener = Platform.OS !== 'web' ? AccessibilityInfo.addEventListener('reduceMotionChanged', configure) : undefined;
    if (media) configure(media.matches);
    else void AccessibilityInfo.isReduceMotionEnabled().then(configure).catch(() => {});
    return () => { active = false; animation?.stop(); listener?.remove(); media?.removeEventListener('change', onMedia); };
  }, [wave]));
  const { textScale } = useAccessibility();
  return <View style={styles.hero}>
    <Svg width="100%" height="175" viewBox="0 0 360 155" preserveAspectRatio="none" style={[StyleSheet.absoluteFill, { top: 70 }]} accessibilityElementsHidden>
      <Defs><LinearGradient id="heroWash" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#94DABC" /><Stop offset="0.48" stopColor="#B4E7D2" /><Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
      </LinearGradient></Defs>
      <Path d="M0 108C59 49 112 124 178 88S279 7 360 49V155H0Z" fill="url(#heroWash)" />
      
    </Svg>
    <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, minHeight: 96 }}>
      <View style={{ flex: 1, paddingRight: 6 }}><Text style={{ color: '#253238', fontFamily: 'Poppins_700Bold', fontSize: 23 * textScale, lineHeight: 29 * textScale }}>{greeting}</Text><Text style={{ color: '#52636B', fontFamily: 'Poppins_400Regular', fontSize: 13 * textScale, marginTop: 8 }}>{date}</Text></View>
      <Image source={require('../../assets/abuelitos-transparente.png')} accessible={false} resizeMode="contain" style={{ width: '40%', height: 96, alignSelf: 'flex-start' }} />
    </View>
    <View style={styles.pulseArea}>
      <Animated.View pointerEvents="none" style={[styles.ripple, { opacity: wave.interpolate({ inputRange: [0, 1], outputRange: [.52, 0] }),
        transform: [{ scale: wave.interpolate({ inputRange: [0, 1], outputRange: [1, 1.24] }) }] }]} />
      <Animated.View style={{ transform: [{ scale: wave.interpolate({ inputRange: [0, .5, 1], outputRange: [1, 1.04, 1] }) }] }}>
        <Pressable accessibilityRole="button" accessibilityLabel="SOS. Pide ayuda ahora" onPress={onPress} style={styles.sos}>
          <Svg width={190} height={190} viewBox="0 0 200 200" style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none" accessibilityElementsHidden>
            <Defs><LinearGradient id="sosFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FF3D40" /><Stop offset="1" stopColor="#D50713" />
            </LinearGradient></Defs>
            <Circle cx="100" cy="100" r="95" fill="url(#sosFill)" stroke="#FFFFFF" strokeWidth="4" />
          </Svg>
          <View style={{ zIndex: 1 }}><DesignIcon name="phone" color="#FFFFFF" size={34} /></View><Text style={[styles.sosText, { fontSize: 37 * textScale, lineHeight: 41 * textScale }]}>SOS</Text>
          <Text style={styles.sosCaption}>Pide ayuda ahora</Text>
        </Pressable>
      </Animated.View>
    </View>
  </View>;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function CountdownRing({ seconds, endsAt }: { seconds: number; endsAt: number | null }) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (endsAt === null) return;
    const timeLeft = Math.max(0, Math.min(3000, endsAt - Date.now()));
    progress.setValue(1 - timeLeft / 3000);
    const animation = Animated.timing(progress, {
      toValue: 1, duration: timeLeft, easing: Easing.linear, useNativeDriver: false, isInteraction: false,
    });
    animation.start();
    return () => animation.stop();
  }, [endsAt, progress]);
  const circumference = 2 * Math.PI * 96;
  return <View style={styles.countdown}>
    <Svg width="100%" height="100%" viewBox="0 0 220 220" pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden>
      <Circle cx="110" cy="110" r="96" fill="#FFF9F9" stroke="#FAD6D6" strokeWidth="12" />
      <AnimatedCircle cx="110" cy="110" r="96" fill="none" stroke="#F5222D" strokeWidth="12" strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={progress.interpolate({ inputRange: [0, 1], outputRange: [0, circumference] })} rotation={-90} originX={110} originY={110} />
    </Svg>
    <Text style={styles.countText}>Activando SOS en</Text>
    <Text accessibilityLiveRegion="assertive" accessibilityLabel={`${seconds} segundos`} style={styles.countNumber}>{seconds}</Text>
    <Text style={styles.countText}>{seconds === 1 ? 'segundo' : 'segundos'}</Text>
  </View>;
}

export function SosBanner({ result = false }: { result?: boolean }) {
  return <View style={[styles.banner, result && { backgroundColor: '#FFE8E6', overflow: 'hidden', paddingVertical: 10 } ]}>
    {result && <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} aria-hidden={true}>
      <Defs><LinearGradient id="resultBanner" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#FFF0EF" /><Stop offset="1" stopColor="#FFDFDC" />
      </LinearGradient></Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#resultBanner)" />
    </Svg>}
    <View style={{ flex: 1 }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Svg width={39} height={39} viewBox="0 0 40 40" aria-hidden={true}>
        <Path d="M8 30h24v5H8z M12 29v-9a8 8 0 1 1 16 0v9z" fill="#C62828" />
        <Path d="M20 3v5 M6 9l4 4 M34 9l-4 4 M16 19a4 4 0 0 1 4-4" stroke="#E52A2F" strokeWidth={3} strokeLinecap="round" fill="none" />
      </Svg>
      <Text accessibilityRole="header" style={styles.bannerTitle}>SOS</Text>
    </View>
      <Text style={styles.bannerCaption}>Pide ayuda rápidamente</Text></View>
    {result ? <Image accessible={false} source={require('../../assets/abuelitos-transparente.png')} style={{ width: '43%', height: 104, alignSelf: 'flex-end' }} resizeMode="contain" /> : <Grandparents variant="banner" />}
  </View>;
}

const shortcutPaths = {
  clipboard: 'M9 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3 M9 3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3H9z M8 11h8 M8 15h8 M8 19h5',
  location: 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0z M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  shield: 'M12 22s7-3 8-11V5l-8-3-8 3v6c1 8 8 11 8 11z M9 12l2 2 4-4',
  book: 'M12 6C9 3 5 3 2 4v15c4-1 7-1 10 2 3-3 6-3 10-2V4c-3-1-7-1-10 2z M12 6v15',
};

type Shortcut = { label: string; icon: keyof typeof shortcutPaths; explanation: string; onPress: () => void };

export function HelpShortcuts({ items }: { items: Shortcut[] }) {
  const [help, setHelp] = useState<Shortcut | null>(null);
  const { textScale } = useAccessibility();
  return <>
    <View style={styles.grid}>
      {items.map(item => <View key={item.label} style={styles.tile}>
        <Pressable accessibilityRole="button" accessibilityLabel={'Información sobre ' + item.label} onPress={() => setHelp(item)} style={styles.info}>
          <View style={styles.infoGlyph} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Svg width={22} height={22} viewBox="0 0 24 24" aria-hidden={true}>
              <Path d="M9 8.5a3.1 3.1 0 1 1 5.2 2.3c-1.35 1.12-2.2 1.52-2.2 3.2" fill="none" stroke="#126B62" strokeWidth={2.3} strokeLinecap="round" />
              <Circle cx={12} cy={17.8} r={1.25} fill="#126B62" />
            </Svg>
          </View>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={item.onPress} style={styles.shortcut}>
          <View style={styles.glyph} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Svg width={42} height={42} viewBox="0 0 24 24" aria-hidden={true}>
              <Path d={shortcutPaths[item.icon]} fill="none" stroke="#126B62" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </View>
          <Text style={[styles.tileLabel, { fontSize: 16 * textScale, lineHeight: 22 * textScale }]}>{item.label}</Text>
        </Pressable>
      </View>)}
    </View>
    <Modal visible={!!help} transparent onRequestClose={() => setHelp(null)}>
      <View style={styles.overlay}><View accessibilityViewIsModal style={styles.dialog}>
        <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ gap: 12, paddingBottom: 4 }}>
        <View style={styles.helpBadge}><Text accessible={false} style={styles.helpGlyph}>?</Text></View>
        <Text accessibilityRole="header" style={[styles.tileLabel, { fontSize: 22 * textScale, lineHeight: 30 * textScale }]}>{help?.label}</Text>
        <Text style={{ color: '#52636B', fontSize: 18 * textScale, lineHeight: 27 * textScale, textAlign: 'center' }}>{help?.explanation}</Text>
        </ScrollView>
        <Pressable accessibilityRole="button" onPress={() => setHelp(null)} style={styles.close}><Text style={[styles.tileLabel, { color: '#FFFFFF', fontSize: 17 * textScale, lineHeight: 24 * textScale }]}>Cerrar</Text></Pressable>
      </View></View>
    </Modal>
  </>;
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', justifyContent: 'flex-end', paddingTop: 0, paddingBottom: 0, marginHorizontal: -20, backgroundColor: '#FFFFFF' },
  pulseArea: { width: 206, height: 206, alignItems: 'center', justifyContent: 'center' },
  ripple: { position: 'absolute', width: 190, height: 190, borderRadius: 95, borderWidth: 9, borderColor: '#EA7777' },
  sos: { width: 190, height: 190, borderRadius: 95, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', padding: 8, elevation: 4 },
  sosText: { color: '#fff', fontFamily: 'Nunito_900Black', lineHeight: 41, includeFontPadding: false },
  sosIcon: { color: '#fff', fontSize: 29 },
  sosCaption: { color: '#FFFFFF', fontFamily: 'Nunito_700Bold', fontSize: 16, lineHeight: 20, includeFontPadding: false, textAlign: 'center' },
  heroImage: { position: 'absolute', right: 16, top: -8, width: 163, height: 127 },
  countdown: { width: '86%', maxWidth: 276, aspectRatio: 1, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  countText: { color: '#C91B20', fontSize: 19, lineHeight: 23, includeFontPadding: false, fontFamily: 'Nunito_900Black' },
  countNumber: { color: '#D90815', fontSize: 76, lineHeight: 76, includeFontPadding: false, fontFamily: 'Nunito_900Black', fontVariant: ['tabular-nums'] },
  banner: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 22, backgroundColor: '#FCE8E6', minHeight: 96 },
  bannerTitle: { color: '#A32020', fontSize: 38, fontFamily: 'Poppins_700Bold' },
  bannerCaption: { color: '#702728', fontSize: 17, fontFamily: 'Nunito_900Black' },
  bannerImage: { width: 112, height: 90 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  tile: { width: '48.5%', backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#D2E8E2', elevation: 2 },
  info: { position: 'absolute', right: 0, top: 0, zIndex: 1, width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  infoGlyph: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: '#A9D8CC', backgroundColor: '#E6F4F1', alignItems: 'center', justifyContent: 'center' },
  shortcut: { minHeight: 116, paddingTop: 8, paddingHorizontal: 10, paddingBottom: 8, alignItems: 'center', gap: 4 },
  glyph: { backgroundColor: '#E1F6E6', borderRadius: 34, width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  tileLabel: { color: '#253238', fontFamily: 'Poppins_600SemiBold', lineHeight: 20, textAlign: 'center' },
  overlay: { flex: 1, padding: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#25323888' },
  dialog: { width: '100%', maxWidth: 420, maxHeight: '88%', padding: 22, borderRadius: 26, backgroundColor: '#fff', gap: 18, borderWidth: 1, borderColor: '#D2E8E2' },
  helpBadge: { width: 54, height: 54, borderRadius: 27, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E6F4F1' },
  helpGlyph: { fontSize: 28, color: '#126B62', fontFamily: 'Poppins_700Bold' },
  close: { minHeight: 54, borderRadius: 16, backgroundColor: '#126B62', alignItems: 'center', justifyContent: 'center' },
});



export function SosOption({ label, icon, tone = 'green', onPress }: {
  label: string;
  icon: string;
  tone?: 'green' | 'amber' | 'outline' | 'resultSoft' | 'result' | 'resultBack';
  onPress: () => void;
}) {
  const { textScale } = useAccessibility();
  const result = tone === 'result' || tone === 'resultSoft' || tone === 'resultBack';
  if (result) {
    const path = icon === 'mensaje'
      ? 'M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z M7 8h10 M7 12h7'
      : icon === 'editar' ? 'm4 16 12-12 4 4L8 20H4z M14 6l4 4' : icon === '←' ? 'M19 12H5 M12 5l-7 7 7 7' : 'M12 22s7-3 8-11V5l-8-3-8 3v6c1 8 8 11 8 11z M8 12l3 3 5-6';
    return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({
      flexDirection: 'row', alignItems: 'center', justifyContent: tone === 'resultBack' ? 'center' : 'flex-start',
      minHeight: 54, gap: 13, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 28, borderColor: '#167B70', borderWidth: tone === 'resultBack' ? 1.5 : 0, elevation: tone === 'resultBack' ? 0 : 2,
      backgroundColor: pressed ? '#E6F4F1' : tone === 'resultSoft' ? '#FFF9EB' : tone === 'result' ? '#D1F2E5' : '#FFFFFF',
    })}>
      <View style={{ width: 43, height: 43, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: tone === 'resultSoft' ? '#FFF4D7' : tone === 'result' ? '#C5EEDC' : 'transparent' }}>
      <Svg width={25} height={25} viewBox="0 0 24 24" aria-hidden={true}>
        <Path d={path} fill="none" stroke={tone === 'resultSoft' ? '#A86800' : '#126B62'} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
      </View>
      <Text style={{ flex: tone === 'resultBack' ? undefined : 1, flexShrink: 1, color: tone === 'resultBack' ? '#126B62' : '#253238', fontFamily: 'Poppins_700Bold', fontSize: 16 * textScale }}>{label}</Text>
      {tone !== 'resultBack' && <Svg width={20} height={20} viewBox="0 0 24 24" aria-hidden={true}><Path d="m9 5 7 7-7 7" fill="none" stroke={tone === 'resultSoft' ? '#A86800' : '#126B62'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>}
    </Pressable>;
  }
  const tint = tone === 'amber' ? '#FFF5DA' : tone === 'outline' ? '#FFFFFF' : '#DDF4E8';
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({
    flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 54, padding: 12,
    borderRadius: 26, backgroundColor: tint, borderWidth: tone === 'outline' ? 2 : 0, elevation: tone === 'outline' ? 0 : 2,
    borderColor: '#126B62', opacity: pressed ? .75 : 1,
  })}>
    {icon === 'mensaje' ? <Svg width={26} height={26} viewBox="0 0 24 24" aria-hidden={true}>
      <Path d="M20 4H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h1v4l5-4h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z M7 9h10 M7 13h7" fill="none" stroke="#875408" strokeWidth={1.7} strokeLinejoin="round" strokeLinecap="round" />
    </Svg> : <Text accessible={false} style={{ color: '#126B62', fontSize: 22 }}>{icon}</Text>}
    <Text style={{ flex: 1, fontSize: (tone === 'outline' ? 19 : 16) * textScale, color: tone === 'outline' ? '#126B62' : '#253238', textAlign: tone === 'outline' ? 'center' : 'left', fontFamily: 'Nunito_900Black' }}>{label}</Text>
    {tone !== 'outline' && <Text accessible={false} style={{ color: '#126B62', fontSize: 22 }}>›</Text>}
  </Pressable>;
}

export function SosFooterWaves() {
  return <Svg width="100%" height="82" viewBox="0 0 360 82" preserveAspectRatio="none" accessibilityElementsHidden>
    <Path fill="#BDEBD8" d="M0 34C65-7 124 28 186 47S289-23 360 8V82H0Z" />
    <Path fill="#79DCB8" d="M0 42C47 35 76 80 128 65S173 41 215 50 279 62 360 33V82H0Z" />
    <Path fill="#40CFA0" opacity={.65} d="M0 72C73 63 87 87 149 75S279 58 360 76V82H0Z" />
  </Svg>;
}










export function SosContactCard({ name, phone, resultStyle = false }: { name?: string; phone?: string; resultStyle?: boolean }) {
  const { textScale } = useAccessibility();
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18,
    borderWidth: 1, borderColor: resultStyle ? '#DCE7E4' : '#E3E7E6', backgroundColor: '#FFFFFF', elevation: 2 }}>
    <View accessible={false} style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: '#DDF4E8', alignItems: 'center', justifyContent: 'center' }}>
      {resultStyle ? <Svg width={25} height={25} viewBox="0 0 24 24" aria-hidden={true}>
        <Path d="M8 3l3 5-2 2a12 12 0 0 0 5 5l2-2 5 3v3c0 1-1 2-2 2C10 21 3 14 3 5c0-1 1-2 2-2z" fill="#126B62" />
      </Svg> : <Text style={{ fontSize: 24, color: '#126B62' }}>☎</Text>}
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{ color: '#253238', fontSize: 16 * textScale, fontFamily: 'Poppins_700Bold' }}>Contacto de emergencia</Text>
      <Text style={{ color: '#253238', fontSize: 15 * textScale }}>{name && phone ? name + ' · ' + phone : 'Sin contacto configurado'}</Text>
    </View>
  </View>;
}

export function CancelSosButton({ onPress }: { onPress: () => void }) {
  const { textScale } = useAccessibility();
  return <Pressable accessibilityRole="button" accessibilityLabel="Cancelar SOS" onPress={onPress}
    style={({ pressed }) => ({ minHeight: 56, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 32, overflow: 'hidden',
      backgroundColor: '#C62828', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, opacity: pressed ? .85 : 1 })}>
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none" aria-hidden={true}>
      <Defs><LinearGradient id="cancelFill" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#FF4447" /><Stop offset="1" stopColor="#D30610" /></LinearGradient></Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#cancelFill)" />
    </Svg>
    <Text accessible={false} style={{ color: '#C62828', backgroundColor: '#fff', borderRadius: 12, width: 24, height: 24, textAlign: 'center', fontSize: 19, lineHeight: 23 }}>×</Text>
    <Text style={{ color: '#fff', fontSize: 19 * textScale, fontFamily: 'Nunito_900Black' }}>Cancelar SOS</Text>
  </Pressable>;
}





export function SosAttemptStatus({ call, sms }: { call: string; sms: string }) {
  const { textScale } = useAccessibility();
  const cancelled = call === 'SOS cancelado.';
  const failed = call.startsWith('No se pudo');
  const dialerOpened = call.startsWith('Marcador abierto');
  const previewFinished = call.startsWith('Conteo terminado.');
  const heading = cancelled ? 'SOS cancelado' : 'Estado de la asistencia';
  const tint = cancelled || failed ? '#FCE8E6' : '#E4F6EB';
  const accent = cancelled || failed ? '#A32323' : dialerOpened ? '#128343' : '#126B62';
  return <View accessibilityLiveRegion="polite" style={{ flexDirection: 'row', alignItems: 'flex-start',
    gap: 12, padding: 16, borderRadius: 20, backgroundColor: tint }}>
    <View accessible={false} style={{ backgroundColor: accent, borderRadius: 22, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={24} height={24} viewBox="0 0 24 24" aria-hidden={true}>
        <Path d={cancelled ? 'M7 7l10 10 M17 7 7 17' : dialerOpened ? 'm6 12 4 4 8-8' : 'M12 6v7 M12 17v1'}
          fill="none" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
    <View style={{ flex: 1, gap: 6 }}>
      <Text accessibilityRole="header" style={{ color: '#253238', fontFamily: 'Poppins_700Bold', fontSize: 21 * textScale }}>{heading}</Text>
      {!cancelled && <Text style={{ color: '#253238', fontSize: 18 * textScale, lineHeight: 25 * textScale }}>{previewFinished ? 'Terminó la cuenta regresiva.' : call}</Text>}
      {!!sms && <Text style={{ color: '#52636B', fontSize: 17 * textScale, lineHeight: 24 * textScale }}>{sms}</Text>}
    </View>
  </View>;
}


