import Svg, { Path } from 'react-native-svg';
import { Text, View } from 'react-native';
import { DesignIcon } from './DesignIcon';

export function TutorialIllustration({ step }: { step: number }) {
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: 116, height: 124 }}>
    <Svg width="100%" height="100%" viewBox="0 0 150 150" style={{ position: 'absolute' }}><Path d="M24 20C56-3 130 6 141 51S137 124 101 136 0 147 11 102 0 46 24 20Z" fill="#D5F4E8" /></Svg>
    {step === 0 ? <>
      <View style={{ position: 'absolute', left: 18, top: 25, backgroundColor: '#FFFFFF', padding: 7, borderRadius: 12 }}><DesignIcon name="calendar" size={56} /></View>
      <View style={{ position: 'absolute', right: 0, bottom: 8, backgroundColor: '#FFF4D6', padding: 7, borderRadius: 13 }}><DesignIcon name="pill" size={36} /></View>
    </> : step === 1 ? <>
      <View style={{ position: 'absolute', bottom: 14, left: 17 }}><DesignIcon name="users" size={82} /></View>
      <View style={{ position: 'absolute', top: 8, right: 15, backgroundColor: '#E6F4F1', borderRadius: 20, padding: 4 }}><DesignIcon name="heart" size={35} /></View>
    </> : <>
      <View style={{ position: 'absolute', top: 7, left: 41 }}><DesignIcon name="siren" color="#C62828" size={34} /></View>
      <View style={{ position: 'absolute', left: 20, right: 8, top: 43, height: 66, backgroundColor: '#C62828', borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#FFFFFF', fontSize: 26, fontFamily: 'Poppins_700Bold' }}>SOS</Text></View>
    </>}
  </View>;
}
