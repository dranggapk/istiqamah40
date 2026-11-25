-- Istiqamah 40 — notifikasi push, LANGKAH 1: tabel (jalankan SETELAH schema.sql)
-- SQL Editor › New query › tempel › Run. Aman dijalankan ulang.
-- Langkah 2 (penjadwal) ada di push-cron.sql.

-- Alamat penerima push per perangkat
create table if not exists public.push_subscriptions (
  endpoint   text primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  p256dh     text not null,
  auth       text not null,
  tz         text not null default 'Asia/Jakarta',   -- zona waktu perangkat (IANA)
  lang       text not null default 'id',             -- bahasa notifikasi
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;
drop policy if exists "push_subscriptions: milik sendiri" on public.push_subscriptions;
create policy "push_subscriptions: milik sendiri" on public.push_subscriptions
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.push_subscriptions to authenticated;
revoke all on public.push_subscriptions from anon;

-- Catatan notifikasi yang sudah terkirim (mencegah kiriman ganda). Hanya diakses Edge Function.
create table if not exists public.push_log (
  user_id uuid not null references auth.users (id) on delete cascade,
  day     date not null,
  key     text not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, day, key)
);
alter table public.push_log enable row level security;   -- tanpa policy: tertutup untuk pengguna
revoke all on public.push_log from anon, authenticated;

-- Segarkan schema cache API agar tabel baru langsung dikenali aplikasi
notify pgrst, 'reload schema';
