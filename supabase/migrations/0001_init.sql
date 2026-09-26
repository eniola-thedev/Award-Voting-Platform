-- NAQSS AWARD AND PROM NIGHT — Voting Platform
-- Initial schema migration

create extension if not exists "pgcrypto";

-- ==========================================================
-- ADMIN PROFILES (linked to Supabase auth.users)
-- ==========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null default 'admin' check (role in ('admin', 'superadmin')),
  created_at timestamptz not null default now()
);

-- ==========================================================
-- AWARD SETTINGS (single row config table)
-- ==========================================================
create table if not exists public.award_settings (
  id int primary key default 1,
  award_name text not null default 'NAQSS AWARD AND PROM NIGHT',
  description text not null default 'Support your favourite contestant.',
  logo_url text,
  price_per_point int not null default 100 check (price_per_point > 0),
  whatsapp_number text not null default '',
  bank_name text not null default '',
  account_name text not null default '',
  account_number text not null default '',
  voting_status text not null default 'closed' check (voting_status in ('open', 'closed')),
  voting_start timestamptz,
  voting_end timestamptz,
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);

insert into public.award_settings (id) values (1)
  on conflict (id) do nothing;

-- ==========================================================
-- CATEGORIES
-- ==========================================================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ==========================================================
-- CONTESTANTS
-- ==========================================================
create table if not exists public.contestants (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  contestant_number text not null,
  description text,
  image_url text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category_id, contestant_number)
);

create index if not exists idx_contestants_category on public.contestants(category_id);

-- ==========================================================
-- VOTING CODES
-- ==========================================================
create table if not exists public.voting_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  amount int not null check (amount > 0 and amount % 100 = 0),
  total_points int not null check (total_points > 0),
  used_points int not null default 0 check (used_points >= 0),
  remaining_points int not null generated always as (total_points - used_points) stored,
  status text not null default 'active' check (status in ('active', 'partially_used', 'used', 'expired', 'disabled')),
  voter_note text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint used_not_exceed_total check (used_points <= total_points)
);

create index if not exists idx_voting_codes_code on public.voting_codes(code);
create index if not exists idx_voting_codes_status on public.voting_codes(status);

-- ==========================================================
-- VOTES
-- ==========================================================
create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  vote_reference text not null unique,
  voting_code_id uuid not null references public.voting_codes(id) on delete cascade,
  category_id uuid not null references public.categories(id),
  contestant_id uuid not null references public.contestants(id),
  points int not null check (points > 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_votes_voting_code on public.votes(voting_code_id);
create index if not exists idx_votes_category on public.votes(category_id);
create index if not exists idx_votes_contestant on public.votes(contestant_id);

-- ==========================================================
-- updated_at triggers
-- ==========================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_categories_updated_at on public.categories;
create trigger trg_categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

drop trigger if exists trg_contestants_updated_at on public.contestants;
create trigger trg_contestants_updated_at before update on public.contestants
  for each row execute function public.set_updated_at();

drop trigger if exists trg_voting_codes_updated_at on public.voting_codes;
create trigger trg_voting_codes_updated_at before update on public.voting_codes
  for each row execute function public.set_updated_at();

drop trigger if exists trg_award_settings_updated_at on public.award_settings;
create trigger trg_award_settings_updated_at before update on public.award_settings
  for each row execute function public.set_updated_at();

-- Keep status in sync with remaining_points whenever used_points changes
create or replace function public.sync_voting_code_status()
returns trigger language plpgsql as $$
begin
  if new.status = 'disabled' or new.status = 'expired' then
    -- leave admin-set terminal statuses alone unless points are exhausted
    if new.total_points - new.used_points <= 0 then
      new.status := 'used';
    end if;
    return new;
  end if;

  if new.total_points - new.used_points <= 0 then
    new.status := 'used';
  elsif new.used_points > 0 then
    new.status := 'partially_used';
  else
    new.status := 'active';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_voting_code_status on public.voting_codes;
create trigger trg_sync_voting_code_status before insert or update on public.voting_codes
  for each row execute function public.sync_voting_code_status();

-- ==========================================================
-- CODE GENERATION HELPER (unique, unambiguous alphabet)
-- Excludes O, 0, I, 1
-- ==========================================================
create or replace function public.generate_voting_code()
returns text language plpgsql as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
  i int;
  exists_already boolean;
begin
  loop
    code := 'AWD-';
    for i in 1..6 loop
      code := code || substr(alphabet, floor(random() * length(alphabet) + 1)::int, 1);
    end loop;
    select exists(select 1 from public.voting_codes where voting_codes.code = code) into exists_already;
    exit when not exists_already;
  end loop;
  return code;
end;
$$;

-- ==========================================================
-- ADMIN: CREATE VOTING CODE (amount -> points, generates unique code)
-- SECURITY DEFINER so it can be called via RPC from an authenticated admin session,
-- but it internally checks the caller is an admin.
-- ==========================================================
create or replace function public.admin_create_voting_code(p_amount int)
returns public.voting_codes language plpgsql security definer set search_path = public as $$
declare
  v_row public.voting_codes;
  v_price int;
  v_points int;
begin
  if not exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'Not authorized';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be a positive number';
  end if;

  select price_per_point into v_price from public.award_settings where id = 1;
  if v_price is null then
    v_price := 100;
  end if;

  if p_amount % v_price != 0 then
    raise exception 'Amount must be a multiple of %', v_price;
  end if;

  v_points := p_amount / v_price;

  insert into public.voting_codes (code, amount, total_points, used_points, created_by)
  values (public.generate_voting_code(), p_amount, v_points, 0, auth.uid())
  returning * into v_row;

  return v_row;
end;
$$;

-- ==========================================================
-- PUBLIC: VALIDATE VOTING CODE (no sensitive payment info exposed)
-- ==========================================================
create or replace function public.validate_voting_code(p_code text)
returns table (
  code text,
  total_points int,
  used_points int,
  remaining_points int,
  status text
) language plpgsql security definer set search_path = public as $$
declare
  v_settings public.award_settings;
begin
  select * into v_settings from public.award_settings where id = 1;

  if v_settings.voting_status != 'open' then
    raise exception 'Voting is currently closed';
  end if;

  if v_settings.voting_start is not null and now() < v_settings.voting_start then
    raise exception 'Voting has not started yet';
  end if;

  if v_settings.voting_end is not null and now() > v_settings.voting_end then
    raise exception 'Voting has ended';
  end if;

  return query
    select vc.code, vc.total_points, vc.used_points, vc.remaining_points, vc.status
    from public.voting_codes vc
    where vc.code = upper(trim(p_code))
      and vc.status in ('active', 'partially_used');

  if not found then
    raise exception 'Invalid, disabled, expired, or fully used voting code';
  end if;
end;
$$;

-- ==========================================================
-- PUBLIC: SUBMIT VOTES ATOMICALLY
-- p_votes is a jsonb array like: [{"category_id": "...", "contestant_id": "...", "points": 5}, ...]
-- ==========================================================
create or replace function public.submit_votes(p_code text, p_votes jsonb)
returns table (vote_reference text, remaining_points int) language plpgsql security definer set search_path = public as $$
declare
  v_settings public.award_settings;
  v_code_row public.voting_codes;
  v_item jsonb;
  v_total_requested int := 0;
  v_reference text;
  v_category_id uuid;
  v_contestant_id uuid;
  v_points int;
  v_seen jsonb := '{}'::jsonb;
begin
  select * into v_settings from public.award_settings where id = 1;

  if v_settings.voting_status != 'open' then
    raise exception 'Voting is currently closed';
  end if;
  if v_settings.voting_start is not null and now() < v_settings.voting_start then
    raise exception 'Voting has not started yet';
  end if;
  if v_settings.voting_end is not null and now() > v_settings.voting_end then
    raise exception 'Voting has ended';
  end if;

  if p_votes is null or jsonb_array_length(p_votes) = 0 then
    raise exception 'No votes submitted';
  end if;

  -- Lock the voting code row for the duration of this transaction
  select * into v_code_row from public.voting_codes where code = upper(trim(p_code)) for update;

  if not found then
    raise exception 'Invalid voting code';
  end if;

  if v_code_row.status not in ('active', 'partially_used') then
    raise exception 'This voting code cannot be used (status: %)', v_code_row.status;
  end if;

  -- Validate each vote entry and sum points
  for v_item in select * from jsonb_array_elements(p_votes)
  loop
    v_category_id := (v_item->>'category_id')::uuid;
    v_contestant_id := (v_item->>'contestant_id')::uuid;
    v_points := (v_item->>'points')::int;

    if v_points is null or v_points <= 0 or v_points != floor(v_points) then
      raise exception 'Invalid point value submitted';
    end if;

    if not exists (
      select 1 from public.contestants c
      join public.categories cat on cat.id = c.category_id
      where c.id = v_contestant_id
        and c.category_id = v_category_id
        and c.status = 'active'
        and cat.status = 'active'
    ) then
      raise exception 'Invalid contestant or category';
    end if;

    v_total_requested := v_total_requested + v_points;
  end loop;

  if v_total_requested > v_code_row.remaining_points then
    raise exception 'You only have % voting points available', v_code_row.remaining_points;
  end if;

  v_reference := 'VOTE-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));

  -- Insert all vote records
  for v_item in select * from jsonb_array_elements(p_votes)
  loop
    insert into public.votes (vote_reference, voting_code_id, category_id, contestant_id, points)
    values (
      v_reference,
      v_code_row.id,
      (v_item->>'category_id')::uuid,
      (v_item->>'contestant_id')::uuid,
      (v_item->>'points')::int
    );
  end loop;

  update public.voting_codes
    set used_points = used_points + v_total_requested
    where id = v_code_row.id;

  return query
    select v_reference, (v_code_row.remaining_points - v_total_requested);
end;
$$;

-- ==========================================================
-- RESULTS: aggregate view per contestant
-- ==========================================================
create or replace view public.contestant_results as
select
  c.id as contestant_id,
  c.name as contestant_name,
  c.contestant_number,
  c.category_id,
  cat.name as category_name,
  coalesce(sum(v.points), 0) as total_points,
  count(distinct v.voting_code_id) as unique_voters
from public.contestants c
join public.categories cat on cat.id = c.category_id
left join public.votes v on v.contestant_id = c.id
group by c.id, c.name, c.contestant_number, c.category_id, cat.name;

-- ==========================================================
-- ROW LEVEL SECURITY
-- ==========================================================
alter table public.profiles enable row level security;
alter table public.award_settings enable row level security;
alter table public.categories enable row level security;
alter table public.contestants enable row level security;
alter table public.voting_codes enable row level security;
alter table public.votes enable row level security;

-- Public (anon) can read active categories/contestants and settings (non-sensitive fields
-- are still filtered at the API layer for the payment info page; RLS here just gates rows).
create policy "public read active categories" on public.categories
  for select using (status = 'active');

create policy "public read active contestants" on public.contestants
  for select using (status = 'active');

create policy "public read settings" on public.award_settings
  for select using (true);

-- Voting codes and votes are NEVER directly readable/writable by anon.
-- All access goes through the SECURITY DEFINER functions above.
create policy "no direct anon access to voting_codes" on public.voting_codes
  for all using (auth.role() = 'authenticated' and exists (select 1 from public.profiles where id = auth.uid()));

create policy "no direct anon access to votes" on public.votes
  for all using (auth.role() = 'authenticated' and exists (select 1 from public.profiles where id = auth.uid()));

-- Admins (authenticated profiles) have full access to manage content
create policy "admin manage categories" on public.categories
  for all using (exists (select 1 from public.profiles where id = auth.uid()))
  with check (exists (select 1 from public.profiles where id = auth.uid()));

create policy "admin manage contestants" on public.contestants
  for all using (exists (select 1 from public.profiles where id = auth.uid()))
  with check (exists (select 1 from public.profiles where id = auth.uid()));

create policy "admin manage settings" on public.award_settings
  for update using (exists (select 1 from public.profiles where id = auth.uid()));

create policy "admin read own profile" on public.profiles
  for select using (id = auth.uid());
