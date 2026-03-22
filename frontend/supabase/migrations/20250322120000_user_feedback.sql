-- User feedback and reviews (persisted in Supabase)
-- Run via Supabase CLI or SQL Editor: Dashboard → SQL → New query

create table if not exists public.user_feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(trim(name)) > 0 and char_length(name) <= 200),
  rating smallint not null check (rating between 1 and 5),
  message text not null check (char_length(trim(message)) > 0 and char_length(message) <= 4000)
);

comment on table public.user_feedback is 'Visitor feedback and star ratings from the Hijli Story Cubes experience.';

create index if not exists user_feedback_created_at_idx on public.user_feedback (created_at desc);

alter table public.user_feedback enable row level security;

-- Anonymous players can submit feedback only (no public reads)
create policy "user_feedback_insert_anon"
  on public.user_feedback
  for insert
  to anon
  with check (true);

create policy "user_feedback_insert_authenticated"
  on public.user_feedback
  for insert
  to authenticated
  with check (true);
