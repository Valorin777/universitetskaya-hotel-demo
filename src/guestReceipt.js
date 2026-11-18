import { hotel } from './hotelData.js';
import { getState, getAllMasters, getAllServices } from './store.js';
import { mark, h, money, icon, formatDate, nights, guestCount } from './guestUi.js';

export const calendarEligible = (r) => r && ['booked', 'checked-in'].includes(r.status);

function receiptData(r) {
  const stay = r.kind === 'stay',
    state = getState();
  const service = stay
    ? state.categories.find((v) => v.id === r.categoryId)
    : getAllServices(state).find((v) => v.id === r.serviceId);
  const master = stay ? '' : getAllMasters(state).find((v) => v.id === r.masterId)?.name || 'Мастер';
  const total = (r.price ?? service?.price ?? 0) * (stay ? nights(r.checkIn, r.checkOut) : 1);
  return { stay, title: service?.title || (stay?'Номер':'Услуга'), master, total };
}

export function receipt(r) {
  const { stay, title, master, total } = receiptData(r);
  const row = (label, value) => '<div><dt>' + h(label) + '</dt><dd>' + h(value) + '</dd></div>';
  const date = (d) => formatDate(d, { day: 'numeric', month: 'short', year: 'numeric' });
  const duration = r.duration + ' мин';
  const fields = stay
    ? [
        row('Заезд', date(r.checkIn) + ' · ' + hotel.checkIn),
        row('Выезд', date(r.checkOut) + ' · ' + hotel.checkOut),
        row('Размещение', guestCount(r.guests)),
      ]
    : [
        row('Дата визита', date(r.date)),
        row('Начало', r.time + ' МСК · ' + duration),
        row('Мастер', master),
      ];
  return (
    '<article class="gf-receipt gf-record ' +
    (stay ? 'gf-tag' : 'gf-slip') +
    '"><div class="gf-ticket-spine" aria-hidden="true"><i></i>' +
    mark() +
    '</div><div class="gf-ticket-main"><div class="gf-ticket-id"><span>' +
    (stay ? 'Карта проживания' : 'Талон на визит') +
    '</span><b>' +
    h(r.id) +
    '</b></div><h3>' +
    h(title) +
    '</h3><dl class="gf-ticket-data">' +
    row('Гость', r.name) +
    fields.join('') +
    '</dl><div class="gf-ticket-total"><span>Стоимость в демо</span><strong>' +
    money(total) +
    '</strong></div></div></article>'
  );
}

export const calendarButton = (r) =>
  calendarEligible(r)
    ? '<button type="button" class="gf-small gf-calendar" data-f="calendar" data-id="' +
      h(r.id) +
      '">' +
      icon('calendar', 15) +
      ' В календарь</button>'
    : '';

function escapeText(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\n|\r/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}
const encoder = new TextEncoder();
function foldLine(line) {
  const lines = [];
  let part = '',
    length = 0;
  for (const char of line) {
    const bytes = encoder.encode(char).length;
    if (length + bytes > 75) {
      lines.push(part);
      part = ' ';
      length = 1;
    }
    part += char;
    length += bytes;
  }
  return [...lines, part].join('\r\n');
}

const utcStamp = (date) =>
  date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
function inMoscow(day, time) {
  // Work with the hotel's time zone even when the visitor imports the file abroad.
  const offset =
    new Intl.DateTimeFormat('en', { timeZone: 'Europe/Moscow', timeZoneName: 'longOffset' })
      .formatToParts(new Date(day + 'T12:00:00Z'))
      .find((part) => part.type === 'timeZoneName')
      .value.replace('GMT', '') || '+00:00';
  return new Date(day + 'T' + time + ':00' + offset);
}
export function saveCalendar(r) {
  if (!calendarEligible(r)) return;
  const { stay, title, master, total } = receiptData(r);
  const start = stay ? inMoscow(r.checkIn, hotel.checkIn) : inMoscow(r.date, r.time);
  const end = stay
    ? inMoscow(r.checkOut, hotel.checkOut)
    : new Date(start.getTime() + r.duration * 60000);
  const description = [
    'Локальная демонстрация',
    'Бронь ' + r.id,
    'Гость: ' + r.name,
    stay ? guestCount(r.guests) : 'Мастер: ' + master,
    'Стоимость: ' + money(total),
  ].join('\n');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Universitetskaya//Local Guest Calendar//RU',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    'UID:' + escapeText(r.id) + '@demo.uhtl.local',
    'DTSTAMP:' + utcStamp(new Date()),
    'DTSTART:' + utcStamp(start),
    'DTEND:' + utcStamp(end),
    'SUMMARY:' +
      escapeText(
        (stay ? 'Проживание' : 'Парикмахерская') + ' — ' + title + ' · Университетская (демо)',
      ),
    'LOCATION:' + escapeText(hotel.address + (stay ? '' : ', холл первого этажа')),
    'DESCRIPTION:' + escapeText(description),
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  const url = URL.createObjectURL(
    new Blob([lines.map(foldLine).join('\r\n') + '\r\n'], { type: 'text/calendar;charset=utf-8' }),
  );
  const a = document.createElement('a');
  a.download = 'UHTL-' + r.id + '.ics';
  a.href = url;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
