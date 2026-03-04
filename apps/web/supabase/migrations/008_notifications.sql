create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  type text not null,
  title text not null,
  body text not null,
  read boolean default false,
  link text,
  created_at timestamptz default now()
);
alter table public.notifications enable row level security;
create policy "Users can manage own notifications" on public.notifications
  for all using (auth.uid() = user_id);
