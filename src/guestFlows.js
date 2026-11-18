import { calendarButton, calendarEligible, receipt, saveCalendar } from './guestReceipt.js';
import {
  getState,
  getAllMasters,
  getAllServices,
  availableRooms,
  slots,
  saveStay,
  saveVisit,
  cancelStay,
  cancelVisit,
  subscribe,
  today,
  dayOffset,
} from './store.js';
import { h, icon, mark, money, formatDate, guestCount, nights, plural } from './guestUi.js';

const guestKey = 'pages.universitetskaya-hotel-demo:universitetskaya-guest-records-v1';
function legacyIds() {
  try {const value=JSON.parse(localStorage.getItem(guestKey)||'[]');return Array.isArray(value)?value:[]} catch{return []}
}
function remember(id) { localStorage.setItem(guestKey+':'+id,'1'); }
function myRecords(){
  const legacy=legacyIds();
  return records().filter(r=>localStorage.getItem(guestKey+':'+r.id)||legacy.includes(r.id)).reverse();
}
const grouped = (entries, key) => [...new Set(entries.map((e) => e[key]))];
const option = (val, label, current) =>
  `<option value="${h(val)}" ${val === current ? 'selected' : ''}>${h(label)}</option>`;
const field = (label, content) => `<label class="gf-field"><span>${label}</span>${content}</label>`;
const input = (name, value, type = 'text', attrs = '') =>
  `<input type="${type}" name="${name}" value="${h(value)}" ${attrs}>`;
const dateInput = (name, value, attrs) =>
  `<span class="gf-date"><span data-date-value>${formatDate(value, { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>${icon('calendar', 16)}${input(name, value, 'date', attrs)}</span>`;
const action = (title, act, style = 'primary', attrs = '') =>
  `<button type="button" class="gf-${style}" data-f="${act}" ${attrs}>${title}</button>`;
const nextButton = (title) =>
  `<button type="submit" class="gf-primary">${title} ${icon('arrow', 16)}</button>`;
const blank = (msg) => `<p class="gf-empty">${h(msg)}</p>`;
const statusText = {
  booked: 'Подтверждено',
  'checked-in': 'Гость заселён',
  'checked-out': 'Проживание завершено',
  cancelled: 'Отменено',
  done: 'Визит завершён',
};
const records = () => [
  ...getState().stays.map((r) => ({ ...r, kind: 'stay' })),
  ...getState().visits.map((r) => ({ ...r, kind: 'salon' })),
];
const itemFor = (id) => records().find((r) => r.id === id);
const roomName = (id) => getState().categories.find((c) => c.id === id)?.title || 'Номер';
const serviceFor = (id) => getAllServices(getState()).find((c) => c.id === id);
const masterName = (id) => getAllMasters(getState()).find((m) => m.id === id)?.name || 'Мастер';
const fromRef = (list, id) => list.find((x) => x.id === id);
const normPhone = (str) =>
  String(str ?? '')
    .replace(/\D/g, '')
    .replace(/^8(?=\d{10}$)/, '7');

export function makeGuestFlows(dialog, refreshPage) {
  let flow = '',
    edit = null,
    linked = null,
    editOriginal = null,
    cancelOriginal = null,
    screen = '',
    draft = {},
    selected = null,
    busy = false;
  const body = dialog.querySelector('[data-flow-content]');
  dialog.addEventListener('close', () => {
    flow = '';
    draft = {};
    linked = null;
    busy = false;
    document.body.classList.remove('guest-dialog-open');
  });
  dialog.addEventListener('click', (event) => {
    if(event.target!==dialog)return;
    const bounds=dialog.getBoundingClientRect();
    if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)dialog.close();
  });
  function render(title, content, back = '', wide = false) {
    const wasOpen = dialog.open;
    if (!wasOpen) {
      dialog.showModal();
      document.body.classList.add('guest-dialog-open');
    }
    const backButton = back ? action(icon('left', 16) + ' Назад', back, 'plain') : '';
    const steps = flow === 'stay'
      ? [['dates','Даты'],['rooms','Номер'],['contact','Контакты']]
      : flow === 'salon' ? [['slots','Услуга и время'],['contact','Контакты']] : [];
    const currentStep = steps.findIndex(([key]) => key === screen);
    const progress = currentStep < 0 ? '' : '<ol class="gf-steps" aria-label="Этапы бронирования">' +
      steps.map(([, label], index) => `<li class="${index < currentStep ? 'gf-step-complete' : ''}" ${index === currentStep ? 'aria-current="step"' : ''}><span>${index+1}</span>${label}</li>`).join('') + '</ol>';
    dialog.classList.toggle('gf-wide', wide);
    dialog.dataset.gfScreen = screen;
    dialog.dataset.gfFlow = flow;
    body.innerHTML = `<div class="gf-top"><span class="gf-hotel-sign">${mark()}<span>Университетская</span></span><div class="gf-top-controls">${backButton}<button class="gf-close" aria-label="Закрыть окно" data-f="close">${icon('x', 17)}</button></div></div>${progress}<h2 tabindex="-1" class="gf-title" id="guest-dialog-title">${h(title)}</h2><div class="gf-body">${content}</div><p hidden class="gf-error" role="alert"></p>`;
    body.querySelector('h2').focus({ preventScroll: true });
    dialog.scrollTop = 0;
  }
  function alert(msg) {
    const box = body.querySelector('.gf-error');
    box.textContent = msg;
    box.hidden = false;
    box.scrollIntoView({ block: 'nearest' });
  }
  function snapshot(id){
    if(!id)return null;
    const record=itemFor(id);
    if(!record)return null;
    const {kind,...persisted}=record;
    return persisted;
  }
  function changedFrom(original){
    const current=original&&snapshot(original.id);
    return Boolean(original&&(!current||Object.keys(original).some(k=>original[k]!==current[k])));
  }
  function editConflict(){
    showManage();
    alert('Запись уже изменилась. Откройте её заново, чтобы проверить актуальные данные.');
  }
  function openStay(params = {}) {
    flow = 'stay';
    edit = params.edit ?? null;
    editOriginal=snapshot(edit);
    linked = null;
    selected = null;
    const cat = params.categoryId ? fromRef(getState().categories, params.categoryId) : null;
    draft = {
      checkIn: today(),
      checkOut: dayOffset(1),
      guests: 2,
      name: '',
      email: '',
      phone: '',
      notes: '',
      ...params,
    };
    if(!/^\d{4}-\d{2}-\d{2}$/.test(draft.checkIn)||draft.checkIn<today())draft.checkIn=today();
    if(!/^\d{4}-\d{2}-\d{2}$/.test(draft.checkOut)||draft.checkOut<=draft.checkIn)draft.checkOut=dayOffset(1,draft.checkIn);
    if (cat) draft.guests = Math.min(draft.guests, cat.capacity);
    if (params.search) showRooms();
    else showStayOptions();
  }
  function stayDates() {
    const selectedCat = fromRef(getState().categories, draft.categoryId);
    const cols = `<div class="gf-columns">${field('Заезд', dateInput('checkIn', draft.checkIn, `required min="${today()}"`))}${field('Выезд', dateInput('checkOut', draft.checkOut, `required min="${dayOffset(1, draft.checkIn)}"`))}</div>`;
    const max = Math.max(1, ...getState().categories.map((c) => Number(c.capacity) || 1));
    const count = Array.from({ length: max }, (_, i) =>
      option(String(i + 1), guestCount(i + 1), String(draft.guests)),
    ).join('');
    return `<form data-form="dates">${cols}${field('Гости', `<select name="guests">${count}</select>`)}${selectedCat ? `<p class="gf-muted">Вы выбрали «${h(selectedCat.title)}».</p>` : ''}<div class="gf-actions">${nextButton('Показать номера')}</div></form>`;
  }
  function showStayOptions() {
    screen = 'dates';
    render(edit ? 'Изменить проживание' : 'Бронирование номера', stayDates(), edit ? 'manage' : '');
  }
  const availableCat = (c) =>
    availableRooms({
      categoryId: c.id,
      checkIn: draft.checkIn,
      checkOut: draft.checkOut,
      guests: Number(draft.guests),
      excludeId: edit || undefined,
    });
  function roomResults() {
    const roomList = getState().categories.filter((c) => availableCat(c).length);
    if (draft.categoryId)
      roomList.sort(
        (a, b) => Number(b.id === draft.categoryId) - Number(a.id === draft.categoryId),
      );
    return (
      roomList
        .map(
          (c) =>
            `<button type="button" class="gf-room" data-f="select-room" data-id="${h(c.id)}"><span class="gf-room-photo"><img src="${h(c.photos?.[0] || c.photo)}" alt=""></span><span class="gf-room-info"><strong>${h(c.title)}</strong><small>До ${c.capacity} ${plural(c.capacity, ['гостя', 'гостей', 'гостей'])}${c.area?' · '+h(c.area)+' м²':''}</small></span><span class="gf-room-price"><b>${money(c.price)}</b><em>за ночь${c.priceIsDemo?' · демо':''}</em></span>${icon('right', 16)}</button>`,
        )
        .join('') ||
      blank('На эти даты подходящих номеров нет. Измените даты или количество гостей.')
    );
  }
  function showRooms() {
    screen = 'rooms';
    render(
      'Свободные номера',
      `<p class="gf-sub">${formatDate(draft.checkIn)} — ${formatDate(draft.checkOut)}, ${guestCount(draft.guests)}</p><div class="gf-results" data-room-results>${roomResults()}</div>`,
      'dates',
      true,
    );
  }
  function openSalon(params = {}) {
    flow = 'salon';
    edit = params.edit ?? null;
    editOriginal=snapshot(edit);
    linked = params.linked ?? null;
    selected = null;
    const date = linked && linked.checkIn > today() ? linked.checkIn : today();
    draft = {
      date,
      serviceId: getState().services[0]?.id || '',
      masterId: '',
      time: '',
      slotMaster: '',
      name: linked?.name || '',
      phone: linked?.phone || '',
      notes: '',
      ...params,
    };
    if (edit) {
      draft.slotMaster = params.masterId;
    }
    showSlots();
  }
  function offeredServices(state){
    const original=edit&&state.visits.find(v=>v.id===edit);
    const options=[...state.services];
    if(original&&!options.some(s=>s.id===original.serviceId)){
      const prior=getAllServices(state).find(s=>s.id===original.serviceId);
      if(prior)options.push(prior);
    }
    return options;
  }
  function offeredSlots(){
    if(!draft.date||linked&&(draft.date<linked.checkIn||draft.date>linked.checkOut))return [];
    return slots({date:draft.date, serviceId:draft.serviceId,masterId:draft.masterId||undefined,excludeId:edit||undefined});
  }
  function isChosen(available){
    return available.some(s=>s.time===draft.time&&s.masterId===draft.slotMaster);
  }
  function slotButtons(available,state){
    if(!offeredServices(state).length)return blank('Сейчас нет доступных для записи услуг. Уточните возможность визита на стойке регистрации.');
    if(!state.masters.length)return blank('Онлайн-запись временно закрыта. Уточните график мастеров на стойке регистрации.');
    if(!draft.serviceId)return blank('Выберите услугу, чтобы увидеть свободное время.');
    if(!draft.date)return blank('Выберите дату визита.');
    if(linked&&(draft.date<linked.checkIn||draft.date>linked.checkOut))return blank('Выберите дату в пределах проживания.');
    if(!available.length)return blank('На этот день свободного времени нет. Выберите другую дату или другого мастера.');
    return grouped(available,'time').map(time=>{
      const slot=available.find(s=>s.time===time&&s.masterId===draft.slotMaster)||available.find(s=>s.time===time);
      return `<button type="button" data-f="pick-slot" data-time="${h(time)}" data-master="${h(slot.masterId)}" aria-pressed="${time===draft.time}">${h(time)}</button>`;
    }).join('');
  }
  function setOptions(select,values){
    if(select.dataset.options!==values){select.innerHTML=values;select.dataset.options=values;}
  }
  function syncSlots(notify=true){
    const state=getState();
    const availableServices=offeredServices(state);
    const lostMaster=draft.masterId&&!state.masters.some(m=>m.id===draft.masterId);
    const lostService=draft.serviceId&&!availableServices.some(s=>s.id===draft.serviceId);
    if(lostMaster)draft.masterId='';
    if(lostService)draft.serviceId='';
    const available=offeredSlots();
    const lostSlot=draft.time&&!isChosen(available);
    if(lostMaster||lostService||lostSlot){draft.time='';draft.slotMaster='';}
    const form=body.querySelector('[data-form=time]');
    const master=form.elements.masterId,svc=form.elements.serviceId;
    const original=edit&&itemFor(edit);
    setOptions(master,option('',state.masters.length?'Любой мастер':'Нет мастеров',draft.masterId)+
      state.masters.map(m=>option(m.id,m.name,draft.masterId)).join(''));
    const servicePlaceholder=!draft.serviceId?option('',availableServices.length?'Выберите услугу':'Нет услуг',''):'';
    setOptions(svc,servicePlaceholder+availableServices.map(s=>{
      const same=original&&original.serviceId===s.id;
      return option(s.id,`${s.title} · ${same?original.duration:s.duration} мин · ${money(same?(original.price??s.price):s.price)}`,draft.serviceId);
    }).join(''));
    master.value=draft.masterId;svc.value=draft.serviceId;
    master.disabled=!state.masters.length;svc.disabled=!availableServices.length;
    const focusTime=document.activeElement?.dataset.f==='pick-slot'?document.activeElement.dataset.time:null;
    const container=body.querySelector('[data-slots]');
    const markup=slotButtons(available,state);
    if(container.dataset.markup!==markup){
      container.innerHTML=markup;container.dataset.markup=markup;
      if(focusTime)(container.querySelector(`[data-time="${focusTime}"]`)||form.elements.date).focus({preventScroll:true});
    }
    form.querySelector('[type=submit]').disabled=!draft.time;
    if(notify){
      if(lostService)alert('Выбранная услуга больше недоступна. Выберите услугу и время заново.');
      else if(lostMaster)alert('Выбранный мастер больше не принимает записи. Выберите другого мастера и время.');
      else if(lostSlot)alert('Выбранное время стало недоступно. Выберите новое время.');
    }
  }
  function showSlots(){
    screen='slots';
    const min=linked&&linked.checkIn>today()?linked.checkIn:today();
    render(edit?'Перенести запись':'Запись в парикмахерскую',`<p class="gf-sub">Холл первого этажа, ежедневно с 14:00 до 22:00.</p><form data-form="time">${field('Услуга','<select name="serviceId" required></select>')}<div class="gf-columns">${field('Мастер','<select name="masterId"></select>')}${field('Дата',dateInput('date',draft.date||min,`required min="${min}" ${linked?`max="${linked.checkOut}"`:''}`))}</div><p class="gf-label">Свободное время</p><div class="gf-times" data-slots></div><p class="gf-muted">Расписание мастеров и цены в демоверсии приведены для примера.</p><div class="gf-actions">${nextButton('Продолжить')}</div></form>`,edit?'manage':'');
    syncSlots();
  }
  function recap() {
    if (flow === 'salon') {
      const s = serviceFor(draft.serviceId);
      const original=edit&&itemFor(edit);
      const same=original&&original.serviceId===draft.serviceId;
      const duration=same?original.duration:s?.duration;
      const price=same?(original.price??s?.price):s?.price;
      return `<div class="gf-recap">${icon('scissors', 24)}<div><strong>${h(s?.title)}</strong><span>${formatDate(draft.date)}, ${h(draft.time)} · ${h(masterName(draft.slotMaster))}</span><span>${duration} мин · ${money(price)} (демо)</span></div></div>`;
    }
    const c = fromRef(getState().categories, draft.categoryId) || selected;
    const original=edit&&itemFor(edit);
    const price=original&&original.categoryId===c.id?(original.price??c.price):c.price;
    const count = nights(draft.checkIn, draft.checkOut);
    return `<div class="gf-recap">${icon('bed', 24)}<div><strong>${h(c?.title)}</strong><span>${formatDate(draft.checkIn)} — ${formatDate(draft.checkOut)} · ${guestCount(Number(draft.guests))}</span><span>${money(count * price)} за ${count} ${plural(count, ['ночь', 'ночи', 'ночей'])}${c.priceIsDemo ? ' (демо)' : ''}</span></div></div>`;
  }
  function showContact() {
    screen = 'contact';
    render(
      flow === 'salon' ? 'Кто придёт на визит?' : 'На кого оформить номер?',
      `${recap()}<form data-form="save">${field('Имя и фамилия', input('name', draft.name, 'text', 'required minlength="2" maxlength="90" autocomplete="name" placeholder="Как к вам обращаться"'))}${field('Телефон', input('phone', draft.phone, 'tel', 'required minlength="7" maxlength="25" autocomplete="tel" placeholder="+7 999 000-00-00"'))}${flow === 'stay' ? field('Электронная почта · по желанию', input('email', draft.email, 'email', 'autocomplete="email" maxlength="120" placeholder="example@mail.ru"')) : ''}${field(flow === 'stay' ? 'Пожелания к проживанию · по желанию' : 'Пожелания мастеру · по желанию', `<textarea name="notes" maxlength="500" rows="2">${h(draft.notes)}</textarea>`)}<p class="gf-muted">Введите тестовые имя и телефон. В демоверсии запись сохранится только в этом браузере.</p><div class="gf-actions">${nextButton(edit ? 'Сохранить изменения' : flow === 'stay' ? 'Забронировать номер' : 'Подтвердить запись')}</div></form>`,
      flow === 'stay' ? 'rooms' : 'slots',
    );
  }
  function bookingCard(r, allow) {
    const stay = r.kind === 'stay';
    const date = stay
      ? `${formatDate(r.checkIn)} — ${formatDate(r.checkOut)} · ${guestCount(r.guests)}`
      : `${formatDate(r.date)}, ${h(r.time)} · ${h(masterName(r.masterId))}`;
    const canChange =
      allow && r.status === 'booked' && (stay ? r.checkIn >= today() : r.date >= today());
    return `<article tabindex="-1" data-record-id="${h(r.id)}" class="gf-record"><div class="gf-record-top"><small>${stay ? 'Проживание' : 'Парикмахерская'}</small><span class="gf-status">${h(statusText[r.status] || r.status)}</span></div><h3>${h(stay ? roomName(r.categoryId) : serviceFor(r.serviceId)?.title)}</h3><p>${date}</p><p>${h(r.name)}</p><small class="gf-id">Номер ${h(r.id)}</small>${allow && (canChange || calendarEligible(r)) ? `<div class="gf-record-actions">${calendarButton(r)}${canChange ? `${action(stay ? 'Изменить бронь' : 'Перенести', 'edit', 'small', `data-id="${h(r.id)}"`)}${action('Отменить', 'cancel-check', 'small', `data-id="${h(r.id)}"`)}` : ''}</div>` : ''}</article>`;
  }
  function openInquiry(topic = 'Вопрос гостинице') {
    flow = 'inquiry';
    screen = 'inquiry';
    edit = null;
    linked = null;
    draft = { topic };
    const isHall = topic === 'Конференц-зал';
    render(
      isHall ? 'Запросить конференц-зал' : 'Задать вопрос гостинице',
      `<form data-form="inquiry">
      ${field('Имя', input('name', '', 'text', 'required minlength="2" maxlength="90" autocomplete="name"'))}
      <div class="gf-columns">${field('Телефон', input('phone', '', 'tel', 'required minlength="7" maxlength="25" autocomplete="tel"'))}${field('Почта · по желанию', input('email', '', 'email', 'maxlength="150" autocomplete="email"'))}</div>
      ${field(isHall ? 'Дата, количество участников и пожелания' : 'Ваш вопрос', '<textarea name="message" rows="4" minlength="5" maxlength="1400" required></textarea>')}
      <p class="gf-muted">Введите тестовые имя и телефон. В демоверсии обращение сохранится только в этом браузере.</p><div class="gf-actions">${nextButton('Отправить обращение')}</div></form>`,
    );
  }
  async function submitInquiry(form) {
    if (busy) return;
    busy = true;
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      const { saveInquiry } = await import('./store.js');
      const record = await saveInquiry({
        topic: draft.topic,
        ...Object.fromEntries(new FormData(form)),
      });
      if(!dialog.open||!body.contains(form))return;
      screen = 'sent';
      render(
        'Обращение принято',
        `<div class="gf-success">${icon('check', 20)} Сохранено в демоверсии</div><p>Номер обращения <strong>${h(record.id)}</strong>.</p><div class="gf-actions">${action('Готово', 'close')}</div>`,
      );
    } catch (err) {
      if(!dialog.open||!body.contains(form))return;
      alert(err.message || 'Не удалось отправить обращение.');
      btn.disabled = false;
    } finally {
      busy = false;
    }
  }
  function showManage() {
    flow = 'manage';
    edit = null;
    screen = 'manage';
    linked = null;
    const my = myRecords();
    render(
      'Мои бронирования',
      `<div data-guest-records>${my.length ? `<div class="gf-records">${my.map((r) => bookingCard(r, true)).join('')}</div>` : blank('Здесь появятся номера и визиты, которые вы оформите в этом браузере.')}</div><details class="gf-lookup"><summary>Найти по номеру брони</summary><form data-form="lookup"><div class="gf-columns">${field('Номер брони', input('id', '', 'text', 'required'))}${field('Телефон', input('phone', '', 'tel', 'required'))}</div>${nextButton('Найти')}</form></details>`,
    );
  }
  function done(saved) {
    screen = 'done';
    const r = itemFor(saved.id);
    selected = r;
    render(
      edit ? 'Изменения сохранены' : flow === 'stay' ? 'Номер забронирован' : 'Вы записаны',
      `<div class="gf-success">${icon('check', 21)}<span>Подтверждено в демоверсии</span></div>${receipt(r)}<div class="gf-actions">${flow === 'stay' ? action('Записаться в салон', 'link-salon') : ''}${action('Мои бронирования', 'manage', flow === 'stay' ? 'secondary' : 'primary')}${calendarButton(r)}</div>`,
    );
  }
  async function save(form) {
    if (busy) return;
    if(edit&&changedFrom(editOriginal)){editConflict();return;}
    if (edit && itemFor(edit)?.status !== 'booked') {
      showManage();
      alert('Статус записи изменился. Проверьте актуальные данные.');
      return;
    }
    Object.assign(draft, Object.fromEntries(new FormData(form)));
    if(flow==='salon'&&!isChosen(offeredSlots())){
      showSlots();
      return;
    }
    if (normPhone(draft.phone).length < 7 || normPhone(draft.phone).length > 15) {
      alert('Проверьте телефон. Укажите от 7 до 15 цифр.');
      return;
    }
    busy = true;
    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true;
    try {
      let r;
      if (flow === 'stay') {
        const cat = fromRef(getState().categories, draft.categoryId);
        const rooms = availableCat(cat);
        if (!rooms.length) throw new Error('Этот номер уже занят. Вернитесь к выбору номера.');
        const physical = rooms.find((room) => room.id === draft.roomId) || rooms[0];
        r = await saveStay({
          ...(edit ? { id: edit } : {}),
          checkIn: draft.checkIn,
          checkOut: draft.checkOut,
          categoryId: draft.categoryId,
          roomId: physical.id,
          guests: Number(draft.guests),
          name: draft.name.trim(),
          phone: draft.phone.trim(),
          email: draft.email.trim(),
          notes: draft.notes.trim(),
        },editOriginal||undefined);
      } else {
        r = await saveVisit({
          ...(edit ? { id: edit } : {}),
          serviceId: draft.serviceId,
          masterId: draft.slotMaster,
          date: draft.date,
          time: draft.time,
          stayId: linked?.id || draft.stayId || '',
          name: draft.name.trim(),
          phone: draft.phone.trim(),
          notes: draft.notes.trim(),
        },editOriginal||undefined);
      }
      remember(r.id);
      if(dialog.open&&body.contains(form))done(r);else if(dialog.open&&screen==='manage')syncManage();
    } catch (err) {
      if(!dialog.open||!body.contains(form))return;
      if(edit&&changedFrom(editOriginal))editConflict();
      else if(flow==='salon'&&!isChosen(offeredSlots()))showSlots();
      else {alert(err.message || 'Не удалось сохранить. Проверьте данные.');btn.disabled = false;}
    } finally {
      busy = false;
    }
  }
  body.addEventListener('change', (e) => {
    const showDate = (el) => {
      const copy = el.closest('.gf-date')?.querySelector('[data-date-value]');
      if (copy)
        copy.textContent = el.value
          ? formatDate(el.value, { day: '2-digit', month: '2-digit', year: 'numeric' })
          : 'Выберите дату';
    };
    if (e.target.type === 'date') showDate(e.target);
    if (screen === 'slots' && ['serviceId','masterId','date'].includes(e.target.name) && e.target.closest('[data-form=time]')) {
      draft[e.target.name] = e.target.value;
      draft.time = '';
      draft.slotMaster = '';
      body.querySelector('.gf-error').hidden=true;syncSlots(false);
    }
    if (screen === 'dates' && e.target.name === 'checkIn' && e.target.value) {
      const out = body.querySelector('[name=checkOut]');
      out.min = dayOffset(1, e.target.value);
      if (!out.value || out.value < out.min) {
        out.value = out.min;
        showDate(out);
      }
    }
  });
  body.addEventListener('submit', (e) => {
    if (!e.target.dataset.form) return;
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.target));
    switch (e.target.dataset.form) {
      case 'dates':
        Object.assign(draft, values);
        draft.guests = Number(draft.guests);
        showRooms();
        break;
      case 'time':{
        const hadSelection=Boolean(draft.time);
        syncSlots();
        if (!draft.time) {
          if(!hadSelection)alert('Выберите свободное время для визита.');
          break;
        }
        showContact();
        break;}
      case 'save':
        save(e.target);
        break;
      case 'inquiry':
        submitInquiry(e.target);
        break;
      case 'lookup': {
        const match = records().find(
          (r) =>
            r.id.toLowerCase() === values.id.trim().toLowerCase() &&
            normPhone(r.phone) === normPhone(values.phone) &&
            normPhone(r.phone),
        );
        if (match) {
          remember(match.id);
          showManage();
          body.querySelector('[data-record-id="'+CSS.escape(match.id)+'"]')?.focus();
        } else alert('Бронь с таким номером и телефоном не найдена.');
        break;
      }
    }
  });
  body.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-f]');
    if (!button) return;
    const act = button.dataset.f,
      id = button.dataset.id;
    if (screen === 'contact' && ['rooms', 'slots'].includes(act))
      Object.assign(draft, Object.fromEntries(new FormData(body.querySelector('form'))));
    if (act === 'close') dialog.close();
    if (act === 'dates') showStayOptions();
    if (act === 'rooms') showRooms();
    if (act === 'slots') showSlots();
    if (act === 'manage') showManage();
    if (act === 'select-room') {
      selected = fromRef(getState().categories, id);
      draft.categoryId = id;
      showContact();
    }
    if (act === 'pick-slot') {
      draft.time = button.dataset.time;
      draft.slotMaster = button.dataset.master;
      for (const el of body.querySelectorAll('[data-f="pick-slot"]'))
        el.setAttribute('aria-pressed', String(el === button));
      body.querySelector('.gf-error').hidden = true;
      body.querySelector('[data-form=time] [type=submit]').disabled=false;
    }
    if (act === 'link-salon') openSalon({ linked: selected });
    if (act === 'calendar') {
      const r = itemFor(id);
      if (calendarEligible(r)) saveCalendar(r);
      else showManage();
    }
    if (act === 'edit') {
      const r = itemFor(id);
      if (!r) return showManage();
      if (r.kind === 'salon')
        openSalon({ ...r, edit: id, linked: r.stayId ? itemFor(r.stayId) : null });
      else openStay({ ...r, edit: id });
    }
    if (act === 'cancel-check') {
      const r = itemFor(id);
      if (!r) return showManage();
      const linkedVisit =
        r.kind === 'stay' &&
        getState().visits.some((v) => v.stayId === r.id && v.status === 'booked');
      cancelOriginal=snapshot(id);
      screen = 'cancel';
      render(
        r.kind === 'stay' ? 'Отменить бронь номера?' : 'Отменить визит?',
        `${bookingCard(r, false)}${linkedVisit ? '<p class="gf-sub">Связанные с этим проживанием записи в парикмахерскую тоже будут отменены.</p>' : ''}<div class="gf-actions">${action('Да, отменить', 'cancel', 'primary', `data-id="${h(id)}"`)}${action('Оставить', 'manage', 'secondary')}</div>`,
        'manage',
      );
    }
    if (act === 'cancel' && !busy) {
      busy = true;
      button.disabled = true;
      try {
        const r = itemFor(id);
        if(!r||changedFrom(cancelOriginal)){editConflict();return;}
        await (r.kind === 'stay' ? cancelStay(id,cancelOriginal) : cancelVisit(id,cancelOriginal));
        showManage();
      } catch (err) {
        if(changedFrom(cancelOriginal))editConflict();
        else{alert(err.message);button.disabled = false;}
      } finally {
        busy = false;
      }
    }
  });
  function syncManage(){
    const panel=body.querySelector('[data-guest-records]');if(!panel)return;
    const records=myRecords();
    const contents=records.length?`<div class="gf-records">${records.map(r=>bookingCard(r,true)).join('')}</div>`:blank('Здесь появятся номера и визиты, которые вы оформите в этом браузере.');
    if(panel.dataset.contents!==contents){
      const active=panel.contains(document.activeElement)?document.activeElement.dataset:null;
      panel.innerHTML=contents;panel.dataset.contents=contents;
      if(active?.f&&active.id)panel.querySelector(`[data-f="${active.f}"][data-id="${CSS.escape(active.id)}"]`)?.focus({preventScroll:true});
    }
  }
  function refreshOpen(){
    if(!dialog.open||busy)return;
    if(screen==='cancel'&&changedFrom(cancelOriginal)){editConflict();return;}
    if(edit&&['contact','slots','rooms','dates'].includes(screen)&&changedFrom(editOriginal)){editConflict();return;}
    if(edit&&['contact','slots','rooms','dates'].includes(screen)&&itemFor(edit)?.status!=='booked'){
      showManage();alert('Статус записи изменился. Проверьте актуальные данные.');return;
    }
    if(linked&&flow==='salon'&&['slots','contact'].includes(screen)){
      const stay=itemFor(linked.id);
      if(!stay||!['booked','checked-in'].includes(stay.status)){showManage();alert('Бронирование проживания закрыто. При необходимости оформите отдельный визит.');return;}
      linked=stay;
      const input=body.querySelector('input[name=date]');
      if(input){input.min=stay.checkIn>today()?stay.checkIn:today();input.max=stay.checkOut;}
    }
    if(screen==='done'&&selected){
      const latest=itemFor(selected.id);
      if(calendarEligible(latest))done(latest);else showManage();
    }else if(screen==='slots')syncSlots();
    else if(screen==='contact'){
      if(flow==='stay'&&!availableCat(fromRef(getState().categories,draft.categoryId)).length){
        Object.assign(draft,Object.fromEntries(new FormData(body.querySelector('form'))));
        showRooms();alert('На эти даты в выбранной категории закончились номера. Выберите другой номер или даты.');
      }else if(flow==='salon'&&!isChosen(offeredSlots())){
        Object.assign(draft,Object.fromEntries(new FormData(body.querySelector('form'))));
        showSlots();
      }else{
        const current=body.querySelector('.gf-recap');
        if(current)current.outerHTML=recap();
      }
    }else if(screen==='rooms'){
      const results=body.querySelector('[data-room-results]');
      const focused=results.contains(document.activeElement)?document.activeElement.dataset.id:null;
      results.innerHTML=roomResults();
      if(focused)(results.querySelector(`[data-id="${CSS.escape(focused)}"]`)||body.querySelector('[data-f=dates]')).focus({preventScroll:true});
    }else if(screen==='manage')syncManage();
  }
  const off=subscribe(()=>{refreshPage();refreshOpen()});
  const ownershipChanged=e=>{if(dialog.open&&screen==='manage'&&(e.key===null||e.key===guestKey||e.key?.startsWith(guestKey+':')))syncManage()};
  window.addEventListener('storage',ownershipChanged);
  const detail = (title, html) => {
    flow = 'info';
    screen = 'info';
    render(title, html, '', true);
  };
  return {
    openStay,
    openSalon,
    openInquiry,
    showManage,
    detail,
    close: () => dialog.close(),
    destroy(){off();window.removeEventListener('storage',ownershipChanged)},
  };
}
