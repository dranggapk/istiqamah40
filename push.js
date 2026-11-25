/* Notifikasi push Istiqamah 40
 * Perangkat mendaftar ke Web Push (kunci VAPID), lalu alamatnya disimpan di Supabase (push_subscriptions).
 * Edge Function "send-reminders" mengirim pengingat dari server, sehingga tetap muncul walau aplikasi ditutup.
 * Butuh: sinkronisasi cloud aktif (login Google) dan izin notifikasi. */
'use strict';

const Push = (() => {
  const st = { active: false, busy: false, error: '' };
  const key = () => (window.APP_CONFIG || {}).vapidPublicKey || '';
  const supported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const configured = () => !!key() && window.Sync && Sync.enabled();
  const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  const tz = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jakarta'; } catch (e) { return 'Asia/Jakarta'; } };

  function b64ToBytes(s) {
    const pad = '='.repeat((4 - (s.length % 4)) % 4);
    const raw = atob((s + pad).replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(raw, (c) => c.charCodeAt(0));
  }
  async function registration() {
    return Promise.race([navigator.serviceWorker.ready, new Promise((_, rej) => setTimeout(() => rej(new Error('service worker')), 8000))]);
  }
  // Tidak menunggu: bila service worker belum terdaftar, anggap belum berlangganan
  async function current() {
    const reg = await navigator.serviceWorker.getRegistration();
    return reg ? reg.pushManager.getSubscription() : null;
  }
  async function store(sub) {
    const j = sub.toJSON();
    const { error } = await Sync.client.from('push_subscriptions').upsert({
      endpoint: j.endpoint, user_id: Sync.userId, p256dh: j.keys.p256dh, auth: j.keys.auth,
      tz: tz(), lang: state.settings.lang === 'en' ? 'en' : 'id', updated_at: new Date().toISOString(),
    }, { onConflict: 'endpoint' });
    if (error) throw friendly(error);
  }
  // Ubah error teknis Supabase menjadi pesan yang bisa ditindaklanjuti
  function friendly(err) {
    const msg = String((err && err.message) || err);
    if ((err && err.code === 'PGRST205') || /schema cache|does not exist/i.test(msg)) return new Error(t('push.notReady'));
    if (/row-level security|permission denied/i.test(msg)) return new Error(t('push.denied'));
    return err;
  }

  /** Dipanggil saat aplikasi dibuka, setelah login, dan saat bahasa diganti.
   *  Bila izin notifikasi sudah diberikan, push otomatis diaktifkan. */
  async function refresh() {
    if (!supported() || !configured() || !Sync.signedIn) { st.active = false; return; }
    try {
      let sub = await current();
      if (!sub && Notification.permission === 'granted') {
        const reg = await registration();
        sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(key()) });
      }
      if (sub && Notification.permission === 'granted') { await store(sub); st.active = true; st.error = ''; }
      else st.active = false;
    } catch (e) { st.active = false; st.error = String((e && e.message) || e); }
  }

  async function enable() {
    if (!supported() || !configured() || !Sync.signedIn) return false;
    st.busy = true; st.error = '';
    try {
      if (Notification.permission !== 'granted') await Notification.requestPermission();
      if (Notification.permission !== 'granted') throw new Error(t('toast.notifDenied'));
      const reg = await registration();
      const sub = (await reg.pushManager.getSubscription()) || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(key()) });
      await store(sub);
      st.active = true;
      return true;
    } catch (e) { st.error = String((e && e.message) || e); st.active = false; return false; } finally { st.busy = false; }
  }

  async function disable() {
    st.busy = true;
    try {
      const sub = supported() ? await current() : null;
      if (sub) {
        if (window.Sync && Sync.client && Sync.signedIn) { try { await Sync.client.from('push_subscriptions').delete().eq('endpoint', sub.endpoint); } catch (e) { /* abaikan */ } }
        await sub.unsubscribe();
      }
    } catch (e) { /* abaikan */ } finally { st.active = false; st.busy = false; }
  }

  return {
    supported, configured, refresh, enable, disable,
    get active() { return st.active; },
    get busy() { return st.busy; },
    get error() { return st.error; },
    get iosNeedsInstall() { return isIos() && !standalone(); },
  };
})();
window.Push = Push;
