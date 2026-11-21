-- Istiqamah 40 — skema database Supabase
-- Jalankan sekali di Supabase: SQL Editor › New query › tempel seluruh isi berkas ini › Run.
-- Aman dijalankan ulang.

-- Pengaturan per pengguna (tanggal mulai, kota, pengingat, bahasa, tema, dst.)
create table if not exists public.user_settings (
  user_id        uuid primary key references auth.users (id) on delete cascade,
  settings       jsonb       not null default '{}'::jsonb,
  client_updated bigint      not null default 0,          -- waktu ubah di perangkat (ms), untuk "yang terakhir menang"
  updated_at     timestamptz not null default now()       -- waktu server, untuk menarik perubahan
);

-- Catatan ibadah: satu baris per pengguna per tanggal
create table if not exists public.day_logs (
  user_id        uuid        not null references auth.users (id) on delete cascade,
  day            date        not null,
  rec            jsonb       not null,                    -- { done: {...}, pages, sedekah: {...}, note }
  client_updated bigint      not null default 0,
  updated_at     timestamptz not null default now(),
  primary key (user_id, day)
);
create index if not exists day_logs_user_updated_idx on public.day_logs (user_id, updated_at);

-- updated_at selalu diisi jam server
create or replace function public.istiqamah_touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists user_settings_touch on public.user_settings;
create trigger user_settings_touch before insert or update on public.user_settings
  for each row execute function public.istiqamah_touch_updated_at();

drop trigger if exists day_logs_touch on public.day_logs;
create trigger day_logs_touch before insert or update on public.day_logs
  for each row execute function public.istiqamah_touch_updated_at();

-- Row Level Security: setiap pengguna hanya bisa membaca & menulis datanya sendiri
alter table public.user_settings enable row level security;
alter table public.day_logs      enable row level security;

drop policy if exists "user_settings: milik sendiri" on public.user_settings;
create policy "user_settings: milik sendiri" on public.user_settings
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "day_logs: milik sendiri" on public.day_logs;
create policy "day_logs: milik sendiri" on public.day_logs
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.user_settings, public.day_logs to authenticated;
revoke all on public.user_settings, public.day_logs from anon;
