import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform, Pressable, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { displayDateTime, maskDate, maskTime, parseDate, validTime } from './dateTime';

export type ScheduleValueProps = {
  label: string; value: string; onChange: (value: string) => void;
  kind: 'date' | 'time'; picker: boolean; textScale: number;
};
export function ScheduleValue({ label, value, onChange, kind, picker, textScale }: ScheduleValueProps) {
  const date = kind === 'date';
  function openPicker() {
    if (Platform.OS !== 'android') return;
    const iso = date ? parseDate(value) : null;
    const initial = iso ? new Date(iso + 'T12:00:00') : new Date();
    if (!date && validTime(value)) {
      const [hour, minute] = value.split(':').map(Number);
      initial.setHours(hour, minute, 0, 0);
    }
    DateTimePickerAndroid.open({
      value: initial, mode: kind, is24Hour: true,
      onChange: (event, selected) => {
        if (event.type !== 'set' || !selected) return;
        const [day, time] = displayDateTime(selected).split(' ');
        onChange(date ? day : time);
      },
    });
  }
  return <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', minWidth: 0 }}>
    <TextInput accessibilityLabel={label} keyboardType="number-pad" selectTextOnFocus value={value}
      placeholder={date ? 'DD/MM/AAAA' : 'HH:MM'} placeholderTextColor="#52636B"
      onChangeText={text => onChange(date ? maskDate(text) : maskTime(text))}
      style={{ flex: 1, minWidth: 0, minHeight: 52, paddingHorizontal: 10, color: '#253238', fontFamily: 'Poppins_400Regular', fontSize: 16 * textScale }} />
    {picker && <Pressable accessibilityRole="button" accessibilityLabel={date ? 'Abrir calendario' : 'Abrir selector de hora'} onPress={openPicker}
      style={{ width: 48, minHeight: 52, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={22} height={22} viewBox="0 0 24 24" accessibilityElementsHidden><Path d={date ? 'M8 2v5m8-5v5M3 10h18M5 5h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z' : 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20 M12 6v6l4 2'} fill="none" stroke="#126B62" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>
    </Pressable>}
  </View>;
}
