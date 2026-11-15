-- Gallery CMS tables. Apply in the Supabase SQL editor or with Supabase CLI.
-- Admin write access is granted only to authenticated users whose JWT app_metadata.role = 'curator'.

create extension if not exists pgcrypto;

create table if not exists public.gallery_artists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  english text not null default '',
  field text not null default '',
  birth text not null default '',
  bio text not null default '',
  image text not null default '',
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gallery_artworks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null,
  year text not null,
  medium text not null,
  size text not null,
  image text not null,
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gallery_exhibitions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null,
  start_date date not null,
  end_date date not null,
  image text not null,
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gallery_exhibitions_valid_dates check (end_date >= start_date)
);

create or replace function public.set_gallery_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists gallery_artists_updated_at on public.gallery_artists;
create trigger gallery_artists_updated_at before update on public.gallery_artists
for each row execute function public.set_gallery_updated_at();
drop trigger if exists gallery_artworks_updated_at on public.gallery_artworks;
create trigger gallery_artworks_updated_at before update on public.gallery_artworks
for each row execute function public.set_gallery_updated_at();
drop trigger if exists gallery_exhibitions_updated_at on public.gallery_exhibitions;
create trigger gallery_exhibitions_updated_at before update on public.gallery_exhibitions
for each row execute function public.set_gallery_updated_at();

alter table public.gallery_artists enable row level security;
alter table public.gallery_artworks enable row level security;
alter table public.gallery_exhibitions enable row level security;

drop policy if exists "public reads published artists" on public.gallery_artists;
create policy "public reads published artists" on public.gallery_artists
for select to anon, authenticated using (published);
drop policy if exists "curators manage artists" on public.gallery_artists;
create policy "curators manage artists" on public.gallery_artists
for all to authenticated using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'curator')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'curator');

drop policy if exists "public reads published artworks" on public.gallery_artworks;
create policy "public reads published artworks" on public.gallery_artworks
for select to anon, authenticated using (published);
drop policy if exists "curators manage artworks" on public.gallery_artworks;
create policy "curators manage artworks" on public.gallery_artworks
for all to authenticated using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'curator')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'curator');

drop policy if exists "public reads published exhibitions" on public.gallery_exhibitions;
create policy "public reads published exhibitions" on public.gallery_exhibitions
for select to anon, authenticated using (published);
drop policy if exists "curators manage exhibitions" on public.gallery_exhibitions;
create policy "curators manage exhibitions" on public.gallery_exhibitions
for all to authenticated using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'curator')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'curator');

grant select on public.gallery_artists, public.gallery_artworks, public.gallery_exhibitions to anon, authenticated;
grant insert, update, delete on public.gallery_artists, public.gallery_artworks, public.gallery_exhibitions to authenticated;

