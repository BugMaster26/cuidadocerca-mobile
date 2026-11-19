import ubigeo from '../src/data/peruUbigeo.json';
import { categories, nationalProcedures } from '../src/data/nationalProcedures';
import { limaMunicipalities } from '../src/data/limaMunicipalities';
import * as Location from 'expo-location';
import { VoiceAssistant } from '../src/ui/VoiceAssistant';
import { router } from 'expo-router';
import { useRole } from '../src/role/RoleContext';
import { useEffect, useRef, useState } from 'react';
import { Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useAccessibility } from '../src/accessibility/AccessibilityContext';
import { Alert } from '../src/ui/AppAlert';
import { AccessibleCard, EmptyState, NativePage, SecondaryButton, SectionHeader } from '../src/ui/NativeScreens';
import { colors } from '../src/ui/theme';

type Service = {
  name: string; category: string; phone?: string; detail: string; sourceTitle?: string; sourceUrl?: string; keywords?: string; requirements?: string;
  district?: string; address?: string; hours?: string; institution?: string; modality?: string;
};

const source = 'https://www.gob.pe/547';
const services: Service[] = [
  { name: 'Centro Materno Infantil El Progreso', category: 'Salud', district: 'Carabayllo',
    institution: 'MINSA', modality: 'Presencial', address: 'Av. Túpac Amaru, km 21½',
    detail: 'Establecimiento de salud en el distrito de Carabayllo. Consulta los servicios y la disponibilidad antes de acudir.',
    keywords: 'centro salud medico atencion medica consulta medica posta',
    sourceTitle: 'Referencia de ubicación publicada por DIGEMID (2024)',
    sourceUrl: 'https://www.digemid.minsa.gob.pe/Archivos/PortalWeb/Informativo/Contrafalme/Puntos_Acopio/PUNTOS_ACOPIO_LIMA-JUNIO_2024.pdf' },
  ...nationalProcedures,
  { name: 'Pensión 65 · Orientación', category: 'Adulto mayor y programas sociales', phone: '942962116',
    detail: 'Información sobre afiliación al programa de asistencia solidaria.', keywords: 'pension 65 programas sociales apoyo social',
    requirements: 'Consulta los requisitos de edad, DNI, clasificación socioeconómica y pensión en el portal oficial.',
    sourceUrl: 'https://www.gob.pe/114811-programa-nacional-de-asistencia-solidaria-pension-65' },
  { name: 'Fono ALEGRA', category: 'Justicia y orientación legal', phone: '1884',
    detail: 'Orientación jurídica gratuita del Ministerio de Justicia y Derechos Humanos.',
    keywords: 'asesoria legal orientacion familiar defensa de derechos', sourceUrl: 'https://www.gob.pe/562' },
  { name: 'CIAM · Guía de afiliación', category: 'Adulto mayor y programas sociales',
    detail: 'Consulta cómo solicitar la inscripción y acceder a programas y talleres para personas adultas mayores.',
    keywords: 'ciam centro integral adulto mayor talleres actividades recreativas',
    sourceUrl: 'https://www.gob.pe/37164-afiliarse-al-centro-integral-de-atencion-al-adulto-mayor-ciam-en-la-municipalidad' },
  { name: 'RENIEC · MAC Lima Norte', category: 'Identidad y documentos', district: 'Comas',
    address: 'Av. Los Ángeles 602, Mallplaza, segundo piso', detail: 'Atención presencial para trámites de DNI.',
    keywords: 'dni documento nacional identidad reniec identificacion',
    requirements: 'Consulta los requisitos del trámite en RENIEC antes de acudir.',
    sourceUrl: 'https://www.gob.pe/institucion/reniec/sedes?sheet=19' },
  { name: 'Trámites de RENIEC en línea', category: 'Identidad y documentos',
    detail: 'Consulta duplicado o renovación de DNI y copias certificadas de actas.',
    keywords: 'dni documento nacional de identidad partida nacimiento acta duplicado renovación',
    sourceUrl: 'https://www.gob.pe/institucion/reniec/tramites' },
  { name: 'Central policial', keywords: 'comisaria policia emergencia', category: 'Seguridad y emergencias', phone: '105', detail: 'Atención de emergencias policiales en Perú.' },
  { name: 'Infosalud', keywords: 'atencion medica orientacion salud', category: 'Salud', phone: '113', detail: 'Orientación e información de salud por teléfono.' },
  { name: 'Línea 100', category: 'Justicia y orientación legal', phone: '100', detail: 'Orientación ante violencia familiar o sexual.' },
  { name: 'Bomberos', category: 'Seguridad y emergencias', phone: '116', detail: 'Atención de emergencias por bomberos en Perú.' },
  { name: 'SAMU', keywords: 'ambulancia urgencia emergencia medica', category: 'Salud', phone: '106', detail: 'Urgencias y emergencias médicas en Lima y otras regiones con cobertura.' },
  ...limaMunicipalities.map(item => ({ ...item, category: 'Trámites municipales', keywords: 'atención municipal servicios municipales tramites municipalidad' })),
  ...[
    ['Ate', '014941210'], ['Barranco', '012470366'],
    ['Chaclacayo', '013582415'], ['Chorrillos', '012517001'], ['Jesús María', '014611070'],
    ['La Victoria', '014313000'], ['Lima Cercado', '013185050'], ['Lince', '014716389'],
    ['Los Olivos', '016138210'], ['Miraflores', '016177578'],
    ['Rímac', '015004040'], ['San Borja', '016311000'], ['San Isidro', '013190450'],
    ['San Martín de Porres', '017146000'], ['San Miguel', '013133003'], ['Surquillo', '014481680'],
  ].map(([district, phone]) => ({
    name: `Serenazgo de ${district}`, category: 'Seguridad y emergencias', district, phone,
    detail: 'Central distrital de serenazgo.',
  })),
];

const normalize = (text: string) => text.toLocaleLowerCase('es-PE').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const limaDistricts = [
  'Ancón', 'Ate', 'Barranco', 'Breña', 'Carabayllo', 'Chaclacayo', 'Chorrillos', 'Cieneguilla', 'Comas',
  'El Agustino', 'Independencia', 'Jesús María', 'La Molina', 'La Victoria', 'Lima Cercado', 'Lince',
  'Los Olivos', 'Lurigancho', 'Lurín', 'Magdalena del Mar', 'Miraflores', 'Pachacámac', 'Pucusana',
  'Pueblo Libre', 'Puente Piedra', 'Punta Hermosa', 'Punta Negra', 'Rímac', 'San Bartolo', 'San Borja',
  'San Isidro', 'San Juan de Lurigancho', 'San Juan de Miraflores', 'San Luis', 'San Martín de Porres',
  'San Miguel', 'Santa Anita', 'Santa María del Mar', 'Santa Rosa', 'Santiago de Surco', 'Surquillo',
  'Villa El Salvador', 'Villa María del Triunfo',
];

const featured = [
  { label: 'Salud', icon: '✚', groups: [categories[1]] },
  { label: 'DNI y documentos', icon: '▤', groups: [categories[0]] },
  { label: 'Apoyo al adulto mayor', icon: '♡', groups: [categories[2]] },
  { label: 'Trámites municipales', icon: '▣', groups: [categories[3]] },
  { label: 'Orientación legal', icon: '⚖', groups: [categories[4]] },
  { label: 'Pensiones y finanzas', icon: '◎', groups: [categories[5], categories[11]] },
  { label: 'Transporte', icon: '↔', groups: [categories[8]] },
  { label: 'Seguridad y emergencias', icon: '!', groups: [categories[9]] },
];
const extra = [categories[6], categories[7], categories[10]].map(label => ({ label, icon: '•', groups: [label] }));
function districtKey(value: string) {
  const key = normalize(value).trim().replace(/^distrito de /, '');
  if (['lima', 'cercado de lima'].includes(key)) return 'lima cercado';
  if (['chosica', 'lurigancho-chosica'].includes(key)) return 'lurigancho';
  return key;
}

function open(url: string) {
  void Linking.openURL(url).catch(() => Alert.alert('No se pudo abrir', url.startsWith('tel:') ? 'Comprueba que tu dispositivo tenga una aplicación de teléfono.' : 'Revisa tu conexión y vuelve a intentarlo. Puedes seguir consultando el directorio.'));
}

export default function Services() {
  const { role } = useRole();
  const { textScale, highContrast } = useAccessibility();
  const { width, fontScale } = useWindowDimensions();
  const twoColumns = width >= 340 && textScale * fontScale < 1.5;
  const [query, setQuery] = useState('');
  const [otherDistricts, setOtherDistricts] = useState(false);
  const [district, setDistrict] = useState('');
  const [department, setDepartment] = useState('');
  const [province, setProvince] = useState('');
  const [districtCode, setDistrictCode] = useState('');
  const [level, setLevel] = useState<'departamento' | 'provincia' | 'distrito'>('departamento');
  const areas = level === 'departamento' ? ubigeo.filter(([code]) => code.endsWith('0000'))
    : level === 'provincia' ? ubigeo.filter(([code]) => code.startsWith(department) && !code.endsWith('0000') && code.endsWith('00'))
    : ubigeo.filter(([code]) => code.startsWith(province) && !code.endsWith('00'));
  const areaName = (code: string) => ubigeo.find(([id]) => id === code)?.[1];
  const locationName = [areaName(department + '0000'), areaName(province + '00'), district].filter(Boolean).join(' · ');
  const [choosingDistrict, setChoosingDistrict] = useState(false);
  const [districtSearch, setDistrictSearch] = useState('');
  const [locationStatus, setLocationStatus] = useState('');
  const [locationRequest, setLocationRequest] = useState(0);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const manualDistrict = useRef(false);
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    let active = true;
    async function detect() {
      try {
        const permission = locationRequest
          ? await Location.requestForegroundPermissionsAsync()
          : await Location.getForegroundPermissionsAsync();
        if (!active) return;
        if (!permission.granted) { if (locationRequest) setLocationStatus('Puedes elegir tu ubicación sin activar el GPS.'); return; }
        setLoadingLocation(true);
        const position = await Location.getLastKnownPositionAsync({ maxAge: 120000, requiredAccuracy: 500 })
          ?? await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!active) return;
        const [address] = await Location.reverseGeocodeAsync(position.coords);
        if (!active) return;
        const candidates = [address?.district, address?.subregion, address?.city].filter((value): value is string => !!value);
        const detected = limaDistricts.find(value => candidates.some(candidate => districtKey(candidate) === districtKey(value))) ?? (address?.district && address?.district !== address?.city ? address.district : undefined);
        if (!detected) { setLocationStatus('El teléfono no identificó el distrito. Elige uno de la lista.'); return; }
        const matching = address?.region && districtKey(address.region).includes('lima')
          ? ubigeo.find(([code, name]) => code.startsWith('1501') && !code.endsWith('00') && districtKey(name) === districtKey(detected))
          : undefined;
        if (!manualDistrict.current && matching) {
          setDepartment('15'); setProvince('1501'); setDistrictCode(matching[0]); setDistrict(matching[1]);
          setLocationStatus(`Distrito detectado: ${matching[1]}.`);
        } else if (!manualDistrict.current) setLocationStatus('Elige tu departamento, provincia y distrito.');
      } catch {
        if (active) setLocationStatus('No se pudo detectar el distrito. Puedes elegirlo en la lista.');
      }
    }
    void detect().finally(() => { if (active) setLoadingLocation(false); });
    return () => { active = false; };
  }, [locationRequest]);
  const [category, setCategory] = useState('');
  const [showCategories, setShowCategories] = useState(false);
  const [showAllResults, setShowAllResults] = useState(false);
  const chosenGroups = [...featured, ...extra].find(item => item.label === category)?.groups;
  const [selected, setSelected] = useState('');
  const search = normalize(query.trim()).replace(/[^a-z0-9 ]/g, '');
  const filtered = services.filter(item =>
    (!chosenGroups || chosenGroups.some(group => group === item.category)) &&
    (!item.district || otherDistricts || (!department || (department === '15' && (!province || province === '1501'))) && (!district || districtKey(item.district) === districtKey(district))) &&
    search.split(/\s+/).filter(word => word && !['de', 'del', 'la', 'el', 'un', 'una', 'mi', 'por', 'quiero', 'necesito', 'tramitar', 'obtener', 'mis', 'busco', 'buscar'].includes(word)).every(word => normalize([item.name, item.phone, item.detail, item.address, item.district, item.keywords, item.institution, item.category].filter(Boolean).join(' ')).includes(word)),
  );
  const input = { fontSize: 18 * textScale, minHeight: 56, padding: 12, color: colors.ink,
    backgroundColor: colors.white, borderColor: colors.muted, borderWidth: 1, borderRadius: 12 };
  const browsing = !search && !category;
  const ordered = district
    ? filtered.filter(item => item.district).concat(filtered.filter(item => !item.district))
    : filtered;
  const visible = browsing && !showAllResults ? ordered.slice(0, 6) : ordered;
  const updateQuery = (value: string) => { setQuery(value); setSelected(''); };
  return <NativePage title="¿Qué servicio necesitas?" intro="Encuentra trámites, centros de atención y teléfonos de ayuda.">
    <View style={[styles.panel, highContrast && styles.strongBorder]}>
      <Text style={[styles.label, { fontSize: 18 * textScale }]}>¿Qué estás buscando?</Text>
      <Text style={[styles.hint, { fontSize: 15 * textScale }]}>Prueba con «Necesito renovar mi DNI» o «Busco un centro de salud».</Text>
      <TextInput value={query} onChangeText={updateQuery} accessibilityLabel="¿Qué estás buscando?"
        placeholder="Escribe lo que necesitas" placeholderTextColor="#52636B" returnKeyType="search" style={input} />
      {!!query && <SecondaryButton label="Borrar búsqueda" onPress={() => updateQuery('')} />}
      <VoiceAssistant label="Buscar hablando" onTranscript={updateQuery}
        friendlyErrors />
    </View>

    <SectionHeader title="Categorías" />
    <View accessibilityRole="radiogroup" style={styles.grid}>
      {(showCategories ? [...featured, ...extra] : featured).map(item => {
        const active = category === item.label;
        return <Pressable key={item.label} accessibilityRole="radio" accessibilityState={{ checked: active }}
          onPress={() => { setCategory(active ? '' : item.label); setSelected(''); }}
          style={({ pressed }) => [styles.category, { width: twoColumns ? '48.8%' : '100%' },
            (active || pressed) && styles.categorySelected, highContrast && styles.strongBorder]}>
          <View style={styles.categoryTop}>
            <Text accessible={false} style={[styles.categoryIcon, { fontSize: 24 * textScale }]}>{item.icon}</Text>
            {active && <Text accessible={false} style={styles.check}>✓</Text>}
          </View>
          <Text style={[styles.label, { fontSize: 17 * textScale }]}>{item.label}</Text>
        </Pressable>;
      })}
    </View>
    <SecondaryButton label={showCategories ? 'Ver menos categorías' : 'Ver todas las categorías'}
      onPress={() => { if (showCategories && extra.some(item => item.label === category)) setCategory(''); setShowCategories(!showCategories); }} />

    <View style={[styles.panel, highContrast && styles.strongBorder]}>
      <SectionHeader title="Servicios cerca de ti" />
      <Text style={[styles.label, { fontSize: 18 * textScale }]}>{district && department === '15' ? district + ', Lima' : locationName || 'Todo el Perú'}</Text>
      <SecondaryButton label="Cambiar ubicación" onPress={() => { setLevel('departamento'); setDistrictSearch(''); setChoosingDistrict(true); }} />
      {Platform.OS === 'android' && <SecondaryButton label="Usar mi ubicación" onPress={() => {
        manualDistrict.current = false; setLocationRequest(value => value + 1);
      }} />}
      {(loadingLocation || !!locationStatus) && <Text accessibilityLiveRegion="polite" style={styles.hint}>
        {loadingLocation ? 'Buscando tu ubicación…' : locationStatus}
      </Text>}
    </View>
    <Modal visible={choosingDistrict} transparent animationType="none" onRequestClose={() => setChoosingDistrict(false)}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16, backgroundColor: '#25323899' }}>
        <View accessibilityViewIsModal style={{ width: '100%', maxWidth: 480, maxHeight: '85%',
          backgroundColor: colors.white, borderRadius: 24, padding: 18, gap: 12, borderWidth: 1, borderColor: colors.border }}>
          <SectionHeader title={`Elegir ${level}`} />
          <Text style={{ fontSize: 15 * textScale, color: colors.muted }}>Elige departamento, provincia y distrito para filtrar las sedes.</Text>
          <TextInput accessibilityLabel={`Buscar ${level}`} placeholder={`Buscar ${level}`} placeholderTextColor={colors.muted}
            value={districtSearch} onChangeText={setDistrictSearch} style={input} />
          <ScrollView keyboardShouldPersistTaps="handled" style={{ flexShrink: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 14 }}>
            {areas.filter(([, name]) => normalize(name).includes(normalize(districtSearch.trim()))).map(([code, name]) => (
              <Pressable key={code} accessibilityRole="button" accessibilityState={{ selected: code === districtCode }}
                onPress={() => {
                  manualDistrict.current = true; setSelected(''); setLocationStatus(''); setOtherDistricts(false); setDistrictSearch('');
                  if (level === 'departamento') {
                    setDepartment(code.slice(0, 2)); setProvince(''); setDistrictCode(''); setDistrict(''); setLevel('provincia');
                  } else if (level === 'provincia') {
                    setProvince(code.slice(0, 4)); setDistrictCode(''); setDistrict(''); setLevel('distrito');
                  } else {
                    setDistrictCode(code); setDistrict(name); setChoosingDistrict(false);
                  }
                }} style={{ minHeight: 48, padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Text style={{ fontSize: 17 * textScale, color: colors.ink }}>{name}</Text>
              </Pressable>
            ))}
            {!areas.some(([, name]) => normalize(name).includes(normalize(districtSearch.trim()))) &&
              <Text style={{ padding: 12, color: colors.muted }}>Sin coincidencias.</Text>}
          </ScrollView>
          {level === 'departamento' && <SecondaryButton label="Todo el Perú" onPress={() => { manualDistrict.current = true; setDepartment(''); setProvince(''); setDistrictCode(''); setDistrict(''); setOtherDistricts(false); setLocationStatus(''); setChoosingDistrict(false); }} />}
          <SecondaryButton label="Cerrar lista" onPress={() => setChoosingDistrict(false)} />
        </View>
      </View>
    </Modal>
    <SectionHeader title={browsing ? 'Servicios recomendados' : 'Resultados'} />
    <Text style={[styles.hint, { fontSize: 15 * textScale }]} accessibilityLiveRegion="polite">
      {browsing ? 'Escribe una necesidad o elige una categoría para acotar la lista.'
        : `${filtered.length} ${filtered.length === 1 ? 'servicio encontrado' : 'servicios encontrados'}`}
    </Text>
    {filtered.length === 0 && <EmptyState title="No encontramos servicios con estos filtros"
      body={district ? `No encontramos coincidencias en ${district}. Puedes ampliar la búsqueda o consultar los canales oficiales.`
        : 'Prueba con otro nombre, categoría o ubicación.'} />}
    {!!district && filtered.length > 0 && !filtered.some(item => item.district) &&
      <EmptyState title="Sin sedes registradas en el distrito" body="Puedes consultar los canales oficiales que aparecen abajo o ampliar la búsqueda." />}
    {!!district && <SecondaryButton label={otherDistricts ? 'Volver a mi distrito' : 'Buscar también en otros distritos'}
      onPress={() => { setSelected(''); setOtherDistricts(!otherDistricts); }} />}
    {visible.map((item, index) => {
      const physical = !!item.address;
      const channel = physical ? 'Presencial' : item.phone ? 'Telefónica' : (item.modality ?? 'Orientación web');
      const canCall = !!item.phone && /^\+?[0-9]{3,15}$/.test(item.phone);
      const details = selected === item.name;
      const sourceLink = item.sourceUrl ?? (canCall ? source : undefined);
      const mapUrl = physical ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([item.name, item.address, item.district, 'Lima, Perú'].filter(Boolean).join(', '))}` : undefined;
      return <View key={item.name} style={{ gap: 10 }}>
        {district && !item.district && (index === 0 || visible[index - 1].district) && <SectionHeader title="Trámites y canales de cobertura general" />}
        <AccessibleCard title={item.name} icon={physical ? '⌖' : canCall ? '☎' : '↗'}
          body={[`${item.category} · ${channel}`, item.detail, item.institution, item.address, item.district, item.phone && `Teléfono: ${item.phone}`, item.hours].filter(Boolean).join('\n')}>
          {mapUrl ? <SecondaryButton label="Ver ubicación en Google Maps" onPress={() => open(mapUrl)} />
            : canCall ? <SecondaryButton label={`Abrir marcador para ${item.phone}`} onPress={() => Alert.alert('Abrir marcador', `¿Quieres abrir el marcador para ${item.name}?`, [
                { text: 'Cancelar', style: 'cancel' }, { text: 'Abrir marcador', onPress: () => open(`tel:${item.phone}`) },
              ])} />
              : sourceLink && <SecondaryButton label="Consultar trámite oficial" onPress={() => open(sourceLink)} />}
          {(mapUrl || canCall) && sourceLink && <SecondaryButton label="Consultar fuente oficial" onPress={() => open(sourceLink)} />}
          {physical && canCall && <SecondaryButton label={`Abrir marcador para ${item.phone}`} onPress={() => Alert.alert('Abrir marcador', `¿Quieres abrir el marcador para ${item.name}?`, [
            { text: 'Cancelar', style: 'cancel' }, { text: 'Abrir marcador', onPress: () => open(`tel:${item.phone}`) },
          ])} />}
          {(item.requirements || item.sourceTitle || physical && !item.hours) && <>
            <SecondaryButton label={details ? 'Cerrar detalles' : 'Ver detalles'} onPress={() => setSelected(details ? '' : item.name)} />
            {details && <Text style={[styles.hint, { fontSize: 15 * textScale }]}>
              {[item.requirements, item.sourceTitle, physical && !item.hours && 'Horario pendiente de verificación. Consulta la fuente antes de acudir.'].filter(Boolean).join('\n')}
            </Text>}
          </>}
        </AccessibleCard>
      </View>;
    })}
    {browsing && ordered.length > 6 && <SecondaryButton label={showAllResults ? 'Ver recomendaciones' : 'Ver todos los servicios'} onPress={() => setShowAllResults(!showAllResults)} />}
    <SecondaryButton label="Consultar fuente oficial" onPress={() => open(source)} />
    <SecondaryButton label="Volver" onPress={() => router.dismissTo(role === 'caregiver' ? '/(caregiver)' : '/(senior)')} />
  </NativePage>;
}
const styles = StyleSheet.create({
  panel: { backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#D6E5E1', padding: 16, gap: 10 },
  strongBorder: { borderColor: '#253238', borderWidth: 2 },
  label: { color: '#253238', fontFamily: 'Poppins_600SemiBold' },
  hint: { color: '#52636B', fontSize: 15, fontFamily: 'Poppins_400Regular' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  category: { backgroundColor: '#FFFFFF', minHeight: 88, borderWidth: 1, borderColor: '#D6E5E1', borderRadius: 16, padding: 13, gap: 6 },
  categorySelected: { backgroundColor: '#E6F4F1', borderColor: '#167B70' },
  categoryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryIcon: { color: '#146D63', fontWeight: '700' },
  check: { color: '#146D63', fontSize: 19, fontWeight: '700' },
});

