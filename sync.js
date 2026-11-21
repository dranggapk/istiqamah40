/* Sinkronisasi cloud Istiqamah 40 (Supabase)
 * - Masuk: token Google (Google Identity Services) diteruskan ke Supabase Auth (signInWithIdToken + nonce).
 * - Data: user_settings (1 baris) & day_logs (1 baris per tanggal), dilindungi Row Level Security.
 * - Konflik: per tanggal, yang terakhir diubah (client_updated) yang dipakai. Data lokal tetap jadi sumber utama
 *   saat offline; perubahan dikirim ulang begitu online.
 * Memakai variabel global dari app.js: state, saveLocal, render, toast, t. */
'use strict';

const Sync = (() => {
  const LIB = 'lib/supabase-js-2.49.4.js';
  let client = null;
  let user = null;
  let libLoading = null;
  let initDone = null;
  let busy = false;
  let pending = false;
  let timer = null;
  let rawNonce = null;
  let hashedNonce = null;
  const status = { state: 'idle', error: '' }; // idle | syncing | error | offline

  const cfg = () => window.APP_CONFIG || {};
  const enabled = () => !!(cfg().supabaseUrl && cfg().supabaseAnonKey);
  const meta = () => {
    if (!state.sync) state.sync = { dirty: {}, settingsDirty: false, lastPull: null, lastSync: null };
    if (!state.sync.dirty) state.sync.dirty = {};
    return state.sync;
  };

  function loadLib() {
    if (window.supabase && window.supabase.createClient) return Promise.resolve();
    if (!libLoading) {
      libLoading = new Promise((res, rej) => {
        const sc = document.createElement('script');
        sc.src = LIB; sc.async = true; sc.onload = res;
        sc.onerror = () => { libLoading = null; rej(new Error('lib')); };
        document.head.appendChild(sc);
      });
    }
    return libLoading;
  }

  function init() {
    if (!enabled()) return Promise.resolve();
    if (initDone) return initDone;
    initDone = (async () => {
      await loadLib();
      client = window.supabase.createClient(cfg().supabaseUrl, cfg().supabaseAnonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'istiqamah40:supabase' },
      });
      const { data } = await client.auth.getSession();
      user = (data && data.session && data.session.user) || null;
      client.auth.onAuthStateChange((_event, session) => { user = (session && session.user) || null; });
      if (user) syncNow();
    })().catch((e) => { initDone = null; status.state = 'error'; status.error = String(e.message || e); });
    return initDone;
  }

  /* Nonce untuk Google: GIS menerima versi hash, Supabase menerima versi mentah */
  async function nonceForGoogle() {
    if (!enabled() || !(window.crypto && crypto.subtle)) return undefined;
    if (!hashedNonce) {
      const bytes = crypto.getRandomValues(new Uint8Array(32));
      rawNonce = btoa(String.fromCharCode(...bytes)).replace(/[^a-zA-Z0-9]/g, '');
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawNonce));
      hashedNonce = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    return hashedNonce;
  }

  async function signInWithGoogle(idToken) {
    if (!enabled()) return false;
    await init();
    if (!client) return false;
    const { data, error } = await client.auth.signInWithIdToken({ provider: 'google', token: idToken, nonce: rawNonce || undefined });
    if (error) { status.state = 'error'; status.error = error.message; render(); return false; }
    user = data.user;
    await syncNow();
    return true;
  }

  async function signOut() {
    if (client) { try { await client.auth.signOut(); } catch (e) { /* abaikan */ } }
    user = null;
    const m = meta();
    m.lastPull = null; m.lastSync = null; m.dirty = {}; m.settingsDirty = false;
    saveLocal();
  }

  async function deleteCloudData() {
    if (!client || !user) return;
    await client.from('day_logs').delete().eq('user_id', user.id);
    await client.from('user_settings').delete().eq('user_id', user.id);
  }

  function markDay(d) { meta().dirty[d] = 1; }
  function markSettings() { meta().settingsDirty = true; }

  function schedule(delay = 1500) {
    if (!enabled() || !user) return;
    clearTimeout(timer);
    timer = setTimeout(syncNow, delay);
  }

  const stripLocal = (r) => { const { u, ...rest } = r; return rest; };
  const deviceFree = (s) => { const { u, lang, theme, ...rest } = s; return rest; };

  async function syncNow() {
    if (!client || !user) return;
    if (!navigator.onLine) { status.state = 'offline'; return; }
    if (busy) { pending = true; return; }
    busy = true; pending = false;
    status.state = 'syncing'; status.error = '';
    let changed = false;
    try {
      const m = meta();
      const firstSync = !m.lastSync;
      if (firstSync) Object.keys(state.days).forEach((d) => { m.dirty[d] = 1; });

      // 1) Pengaturan
      const { data: srow, error: e1 } = await client.from('user_settings').select('settings, client_updated').eq('user_id', user.id).maybeSingle();
      if (e1) throw e1;
      const localU = state.settings.u || 0;
      if (srow && srow.settings && srow.settings.startDate && (firstSync || srow.client_updated > localU)) {
        // Akun yang sudah punya challenge: pengaturan cloud dipakai di perangkat baru
        // Bahasa & tema adalah pilihan per perangkat — tidak ikut disinkronkan
        const { lang, theme } = state.settings;
        applySettings({ ...state.settings, ...srow.settings, lang, theme, u: srow.client_updated });
        m.settingsDirty = false;
        changed = true;
      } else if (m.settingsDirty || !srow) {
        const u = state.settings.u || Date.now();
        const { error } = await client.from('user_settings').upsert({ user_id: user.id, settings: deviceFree(state.settings), client_updated: u });
        if (error) throw error;
        if ((state.settings.u || 0) === u || !state.settings.u) m.settingsDirty = false;
      }

      // 2) Tarik catatan yang berubah sejak sinkron terakhir
      let maxPull = m.lastPull;
      for (let from = 0; ; from += 1000) {
        let q = client.from('day_logs').select('day, rec, client_updated, updated_at').eq('user_id', user.id);
        if (m.lastPull) q = q.gt('updated_at', m.lastPull);
        const { data: rows, error: e2 } = await q.order('updated_at', { ascending: true }).range(from, from + 999);
        if (e2) throw e2;
        for (const row of rows) {
          const local = state.days[row.day];
          if (!local || (local.u || 0) < row.client_updated) {
            state.days[row.day] = { ...row.rec, u: row.client_updated };
            delete m.dirty[row.day];
            changed = true;
          } else if ((local.u || 0) === row.client_updated) {
            delete m.dirty[row.day];
          }
          if (!maxPull || Date.parse(row.updated_at) > Date.parse(maxPull)) maxPull = row.updated_at;
        }
        if (rows.length < 1000) break;
      }

      // 3) Kirim catatan lokal yang berubah
      const dates = Object.keys(m.dirty).filter((d) => state.days[d]);
      for (let i = 0; i < dates.length; i += 200) {
        const chunk = dates.slice(i, i + 200);
        const sent = {};
        const rows = chunk.map((d) => {
          const r = state.days[d];
          if (!r.u) r.u = Date.now();
          sent[d] = r.u;
          return { user_id: user.id, day: d, rec: stripLocal(r), client_updated: r.u };
        });
        const { data: up, error: e3 } = await client.from('day_logs').upsert(rows, { onConflict: 'user_id,day' }).select('day, updated_at');
        if (e3) throw e3;
        chunk.forEach((d) => { if (state.days[d] && state.days[d].u === sent[d]) delete m.dirty[d]; });
        // Jangan tarik ulang perubahan kita sendiri
        (up || []).forEach((row) => { if (!maxPull || Date.parse(row.updated_at) > Date.parse(maxPull)) maxPull = row.updated_at; });
      }
      Object.keys(m.dirty).forEach((d) => { if (!state.days[d]) delete m.dirty[d]; });

      m.lastPull = maxPull;
      m.lastSync = Date.now();
      status.state = 'idle';
    } catch (e) {
      status.state = 'error';
      status.error = String((e && e.message) || e);
    } finally {
      busy = false;
      saveLocal();
      if (changed || ui.tab === 'profile') render();
      if (pending) schedule(300);
    }
  }

  window.addEventListener('online', () => schedule(500));

  return {
    enabled, init, nonceForGoogle, signInWithGoogle, signOut, deleteCloudData, markDay, markSettings, schedule, syncNow,
    get signedIn() { return !!user; },
    get email() { return (user && user.email) || ''; },
    get status() { return status; },
    get lastSync() { return (state.sync && state.sync.lastSync) || null; },
  };
})();

window.Sync = Sync;
