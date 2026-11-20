# Istiqamah 40 — PWA

Challenge 40 hari, setiap hari:
- **Shalat 40 rakaat** — 17 fardhu + 12 rawatib + 11 tahajud & witir
- **Tilawah 1 juz** — 20 halaman (4 halaman setelah tiap shalat fardhu)
- **Sedekah** — minimal satu, dalam bentuk apa pun

Terinspirasi QS. Fatir [35]: 29, yang menyebut tiga amal tersebut: membaca Kitab Allah, menegakkan shalat, dan berinfak.

## Alur aplikasi
1. **Cover** — logo Lingkar Istiqamah, QS. Fatir ayat 29 (Arab + terjemahan), tombol mulai. Bisa dibuka lagi dari Profil › Tentang.
2. **Registrasi** — pilih bahasa (Indonesia/English), lalu *Lanjutkan dengan Google* atau *Lanjut tanpa akun*.
3. **Atur challenge** — tanggal mulai, kota, izin notifikasi.
4. **Aplikasi** (4 tab):
   - **Hari Ini** — cincin progres 3 pilar (bentuknya sama dengan logo), perjalanan hari ke-x/40, pengingat waktu berikutnya, streak, checklist shalat, tilawah, sedekah, catatan hati.
   - **Evaluasi** — tab *Peta 40 hari* (sempurna/sebagian/belum, detail per hari, capaian per pilar) dan *Statistik* (rata-rata, hari sempurna, juz tuntas, hari bersedekah, per komponen, insight).
   - **Pengingat** — jadwal shalat Kemenag (kota/GPS) dan pengingat per pilar, ekspor kalender .ics.
   - **Profil** — akun Google / nama panggilan, bahasa, tema (otomatis/terang/gelap), tampilkan total sedekah, tanggal mulai, cadangkan/pulihkan/hapus data.

## Mengaktifkan login Google
Tanpa langkah ini, tombol Google hanya menampilkan petunjuk; pengguna tetap bisa memakai semua fitur sebagai tamu.
1. Buka Google Cloud Console › APIs & Services › Credentials.
2. Buat **OAuth client ID** dengan tipe **Web application**.
3. Di **Authorized JavaScript origins**, tambahkan domain aplikasi (mis. `https://istiqamah40.netlify.app`) dan `http://localhost:8080` untuk uji lokal.
4. Salin Client ID ke `config.js` → `googleClientId: '….apps.googleusercontent.com'`.
5. Naikkan `VERSION` di `sw.js` agar perangkat mengambil versi baru.

Catatan: login Google saat ini dipakai untuk **identitas** (nama, email, foto). Catatan ibadah tetap tersimpan di perangkat. Sinkronisasi antarperangkat butuh backend (mis. Firebase/Supabase) — bisa jadi tahap berikutnya.

## Bahasa
Semua teks ada di `i18n.js` (`id` dan `en`, kunci identik). Untuk menambah bahasa, salin blok `en`, terjemahkan, lalu tambahkan pilihannya di layar registrasi dan Profil.

Terjemahan ayat: Indonesia — Kemenag RI; English — Saheeh International.

## Identitas visual
- Logo: konsep A "Lingkar Istiqamah" — tiga busur (shalat, tilawah, sedekah) + butir tasbih + angka 40. Sumber: `icons.js` (`logoSVG`); berkas siap pakai di `brand/`.
- Font: Plus Jakarta Sans (UI), Amiri (teks Arab).
- Warna: Hijau Teduh `#1F6F50`, Hijau Dalam `#15513A`, Mint Embun `#DDEFE6`, Emas Mushaf `#C8962E`, Emas Fajar `#F3C969`, Krem Cahaya `#FFF4DF`, Terakota Kasih `#B4532A`, Terakota Lembut `#FBE7DE`, Kertas `#F6F7F4`, Tinta `#16201B`. Token mode gelap ada di `styles.css`.
- Ikon: outline 24×24, stroke 2px (icon pack Istiqamah 40 + pelengkap dengan gaya sama) di `icons.js`.
- `brand/logo.svg` memakai teks "40" dengan font Plus Jakarta Sans; untuk percetakan gunakan PNG di `brand/` atau ubah teks menjadi outline di aplikasi desain.

## Batasan
- Notifikasi web muncul selama aplikasi masih berjalan (terbuka/latar belakang). Agar alarm tetap berbunyi saat aplikasi ditutup, gunakan **Tambahkan ke kalender (.ics)**.
- iPhone: notifikasi hanya bekerja setelah aplikasi ditambahkan ke Layar Utama (iOS 16.4+).
- Data tersimpan di perangkat (localStorage). Gunakan **Cadangkan** secara berkala.

## Menjalankan lokal
```bash
cd istiqamah40 && python3 -m http.server 8080
```

## Deploy ke GitHub Pages
Tidak perlu build — semua path relatif, jadi aplikasi berjalan di `https://<user>.github.io/istiqamah40/`.
1. Push isi folder ini ke repo publik `istiqamah40` (branch `main`).
2. Repo › Settings › Pages › Build and deployment › Source: **Deploy from a branch**, Branch: **main**, folder **/ (root)** › Save.
3. Tunggu 1–2 menit, lalu buka `https://<user>.github.io/istiqamah40/`.
4. Login Google: tambahkan `https://<user>.github.io` ke Authorized JavaScript origins (tanpa `/istiqamah40`).
5. Setiap rilis baru: naikkan `VERSION` di `sw.js` agar HP pengguna mengambil versi terbaru.
