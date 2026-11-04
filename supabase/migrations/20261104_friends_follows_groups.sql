-- Stars & Shade: friends, follows, groups, shared daily readings. Applied through the Supabase connector.
create table if not exists public.people (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text unique not null check (handle ~ '^[a-z0-9_.]{3,24}$'),
  name text not null default '' check (char_length(name) <= 60),
  bio text not null default '' check (char_length(bio) <= 160),
  is_public boolean not null default false,
  placements jsonb,
  invite_code text unique not null default substr(md5(random()::text || clock_timestamp()::text), 1, 8),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.friendships (
  a uuid not null references public.people(id) on delete cascade,
  b uuid not null references public.people(id) on delete cascade,
  status text not null check (status in ('pending','accepted','blocked')),
  requested_by uuid not null references public.people(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (a, b), check (a < b)
);
create index if not exists friendships_b_idx on public.friendships (b);
create index if not exists friendships_req_idx on public.friendships (requested_by);
create table if not exists public.follows (
  follower uuid not null references public.people(id) on delete cascade,
  followee uuid not null references public.people(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower, followee), check (follower <> followee)
);
create index if not exists follows_followee_idx on public.follows (followee);
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  kind text not null default 'friends' check (kind in ('friends','couple','poly','family','crew','other')),
  owner uuid not null references public.people(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists groups_owner_idx on public.groups (owner);
create table if not exists public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.people(id) on delete cascade,
  status text not null default 'invited' check (status in ('invited','joined')),
  added_by uuid references public.people(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index if not exists group_members_user_idx on public.group_members (user_id);
create index if not exists group_members_added_idx on public.group_members (added_by);
create table if not exists public.readings (
  key text not null, day date not null, kind text not null check (kind in ('full','short')),
  text text not null, audio_path text, created_at timestamptz not null default now(),
  primary key (key, day, kind)
);
create table if not exists public.usage_daily (
  day date not null, user_id uuid not null, what text not null, n int not null default 0,
  primary key (day, user_id, what)
);
alter table public.people enable row level security;
alter table public.friendships enable row level security;
alter table public.follows enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.readings enable row level security;
alter table public.usage_daily enable row level security;
drop policy if exists "own card" on public.people;
create policy "own card" on public.people for select using (id = (select auth.uid()));

-- private bucket for Skye's voice readings (served by short-lived signed links)
insert into storage.buckets (id, name, public) values ('readings', 'readings', false) on conflict (id) do nothing;

create or replace function public.ss_is_friend(x uuid, y uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from friendships where a = least(x,y) and b = greatest(x,y) and status = 'accepted') $$;
create or replace function public.ss_can_see(viewer uuid, target uuid) returns boolean language sql stable security definer set search_path = public as $$
  select viewer = target or ss_is_friend(viewer, target)
    or exists(select 1 from people where id = target and is_public)
    or exists(select 1 from group_members m1 join group_members m2 on m1.group_id = m2.group_id
              where m1.user_id = viewer and m2.user_id = target and m1.status = 'joined' and m2.status = 'joined') $$;
create or replace function public.ss_card(p people, viewer uuid) returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', p.id, 'handle', p.handle, 'name', p.name, 'bio', p.bio, 'is_public', p.is_public,
    'placements', case when ss_can_see(viewer, p.id) then p.placements else null end) $$;

create or replace function public.ss_me(p_name text default null, p_placements jsonb default null, p_handle text default null, p_bio text default null, p_public boolean default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); h text; r people;
begin
  if me is null then raise exception 'sign in first'; end if;
  if not exists(select 1 from people where id = me) then
    h := lower(regexp_replace(coalesce(nullif(p_name,''), 'star'), '[^a-zA-Z0-9]', '', 'g'));
    if char_length(h) < 3 then h := h || 'star'; end if;
    h := left(h, 16);
    while exists(select 1 from people where handle = h) loop h := left(h,16) || floor(random()*9000+1000)::int; end loop;
    insert into people(id, handle, name) values (me, h, left(coalesce(p_name,''),60));
  end if;
  if p_handle is not null then
    p_handle := lower(trim(p_handle));
    if p_handle !~ '^[a-z0-9_.]{3,24}$' then raise exception 'Handles are 3 to 24 letters, numbers, _ or .'; end if;
    if exists(select 1 from people where handle = p_handle and id <> me) then raise exception 'That handle is taken'; end if;
  end if;
  update people set name = coalesce(left(p_name,60), name), placements = coalesce(p_placements, placements), handle = coalesce(p_handle, handle),
    bio = coalesce(left(p_bio,160), bio), is_public = coalesce(p_public, is_public), updated_at = now() where id = me returning * into r;
  return to_jsonb(r);
end $$;

create or replace function public.ss_invite_info(p_code text) returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('name', name, 'handle', handle) from people where invite_code = p_code $$;

create or replace function public.ss_accept_invite(p_code text) returns jsonb language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); them uuid; cur text;
begin
  if me is null then raise exception 'sign in first'; end if;
  select id into them from people where invite_code = p_code;
  if them is null then raise exception 'That invite link isn''t valid anymore'; end if;
  if them = me then return jsonb_build_object('self', true); end if;
  if not exists(select 1 from people where id = me) then perform ss_me(); end if;
  select status into cur from friendships where a = least(me,them) and b = greatest(me,them);
  if cur = 'blocked' then return jsonb_build_object('ok', false); end if;
  insert into friendships(a,b,status,requested_by) values (least(me,them), greatest(me,them), 'accepted', them)
    on conflict (a,b) do update set status = 'accepted';
  return jsonb_build_object('ok', true, 'friend', (select ss_card(p, me) from people p where id = them));
end $$;

create or replace function public.ss_friend(p_target uuid, p_action text) returns jsonb language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); x uuid; y uuid; f friendships; n int;
begin
  if me is null then raise exception 'sign in first'; end if;
  if p_target = me then raise exception 'That''s you'; end if;
  x := least(me,p_target); y := greatest(me,p_target);
  select * into f from friendships where a = x and b = y;
  if p_action = 'request' then
    select count(*) into n from friendships where requested_by = me and created_at > now() - interval '1 day';
    if n > 100 then raise exception 'That''s a lot of requests today. Try again tomorrow.'; end if;
    if f.status = 'blocked' then return jsonb_build_object('ok', false); end if;
    if f.status = 'pending' and f.requested_by <> me then update friendships set status = 'accepted' where a = x and b = y; return jsonb_build_object('status','accepted'); end if;
    insert into friendships(a,b,status,requested_by) values (x,y,'pending',me) on conflict (a,b) do nothing;
    return jsonb_build_object('status', coalesce(f.status,'pending'));
  elsif p_action = 'accept' then
    update friendships set status = 'accepted' where a = x and b = y and status = 'pending' and requested_by <> me;
    return jsonb_build_object('status','accepted');
  elsif p_action in ('decline','remove','cancel') then
    delete from friendships where a = x and b = y and status <> 'blocked';
    delete from group_members gm using groups g where gm.group_id = g.id and ((g.owner = me and gm.user_id = p_target) or (g.owner = p_target and gm.user_id = me and gm.status = 'invited'));
    return jsonb_build_object('status','none');
  elsif p_action = 'block' then
    insert into friendships(a,b,status,requested_by) values (x,y,'blocked',me) on conflict (a,b) do update set status = 'blocked', requested_by = me;
    delete from follows where (follower = me and followee = p_target) or (follower = p_target and followee = me);
    delete from group_members gm using groups g where gm.group_id = g.id and ((g.owner = me and gm.user_id = p_target) or (g.owner = p_target and gm.user_id = me));
    return jsonb_build_object('status','blocked');
  elsif p_action = 'unblock' then
    delete from friendships where a = x and b = y and status = 'blocked' and requested_by = me;
    return jsonb_build_object('status','none');
  end if;
  raise exception 'unknown action';
end $$;

create or replace function public.ss_follow(p_target uuid, p_on boolean) returns jsonb language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'sign in first'; end if;
  if p_on then
    if exists(select 1 from friendships where a = least(me,p_target) and b = greatest(me,p_target) and status = 'blocked') then return jsonb_build_object('ok', false); end if;
    if not exists(select 1 from people where id = p_target and is_public) and not ss_is_friend(me, p_target) then raise exception 'That profile is private'; end if;
    insert into follows values (me, p_target, now()) on conflict do nothing;
  else delete from follows where follower = me and followee = p_target; end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.ss_search(p_q text) returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(ss_card(p, auth.uid())), '[]'::jsonb) from (
    select * from people p where auth.uid() is not null and id <> auth.uid() and char_length(trim(p_q)) >= 2
      and (handle = lower(trim(leading '@' from trim(p_q))) or (is_public and (handle like lower(trim(leading '@' from trim(p_q))) || '%' or name ilike trim(p_q) || '%')))
      and not exists(select 1 from friendships f where f.a = least(auth.uid(), p.id) and f.b = greatest(auth.uid(), p.id) and f.status = 'blocked')
    order by (handle = lower(trim(p_q))) desc, is_public desc limit 20) p $$;

create or replace function public.ss_social() returns jsonb language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then return null; end if;
  return jsonb_build_object(
    'me', (select to_jsonb(p) from people p where id = me),
    'friends', (select coalesce(jsonb_agg(ss_card(p, me) order by p.name), '[]') from friendships f join people p on p.id = case when f.a = me then f.b else f.a end where (f.a = me or f.b = me) and f.status = 'accepted'),
    'incoming', (select coalesce(jsonb_agg(ss_card(p, me)), '[]') from friendships f join people p on p.id = f.requested_by where (f.a = me or f.b = me) and f.status = 'pending' and f.requested_by <> me),
    'outgoing', (select coalesce(jsonb_agg(ss_card(p, me)), '[]') from friendships f join people p on p.id = case when f.a = me then f.b else f.a end where (f.a = me or f.b = me) and f.status = 'pending' and f.requested_by = me),
    'following', (select coalesce(jsonb_agg(ss_card(p, me)), '[]') from follows w join people p on p.id = w.followee where w.follower = me),
    'followers', (select count(*) from follows where followee = me),
    'groups', (select coalesce(jsonb_agg(jsonb_build_object('id', g.id, 'name', g.name, 'kind', g.kind, 'owner', g.owner, 'my_status', gm.status,
        'members', (select jsonb_agg(ss_card(p, me) || jsonb_build_object('status', m.status)) from group_members m join people p on p.id = m.user_id where m.group_id = g.id))), '[]')
      from group_members gm join groups g on g.id = gm.group_id where gm.user_id = me));
end $$;

create or replace function public.ss_group(p_action text, p_group uuid default null, p_name text default null, p_kind text default null, p_members uuid[] default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); gid uuid := p_group; u uuid; n int;
begin
  if me is null then raise exception 'sign in first'; end if;
  if p_action = 'create' then
    select count(*) into n from groups where owner = me; if n >= 50 then raise exception 'You''ve made 50 groups. Delete one first.'; end if;
    insert into groups(name, kind, owner) values (left(coalesce(nullif(trim(p_name),''),'My people'),60), coalesce(p_kind,'friends'), me) returning id into gid;
    insert into group_members values (gid, me, 'joined', me, now());
    p_action := 'add';
  end if;
  if p_action = 'add' then
    if not exists(select 1 from groups where id = gid and owner = me) then raise exception 'Only the person who made the group can add people'; end if;
    foreach u in array coalesce(p_members, '{}') loop
      if ss_is_friend(me, u) then insert into group_members values (gid, u, 'invited', me, now()) on conflict do nothing; end if;
    end loop;
    select count(*) into n from group_members where group_id = gid; if n > 20 then raise exception 'Groups max out at 20 people'; end if;
  elsif p_action = 'join' then update group_members set status = 'joined' where group_id = gid and user_id = me;
  elsif p_action = 'leave' then delete from group_members where group_id = gid and user_id = me;
    if not exists(select 1 from group_members where group_id = gid and status = 'joined') then delete from groups where id = gid; end if;
  elsif p_action = 'remove' then
    if not exists(select 1 from groups where id = gid and owner = me) then raise exception 'Only the person who made the group can remove people'; end if;
    delete from group_members where group_id = gid and user_id = any(p_members) and user_id <> me;
  elsif p_action = 'rename' then update groups set name = left(p_name,60), kind = coalesce(p_kind, kind) where id = gid and owner = me;
  elsif p_action = 'delete' then delete from groups where id = gid and owner = me;
  end if;
  return jsonb_build_object('id', gid);
end $$;

revoke all on function public.ss_is_friend(uuid,uuid), public.ss_can_see(uuid,uuid), public.ss_card(people,uuid) from public, anon, authenticated;
revoke execute on function public.ss_invite_info(text) from public;
grant execute on function public.ss_invite_info(text) to anon, authenticated;
revoke execute on function public.ss_me(text,jsonb,text,text,boolean), public.ss_accept_invite(text), public.ss_friend(uuid,text), public.ss_follow(uuid,boolean), public.ss_search(text), public.ss_social(), public.ss_group(text,uuid,text,text,uuid[]) from public, anon;
grant execute on function public.ss_me(text,jsonb,text,text,boolean), public.ss_accept_invite(text), public.ss_friend(uuid,text), public.ss_follow(uuid,boolean), public.ss_search(text), public.ss_social(), public.ss_group(text,uuid,text,text,uuid[]) to authenticated;
