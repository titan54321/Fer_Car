-- Ejecutar una sola vez en Supabase > SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 100),
  category text not null check (category in ('Audio', 'Cajones', 'Multimedia', 'Iluminación', 'Racks')),
  description text not null default '',
  image_path text not null,
  image_url text not null,
  position integer not null default 100,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;

create policy "Public can read published projects" on public.projects for select
using (published = true or (select auth.jwt() ->> 'email') = 'juan_ls58@hotmail.com');
create policy "Only admin can insert projects" on public.projects for insert to authenticated
with check ((select auth.jwt() ->> 'email') = 'juan_ls58@hotmail.com');
create policy "Only admin can update projects" on public.projects for update to authenticated
using ((select auth.jwt() ->> 'email') = 'juan_ls58@hotmail.com')
with check ((select auth.jwt() ->> 'email') = 'juan_ls58@hotmail.com');
create policy "Only admin can delete projects" on public.projects for delete to authenticated
using ((select auth.jwt() ->> 'email') = 'juan_ls58@hotmail.com');

insert into storage.buckets (id, name, public)
values ('project-images', 'project-images', true)
on conflict (id) do update set public = true;

create policy "Public can view project images" on storage.objects for select
using (bucket_id = 'project-images');
create policy "Only admin can upload project images" on storage.objects for insert to authenticated
with check (bucket_id = 'project-images' and (select auth.jwt() ->> 'email') = 'juan_ls58@hotmail.com');
create policy "Only admin can update project images" on storage.objects for update to authenticated
using (bucket_id = 'project-images' and (select auth.jwt() ->> 'email') = 'juan_ls58@hotmail.com');
create policy "Only admin can delete project images" on storage.objects for delete to authenticated
using (bucket_id = 'project-images' and (select auth.jwt() ->> 'email') = 'juan_ls58@hotmail.com');
