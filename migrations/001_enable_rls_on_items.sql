-- 1) Enable RLS
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- 2) Ensure no public grants on the table (revoke broad access)
REVOKE ALL ON public.items FROM PUBLIC;
REVOKE ALL ON public.items FROM anon;
-- Keep service_role owning access (service_role bypasses RLS)

-- 3) Create clear policies (use SELECT auth.uid() for better plan caching)
CREATE POLICY items_select_own ON public.items
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY items_insert_own ON public.items
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY items_update_own ON public.items
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY items_delete_own ON public.items
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- 4) Indexes for performance
CREATE INDEX IF NOT EXISTS idx_items_user_id ON public.items(user_id);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_items_user_is_read ON public.items(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_items_user_is_favorite ON public.items(user_id, is_favorite);
CREATE INDEX IF NOT EXISTS idx_items_user_created_at ON public.items(user_id, created_at DESC);

-- 5) Grants: allow basic usage on the schema and explicit minimal table grants
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.items TO authenticated;
