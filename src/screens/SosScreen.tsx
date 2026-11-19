import { DesignIcon } from '../ui/DesignIcon';
import { SosAttemptStatus, CancelSosButton, CountdownRing, SosContactCard, SosBanner, SosFooterWaves, SosOption } from '../ui/CareVisuals';
import { DateTimeFields } from '../ui/ScheduleFields';
import { displayDateTime, parseDateTime } from '../ui/dateTime';
import { colors } from '../ui/theme';
import { router, useFocusEffect, useLocalSearchParams, useNavigation } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { selectDeviceContact } from '../services/DeviceContacts';
import { normalizeContactPhone } from '../services/contactSelection';
import { useAccessibility } from '../accessibility/AccessibilityContext';
import { type EmergencyContactRow } from '../data/database';
import { useRole } from '../role/RoleContext';
import { openHelpSms, openHelpWhatsApp, openSosCall, prepareHelpMessage, requestRecentLocation, requestSosPermissions, sendHelpSms } from '../services/SosActions';
import { AccessibleCard, EmptyState, NativePage, PrimaryButton, SecondaryButton } from '../ui/NativeScreens';
import { VoiceAssistant } from '../ui/VoiceAssistant';

export function SosScreen() {
  const db = useSQLiteContext();
  const { role } = useRole();
  const { textScale } = useAccessibility();
  const navigation = useNavigation();
  const { activar } = useLocalSearchParams<{ activar?: string }>();
  const [contact, setContact] = useState<EmergencyContactRow | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [seconds, setSeconds] = useState<number | null>(null);
  const [callStatus, setCallStatus] = useState('');
  const [smsStatus, setSmsStatus] = useState('');
  const [whatsAppStatus, setWhatsAppStatus] = useState('');
  const [permissionStatus, setPermissionStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [manualSms, setManualSms] = useState(false);
  const [speech, setSpeech] = useState('');
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [when, setWhen] = useState(displayDateTime);
  const [editing, setEditing] = useState(false);
  const [formStatus, setFormStatus] = useState('');
  const [contactEditing, setContactEditing] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactError, setContactError] = useState('');
  const [contactSaving, setContactSaving] = useState(false);
  const contactSavingRef = useRef(false);
  const [contactPicking, setContactPicking] = useState(false);
  const pickingRef = useRef(false);
  const [phoneChoices, setPhoneChoices] = useState<{ number: string; label: string }[]>([]);
  const [contactPermissionBlocked, setContactPermissionBlocked] = useState(false);
  async function pickContact() {
    if (pickingRef.current || contactSavingRef.current) return;
    pickingRef.current = true; setContactPicking(true); setContactError(''); setContactPermissionBlocked(false);
    try {
      const result = await selectDeviceContact();
      if (result.status === 'selected') {
        setContactName(result.contact.name); setPhoneChoices(result.contact.phones.length > 1 ? result.contact.phones : []);
        setContactPhone(result.contact.phones.length === 1 ? result.contact.phones[0].number : '');
      } else if (result.status === 'denied') {
        setContactError('Para elegir un contacto, permite el acceso a Contactos. También puedes escribirlo manualmente.'); setContactPermissionBlocked(!result.canAskAgain);
      } else if (result.status === 'no-phone') setContactError('Ese contacto no tiene un número válido. Elige otro o escríbelo manualmente.');
      else if (result.status === 'unsupported') setContactError('El selector de contactos está disponible en la aplicación del teléfono. En esta vista puedes usar las casillas manuales.');
    } catch { setContactError('No se pudo abrir Contactos. Puedes volver a intentarlo o completar las casillas manualmente.'); }
    finally { pickingRef.current = false; setContactPicking(false); }
  }
  function editContact() {
    setContactName(contact?.name ?? '');
    setContactPhone(contact?.phone ?? '');
    setContactError('');
    setPhoneChoices([]); setContactPermissionBlocked(false);
    setContactEditing(true);
  }
  async function saveContact() {
    if (contactSavingRef.current) return;
    const phone = normalizeContactPhone(contactPhone);
    if (!contactName.trim() || !/^\+?[0-9]{7,15}$/.test(phone)) {
      setContactError('Escribe un nombre y un teléfono válido.'); return;
    }
    contactSavingRef.current = true; setContactSaving(true);
    try {
      await db.withTransactionAsync(async () => {
        const row = await db.getFirstAsync<EmergencyContactRow>('SELECT * FROM emergency_contacts ORDER BY id LIMIT 1');
        if (row) await db.runAsync('UPDATE emergency_contacts SET name=?,phone=? WHERE id=?', contactName.trim(), phone, row.id);
        else await db.runAsync('INSERT INTO emergency_contacts (name,phone,relationship) VALUES (?,?,?)', contactName.trim(), phone, '');
      });
      setContact(await db.getFirstAsync<EmergencyContactRow>('SELECT * FROM emergency_contacts ORDER BY id LIMIT 1'));
      setContactEditing(false);
    } catch { setContactError('No se pudo guardar el contacto. Inténtalo de nuevo.'); }
    finally { contactSavingRef.current = false; setContactSaving(false); }
  }
  const autoStarted = useRef(false);
  const deadline = useRef<number | null>(null);
  const android = Platform.OS === 'android';

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoaded(false);
    void db.getFirstAsync<EmergencyContactRow>('SELECT * FROM emergency_contacts ORDER BY id LIMIT 1')
      .then(row => { if (active) { setContact(row ?? null); setLoaded(true); } })
      .catch(() => { if (active) setCallStatus('No se pudo consultar el contacto SOS.'); });
    return () => { active = false; deadline.current = null; setSeconds(null); };
  }, [db]));

  const begin = useCallback(() => {
    if ((android && !contact) || busy || deadline.current !== null) return;
    setCallStatus(''); setSmsStatus(''); setWhatsAppStatus(''); setManualSms(false);
    deadline.current = Date.now() + 3000;
    setSeconds(3);
    void requestRecentLocation().catch(() => {});
  }, [android, contact, busy]);

  useEffect(() => {
    if (activar === '1' && contact && loaded && !autoStarted.current) {
      autoStarted.current = true;
      begin();
    }
  }, [activar, begin, contact, loaded]);

  const cancel = useCallback(() => {
    deadline.current = null;
    setSeconds(null);
    setCallStatus('SOS cancelado.');
  }, []);
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state !== 'active' && deadline.current !== null) cancel();
    });
    return () => sub.remove();
  }, [cancel]);

  useEffect(() => {
    if (seconds === null) return;
    const timer = setInterval(() => {
      const end = deadline.current;
      if (end === null || !navigation.isFocused()) return;
      const remaining = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      if (remaining > 0) { setSeconds(remaining); return; }

      deadline.current = null;
      setSeconds(null);
      setBusy(true);
      setCallStatus(android ? 'Abriendo la llamada…' : 'Conteo terminado. Usa Android para probar la llamada.');
      const call = android && contact
        ? openSosCall(contact.phone, true, () => setCallStatus('Marcador abierto. Pulsa Llamar en el teléfono.'))
          .catch(() => setCallStatus('No se pudo abrir el teléfono.'))
        : Promise.resolve();
      const sms = android && contact ? prepareHelpMessage().then(async message => {
        const sent = await sendHelpSms(contact.phone, message).catch(() => false);
        if (sent) setSmsStatus(message.includes('https://') ? 'SMS con ubicación entregado al sistema. Recepción sin confirmar.'
          : 'SMS sin ubicación entregado al sistema. Recepción sin confirmar.');
        else { setManualSms(true); setSmsStatus('SMS pendiente. Puedes abrir el borrador y enviarlo desde Mensajes.'); }
      }) : Promise.resolve();
      void Promise.allSettled([call, sms]).then(() => setBusy(false));
    }, 100);
    return () => clearInterval(timer);
  }, [android, contact, navigation, seconds]);

  async function configure() {
    try {
      setPermissionStatus(await requestSosPermissions());
      void requestRecentLocation().catch(() => {});
    } catch {
      setPermissionStatus('Revisa en los ajustes de Android los permisos de teléfono, SMS y ubicación.');
    }
  }

  const afterAttempt = !!callStatus;
  return <NativePage showSos={false} compactHeader title="SOS" intro="Puedes cancelar durante los tres segundos del conteo.">
    <SosBanner result={afterAttempt} />
    {afterAttempt && <SosAttemptStatus call={callStatus} sms={smsStatus} />}
    {loaded && (contact || seconds !== null || afterAttempt ? <SosContactCard name={contact?.name} phone={contact?.phone} resultStyle={afterAttempt} />
      : <EmptyState title="Configura un contacto SOS" body="Guarda el número de una persona de confianza."
          action={role === 'caregiver' ? 'Cambiar a Persona Mayor' : 'Configurar contacto'}
          onAction={() => role === 'caregiver' ? router.push('/experience') : editContact()} />)}
    {seconds !== null ? <View style={{ backgroundColor: 'transparent', borderRadius: 24, paddingHorizontal: 4, paddingVertical: 12, gap: 18, alignItems: 'stretch' }}>

      <CountdownRing seconds={seconds} endsAt={deadline.current} />
      <Text style={{ color: '#000000', fontSize: 16 * textScale, lineHeight: 24, textAlign: 'center', paddingHorizontal: 14 }}>{android ? 'El teléfono intentará contactar a ' + contact?.name + ' al terminar el conteo.' : 'En Android, el teléfono intentará contactar a la persona configurada al terminar el conteo.'}</Text>
      <CancelSosButton onPress={cancel} />
    </View> : <>
      {!afterAttempt && contact && <PrimaryButton label="Activar SOS" disabled={busy} onPress={begin} />}
      {!afterAttempt && contact && <SecondaryButton label="Editar contacto de SOS" onPress={editContact} />}
      {!afterAttempt && !android && !contact && <PrimaryButton label="Probar cuenta regresiva" onPress={begin} />}
      {!afterAttempt && android && <SosOption icon="⚙" label="Configurar permisos SOS" onPress={() => void configure()} />}
      {!afterAttempt && <Text>{android ? 'Autoriza llamada, SMS y ubicación antes de usar SOS. Se adjunta una ubicación reciente si el teléfono puede obtenerla.'
        : 'En la vista web puedes revisar el conteo. Las acciones de llamada y SMS están disponibles en Android.'}</Text>}
      {!afterAttempt && !!permissionStatus && <Text accessibilityLiveRegion="polite">{permissionStatus}</Text>}

      {!afterAttempt && !!smsStatus && <Text accessibilityLiveRegion="polite">{smsStatus}</Text>}
      {!afterAttempt && android && contact && <SecondaryButton label="Enviar ayuda por WhatsApp" onPress={() => {
        setWhatsAppStatus('Preparando el mensaje…');
        void prepareHelpMessage().then(async message => {
          await openHelpWhatsApp(contact.phone, message);
          setWhatsAppStatus(message.includes('https://') ? 'WhatsApp abierto con tu ubicación. Pulsa Enviar en el chat.'
            : 'WhatsApp abierto sin ubicación reciente. Pulsa Enviar en el chat.');
        }).catch(() => setWhatsAppStatus('No se pudo abrir WhatsApp. Revisa el número del contacto.'));
      }} />}
      {!afterAttempt && !android && <Text>En Android, el botón Enviar ayuda por WhatsApp abre el chat del contacto con el mensaje y tu ubicación reciente, si está disponible.</Text>}
      {!!whatsAppStatus && <Text accessibilityLiveRegion="polite">{whatsAppStatus}</Text>}
      {manualSms && contact && (!afterAttempt || editing) && <SecondaryButton label="Abrir borrador de ayuda" onPress={() => {
        void prepareHelpMessage().then(message => openHelpSms(contact.phone, message))
          .catch(() => setSmsStatus('No se pudo abrir Mensajes.'));
      }} />}
      {!afterAttempt && !busy && <VoiceAssistant label="Hablar para pedir ayuda" onTranscript={text => {
        setSpeech(text);
        if (!contact) return;
        if (/\b(ayuda|ayudame|auxilio|emergencia|socorro)\b/i.test(text.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) begin();
      }} />}
      {!afterAttempt && !!speech && <Text accessibilityLiveRegion="polite">Escuché: {speech}{contact ? '' : '. Configura un contacto para activar el SOS.'}</Text>}
      <SosOption tone={afterAttempt ? 'resultSoft' : 'amber'} icon="mensaje" label={editing ? 'Cerrar mensaje de ayuda' : 'Preparar mensaje de ayuda'} onPress={() => { if (!editing && !title && !detail) setWhen(displayDateTime()); setEditing(!editing); }} />
      <Modal transparent visible={editing} animationType="none" onRequestClose={() => setEditing(false)}>
        <View style={{ flex: 1, padding: 16, backgroundColor: '#13292088', justifyContent: 'center' }}><View accessibilityViewIsModal style={{ borderRadius: 24, backgroundColor: '#FFFFFF', maxHeight: '92%', padding: 16 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 14 }}>
        <SecondaryButton label="Cerrar mensaje de ayuda" onPress={() => setEditing(false)} />
        <AccessibleCard title="Mensaje de ayuda" body="Revisa el mensaje antes de abrirlo en Mensajes.">
        <TextInput accessibilityLabel="Título" placeholder="Título" value={title} maxLength={80} onChangeText={setTitle} style={[sosInput, { fontSize: 18 * textScale, minHeight: 54 * textScale }]} />
        <VoiceAssistant label="Dictar título" onTranscript={text => setTitle(text.slice(0, 80))} />
        <DateTimeFields grouped value={when} onChange={setWhen} />
        <TextInput accessibilityLabel="Detalle" placeholder="Detalle" multiline value={detail} maxLength={240} onChangeText={setDetail} style={[sosInput, { fontSize: 18 * textScale, minHeight: 54 * textScale }]} />
        <VoiceAssistant label="Dictar detalle" onTranscript={text => setDetail(text.slice(0, 240))} />
        <PrimaryButton label="Abrir mensaje para revisar" onPress={() => {
          if (!contact) { setFormStatus('Configura un contacto SOS primero.'); return; }
          if (!parseDateTime(when)) { setFormStatus('Revisa la fecha y la hora.'); return; }
          if (Platform.OS === 'web') { setFormStatus('La vista web permite revisar los campos. Para abrir Mensajes, usa Android.'); return; }
          setFormStatus('');
          void prepareHelpMessage().then(message => openHelpSms(contact.phone, [title.trim(), when, detail.trim(), message].filter(Boolean).join('\n')))
            .catch(() => setFormStatus('No se pudo abrir Mensajes.'));
        }} />
        {!!formStatus && <Text accessibilityLiveRegion="polite">{formStatus}</Text>}
      </AccessibleCard></ScrollView></View></View></Modal>
      {afterAttempt && <SosOption tone="result" icon="editar" label="Editar contacto de SOS" onPress={editContact} />}
      {afterAttempt && <SosOption tone="result" icon="⚙" label="Configurar permisos SOS" onPress={() => {
        if (android) void configure(); else setPermissionStatus('Abre CuidadoCerca en tu teléfono para configurar los permisos.');
      }} />}
      {afterAttempt && !!permissionStatus && <Text accessibilityLiveRegion="polite" style={{ fontSize: 16 * textScale, color: colors.muted }}>{permissionStatus}</Text>}
    </>}
    {seconds === null && <SosOption tone={afterAttempt ? 'resultBack' : 'outline'} icon="←" label="Volver" onPress={() => router.back()} />}
    {afterAttempt && <View style={{ marginTop: 'auto', paddingTop: 28, marginHorizontal: -20, marginBottom: -28 }}><SosFooterWaves /></View>}
    <Modal transparent visible={contactEditing} animationType="none" onRequestClose={() => { if (!contactSaving) setContactEditing(false); }}>
      <View style={{ flex: 1, padding: 22, backgroundColor: '#13292088', justifyContent: 'center' }}><View accessibilityViewIsModal style={{ maxHeight: '90%', borderRadius: 25, backgroundColor: '#FFFFFF', padding: 22 }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 15 }}>
      <View style={{ width: 58, height: 58, borderRadius: 18, backgroundColor: '#D5F4E8', alignItems: 'center', justifyContent: 'center' }}><DesignIcon name="person" size={32} /></View>
      <Text accessibilityRole="header" style={{ fontFamily: 'Poppins_700Bold', color: '#253238', fontSize: 23 * textScale }}>Editar contacto de SOS</Text>
      <Text style={{ fontFamily: 'Poppins_400Regular', color: '#52636B', fontSize: 16 * textScale }}>Elige a la persona de confianza que contactarás cuando necesites ayuda.</Text>
      <Pressable accessibilityRole="button" disabled={contactPicking || contactSaving} onPress={() => void pickContact()} style={({ pressed }) => ({ minHeight: 56, padding: 12, borderRadius: 15, backgroundColor: '#E6F4F1', borderWidth: 1, borderColor: '#A9D8CC', flexDirection: 'row', alignItems: 'center', gap: 10, opacity: pressed || contactPicking ? 0.7 : 1 })}><DesignIcon name="users" /><Text style={{ flex: 1, fontFamily: 'Poppins_700Bold', color: '#167B70', fontSize: 16 * textScale, textAlign: 'center' }}>{contactPicking ? 'Abriendo contactos…' : 'Elegir de mis contactos'}</Text></Pressable>
      {phoneChoices.length > 1 && <View accessibilityRole="radiogroup" style={{ gap: 8 }}><Text style={{ color: '#253238', fontFamily: 'Poppins_600SemiBold', fontSize: 16 * textScale }}>Elige el número de este contacto</Text>{phoneChoices.map(phone => <Pressable key={phone.number} accessibilityRole="radio" accessibilityState={{ checked: contactPhone === phone.number }} onPress={() => setContactPhone(phone.number)} style={{ minHeight: 54, padding: 12, borderWidth: 1, borderColor: '#167B70', borderRadius: 14, backgroundColor: contactPhone === phone.number ? '#D5F4E8' : '#FFFFFF', flexDirection: 'row', gap: 10, alignItems: 'center' }}><DesignIcon name={contactPhone === phone.number ? 'check' : 'phone'} /><Text style={{ flex: 1, fontFamily: 'Poppins_600SemiBold', color: '#126B62', fontSize: 17 * textScale }}>{phone.number}</Text></Pressable>)}</View>}
      <Text style={{ fontFamily: 'Poppins_600SemiBold', color: colors.ink, fontSize: 16 * textScale }}>Nombre del contacto</Text>
      <View style={contactInput}><DesignIcon name="person" /><TextInput accessibilityLabel="Nombre del contacto SOS" autoComplete="name" value={contactName} onChangeText={setContactName} style={{ flex: 1, minHeight: 54, minWidth: 0, fontFamily: 'Poppins_400Regular', fontSize: 18 * textScale, color: colors.ink }} /></View>
      <Text style={{ fontFamily: 'Poppins_600SemiBold', color: colors.ink, fontSize: 16 * textScale }}>Número de teléfono</Text>
      <View style={contactInput}><DesignIcon name="phone" /><TextInput accessibilityLabel="Número de teléfono SOS" autoComplete="tel" keyboardType="phone-pad" value={contactPhone} onChangeText={setContactPhone} style={{ flex: 1, minHeight: 54, minWidth: 0, fontFamily: 'Poppins_400Regular', fontSize: 18 * textScale, color: colors.ink }} /></View>
      <Text style={{ color: '#52636B', fontSize: 13 * textScale }}>Incluye el código de país si el número es extranjero.</Text>
      {!!contactError && <Text accessibilityRole="alert" style={{ color: '#A32323', fontSize: 16 * textScale }}>{contactError}</Text>}
      {contactPermissionBlocked && <SecondaryButton label="Abrir permisos de Contactos" onPress={() => void Linking.openSettings().catch(() => setContactError('Abre Ajustes del teléfono → CuidadoCerca → Permisos → Contactos.'))} />}
      <PrimaryButton disabled={contactSaving || contactPicking} label={contactSaving ? 'Guardando…' : 'Guardar contacto'} onPress={() => void saveContact()} />
      <Pressable accessibilityRole="button" disabled={contactSaving} onPress={() => setContactEditing(false)} style={{ minHeight: 52, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#B8D3C7', borderRadius: 14 }}><Text style={{ fontFamily: 'Poppins_700Bold', color: colors.primary, fontSize: 17 * textScale }}>Cancelar</Text></Pressable>
      </ScrollView></View></View>
    </Modal>
  </NativePage>;
}

const contactInput = { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10, borderWidth: 1, borderColor: '#B8D3C7', borderRadius: 14, backgroundColor: '#F5FAF7', paddingHorizontal: 12 };
const sosInput = { minHeight: 54, borderRadius: 12, borderWidth: 1, borderColor: colors.muted,
  padding: 12, fontSize: 18, fontFamily: 'Poppins_400Regular', color: colors.ink, backgroundColor: colors.white };

















