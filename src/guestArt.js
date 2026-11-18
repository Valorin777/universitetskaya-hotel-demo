import { icon, mark, formatDate, guestCount, h, phoneHref } from './guestUi.js';
import { hotel } from './hotelData.js';

const playIcon = (playing) =>
  playing
    ? '<svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true" fill="currentColor"><path d="M4 2h2v12H4zm6 0h2v12h-2z"/></svg>'
    : '<svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true" fill="currentColor"><path d="m4 2 9 6-9 6z"/></svg>';

export function posterHeader(nav) {
  const phone = hotel.phones[0];
  return `<header class="g-header property-header">
    <div class="property-mast property-width">
      <a class="property-phone" href="${phoneHref(phone)}">${icon('phone', 17)}<span>${h(phone)}<small>Служба бронирования</small></span></a>
      <a class="pa-brand property-brand" href="#top" aria-label="Университетская, главная">${mark()}<span><strong>Университетская</strong><small>Гостиница в Москве</small></span></a>
      <div class="g-head-actions">
        <button type="button" class="g-bookings" data-g="manage" aria-label="Моя бронь">${icon('key', 16)}<span>Моя бронь</span></button>
        <button type="button" class="property-book" data-g="reserve">Забронировать</button>
        <button type="button" class="g-menu" data-g="menu" aria-label="Открыть меню" aria-expanded="false" aria-controls="g-mobile-nav">${icon('menu', 21)}</button>
      </div>
    </div>
    <nav class="g-nav property-nav" aria-label="Основная навигация">${nav()}</nav>
    <nav class="g-mobile-nav" id="g-mobile-nav" hidden aria-label="Мобильное меню"><button type="button" data-g="reserve">Забронировать номер</button>${nav()}<a class="property-nav-phone" href="${phoneHref(phone)}">${icon('phone', 15)}${h(phone)}</a></nav>
  </header>`;
}
export function posterHero(slides) {
  const images = slides
    .map(
      (slide, i) =>
        `<img class="g-slide ${i === 0 ? 'is-active' : ''}" src="${h(slide.photo)}" alt="" width="1280" height="720" decoding="async" ${i === 0 ? 'fetchpriority="high"' : ''}>`,
    )
    .join('');
  return `<section class="g-hero property-hero" aria-labelledby="property-title">
    <div class="property-film" aria-hidden="true">${images}</div>
    <div class="property-shade"></div>
    <div class="property-width property-stage">
      <div class="g-hero-copy property-intro">
        <p class="property-address">Москва <i aria-hidden="true"></i> Мичуринский проспект</p>
        <h1 id="property-title">На Воробьёвых<br>горах</h1>
        <p class="property-lead">Гостиница «Университетская» в ста метрах от метро «Ломоносовский проспект».</p>
        <div class="property-links"><a class="pa-catalog" href="#rooms">Смотреть номера ${icon('arrow', 16)}</a><button type="button" class="pa-salon-link" data-g="salon">Записаться в салон</button></div>
      </div>
      <div class="property-gallery" aria-label="Фотографии гостиницы и виды из окон">
        <button type="button" class="property-caption" data-g="panorama" aria-label="Открыть галерею. ${h(slides[0].title)}">${icon('expand', 16)}<span data-slide-title>${h(slides[0].title)}</span></button>
        <div class="property-carousel-controls">
          <button type="button" data-g="prev" aria-label="Предыдущая фотография">${icon('left', 16)}</button>
          <span data-slide-count>01 / ${String(slides.length).padStart(2, '0')}</span>
          <button type="button" data-g="next" aria-label="Следующая фотография">${icon('right', 16)}</button>
          <button type="button" data-play aria-label="Приостановить смену видов">${playIcon(true)}</button>
        </div>
      </div>
    </div>
  </section>`;
}
export function posterFinder(checkIn, checkOut, maxGuests, buildSelect) {
  const field = (
    name,
    label,
    date,
  ) => `<label class="g-book-field property-field">
    <span>${label}</span><strong data-date="${name}">${formatDate(date)}</strong>${icon('calendar', 18)}
    <input aria-label="${label}" type="date" name="${name}" value="${date}" min="${date}" required>
  </label>`;
  return `<section class="property-finder property-width" id="booking" aria-labelledby="property-stay">
    <form class="g-booking-form" aria-label="Подобрать номер">
      <h2 id="property-stay">Ваше проживание</h2>
      ${field('checkIn', 'Заезд', checkIn)}${field('checkOut', 'Выезд', checkOut)}
      <label class="g-book-field property-field g-party"><span>Гости</span><strong data-guests>${guestCount(Math.min(2, maxGuests))}</strong>${icon('down', 16)}<select name="guests" aria-label="Количество гостей">${buildSelect(maxGuests)}</select></label>
      <button type="submit" class="g-search">Найти номер ${icon('arrow', 18)}</button>
    </form>
  </section>`;
}

export function animatePoster(hero, slides, onStep) {
  const photos = [...hero.querySelectorAll('.g-slide')];
  const caption = hero.querySelector('[data-slide-title]');
  const counter = hero.querySelector('[data-slide-count]');
  const play = hero.querySelector('[data-play]');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let playing = !motion.matches,
    visible = true,
    timer,
    touch;

  const updateButton = () => {
    play.innerHTML = playIcon(playing);
    play.setAttribute(
      'aria-label',
      playing ? 'Приостановить смену видов' : 'Включить смену видов',
    );
  };
  const schedule = () => {
    clearTimeout(timer);
    if (!playing || !visible || document.hidden || slides.length < 2) return;
    timer = setTimeout(() => {
      if (
        !document.querySelector('dialog[open]') &&
        (!hero.contains(document.activeElement) ||
          document.activeElement === play)
      )
        onStep(1);
      schedule();
    }, 10000);
  };
  function change(next) {
    photos.forEach((photo, i) =>
      photo.classList.toggle('is-active', i === next),
    );
    caption.textContent = slides[next].title;
    caption
      .closest('button')
      .setAttribute('aria-label', 'Открыть галерею. ' + slides[next].title);
    counter.textContent =
      String(next + 1).padStart(2, '0') +
      ' / ' +
      String(slides.length).padStart(2, '0');
    schedule();
  }
  function togglePlay() {
    playing = !playing;
    updateButton();
    schedule();
  }
  function motionChange() {
    if (motion.matches) {
      playing = false;
      updateButton();
      schedule();
    }
  }
  function startTouch(event) {
    touch =
      event.touches.length === 1
        ? [event.touches[0].clientX, event.touches[0].clientY]
        : null;
  }
  function endTouch(event) {
    if (!touch) return;
    const deltaX = event.changedTouches[0].clientX - touch[0];
    const deltaY = event.changedTouches[0].clientY - touch[1];
    touch = null;
    if (Math.abs(deltaX) > 48 && Math.abs(deltaX) > Math.abs(deltaY) * 1.6)
      onStep(deltaX < 0 ? 1 : -1);
  }
  function galleryKey(event) {
    if (!event.target.closest('.property-carousel-controls')) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      onStep(event.key === 'ArrowRight' ? 1 : -1);
    }
  }
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    schedule();
  });
  observer.observe(hero);
  let entrance;
  if (window.gsap && !motion.matches) {
    entrance = window.gsap.from(
      hero.querySelectorAll(
        '.property-address,h1,.property-lead,.property-links',
      ),
      {
        y: 18,
        opacity: 0.15,
        duration: 0.8,
        stagger: 0.08,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
      },
    );
  }
  updateButton();
  schedule();
  play.addEventListener('click', togglePlay);
  hero.addEventListener('keydown', galleryKey);
  hero.addEventListener('touchstart', startTouch, { passive: true });
  hero.addEventListener('touchend', endTouch, { passive: true });
  document.addEventListener('visibilitychange', schedule);
  motion.addEventListener('change', motionChange);
  return {
    change,
    destroy() {
      clearTimeout(timer);
      entrance?.kill();
      observer.disconnect();
      play.removeEventListener('click', togglePlay);
      hero.removeEventListener('keydown', galleryKey);
      hero.removeEventListener('touchstart', startTouch);
      hero.removeEventListener('touchend', endTouch);
      document.removeEventListener('visibilitychange', schedule);
      motion.removeEventListener('change', motionChange);
    },
  };
}
