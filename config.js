/* Konfigurasi Istiqamah 40
 * googleClientId: OAuth 2.0 Client ID (tipe "Web application") dari Google Cloud Console.
 * Tambahkan domain tempat aplikasi di-hosting ke "Authorized JavaScript origins".
 * Selama masih kosong, tombol Google menampilkan petunjuk dan pengguna tetap bisa lanjut tanpa akun. */
window.APP_CONFIG = {
  // Supabase (sinkronisasi cloud): Project Settings › API — Project URL & anon/publishable key.
  // Kunci anon/publishable memang publik; keamanan data dijaga Row Level Security (supabase/schema.sql).
  supabaseUrl: 'https://tliudgeumvnkoflagizu.supabase.co',
  supabaseAnonKey: 'sb_publishable_NMX32s5CuD6BjA1yIdqQgQ_qHXJ36oJ',
  // Kunci publik VAPID untuk notifikasi push (kunci privat hanya ada di Supabase Edge Function secrets).
  vapidPublicKey: 'BLCgIkF2X4QqpcCCxLAe8o3kTgr_0kle5JH6MmW6zbQrwC_sZdb6JHmijktQZeMIKY1BBdZ8jlGxiHeZKQUXvxw',
  googleClientId: '62506141379-vsp1pb5j9j9rfi3fmk6ff0t9849srick.apps.googleusercontent.com',
};
