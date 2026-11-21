/* Istiqamah 40 — challenge 40 hari: 40 rakaat, 1 juz, sedekah */
'use strict';

/* ================= Data statis ================= */
const STORE_KEY = 'istiqamah40:v1';
const FIRED_KEY = 'istiqamah40:fired';
const APP_VERSION = '4.0';

// [id, kunci label, rakaat, jenis] — f: fardhu, r: rawatib, m: shalat malam
const ROWS = [
  { key: 'night', prayer: 'tahajud', chips: [['th', 'c.tahajud', 8, 'm'], ['wi', 'c.witir', 3, 'm']] },
  { key: 'fajr', prayer: 'fajr', chips: [['sq', 'c.before', 2, 'r'], ['sf', 'c.fard', 2, 'f']] },
  { key: 'dhuhr', prayer: 'dhuhr', chips: [['dq', 'c.before', 4, 'r'], ['df', 'c.fard', 4, 'f'], ['db', 'c.after', 2, 'r']] },
  { key: 'asr', prayer: 'asr', chips: [['af', 'c.fard', 4, 'f']] },
  { key: 'maghrib', prayer: 'maghrib', chips: [['mf', 'c.fard', 3, 'f'], ['mb', 'c.after', 2, 'r']] },
  { key: 'isha', prayer: 'isha', chips: [['if', 'c.fard', 4, 'f'], ['ib', 'c.after', 2, 'r']] },
];
const ITEMS = {};
ROWS.forEach((row) => row.chips.forEach(([id, label, rk, kind]) => { ITEMS[id] = { id, label, rk, kind, row: row.key }; }));

const JUZ = [
  'Al-Fatihah 1 – Al-Baqarah 141', 'Al-Baqarah 142 – 252', "Al-Baqarah 253 – Ali 'Imran 92",
  "Ali 'Imran 93 – An-Nisa' 23", "An-Nisa' 24 – 147", "An-Nisa' 148 – Al-Ma'idah 81",
  "Al-Ma'idah 82 – Al-An'am 110", "Al-An'am 111 – Al-A'raf 87", "Al-A'raf 88 – Al-Anfal 40",
  'Al-Anfal 41 – At-Taubah 92', 'At-Taubah 93 – Hud 5', 'Hud 6 – Yusuf 52', 'Yusuf 53 – Ibrahim 52',
  'Al-Hijr 1 – An-Nahl 128', "Al-Isra' 1 – Al-Kahf 74", 'Al-Kahf 75 – Taha 135', "Al-Anbiya' 1 – Al-Hajj 78",
  "Al-Mu'minun 1 – Al-Furqan 20", 'Al-Furqan 21 – An-Naml 55', "An-Naml 56 – Al-'Ankabut 45",
  "Al-'Ankabut 46 – Al-Ahzab 30", 'Al-Ahzab 31 – Yasin 27', 'Yasin 28 – Az-Zumar 31', 'Az-Zumar 32 – Fussilat 46',
  'Fussilat 47 – Al-Jasiyah 37', 'Al-Ahqaf 1 – Az-Zariyat 30', 'Az-Zariyat 31 – Al-Hadid 29',
  'Al-Mujadilah 1 – At-Tahrim 12', 'Al-Mulk 1 – Al-Mursalat 50', "An-Naba' 1 – An-Nas 6",
];

const CITIES = [
  ['Banda Aceh', 5.5483, 95.3238], ['Medan', 3.5952, 98.6722], ['Padang', -0.9471, 100.4172],
  ['Pekanbaru', 0.5071, 101.4478], ['Palembang', -2.9761, 104.7754], ['Jakarta', -6.2088, 106.8456],
  ['Bogor', -6.5971, 106.806], ['Bandung', -6.9175, 107.6191], ['Semarang', -6.9667, 110.4167],
  ['Yogyakarta', -7.7956, 110.3695], ['Solo', -7.5755, 110.8243], ['Surabaya', -7.2575, 112.7521],
  ['Malang', -7.9666, 112.6326], ['Denpasar', -8.6705, 115.2126], ['Mataram', -8.5833, 116.1167],
  ['Pontianak', -0.0263, 109.3425], ['Banjarmasin', -3.3194, 114.5908], ['Balikpapan', -1.2379, 116.8529],
  ['Makassar', -5.1477, 119.4327], ['Manado', 1.4748, 124.8421], ['Ambon', -3.6954, 128.1814],
  ['Jayapura', -2.5337, 140.7181],
];

const SEDEKAH_KINDS = [['uang', 'coins'], ['makanan', 'cloche'], ['barang', 'box'], ['tenaga', 'handshake'], ['ilmu', 'plant'], ['lain', 'grid']];

const defaultLang = () => ((navigator.language || 'id').toLowerCase().startsWith('id') ? 'id' : (navigator.language || '').toLowerCase().startsWith('en') ? 'en' : 'id');
const DEFAULT_SETTINGS = {
  lang: null, theme: 'auto', startDate: null,
  city: 'Bandung', lat: -6.9175, lng: 107.6191,
  rem: { adzan: true, badiyah: true, susul: true, tahajud: true, witir: false, tilawah: true, sisa: true, ringkasan: true, sedekah: true },
  tahajudOffset: 50, witirTime: '21:30', sisaTime: '20:30', ringkasanTime: '21:00', sedekahTime: '06:30',
  showAmount: false,
};

/* ================= Utilitas ================= */
const $ = (sel, el = document) => el.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseYmd = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parseYmd(s); d.setDate(d.getDate() + n); return ymd(d); };
const utc = (s) => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); };
const diffDays = (a, b) => Math.round((utc(b) - utc(a)) / 86400000);
const todayYmd = () => ymd(new Date());
const hhmmToMin = (s) => { const [h, m] = String(s || '0:0').split(':').map(Number); return h * 60 + m; };

/* ================= State ================= */
function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY));
    if (raw && raw.settings) {
      raw.settings = { ...DEFAULT_SETTINGS, ...raw.settings, rem: { ...DEFAULT_SETTINGS.rem, ...(raw.settings.rem || {}) } };
      raw.days = raw.days || {};
      // Pengguna versi lama (sudah punya tanggal mulai) langsung masuk sebagai tamu
      if (!raw.profile && raw.settings.startDate) raw.profile = { provider: 'guest', name: '' };
      if (!raw.settings.lang) raw.settings.lang = defaultLang();
      return raw;
    }
  } catch (e) { /* data rusak → mulai baru */ }
  return { settings: { ...DEFAULT_SETTINGS, lang: defaultLang(), rem: { ...DEFAULT_SETTINGS.rem } }, days: {}, profile: null };
}
let state = load();
let lastSettingsSnap = null;
// Bahasa & tema tidak dihitung sebagai perubahan yang perlu disinkronkan
function settingsSnap() { const { u, lang, theme, ...rest } = state.settings; return JSON.stringify(rest); }
lastSettingsSnap = settingsSnap();
const ui = { screen: null, tab: 'home', sub: null, viewDate: todayYmd(), selDay: null, coverFrom: null };

function saveLocal() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { toast(t('toast.saveFail')); }
}
// Simpan + tandai perubahan pengaturan untuk sinkronisasi cloud
function save() {
  const snap = settingsSnap();
  if (snap !== lastSettingsSnap) { state.settings.u = Date.now(); if (window.Sync) Sync.markSettings(); }
  lastSettingsSnap = snap;
  saveLocal();
  if (window.Sync) Sync.schedule();
}
function applySettings(s) { state.settings = s; lastSettingsSnap = settingsSnap(); }

/* ================= Bahasa ================= */
const missingKeys = new Set();
const L = () => (state.settings.lang === 'en' ? 'en' : 'id');
function t(key, p) {
  const dict = I18N[L()];
  let v = dict[key];
  if (v === undefined) { missingKeys.add(`${L()}:${key}`); v = I18N.id[key]; }
  if (v === undefined) return key;
  if (typeof v === 'function') return v(p || {});
  return p ? v.replace(/\{(\w+)\}/g, (_, k) => (p[k] ?? '')) : v;
}
const locale = () => (L() === 'en' ? 'en-US' : 'id-ID');
const fmtMin = (m) => { m = ((m % 1440) + 1440) % 1440; const s = L() === 'en' ? ':' : '.'; return `${pad(Math.floor(m / 60))}${s}${pad(m % 60)}`; };
const fmtDate = (s) => new Intl.DateTimeFormat(locale(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(parseYmd(s));
const fmtShort = (s) => new Intl.DateTimeFormat(locale(), { day: 'numeric', month: 'short' }).format(parseYmd(s));
const rupiah = (n) => 'Rp' + Number(n || 0).toLocaleString(locale());
const prayerName = (k) => t('p.' + k);
const itemName = (id) => {
  const it = ITEMS[id];
  if (it.kind === 'm') return t(it.label);
  if (it.kind === 'f') return prayerName(it.row);
  return t(it.kind === 'r' && it.label === 'c.before' ? 'item.before' : 'item.after', { p: prayerName(it.row) });
};

/* ================= Perhitungan ================= */
const rec = (d) => state.days[d] || { done: {}, pages: 0, note: '' };
// Dipanggil tepat sebelum catatan suatu hari diubah
function ensureRec(d) {
  if (!state.days[d]) state.days[d] = { done: {}, pages: 0, note: '' };
  state.days[d].u = Date.now();
  if (window.Sync) Sync.markDay(d);
  return state.days[d];
}
function ensureSedekah(d) {
  const r = ensureRec(d);
  if (!r.sedekah) r.sedekah = { done: false, kinds: [], amount: 0 };
  return r.sedekah;
}
function calc(r) {
  let f = 0, rw = 0, m = 0;
  for (const id in r.done) {
    if (!r.done[id] || !ITEMS[id]) continue;
    const it = ITEMS[id];
    if (it.kind === 'f') f += it.rk; else if (it.kind === 'r') rw += it.rk; else m += it.rk;
  }
  const sd = r.sedekah || {};
  const total = f + rw + m, pages = r.pages || 0, sedekah = !!sd.done;
  const targets = (total === 40 ? 1 : 0) + (pages >= 20 ? 1 : 0) + (sedekah ? 1 : 0);
  return { f, r: rw, m, total, pages, sedekah, amount: sd.amount || 0, targets };
}
const dayNum = (d) => diffDays(state.settings.startDate, d) + 1;
const juzFor = (n) => ((Math.max(1, n) - 1) % 30) + 1;
const isPerfect = (c) => c.targets === 3;

function times(d) {
  const s = state.settings;
  const tm = PrayTimes.compute(parseYmd(d), s.lat, s.lng);
  tm.tahajud = tm.fajr - s.tahajudOffset;
  return tm;
}
function streak() {
  // Hari berturut-turut dengan 17 rakaat fardhu lengkap (hari ini dihitung bila sudah lengkap)
  const s = state.settings.startDate;
  let d = todayYmd();
  if (calc(rec(d)).f < 17) d = addDays(d, -1);
  let n = 0;
  while (diffDays(s, d) >= 0 && calc(rec(d)).f === 17) { n++; d = addDays(d, -1); }
  return n;
}
function nextEvent() {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const today = todayYmd();
  const tm = times(today);
  for (const k of ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']) if (tm[k] > nowMin) return { name: prayerName(k), min: tm[k], delta: tm[k] - nowMin };
  const t2 = times(addDays(today, 1));
  return { name: t('c.tahajud'), min: t2.tahajud, delta: 1440 - nowMin + t2.tahajud, night: true };
}
const firstName = () => ((state.profile && state.profile.name) || '').trim().split(/\s+/)[0] || '';

/* ================= Tema ================= */
const darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
function applyTheme() {
  const s = state.settings;
  const theme = s.theme === 'auto' ? (darkQuery && darkQuery.matches ? 'dark' : 'light') : s.theme;
  document.documentElement.dataset.theme = theme;
  document.documentElement.lang = L();
  const meta = $('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', ui.screen === 'cover' ? '#15513A' : theme === 'dark' ? '#0F1714' : '#F6F7F4');
}
if (darkQuery && darkQuery.addEventListener) darkQuery.addEventListener('change', () => { applyTheme(); });

/* ================= Komponen kecil ================= */
const logo = (size, opts) => `<span class="logo" style="width:${size}px;height:${size}px">${logoSVG(opts)}</span>`;
function avatar(size = 36) {
  const p = state.profile || {};
  const initial = esc((p.name || '').trim().charAt(0).toUpperCase());
  if (p.picture) return `<img class="avatar" src="${esc(p.picture)}" alt="" width="${size}" height="${size}" referrerpolicy="no-referrer">`;
  return `<span class="avatar ${initial ? '' : 'empty'}" style="width:${size}px;height:${size}px">${initial || ic('user', Math.round(size * 0.55))}</span>`;
}
const langSwitch = (cls = '') => `<div class="seg ${cls}" role="group" aria-label="${esc(t('lang.label'))}">
  <button type="button" data-action="lang" data-lang="id" aria-pressed="${L() === 'id'}" class="${L() === 'id' ? 'on' : ''}">ID</button>
  <button type="button" data-action="lang" data-lang="en" aria-pressed="${L() === 'en'}" class="${L() === 'en' ? 'on' : ''}">EN</button></div>`;
const googleG = '<svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
const googleButton = () => (window.APP_CONFIG && APP_CONFIG.googleClientId
  ? '<div id="gsi-btn" class="gsi-holder"></div>'
  : `<button type="button" class="btn google" data-action="google-unconfigured">${googleG}<span>${esc(t('reg.google'))}</span></button>`);

/* ================= Layar: Cover ================= */
function viewCover() {
  const fromApp = ui.coverFrom === 'app';
  return `<div class="cover">
    <div class="cover-top">${fromApp ? `<button type="button" class="icon-btn on-dark" data-action="cover-back" aria-label="${esc(t('back'))}">${ic('back')}</button>` : '<span></span>'}${langSwitch('on-dark')}</div>
    <div class="cover-brand">
      ${logo(132, { rounded: true })}
      <h1>Istiqamah 40</h1>
      <p class="cover-kicker">${esc(t('cover.kicker'))}</p>
      <p class="cover-tagline">${esc(t('cover.tagline'))}</p>
    </div>
    <figure class="ayah">
      <p class="ayah-ar" lang="ar" dir="rtl">إِنَّ الَّذِينَ يَتْلُونَ كِتَابَ اللَّهِ وَأَقَامُوا الصَّلَاةَ وَأَنْفَقُوا مِمَّا رَزَقْنَاهُمْ سِرًّا وَعَلَانِيَةً يَرْجُونَ تِجَارَةً لَنْ تَبُورَ</p>
      <blockquote class="ayah-tr">“${esc(t('ayah.tr'))}”</blockquote>
      <figcaption>${esc(t('ayah.ref'))}</figcaption>
      <div class="pillars">
        <span><i class="dot shalat"></i>${esc(t('pillar.shalat'))}</span>
        <span><i class="dot tilawah"></i>${esc(t('pillar.tilawah'))}</span>
        <span><i class="dot sedekah"></i>${esc(t('pillar.sedekah'))}</span>
      </div>
    </figure>
    <div class="cover-cta">${fromApp ? '' : `<button type="button" class="btn light big" data-action="cover-start">${esc(t('cover.start'))}</button>`}</div>
  </div>`;
}

/* ================= Layar: Registrasi ================= */
function viewRegister() {
  const opt = (code, name, sub) => `<button type="button" class="lang-opt ${L() === code ? 'on' : ''}" data-action="lang" data-lang="${code}" aria-pressed="${L() === code}">
    <span><strong>${name}</strong><small>${sub}</small></span><span class="radio">${L() === code ? ic('check', 16) : ''}</span></button>`;
  return `<div class="auth">
    <button type="button" class="icon-btn" data-action="to-cover" aria-label="${esc(t('back'))}">${ic('back')}</button>
    <div class="auth-head">${logo(64, { rounded: true })}<h1>${esc(t('reg.title'))}</h1><p>${esc(t('reg.sub'))}</p></div>
    <section class="auth-block">
      <h2>${ic('globe', 18)} ${esc(t('reg.langTitle'))}</h2>
      <div class="lang-list">${opt('id', 'Bahasa Indonesia', 'Seluruh aplikasi dalam Bahasa Indonesia')}${opt('en', 'English', 'The whole app in English')}</div>
    </section>
    <section class="auth-block">
      <h2>${ic('user', 18)} ${esc(t('reg.accountTitle'))}</h2>
      ${googleButton()}
      <div class="or"><span>${esc(t('reg.or'))}</span></div>
      <button type="button" class="btn ghost wide" data-action="guest">${esc(t('reg.guest'))}</button>
      <p class="fine">${ic('shield', 16)} <span>${esc(t('reg.privacy'))}</span></p>
    </section>
  </div>`;
}

/* ================= Layar: Atur challenge ================= */
function viewSetup() {
  return `<div class="auth">
    <div class="auth-head">${logo(56, { rounded: true })}<h1>${esc(t('setup.title', { name: firstName() }))}</h1><p>${esc(t('setup.sub'))}</p></div>
    <div class="goal-list">
      <div class="goal shalat">${ic('shalat')}<div><strong>${esc(t('pillar.shalat'))}</strong><span>${esc(t('setup.goalShalat'))}</span></div></div>
      <div class="goal tilawah">${ic('tilawah')}<div><strong>${esc(t('pillar.tilawah'))}</strong><span>${esc(t('setup.goalTilawah'))}</span></div></div>
      <div class="goal sedekah">${ic('sedekah')}<div><strong>${esc(t('pillar.sedekah'))}</strong><span>${esc(t('setup.goalSedekah'))}</span></div></div>
    </div>
    <form id="setup-form" class="auth-block">
      <label for="su-start">${esc(t('setup.start'))}</label>
      <input id="su-start" type="date" required value="${todayYmd()}">
      <label for="su-city">${esc(t('setup.city'))}</label>
      <select id="su-city">${CITIES.map(([c]) => `<option ${c === state.settings.city ? 'selected' : ''}>${c}</option>`).join('')}</select>
      <label class="check"><input id="su-notif" type="checkbox" checked> ${esc(t('setup.notif'))}</label>
      <button class="btn primary big" type="submit">${esc(t('setup.go'))}</button>
    </form>
  </div>`;
}

/* ================= Komponen tampilan ================= */
const PILLAR_ICON = { shalat: 'shalat', tilawah: 'tilawah', sedekah: 'sedekah' };
const WAKTU_ICON = { night: 'tahajud', tahajud: 'tahajud', fajr: 'subuh', dhuhr: 'dzuhur', asr: 'ashar', maghrib: 'maghrib', isha: 'tahajud' };
const tile = (kind, size = 'md', icon) => `<span class="ptl ${kind} ${size}">${ic(icon || PILLAR_ICON[kind], size === 'lg' ? 26 : size === 'sm' ? 18 : 22)}</span>`;
function statusMark(st) {
  if (st === 'done') return `<span class="stmark done" aria-label="${esc(t('st.done'))}">${ic('check', 14)}</span>`;
  if (st === 'part') return `<span class="stmark part" aria-label="${esc(t('st.part'))}">${ic('halfClock', 16)}</span>`;
  return `<span class="stmark none" aria-label="${esc(t('st.none'))}"></span>`;
}
const stOf = (v, max) => (v >= max ? 'done' : v > 0 ? 'part' : 'none');
function landscape() {
  return `<svg class="landscape" viewBox="0 0 360 120" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <circle class="ill-star" cx="200" cy="14" r="1.6"/><circle class="ill-star" cx="236" cy="6" r="1.2"/><circle class="ill-star" cx="342" cy="16" r="1.4"/><circle class="ill-star" cx="168" cy="26" r="1.1"/>
    <circle class="ill-sun" cx="262" cy="30" r="17"/><circle class="ill-moon-cut" cx="270" cy="24" r="14"/>
    <path class="ill-h1" d="M0 70 C 60 44, 120 50, 180 62 S 290 48, 360 54 V120 H0Z"/>
    <g class="ill-mosque"><path d="M296 56v-10a11 11 0 0 1 22 0v10Z"/><rect x="324" y="28" width="6" height="28" rx="1.5"/><path d="M327 20l3 8h-6Z"/><path d="M307 35v-6" stroke-width="2" stroke="currentColor"/></g>
    <path class="ill-h2" d="M0 84 C 70 68, 150 72, 220 80 S 320 72, 360 76 V120 H0Z"/>
  </svg>`;
}
function subBar(title) {
  return `<header class="appbar sub"><button type="button" class="icon-btn" data-action="sub-back" aria-label="${esc(t('back'))}">${ic('back')}</button><h1 class="appbar-title">${esc(title)}</h1><span class="appbar-spacer"></span></header>`;
}

/* ================= Aplikasi: Beranda ================= */
function viewHome() {
  const s = state.settings;
  const d = ui.viewDate;
  const today = todayYmd();
  const n = dayNum(d);
  const isToday = d === today;
  const nm = firstName();

  if (dayNum(today) < 1 && isToday) {
    return `<section class="hero">${landscape()}<div class="hero-text"><h1>${esc(t('notStarted'))}</h1><p>${esc(fmtDate(today))}</p></div></section>
      <section class="card"><p>${esc(t('notStartedBody', { date: fmtDate(s.startDate) }))}</p>
      <button type="button" class="btn primary" data-action="start-today">${esc(t('startToday'))}</button></section>`;
  }
  const r = rec(d);
  const c = calc(r);
  const inRange = n >= 1 && n <= 40;
  let html = '';
  if (!isToday) html += `<button type="button" class="backbar" data-action="go-today">${ic('back', 18)} ${esc(t('editingPast', { date: fmtShort(d) }))}</button>`;

  html += `<section class="hero">${landscape()}
    <div class="hero-text"><h1>${esc(nm ? t('greet', { name: nm }) : t('greetNoName'))}</h1><p>${esc(t('heroSub'))}</p></div>
    <div class="day-card">
      <span class="ptl shalat-soft md">${ic('journey', 22)}</span>
      <div class="dc-body">
        <div class="row-between"><strong>${inRange ? esc(t('dayOf', { n })) : esc(t('finished.short'))}</strong>${inRange ? `<span class="pct">${Math.round((n / 40) * 100)}%</span>` : ''}</div>
        <span class="muted small">${esc(fmtDate(d))}</span>
        ${inRange ? `<div class="bar"><div style="width:${(n / 40) * 100}%"></div></div>` : ''}
      </div>
    </div>
  </section>`;

  if (isToday && dayNum(today) > 40) {
    html += `<section class="card done-card"><h2>${esc(t('finished.title'))}</h2><p>${esc(t('finished.body'))}</p>
      <div class="btn-row"><button type="button" class="btn primary" data-action="restart">${esc(t('finished.restart'))}</button>
      <button type="button" class="btn ghost" data-tab="eval">${esc(t('finished.review'))}</button></div></section>`;
  }

  // Progres hari ini — tiga ubin
  const tileBox = (kind, label, val, unit, st) => `<button type="button" class="ptile-btn ${kind} ${st}" data-action="open-sub" data-id="${kind}">
      ${tile(kind)}<span class="pt-name">${esc(label)}</span><span class="pt-val">${val}</span>${unit ? `<span class="pt-unit">${esc(unit)}</span>` : ''}${statusMark(st)}</button>`;
  const msg = ['msg.k0', 'msg.k1', 'msg.k2', 'msg.k3'][c.targets];
  html += `<section class="card">
    <div class="row-between"><h2>${esc(isToday ? t('progressToday') : t('progressThatDay'))}</h2><span class="badge ${c.targets === 3 ? 'ok' : ''}">${c.targets}/3</span></div>
    <div class="bar soft"><div style="width:${(c.targets / 3) * 100}%"></div></div>
    <div class="ptile-grid">
      ${tileBox('shalat', t('pillar.shalat'), `${c.total}/40`, t('rakaat'), stOf(c.total, 40))}
      ${tileBox('tilawah', t('pillar.tilawah'), `${c.pages}/20`, t('pagesShort'), stOf(c.pages, 20))}
      ${tileBox('sedekah', t('pillar.sedekah'), c.sedekah ? esc(t('done')) : '—', '', c.sedekah ? 'done' : 'none')}
    </div>
    <p class="tp-msg ${c.targets === 3 ? 'ok' : ''}">${ic(c.targets === 3 ? 'star' : 'bulb', 18)}<span>${esc(t(msg))}</span></p>
  </section>`;

  // Target hari ini — daftar menuju halaman rincian
  const tgt = (kind, title, sub, st) => `<button type="button" class="trow" data-action="open-sub" data-id="${kind}">${tile(kind)}<span class="tr-body"><strong>${esc(title)}</strong><span>${sub}</span></span>${statusMark(st)}${ic('chevron', 18)}</button>`;
  html += `<section class="card list">
    <h2 class="list-title">${esc(t('targetToday'))}</h2>
    ${tgt('shalat', t('shalat.title'), esc(t('shalat.rowSub', { n: c.total })), stOf(c.total, 40))}
    ${tgt('tilawah', t('tilawah.title'), esc(t('tilawah.rowSub', { n: c.pages, juz: juzFor(n) })), stOf(c.pages, 20))}
    ${tgt('sedekah', t('sedekah.title'), esc(c.sedekah ? t('sedekah.rowDone') : t('sedekah.rowTodo')), c.sedekah ? 'done' : 'none')}
  </section>`;

  // Jadwal hari ini
  if (isToday) html += scheduleCard(d, r);

  if (isToday) {
    const st = streak();
    if (st > 0) html += `<section class="streak">${ic('flame', 24)}<div><strong>${esc(t('streak', { n: st }))}</strong><span>${esc(t('streakSub'))}</span></div></section>`;
  }

  html += `<section class="card"><h2 class="h-ico">${ic('note', 18)} ${esc(t('note.title'))}</h2>
    <label class="sr" for="note">${esc(t('note.title'))}</label>
    <textarea id="note" rows="3" data-action="note" placeholder="${esc(t('note.ph'))}"></textarea></section>`;
  return html;
}
function scheduleCard(d, r) {
  const tm = times(d);
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const list = [['tahajud', tm.tahajud, 'th'], ['fajr', tm.fajr, 'sf'], ['dhuhr', tm.dhuhr, 'df'], ['asr', tm.asr, 'af'], ['maghrib', tm.maghrib, 'mf'], ['isha', tm.isha, 'if']];
  let cur = -1;
  list.forEach(([, m], i) => { if (m <= nowMin) cur = i; });
  const ne = nextEvent();
  return `<section class="card list">
    <div class="list-title row-between"><h2>${esc(t('schedule'))}</h2><span class="muted small" id="next-notice">${nextNoticeText(ne)}</span></div>
    ${list.map(([k, m, id], i) => {
      const done = !!r.done[id];
      const name = k === 'tahajud' ? t('c.tahajud') : prayerName(k);
      let right;
      if (done) right = `<span class="sch-st done">${ic('check', 14)} ${esc(t('st.doneShort'))}</span>`;
      else if (i === cur) right = `<span class="sch-st now">${esc(t('st.now'))}</span>`;
      else if (m < nowMin) right = `<span class="sch-st late">${esc(t('st.unlogged'))}</span>`;
      else right = `<span class="sch-st">${esc(t('st.upcoming'))}</span>`;
      return `<button type="button" class="srow sch ${i === cur && !done ? 'is-now' : ''}" data-action="open-sub" data-id="shalat"><span class="wk-ico">${ic(WAKTU_ICON[k], 20)}</span><span class="sch-name"><strong>${esc(name)}</strong></span><span class="sch-time">${fmtMin(m)}</span>${right}</button>`;
    }).join('')}
  </section>`;
}
function nextNoticeText(ne) {
  return esc(t('nextIn', { p: ne.name, h: Math.floor(ne.delta / 60), m: ne.delta % 60 }));
}

/* ================= Rincian: Shalat ================= */
function viewShalat() {
  const d = ui.viewDate;
  const r = rec(d);
  const c = calc(r);
  const tm = times(d);
  const grp = (icon, title, sub, v, max) => `<div class="grow-row">${tile('shalat', 'md', icon)}<span class="tr-body"><strong>${esc(title)}</strong><span>${esc(sub)}</span></span><span class="gv">${v}/${max}</span>${statusMark(stOf(v, max))}</div>`;
  let html = `<section class="detail-hero shalat">${tile('shalat', 'lg')}<div><h1>${esc(t('shalat.title'))}</h1><p>${esc(fmtDate(d))}</p></div>
      <div class="big-num">${c.total}<small>/40 ${esc(t('rakaat'))}</small></div>
      <div class="bar"><div style="width:${(c.total / 40) * 100}%"></div></div></section>
    <section class="card list">
      ${grp('fardhu', t('g.fardhu'), t('g.fardhuSub'), c.f, 17)}
      ${grp('rawatib', t('g.rawatib'), t('g.rawatibSub'), c.r, 12)}
      ${grp('tahajud', t('g.night'), t('g.nightSub'), c.m, 11)}
    </section>
    <section class="card pillar">
      <div class="row-between"><h2>${esc(t('checklist'))}</h2><span class="hint">${esc(t('tapToCheck'))}</span></div>
      <div class="plist">`;
  for (const rw of ROWS) {
    const time = rw.prayer === 'tahajud' ? tm.tahajud : tm[rw.prayer];
    html += `<div class="prow"><span class="wk-ico">${ic(WAKTU_ICON[rw.key], 20)}</span><div class="pname"><strong>${esc(rw.key === 'night' ? t('p.night') : prayerName(rw.key))}</strong><span>${fmtMin(time)}</span></div><div class="chips">`;
    for (const [id, label, rk, kind] of rw.chips) {
      const on = !!r.done[id];
      html += `<button type="button" class="chip ${kind === 'f' ? 'fardhu' : 'sunnah'} ${on ? 'on' : ''}" data-action="toggle" data-id="${id}" aria-pressed="${on}">${on ? ic('check', 14) : ''}${esc(t(label))} · ${rk}</button>`;
    }
    html += '</div></div>';
  }
  html += `</div></section>
    <section class="total-card ${c.total === 40 ? 'ok' : ''}">${statusMark(stOf(c.total, 40))}<div><span>${esc(t('totalToday'))}</span><strong>${c.total} / 40 ${esc(t('rakaat'))}</strong></div></section>`;
  return html;
}

/* ================= Rincian: Tilawah ================= */
function viewTilawah() {
  const d = ui.viewDate;
  const n = dayNum(d);
  const juz = juzFor(n);
  const c = calc(rec(d));
  const sesi = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  let html = `<section class="detail-hero tilawah">${tile('tilawah', 'lg')}<div><h1>${esc(t('tilawah.title'))}</h1><p>One Day One Juz</p></div>
      <div class="big-num">${c.pages}<small>/20 ${esc(t('pagesShort'))}</small></div>
      <p class="juz-line"><strong>${esc(t('juz', { n: juz }))}</strong>${n > 30 ? ` · ${esc(t('round2'))}` : ''} · ${esc(JUZ[juz - 1])}</p>
      <div class="bar"><div style="width:${(c.pages / 20) * 100}%"></div></div></section>
    <section class="card list">
      <div class="list-title row-between"><h2>${esc(t('sessions'))}</h2><span class="hint">${esc(t('tapSession'))}</span></div>
      ${sesi.map((k, i) => {
        const read = Math.max(0, Math.min(4, c.pages - i * 4));
        const st = read >= 4 ? 'done' : read > 0 ? 'part' : 'none';
        return `<button type="button" class="srow sesi" data-action="session" data-n="${i}" aria-pressed="${st === 'done'}"><span class="wk-ico gold">${ic(WAKTU_ICON[k], 20)}</span><span class="tr-body"><strong>${esc(t('afterPrayer', { p: prayerName(k) }))}</strong><span>${esc(t('sessionPages', { a: i * 4 + 1, b: i * 4 + 4, r: read }))}</span></span>${statusMark(st)}</button>`;
      }).join('')}
    </section>
    <section class="card">
      <h2>${esc(t('fineTune'))}</h2>
      <label class="sr" for="pages-range">${esc(t('pagesRead'))}</label>
      <input id="pages-range" type="range" min="0" max="20" step="1" value="${c.pages}" data-action="pages-range">
      <div class="btn-row">
        <button type="button" class="btn ghost" data-action="pages" data-delta="-1" aria-label="${esc(t('minusPage'))}">−1</button>
        <button type="button" class="btn ghost grow" data-action="pages" data-delta="1">${esc(t('plusPage'))}</button>
        <button type="button" class="btn gold grow" data-action="pages" data-delta="4">${esc(t('plusSession'))}</button>
      </div>
    </section>
    ${c.pages >= 20 ? `<section class="banner gold">${ic('tilawah', 22)}<span>${esc(t('juzDoneBanner'))}</span></section>` : ''}`;
  return html;
}

/* ================= Rincian: Sedekah ================= */
function viewSedekah() {
  const d = ui.viewDate;
  const r = rec(d);
  const sd = r.sedekah || { done: false, kinds: [], amount: 0 };
  const kinds = sd.kinds || [];
  return `<section class="detail-hero sedekah">${tile('sedekah', 'lg')}<div><h1>${esc(t('sedekah.title'))}</h1><p>${esc(t('sedekah.sub'))}</p></div></section>
    <button type="button" class="sedekah-main ${sd.done ? 'on' : ''}" data-action="sedekah-toggle" aria-pressed="${!!sd.done}">
      <span class="sd-icon">${sd.done ? ic('check', 22) : ic('sedekah', 22)}</span>
      <span><strong>${esc(sd.done ? t('sedekah.done') : t('sedekah.ask'))}</strong>
      <small>${esc(sd.done ? t('sedekah.undo') : t('sedekah.hint'))}</small></span>
    </button>
    <section class="card">
      <h2>${esc(t('sedekah.kindTitle'))}</h2>
      <div class="kind-grid" role="group" aria-label="${esc(t('sedekah.kindTitle'))}">${SEDEKAH_KINDS.map(([id, icon]) => {
        const on = kinds.includes(id);
        return `<button type="button" class="kind ${on ? 'on' : ''}" data-action="sedekah-kind" data-id="${id}" aria-pressed="${on}">${ic(icon, 24)}<span>${esc(t('k.' + id))}</span></button>`;
      }).join('')}</div>
      <div class="sd-amount">
        <label for="sd-amount"><strong>${esc(t('sedekah.amount'))}</strong> <span class="muted small">${esc(t('sedekah.amountHint'))}</span></label>
        <div class="rp"><span aria-hidden="true">Rp</span><input id="sd-amount" type="text" inputmode="numeric" autocomplete="off" placeholder="0" value="${sd.amount ? Number(sd.amount).toLocaleString(locale()) : ''}" data-action="sedekah-amount"></div>
      </div>
    </section>
    <p class="banner terra">${ic('heart', 20)}<span>${esc(t('sedekah.quote'))}</span></p>`;
}

/* ================= Aplikasi: Perjalanan 40 hari ================= */
function pastDays() {
  const s = state.settings;
  const today = todayYmd();
  const out = [];
  for (let n = 1; n <= 40; n++) {
    const d = addDays(s.startDate, n - 1);
    if (d < today) out.push({ n, d, r: rec(d), c: calc(rec(d)) });
  }
  return out;
}
function viewJourney() {
  const s = state.settings;
  const today = todayYmd();
  const todayN = dayNum(today);
  const past = pastDays();
  const perfect = past.filter((x) => isPerfect(x.c)).length;
  const reached = Math.max(0, Math.min(40, todayN));
  let html = `<section class="page-head">${tile('shalat', 'md', 'journey')}<div><h1>${esc(t('journey.title'))}</h1><p>${esc(t('journey.sub'))}</p></div></section>
  <section class="card"><div class="grid40">`;
  for (let n = 1; n <= 40; n++) {
    const d = addDays(s.startDate, n - 1);
    const c = calc(rec(d));
    let cls = 'future', status = t('st.future'), inner = String(n);
    if (d < today) {
      if (c.targets === 3) { cls = 'perfect'; status = t('st.perfect'); inner = ic('check', 18); }
      else if (c.targets > 0) { cls = 'partial'; status = t('st.partial', { k: c.targets }); }
      else { cls = 'missed'; status = t('st.missed'); }
    } else if (d === today) { cls = 'today'; status = t('st.today'); }
    html += `<button type="button" class="cell ${cls} ${ui.selDay === n ? 'sel' : ''}" data-action="pick-day" data-n="${n}" aria-label="${esc(t('dayN', { n }) + ', ' + status)}">${inner}</button>`;
  }
  html += `</div>
    <div class="legend"><span><i class="perfect"></i>${esc(t('lg.perfect'))}</span><span><i class="partial"></i>${esc(t('lg.partial'))}</span><span><i class="missed"></i>${esc(t('lg.missed'))}</span></div>
    ${ui.selDay ? dayDetail(ui.selDay) : `<p class="hint center">${esc(t('eval.tapDay'))}</p>`}
  </section>
  <section class="card">
    <div class="row-between"><h2>${esc(t('overall'))}</h2><span class="pct-strong">${Math.round((reached / 40) * 100)}%</span></div>
    <p class="muted small">${esc(t('overallSub', { n: reached, p: perfect }))}</p>
    <div class="bar soft thick"><div style="width:${(reached / 40) * 100}%"></div></div>
  </section>`;
  return html;
}
function dayDetail(n) {
  const s = state.settings;
  const today = todayYmd();
  const d = addDays(s.startDate, n - 1);
  const r = rec(d);
  const c = calc(r);
  let body;
  if (d > today) body = t('detail.future', { juz: juzFor(n) }) + (n > 30 ? ` (${t('round2')})` : '');
  else {
    const missed = Object.keys(ITEMS).filter((id) => !r.done[id]).map(itemName);
    body = missed.length ? t('detail.missed', { list: missed.join(', ') }) : t('detail.allPrayers');
    body += ' ' + t('detail.juz', { juz: juzFor(n), p: c.pages });
    if (c.sedekah) {
      const kinds = ((r.sedekah && r.sedekah.kinds) || []).map((k) => t('k.' + k));
      body += ' ' + t('detail.sedekahYes', { kinds: kinds.length ? ` (${kinds.join(', ')})` : '', amount: s.showAmount && c.amount ? `, ${rupiah(c.amount)}` : '' });
    } else body += ' ' + t('detail.sedekahNo');
    if (r.note) body += ` ${t('detail.note')}: “${r.note}”`;
  }
  return `<div class="detail"><strong>${esc(t('dayN', { n }))} · ${esc(fmtShort(d))}${d <= today ? ` · ${c.targets}/3 ${esc(t('targets'))}` : ''}</strong><p>${esc(body)}</p>
    ${d <= today ? `<button type="button" class="btn ghost small-btn" data-action="edit-day" data-date="${d}">${esc(t('detail.edit'))}</button>` : ''}</div>`;
}

/* ================= Aplikasi: Evaluasi & statistik ================= */
function viewEval() {
  const s = state.settings;
  const today = todayYmd();
  const todayN = dayNum(today);
  const past = pastDays();
  const doneDays = Math.max(0, Math.min(40, todayN - 1));
  const pct = (sum, max) => (past.length ? Math.round((sum / (max * past.length)) * 100) : 0);
  const perfect = past.filter((x) => isPerfect(x.c)).length;
  const pShalat = pct(past.reduce((a, x) => a + x.c.total, 0), 40);
  const pT = pct(past.reduce((a, x) => a + Math.min(20, x.c.pages), 0), 20);
  const sedekahDays = past.filter((x) => x.c.sedekah).length;
  const pS = pct(sedekahDays, 1);
  const totalRk = past.reduce((a, x) => a + x.c.total, 0);
  const avg = past.length ? (totalRk / past.length).toLocaleString(locale(), { maximumFractionDigits: 1 }) : '—';
  const juzDone = past.filter((x) => x.c.pages >= 20).length + (calc(rec(today)).pages >= 20 ? 1 : 0);
  const pF = pct(past.reduce((a, x) => a + x.c.f, 0), 17);
  const pR = pct(past.reduce((a, x) => a + x.c.r, 0), 12);
  const pM = pct(past.reduce((a, x) => a + x.c.m, 0), 11);
  const sedekahTotal = past.reduce((a, x) => a + x.c.amount, 0) + calc(rec(today)).amount;

  let html = `<section class="page-head">${tile('shalat', 'md', 'review')}<div><h1>${esc(t('eval.title'))}</h1><p>${esc(todayN > 40 ? t('eval.finished') : t('eval.sub', { done: doneDays, left: Math.max(0, 40 - doneDays) }))}</p></div></section>
  <section class="card eval-ring">
    <div class="ring">${progressRingSVG({ shalat: pShalat / 100, tilawah: pT / 100, sedekah: pS / 100 })}
      <div class="ring-center"><strong>${perfect}</strong><span>${esc(t('perfectDaysShort'))}</span></div></div>
    <div class="pillar-tiles">
      <div class="ptile shalat">${tile('shalat', 'sm')}<strong>${pShalat}%</strong><span>${esc(t('pillar.shalat'))}</span></div>
      <div class="ptile tilawah">${tile('tilawah', 'sm')}<strong>${pT}%</strong><span>${esc(t('pillar.tilawah'))}</span></div>
      <div class="ptile sedekah">${tile('sedekah', 'sm')}<strong>${pS}%</strong><span>${esc(t('pillar.sedekah'))}</span></div>
    </div>
    ${past.length ? '' : `<p class="hint">${esc(t('eval.afterFirst'))}</p>`}
  </section>
  <div class="stats">
    <div class="stat"><span>${esc(t('st.avg'))}</span><strong>${avg}<small> ${esc(t('rakaat'))}</small></strong></div>
    <div class="stat"><span>${esc(t('st.perfectDays'))}</span><strong>${perfect}<small> / ${past.length}</small></strong></div>
    <div class="stat"><span>${esc(t('st.juzDone'))}</span><strong>${juzDone}<small> ${esc(t('juzUnit'))}</small></strong></div>
    <div class="stat"><span>${esc(t('st.sedekahDays'))}</span><strong>${sedekahDays}<small> / ${past.length}</small></strong></div>
  </div>
  <section class="card"><h2>${esc(t('st.byPart'))}</h2>
    ${bar(t('st.fardhu'), pF, 'shalat')}${bar(t('st.rawatib'), pR, 'shalat')}${bar(t('st.night'), pM, 'shalat')}${bar(t('st.tilawah'), pT, 'tilawah')}${bar(t('st.sedekah'), pS, 'sedekah')}
    ${s.showAmount ? `<div class="row-between small sd-total"><span>${esc(t('st.sedekahTotal'))}</span><strong>${rupiah(sedekahTotal)}</strong></div>` : ''}
  </section>`;
  html += insight(past, sedekahDays);

  // Pencapaian
  const ach = [
    ['medal', t('ach.week'), t('ach.weekSub'), doneDays >= 7],
    ['flame', t('ach.streak'), t('ach.streakSub'), streak() >= 10],
    ['tilawah', t('ach.khatam'), t('ach.khatamSub'), juzDone >= 30],
    ['trophy', t('ach.finish'), t('ach.finishSub'), todayN > 40],
  ];
  html += `<section class="card"><h2>${esc(t('ach.title'))}</h2><div class="ach-grid">${ach.map(([icon, title, sub, on]) => `<div class="ach ${on ? 'on' : ''}"><span class="ach-ico">${ic(icon, 24)}</span><strong>${esc(title)}</strong><span>${esc(sub)}</span></div>`).join('')}</div></section>`;
  return html;
}
function bar(label, p, kind) {
  return `<div class="meter"><div class="row-between small"><span>${esc(label)}</span><strong>${p}%</strong></div>
    <div class="track"><div class="${kind}" style="width:${p}%"></div></div></div>`;
}
function insight(past, sedekahDays) {
  if (!past.length) return '';
  const miss = {};
  past.forEach((x) => Object.keys(ITEMS).forEach((id) => { if (!x.r.done[id]) miss[id] = (miss[id] || 0) + 1; }));
  const top = Object.entries(miss).sort((a, b) => b[1] - a[1])[0];
  const tilawahMiss = past.filter((x) => x.c.pages < 20).length;
  const sedekahMiss = past.length - sedekahDays;
  const extra = tilawahMiss ? ' ' + t('ins.juz', { n: tilawahMiss }) : '';
  const card = (title, body, ex = extra) => `<section class="insight">${ic('bulb', 22)}<div><strong>${esc(title)}</strong><p>${esc(body + ex)}</p>
    <button type="button" class="btn amber" data-tab="remind">${esc(t('ins.cta'))}</button></div></section>`;
  if (sedekahMiss > 0 && (!top || sedekahMiss > top[1])) return card(t('ins.sedekahTitle', { n: sedekahMiss }), t('ins.sedekahTip'));
  if (top && top[1] > 0) {
    const id = top[0];
    const it = ITEMS[id];
    let tip = t('ins.tipDefault');
    if (it.kind === 'm') tip = t('ins.tipNight');
    else if (it.label === 'c.after') tip = t('ins.tipAfter');
    else if (it.label === 'c.before') tip = t('ins.tipBefore');
    return card(t('ins.missedTitle', { name: itemName(id), n: top[1] }), tip);
  }
  if (tilawahMiss) return card(t('ins.juzTitle', { n: tilawahMiss }), t('ins.juzTip'), '');
  return `<section class="insight good">${ic('star', 22)}<div><strong>${esc(t('ins.goodTitle'))}</strong><p>${esc(t('ins.goodBody'))}</p></div></section>`;
}


/* ================= Aplikasi: Pengingat ================= */
function viewRemind() {
  const s = state.settings;
  const tm = times(todayYmd());
  const perm = 'Notification' in window ? Notification.permission : 'unsupported';
  const sw = (id, icon, kind, name, desc) => `<div class="srow"><span class="pill-icon sm ${kind}">${ic(icon, 18)}</span><div><strong>${esc(name)}</strong><span>${esc(desc)}</span></div>
    <button type="button" role="switch" class="switch ${s.rem[id] ? 'on' : ''}" aria-checked="${!!s.rem[id]}" aria-label="${esc(name)}" data-action="switch" data-id="${id}"><span></span></button></div>`;
  const timeRow = (id, key, label) => `<div class="srow sub"><label for="${id}"><strong>${esc(label)}</strong></label><input id="${id}" type="time" value="${s[key]}" data-action="settime" data-key="${key}"></div>`;

  let permHtml = '';
  if (perm === 'default') permHtml = `<div class="notice warn">${ic('bell', 20)}<div><strong>${esc(t('rem.permTitle'))}</strong> ${esc(t('rem.permBody'))}<br><button type="button" class="btn primary small-btn" data-action="perm">${esc(t('rem.permBtn'))}</button></div></div>`;
  else if (perm === 'denied') permHtml = `<div class="notice warn">${ic('bell', 20)}<div>${esc(t('rem.permDenied'))}</div></div>`;
  else if (perm === 'unsupported') permHtml = `<div class="notice warn">${ic('bell', 20)}<div>${esc(t('rem.unsupported'))}</div></div>`;

  return `<section class="rem-hero">
      <div class="rem-art" aria-hidden="true"><span class="ra-cal">${ic('today', 40)}</span><span class="ra-bell">${ic('bell', 30)}</span></div>
      <h1>${esc(t('rem.title'))}</h1><p>${esc(t('rem.sub'))}</p></section>
  ${permHtml}
  <section class="card loc">
    <div class="loc-head"><span class="pill-icon sm shalat">${ic('pin', 18)}</span><div><strong>${esc(s.city.startsWith('GPS') ? t('rem.gpsLoc', { c: s.city.slice(4) }) : s.city)}</strong><span class="muted small">${esc(t('rem.method'))}</span></div></div>
    <div class="times">${[['fajr', tm.fajr], ['sunrise', tm.sunrise], ['dhuhr', tm.dhuhr], ['asr', tm.asr], ['maghrib', tm.maghrib], ['isha', tm.isha]].map(([k, m]) => `<div><span>${esc(prayerName(k))}</span><strong>${fmtMin(m)}</strong></div>`).join('')}</div>
    <div class="btn-row">
      <label class="sr" for="city">${esc(t('rem.city'))}</label>
      <select id="city" data-action="city" class="grow">${CITIES.map(([c]) => `<option ${c === s.city ? 'selected' : ''}>${c}</option>`).join('')}${CITIES.some(([c]) => c === s.city) ? '' : `<option selected>${esc(s.city.startsWith('GPS') ? t('rem.gpsLoc', { c: s.city.slice(4) }) : s.city)}</option>`}</select>
      <button type="button" class="btn ghost" data-action="gps">${ic('pin', 18)} GPS</button>
    </div>
  </section>

  <h3 class="group">${esc(t('rem.gShalat'))}</h3>
  <section class="card list">
    ${sw('adzan', 'bell', 'shalat', t('rem.adzan'), t('rem.adzanDesc'))}
    ${sw('badiyah', 'shalat', 'shalat', t('rem.badiyah'), t('rem.badiyahDesc'))}
    ${sw('susul', 'check', 'shalat', t('rem.susul'), t('rem.susulDesc'))}
    ${sw('tahajud', 'tahajud', 'shalat', t('rem.tahajud'), t('rem.tahajudDesc', { time: fmtMin(tm.fajr - s.tahajudOffset), n: s.tahajudOffset }))}
    <div class="srow sub"><label for="tOff"><strong>${esc(t('rem.tahajudOffset'))}</strong></label><input id="tOff" type="number" min="10" max="240" step="5" value="${s.tahajudOffset}" data-action="setnum" data-key="tahajudOffset"></div>
    ${sw('witir', 'witir', 'shalat', t('rem.witir'), t('rem.witirDesc'))}
    ${timeRow('wT', 'witirTime', t('rem.witirTime'))}
  </section>

  <h3 class="group">${esc(t('rem.gTilawah'))}</h3>
  <section class="card list">
    ${sw('tilawah', 'tilawah', 'tilawah', t('rem.tilawah'), t('rem.tilawahDesc'))}
    ${sw('sisa', 'tilawah', 'tilawah', t('rem.sisa'), t('rem.sisaDesc'))}
    ${timeRow('sT', 'sisaTime', t('rem.sisaTime'))}
    ${sw('ringkasan', 'review', 'tilawah', t('rem.summary'), t('rem.summaryDesc'))}
    ${timeRow('rT', 'ringkasanTime', t('rem.summaryTime'))}
  </section>

  <h3 class="group">${esc(t('rem.gSedekah'))}</h3>
  <section class="card list">
    ${sw('sedekah', 'sedekah', 'sedekah', t('rem.sedekah'), t('rem.sedekahDesc'))}
    ${timeRow('sdT', 'sedekahTime', t('rem.sedekahTime'))}
  </section>

  <section class="card">
    <h2 class="h-ico">${ic('calendarPlus', 18)} ${esc(t('rem.closedTitle'))}</h2>
    <p class="muted small">${esc(t('rem.closedBody'))}</p>
    <div class="btn-row"><button type="button" class="btn primary grow" data-action="ics">${esc(t('rem.ics'))}</button>
    <button type="button" class="btn ghost" data-action="test">${esc(t('rem.test'))}</button></div>
  </section>`;
}

/* ================= Aplikasi: Profil ================= */
function viewProfile() {
  const s = state.settings;
  const p = state.profile || { provider: 'guest' };
  const isGoogle = p.provider === 'google';
  const seg = (action, val, opts) => `<div class="seg" role="group">${opts.map(([v, label]) => `<button type="button" data-action="${action}" data-${action === 'lang' ? 'lang' : 'id'}="${v}" aria-pressed="${val === v}" class="${val === v ? 'on' : ''}">${esc(label)}</button>`).join('')}</div>`;
  return `<section class="card profile-card">
      ${avatar(64)}
      <div class="pc-body">
        ${isGoogle ? `<strong>${esc(p.name || '')}</strong><span>${esc(p.email || '')}</span><span class="badge ok">${googleG} ${esc(t('prof.google'))}</span>`
          : `<label for="nick" class="small muted">${esc(t('prof.nick'))}</label><input id="nick" type="text" maxlength="40" value="${esc(p.name || '')}" placeholder="${esc(t('prof.nickPh'))}" data-action="nick"><span class="muted small">${esc(t('prof.guest'))}</span>`}
      </div>
    </section>
    ${isGoogle ? `<button type="button" class="btn ghost wide" data-action="logout">${ic('logout', 18)} ${esc(t('prof.logout'))}</button>`
      : `<section class="card"><h2>${esc(t('prof.linkTitle'))}</h2><p class="muted small">${esc(t('prof.linkBody'))}</p>${googleButton()}</section>`}

    ${syncCard()}
    <h3 class="group">${esc(t('prof.gPref'))}</h3>
    <section class="card list">
      <div class="srow"><span class="pill-icon sm shalat">${ic('globe', 18)}</span><div><strong>${esc(t('prof.lang'))}</strong><span>${esc(t('prof.langDesc'))}</span></div>${seg('lang', L(), [['id', 'ID'], ['en', 'EN']])}</div>
      <div class="srow"><span class="pill-icon sm shalat">${ic('moon', 18)}</span><div><strong>${esc(t('prof.theme'))}</strong></div>${seg('theme', s.theme, [['auto', t('prof.auto')], ['light', t('prof.light')], ['dark', t('prof.dark')]])}</div>
      <div class="srow"><span class="pill-icon sm sedekah">${ic('eye', 18)}</span><div><strong>${esc(t('prof.showAmount'))}</strong><span>${esc(t('prof.showAmountDesc'))}</span></div>
        <button type="button" role="switch" class="switch ${s.showAmount ? 'on' : ''}" aria-checked="${!!s.showAmount}" aria-label="${esc(t('prof.showAmount'))}" data-action="show-amount"><span></span></button></div>
    </section>

    <h3 class="group">${esc(t('prof.gChallenge'))}</h3>
    <section class="card list">
      <div class="srow"><span class="pill-icon sm tilawah">${ic('today', 18)}</span><label for="start"><strong>${esc(t('prof.start'))}</strong><span>${esc(t('prof.startDesc'))}</span></label>
        <input id="start" type="date" value="${s.startDate}" data-action="start"></div>
    </section>

    <h3 class="group">${esc(t('prof.gData'))}</h3>
    <section class="card list">
      <div class="srow"><span class="pill-icon sm shalat">${ic('download', 18)}</span><div><strong>${esc(t('prof.backup'))}</strong><span>${esc(t('prof.backupDesc'))}</span></div><button type="button" class="btn ghost small-btn" data-action="export">${esc(t('prof.backupBtn'))}</button></div>
      <div class="srow"><span class="pill-icon sm shalat">${ic('upload', 18)}</span><div><strong>${esc(t('prof.restore'))}</strong><span>${esc(t('prof.restoreDesc'))}</span></div><label class="btn ghost small-btn">${esc(t('prof.restoreBtn'))}<input type="file" accept="application/json" data-action="import" hidden></label></div>
      <div class="srow"><span class="pill-icon sm danger">${ic('trash', 18)}</span><div><strong>${esc(t('prof.reset'))}</strong><span>${esc(t('prof.resetDesc'))}</span></div><button type="button" class="btn danger small-btn" data-action="reset">${esc(t('prof.resetBtn'))}</button></div>
    </section>

    <button type="button" class="about" data-action="about">${logo(44, { rounded: true })}<div><strong>${esc(t('prof.about'))}</strong><span>${esc(t('prof.aboutDesc'))}</span></div>${ic('chevron', 18)}</button>
    <p class="muted small center">Istiqamah 40 · v${APP_VERSION} · <a href="privacy.html">${esc(t('prof.privacy'))}</a></p>`;
}

function syncCard() {
  if (!window.Sync || !Sync.enabled()) return '';
  const st = Sync.status;
  const p = state.profile || {};
  if (!Sync.signedIn) {
    return `<section class="card sync-card">
      <div class="row-between"><h2 class="h-ico">${ic('cloud', 18)} ${esc(t('sync.title'))}</h2><span class="badge">${esc(t('sync.off'))}</span></div>
      <p class="muted small">${esc(t(p.provider === 'google' ? 'sync.descReconnect' : 'sync.descOff'))}</p>
      ${p.provider === 'google' ? googleButton() : ''}
      ${st.state === 'error' && st.error ? `<p class="sync-err">${esc(st.error)}</p>` : ''}
    </section>`;
  }
  let line, cls = 'ok';
  if (st.state === 'syncing') { line = t('sync.syncing'); cls = ''; }
  else if (st.state === 'error') { line = t('sync.error'); cls = 'err'; }
  else if (st.state === 'offline' || !navigator.onLine) { line = t('sync.offline'); cls = ''; }
  else if (Sync.lastSync) line = t('sync.last', { time: new Intl.DateTimeFormat(locale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(Sync.lastSync)) });
  else { line = t('sync.never'); cls = ''; }
  return `<section class="card sync-card">
    <div class="row-between"><h2 class="h-ico">${ic('cloud', 18)} ${esc(t('sync.title'))}</h2><span class="badge ${cls === 'ok' ? 'ok' : ''}">${esc(t('sync.on'))}</span></div>
    <p class="small sync-line ${cls}">${esc(line)}</p>
    ${st.state === 'error' && st.error ? `<p class="sync-err">${esc(st.error)}</p>` : ''}
    <p class="muted small">${esc(t('sync.descOn', { email: Sync.email }))}</p>
    <button type="button" class="btn ghost small-btn" data-action="sync-now" ${st.state === 'syncing' ? 'disabled' : ''}>${ic('cloud', 16)} ${esc(t('sync.now'))}</button>
  </section>`;
}

/* ================= Kerangka aplikasi ================= */
const TABS = [['home', 'home', 'nav.home'], ['journey', 'journey', 'nav.journey'], ['eval', 'review', 'nav.eval'], ['remind', 'bell', 'nav.remind'], ['profile', 'user', 'nav.profile']];
function viewApp() {
  let body, bar;
  if (ui.tab === 'home' && ui.sub) {
    body = ui.sub === 'shalat' ? viewShalat() : ui.sub === 'tilawah' ? viewTilawah() : viewSedekah();
    bar = subBar(t(ui.sub === 'shalat' ? 'pillar.shalat' : ui.sub === 'tilawah' ? 'pillar.tilawah' : 'pillar.sedekah'));
  } else {
    if (ui.tab === 'home') body = viewHome();
    else if (ui.tab === 'journey') body = viewJourney();
    else if (ui.tab === 'eval') body = viewEval();
    else if (ui.tab === 'remind') body = viewRemind();
    else body = viewProfile();
    bar = `<header class="appbar">
      <button type="button" class="brand" data-tab="home" aria-label="Istiqamah 40">${logo(34, { rounded: true })}<span>Istiqamah 40</span></button>
      <button type="button" class="icon-btn" data-tab="remind" aria-label="${esc(t('nav.remind'))}">${ic('bell', 22)}</button>
      <button type="button" class="avatar-btn" data-tab="profile" aria-label="${esc(t('nav.profile'))}">${avatar(34)}</button>
    </header>`;
  }
  return `${bar}<main id="view" tabindex="-1">${body}</main>
    <nav class="tabbar" aria-label="${esc(t('nav.label'))}">${TABS.map(([id, icon, key]) => `<a href="#${id}" data-tab="${id}" class="${ui.tab === id ? 'active' : ''}" ${ui.tab === id ? 'aria-current="page"' : ''}><span class="tab-ico">${ic(icon, 22)}</span><span class="tab-lbl">${esc(t(key))}</span></a>`).join('')}</nav>`;
}


/* ================= Render ================= */
function focusKey(el) {
  if (!el || !el.dataset) return null;
  const d = el.dataset;
  if (!d.action && !d.tab) return null;
  return [d.action || '', d.tab || '', d.id || '', d.delta || '', d.n || '', d.lang || ''].join('|');
}
function render() {
  if (!ui.screen) ui.screen = !state.profile ? 'cover' : !state.settings.startDate ? 'setup' : 'app';
  applyTheme();
  const root = $('#root');
  const fk = focusKey(document.activeElement);
  root.className = 'screen-' + ui.screen;
  if (ui.screen === 'cover') root.innerHTML = viewCover();
  else if (ui.screen === 'register') root.innerHTML = viewRegister();
  else if (ui.screen === 'setup') root.innerHTML = viewSetup();
  else root.innerHTML = viewApp();
  const note = $('#note');
  if (note) note.value = rec(ui.viewDate).note || '';
  if (fk) {
    const el = [...root.querySelectorAll('[data-action],[data-tab]')].find((x) => focusKey(x) === fk);
    if (el) el.focus({ preventScroll: true });
  }
  if ($('#gsi-btn')) mountGoogleButton();
}
function go(screen) { ui.screen = screen; render(); window.scrollTo(0, 0); }
function setTab(tab) {
  ui.screen = 'app';
  ui.tab = tab;
  ui.sub = null;
  if (tab !== 'home') ui.viewDate = todayYmd();
  render();
  window.scrollTo(0, 0);
}

let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}
function modal(title, body) {
  const dlg = $('#modal');
  $('#modal-title').textContent = title;
  $('#modal-body').textContent = body;
  $('#modal-ok').textContent = t('ok');
  dlg.showModal();
}

/* ================= Google Sign-In ================= */
let gsiLoading = null;
function loadGsi() {
  if (window.google && google.accounts && google.accounts.id) return Promise.resolve();
  if (!gsiLoading) {
    gsiLoading = new Promise((res, rej) => {
      const sc = document.createElement('script');
      sc.src = 'https://accounts.google.com/gsi/client';
      sc.async = true; sc.onload = res; sc.onerror = rej;
      document.head.appendChild(sc);
    });
  }
  return gsiLoading;
}
let gsiInited = false;
function mountGoogleButton() {
  const holder = $('#gsi-btn');
  loadGsi().then(async () => {
    if (!gsiInited) {
      const nonce = window.Sync ? await Sync.nonceForGoogle() : undefined;
      const opts = { client_id: APP_CONFIG.googleClientId, callback: onGoogleCredential, auto_select: false, ux_mode: 'popup' };
      if (nonce) opts.nonce = nonce;
      google.accounts.id.initialize(opts);
      gsiInited = true;
    }
    if (!document.body.contains(holder)) return;
    holder.innerHTML = '';
    google.accounts.id.renderButton(holder, {
      type: 'standard', theme: document.documentElement.dataset.theme === 'dark' ? 'filled_black' : 'outline',
      size: 'large', shape: 'pill', text: 'continue_with', logo_alignment: 'left', locale: L(),
      width: Math.min(400, holder.clientWidth || 320),
    });
  }).catch(() => { holder.innerHTML = `<p class="hint">${esc(t('reg.googleOffline'))}</p>`; });
}
function decodeJwt(token) {
  const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(part.padEnd(part.length + ((4 - (part.length % 4)) % 4), '='));
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (ch) => ch.charCodeAt(0))));
}
async function onGoogleCredential(resp) {
  let p;
  try { p = decodeJwt(resp.credential); } catch (e) { toast(t('toast.signInFail')); return; }
  state.profile = { provider: 'google', name: p.name || p.given_name || '', email: p.email || '', picture: p.picture || '', sub: p.sub };
  save();
  toast(t('toast.signedIn', { name: (p.given_name || p.name || '').trim() }));
  if (window.Sync && Sync.enabled()) {
    // Tarik data akun dulu, agar di HP kedua tanggal mulai & catatan lama langsung terpakai
    const ok = await Promise.race([Sync.signInWithGoogle(resp.credential), new Promise((r) => setTimeout(() => r(null), 12000))]);
    if (ok === false) toast(t('toast.syncFail'));
    else if (ok) toast(t('toast.synced'));
  }
  if (ui.screen === 'register') go(state.settings.startDate ? 'app' : 'setup');
  else render();
}

/* ================= Aksi ================= */
document.addEventListener('click', async (e) => {
  const tabEl = e.target.closest('[data-tab]');
  if (tabEl) { e.preventDefault(); setTab(tabEl.dataset.tab); return; }
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const a = el.dataset.action;
  const s = state.settings;

  switch (a) {
    case 'lang':
      s.lang = el.dataset.lang; save(); render(); break;
    case 'theme':
      s.theme = el.dataset.id; save(); render(); break;
    case 'cover-start':
      go(state.profile ? (s.startDate ? 'app' : 'setup') : 'register'); break;
    case 'cover-back':
      ui.coverFrom = null; go('app'); break;
    case 'to-cover':
      go('cover'); break;
    case 'about':
      ui.coverFrom = 'app'; go('cover'); break;
    case 'guest':
      state.profile = { provider: 'guest', name: '' }; save(); go(s.startDate ? 'app' : 'setup'); break;
    case 'google-unconfigured':
      modal(t('reg.googleTitle'), t('reg.googleBody')); break;
    case 'logout':
      if (confirm(t('prof.logoutConfirm'))) {
        if (window.google && google.accounts && google.accounts.id) google.accounts.id.disableAutoSelect();
        if (window.Sync) await Sync.signOut();
        state.profile = { provider: 'guest', name: '' }; save(); render(); toast(t('toast.signedOut'));
      }
      break;
    case 'toggle': {
      const r = ensureRec(ui.viewDate);
      r.done[el.dataset.id] = !r.done[el.dataset.id];
      save(); render();
      const c = calc(r);
      if (r.done[el.dataset.id] && c.total === 40) toast(c.targets === 3 ? t('toast.perfect') : t('toast.40'));
      break;
    }
    case 'pages': {
      const r = ensureRec(ui.viewDate);
      const before = r.pages || 0;
      r.pages = Math.max(0, Math.min(20, before + Number(el.dataset.delta)));
      save(); render();
      if (r.pages === 20 && before < 20) toast(t('toast.juz', { n: juzFor(dayNum(ui.viewDate)) }));
      break;
    }
    case 'sedekah-toggle': {
      const sd = ensureSedekah(ui.viewDate);
      sd.done = !sd.done;
      if (!sd.done) { sd.kinds = []; sd.amount = 0; }
      save(); render();
      if (sd.done) toast(calc(rec(ui.viewDate)).targets === 3 ? t('toast.perfect') : t('toast.sedekah'));
      break;
    }
    case 'sedekah-kind': {
      const sd = ensureSedekah(ui.viewDate);
      const id = el.dataset.id;
      const was = sd.done;
      sd.kinds = sd.kinds.includes(id) ? sd.kinds.filter((k) => k !== id) : [...sd.kinds, id];
      if (sd.kinds.length) sd.done = true;
      save(); render();
      if (!was && sd.done) toast(t('toast.sedekah'));
      break;
    }
    case 'go-today':
      ui.viewDate = todayYmd(); ui.sub = null; render(); break;
    case 'open-sub':
      ui.tab = 'home'; ui.sub = el.dataset.id; render(); window.scrollTo(0, 0); break;
    case 'sub-back':
      ui.sub = null; render(); window.scrollTo(0, 0); break;
    case 'session': {
      const r = ensureRec(ui.viewDate);
      const i = Number(el.dataset.n);
      const before = r.pages || 0;
      r.pages = before >= (i + 1) * 4 ? i * 4 : (i + 1) * 4;
      save(); render();
      if (r.pages === 20 && before < 20) toast(t('toast.juz', { n: juzFor(dayNum(ui.viewDate)) }));
      break;
    }
    case 'start-today':
    case 'restart':
      s.startDate = todayYmd(); save(); render(); toast(t('toast.restart')); break;
    case 'eval-tab':
      ui.evalTab = el.dataset.id; render(); break;
    case 'pick-day': {
      const n = Number(el.dataset.n);
      ui.selDay = ui.selDay === n ? null : n; render(); break;
    }
    case 'edit-day':
      ui.viewDate = el.dataset.date; ui.tab = 'home'; ui.sub = null; render(); window.scrollTo(0, 0); break;
    case 'switch':
      s.rem[el.dataset.id] = !s.rem[el.dataset.id]; save(); render(); break;
    case 'show-amount':
      s.showAmount = !s.showAmount; save(); render(); break;
    case 'perm':
      await Notification.requestPermission(); render(); break;
    case 'test':
      if (await ensurePermission()) notify(t('n.testTitle'), t('n.testBody'), 'test-' + Date.now());
      break;
    case 'gps':
      if (!navigator.geolocation) { toast(t('toast.noGps')); break; }
      toast(t('toast.locating'));
      navigator.geolocation.getCurrentPosition((pos) => {
        s.lat = +pos.coords.latitude.toFixed(4); s.lng = +pos.coords.longitude.toFixed(4);
        s.city = `GPS ${s.lat}, ${s.lng}`;
        save(); render(); toast(t('toast.located'));
      }, () => toast(t('toast.gpsDenied')), { timeout: 15000 });
      break;
    case 'ics':
      downloadIcs(); break;
    case 'export':
      download(`istiqamah40-backup-${todayYmd()}.json`, JSON.stringify(state, null, 2), 'application/json'); break;
    case 'reset': {
      const cloud = window.Sync && Sync.signedIn;
      if (confirm(t(cloud ? 'prof.resetConfirmCloud' : 'prof.resetConfirm'))) {
        if (cloud) {
          try { await Sync.deleteCloudData(); } catch (err) { toast(t('toast.syncFail')); break; }
          await Sync.signOut();
        }
        localStorage.removeItem(STORE_KEY); localStorage.removeItem(FIRED_KEY);
        const lang = s.lang;
        state = load(); state.settings.lang = lang; lastSettingsSnap = settingsSnap();
        ui.viewDate = todayYmd(); ui.tab = 'home'; ui.sub = null; ui.screen = 'cover'; render();
      }
      break;
    }
    case 'sync-now':
      if (window.Sync) { Sync.syncNow(); render(); }
      break;
    default:
  }
});

document.addEventListener('input', (e) => {
  const el = e.target;
  const a = el.dataset.action;
  if (a === 'pages-range') {
    const r = ensureRec(ui.viewDate);
    r.pages = Number(el.value);
    save();
    const p = $('.detail-hero .big-num');
    if (p) p.innerHTML = `${r.pages}<small>/20 ${esc(t('pagesShort'))}</small>`;
  } else if (a === 'note') {
    ensureRec(ui.viewDate).note = el.value.slice(0, 2000); save();
  } else if (a === 'nick') {
    state.profile = { ...(state.profile || { provider: 'guest' }), name: el.value.slice(0, 40) }; save();
  }
});

document.addEventListener('change', (e) => {
  const el = e.target;
  const a = el.dataset.action;
  const s = state.settings;
  if (a === 'pages-range') render();
  else if (a === 'nick') render();
  else if (a === 'city') {
    const c = CITIES.find(([n]) => n === el.value);
    if (c) { [s.city, s.lat, s.lng] = c; save(); render(); }
  } else if (a === 'setnum') {
    s[el.dataset.key] = Math.max(10, Math.min(240, Number(el.value) || 50)); save(); render();
  } else if (a === 'settime') {
    if (el.value) { s[el.dataset.key] = el.value; save(); }
  } else if (a === 'start') {
    if (el.value) { s.startDate = el.value; ui.selDay = null; save(); toast(t('toast.startChanged')); }
  } else if (a === 'sedekah-amount') {
    const v = Number(String(el.value).replace(/\D/g, '').slice(0, 12)) || 0;
    const sd = ensureSedekah(ui.viewDate);
    const was = sd.done;
    sd.amount = v;
    if (v > 0) { sd.done = true; if (!sd.kinds.includes('uang')) sd.kinds.push('uang'); }
    save(); render();
    if (!was && sd.done) toast(t('toast.sedekah'));
  } else if (a === 'import') {
    const f = el.files && el.files[0];
    if (!f) return;
    f.text().then((txt) => {
      const data = JSON.parse(txt);
      if (!data.settings || !data.days) throw new Error('format');
      localStorage.setItem(STORE_KEY, JSON.stringify(data));
      state = load();
      // Data pulihan dianggap perubahan terbaru agar ikut terkirim ke cloud
      const now = Date.now();
      Object.keys(state.days).forEach((d) => { state.days[d].u = now; if (window.Sync) Sync.markDay(d); });
      state.settings.u = now; if (window.Sync) Sync.markSettings();
      lastSettingsSnap = settingsSnap(); saveLocal(); if (window.Sync) Sync.schedule(300);
      ui.screen = null; render(); toast(t('toast.restored'));
    }).catch(() => toast(t('toast.badBackup')));
  }
});

document.addEventListener('submit', async (e) => {
  if (e.target.id !== 'setup-form') return;
  e.preventDefault();
  const s = state.settings;
  s.startDate = $('#su-start').value || todayYmd();
  const c = CITIES.find(([n]) => n === $('#su-city').value);
  if (c) [s.city, s.lat, s.lng] = c;
  const wantNotif = $('#su-notif').checked;
  save();
  ui.tab = 'home'; ui.sub = null; ui.viewDate = todayYmd();
  go('app');
  toast(t('toast.bismillah'));
  if (wantNotif && 'Notification' in window && Notification.permission === 'default') { await Notification.requestPermission(); render(); }
});

function download(name, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ================= Kalender (.ics) ================= */
function downloadIcs() {
  const s = state.settings;
  const icsDate = (d, min) => {
    const dt = parseYmd(d); dt.setMinutes(min);
    return `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}T${pad(dt.getUTCHours())}${pad(dt.getUTCMinutes())}00Z`;
  };
  const now = new Date();
  const stamp = icsDate(todayYmd(), now.getHours() * 60 + now.getMinutes());
  const icsText = (x) => String(x).replace(/[\\;,]/g, (m) => '\\' + m);
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Istiqamah40//' + L().toUpperCase(), 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:Istiqamah 40'];
  const ev = (d, min, title, desc, uid) => {
    lines.push('BEGIN:VEVENT', `UID:${uid}@istiqamah40`, `DTSTAMP:${stamp}`, `DTSTART:${icsDate(d, min)}`, `DTEND:${icsDate(d, min + 10)}`,
      `SUMMARY:${icsText(title)}`, `DESCRIPTION:${icsText(desc)}`, 'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsText(title)}`, 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT');
  };
  const from = s.startDate < todayYmd() ? todayYmd() : s.startDate;
  for (let n = dayNum(from); n <= 40; n++) {
    const d = addDays(s.startDate, n - 1);
    const tm = times(d);
    const juz = juzFor(n);
    const day = t('dayN', { n });
    if (s.rem.tahajud) ev(d, tm.tahajud, `${t('ics.tahajud')} · ${day}`, t('ics.tahajudDesc'), `th-${d}`);
    if (s.rem.sedekah) ev(d, hhmmToMin(s.sedekahTime), `${t('pillar.sedekah')} · ${day}`, t('n.sedekahBody'), `sd-${d}`);
    ev(d, tm.fajr, `${prayerName('fajr')} · ${day}`, t('ics.fajr', { juz }), `sf-${d}`);
    ev(d, tm.dhuhr, `${prayerName('dhuhr')} · ${day}`, t('ics.dhuhr'), `df-${d}`);
    ev(d, tm.asr, `${prayerName('asr')} · ${day}`, t('ics.asr'), `af-${d}`);
    ev(d, tm.maghrib, `${prayerName('maghrib')} · ${day}`, t('ics.maghrib'), `mf-${d}`);
    ev(d, tm.isha, `${prayerName('isha')} · ${day}`, t('ics.isha'), `if-${d}`);
  }
  lines.push('END:VCALENDAR');
  download('istiqamah40-schedule.ics', lines.join('\r\n'), 'text/calendar');
  toast(t('toast.ics'));
}

/* ================= Notifikasi ================= */
async function ensurePermission() {
  if (!('Notification' in window)) { toast(t('toast.noNotif')); return false; }
  if (Notification.permission === 'default') await Notification.requestPermission();
  if (Notification.permission !== 'granted') { toast(t('toast.notifDenied')); return false; }
  return true;
}
async function notify(title, body, tag) {
  try {
    const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : null;
    const opts = { body, tag, icon: 'icons/icon-192.png', badge: 'icons/badge-96.png', vibrate: [200, 100, 200], lang: L() };
    if (reg) await reg.showNotification(title, opts); else new Notification(title, opts);
  } catch (e) { /* abaikan */ }
}
function eventsFor(d) {
  const s = state.settings;
  const tm = times(d);
  const ev = [];
  const fardhu = [['fajr', 'sf', true], ['dhuhr', 'df', true], ['asr', 'af'], ['maghrib', 'mf'], ['isha', 'if']];
  const badiyah = { dhuhr: 'db', maghrib: 'mb', isha: 'ib' };
  fardhu.forEach(([k, fid, hasBefore], i) => {
    const m = tm[k];
    const name = prayerName(k);
    if (s.rem.adzan) ev.push({ key: `adzan-${fid}`, min: m, title: t('n.adzanTitle', { p: name }), bodyFn: () => t('n.adzanBody', { left: 40 - calc(rec(d)).total }) + (hasBefore ? ' ' + t('n.adzanBefore') : '') });
    if (s.rem.badiyah && badiyah[k]) ev.push({ key: `bd-${k}`, min: m + 20, title: t('n.afterTitle', { p: name }), bodyFn: () => t('n.afterBody'), skip: () => rec(d).done[badiyah[k]] });
    if (s.rem.susul) ev.push({ key: `susul-${fid}`, min: m + 30, title: t('n.unloggedTitle', { p: name }), bodyFn: () => t('n.unloggedBody'), skip: () => rec(d).done[fid] });
    if (s.rem.tilawah) ev.push({ key: `til-${i}`, min: m + 25, title: t('n.tilawahTitle'), bodyFn: () => t('n.tilawahBody', { a: i * 4 + 1, b: i * 4 + 4, juz: juzFor(dayNum(d)) }), skip: () => rec(d).pages >= (i + 1) * 4 });
  });
  if (s.rem.tahajud) ev.push({ key: 'tahajud', min: tm.tahajud, title: t('n.tahajudTitle'), bodyFn: () => t('n.tahajudBody'), skip: () => rec(d).done.th });
  if (s.rem.witir) ev.push({ key: 'witir', min: hhmmToMin(s.witirTime), title: t('n.witirTitle'), bodyFn: () => t('n.witirBody'), skip: () => rec(d).done.wi });
  if (s.rem.sisa) ev.push({ key: 'sisa', min: hhmmToMin(s.sisaTime), title: t('n.leftTitle'), bodyFn: () => t('n.leftBody', { n: 20 - (rec(d).pages || 0) }), skip: () => rec(d).pages >= 20 });
  if (s.rem.sedekah) ev.push({ key: 'sedekah', min: hhmmToMin(s.sedekahTime), title: t('n.sedekahTitle'), bodyFn: () => t('n.sedekahBody'), skip: () => calc(rec(d)).sedekah });
  if (s.rem.ringkasan) ev.push({ key: 'ringkasan', min: hhmmToMin(s.ringkasanTime), title: t('n.summaryTitle'), bodyFn: () => { const x = calc(rec(d)); return t('n.summaryBody', { rk: x.total, p: x.pages, sd: x.sedekah ? t('done').toLowerCase() : t('notYet') }); } });
  return ev;
}
let lastCheck = null;
function checkReminders() {
  if (ui.screen !== 'app' || !state.settings.startDate || !('Notification' in window) || Notification.permission !== 'granted') return;
  const now = new Date();
  const d = ymd(now);
  const n = dayNum(d);
  if (n < 1 || n > 40) return;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const from = lastCheck && lastCheck.d === d ? lastCheck.min : nowMin - 10; // jangan kirim notifikasi lama
  let fired = {};
  try { fired = JSON.parse(localStorage.getItem(FIRED_KEY)) || {}; } catch (e) { fired = {}; }
  if (fired.d !== d) fired = { d, k: {} };
  for (const ev of eventsFor(d)) {
    if (ev.min > from && ev.min <= nowMin && !fired.k[ev.key]) {
      fired.k[ev.key] = 1;
      if (ev.skip && ev.skip()) continue;
      notify(ev.title, ev.bodyFn(), `${d}-${ev.key}`);
    }
  }
  try { localStorage.setItem(FIRED_KEY, JSON.stringify(fired)); } catch (e) { /* abaikan */ }
  lastCheck = { d, min: nowMin };
}

/* ================= Mulai ================= */
const HASH_TAB = { '#home': 'home', '#journey': 'journey', '#eval': 'eval', '#remind': 'remind', '#profile': 'profile' };
if (HASH_TAB[location.hash]) ui.tab = HASH_TAB[location.hash];
render();
if (window.Sync) Sync.init().then(() => { if (ui.tab === 'profile') render(); });
let lastDay = todayYmd();
setInterval(() => {
  checkReminders();
  const d = todayYmd();
  if (d !== lastDay) {
    if (ui.viewDate === lastDay) ui.viewDate = d;
    lastDay = d;
    render();
  } else {
    const box = $('#next-notice');
    if (box) box.innerHTML = nextNoticeText(nextEvent());
  }
}, 30000);
checkReminders();
document.addEventListener('visibilitychange', () => {
  if (document.hidden) return;
  checkReminders();
  if (window.Sync) Sync.schedule(200);
  if (ui.tab !== 'home') ui.viewDate = todayYmd();
  if (!document.activeElement?.matches('textarea,input')) render();
});
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
