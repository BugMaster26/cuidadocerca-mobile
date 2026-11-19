import { ScheduleValue } from './ScheduleValue';
import { Text, View, useWindowDimensions } from 'react-native';
import { useAccessibility } from '../accessibility/AccessibilityContext';
import { Alert } from './AppAlert';
import { dictatedDate, dictatedTime } from './dateTime';
import { colors } from './theme';
import { VoiceAssistant } from './VoiceAssistant';

export function ScheduleField({ label, value, onChange, kind, icon = false }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  kind: 'date' | 'time';
  icon?: boolean;
}) {
  const { textScale, highContrast } = useAccessibility();
  const date = kind === 'date';
  return <View style={{ gap: 6 }}>
    <Text style={{ fontSize: 16 * textScale, color: colors.ink }}>{label}</Text>
    <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 54, borderWidth: highContrast ? 2 : 1, borderColor: highContrast ? '#000' : colors.muted, borderRadius: 12, backgroundColor: colors.white, paddingHorizontal: 0, gap: 7 }}>
    <ScheduleValue label={label} value={value} onChange={onChange} kind={kind} picker={icon} textScale={textScale} />
    </View>
    <VoiceAssistant label={`Dictar ${label.toLowerCase()}`} onTranscript={text => {
      const parsed = date ? dictatedDate(text) : dictatedTime(text);
      if (parsed) onChange(parsed);
      else Alert.alert(date ? 'Revisa la fecha dictada' : 'Revisa la hora dictada',
        date ? `Escuché “${text}”. Di, por ejemplo, 20 noviembre 2026, o escribe la fecha.`
          : `Escuché “${text}”. Di, por ejemplo, dos y cinco de la tarde, o escribe la hora.`);
    }} />
  </View>;
}

export function DateTimeFields({ value, onChange, grouped = false }: { value: string; onChange: (value: string) => void; grouped?: boolean }) {
  const { textScale } = useAccessibility();
  const { width, fontScale } = useWindowDimensions();
  const stack = width < 360 || textScale * fontScale > 1.1;
  const [date = '', time = ''] = value.split(' ');
  return <View style={grouped ? { flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 0 } : { gap: 12 }}>
    <View style={grouped ? { flexGrow: 1, flexBasis: stack ? '100%' : 170, minWidth: 0 } : undefined}>
      <ScheduleField icon={grouped} label="Fecha" kind="date" value={date} onChange={next => onChange(`${next} ${time}`)} />
    </View>
    <View style={grouped ? { flexGrow: 1, flexBasis: stack ? '100%' : 120, minWidth: 0 } : undefined}>
      <ScheduleField icon={grouped} label="Hora" kind="time" value={time} onChange={next => onChange(`${date} ${next}`)} />
    </View>
  </View>;
}
