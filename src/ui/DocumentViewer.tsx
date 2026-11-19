import { useScaledStyles } from './useScaledStyles';
import { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccessibility } from '../accessibility/AccessibilityContext';
import type { SharedCard } from '../data/caregiverRecords';
import { documentPhotoUri } from '../services/DocumentPhoto';
import { DesignIcon } from './DesignIcon';

export function DocumentViewer({ document, onClose, returnLabel = 'Volver a documentos' }: { document: SharedCard; onClose: () => void; returnLabel?: string }) {
  const s = useScaledStyles(baseStyles);
  const { width, height } = useWindowDimensions();
  const { textScale } = useAccessibility();
  const [zoom, setZoom] = useState(1);
  const [ratio, setRatio] = useState(0.75);
  const [failed, setFailed] = useState(false);
  const imageWidth = Math.min(width - 48, 700) * zoom;
  return <Modal visible transparent animationType="fade" onRequestClose={onClose}>
    <SafeAreaView style={s.backdrop}><View accessibilityViewIsModal style={[s.sheet, { maxHeight: '100%' }]}>
      <View style={s.heading}><Text accessibilityRole="header" style={[s.title, { fontSize: 21 * textScale }]}>{document.title}</Text><Pressable accessibilityRole="button" accessibilityLabel="Cerrar documento" onPress={onClose} style={s.close}><Text style={{ fontSize: 28, color: '#126B62' }}>×</Text></Pressable></View>
      <ScrollView contentContainerStyle={{ gap: 14 }}>
        <Text style={s.copy}>{document.category} · {document.at?.slice(0, 10).split('-').reverse().join('/')}</Text>
        {document.imageUri && !failed ? <>
          <View style={s.controls}>{([['Reducir imagen', '−', Math.max(1, zoom - 0.5)], ['Restablecer imagen', `${Math.round(zoom * 100)}%`, 1], ['Ampliar imagen', '+', Math.min(4, zoom + 0.5)]] as const).map(([label, text, value]) => <Pressable key={label} accessibilityRole="button" accessibilityLabel={label} onPress={() => setZoom(value)} style={s.control}><Text style={s.controlText}>{text}</Text></Pressable>)}</View>
          <Text style={s.copy}>Amplía con + y desplaza la fotografía para leerla.</Text>
          <ScrollView horizontal style={{ maxHeight: height * 0.5, backgroundColor: '#E6F4F1', borderRadius: 14 }}><ScrollView nestedScrollEnabled style={{ width: imageWidth }}><Image source={{ uri: documentPhotoUri(document.imageUri) }} accessibilityLabel={`Fotografía original de ${document.title}`} resizeMode="contain" onLoad={event => { const { width: w, height: h } = event.nativeEvent.source; if (w && h) setRatio(w / h); }} onError={() => setFailed(true)} style={{ width: imageWidth, height: imageWidth / ratio }} /></ScrollView></ScrollView>
        </> : <View style={s.notice}><DesignIcon name="file" /><Text style={s.copy}>{failed ? 'No se pudo abrir la fotografía original. El archivo puede no estar disponible en este dispositivo.' : 'Este registro no conserva una fotografía original. Puedes consultar el texto guardado.'}</Text></View>}
        {!!document.body && <><Text style={[s.title, { fontSize: 17 * textScale }]}>Texto guardado</Text><Text selectable style={[s.copy, { fontSize: 16 * textScale, lineHeight: 25 * textScale }]}>{document.body}</Text></>}
        <Pressable accessibilityRole="button" onPress={onClose} style={s.return}><DesignIcon name="arrowLeft" /><Text style={s.controlText}>{returnLabel}</Text></Pressable>
      </ScrollView>
    </View></SafeAreaView>
  </Modal>;
}
const baseStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#13292088', justifyContent: 'center', alignItems: 'center', padding: 14 },
  sheet: { width: '100%', maxWidth: 760, backgroundColor: '#FFFFFF', borderRadius: 25, padding: 16, gap: 12 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 8 }, title: { fontFamily: 'Poppins_700Bold', color: '#253238', flexShrink: 1 },
  close: { marginLeft: 'auto', width: 48, minHeight: 48, borderRadius: 24, backgroundColor: '#E6F4F1', alignItems: 'center', justifyContent: 'center' },
  copy: { color: '#52636B', fontFamily: 'Poppins_400Regular', fontSize: 15, lineHeight: 23 },
  controls: { flexDirection: 'row', gap: 10 }, control: { flex: 1, minHeight: 52, borderRadius: 14, borderWidth: 1, borderColor: '#167B70', alignItems: 'center', justifyContent: 'center' },
  controlText: { color: '#126B62', fontFamily: 'Poppins_700Bold', fontSize: 17 },
  notice: { padding: 15, gap: 10, backgroundColor: '#E6F4F1', borderRadius: 15 },
  return: { flexDirection: 'row', gap: 10, minHeight: 56, borderRadius: 16, borderWidth: 1, borderColor: '#167B70', alignItems: 'center', justifyContent: 'center' },
});
