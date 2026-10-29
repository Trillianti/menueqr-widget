import { translations } from './copy.js';

// Presentation fixture only. Booking, availability and acceptance stay in MenüQR.
const query = new URL(location.href).searchParams;
const language = Object.hasOwn(translations, query.get('lang')) ? query.get('lang') : 'en';
const copy = translations[language];
const parentOrigin = query.get('parentOrigin');
const byId = (id) => document.getElementById(id);
const send = (type) => parent.postMessage({ type: `menueqr:reservation:${type}` }, parentOrigin);
const shell = document.querySelector('.mw-shell');
const color = query.get('color');
if (/^#[a-f\d]{6}$/i.test(color ?? '')) {
  shell.style.setProperty('--mw-accent', color);
  const channels = [1, 3, 5].map((index) => {
    const value = parseInt(color.slice(index, index + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  shell.style.setProperty(
    '--mw-on-accent',
    (luminance + 0.05) / 0.05 >= 1.05 / (luminance + 0.05) ? '#000' : '#fff',
  );
}
const holdingLabels = {
  de: 'Tischhaltezeit',
  en: 'Table hold',
  fr: 'Délai d’arrivée',
  it: 'Tolleranza',
  es: 'Margen de llegada',
  pt: 'Tolerância',
  pl: 'Czas oczekiwania',
  uk: 'Час очікування',
  tr: 'Masa bekleme süresi',
};
byId('holding-label').textContent = holdingLabels[language];
byId('holding-value').textContent = new Intl.NumberFormat(language, {
  style: 'unit',
  unit: 'minute',
  unitDisplay: 'long',
}).format(15);
document.documentElement.lang = language;
document.querySelectorAll('[data-copy]').forEach((node) => {
  node.textContent = copy[node.dataset.copy];
});
for (const [id, label] of [
  ['minus', copy.fewer],
  ['plus', copy.more],
  ['close', copy.close],
  ['date', copy.chooseDate],
])
  byId(id).setAttribute('aria-label', label);
byId('close').hidden = query.get('mode') !== 'modal';
byId('close').onclick = () => send('close');
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') send('close');
});

const parts = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Vienna',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).formatToParts(new Date());
const today = ['year', 'month', 'day']
  .map((key) => parts.find((part) => part.type === key).value)
  .join('-');
const addDays = (date, days) => {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};
let guests = 2;
let date = today;
let selectedTime = '';
const dateInput = byId('date');
dateInput.min = today;
dateInput.max = addDays(today, 30);
const times = ['17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'];

function syncSelection() {
  const guestLabel = `${guests} ${guests === 1 ? copy.guest : copy.guestPlural}`;
  byId('guest-count').textContent = guestLabel;
  byId('minus').disabled = guests <= 1;
  byId('plus').disabled = guests >= 12;
  dateInput.value = date;
  byId('today').setAttribute('aria-pressed', String(date === today));
  byId('tomorrow').setAttribute('aria-pressed', String(date === addDays(today, 1)));
  const value = new Date(`${date}T12:00:00Z`);
  byId('date-caption').textContent = new Intl.DateTimeFormat(language, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(value);
  const shortDate = new Intl.DateTimeFormat(language, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(value);
  document.querySelectorAll('.selection-summary').forEach((node) => {
    node.textContent = `${guestLabel} · ${shortDate}${selectedTime ? ` · ${selectedTime}` : ''}`;
  });
  byId('contact-date-summary').textContent =
    `${new Intl.DateTimeFormat(language, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(value)}${selectedTime ? ` · ${selectedTime}` : ''}`;
  byId('contact-party-summary').textContent = guestLabel;
  byId('next').disabled = !selectedTime;
  document
    .querySelectorAll('#times button')
    .forEach((button) =>
      button.setAttribute('aria-pressed', String(button.textContent === selectedTime)),
    );
}
function chooseDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < dateInput.min || value > dateInput.max) return;
  date = value;
  selectedTime = '';
  syncSelection();
}
byId('today').onclick = () => chooseDate(today);
byId('tomorrow').onclick = () => chooseDate(addDays(today, 1));
dateInput.onchange = () => chooseDate(dateInput.value);
for (const [id, delta] of [
  ['minus', -1],
  ['plus', 1],
])
  byId(id).onclick = () => {
    guests = Math.max(1, Math.min(12, guests + delta));
    selectedTime = '';
    syncSelection();
  };
for (const time of times) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = time;
  button.setAttribute('aria-pressed', 'false');
  button.onclick = () => {
    selectedTime = time;
    syncSelection();
  };
  byId('times').append(button);
}
function showStep(step) {
  document.querySelector('.mw-footer .selection-summary').hidden = step === 'contact';
  byId('time-step').hidden = step !== 'time';
  byId('contact-step').hidden = step !== 'contact';
  byId('receipt').hidden = step !== 'receipt';
  byId('next').hidden = step !== 'time';
  byId('submit').hidden = step !== 'contact';
  byId('heading').textContent =
    step === 'time' ? copy.title : step === 'contact' ? copy.contacts : copy.previewTitle;
  scrollTo({ top: 0, behavior: 'auto' });
  byId('heading').focus({ preventScroll: true });
}
byId('next').onclick = () => {
  if (selectedTime) showStep('contact');
};
byId('edit').onclick = () => showStep('time');
byId('add-notes').onclick = () => {
  byId('add-notes').hidden = true;
  byId('notes-field').hidden = false;
  byId('notes').focus();
};
byId('contact').onsubmit = (event) => {
  event.preventDefault();
  showStep('receipt');
};
byId('reset').onclick = () => {
  byId('contact').reset();
  byId('add-notes').hidden = false;
  byId('notes-field').hidden = true;
  selectedTime = '';
  syncSelection();
  showStep('time');
};
syncSelection();
setTimeout(() => send('ready'), location.pathname.includes('/slow/') ? 1500 : 0);
