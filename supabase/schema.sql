create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  email text not null unique,
  password_hash text not null,
  xp integer not null default 0,
  rank text not null default 'E',
  onboarding_completed boolean not null default false,
  onboarding_data jsonb not null default '{}'::jsonb,
  theme text not null default 'cyan',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  friend_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint friendships_no_self check (user_id <> friend_id),
  unique(user_id, friend_id)
);

create table if not exists public.password_reset_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  email text,
  code text,
  code_hash text not null,
  expires_at timestamptz not null,
  used boolean not null default false,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  category text not null,
  target_value int not null default 1,
  target_unit text not null default 'check',
  xp_reward int not null default 10,
  coin_reward int not null default 0,
  required boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.habit_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  habit_id uuid references public.habits(id) on delete set null,
  checkin_date date not null default current_date,
  completed boolean not null default false,
  value int not null default 0,
  xp_earned int not null default 0,
  created_at timestamptz not null default now(),
  unique(user_id, habit_id, checkin_date)
);

create table if not exists public.daily_quest_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  quest_date date not null default current_date,
  completed boolean not null default false,
  total_xp int not null default 0,
  total_coins int not null default 0,
  valid_day boolean not null default false,
  perfect_day boolean not null default false,
  penalty_applied boolean not null default false,
  last_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, quest_date)
);

create table if not exists public.diary_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  entry_date date not null default current_date,
  content text not null,
  mood int not null check (mood between 1 and 10),
  progress int not null default 0 check (progress between 0 and 100),
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, entry_date)
);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.social_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  usage_date date not null default current_date,
  app_name text not null,
  minutes_spent int not null check (minutes_spent >= 0),
  screenshot_url text,
  notes text,
  source text not null default 'manual',
  created_at timestamptz not null default now()
);

create index if not exists idx_diary_entries_user_date on public.diary_entries(user_id, entry_date desc);
create index if not exists idx_users_rank_xp on public.users(rank, xp desc);
create index if not exists idx_users_xp on public.users(xp desc);
create index if not exists idx_friendships_user_status on public.friendships(user_id, status);
create index if not exists idx_friendships_friend_status on public.friendships(friend_id, status);
create index if not exists idx_password_reset_codes_email on public.password_reset_codes(email, created_at desc);
create index if not exists idx_habit_checkins_user_date on public.habit_checkins(user_id, checkin_date desc);
create index if not exists idx_daily_quest_logs_user_date on public.daily_quest_logs(user_id, quest_date desc);
create index if not exists idx_social_usage_user_date on public.social_usage_logs(user_id, usage_date desc);
create index if not exists idx_ai_messages_user_date on public.ai_messages(user_id, created_at desc);

alter table public.users enable row level security;
alter table public.friendships enable row level security;
alter table public.password_reset_codes enable row level security;
alter table public.habits enable row level security;
alter table public.habit_checkins enable row level security;
alter table public.daily_quest_logs enable row level security;
alter table public.diary_entries enable row level security;
alter table public.ai_messages enable row level security;
alter table public.social_usage_logs enable row level security;
