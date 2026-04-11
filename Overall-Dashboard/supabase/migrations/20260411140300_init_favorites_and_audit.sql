-- ============================================================
-- Overall Dashboard — favorites + audit log
-- ============================================================

create table public.tool_favorites (
  user_id    uuid not null references auth.users(id) on delete cascade,
  tool_id    uuid not null references public.tools(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, tool_id)
);

comment on table public.tool_favorites is
  'Per-user pinned tools (many-to-many).';

alter table public.tool_favorites enable row level security;
revoke all on public.tool_favorites from anon;

create table public.audit_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  tool_id    uuid references public.tools(id) on delete set null,
  action     text not null check (action in ('open','favorite','unfavorite','login')),
  metadata   jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_user_created_idx
  on public.audit_logs (user_id, created_at desc);

alter table public.audit_logs enable row level security;
revoke all on public.audit_logs from anon;
