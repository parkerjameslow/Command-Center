-- Command Center Database Schema
-- Run this in your Supabase SQL Editor (supabase.com > project > SQL Editor)

-- Enable Row Level Security on all tables
-- Users get automatic auth via Supabase Auth

-- Habits
create table habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  domain text not null check (domain in ('personal', 'family', 'work', 'growth', 'balance')),
  frequency text not null default 'daily' check (frequency in ('daily', 'weekly')),
  created_at timestamptz default now()
);

alter table habits enable row level security;
create policy "Users manage own habits" on habits for all using (auth.uid() = user_id);

-- Habit Logs
create table habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  habit_id uuid references habits(id) on delete cascade not null,
  date date not null,
  completed boolean default false,
  unique(habit_id, date)
);

alter table habit_logs enable row level security;
create policy "Users manage own habit_logs" on habit_logs for all using (auth.uid() = user_id);

-- Tasks
create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  domain text not null check (domain in ('personal', 'family', 'work', 'growth', 'balance')),
  priority text not null default 'medium' check (priority in ('high', 'medium', 'low')),
  completed boolean default false,
  due_date date,
  created_at timestamptz default now()
);

alter table tasks enable row level security;
create policy "Users manage own tasks" on tasks for all using (auth.uid() = user_id);

-- Goals
create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  domain text not null check (domain in ('personal', 'family', 'work', 'growth', 'balance')),
  target_value numeric not null,
  current_value numeric default 0,
  unit text default 'units',
  deadline date,
  created_at timestamptz default now()
);

alter table goals enable row level security;
create policy "Users manage own goals" on goals for all using (auth.uid() = user_id);

-- Journal Entries
create table journal (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  type text not null check (type in ('morning', 'evening', 'note')),
  mood integer check (mood between 1 and 5),
  energy integer check (energy between 1 and 5),
  gratitude text[],
  wins text[],
  challenges text[],
  content text,
  ai_response text,
  created_at timestamptz default now()
);

alter table journal enable row level security;
create policy "Users manage own journal" on journal for all using (auth.uid() = user_id);

-- Family Events
create table family_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  person text,
  date date not null,
  time time,
  type text default 'activity' check (type in ('sport', 'school', 'appointment', 'activity', 'other')),
  notes text,
  created_at timestamptz default now()
);

alter table family_events enable row level security;
create policy "Users manage own family_events" on family_events for all using (auth.uid() = user_id);

-- Finance Entries
create table finance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('income', 'expense')),
  amount numeric not null,
  category text,
  description text,
  date date not null,
  created_at timestamptz default now()
);

alter table finance enable row level security;
create policy "Users manage own finance" on finance for all using (auth.uid() = user_id);

-- Create indexes for common queries
create index idx_habits_user on habits(user_id);
create index idx_habit_logs_user_date on habit_logs(user_id, date);
create index idx_tasks_user on tasks(user_id);
create index idx_goals_user on goals(user_id);
create index idx_journal_user_date on journal(user_id, date);
create index idx_family_events_user_date on family_events(user_id, date);
create index idx_finance_user_date on finance(user_id, date);
