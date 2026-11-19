import { HelpShortcuts, SosHero } from '../ui/CareVisuals';
import { router } from 'expo-router';
import { NativePage } from '../ui/NativeScreens';

export function SeniorHomeScreen() {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? '¡Buenos días!' : hour < 19 ? '¡Buenas tardes!' : '¡Buenas noches!';
  const date = new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }).format(now);
  return <NativePage compactHeader whiteBackground showSos={false} title={greeting} intro={`${date.charAt(0).toLocaleUpperCase('es-PE')}${date.slice(1)}`}>
    <SosHero greeting={greeting} date={date.charAt(0).toLocaleUpperCase('es-PE') + date.slice(1)} onPress={() => router.push('/sos?activar=1')} />
    <HelpShortcuts items={[
      { label: 'Guardar una indicación', icon: 'clipboard', explanation: 'Guarda recetas, documentos e indicaciones para consultarlos después.', onPress: () => router.push('/capture?mode=scan') },
      { label: 'Servicios cercanos', icon: 'location', explanation: 'Encuentra centros de atención, instituciones y servicios disponibles en tu distrito.', onPress: () => router.push('/services') },
      { label: 'Seguridad digital', icon: 'shield', explanation: 'Aprende a reconocer mensajes sospechosos, llamadas fraudulentas y posibles estafas.', onPress: () => router.push('/digital-safety') },
      { label: 'Cómo usar CuidadoCerca', icon: 'book', explanation: 'Consulta una guía sencilla para aprender las funciones principales de la aplicación.', onPress: () => router.push('/help') },
    ]} />
  </NativePage>;
}



