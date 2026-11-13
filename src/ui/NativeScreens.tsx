import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState, type PropsWithChildren } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import * as Speech from 'expo-speech';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRole } from '../role/RoleContext';
import { useAccessibility } from '../accessibility/AccessibilityContext';
import { type EmergencyContactRow } from '../data/database';
import { colors, typeScale } from './theme';

export function NativePage({ title, intro, children, showSos = true }: PropsWithChildren<{ title: string; intro: string; showSos?: boolean }>) {
  const { role } = useRole();
  const access = useAccessibility();
  return <SafeAreaView style={[s.safe, { backgroundColor: access.highContrast ? colors.white : colors.canvas }]} edges={['top']}>
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <AppHeader showSos={showSos} />
      <Text style={[s.eyebrow, { fontSize: 13 * access.textScale }]}>{role === 'caregiver' ? 'ESPACIO FAMILIAR' : 'TU ESPACIO'}</Text>
      <Text accessibilityRole="header" style={[s.title, { fontSize: typeScale.title * access.textScale, lineHeight: 38 * access.textScale }]}>{title}</Text>
      {!!intro && <Text style={[s.intro, { fontSize: typeScale.body * access.textScale, lineHeight: 27 * access.textScale }]}>{intro}</Text>}
      {children}
    </ScrollView>
  </SafeAreaView>;
}

export function AppHeader({ showSos = true }: { showSos?: boolean }) {
  const access = useAccessibility();
  return <View style={s.header}>
    <View style={s.brandMark}><Text style={s.brandInitial}>C</Text></View>
    <View style={s.brandCopy}><Text style={s.brand}>CuidadoCerca</Text><Text style={s.brandTag}>Tu cuidado, organizado y siempre cerca</Text></View>
    {showSos && <Pressable accessibilityRole="button" accessibilityLabel="Abrir ayuda SOS" onPress={() => router.push('/sos')} style={({ pressed }) => [s.sosButton, pressed && s.pressed]}><Text style={[s.sosButtonText, { fontSize: 17 * access.textScale }]}>SOS</Text></Pressable>}
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
  return <Pressable accessibilityRole="button" onPress={() => router.push('/sos')} style={s.sosStrip}><View style={s.sosDot}><Text style={s.sosDotText}>!</Text></View><View style={s.sosStripCopy}><Text style={s.sosStripTitle}>¿Necesitas ayuda ahora?</Text><Text style={s.sosStripBody}>Abre tu opción de asistencia</Text></View><Text style={s.sosArrow}>›</Text></Pressable>;
}

export function FeaturePage({ title, intro, icon }: { title: string; intro: string; icon: string }) {
  return <NativePage title={title} intro={intro}>
    <EmptyState title="Todavía no hay información compartida" body={`La sección ${title.toLocaleLowerCase('es-PE')} mostrará únicamente datos autorizados por la persona mayor y disponibles en una cuenta vinculada.`} />
    <AccessibleCard icon={icon} title="Privacidad primero" body="Esta instalación guarda los registros en este dispositivo. No hay cuentas vinculadas ni sincronización con familiares." />
  </NativePage>;
}

export function ProfilePage() {
  const db = useSQLiteContext();
  const { role, clearRole } = useRole();
  const access = useAccessibility();
  const [contact, setContact] = useState<EmergencyContactRow | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');
  const [saving, setSaving] = useState(false);
  const load = useCallback(async () => {
    const row = await db.getFirstAsync<EmergencyContactRow>('SELECT * FROM emergency_contacts ORDER BY id LIMIT 1');
    setContact(row ?? null);
    if (row) { setName(row.name); setPhone(row.phone); setRelationship(row.relationship); }
  }, [db]);
  useEffect(() => { void load(); }, [load]);
  const saveContact = async () => {
    const safePhone = phone.trim().replace(/[\s()-]/g, '');
    if (!name.trim() || !/^\+?[0-9]{7,15}$/.test(safePhone)) { Alert.alert('Revisa el contacto', 'Escribe un nombre y un teléfono válido.'); return; }
    setSaving(true);
    if (contact) await db.runAsync('UPDATE emergency_contacts SET name=?, phone=?, relationship=? WHERE id=?', name.trim(), safePhone, relationship.trim(), contact.id);
    else await db.runAsync('INSERT INTO emergency_contacts (name, phone, relationship) VALUES (?,?,?)', name.trim(), safePhone, relationship.trim());
    await load(); setSaving(false); Alert.alert('Contacto guardado', 'El número queda en este dispositivo. Una llamada SOS abrirá el marcador para que la confirmes.');
  };
  const removeContact = () => Alert.alert('Quitar contacto', '¿Quieres quitar el contacto SOS guardado en este dispositivo?', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Quitar', style: 'destructive', onPress: async () => { await db.runAsync('DELETE FROM emergency_contacts'); setContact(null); setName(''); setPhone(''); setRelationship(''); } }]);
  return <NativePage title="Mi perfil" intro="Ajusta CuidadoCerca para que te resulte más cómodo.">
    <SectionHeader title="Accesibilidad" />
    <PreferenceRow title="Modo sencillo" detail="Reduce opciones visibles y mantiene las acciones principales." value={access.simpleMode} onChange={value => void access.update({ simpleMode: value })} />
    <PreferenceRow title="Alto contraste" detail="Aumenta la separación entre texto y fondo." value={access.highContrast} onChange={value => void access.update({ highContrast: value })} />
    <View style={s.preferenceBlock}><Text style={s.preferenceTitle}>Tamaño del texto</Text><View style={s.sizeOptions}>{[[1, 'Normal'], [1.15, 'Grande'], [1.3, 'Muy grande']].map(([scale, label]) => <Pressable key={String(scale)} accessibilityRole="radio" accessibilityState={{ selected: access.textScale === scale }} onPress={() => void access.update({ textScale: Number(scale) })} style={[s.sizeButton, access.textScale === scale && s.sizeActive]}><Text style={[s.sizeText, access.textScale === scale && s.sizeTextActive]}>{label}</Text></Pressable>)}</View></View>
    <SecondaryButton label="Escuchar las opciones" onPress={() => Speech.speak('CuidadoCerca. Ajusta el modo sencillo, el contraste y el tamaño del texto. También puedes guardar un contacto de emergencia.', { language: 'es-PE' })} />
    {role === 'older-adult' && <>
      <SectionHeader title="Contacto para SOS" />
      <AccessibleCard title={contact ? 'Contacto guardado en este teléfono' : 'Añade a alguien de confianza'} body="Al activar SOS, CuidadoCerca pedirá confirmación y abrirá el marcador telefónico. No llama ni envía mensajes en segundo plano.">
        <TextInput accessibilityLabel="Nombre del contacto de emergencia" placeholder="Nombre" value={name} onChangeText={setName} style={s.input} />
        <TextInput accessibilityLabel="Teléfono del contacto de emergencia" placeholder="Teléfono con código de país si aplica" keyboardType="phone-pad" value={phone} onChangeText={setPhone} style={s.input} />
        <TextInput accessibilityLabel="Relación con el contacto" placeholder="Relación (opcional)" value={relationship} onChangeText={setRelationship} style={s.input} />
        <PrimaryButton label={saving ? 'Guardando…' : 'Guardar contacto'} disabled={saving} onPress={() => void saveContact()} />
        {contact && <SecondaryButton label="Quitar contacto" onPress={removeContact} />}
      </AccessibleCard>
      <SectionHeader title="Compartir información" />
      <AccessibleCard title="Tú decides" body="No hay cuentas vinculadas. Estas preferencias quedan guardadas localmente; no conceden acceso a otra persona todavía." />
      {(['citas', 'medicamentos', 'actividades', 'documentos'] as const).map(scope => <SharePreference key={scope} scope={scope} />)}
    </>}
    <AccessibleCard icon="▣" title="Privacidad" body="Tus datos de actividades, salud y preferencias permanecen en este dispositivo. No hay backend ni sincronización activos." />
    <SecondaryButton label="Cambiar experiencia" onPress={() => { void clearRole().then(() => router.replace('/')); }} />
    <Text style={s.caption}>Experiencia: {role === 'caregiver' ? 'Familiar o cuidador' : 'Persona mayor'}</Text>
  </NativePage>;
}

function SharePreference({ scope }: { scope: 'citas' | 'medicamentos' | 'actividades' | 'documentos' }) {
  const db = useSQLiteContext();
  const [value, setValue] = useState(false);
  const label = `share:${scope}`;
  useEffect(() => { let active = true; void db.getFirstAsync<{ value: string }>('SELECT value FROM preferences WHERE key=?', label).then(row => { if (active) setValue(row?.value === 'true'); }); return () => { active = false; }; }, [db, label]);
  const change = async (next: boolean) => { await db.runAsync('INSERT OR REPLACE INTO preferences (key,value) VALUES (?,?)', label, String(next)); setValue(next); };
  return <PreferenceRow title={`Permitir compartir ${scope}`} detail="Preferencia local; no se comparte mientras no haya una cuenta autorizada." value={value} onChange={value => void change(value)} />;
}

export function FamilyPage() {
  const db = useSQLiteContext();
  const [requestKind, setRequestKind] = useState('');
  const [message, setMessage] = useState('');
  const [requests, setRequests] = useState<{ id: number; kind: string; message: string; created_at: string }[]>([]);
  const load = useCallback(async () => setRequests(await db.getAllAsync('SELECT id,kind,message,created_at FROM care_requests ORDER BY id DESC')), [db]);
  useEffect(() => { void load(); }, [load]);
  const saveRequest = async () => {
    if (!requestKind) { Alert.alert('Elige una solicitud', 'Selecciona qué tipo de ayuda necesitas.'); return; }
    await db.runAsync('INSERT INTO care_requests (kind,message,state) VALUES (?,?,?)', requestKind, message.trim(), 'draft');
    setRequestKind(''); setMessage(''); await load();
    Alert.alert('Guardada en este teléfono', 'La solicitud no se ha enviado: hace falta vincular una cuenta y un servicio de sincronización.');
  };
  return <NativePage title="Mi familia" intro="Pide apoyo y conserva el control sobre tu información.">
    <AccessibleCard title="Personas vinculadas" body="Todavía no hay cuentas familiares vinculadas. Tus datos privados no están compartidos." />
    <SectionHeader title="Pedir acompañamiento" />
    {['Acompáñame a mi cita', 'Ayúdame con un trámite', 'Ayúdame con mis medicamentos', 'Necesito ayuda con mis documentos'].map(item => <Pressable key={item} accessibilityRole="radio" accessibilityState={{ selected: requestKind === item }} onPress={() => setRequestKind(item)} style={[s.requestOption, requestKind === item && s.requestSelected]}><Text style={[s.requestText, requestKind === item && s.requestTextSelected]}>{item}</Text></Pressable>)}
    <TextInput accessibilityLabel="Detalle de la solicitud" placeholder="Añade un detalle (opcional)" value={message} onChangeText={setMessage} style={[s.input, s.multiline]} multiline />
    <PrimaryButton label="Guardar solicitud en este teléfono" onPress={() => void saveRequest()} />
    {requests.length > 0 && <><SectionHeader title="Solicitudes guardadas aquí" />{requests.map(item => <AccessibleCard key={item.id} title={item.kind} body={`${item.message ? `${item.message} · ` : ''}Borrador local, no enviado`} />)}</>}
    <AccessibleCard title="Permisos de información" body="Configura tus preferencias desde Perfil. Solo serán efectivas para compartir cuando exista una cuenta vinculada y un servicio conectado." />
  </NativePage>;
}

export function AssistanceInfoPage() {
  return <NativePage title="Asistencia SOS" intro="La ayuda debe ser clara, rápida y segura.">
    <SosCard />
    <AccessibleCard title="Qué ocurre al activar SOS" body="CuidadoCerca pedirá confirmación y abrirá el marcador para llamar al contacto que guardaste. No realiza llamadas ni envía alertas automáticamente." />
    <AccessibleCard title="Asistencia por voz" body="Puedes iniciar reconocimiento en esta pantalla con una pulsación. No se mantiene el micrófono escuchando al salir de la aplicación." />
  </NativePage>;
}

function PreferenceRow({ title, detail, value, onChange }: { title: string; detail: string; value: boolean; onChange: (value: boolean) => void }) {
  return <View style={s.preference}><View style={s.prefCopy}><Text style={s.prefTitle}>{title}</Text><Text style={s.caption}>{detail}</Text></View><Switch accessibilityRole="switch" accessibilityLabel={title} value={value} onValueChange={onChange} trackColor={{ false: '#8B7B73', true: colors.accent }} thumbColor={colors.white} /> </View>;
}

const s = StyleSheet.create({
  safe: { flex: 1 }, content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 9, paddingBottom: 28, gap: 15 },
  header: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 10 }, brandMark: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary }, brandInitial: { color: colors.white, fontFamily: 'Poppins_700Bold', fontSize: 24 }, brandCopy: { flex: 1, gap: 0 }, brand: { color: colors.primary, fontFamily: 'Poppins_700Bold', fontSize: 16 }, brandTag: { color: colors.muted, fontFamily: 'Poppins_400Regular', fontSize: 10 }, sosButton: { minWidth: 66, minHeight: 50, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: '#A12D20' }, sosButtonText: { color: colors.white, fontFamily: 'Poppins_700Bold', fontSize: 17 },
  eyebrow: { color: colors.accent, fontSize: 13, fontWeight: '700', letterSpacing: 1, fontFamily: 'Poppins_700Bold' }, title: { color: colors.ink, fontSize: typeScale.title, lineHeight: 38, fontWeight: '700', fontFamily: 'Poppins_700Bold' }, intro: { color: colors.muted, fontSize: typeScale.body, lineHeight: 27, marginBottom: 2, fontFamily: 'Poppins_400Regular' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 3 }, sectionTitle: { flex: 1, color: colors.ink, fontSize: 20, lineHeight: 27, fontWeight: '700', fontFamily: 'Poppins_700Bold' }, sectionAction: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 }, sectionActionText: { color: colors.primary, fontFamily: 'Poppins_600SemiBold', fontSize: 15 },
  primaryButton: { minHeight: 54, paddingHorizontal: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary }, primaryButtonText: { color: colors.white, fontSize: 17, fontWeight: '700', fontFamily: 'Poppins_700Bold', textAlign: 'center' }, secondaryButton: { minHeight: 52, paddingHorizontal: 15, borderWidth: 1.5, borderColor: colors.primary, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white }, secondaryButtonText: { color: colors.primary, fontSize: 16, fontWeight: '700', fontFamily: 'Poppins_600SemiBold', textAlign: 'center' }, pressed: { opacity: 0.78 }, disabled: { opacity: 0.5 },
  card: { padding: 16, gap: 10, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 17 }, cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 }, cardIcon: { minWidth: 40, minHeight: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAlt }, cardIconText: { color: colors.primary, fontSize: 20, fontWeight: '700' }, cardTitle: { flex: 1, color: colors.ink, fontSize: 18, lineHeight: 25, fontWeight: '700', fontFamily: 'Poppins_700Bold' }, cardBody: { color: colors.muted, fontSize: 16, lineHeight: 23, fontFamily: 'Poppins_400Regular' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: colors.surfaceAlt }, badgePositive: { backgroundColor: '#E5F3E7' }, badgeWarning: { backgroundColor: '#FFF0D4' }, badgeText: { color: colors.ink, fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  emptyState: { alignItems: 'flex-start', padding: 18, gap: 10, borderRadius: 17, backgroundColor: colors.surfaceAlt }, emptySymbol: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white }, emptySymbolText: { color: colors.accent, fontSize: 25, fontWeight: '700' }, emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: '700', fontFamily: 'Poppins_700Bold' }, emptyBody: { color: colors.muted, fontSize: 16, lineHeight: 23, fontFamily: 'Poppins_400Regular' },
  sosStrip: { minHeight: 74, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: '#EBC7BD', borderRadius: 17, backgroundColor: '#FFF1EC' }, sosDot: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#A12D20', alignItems: 'center', justifyContent: 'center' }, sosDotText: { color: colors.white, fontSize: 22, fontWeight: '700' }, sosStripCopy: { flex: 1, gap: 2 }, sosStripTitle: { color: '#6F221A', fontSize: 16, fontFamily: 'Poppins_700Bold' }, sosStripBody: { color: colors.muted, fontSize: 14, fontFamily: 'Poppins_400Regular' }, sosArrow: { color: colors.primary, fontSize: 29, fontWeight: '600' },
  preference: { minHeight: 72, padding: 12, borderRadius: 14, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', gap: 10, borderColor: colors.border, borderWidth: 1 }, prefCopy: { flex: 1, gap: 3 }, prefTitle: { fontSize: 16, lineHeight: 23, color: colors.ink, fontWeight: '700', fontFamily: 'Poppins_600SemiBold' }, caption: { color: colors.muted, fontSize: 14, lineHeight: 20, fontFamily: 'Poppins_400Regular' }, preferenceBlock: { gap: 10, padding: 14, borderRadius: 14, backgroundColor: colors.white, borderColor: colors.border, borderWidth: 1 }, preferenceTitle: { color: colors.ink, fontSize: 17, fontWeight: '700', fontFamily: 'Poppins_600SemiBold' }, sizeOptions: { flexDirection: 'row', gap: 8 }, sizeButton: { flex: 1, minHeight: 50, padding: 5, borderWidth: 1, borderColor: colors.primary, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, sizeActive: { backgroundColor: colors.primary }, sizeText: { color: colors.primary, fontSize: 13, fontFamily: 'Poppins_600SemiBold', textAlign: 'center' }, sizeTextActive: { color: colors.white },
  input: { minHeight: 52, paddingHorizontal: 13, borderWidth: 1, borderColor: '#8A746B', borderRadius: 12, backgroundColor: colors.white, color: colors.ink, fontSize: 16, fontFamily: 'Poppins_400Regular' }, multiline: { minHeight: 96, textAlignVertical: 'top', paddingTop: 12 }, requestOption: { minHeight: 52, paddingHorizontal: 14, justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 13, backgroundColor: colors.white }, requestSelected: { borderWidth: 2, borderColor: colors.primary, backgroundColor: '#FFF3ED' }, requestText: { color: colors.ink, fontSize: 16, fontFamily: 'Poppins_600SemiBold' }, requestTextSelected: { color: colors.primary },
});
