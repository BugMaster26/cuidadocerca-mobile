import { createElement } from 'react';
import { TextInput } from 'react-native';
import { maskDate, maskTime, parseDate } from './dateTime';
import type { ScheduleValueProps } from './ScheduleValue';

export function ScheduleValue({ label, value, onChange, kind, picker, textScale }: ScheduleValueProps) {
  if (!picker) return <TextInput accessibilityLabel={label} value={value}
    placeholder={kind === 'date' ? 'DD/MM/AAAA' : 'HH:MM'}
    onChangeText={text => onChange(kind === 'date' ? maskDate(text) : maskTime(text))}
    style={{ flex: 1, minWidth: 0, minHeight: 52, paddingHorizontal: 12, color: '#253238', fontFamily: 'Poppins_400Regular', fontSize: 16 * textScale }} />;
  return createElement('input', {
    type: kind, 'aria-label': label, value: kind === 'date' ? parseDate(value) ?? '' : value,
    onChange: (event: { target: { value: string } }) => {
      const next = event.target.value;
      onChange(kind === 'date' && next ? next.split('-').reverse().join('/') : next);
    },
    style: {
      boxSizing: 'border-box', flex: 1, width: '100%', minWidth: 0, minHeight: 52,
      padding: '0 10px', border: 0, borderRadius: 12, backgroundColor: '#FFFFFF',
      color: '#253238', colorScheme: 'light', fontFamily: 'Poppins_400Regular, sans-serif', fontSize: 16 * textScale,
    },
  });
}
