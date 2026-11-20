/* Ikon (outline 24×24, stroke 2, ujung membulat) dan logo Lingkar Istiqamah */
'use strict';

const svgWrap = (body, size = 22, extra = '') =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${body}</svg>`;

const ICON_PATHS = {
  // — dari icon pack Istiqamah 40 —
  today: '<rect x="3" y="4.5" width="18" height="17" rx="2.5"/><path d="M7 2.5v4M17 2.5v4M3 9h18"/><path d="m8.5 14 2.2 2.2 4.8-4.8"/>',
  review: '<path d="M3 20.5h18"/><rect x="4" y="12" width="3.5" height="8.5" rx="1"/><rect x="10.25" y="8" width="3.5" height="12.5" rx="1"/><rect x="16.5" y="3.5" width="3.5" height="17" rx="1"/>',
  bell: '<path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
  tahajud: '<path d="M17.8 3.2a8.4 8.4 0 1 0 3 15.9A9 9 0 0 1 17.8 3.2Z"/><path d="m18.5 5 .6 1.5 1.6.1-1.2 1 .4 1.6-1.4-.9-1.3.9.4-1.6-1.2-1 1.6-.1.5-1.5Z"/>',
  witir: '<path d="M17.5 3.2a8.3 8.3 0 1 0 3.2 15.7A9 9 0 0 1 17.5 3.2Z"/><circle cx="18.2" cy="5.2" r=".7"/><circle cx="20.5" cy="8.2" r=".7"/><circle cx="17.2" cy="9.2" r=".7"/>',
  tilawah: '<path d="M12 6.2C9.7 4.5 6.5 4 3 4.8v14c3.5-.8 6.7-.3 9 1.4 2.3-1.7 5.5-2.2 9-1.4v-14c-3.5-.8-6.7-.3-9 1.4Z"/><path d="M12 6.2v14M6 8.5c1.5-.2 3 .1 4.2.8M18 8.5c-1.5-.2-3 .1-4.2.8M6 12c1.5-.2 3 .1 4.2.8M18 12c-1.5-.2-3 .1-4.2.8"/>',
  sedekah: '<path d="M3 13.5h4l2.2 2h4.3l2.2-2.1a1.5 1.5 0 0 0-2.1-2.1l-1.4 1.1H9.5"/><path d="m3 13.5 4.5 6h8.1l5.4-5.2a1.7 1.7 0 0 0-2.4-2.4l-2.1 1.5"/><path d="M12 3.5c-1.7-1.8-4.7-.7-4.7 1.6 0 2.4 4.7 5.1 4.7 5.1s4.7-2.7 4.7-5.1c0-2.3-3-3.4-4.7-1.6Z"/>',
  // — set ikon lampiran (navigasi, waktu shalat, sedekah, progres) —
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9v11.5h5v-6h4v6h5V9"/>',
  journey: '<rect x="3" y="4.5" width="18" height="17" rx="2.5"/><path d="M7 2.5v4M17 2.5v4M3 9h18"/><path d="M7.5 13h.01M12 13h.01M16.5 13h.01M7.5 17h.01M12 17h.01M16.5 17h.01"/>',
  fardhu: '<rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M8.5 18v-6.5a3.5 3.5 0 0 1 7 0V18Z"/>',
  rawatib: '<path d="m12 3 9 5-9 5-9-5Z"/><path d="m3 12.5 9 5 9-5"/><path d="m3 17 9 5 9-5"/>',
  subuh: '<path d="M3 18h18M7 18a5 5 0 0 1 10 0"/><path d="M12 10V5M9.5 7.5 12 5l2.5 2.5M4.5 12.5l1.5 1M19.5 12.5l-1.5 1M3 21.5h18"/>',
  dzuhur: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  ashar: '<path d="M8 2.5V4M2.5 8H4M4.1 4.1l1 1M11.9 4.1l-1 1"/><path d="M5 11a3.5 3.5 0 1 1 6.6-1.6"/><path d="M8.5 20.5h9a3.5 3.5 0 0 0 .3-7 5 5 0 0 0-9.6 1.6 2.7 2.7 0 0 0 .3 5.4Z"/>',
  maghrib: '<path d="M3 17h18M7 17a5 5 0 0 1 10 0"/><path d="M12 4v5M9.5 6.5 12 9l2.5-2.5M4.5 11.5l1.5 1M19.5 11.5l-1.5 1M6 21h12"/>',
  medal: '<circle cx="12" cy="15" r="6"/><path d="M8.6 10 6 2.5h4l2 5M15.4 10 18 2.5h-4l-2 5"/><path d="m12 12.3.9 1.8 2 .3-1.4 1.4.3 2-1.8-1-1.8 1 .3-2-1.4-1.4 2-.3Z"/>',
  trophy: '<path d="M8 21.5h8M12 16.5v5M7 3.5h10v6a5 5 0 0 1-10 0Z"/><path d="M7 5.5H4a3 3 0 0 0 3.2 4.5M17 5.5h3a3 3 0 0 1-3.2 4.5"/>',
  handshake: '<path d="m11 17.5 1.8 1.8a1.3 1.3 0 0 0 1.9-1.9"/><path d="m14 14.6 2.6 2.6a1.3 1.3 0 0 0 1.9-1.9l-3.9-3.9a3 3 0 0 0-4.2 0l-.8.8a1.3 1.3 0 0 1-1.9-1.9l2.9-2.9a5.4 5.4 0 0 1 6.9-.6l.5.3a3 3 0 0 0 1.7.5H22"/><path d="M22 15h-2.5M2 5.5h1.8a3 3 0 0 1 2.1.9L7.5 8"/><path d="M2 15l7.1 7.1a1.3 1.3 0 0 0 1.9-1.9"/>',
  plant: '<path d="M12 21.5V12"/><path d="M12 12c0-4.4 3-7.5 8.5-7.5 0 5.4-3.2 7.5-8.5 7.5Z"/><path d="M12 14.5c0-3.3-2.6-5.8-7.5-5.8 0 4.2 2.6 5.8 7.5 5.8Z"/>',
  cloche: '<path d="M3 18.5h18M4.5 18.5a7.5 7.5 0 0 1 15 0"/><path d="M12 11V8.5M10.5 8h3"/><path d="M16 5c.6-.6.6-1.4 0-2M19 6c.6-.6.6-1.4 0-2"/>',
  coins: '<ellipse cx="9" cy="6.5" rx="6" ry="2.5"/><path d="M3 6.5v4c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-4"/><path d="M9 15.5c-3.3 0-6-1.1-6-2.5"/><path d="M3 10.5V15c0 1.4 2.7 2.5 6 2.5"/><ellipse cx="15" cy="15" rx="6" ry="2.5"/><path d="M9 15v3.5c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V15"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>',
  bookmark: '<path d="M6 3h12v18l-6-4-6 4Z"/>',
  page: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>',
  note: '<path d="M12 20.5h8.5"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.8 2.8L16.5 9.5"/>',
  halfClock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  stats: '<path d="M3 20.5h18"/><path d="M5 16l4.5-5 3.5 3 6-7.5"/><path d="M15 6.5h4v4"/>',
  // — pelengkap dengan gaya yang sama —
  shalat: '<path d="M3 21h18"/><path d="M5 21v-7.5a7 7 0 0 1 14 0V21"/><path d="M12 2.5v4"/><path d="M10 21v-3.5a2 2 0 0 1 4 0V21"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  flame: '<path d="M12 2.5c1 4 5.5 6 5.5 11a5.5 5.5 0 0 1-11 0c0-3 2-4.5 2-7.5 2 1 3.5 3 3.5 3"/>',
  bulb: '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  back: '<path d="m15 18-6-6 6-6"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  calendarPlus: '<rect x="3" y="4.5" width="18" height="17" rx="2.5"/><path d="M7 2.5v4M17 2.5v4M3 9h18M12 12.5v6M9 15.5h6"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
  upload: '<path d="M12 15V3M7 8l5-5 5 5M4 21h16"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  logout: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H4"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  shield: '<path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6Z"/><path d="m9 12 2 2 4-4"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z"/>',
  coin: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
  bowl: '<path d="M3 11h18a9 9 0 0 1-18 0Z"/><path d="M8 7.5c0-1 1-1.2 1-2.5M12 7.5c0-1 1-1.2 1-2.5M16 7.5c0-1 1-1.2 1-2.5"/>',
  box: '<path d="M21 8 12 3 3 8v8l9 5 9-5Z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  cap: '<path d="M22 9 12 4 2 9l10 5 10-5Z"/><path d="M6 11v5c3 2.2 9 2.2 12 0v-5"/>',
  dots: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  heart: '<path d="M12 20s-8-4.8-8-10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15.2 12 20 12 20Z"/>',
};
const ic = (name, size = 22, extra = '') => svgWrap(ICON_PATHS[name] || '', size, extra);

/* ---------- Geometri Lingkar Istiqamah ----------
 * Tiga busur (shalat, tilawah, sedekah) dengan celah sama besar dan satu butir tasbih
 * di antara busur tilawah dan sedekah. Sudut dalam derajat, searah jarum jam dari arah jam 3. */
const RING = {
  shalat: [150, 243],
  tilawah: [261, 354],
  sedekah: [39, 132],
  bead: 16.5,
};
function arcPath(cx, cy, r, a1, a2) {
  const rad = (a) => (a * Math.PI) / 180;
  const x1 = cx + r * Math.cos(rad(a1)), y1 = cy + r * Math.sin(rad(a1));
  const x2 = cx + r * Math.cos(rad(a2)), y2 = cy + r * Math.sin(rad(a2));
  const large = a2 - a1 > 180 ? 1 : 0;
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}
const beadPoint = (cx, cy, r) => {
  const a = (RING.bead * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
};

const LOGO_COLORS = { bg: '#1F6F50', shalat: '#DDEFE6', tilawah: '#F3C969', sedekah: '#C8622F', bead: '#F3C969', text: '#FFFFFF' };

/** Logo SVG 1024×1024. opts: { bg: true|false, rounded: true|false, mono: warna|null, scale: 1 } */
function logoSVG(opts = {}) {
  const { bg = true, rounded = true, mono = null, scale = 1, title = 'Istiqamah 40' } = opts;
  const C = LOGO_COLORS;
  const c = 512, r = 330 * scale, w = 72 * scale;
  const col = (k) => mono || C[k];
  const [bx, by] = beadPoint(c, c, r);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" role="img" aria-label="${title}">
${bg ? `<rect width="1024" height="1024" ${rounded ? 'rx="232"' : ''} fill="${C.bg}"/>` : ''}
<g fill="none" stroke-width="${w}" stroke-linecap="round">
<path d="${arcPath(c, c, r, ...RING.shalat)}" stroke="${col('shalat')}"/>
<path d="${arcPath(c, c, r, ...RING.tilawah)}" stroke="${col('tilawah')}"/>
<path d="${arcPath(c, c, r, ...RING.sedekah)}" stroke="${col('sedekah')}"/>
</g>
<circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="${(44 * scale).toFixed(1)}" fill="${col('bead')}"/>
<text x="512" y="${(512 + 104 * scale).toFixed(0)}" text-anchor="middle" font-family="'Plus Jakarta Sans', 'Inter', sans-serif" font-size="${(300 * scale).toFixed(0)}" font-weight="800" letter-spacing="${(-6 * scale).toFixed(0)}" fill="${mono || C.text}">40</text>
</svg>`;
}

/** Cincin progres harian: bentuk yang sama dengan logo, terisi sesuai capaian tiap pilar (0–1). */
function progressRingSVG(p) {
  const c = 100, r = 80;
  const seg = (k, cls) => {
    const [a1, a2] = RING[k];
    const v = Math.max(0, Math.min(1, p[k] || 0));
    const track = `<path d="${arcPath(c, c, r, a1, a2)}" class="ring-track"/>`;
    const fill = v > 0.001 ? `<path d="${arcPath(c, c, r, a1, a1 + (a2 - a1) * v)}" class="${cls}"/>` : '';
    return track + fill;
  };
  const [bx, by] = beadPoint(c, c, r);
  const full = p.shalat >= 1 && p.tilawah >= 1 && p.sedekah >= 1;
  return `<svg viewBox="0 0 200 200" aria-hidden="true"><g fill="none" stroke-width="16" stroke-linecap="round">
${seg('shalat', 'ring-shalat')}${seg('tilawah', 'ring-tilawah')}${seg('sedekah', 'ring-sedekah')}</g>
<circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="9" class="${full ? 'ring-bead on' : 'ring-bead'}"/></svg>`;
}

if (typeof module !== 'undefined') module.exports = { logoSVG, LOGO_COLORS };
