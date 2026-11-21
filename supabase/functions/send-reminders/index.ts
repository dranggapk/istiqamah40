// Istiqamah 40 — Edge Function "send-reminders"
// Dipanggil pg_cron setiap menit. Menghitung jadwal shalat tiap pengguna (lokasi & zona waktunya),
// lalu mengirim notifikasi push yang jatuh tempo. Setiap pengingat hanya dikirim sekali (tabel push_log).
//
// Secrets (Edge Functions › Secrets): VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, CRON_SECRET.
// SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY disediakan otomatis oleh Supabase.
// Matikan "Verify JWT" untuk fungsi ini — akses dijaga oleh header x-cron-secret.

import { createClient } from "npm:@supabase/supabase-js@2.49.4";
import webpush from "npm:web-push@3.6.7";

// CORE-START — logika murni (tanpa I/O), sama dengan app.js
const STR = {
  id: {
    p: { fajr: "Subuh", dhuhr: "Dzuhur", asr: "Ashar", maghrib: "Maghrib", isha: "Isya" },
    adzanTitle: (p) => `Waktunya shalat ${p}`,
    adzanBody: (left) => (left > 0 ? `Yuk, jaga 40 rakaat hari ini. Tinggal ${left} rakaat lagi.` : "Alhamdulillah, 40 rakaat hari ini sudah lengkap."),
    adzanBefore: "Jangan lewatkan qabliyah sebelum iqamah.",
    afterTitle: (p) => `Ba'diyah ${p}`, afterBody: "2 rakaat sunnah setelah fardhu. Sudah dikerjakan?",
    unloggedTitle: (p) => `${p} belum dicatat`, unloggedBody: "Sudah shalat? Ketuk untuk mencentang.",
    tilawahTitle: "Lanjutkan tilawah", tilawahBody: (a, b, juz) => `Saatnya membaca 4 halaman (hal. ${a}–${b}) dari Juz ${juz} hari ini.`,
    tahajudTitle: "Waktunya Tahajud", tahajudBody: "Tahajud 8 rakaat dan Witir 3 rakaat sebelum Subuh.",
    witirTitle: "Witir sebelum tidur?", witirBody: "Jika khawatir tidak bangun malam, kerjakan Witir sekarang.",
    leftTitle: "Juz hari ini belum tuntas", leftBody: (n) => `Tinggal ${n} halaman lagi.`,
    sedekahTitle: "Jangan lupa sedekah", sedekahBody: "Satu kebaikan hari ini, insyaAllah jadi pemberat amal.",
    summaryTitle: "Ringkasan hari ini",
    summaryBody: (rk, p, sd) => `${rk}/40 rakaat · ${p}/20 halaman · sedekah ${sd ? "sudah" : "belum"}. Isi catatan hati sebelum tidur.`,
  },
  en: {
    p: { fajr: "Fajr", dhuhr: "Dhuhr", asr: "Asr", maghrib: "Maghrib", isha: "Isha" },
    adzanTitle: (p) => `It’s time for ${p}`,
    adzanBody: (left) => (left > 0 ? `Keep up your 40 rak’ahs today — ${left} to go.` : "Alhamdulillah, all 40 rak’ahs are done for today."),
    adzanBefore: "Don’t miss the sunnah before the iqamah.",
    afterTitle: (p) => `Sunnah after ${p}`, afterBody: "Two sunnah rak’ahs after the obligatory prayer. Have you prayed them?",
    unloggedTitle: (p) => `${p} not logged yet`, unloggedBody: "Already prayed? Tap to mark it as done.",
    tilawahTitle: "Continue your recitation", tilawahBody: (a, b, juz) => `Time to read 4 pages (pp. ${a}–${b}) of today’s Juz ${juz}.`,
    tahajudTitle: "Time for Tahajjud", tahajudBody: "8 rak’ahs of Tahajjud and 3 of Witr before Fajr.",
    witirTitle: "Witr before bed?", witirBody: "If you might not wake up at night, pray Witr now.",
    leftTitle: "Today’s juz isn’t finished", leftBody: (n) => `${n} ${n === 1 ? "page" : "pages"} to go.`,
    sedekahTitle: "Don’t forget your charity", sedekahBody: "One good deed today — insha’Allah it will weigh heavy on your scale.",
    summaryTitle: "Today’s summary",
    summaryBody: (rk, p, sd) => `${rk}/40 rak’ahs · ${p}/20 pages · charity: ${sd ? "done" : "not yet"}. Write a short reflection before bed.`,
  },
};

const RK = { th: 8, wi: 3, sq: 2, sf: 2, dq: 4, df: 4, db: 2, af: 4, mf: 3, mb: 2, if: 4, ib: 2 };
const DEFAULT_REM = { adzan: true, badiyah: true, susul: true, tahajud: true, witir: false, tilawah: true, sisa: true, ringkasan: true, sedekah: true };

// Jadwal shalat — kriteria Kemenag RI (Subuh 20°, Isya 18°, Ashar Syafi'i, ihtiyath 2 menit)
function prayerTimes(y, m, d, lat, lng, tzHours) {
  const rad = (x) => (x * Math.PI) / 180, deg = (x) => (x * 180) / Math.PI;
  const fixA = (a) => a - 360 * Math.floor(a / 360), fixH = (h) => h - 24 * Math.floor(h / 24);
  let Y = y, M = m;
  if (M <= 2) { Y -= 1; M += 12; }
  const A = Math.floor(Y / 100), B = 2 - A + Math.floor(A / 4);
  const jd = Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + d + B - 1524.5 + 0.5 - lng / 360;
  const D = jd - 2451545.0;
  const g = fixA(357.529 + 0.98560028 * D), q = fixA(280.459 + 0.98564736 * D);
  const L = fixA(q + 1.915 * Math.sin(rad(g)) + 0.02 * Math.sin(rad(2 * g)));
  const e = 23.439 - 0.00000036 * D;
  const RA = fixH(deg(Math.atan2(Math.cos(rad(e)) * Math.sin(rad(L)), Math.cos(rad(L)))) / 15);
  const decl = deg(Math.asin(Math.sin(rad(e)) * Math.sin(rad(L))));
  const dhuhr = 12 + tzHours - lng / 15 - (q / 15 - RA);
  const H = (angle) => deg(Math.acos(Math.max(-1, Math.min(1, (-Math.sin(rad(angle)) - Math.sin(rad(decl)) * Math.sin(rad(lat))) / (Math.cos(rad(decl)) * Math.cos(rad(lat))))))) / 15;
  const asrAngle = -deg(Math.atan(1 / (1 + Math.tan(rad(Math.abs(lat - decl))))));
  const ih = 2 / 60;
  const t = { fajr: dhuhr - H(20) + ih, dhuhr: dhuhr + ih, asr: dhuhr + H(asrAngle) + ih, maghrib: dhuhr + H(0.833) + ih, isha: dhuhr + H(18) + ih };
  const out = {};
  for (const k in t) out[k] = Math.round(fixH(t[k]) * 60);
  return out;
}

// Tanggal & menit lokal di zona waktu pengguna
function localParts(tz, instant) {
  const f = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const p = Object.fromEntries(f.formatToParts(instant).map((x) => [x.type, x.value]));
  const y = +p.year, m = +p.month, d = +p.day, h = +p.hour, mi = +p.minute;
  const offsetMin = Math.round((Date.UTC(y, m - 1, d, h, mi) - Math.floor(instant.getTime() / 60000) * 60000) / 60000);
  return { ymd: `${p.year}-${p.month}-${p.day}`, y, m, d, min: h * 60 + mi, tzHours: offsetMin / 60 };
}
const dayDiff = (a, b) => Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000);
const hhmm = (s, def) => { const [h, m] = String(s || def).split(":").map(Number); return h * 60 + m; };

/** Pengingat yang jatuh tempo dalam jendela (now-windowMin, now]. Mengembalikan [{ key, text(lang) }]. */
function dueReminders(settings, rec, tz, now, windowMin = 3) {
  if (!settings || !settings.startDate) return { ymd: null, items: [] };
  const lp = localParts(tz, now);
  const n = dayDiff(settings.startDate, lp.ymd) + 1;
  if (n < 1 || n > 40) return { ymd: lp.ymd, items: [] };
  const lat = Number(settings.lat ?? -6.9175), lng = Number(settings.lng ?? 107.6191);
  const tm = prayerTimes(lp.y, lp.m, lp.d, lat, lng, lp.tzHours);
  const rem = { ...DEFAULT_REM, ...(settings.rem || {}) };
  const r = rec || { done: {}, pages: 0 };
  const done = r.done || {};
  const pages = Number(r.pages || 0);
  const total = Object.keys(done).reduce((a, k) => a + (done[k] && RK[k] ? RK[k] : 0), 0);
  const sedekah = !!(r.sedekah && r.sedekah.done);
  const juz = ((n - 1) % 30) + 1;
  const ev = [];
  const add = (key, min, skip, text) => { if (!skip) ev.push({ key, min, text }); };
  const fard = [["fajr", "sf", true], ["dhuhr", "df", true], ["asr", "af", false], ["maghrib", "mf", false], ["isha", "if", false]];
  const after = { dhuhr: "db", maghrib: "mb", isha: "ib" };
  fard.forEach(([k, fid, before], i) => {
    const m = tm[k];
    if (rem.adzan) add(`adzan-${fid}`, m, false, (S) => ({ title: S.adzanTitle(S.p[k]), body: S.adzanBody(40 - total) + (before ? " " + S.adzanBefore : "") }));
    if (rem.badiyah && after[k]) add(`bd-${k}`, m + 20, !!done[after[k]], (S) => ({ title: S.afterTitle(S.p[k]), body: S.afterBody }));
    if (rem.susul) add(`susul-${fid}`, m + 30, !!done[fid], (S) => ({ title: S.unloggedTitle(S.p[k]), body: S.unloggedBody }));
    if (rem.tilawah) add(`til-${i}`, m + 25, pages >= (i + 1) * 4, (S) => ({ title: S.tilawahTitle, body: S.tilawahBody(i * 4 + 1, i * 4 + 4, juz) }));
  });
  if (rem.tahajud) add("tahajud", tm.fajr - Number(settings.tahajudOffset ?? 50), !!done.th, (S) => ({ title: S.tahajudTitle, body: S.tahajudBody }));
  if (rem.witir) add("witir", hhmm(settings.witirTime, "21:30"), !!done.wi, (S) => ({ title: S.witirTitle, body: S.witirBody }));
  if (rem.sisa) add("sisa", hhmm(settings.sisaTime, "20:30"), pages >= 20, (S) => ({ title: S.leftTitle, body: S.leftBody(20 - pages) }));
  if (rem.sedekah) add("sedekah", hhmm(settings.sedekahTime, "06:30"), sedekah, (S) => ({ title: S.sedekahTitle, body: S.sedekahBody }));
  if (rem.ringkasan) add("ringkasan", hhmm(settings.ringkasanTime, "21:00"), false, (S) => ({ title: S.summaryTitle, body: S.summaryBody(total, pages, sedekah) }));
  const items = ev.filter((e) => e.min > lp.min - windowMin && e.min <= lp.min)
    .map((e) => ({ key: e.key, text: (lang) => e.text(STR[lang === "en" ? "en" : "id"]) }));
  return { ymd: lp.ymd, items };
}
// CORE-END

Deno.serve(async (req) => {
  const secret = Deno.env.get("CRON_SECRET");
  if (!secret || req.headers.get("x-cron-secret") !== secret) return new Response("forbidden", { status: 403 });

  webpush.setVapidDetails(
    Deno.env.get("VAPID_SUBJECT") || "mailto:admin@example.com",
    Deno.env.get("VAPID_PUBLIC_KEY")!,
    Deno.env.get("VAPID_PRIVATE_KEY")!,
  );
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

  const { data: subs, error: e1 } = await sb.from("push_subscriptions").select("endpoint, user_id, p256dh, auth, tz, lang");
  if (e1) return Response.json({ error: e1.message }, { status: 500 });
  if (!subs || !subs.length) return Response.json({ users: 0, sent: 0 });

  const byUser = new Map();
  for (const s of subs) { if (!byUser.has(s.user_id)) byUser.set(s.user_id, []); byUser.get(s.user_id).push(s); }
  const ids = [...byUser.keys()];
  const { data: settingsRows, error: e2 } = await sb.from("user_settings").select("user_id, settings").in("user_id", ids);
  if (e2) return Response.json({ error: e2.message }, { status: 500 });
  const settingsOf = new Map((settingsRows || []).map((r) => [r.user_id, r.settings]));

  const now = new Date();
  const plan = []; // { uid, ymd, settings, tz }
  for (const [uid, list] of byUser) {
    const settings = settingsOf.get(uid);
    if (!settings || !settings.startDate) continue;
    let tz = list[0].tz || "Asia/Jakarta";
    try { new Intl.DateTimeFormat("en", { timeZone: tz }); } catch { tz = "Asia/Jakarta"; }
    plan.push({ uid, tz, settings, ymd: localParts(tz, now).ymd });
  }
  const days = [...new Set(plan.map((p) => p.ymd))];
  const { data: logs } = plan.length
    ? await sb.from("day_logs").select("user_id, day, rec").in("user_id", plan.map((p) => p.uid)).in("day", days)
    : { data: [] };
  const recOf = new Map((logs || []).map((r) => [`${r.user_id}|${r.day}`, r.rec]));

  let sent = 0, removed = 0;
  for (const p of plan) {
    const { ymd, items } = dueReminders(p.settings, recOf.get(`${p.uid}|${p.ymd}`), p.tz, now);
    for (const it of items) {
      // Klaim pengingat ini agar tidak terkirim dua kali
      const { data: claimed, error } = await sb.from("push_log")
        .upsert({ user_id: p.uid, day: ymd, key: it.key }, { onConflict: "user_id,day,key", ignoreDuplicates: true })
        .select("key");
      if (error || !claimed || !claimed.length) continue;
      for (const s of byUser.get(p.uid)) {
        const { title, body } = it.text(s.lang);
        const payload = JSON.stringify({ title, body, tag: `${ymd}-${it.key}`, url: "./" });
        try {
          await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 1800, urgency: "high" });
          sent++;
        } catch (err) {
          const code = err && err.statusCode;
          if (code === 404 || code === 410) { await sb.from("push_subscriptions").delete().eq("endpoint", s.endpoint); removed++; }
          else console.error("push gagal", code, err && err.body);
        }
      }
    }
  }
  return Response.json({ users: plan.length, sent, removed });
});
