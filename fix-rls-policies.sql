-- =========================================
-- FIX RLS POLICIES FOR THOUGHTS TABLE
-- Based on Context7 Supabase best practices
-- =========================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert own thoughts" ON thoughts;
DROP POLICY IF EXISTS "Users can select own thoughts" ON thoughts;
DROP POLICY IF EXISTS "Users can update own thoughts" ON thoughts;
DROP POLICY IF EXISTS "Users can delete own thoughts" ON thoughts;

-- Enable RLS (in case it's not enabled)
ALTER TABLE thoughts ENABLE ROW LEVEL SECURITY;

-- =========================================
-- INSERT POLICY (uses WITH CHECK)
-- =========================================
CREATE POLICY "Users can insert own thoughts"
ON thoughts
FOR INSERT
TO authenticated
WITH CHECK ( (SELECT auth.uid()) = user_id );

-- =========================================
-- SELECT POLICY (uses USING)
-- =========================================
CREATE POLICY "Users can select own thoughts"
ON thoughts
FOR SELECT
TO authenticated
USING ( (SELECT auth.uid()) = user_id );

-- =========================================
-- UPDATE POLICY (uses USING)
-- =========================================
CREATE POLICY "Users can update own thoughts"
ON thoughts
FOR UPDATE
TO authenticated
USING ( (SELECT auth.uid()) = user_id );

-- =========================================
-- DELETE POLICY (uses USING)
-- =========================================
CREATE POLICY "Users can delete own thoughts"
ON thoughts
FOR DELETE
TO authenticated
USING ( (SELECT auth.uid()) = user_id );

-- =========================================
-- VERIFY POLICIES
-- =========================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'thoughts'
ORDER BY cmd;
