-- Supabase > SQL Editor에서 이 파일 전체를 한 번 실행하세요.
create table if not exists public.room_messages (
 id uuid primary key default gen_random_uuid(),
 author text not null check(author in ('건호','주훈')),
 kind text not null check(kind in ('diary','photo','quote','music')),
 text text not null default '' check(length(text)<=5000),
 image text check(image is null or length(image)<=400000),
 created_at timestamptz not null default clock_timestamp()
);
create index if not exists room_messages_time on public.room_messages(created_at desc,id desc);
create table if not exists public.room_guest_messages (
 id uuid primary key default gen_random_uuid(),
 author text not null check(length(author) between 1 and 24),
 text text not null check(length(text) between 1 and 2000),
 created_at timestamptz not null default clock_timestamp()
);
create index if not exists room_guests_time on public.room_guest_messages(created_at desc,id desc);
create table if not exists public.room_login_limits (
 key text primary key,
 attempts integer not null default 1,
 window_start timestamptz not null default now()
);
alter table public.room_messages enable row level security;
alter table public.room_guest_messages enable row level security;
alter table public.room_login_limits enable row level security;
revoke all on public.room_messages,public.room_guest_messages,public.room_login_limits from anon,authenticated;
grant select,insert,update,delete on public.room_messages,public.room_guest_messages,public.room_login_limits to service_role;
create or replace function public.room_login_attempt(p_key text)
returns boolean language plpgsql security invoker set search_path = public as $$
declare hits integer;
begin
 delete from public.room_login_limits where window_start < now()-interval '1 day';
 insert into public.room_login_limits(key,attempts,window_start) values(p_key,1,now())
 on conflict(key) do update set
 attempts = case when room_login_limits.window_start < now()-interval '15 minutes' then 1 else room_login_limits.attempts+1 end,
 window_start = case when room_login_limits.window_start < now()-interval '15 minutes' then now() else room_login_limits.window_start end
 returning attempts into hits;
 return hits <= 10;
end;
$$;
revoke all on function public.room_login_attempt(text) from public,anon,authenticated;
grant execute on function public.room_login_attempt(text) to service_role;

-- Both member profile photos. Available only through the authenticated server API.
create table if not exists public.room_member_profiles (
 name text primary key check(name in ('건호','주훈')),
 avatar text check(avatar is null or length(avatar)<=200000)
);
alter table public.room_member_profiles enable row level security;
revoke all on public.room_member_profiles from anon,authenticated;
grant select,insert,update,delete on public.room_member_profiles to service_role;
insert into public.room_member_profiles(name) values ('건호'),('주훈') on conflict(name) do nothing;
