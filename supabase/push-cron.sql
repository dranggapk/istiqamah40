-- Istiqamah 40 — notifikasi push, LANGKAH 2: penjadwal (jalankan SETELAH push.sql)
-- SQL Editor › New query › tempel › Run. Aman dijalankan ulang.
-- Ganti <PROJECT_REF> dan <CRON_SECRET> (lihat berkas rahasia yang diberikan terpisah — JANGAN di-commit).
-- Bila baris "create extension" gagal: aktifkan pg_cron & pg_net lewat Database › Extensions, lalu jalankan ulang.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Hapus jadwal lama (bila ada) agar tidak dobel
select cron.unschedule(jobid) from cron.job where jobname in ('istiqamah40-reminders', 'istiqamah40-cleanup');

-- Bersihkan log kiriman lama setiap hari
select cron.schedule('istiqamah40-cleanup', '17 3 * * *',
  $$ delete from public.push_log where sent_at < now() - interval '3 days' $$);

-- Panggil Edge Function setiap menit
select cron.schedule('istiqamah40-reminders', '* * * * *', $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', '<CRON_SECRET>'),
    body := '{}'::jsonb,
    timeout_milliseconds := 25000
  )
$$);

-- Cek: harus tampil 2 jadwal aktif
select jobname, schedule, active from cron.job where jobname like 'istiqamah40-%';
