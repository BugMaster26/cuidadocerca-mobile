export function maskDate(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean).join('/');
}

export function maskTime(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  return [digits.slice(0, 2), digits.slice(2)].filter(Boolean).join(':');
}

export function parseDate(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  const [, day, month, year] = match;
  const iso = `${year}-${month}-${day}`;
  const date = new Date(`${iso}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === iso ? iso : null;
}

export function validTime(value: string) {
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function parseDateTime(value: string) {
  const [date, time] = value.split(' ');
  const iso = parseDate(date);
  return iso && validTime(time) ? `${iso}T${time}` : null;
}

export function displayDateTime(date = new Date()) {
  const pad = (number: number) => String(number).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const units = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
const teens = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciseis', 'diecisiete', 'dieciocho', 'diecinueve'];
const tens = ['veinte', 'treinta', 'cuarenta', 'cincuenta'];
const normalizeSpeech = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

function speechNumbers(text: string): string {
  return normalizeSpeech(text)
    .replace(/\bdos mil(?: (\w+))?\b/g, (full, next: string | undefined) => {
      const unit = next ? units.indexOf(next) : -1;
      return unit >= 0 ? String(2000 + unit) : full;
    })
    .replace(/\bdos mil (veinti(?:uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)|veinte|dieci\w+|diez|once|doce|trece|catorce|quince)\b/g,
      (_, ending: string) => String(2000 + Number(speechNumbers(ending))))
    .replace(/\bdos mil\b/g, '2000')
    .replace(/\b(veinte|treinta|cuarenta|cincuenta) y (uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)\b/g,
      (_, ten: string, unit: string) => String((tens.indexOf(ten) + 2) * 10 + units.indexOf(unit)))
    .replace(/\bveinti(uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)\b/g, (_, unit: string) => String(20 + units.indexOf(unit)))
    .replace(/\b(una|un|primer[oa]|cero|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|dieciseis|diecisiete|dieciocho|diecinueve|veinte|treinta|cuarenta|cincuenta)\b/g,
      (word: string) => /^(una|un|primer[oa])$/.test(word) ? '1' : String(units.includes(word) ? units.indexOf(word) : teens.includes(word) ? 10 + teens.indexOf(word) : (tens.indexOf(word) + 2) * 10))
    .replace(/\b0 (\d)\b/g, '0$1');
}

const pad = (value: string | number) => String(value).padStart(2, '0');

export function dictatedDate(text: string, now = new Date()) {
  const relative = normalizeSpeech(text).replace(/[.!]$/, '');
  if (['hoy', 'manana', 'pasado manana'].includes(relative)) {
    const date = new Date(now);
    date.setDate(date.getDate() + (relative === 'hoy' ? 0 : relative === 'manana' ? 1 : 2));
    return displayDateTime(date).split(' ')[0];
  }
  const normalized = speechNumbers(text).replace(/\.$/, '').replace(/\s+(de|del)\s+/g, ' ');
  const match = /^(\d{1,2})[\s/.-]+(\d{1,2}|[a-z]+)(?:[\s/.-]+(\d{4}|\d{2}))?$/.exec(normalized);
  if (!match) return null;
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const month = /^\d/.test(match[2]) ? match[2] : months.indexOf(match[2] === 'setiembre' ? 'septiembre' : match[2]) + 1;
  const year = match[3]?.length === 2 ? '20' + match[3] : match[3] ?? now.getFullYear();
  const result = `${pad(match[1])}/${pad(month)}/${year}`;
  return parseDate(result) ? result : null;
}

export function dictatedTime(text: string) {
  const normalized = speechNumbers(text).replace(/^(?:a las |las )/, '').replace(/\b(y media|y cuarto|en punto)\b/g,
    phrase => phrase === 'y media' ? 'y 30' : phrase === 'y cuarto' ? 'y 15' : '').trim();
  if (normalized === 'mediodia') return '12:00';
  if (normalized === 'medianoche') return '00:00';
  const match = /^(\d{1,2})(?:(?::|\s+y\s+|\s+)(\d{1,2}))?\s*(?:(?:de la |de )?(manana|madrugada|tarde|noche)|([ap])\.?\s*m\.?)?\.?$/.exec(normalized);
  if (!match) return null;
  let hour = Number(match[1]);
  const meridiem = match[4] ?? (match[3] ? (['tarde', 'noche'].includes(match[3]) ? 'p' : 'a') : undefined);
  if (meridiem) {
    if (hour < 1 || hour > 12) return null;
    hour = hour % 12 + (meridiem === 'p' ? 12 : 0);
  }
  const result = `${pad(hour)}:${pad(match[2] ?? 0)}`;
  return validTime(result) ? result : null;
}

