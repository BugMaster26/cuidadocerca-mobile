import * as Speech from 'expo-speech';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useAccessibility } from '../src/accessibility/AccessibilityContext';
import { AccessibleCard, NativePage, SecondaryButton } from '../src/ui/NativeScreens';

const topics = [
  ['Mensajes y enlaces sospechosos', 'Ejemplo: un mensaje dice que ganaste un premio y pide abrir un enlace. Abre la aplicación o página oficial por tu cuenta para verificarlo.'],
  ['Llamadas y pedidos de dinero', 'Ejemplo: alguien dice ser un familiar y pide una transferencia urgente. Cuelga y llama al número de esa persona que ya tienes guardado.'],
  ['Contraseñas y datos personales', 'Mantén en privado tus contraseñas, claves bancarias y códigos de verificación. Si alguien los solicita, termina la conversación.'],
];

export default function DigitalSafety() {
  const [selected, setSelected] = useState<number | null>(null);
  const { readAloud } = useAccessibility();
  useFocusEffect(useCallback(() => () => { void Speech.stop(); }, []));
  return <NativePage title="Seguridad digital" intro="Elige un tema para aprender a reconocer un posible engaño.">
    {topics.map(([title, body], index) => <AccessibleCard key={title} title={title} body={selected === index ? body : undefined}>
      <SecondaryButton label={selected === index ? 'Cerrar tema' : `Leer sobre ${title.toLowerCase()}`}
        onPress={() => { void Speech.stop(); setSelected(selected === index ? null : index); }} />
      {selected === index && readAloud && <SecondaryButton label="Escuchar orientación"
        onPress={() => { void Speech.stop().then(() => Speech.speak(body, { language: 'es-PE' })); }} />}
    </AccessibleCard>)}
    <SecondaryButton label="Ver mi contacto de confianza" onPress={() => router.push('/sos')} />
    <SecondaryButton label="Volver" onPress={() => router.back()} />
  </NativePage>;
}

