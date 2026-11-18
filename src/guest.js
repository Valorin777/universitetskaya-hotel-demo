import {posterHeader,posterHero,posterFinder,animatePoster} from './guestArt.js';
import {propertySections, roomIndex, comparison, scheduleBoard, attachProperty} from './guestSections.js';
import { hotel, hotelServices } from './hotelData.js';
import { getState, today, dayOffset, slots } from './store.js';
import { h, icon, mark, money, formatDate, guestCount, phoneHref, plural } from './guestUi.js';
import { makeGuestFlows } from './guestFlows.js';

const brand = () =>
  `<span class="g-brand">${mark()}<span><strong>Университетская</strong><small>Гостиница в Москве</small></span></span>`;
const nav = () =>
  '<a href="#rooms">Номера</a><a href="#services">Услуги</a><button type="button" data-g="salon">Запись в салон</button><a href="#about">О гостинице</a><a href="#contacts">Контакты</a>';
const image = (src, alt, attrs = '') => `<img src="${h(src)}" alt="${h(alt)}" ${attrs}>`;
const sectionLink = (text, act, attrs = '') =>
  `<button type="button" class="g-text-link" data-g="${act}" ${attrs}>${text} ${icon('arrow', 17)}</button>`;
function classification(room) {
  if (room.category) return room.category;
  if (/полулюкс/i.test(room.title)) return 'Полулюкс';
  if (/люкс/i.test(room.title)) return 'Люкс';
  return /эконом/i.test(room.title) ? 'Эконом' : 'Стандарт';
}
const buildSelect = (capacity) =>
  Array.from(
    { length: capacity },
    (_, i) =>
      `<option value="${i + 1}" ${i === Math.min(capacity, 2) - 1 ? 'selected' : ''}>${guestCount(i + 1)}</option>`,
  ).join('');
const officialUrl = (v) => {
  try {
    const u = new URL(v, 'https://uhtl.ru/');
    return ['http:', 'https:'].includes(u.protocol) ? u.href : '';
  } catch {
    return '';
  }
};
const ext = (url, title) =>
  `<a class="g-source" href="${h(officialUrl(url))}" target="_blank" rel="noopener noreferrer">${h(title)} ${icon('diagonal', 14)}</a>`;
const number = (n) => String(n).padStart(2, '0');
export function mountGuest(root) {
  document.title = 'Гостиница «Университетская» — Москва, Воробьёвы горы';
  const cats = getState().categories;
  const maxGuests = Math.max(1, ...cats.map((c) => Number(c.capacity) || 1));
  const slides = hotel.slides?.length
    ? hotel.slides
    : [{ photo: hotel.hero, title: hotel.name }];
  const services = hotelServices || [];
  const salon =
    services.find((s) => /парикмахер|салон/i.test(s.id + ' ' + s.title)) || hotel.salon || {};
  const address = hotel.address || 'Москва, Мичуринский проспект, д. 8, стр. 1';
  const phones = hotel.phones || ['+7 (495) 363-35-87', '+7 (495) 685-96-10'];
  const email = hotel.email || 'reserve@uhtl.ru';
  const checkIn = today(),
    checkOut = dayOffset(1);
  let slideIndex = 0,
    roomFilter = 'Все',
    allRooms = false,
    detailRoom = null,
    detailPhoto = 0;
  root.innerHTML = `<div class="guest" id="top">
    <a class="g-skip" href="#main-guest">К содержанию</a>
    <div class="property-demo-notice"><strong>Демонстрационная версия</strong><span>Брони и обращения сохраняются только в вашем браузере.</span></div>
    ${posterHeader(nav)}
    <main id="main-guest">
      ${posterHero(slides)}
      ${posterFinder(checkIn,checkOut,maxGuests,buildSelect)}
      ${propertySections()}
    </main><footer class="g-footer"><div class="g-shell"><a href="#top" class="g-brand-link">${brand()}</a><button data-g="guide">Информация для гостей</button><button data-g="accessible" aria-pressed="false">Крупный шрифт</button><a href="https://en.uhtl.ru/" lang="en" hreflang="en" target="_blank" rel="noopener noreferrer">English</a><a href="#top">Наверх ↑</a></div></footer>
    <dialog class="gf-dialog" aria-labelledby="guest-dialog-title"><div data-flow-content></div></dialog>
  </div>`;
  const scope = root.querySelector('.guest');
  const find = (sel) => scope.querySelector(sel);
  const roomList = find('[data-room-list]');
  const roomAngles = new Map();
  let lastCatalog = '', compared = [];
  const detachProperty=attachProperty(scope);
  const form = find('.g-booking-form');
  const flow = makeGuestFlows(find('.gf-dialog'), () => {
    const catalogChanged=JSON.stringify(getState().categories)!==lastCatalog;
    if(catalogChanged)renderRooms(true);
    renderWindows();
    if (catalogChanged && find('.gf-dialog').open) {
      if(find('.pr-compare')) showCompare();
      else if(find('.g-detail-media') && detailRoom) roomDetail(detailRoom.id, detailPhoto);
    }
  });
  function renderWindows() {
    const state = getState();
    const service = state.services[0];
    if (!service||!state.masters.length) {
      find('[data-salon-windows]').innerHTML=scheduleBoard(service,state,[],today());
      return;
    }
    let date = today(),
      free = [];
    for (let i = 0; i < 7 && !free.length; i++) {
      date = dayOffset(i);
      free = slots({ date, serviceId: service.id });
    }
    const distinct = free.filter((slot, i) => i === 0 || slot.time !== free[i - 1].time);
    const sample = [
      distinct[0],
      distinct[Math.floor(distinct.length / 2)],
      distinct[distinct.length - 1],
    ].filter(
      (slot, i, items) => slot && items.findIndex((other) => other?.time === slot.time) === i,
    );
    find('[data-salon-windows]').innerHTML = scheduleBoard(service,state,sample,date);
  }
  function renderRooms(keepFocus = false) {
    const focusBefore = document.activeElement?.closest('[data-g="room"]')?.dataset.id;
    const list = getState().categories;
    lastCatalog=JSON.stringify(list);
    const ordered =
      roomFilter === 'Все'
        ? [
            'r8','r5','r2','r7','r1',
            ...list.map(c=>c.id).filter(id=>!['r8','r5','r2','r7','r1'].includes(id)),
          ]
            .map((id) => list.find((c) => c.id === id))
            .filter(Boolean)
        : list.filter((c) => classification(c) === roomFilter);
    const shown = roomFilter === 'Все' && !allRooms ? ordered.slice(0, 3) : ordered;
    roomList.innerHTML = roomIndex(shown, roomAngles);
    find('[data-g="compare"]').disabled = list.length < 2;
    find('.g-more-rooms').innerHTML =
      roomFilter === 'Все' && ordered.length > 3
        ? `<button class="pr-outline" data-g="more" aria-expanded="${allRooms}">${allRooms ? 'Свернуть каталог' : `Все номера (${ordered.length})`}</button>`
        : '';
    scope
      .querySelectorAll('[data-g="filter"]')
      .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === roomFilter)));
    if (keepFocus && focusBefore)
      roomList
        .querySelector(`[data-id="${CSS.escape(focusBefore)}"]`)
        ?.focus({ preventScroll: true });
  }
  function showCompare() {
    const categories = getState().categories;
    if (categories.length < 2) {
      flow.detail('Сравнить номера','<p>Для сравнения нужны две доступные категории.</p>');
      return;
    }
    const shown = [...roomList.querySelectorAll('[data-room-card]')].map(el=>el.dataset.roomCard);
    const first = [compared[0], ...shown, categories[0].id].find(id=>categories.some(c=>c.id===id));
    const second = [compared[1], ...shown, ...categories.map(c=>c.id)].find(id=>id!==first && categories.some(c=>c.id===id));
    compared = [first,second];
    flow.detail('Сравнить номера', comparison(categories,compared));
  }
  scope.addEventListener('change', event => {
    const select = event.target.closest('[data-compare-side]');
    if (!select) return;
    const side = Number(select.dataset.compareSide);
    compared[side] = select.value;
    const currentPanel = find('.pr-compare');
    if (currentPanel) {
      currentPanel.outerHTML = comparison(getState().categories,compared);
      find(`[data-compare-side="${side}"]`).focus({preventScroll:true});
    }
  });
  function roomDetail(id, pos = 0) {
    const c = getState().categories.find((c) => c.id === id);
    if (!c) return;
    detailRoom = c;
    detailPhoto = pos;
    const photos = c.photos?.length ? c.photos : [c.photo];
    const area = [c.area ? `${c.area} м²` : '', guestCount(c.capacity), c.beds].filter(Boolean);
    const amenities = Array.isArray(c.amenities) ? c.amenities : [];
    flow.detail(
      c.title,
      `<div class="g-detail-media">${image(photos[pos], c.title)}${photos.length > 1 ? `<div class="g-detail-pager"><button type="button" data-g="room-prev" aria-label="Предыдущее фото">${icon('left', 17)}</button><span>${pos + 1} / ${photos.length}</span><button type="button" data-g="room-next" aria-label="Следующее фото">${icon('right', 17)}</button></div>` : ''}</div><div class="g-detail-facts">${h(area.join(' · '))}</div><p class="g-detail-desc">${h(c.description)}</p>${amenities.length ? `<ul class="g-amenities">${amenities.map((a) => `<li>${h(a)}</li>`).join('')}</ul>` : ''}<div class="g-detail-footer"><p><strong>${money(c.price)}</strong> / ночь${c.priceIsDemo ? '<small>Демонстрационный тариф</small>' : ''}</p><button class="gf-primary" data-g="book-room" data-id="${h(id)}">Выбрать даты ${icon('arrow', 16)}</button></div>`,
    );
  }
  function changeAccessibility(on) {
    scope.classList.toggle('g-accessible', on);
    find('[data-g="accessible"]').setAttribute('aria-pressed', String(on));
    find('[data-g="accessible"]').textContent = on ? 'Обычный шрифт' : 'Крупный шрифт';
    localStorage.setItem('pages.universitetskaya-hotel-demo:uhtl-large-print', String(on));
  }
  function guide() {
    const links = Array.isArray(hotel.links)
      ? [...hotel.links]
      : Object.entries(hotel.links || {}).map(([title, url]) => ({ title, url }));
    const additional = [
      ['Экскурсии и паломничество', 'https://www.poklonnik.ru/'],
      ['Бронирование для групп и мероприятий', 'https://uhtl.ru/banket/'],
      ['Визовая поддержка', 'https://uhtl.ru/rooms/booking/visasupport/'],
      ['Участникам «Крокус Экспо»', 'https://uhtl.ru/expo/'],
      ['Вакансии', 'https://uhtl.ru/vacancy/'],
      ['Вебкамера', 'https://uhtl.ru/home/webcam'],
      ['Документы гостиницы', 'https://uhtl.ru/home/#docs'],
      ['Вопросы и ответы', 'https://uhtl.ru/faq/'],
      ['Интересное рядом', 'https://uhtl.ru/places/'],
      ['Как добраться и контакты отделов', 'https://uhtl.ru/contact'],
      ['Политика конфиденциальности', 'https://uhtl.ru/docs/politconf'],
    ];
    for (const [title, url] of additional) {
      if (!links.some((l) => l.title === title || l.url === url)) links.push({ title, url });
    }
    const questions = [...(hotel.faq || [])];
    if (hotel.amenities?.length) {
      questions.unshift({
        question: 'Какие удобства есть в гостинице?',
        answer: hotel.amenities.join(' · '),
      });
    }
    const info = (Array.isArray(questions) ? questions : [])
      .map(
        (v) =>
          `<details class="g-faq"><summary>${h(v.question || v.q || v.title)}</summary><p>${h(v.answer || v.a || v.text)}</p></details>`,
      )
      .join('');
    flow.detail(
      'Информация для гостей',
      `${info || '<p class="g-detail-desc">Стойка регистрации находится по адресу ' + h(address) + '. Вопросы о проживании можно уточнить по телефону гостиницы.</p>'}<div class="g-guide-links">${
        links
          .filter((l) => l.url || l.href)
          .map((l) => ext(l.url || l.href, l.title || l.label))
          .join('') || ext('https://uhtl.ru/', 'Сайт гостиницы')
      }</div>`,
    );
  }
  function showService(id) {
    const s = services.find((v) => v.id === id);
    if (!s) return;
    const details = Array.isArray(s.details) ? s.details : [];
    flow.detail(
      s.title,
      `${s.photo ? image(s.detailPhoto || s.photo, s.title, 'class="g-service-image"') : ''}<p class="g-detail-desc">${h(s.description)}</p>${details.length ? `<ul class="g-service-details">${details.map((d) => `<li>${h(d)}</li>`).join('')}</ul>` : ''}${/конференц|зал/i.test(s.title) ? '<div class="gf-actions"><button class="gf-primary" data-g="hall">Запросить зал</button></div>' : ''}${s.source ? ext(s.source, 'Информация гостиницы') : ''}`,
    );
  }
  const hero = find('.g-hero');
  function changeSlide(diff) {
    slideIndex = (slideIndex + diff + slides.length) % slides.length;
    poster.change(slideIndex);
  }
  const poster = animatePoster(hero, slides, changeSlide);
  function openPanorama() {
    const s = slides[slideIndex];
    flow.detail(
      'Фотогалерея гостиницы',
      `<div class="g-panorama"><img src="${h(s.photo)}" alt="${h(s.title)}"><p aria-live="polite">${h(s.title)}</p><div class="g-photo-strip" aria-label="Выбрать фотографию">${slides.map((photo, i) => `<button type="button" data-g="photo-pick" data-index="${i}" aria-label="${h(photo.title)}" aria-pressed="${i === slideIndex}">${image(photo.photo, '')}<span>${number(i + 1)}</span></button>`).join('')}</div></div>`,
    );
    find('.gf-dialog').classList.add('g-panorama-dialog');
  }
  find('.gf-dialog').addEventListener('close', () =>
    find('.gf-dialog').classList.remove('g-panorama-dialog'),
  );
  function closeMenu() {
    find('.g-mobile-nav').hidden = true;
    find('.g-menu').setAttribute('aria-expanded', 'false');
    find('.g-menu').setAttribute('aria-label', 'Открыть меню');
    find('.g-menu').innerHTML = icon('menu', 20);
  }
  const mobileWidth=matchMedia('(max-width: 760px)');
  const onViewport=e=>{if(!e.matches)closeMenu()};
  mobileWidth.addEventListener('change',onViewport);
  scope.addEventListener('click', (event) => {
    if(!find('.g-mobile-nav').hidden&&!event.target.closest('.g-header'))closeMenu();
    const button = event.target.closest('[data-g]');
    if (!button) {
      if (event.target.closest('.g-mobile-nav a')) closeMenu();
      return;
    }
    const a = button.dataset.g,
      id = button.dataset.id;
    if (a === 'panorama') openPanorama();
    if (a === 'photo-pick') {
      const index = Number(button.dataset.index);
      const active = slides[index];
      if (active) {
        changeSlide(index - slideIndex, true);
        const panel = find('.g-panorama');
        panel.querySelector('img').src = active.photo;
        panel.querySelector('img').alt = active.title;
        panel.querySelector('p').textContent = active.title;
        panel
          .querySelectorAll('[data-g="photo-pick"]')
          .forEach((el, i) => el.setAttribute('aria-pressed', String(i === index)));
      }
    }
    if (a === 'next' || a === 'prev') changeSlide(a === 'next' ? 1 : -1, true);
    if (a === 'menu') {
      const isClosed = find('.g-mobile-nav').hidden;
      if (isClosed) {
        find('.g-mobile-nav').hidden = false;
        button.setAttribute('aria-expanded', 'true');
        button.setAttribute('aria-label', 'Закрыть меню');
        button.innerHTML = icon('x', 20);
      } else closeMenu();
    }
    if (a === 'manage') {
      closeMenu();
      flow.showManage();
    }
    if (a === 'reserve') {
      closeMenu();
      flow.openStay(Object.fromEntries(new FormData(form)));
    }
    if (a === 'salon') {
      closeMenu();
      flow.openSalon();
    }
    if (a === 'quick-slot')
      flow.openSalon({
        date: button.dataset.day,
        time: button.dataset.time,
        serviceId: button.dataset.service,
        masterId: button.dataset.master,
        slotMaster: button.dataset.master,
      });
    if (a === 'compare') showCompare();
    if (a === 'room-angle') {
      const room = getState().categories.find(r => r.id === id);
      const angle = Number(button.dataset.angle);
      if (!room?.photos?.[angle]) return;
      const card = button.closest('[data-room-card]');
      const img = card.querySelector('.pr-photo-link img');
      if (img.getAttribute('src') !== room.photos[angle]) {
        roomAngles.set(id, angle);
        img.src = room.photos[angle];
        card.querySelectorAll('[data-g="room-angle"]').forEach(
          item => item.setAttribute('aria-pressed', String(Number(item.dataset.angle) === angle))
        );
        if (!matchMedia('(prefers-reduced-motion: reduce)').matches)
          img.animate([{opacity:.25, transform:'scale(1.025)'},{opacity:1, transform:'none'}],
            {duration:360,easing:'ease-out'});
      }
    }
    if (a === 'filter') {
      roomFilter = button.dataset.filter;
      allRooms = false;
      renderRooms();
    }
    if (a === 'more') {
      allRooms = !allRooms;
      renderRooms();
      if (!allRooms){find('#rooms').scrollIntoView();find('[data-g=more]')?.focus({preventScroll:true})}
      else roomList.querySelectorAll('.pr-photo-link')[3]?.focus({ preventScroll: true });
    }
    if (a === 'room') roomDetail(id,roomAngles.get(id) || 0);
    if (a === 'room-next' || a === 'room-prev') {
      const total = detailRoom.photos.length;
      detailPhoto = (detailPhoto + (a === 'room-next' ? 1 : -1) + total) % total;
      const media = find('.g-detail-media');
      media.querySelector('img').src = detailRoom.photos[detailPhoto];
      media.querySelector('span').textContent = detailPhoto + 1 + ' / ' + total;
    }
    if (a === 'book-room')
      flow.openStay({
        categoryId: id,
        checkIn: form.elements.checkIn.value,
        checkOut: form.elements.checkOut.value,
        guests: Number(form.elements.guests.value),
      });
    if (a === 'service') showService(id);
    if (a === 'guide') guide();
    if (a === 'inquiry' || a === 'hall')
      flow.openInquiry(a === 'hall' ? 'Конференц-зал' : 'Вопрос гостинице');
    if (a === 'accessible') changeAccessibility(!scope.classList.contains('g-accessible'));
  });
  form.addEventListener('change', (event) => {
    let { checkIn, checkOut, guests } = form.elements;
    if (event.target === checkIn && checkIn.value) {
      checkOut.min = dayOffset(1, checkIn.value);
      if (!checkOut.value || checkOut.value < checkOut.min) checkOut.value = checkOut.min;
    }
    for (const field of [checkIn, checkOut])
      find(`[data-date="${field.name}"]`).textContent = field.value
        ? formatDate(field.value)
        : 'Выберите дату';
    find('[data-guests]').textContent = guestCount(Number(guests.value));
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    flow.openStay({ ...Object.fromEntries(new FormData(form)), search: true });
  });
  scope.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !find('.g-mobile-nav').hidden) {
      closeMenu();
      find('.g-menu').focus();
    }
  });
  changeAccessibility(localStorage.getItem('pages.universitetskaya-hotel-demo:uhtl-large-print') === 'true');
  renderRooms();
  renderWindows();
  return () => {
    flow.destroy();detachProperty();
    mobileWidth.removeEventListener('change',onViewport);
    poster.destroy();
  };
}
