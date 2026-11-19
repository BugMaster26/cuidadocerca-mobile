import { DesignIcon } from './DesignIcon';
import { SosFooterWaves } from './CareVisuals';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState, type PropsWithChildren } from 'react';
import { Linking, Platform, Pressable, ScrollView, Image, StyleSheet, Switch, Text, View } from 'react-native';
import { Alert } from './AppAlert';
import * as Speech from 'expo-speech';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRole } from '../role/RoleContext';
import { useAccessibility } from '../accessibility/AccessibilityContext';
import { colors, typeScale } from './theme';

export function NativePage({ title, intro, children, showSos = true, compactHeader = false, whiteBackground = false }: PropsWithChildren<{ title: string; intro: string; showSos?: boolean; compactHeader?: boolean; whiteBackground?: boolean }>) {
  const { role } = useRole();
  const access = useAccessibility();
  return <SafeAreaView style={[s.safe, { backgroundColor: whiteBackground || access.highContrast ? colors.white : colors.canvas }]} edges={['top']}>
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <AppHeader showSos={showSos} />
      {!compactHeader && <Text style={[s.eyebrow, { fontSize: 13 * access.textScale }]}>{role === 'caregiver' ? 'ESPACIO FAMILIAR' : 'TU ESPACIO'}</Text>}
      {!compactHeader && <Text accessibilityRole="header" style={[s.title, { fontSize: typeScale.title * access.textScale, lineHeight: 38 * access.textScale }]}>{title}</Text>}
      {!compactHeader && !!intro && <Text style={[s.intro, { fontSize: typeScale.body * access.textScale, lineHeight: 27 * access.textScale }]}>{intro}</Text>}
      {children}
    </ScrollView>
  </SafeAreaView>;
}

export function AppHeader({ showSos = true }: { showSos?: boolean }) {
  const access = useAccessibility();
  const { role } = useRole();
  return <View style={s.header}>
    <View style={s.brandMark}><Text style={s.brandInitial}>C</Text></View>
    <View style={s.brandCopy}><Text style={s.brand}>CuidadoCerca</Text><Text style={s.brandTag}>Tu cuidado, organizado y siempre cerca</Text></View>
    {showSos && role === 'older-adult' && <Pressable accessibilityRole="button" accessibilityLabel="Activar SOS con cuenta regresiva" onPress={() => router.push('/sos?activar=1')} style={({ pressed }) => [s.sosButton, pressed && s.pressed]}><Text style={[s.sosButtonText, { fontSize: 17 * access.textScale }]}>SOS</Text></Pressable>}
  </View>;
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const access = useAccessibility();
  return <View style={s.sectionHeader}><Text accessibilityRole="header" style={[s.sectionTitle, { fontSize: 20 * access.textScale, lineHeight: 27 * access.textScale }]}>{title}</Text>{!!action && !!onAction && <Pressable accessibilityRole="button" onPress={onAction} style={s.sectionAction}><Text style={[s.sectionActionText, { fontSize: 15 * access.textScale }]}>{action}</Text></Pressable>}</View>;
}

export function PrimaryButton({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  const access = useAccessibility();
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [s.primaryButton, disabled && s.disabled, pressed && !disabled && s.pressed]}><Text style={[s.primaryButtonText, { fontSize: 17 * access.textScale }]}>{label}</Text></Pressable>;
}

export function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  const access = useAccessibility();
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [s.secondaryButton, pressed && s.pressed]}><Text style={[s.secondaryButtonText, { fontSize: 16 * access.textScale }]}>{label}</Text></Pressable>;
}

export function AccessibleCard({ title, body, icon, children }: PropsWithChildren<{ title: string; body?: string; icon?: string }>) {
  const access = useAccessibility();
  return <View style={s.card}><View style={s.cardTop}>{!!icon && <View style={s.cardIcon}><Text style={s.cardIconText}>{icon}</Text></View>}<Text accessibilityRole="header" style={[s.cardTitle, { fontSize: 18 * access.textScale, lineHeight: 25 * access.textScale }]}>{title}</Text></View>{!!body && <Text style={[s.cardBody, { fontSize: 16 * access.textScale, lineHeight: 23 * access.textScale }]}>{body}</Text>}{children}</View>;
}

export function StatusBadge({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'positive' | 'warning' }) {
  const access = useAccessibility();
  return <View style={[s.badge, tone === 'positive' && s.badgePositive, tone === 'warning' && s.badgeWarning]}><Text style={[s.badgeText, { fontSize: 13 * access.textScale }]}>{label}</Text></View>;
}

export function EmptyState({ title, body, action, onAction }: { title: string; body: string; action?: string; onAction?: () => void }) {
  const access = useAccessibility();
  return <View style={s.emptyState}><View style={s.emptySymbol}><Text style={s.emptySymbolText}>•</Text></View><Text style={[s.emptyTitle, { fontSize: 18 * access.textScale }]}>{title}</Text><Text style={[s.emptyBody, { fontSize: 16 * access.textScale, lineHeight: 23 * access.textScale }]}>{body}</Text>{!!action && !!onAction && <SecondaryButton label={action} onPress={onAction} />}</View>;
}

export function SosCard() {
  return <Pressable accessibilityRole="button" onPress={() => router.push('/sos?activar=1')} style={s.sosStrip}><View style={s.sosDot}><Text style={s.sosDotText}>!</Text></View><View style={s.sosStripCopy}><Text style={s.sosStripTitle}>¿Necesitas ayuda ahora?</Text><Text style={s.sosStripBody}>Activa SOS con 3 segundos para cancelar</Text></View><Text style={s.sosArrow}>›</Text></Pressable>;
}

export function FeaturePage({ title, intro, icon }: { title: string; intro: string; icon: string }) {
  return <NativePage title={title} intro={intro}>
    <EmptyState title="Todavía no hay información compartida" body={`La sección ${title.toLocaleLowerCase('es-PE')} mostrará únicamente datos autorizados por la persona mayor y disponibles en una cuenta vinculada.`} />
    <AccessibleCard icon={icon} title="Privacidad primero" body="Esta instalación guarda los registros en este dispositivo. No hay cuentas vinculadas ni sincronización con familiares." />
  </NativePage>;
}

type ProfileIconName = Parameters<typeof DesignIcon>[0]['name'];
export function ProfilePage() {
  const { role } = useRole();
  const access = useAccessibility();
  const ink = access.highContrast ? '#000000' : '#253238';
  const muted = access.highContrast ? '#253238' : '#52636B';
  const update = async (patch: Parameters<typeof access.update>[0]) => {
    try { await access.update(patch); }
    catch { Alert.alert('No se pudo guardar el ajuste', 'Inténtalo nuevamente.'); }
  };
  return <NativePage compactHeader title="Mi perfil" intro="">
    <View style={profileStyles.hero}>
      <Svg width="100%" height="100%" viewBox="0 0 360 170" preserveAspectRatio="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden>
        <Defs><LinearGradient id="profile-wash" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#D5F4E8" /><Stop offset="0.72" stopColor="#D5F4E8" stopOpacity={0.65} /><Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} /></LinearGradient></Defs>
        <Path d="M130 170C194 110 226 154 271 84S337 10 360 39V170Z" fill={access.highContrast ? '#FFFFFF' : 'url(#profile-wash)'} />
      </Svg>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><View style={{ flex: 1 }}><Text style={profileStyles.eyebrow}>{role === 'caregiver' ? 'ESPACIO FAMILIAR' : 'TU ESPACIO'}</Text>
      <Text accessibilityRole="header" style={[profileStyles.title, { color: ink, fontSize: 30 * access.textScale }]}>Mi perfil</Text>
      <Text style={[profileStyles.intro, { color: muted, fontSize: 16 * access.textScale, lineHeight: 24 * access.textScale }]}>Ajusta CuidadoCerca para que te resulte más cómodo.</Text>
      </View><Image source={require('../../assets/abuelitos-transparente.png')} resizeMode="contain" accessible={false} style={profileStyles.grandparents} /></View>
    </View>
    <ProfileSection icon="accessibility" title="Accesibilidad" description="Personaliza la aplicación según tus necesidades.">
      <View style={profileStyles.row}>
        <ProfileIcon name="mic" />
        <View style={profileStyles.rowCopy}>
          <Text style={[profileStyles.rowTitle, { color: ink, fontSize: 17 * access.textScale }]}>Micrófono y dictado</Text>
          <Text style={[profileStyles.description, { color: muted, fontSize: 14 * access.textScale, lineHeight: 21 * access.textScale }]}>{Platform.OS === 'web' ? 'Para dictar, permite el micrófono en los permisos de este sitio.' : 'Para dictar, activa Micrófono → Permitir solo mientras se usa la aplicación.'}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Gestionar acceso al micrófono" onPress={() => {
            if (Platform.OS === 'web') Alert.alert('Micrófono y dictado', 'Abre los permisos del sitio en tu navegador y permite el acceso al micrófono.');
            else void Linking.openSettings().catch(() => Alert.alert('Micrófono y dictado', 'Abre los ajustes de CuidadoCerca en Android.'));
          }} style={profileStyles.manage}><Text style={profileStyles.manageText}>Gestionar acceso</Text><Text accessible={false} style={profileStyles.chevron}>›</Text></Pressable>
        </View>
      </View>
      <PreferenceRow icon="sliders" title="Modo sencillo" detail="Reduce opciones visibles y mantiene las acciones principales." value={access.simpleMode} onChange={value => void update({ simpleMode: value })} />
      <PreferenceRow icon="contrast" title="Alto contraste" detail="Aumenta la separación entre texto y fondo." value={access.highContrast} onChange={value => void update({ highContrast: value })} />
      <View style={[profileStyles.row, { flexDirection: 'column', alignItems: 'stretch' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><ProfileIcon name="text" /><View style={profileStyles.rowCopy}>
          <Text style={[profileStyles.rowTitle, { color: ink, fontSize: 17 * access.textScale }]}>Tamaño del texto</Text>
          <Text style={[profileStyles.description, { color: muted, fontSize: 14 * access.textScale, lineHeight: 21 * access.textScale }]}>Elige el tamaño que te resulte más cómodo.</Text>
        </View></View>
          <View accessibilityRole="radiogroup" style={profileStyles.sizes}>
            {([[1, 'Normal'], [1.15, 'Mediana'], [1.3, 'Grande']] as const).map(([scale, label]) => <Pressable key={scale} accessibilityRole="radio" accessibilityLabel={label} accessibilityState={{ checked: access.textScale === scale }} aria-checked={access.textScale === scale} onPress={() => void update({ textScale: scale })} style={[profileStyles.sizeButton, access.textScale === scale && profileStyles.sizeSelected]}>
              <Text style={[profileStyles.sizeText, { fontSize: 14 * access.textScale, lineHeight: 21 * access.textScale }, access.textScale === scale && { color: '#FFFFFF' }]}>{label}</Text>
            </Pressable>)}
          </View>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Escuchar las opciones" style={profileStyles.row} onPress={() => Speech.speak('CuidadoCerca. Mi perfil. Puedes gestionar el acceso al micrófono, ajustar el modo sencillo, el contraste y el tamaño del texto. También puedes elegir qué información consultar en el modo familiar de este dispositivo, y cambiar de experiencia.', { language: 'es-PE' })}>
        <ProfileIcon name="volume" /><View style={profileStyles.rowCopy}><Text style={[profileStyles.rowTitle, { color: ink, fontSize: 17 * access.textScale }]}>Escuchar las opciones</Text><Text style={[profileStyles.description, { color: muted, fontSize: 14 * access.textScale, lineHeight: 21 * access.textScale }]}>Reproduce en voz alta las opciones de la pantalla.</Text></View><Text accessible={false} style={profileStyles.chevron}>›</Text>
      </Pressable>
    </ProfileSection>
    {role === 'older-adult' && <ProfileSection icon="users" title="Compartir información" description="Tú decides qué datos puede consultar tu familia.">
      {(['citas', 'medicamentos', 'actividades', 'documentos'] as const).map(scope => <SharePreference key={scope} scope={scope} />)}
      <Text style={[profileStyles.localNote, { color: muted }]}>Estos permisos habilitan consultas en el modo familiar de este dispositivo.</Text>
    </ProfileSection>}
    <ProfileSection icon="shield" title="Privacidad" description="Tus datos de actividades, salud y preferencias permanecen en este dispositivo. No hay backend ni sincronización activos.">
      <View style={{ padding: 14, gap: 10 }}>
        <Pressable accessibilityRole="button" onPress={() => router.push('/experience')} style={profileStyles.experience}>
          <DesignIcon name="settings" size={26} /><Text style={[profileStyles.experienceText, { fontSize: 18 * access.textScale }]}>Cambiar experiencia</Text>
        </Pressable>
        <Text style={[profileStyles.currentRole, { color: muted, fontSize: 14 * access.textScale, lineHeight: 21 * access.textScale }]}>Experiencia actual: <Text style={{ fontFamily: 'Poppins_600SemiBold' }}>{role === 'caregiver' ? 'Familiar o cuidador' : 'Persona mayor'}</Text></Text>
      </View>
    </ProfileSection>
    <View style={{ marginHorizontal: -20, marginBottom: -28, marginTop: 'auto', paddingTop: 15 }}><SosFooterWaves /></View>
  </NativePage>;
}
function ProfileIcon({ name }: { name: ProfileIconName }) {
  const access = useAccessibility();
  return <View style={[profileStyles.rowIcon, access.highContrast && { backgroundColor: '#FFFFFF', borderColor: '#000000', borderWidth: 1 }]}><DesignIcon name={name} size={29} color={access.highContrast ? '#000000' : '#126B62'} /></View>;
}
function ProfileSection({ title, description, icon, children }: PropsWithChildren<{ title: string; description: string; icon: ProfileIconName }>) {
  const access = useAccessibility();
  return <View style={[profileStyles.section, access.highContrast && { backgroundColor: '#FFFFFF', borderColor: '#000000', borderWidth: 2 }]}>
    <View style={profileStyles.sectionHeading}><View style={profileStyles.sectionIcon}><DesignIcon name={icon} size={33} /></View><View style={{ flex: 1 }}><Text accessibilityRole="header" style={[profileStyles.sectionTitle, { fontSize: 21 * access.textScale, color: access.highContrast ? '#000000' : '#253238' }]}>{title}</Text><Text style={[profileStyles.description, { fontSize: 14 * access.textScale, color: access.highContrast ? '#253238' : '#52636B' }]}>{description}</Text></View></View>
    <View style={[profileStyles.sectionBody, access.highContrast && { backgroundColor: '#FFFFFF' }]}>{children}</View>
  </View>;
}
const s = StyleSheet.create({
  safe: { flex: 1 }, content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 9, paddingBottom: 28, gap: 15 },
  header: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 10 }, brandMark: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary }, brandInitial: { color: colors.white, fontFamily: 'Poppins_700Bold', fontSize: 24 }, brandCopy: { flex: 1, gap: 0 }, brand: { color: colors.primary, fontFamily: 'Poppins_700Bold', fontSize: 16 }, brandTag: { color: colors.muted, fontFamily: 'Poppins_400Regular', fontSize: 10 }, sosButton: { minWidth: 66, minHeight: 50, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: '#A12D20' }, sosButtonText: { color: colors.white, fontFamily: 'Poppins_700Bold', fontSize: 17 },
  eyebrow: { color: colors.accent, fontSize: 13, fontWeight: '700', letterSpacing: 1, fontFamily: 'Poppins_700Bold' }, title: { color: colors.ink, fontSize: typeScale.title, lineHeight: 38, fontWeight: '700', fontFamily: 'Poppins_700Bold' }, intro: { color: colors.muted, fontSize: typeScale.body, lineHeight: 27, marginBottom: 2, fontFamily: 'Poppins_400Regular' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 3 }, sectionTitle: { flex: 1, color: colors.ink, fontSize: 20, lineHeight: 27, fontWeight: '700', fontFamily: 'Poppins_700Bold' }, sectionAction: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 }, sectionActionText: { color: colors.primary, fontFamily: 'Poppins_600SemiBold', fontSize: 15 },
  primaryButton: { minHeight: 54, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary }, primaryButtonText: { color: colors.white, fontSize: 17, fontWeight: '700', fontFamily: 'Poppins_700Bold', textAlign: 'center' }, secondaryButton: { minHeight: 52, paddingHorizontal: 15, paddingVertical: 10, borderWidth: 1.5, borderColor: colors.primary, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white }, secondaryButtonText: { color: colors.primary, fontSize: 16, fontWeight: '700', fontFamily: 'Poppins_600SemiBold', textAlign: 'center' }, pressed: { opacity: 0.78 }, disabled: { opacity: 0.5 },
  card: { padding: 16, gap: 10, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 17 }, cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 }, cardIcon: { minWidth: 40, minHeight: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAlt }, cardIconText: { color: colors.primary, fontSize: 20, fontWeight: '700' }, cardTitle: { flex: 1, color: colors.ink, fontSize: 18, lineHeight: 25, fontWeight: '700', fontFamily: 'Poppins_700Bold' }, cardBody: { color: colors.muted, fontSize: 16, lineHeight: 23, fontFamily: 'Poppins_400Regular' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: colors.surfaceAlt }, badgePositive: { backgroundColor: '#E5F3E7' }, badgeWarning: { backgroundColor: '#FFF0D4' }, badgeText: { color: colors.ink, fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  emptyState: { alignItems: 'flex-start', padding: 18, gap: 10, borderRadius: 17, backgroundColor: colors.surfaceAlt }, emptySymbol: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white }, emptySymbolText: { color: colors.accent, fontSize: 25, fontWeight: '700' }, emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: '700', fontFamily: 'Poppins_700Bold' }, emptyBody: { color: colors.muted, fontSize: 16, lineHeight: 23, fontFamily: 'Poppins_400Regular' },
  sosStrip: { minHeight: 74, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: '#EBC7BD', borderRadius: 17, backgroundColor: '#FFF1EC' }, sosDot: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#A12D20', alignItems: 'center', justifyContent: 'center' }, sosDotText: { color: colors.white, fontSize: 22, fontWeight: '700' }, sosStripCopy: { flex: 1, gap: 2 }, sosStripTitle: { color: '#6F221A', fontSize: 16, fontFamily: 'Poppins_700Bold' }, sosStripBody: { color: colors.muted, fontSize: 14, fontFamily: 'Poppins_400Regular' }, sosArrow: { color: colors.primary, fontSize: 29, fontWeight: '600' },
  preference: { minHeight: 72, padding: 12, borderRadius: 14, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', gap: 10, borderColor: colors.border, borderWidth: 1 }, prefCopy: { flex: 1, gap: 3 }, prefTitle: { fontSize: 16, lineHeight: 23, color: colors.ink, fontWeight: '700', fontFamily: 'Poppins_600SemiBold' }, caption: { color: colors.muted, fontSize: 14, lineHeight: 20, fontFamily: 'Poppins_400Regular' }, preferenceBlock: { gap: 10, padding: 14, borderRadius: 14, backgroundColor: colors.white, borderColor: colors.border, borderWidth: 1 }, preferenceTitle: { color: colors.ink, fontSize: 17, fontWeight: '700', fontFamily: 'Poppins_600SemiBold' }, sizeOptions: { flexDirection: 'row', gap: 8 }, sizeButton: { flex: 1, minHeight: 50, padding: 5, borderWidth: 1, borderColor: colors.primary, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, sizeActive: { backgroundColor: colors.primary }, sizeText: { color: colors.primary, fontSize: 13, fontFamily: 'Poppins_600SemiBold', textAlign: 'center' }, sizeTextActive: { color: colors.white },
  input: { minHeight: 52, paddingHorizontal: 13, borderWidth: 1, borderColor: '#8A746B', borderRadius: 12, backgroundColor: colors.white, color: colors.ink, fontSize: 16, fontFamily: 'Poppins_400Regular' },
});







function PreferenceRow({ title, detail, value, onChange, icon, disabled = false }: { title: string; detail: string; value: boolean; onChange: (value: boolean) => void; icon: ProfileIconName; disabled?: boolean }) {
  const access = useAccessibility();
  return <View style={[profileStyles.row, access.highContrast && { borderColor: '#000000' }]}>
    <ProfileIcon name={icon} />
    <View style={profileStyles.rowCopy}><Text style={[profileStyles.rowTitle, { fontSize: 17 * access.textScale, color: access.highContrast ? '#000000' : '#253238' }]}>{title}</Text><Text style={[profileStyles.description, { fontSize: 14 * access.textScale, color: access.highContrast ? '#253238' : '#52636B' }]}>{detail}</Text></View>
    <View style={profileStyles.switchTarget}><Switch accessibilityRole="switch" accessibilityLabel={title} disabled={disabled} value={value} onValueChange={onChange} trackColor={{ false: '#929D99', true: '#167B70' }} thumbColor="#FFFFFF" /></View>
  </View>;
}
function SharePreference({ scope }: { scope: 'citas' | 'medicamentos' | 'actividades' | 'documentos' }) {
  const db = useSQLiteContext();
  const [value, setValue] = useState(false);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const label = 'share:' + scope;
  useEffect(() => {
    let active = true;
    void db.getFirstAsync<{ value: string }>('SELECT value FROM preferences WHERE key=?', label).then(row => {
      if (active) { setValue(row?.value === 'true'); setReady(true); }
    }).catch(() => { if (active) Alert.alert('No se pudo consultar el permiso', 'Vuelve a abrir Mi perfil.'); });
    return () => { active = false; };
  }, [db, label]);
  const change = async (next: boolean) => {
    setSaving(true);
    try { await db.runAsync('INSERT OR REPLACE INTO preferences (key,value) VALUES (?,?)', label, String(next)); setValue(next); }
    catch { Alert.alert('No se pudo guardar el permiso', 'Inténtalo nuevamente.'); }
    finally { setSaving(false); }
  };
  const icons = { citas: 'calendar', medicamentos: 'pill', actividades: 'calendar', documentos: 'file' } as const;
  return <PreferenceRow icon={icons[scope]} title={'Permitir compartir ' + scope} detail={'Permite consultar estos datos en el modo familiar de este dispositivo.'} value={value} disabled={!ready || saving} onChange={next => void change(next)} />;
}
export function AssistanceInfoPage() {
  return <NativePage title="Asistencia SOS" intro="La ayuda debe ser clara, rápida y segura.">
    <SosCard />
    <AccessibleCard title="Qué ocurre al activar SOS" body="CuidadoCerca pedirá confirmación y abrirá el marcador para llamar al contacto que guardaste. No realiza llamadas ni envía alertas automáticamente." />
    <AccessibleCard title="Asistencia por voz" body="Puedes iniciar reconocimiento en esta pantalla con una pulsación. No se mantiene el micrófono escuchando al salir de la aplicación." />
  </NativePage>;
}
const profileStyles = StyleSheet.create({
  hero: { minHeight: 172, paddingTop: 4, marginHorizontal: -20, paddingHorizontal: 20, overflow: 'hidden' },
  eyebrow: { fontFamily: 'Poppins_700Bold', color: '#126B62', fontSize: 13 },
  title: { fontFamily: 'Poppins_700Bold', marginTop: 7 },
  intro: { fontFamily: 'Poppins_400Regular', width: '100%', marginTop: 6 },
  grandparents: { width: '32%', height: 132 },
  section: { backgroundColor: '#E6F4F1', borderWidth: 1, borderColor: '#DCE7E4', borderRadius: 24, padding: 4, overflow: 'hidden' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10 },
  sectionIcon: { width: 55, height: 55, borderRadius: 28, backgroundColor: '#D5F4E8', alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontFamily: 'Poppins_700Bold', flexShrink: 1 },
  sectionBody: { backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, marginHorizontal: 11, borderBottomWidth: 1, borderColor: '#DCE7E4', minHeight: 70 },
  rowIcon: { width: 45, height: 49, borderRadius: 14, backgroundColor: '#E6F4F1', alignItems: 'center', justifyContent: 'center' },
  rowCopy: { flex: 1, minWidth: 0, gap: 3 },
  rowTitle: { fontFamily: 'Poppins_700Bold' },
  description: { fontFamily: 'Poppins_400Regular', lineHeight: 21 },
  switchTarget: { minWidth: 48, minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  manage: { minHeight: 48, paddingHorizontal: 12, borderRadius: 24, borderWidth: 1.5, borderColor: '#167B70', backgroundColor: '#FFFFFF', alignSelf: 'flex-start', marginTop: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  manageText: { color: '#126B62', fontFamily: 'Poppins_700Bold', fontSize: 15, flexShrink: 1, textAlign: 'center' },
  chevron: { color: '#126B62', fontSize: 29 },
  sizes: { flexDirection: 'row', gap: 5, marginTop: 8 },
  sizeButton: { flex: 1, minWidth: 0, minHeight: 56, borderRadius: 15, borderWidth: 1, borderColor: '#A9CCC0', backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', padding: 7 },
  sizeSelected: { backgroundColor: '#126B62', borderColor: '#126B62' },
  sizeText: { fontFamily: 'Poppins_700Bold', textAlign: 'center', color: '#126B62' },
  localNote: { padding: 13, fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 20 },
  experience: { minHeight: 56, borderWidth: 1.5, borderColor: '#167B70', borderRadius: 18, flexDirection: 'row', gap: 12, alignItems: 'center', justifyContent: 'center', padding: 12, backgroundColor: '#FFFFFF' },
  experienceText: { color: '#126B62', fontFamily: 'Poppins_700Bold', flexShrink: 1, textAlign: 'center' },
  currentRole: { fontFamily: 'Poppins_400Regular', textAlign: 'center' },
});
