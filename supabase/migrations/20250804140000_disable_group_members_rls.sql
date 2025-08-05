-- Temporary fix: Disable RLS on group_members to stop infinite recursion
-- We can re-enable with proper policies later once the app is working

-- Drop ALL policies on group_members
DROP POLICY IF EXISTS "Users can view group members" ON public.group_members;
DROP POLICY IF EXISTS "Users can manage group members" ON public.group_members;
DROP POLICY IF EXISTS "Users can view own membership" ON public.group_members;
DROP POLICY IF EXISTS "Group owners can manage all members" ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups themselves" ON public.group_members;
DROP POLICY IF EXISTS "Users can update own membership status" ON public.group_members;

-- Temporarily disable RLS on group_members to stop recursion
ALTER TABLE public.group_members DISABLE ROW LEVEL SECURITY;

-- Keep RLS enabled on other tables with simpler, working policies
-- Categories - simple user-based policy
DROP POLICY IF EXISTS "Users can manage their categories" ON public.categories;
CREATE POLICY "Users can manage their categories" ON public.categories FOR ALL USING (
  user_id = auth.uid()
);

-- Transactions - simple user-based policy  
DROP POLICY IF EXISTS "Users can manage their transactions" ON public.transactions;
CREATE POLICY "Users can manage their transactions" ON public.transactions FOR ALL USING (
  user_id = auth.uid()
);

-- Budget plans - simple user-based policy
DROP POLICY IF EXISTS "Users can manage their budget plans" ON public.budget_plans;
CREATE POLICY "Users can manage their budget plans" ON public.budget_plans FOR ALL USING (
  user_id = auth.uid()
);

-- User profiles - simple user-based policy
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.user_profiles;
CREATE POLICY "Users can manage their own profile" ON public.user_profiles FOR ALL USING (
  id = auth.uid()
);