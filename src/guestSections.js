import './salonShears.js';
import { h, icon, money, formatDate, phoneHref, guestCount } from './guestUi.js';
import { hotel, hotelServices } from './hotelData.js';

const photo = (src, alt, extra = '') =>
  `<img src="${h(src)}" alt="${h(alt)}" loading="lazy" decoding="async" ${extra}>`;
const external = (href, text) =>
  `<a class="pr-text-link" href="${h(href)}" target="_blank" rel="noopener noreferrer">${h(text)} ${icon('diagonal', 14)}</a>`;
const action = (text, data, cls = 'pr-text-link') =>
  `<button type="button" class="${cls}" ${data}>${text}</button>`;
const reviews = [
  [
    'Екатерина',
    'Утром предлагают вполне вкусные и разнообразные завтраки. Хороший отель для командировок.',
  ],
  [
    'Oksana Z.',
    'Очень удобное расположение от станции метро. Вкусные и разнообразные завтраки. Приветливый персонал.',
  ],
];

export function propertySections() {
  const cafe = hotelServices.find((s) => s.id === 'cafe');
  const cafePhoto = photo(cafe.photo, 'Холодные закуски в кафе гостиницы');
  const otherServices = hotelServices.filter((s) => ['conference', 'church'].includes(s.id));
  const cafeDetails = action('О кафе и групповом питании', 'data-g="service" data-id="cafe"');
  const mapUrl =
    'https://yandex.ru/maps/?text=' +
    encodeURIComponent(hotel.address + ' гостиница Университетская');
  return `<section id="rooms" class="pr-section pr-rooms g-shell" aria-labelledby="pr-room-heading">
    <div class="pr-heading"><div><h2 id="pr-room-heading">Номера и люксы</h2><p>В гостинице восемь категорий номеров. Есть одноместные комнаты для коротких поездок и просторные люксы с отдельной гостиной.</p></div></div>
    <div class="pr-catalog-tools"><div class="pr-filters" role="group" aria-label="Категории номеров">${['Все', 'Эконом', 'Стандарт', 'Полулюкс', 'Люкс'].map((f) => `<button type="button" data-g="filter" data-filter="${f}" aria-pressed="${f === 'Все'}">${f}</button>`).join('')}</div>
      ${action('Сравнить номера', 'data-g="compare"', 'pr-compare-button')}</div>
    <div data-room-list></div></section>
    <section id="services" class="pr-services" aria-labelledby="pr-services-heading">
      <div class="pr-services-heading g-shell"><h2 id="pr-services-heading">В гостинице</h2><p>Кафе, парикмахерская и залы для встреч.</p></div>
      <article class="pr-cafe g-shell"><div class="pr-cafe-photo">${cafePhoto}</div><div class="pr-cafe-copy"><h3>Кафе на <br>первом этаже</h3><p>Утро в кафе начинается с завтрака. По будням здесь подают бизнес-ланч, а для групп заранее готовят обед или ужин.</p>
      <dl class="pr-hours"><div><dt>Завтрак</dt><dd>07:00–10:00</dd></div><div><dt>Бизнес-ланч</dt><dd>12:00–17:00</dd></div></dl>${cafeDetails}</div></article>
      <article class="pr-salon g-shell"><div class="pr-salon-copy"><h3>Парикмахерская</h3><p>Стрижки, окрашивание и укладки в холле первого этажа. Мастера принимают ежедневно с 14:00 до 22:00.</p>${action('Записаться к мастеру', 'data-g="salon"', 'pr-book')}<div class="pr-shears" aria-hidden="true"><salon-shears></salon-shears></div></div>
      <aside class="pr-appointment" aria-label="Расписание парикмахерской" data-salon-windows></aside></article>
      <div class="pr-stories g-shell">${otherServices.map((s) => `<article class="pr-story pr-${s.id}"><div class="pr-story-photo">${photo(s.photo, s.title)}</div><div class="pr-story-copy"><h3>${h(s.title)}</h3><p>${h(s.description)}</p>${action(s.id === 'conference' ? 'Залы и вместимость' : 'О храме', `data-g="service" data-id="${s.id}"`)}</div></article>`).join('')}</div>
    </section>
    <section class="pr-about" id="about" aria-labelledby="pr-about-heading"><div class="pr-about-inner g-shell"><div class="pr-about-copy"><h2 id="pr-about-heading">Гостиница и район</h2><p>В «Университетской» ${h(hotel.roomsCount)} номера. Мы на Мичуринском проспекте, рядом с главным зданием МГУ. Из окон верхних этажей можно увидеть университет и высотки Москва-Сити.</p><p>До метро «Ломоносовский проспект» около 100 метров. Поблизости находятся ботанический сад МГУ и парки для прогулок.</p>${action('Информация для гостей', 'data-g="guide"')}</div>
      <figure class="pr-about-photo">${photo(hotel.hero, 'Вид на главное здание МГУ из гостиницы')}<figcaption>Вид из гостиницы на главное здание МГУ</figcaption></figure></div></section>
    <section class="pr-reviews g-shell" aria-labelledby="pr-reviews-heading"><div class="pr-reviews-head"><h2 id="pr-reviews-heading">Отзывы гостей</h2>${external('https://uhtl.ru/feedback/', 'Все отзывы')}</div>
      <div class="pr-quote"><figure aria-live="polite" data-review></figure><div class="pr-quote-nav">${action(icon('left', 16), 'data-g="review-back" aria-label="Предыдущий отзыв"', 'pr-round')}<span data-review-count></span>${action(icon('right', 16), 'data-g="review-next" aria-label="Следующий отзыв"', 'pr-round')}</div></div></section>
    <section class="pr-contact" id="contacts" aria-labelledby="pr-contact-heading"><div class="g-shell"><h2 id="pr-contact-heading">Как нас найти</h2><div class="pr-contact-grid"><figure class="pr-exterior">${photo(hotel.exterior, 'Фасад гостиницы «Университетская»')}</figure>
      <div class="pr-contact-info"><h3>Адрес</h3><p>${h(hotel.address)}</p><p class="pr-metro">Метро «${h(hotel.metro)}», выход № ${hotel.metroExit}.<br>До входа ${hotel.metroMeters} метров пешком.</p>${external(mapUrl, 'Построить маршрут')}
      <h3>Стойка регистрации</h3><div class="pr-contact-links">${hotel.phones.map((t) => `<a href="${phoneHref(t)}">${h(t)}</a>`).join('')}<a href="mailto:${h(hotel.email)}">${h(hotel.email)}</a></div><div class="pr-contact-actions">${action('Задать вопрос', 'data-g="inquiry"')}${external('https://uhtl.ru/contact', 'Контакты отделов')}</div></div></div></div></section>`;
}

const availablePhotos = (room) =>
  room.photos?.length ? room.photos : [room.photo].filter(Boolean);
export function roomIndex(shown, angles) {
  const cards = shown
    .map((room) => {
      const photos = availablePhotos(room);
      const angle = photos[angles.get(room.id)] ? angles.get(room.id) : 0;
      const facts = [room.area && room.area + ' м²', guestCount(room.capacity)]
        .filter(Boolean)
        .join(' · ');
      return `<article class="g-room pr-room" data-room-card="${h(room.id)}">
      <div class="pr-room-photo"><button class="pr-photo-link" type="button" data-g="room" data-id="${h(room.id)}" aria-label="Фотографии и описание: ${h(room.title)}">${photo(photos[angle], room.title)}</button>
      ${photos.length > 1 ? `<div class="pr-room-pager" aria-label="Фотографии номера">${photos.map((_, i) => `<button type="button" data-g="room-angle" data-id="${h(room.id)}" data-angle="${i}" aria-label="Фото ${i + 1} из ${photos.length}, ${h(room.title)}" aria-pressed="${i === angle}"><i></i></button>`).join('')}</div>` : ''}</div>
      <div class="pr-room-copy"><span class="pr-room-facts">${h(facts)}</span><h3>${action(h(room.title), `data-g="room" data-id="${h(room.id)}"`, 'pr-room-name')}</h3><p>${h(room.beds)}</p>
      <div class="pr-room-bottom"><span><strong>${money(room.price)}</strong> / ночь</span>${action('О номере', `data-g="room" data-id="${h(room.id)}"`)}</div></div></article>`;
    })
    .join('');
  return `<div class="pr-room-grid">${cards || '<p>В этой категории пока нет номеров.</p>'}</div><div class="pr-catalog-foot"><small>Цены в демонстрационном каталоге указаны за ночь.</small><div class="g-more-rooms"></div></div>`;
}

export function comparison(rooms, ids) {
  const chosen = ids.map((id) => rooms.find((room) => room.id === id));
  const fields = [
    ['Площадь', (r) => (r.area ? r.area + ' м²' : 'Уточните при бронировании')],
    ['Гости', (r) => guestCount(r.capacity)],
    ['Кровати', (r) => r.beds],
    ['Удобства', (r) => (r.amenities || []).join(', ')],
    ['Тариф за ночь', (r) => money(r.price)],
  ];
  return `<div class="pr-compare"><div class="pr-compare-selects">${chosen.map((r, side) => `<label>Номер ${side + 1}<select data-compare-side="${side}" aria-label="Номер для сравнения ${side + 1}">${rooms.map((room) => `<option value="${h(room.id)}" ${room.id === r.id ? 'selected' : ''} ${room.id === ids[1 - side] ? 'disabled' : ''}>${h(room.title)}</option>`).join('')}</select></label>`).join('')}</div>
  <div class="pr-compare-images">${chosen.map((r) => `<figure>${photo(availablePhotos(r)[0], '')}<figcaption>${h(r.title)}</figcaption></figure>`).join('')}</div>
  <dl class="pr-compare-table">${fields.map(([name, value]) => `<div><dt>${name}</dt>${chosen.map((r) => `<dd aria-label="${h(r.title)}">${h(value(r))}</dd>`).join('')}</div>`).join('')}</dl><p class="pr-demo">Цены демонстрационные.</p>
  <div class="pr-compare-actions">${chosen.map((r) => action('Выбрать даты', `data-g="book-room" data-id="${h(r.id)}" aria-label="Выбрать даты: ${h(r.title)}"`, 'pr-book')).join('')}</div></div>`;
}

export function scheduleBoard(service, state, sample, date) {
  if (!service || !state.masters.length)
    return `<h4>Запись к мастеру</h4><p>Расписание временно недоступно. Вопросы о визите можно задать на стойке регистрации.</p>${action('Задать вопрос', 'data-g="inquiry"')}`;
  return `<h4>Ближайшее время</h4><p>${h(service.title)}${sample.length ? ' · ' + h(formatDate(date, { day: 'numeric', month: 'long' })) : ''}</p>
    <div class="pr-appts">${sample.map((s) => `<button type="button" data-g="quick-slot" data-service="${h(service.id)}" data-day="${h(date)}" data-time="${h(s.time)}" data-master="${h(s.masterId)}"><strong>${h(s.time)}</strong><span>${h(state.masters.find((m) => m.id === s.masterId)?.name)}</span>${icon('right', 15)}</button>`).join('') || '<p>В ближайшие семь дней свободных окон пока нет.</p>'}</div>
    <small>Демонстрационное расписание</small>`;
}

export function attachProperty(scope) {
  const figure = scope.querySelector('[data-review]');
  let current = 0;
  const render = () => {
    const [name, quote] = reviews[current];
    figure.innerHTML = `<blockquote>«${h(quote)}»</blockquote><figcaption>${h(name)}</figcaption>`;
    scope.querySelector('[data-review-count]').textContent = `${current + 1} из ${reviews.length}`;
  };
  render();
  const clicked = (event) => {
    const button = event.target.closest('[data-g^="review-"]');
    if (!button) return;
    current =
      (current + (button.dataset.g === 'review-next' ? 1 : -1) + reviews.length) % reviews.length;
    render();
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches)
      figure.animate(
        [
          { opacity: 0.12, transform: 'translateY(6px)' },
          { opacity: 1, transform: 'none' },
        ],
        { duration: 350, easing: 'ease-out' },
      );
  };
  scope.addEventListener('click', clicked);
  return () => scope.removeEventListener('click', clicked);
}
