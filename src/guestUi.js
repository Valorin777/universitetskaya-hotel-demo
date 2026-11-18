const paths = {
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  right: '<path d="m9 5 7 7-7 7"/>',
  left: '<path d="m15 5-7 7 7 7"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  diagonal: '<path d="M5 19 19 5M7 5h12v12"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v5m10-5v5M3 11h18"/>',
  person: '<circle cx="12" cy="8" r="3.6"/><path d="M4.5 21v-1a7.5 7.5 0 0 1 15 0v1"/>',
  pin: '<path d="M12 22s7.5-7.7 7.5-13a7.5 7.5 0 0 0-15 0c0 5.3 7.5 13 7.5 13Z"/><circle cx="12" cy="9" r="2.4"/>',
  metro: '<path d="M2 18h6m8 0h6M4 17l4-12 4 8 4-8 4 12"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  wifi: '<path d="M2 8a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0m-11 4a6 6 0 0 1 8 0"/><circle cx="12" cy="20" r="1"/>',
  key: '<circle cx="8" cy="9" r="4.5"/><path d="m11 12 8 8 2-2-2-2 1-1-2-2"/>',
  coffee:
    '<path d="M3 9h13v5a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6ZM16 10h2a3 3 0 0 1 0 6h-2M2 22h17M7 2v4m5-4v4"/>',
  phone:
    '<path d="m6 3 4 5-3 3c1.5 2.8 3.3 4.5 6 6l3-3 5 4c-1 3.5-3 4.3-6 3.3C9.5 19.5 4.5 14.5 2.7 9 1.7 6 2.5 4 6 3Z"/>',
  mail: '<rect x="2.5" y="4.5" width="19" height="15" rx="2"/><path d="m3 6 9 7 9-7"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  x: '<path d="m5 5 14 14M19 5 5 19"/>',
  check: '<path d="m4 12 5.5 6L20 6"/>',
  scissors:
    '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="m8.2 8.2 12 12M8.2 15.8l12-12"/>',
  bed: '<path d="M3 18V8m0 6h18v7M3 18h18M6 14v-4h5v4m2 0V9h5a3 3 0 0 1 3 3v2"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>',
  expand: '<path d="M4 10V4h6m4 0h6v6M4 14v6h6m10-6v6h-6"/>',
};
export const icon = (name, size = 18) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || ''}</svg>`;
export const mark = () =>
  '<svg class="g-mark" viewBox="0 0 45 47" fill="none" aria-hidden="true"><path d="M2 43h41M4 40h37M6 37V22l5-2v17m3 0V15l6-2v24m5 0V13l6 2v22m3 0V20l5 2v15M18 13V9l4.5-3L27 9v4m-4.5 24V2" stroke="currentColor" stroke-width="1.65" stroke-linejoin="round"/><path d="M8 25v9m9-16v16m11-16v16m8-9v9" stroke="currentColor" stroke-width="1.2"/></svg>';
export const h = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
export const money = (value) => new Intl.NumberFormat('ru-RU').format(Number(value) || 0) + ' ₽';
export const formatDate = (date, options = { day: 'numeric', month: 'long' }) =>
  new Intl.DateTimeFormat('ru-RU', options).format(new Date(date + 'T12:00:00'));
export const plural = (n, forms) =>
  forms[
    n % 10 === 1 && n % 100 !== 11
      ? 0
      : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)
        ? 1
        : 2
  ];
export const nights = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
export const phoneHref = (phone) => 'tel:' + String(phone).replace(/[^\d+]/g, '');
export const guestCount = (n) => n + ' ' + plural(n, ['гость', 'гостя', 'гостей']);
