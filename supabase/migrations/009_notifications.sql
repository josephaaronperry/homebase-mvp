-- Notifications table: ensure columns id, user_id, type, title, body, read, link, created_at
-- (Table may already exist from base schema; add missing columns if needed.)

do $$
begin
  if not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'notifications') then
    create table public.notifications (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references auth.users(id) on delete cascade,
      type text not null,
      title text not null,
      body text not null,
      read boolean default false,
      link text,
      created_at timestamptz default now()
    );
    create index notifications_user_id_idx on public.notifications(user_id);
    create index notifications_created_at_idx on public.notifications(created_at desc);
    alter table public.notifications enable row level security;
    create policy "Users read own notifications" on public.notifications for select to authenticated using (auth.uid() = user_id);
    create policy "Users update own notifications" on public.notifications for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
  else
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'notifications' and column_name = 'type') then
      alter table public.notifications add column type text default 'general';
    end if;
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'notifications' and column_name = 'link') then
      alter table public.notifications add column link text;
    end if;
  end if;
end $$;
