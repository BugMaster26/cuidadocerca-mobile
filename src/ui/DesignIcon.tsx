import Svg, { Path } from 'react-native-svg';
const paths = {
  sun: 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10M12 1v3m0 16v3M1 12h3m16 0h3M4.2 4.2l2.1 2.1m11.4 11.4 2.1 2.1M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1',
  check: 'M5 12l4 4L19 6',
  headphones: 'M3 14v-3a9 9 0 0 1 18 0v7a3 3 0 0 1-3 3h-4M3 12h4v8H3ZM17 12h4v8h-4Z',
  chart: 'M4 14h3v8H4ZM10 8h3v14h-3ZM16 2h3v20h-3Z',
  location: 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
  arrowLeft: 'M19 12H5m7-7-7 7 7 7',
  arrowRight: 'M5 12h14m-7-7 7 7-7 7',
  siren: 'M4 20h16v3H4ZM7 20v-8a5 5 0 0 1 10 0v8M12 1v3M2 5l3 3m17-3-3 3M10 12a2 2 0 0 1 2-2',

  accessibility: 'M12 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4M3 9l9 2 9-2M12 11v5m0 0-4 6m4-6 4 6',
  sliders: 'M4 6h6m4 0h6M4 12h10m4 0h2M4 18h2m4 0h10M10 3v6m4 0v6M6 15v6',
  contrast: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM12 2v20M12 2C4 2 4 22 12 22',
  text: 'M2 20 8 4l6 16M4 15h8M15 20l4-10 4 10m-6-4h4',
  volume: 'M11 4 6 8H2v8h4l5 4ZM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14',
  users: 'M7 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8M1 22v-3a6 6 0 0 1 12 0v3M16 3a4 4 0 0 1 0 8m1 4a6 6 0 0 1 6 6v1',
  shield: 'M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z',
  shieldCheck: 'M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11ZM8 12l3 3 5-6',
  settings: 'm9 3-1 3-3 1-2-1-2 4 2 2v2l-2 2 2 4 3-1 2 1 1 3h5l1-3 2-1 3 1 2-4-2-2v-2l2-2-2-4-3 1-2-1-1-3ZM9 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0',
  mic: 'M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0ZM5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8',

  heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
  cross: 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6Z',
  cart: 'M2 3h3l3 13h11l3-10H6M9 21h.01M19 21h.01',
  video: 'M16 8l6-4v16l-6-4M2 5h14v14H2Z',
  home: 'm3 11 9-8 9 8v10h-6v-7H9v7H3Z',
  car: 'M5 17H3v-7l3-6h12l3 6v7h-2M5 17h14M3 10h18M6 13h.01M18 13h.01M5 17v3h3v-3m8 0v3h3v-3',
  help: 'M9 8a3 3 0 1 1 5 2c-1.3 1.1-2 1.5-2 3M12 17h.01M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20',
  handshake: 'm9 7 3-3h4l6 5-6 10a2 2 0 0 1-3 0L3 11l4-6h3M9 7l-3 3a2 2 0 0 0 3 3l3-3 6 6M12 17l3 3M9 14l3 3M2 8l3-4m14 0 3 4',

  plus: 'M12 4v16M4 12h16',
  calendar: 'M8 2v5m8-5v5M3 10h18M5 5h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z M8 15l3 3 5-5',
  calendarPlain: 'M8 2v5m8-5v5M3 10h18M5 5h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z',
  pill: 'M9.5 19.5a5 5 0 0 1-7-7l10-10a5 5 0 0 1 7 7Z M8 8l8 8',
  person: 'M8 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0M4 22v-2a8 8 0 0 1 16 0v2',
  exam: 'M5 3v7a5 5 0 0 0 10 0V3M3 3h4m6 0h4m-7 12v2a4 4 0 0 0 8 0v-3m-2-2a2 2 0 1 0 4 0 2 2 0 0 0-4 0',
  file: 'M5 2h9l5 5v15H5zM14 2v6h5M8 12h8m-8 4h8',
  edit: 'm4 16 12-12 4 4L8 20H4zM14 6l4 4',
  clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20M12 6v6l4 2',
  trash: 'M3 6h18M9 6V3h6v3M5 6l1 16h12l1-16M10 10v8m4-8v8',
  phone: 'M7 3l3 4-2 3a14 14 0 0 0 6 6l3-2 4 3c0 3-2 5-5 4C9 19 5 15 3 8c-1-3 1-5 4-5Z',
};
export function DesignIcon({ name, color = '#126B62', size = 26 }: { name: keyof typeof paths; color?: string; size?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden><Path d={paths[name]} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
}
