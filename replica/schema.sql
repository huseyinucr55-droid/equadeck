-- LaTeX equation editor: first migration (Supabase / Postgres 15+)
-- Applied in milestone 3. Milestones 1 and 2 need no database.
-- Access rules: row level security. Every row is visible only to its owner.

-- updated_at helper --------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- profiles: one per auth user -----------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text not null
               check (username ~ '^[A-Za-z0-9_]{3,30}$'),
  display_name text check (char_length(display_name) <= 80),
  avatar_url   text check (char_length(avatar_url) <= 500),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create unique index profiles_username_lower_key on public.profiles (lower(username));

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
create policy "own profile: read"   on public.profiles for select using (auth.uid() = id);
create policy "own profile: update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
-- No insert or delete policy: the trigger below creates the row, and the cascade deletes it.

-- Create a profile on sign-up. The username comes from the sign-up metadata,
-- or falls back to a unique generated one (OAuth users).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  wanted text := new.raw_user_meta_data->>'username';
begin
  if wanted is null or wanted !~ '^[A-Za-z0-9_]{3,30}$'
     or exists (select 1 from public.profiles where lower(username) = lower(wanted)) then
    wanted := 'user_' || substr(replace(new.id::text, '-', ''), 1, 12);
  end if;
  insert into public.profiles (id, username, display_name, avatar_url)
  values (new.id, wanted,
          coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
          new.raw_user_meta_data->>'avatar_url');
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- snippets: saved equations ---------------------------------------------------
create table public.snippets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid()
             references public.profiles(id) on delete cascade,
  title      text check (char_length(title) <= 120),
  code       text not null check (char_length(code) between 1 and 20000),
  settings   jsonb not null default '{}'::jsonb   -- { "font_size": 20, "image_output": false }
             check (jsonb_typeof(settings) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- The list query: own snippets, newest first, paginated (S12, F08).
create index snippets_user_updated_idx on public.snippets (user_id, updated_at desc);

create trigger snippets_updated_at before update on public.snippets
  for each row execute function public.set_updated_at();

alter table public.snippets enable row level security;
create policy "own snippets: read"   on public.snippets for select using (auth.uid() = user_id);
create policy "own snippets: insert" on public.snippets for insert with check (auth.uid() = user_id);
create policy "own snippets: update" on public.snippets for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own snippets: delete" on public.snippets for delete using (auth.uid() = user_id);

-- Anti-spam cap: at most 1,000 snippets per user. The advisory lock makes
-- concurrent inserts by the same user count one at a time.
create or replace function public.enforce_snippet_cap()
returns trigger language plpgsql as $$
begin
  perform pg_advisory_xact_lock(hashtext(new.user_id::text));
  if (select count(*) from public.snippets where user_id = new.user_id) >= 1000 then
    raise exception 'snippet limit reached (1000)' using errcode = 'check_violation';
  end if;
  return new;
end $$;

create trigger snippets_cap before insert on public.snippets
  for each row execute function public.enforce_snippet_cap();

-- GDPR: delete my account --------------------------------------------------------
-- Deleting the auth user cascades to profiles, which cascades to snippets.
-- The client deletes any avatar files in Storage first.
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end $$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
