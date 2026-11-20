/* Perhitungan jadwal shalat — kriteria Kemenag RI
 * Subuh: matahari -20°, Isya: -18°, Ashar: bayangan 1× (Syafi'i), ihtiyath +2 menit.
 * Hasil dalam menit sejak tengah malam waktu lokal perangkat. */
(function (global) {
  const rad = (d) => (d * Math.PI) / 180;
  const deg = (r) => (r * 180) / Math.PI;
  const fixAngle = (a) => a - 360 * Math.floor(a / 360);
  const fixHour = (h) => h - 24 * Math.floor(h / 24);

  function julian(y, m, d) {
    if (m <= 2) { y -= 1; m += 12; }
    const A = Math.floor(y / 100);
    const B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
  }

  function sun(jd) {
    const D = jd - 2451545.0;
    const g = fixAngle(357.529 + 0.98560028 * D);
    const q = fixAngle(280.459 + 0.98564736 * D);
    const L = fixAngle(q + 1.915 * Math.sin(rad(g)) + 0.02 * Math.sin(rad(2 * g)));
    const e = 23.439 - 0.00000036 * D;
    const RA = fixHour(deg(Math.atan2(Math.cos(rad(e)) * Math.sin(rad(L)), Math.cos(rad(L)))) / 15);
    const decl = deg(Math.asin(Math.sin(rad(e)) * Math.sin(rad(L))));
    const eqt = q / 15 - RA;
    return { decl, eqt };
  }

  // Jam yang dibutuhkan matahari dari zenit ke sudut `angle` di bawah horizon
  function hourAngle(angle, lat, decl) {
    const v = (-Math.sin(rad(angle)) - Math.sin(rad(decl)) * Math.sin(rad(lat))) /
      (Math.cos(rad(decl)) * Math.cos(rad(lat)));
    return deg(Math.acos(Math.max(-1, Math.min(1, v)))) / 15;
  }

  function asrHourAngle(lat, decl) {
    const a = -deg(Math.atan(1 / (1 + Math.tan(rad(Math.abs(lat - decl))))));
    return hourAngle(a, lat, decl);
  }

  /** date: Date (lokal). Mengembalikan objek menit: fajr, sunrise, dhuhr, asr, maghrib, isha */
  function compute(date, lat, lng) {
    const y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate();
    const tz = -new Date(y, m - 1, d, 12).getTimezoneOffset() / 60;
    const jd = julian(y, m, d) + 0.5 - lng / 360;
    const { decl, eqt } = sun(jd);
    const dhuhr = 12 + tz - lng / 15 - eqt;
    const H = (a) => hourAngle(a, lat, decl);
    const ihtiyath = 2 / 60;
    const t = {
      fajr: dhuhr - H(20) + ihtiyath,
      sunrise: dhuhr - H(0.833) - ihtiyath,
      dhuhr: dhuhr + ihtiyath,
      asr: dhuhr + asrHourAngle(lat, decl) + ihtiyath,
      maghrib: dhuhr + H(0.833) + ihtiyath,
      isha: dhuhr + H(18) + ihtiyath,
    };
    const out = {};
    for (const k in t) out[k] = Math.round(fixHour(t[k]) * 60);
    return out;
  }

  global.PrayTimes = { compute };
})(typeof window !== 'undefined' ? window : globalThis);
