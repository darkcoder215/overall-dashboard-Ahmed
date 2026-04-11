-- ============================================================
-- Overall Dashboard — optimized RLS policies + FK indexes
-- Follows Supabase best practices:
--  · wrap auth.uid() / is_admin() in (select ...) so they are
--    init-planned once per query instead of once per row
--  · a single permissive SELECT policy per (table, role) to
--    avoid multiple-permissive-policy overhead
--  · explicit covering indexes on every foreign key
-- ============================================================

-- ── profiles ─────────────────────────────────────────────────
create policy "profiles_select"
  on public.profiles
  for select
  to authenticated
  using (
    id = (select auth.uid())
    or (select public.is_admin())
  );

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (
    id = (select auth.uid())
    and role = (
      select p.role from public.profiles p where p.id = (select auth.uid())
    )
  );

-- ── tools ────────────────────────────────────────────────────
create policy "tools_select"
  on public.tools
  for select
  to authenticated
  using (
    enabled = true
    or (select public.is_admin())
  );

create policy "tools_insert_admin"
  on public.tools
  for insert
  to authenticated
  with check ((select public.is_admin()));

create policy "tools_update_admin"
  on public.tools
  for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "tools_delete_admin"
  on public.tools
  for delete
  to authenticated
  using ((select public.is_admin()));

-- ── tool_favorites ───────────────────────────────────────────
create policy "favorites_select_own"
  on public.tool_favorites
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "favorites_insert_own"
  on public.tool_favorites
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "favorites_delete_own"
  on public.tool_favorites
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

create index if not exists tool_favorites_tool_id_idx
  on public.tool_favorites (tool_id);

-- ── audit_logs ───────────────────────────────────────────────
create policy "audit_insert_own"
  on public.audit_logs
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

-- Single SELECT policy covers both user-sees-own and admin-sees-all.
create policy "audit_select"
  on public.audit_logs
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or (select public.is_admin())
  );

-- Nobody can update/delete audit rows (append-only; no policy = deny).

create index if not exists audit_logs_tool_id_idx
  on public.audit_logs (tool_id);
