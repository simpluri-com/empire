-- Empire online lobby (separate Supabase project).
-- Run in Supabase SQL Editor on the Empire project after creating it.
-- Requires pgcrypto (Database → Extensions → pgcrypto).

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.empire_random_code(len integer default 6)
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  chars text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  result text := '';
  i integer;
  idx integer;
begin
  if len < 4 or len > 12 then
    raise exception 'EMPIRE_INVALID_CODE_LENGTH';
  end if;
  for i in 1..len loop
    idx := 1 + floor(random() * length(chars))::integer;
    result := result || substr(chars, idx, 1);
  end loop;
  return result;
end;
$$;

revoke all on function public.empire_random_code(integer) from public;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.empire_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  dealer_token text not null,
  status text not null default 'lobby' check (status in ('lobby', 'started')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  constraint empire_rooms_code_unique unique (code),
  constraint empire_rooms_dealer_token_unique unique (dealer_token)
);

create index if not exists empire_rooms_status_expires_idx
  on public.empire_rooms (status, expires_at);

create table if not exists public.empire_submissions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.empire_rooms (id) on delete cascade,
  player_name text not null,
  celebrity text not null,
  player_name_key text generated always as (lower(trim(player_name))) stored,
  created_at timestamptz not null default now(),
  constraint empire_submissions_room_name_unique unique (room_id, player_name_key),
  constraint empire_submissions_player_name_len check (char_length(trim(player_name)) between 1 and 80),
  constraint empire_submissions_celebrity_len check (char_length(trim(celebrity)) between 1 and 200)
);

create index if not exists empire_submissions_room_id_idx
  on public.empire_submissions (room_id);

alter table public.empire_rooms enable row level security;
alter table public.empire_submissions enable row level security;

-- No anon/authenticated table policies: access only via SECURITY DEFINER RPCs below.

create or replace function public.empire_room_by_code(p_code text)
returns public.empire_rooms
language sql
stable
security definer
set search_path = public
as $$
  select r.*
  from public.empire_rooms r
  where r.code = upper(trim(p_code))
    and r.expires_at > now()
  limit 1;
$$;

revoke all on function public.empire_room_by_code(text) from public;

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------
create or replace function public.create_empire_room()
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  v_code text;
  v_dealer_token text;
  v_room_id uuid;
  v_attempts integer := 0;
begin
  v_dealer_token := encode(extensions.gen_random_bytes(24), 'hex');

  loop
    v_attempts := v_attempts + 1;
    if v_attempts > 25 then
      raise exception 'EMPIRE_CODE_GENERATION_FAILED';
    end if;

    v_code := public.empire_random_code(6);
    begin
      insert into public.empire_rooms (code, dealer_token)
      values (v_code, v_dealer_token)
      returning id into v_room_id;
      exit;
    exception
      when unique_violation then
        continue;
    end;
  end loop;

  return jsonb_build_object(
    'ok', true,
    'room_id', v_room_id,
    'code', v_code,
    'dealer_token', v_dealer_token
  );
end;
$$;

create or replace function public.submit_empire_entry(
  p_code text,
  p_player_name text,
  p_celebrity text
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_room public.empire_rooms;
  v_name text;
  v_celeb text;
  v_count integer;
begin
  v_name := trim(p_player_name);
  v_celeb := trim(p_celebrity);

  if char_length(v_name) < 1 or char_length(v_name) > 80 then
    return jsonb_build_object('ok', false, 'error', 'INVALID_NAME');
  end if;
  if char_length(v_celeb) < 1 or char_length(v_celeb) > 200 then
    return jsonb_build_object('ok', false, 'error', 'INVALID_CELEBRITY');
  end if;

  select * into v_room from public.empire_room_by_code(p_code);
  if v_room.id is null then
    return jsonb_build_object('ok', false, 'error', 'ROOM_NOT_FOUND');
  end if;
  if v_room.status <> 'lobby' then
    return jsonb_build_object('ok', false, 'error', 'ROOM_CLOSED');
  end if;

  select count(*) into v_count
  from public.empire_submissions s
  where s.room_id = v_room.id;

  if v_count >= 20 then
    return jsonb_build_object('ok', false, 'error', 'ROOM_FULL');
  end if;

  begin
    insert into public.empire_submissions (room_id, player_name, celebrity)
    values (v_room.id, v_name, v_celeb);
  exception
    when unique_violation then
      return jsonb_build_object('ok', false, 'error', 'NAME_TAKEN');
  end;

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.fetch_empire_lobby(p_dealer_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_room public.empire_rooms;
  v_players jsonb;
  v_count integer;
begin
  select * into v_room
  from public.empire_rooms r
  where r.dealer_token = trim(p_dealer_token)
    and r.expires_at > now()
  limit 1;

  if v_room.id is null then
    return jsonb_build_object('ok', false, 'error', 'ROOM_NOT_FOUND');
  end if;
  if v_room.status <> 'lobby' then
    return jsonb_build_object(
      'ok', false,
      'error', 'ROOM_CLOSED',
      'status', v_room.status
    );
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'player_name', s.player_name,
        'submitted_at', s.created_at
      )
      order by s.created_at
    ),
    '[]'::jsonb
  )
  into v_players
  from public.empire_submissions s
  where s.room_id = v_room.id;

  v_count := jsonb_array_length(v_players);

  return jsonb_build_object(
    'ok', true,
    'code', v_room.code,
    'status', v_room.status,
    'players', v_players,
    'count', v_count
  );
end;
$$;

create or replace function public.start_empire_game(p_dealer_token text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_room public.empire_rooms;
  v_submissions jsonb;
  v_count integer;
begin
  select * into v_room
  from public.empire_rooms r
  where r.dealer_token = trim(p_dealer_token)
    and r.expires_at > now()
  limit 1;

  if v_room.id is null then
    return jsonb_build_object('ok', false, 'error', 'ROOM_NOT_FOUND');
  end if;
  if v_room.status <> 'lobby' then
    return jsonb_build_object('ok', false, 'error', 'ROOM_ALREADY_STARTED');
  end if;

  select count(*) into v_count
  from public.empire_submissions s
  where s.room_id = v_room.id;

  if v_count < 2 then
    return jsonb_build_object(
      'ok', false,
      'error', 'MIN_PLAYERS',
      'count', v_count
    );
  end if;

  update public.empire_rooms
  set status = 'started'
  where id = v_room.id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'player_name', s.player_name,
        'celebrity', s.celebrity
      )
      order by s.created_at
    ),
    '[]'::jsonb
  )
  into v_submissions
  from public.empire_submissions s
  where s.room_id = v_room.id;

  return jsonb_build_object(
    'ok', true,
    'submissions', v_submissions,
    'count', v_count
  );
end;
$$;

grant execute on function public.create_empire_room() to anon, authenticated;
grant execute on function public.submit_empire_entry(text, text, text) to anon, authenticated;
grant execute on function public.fetch_empire_lobby(text) to anon, authenticated;
grant execute on function public.start_empire_game(text) to anon, authenticated;
