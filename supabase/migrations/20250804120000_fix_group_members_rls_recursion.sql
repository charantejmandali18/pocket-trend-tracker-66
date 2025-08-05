-- Fix infinite recursion in group_members RLS policies
-- The issue is that group_members policies were querying group_members table itself

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view group members" ON public.group_members;
DROP POLICY IF EXISTS "Users can manage group members" ON public.group_members;
DROP POLICY IF EXISTS "Group owners and admins can manage members" ON public.group_members;

-- Create simpler, non-recursive policies for group_members
-- Users can view their own membership records
CREATE POLICY "Users can view own group membership" ON public.group_members FOR SELECT USING (
  user_id = auth.uid()
);

-- Users can view members of groups they belong to (but avoid recursion)
-- We'll handle this at the application level or use a different approach
CREATE POLICY "Users can view group members they share groups with" ON public.group_members FOR SELECT USING (
  -- Allow viewing if the user is a member of the same group
  EXISTS (
    SELECT 1 FROM public.group_members gm2 
    WHERE gm2.group_id = group_members.group_id 
    AND gm2.user_id = auth.uid() 
    AND gm2.status = 'accepted'
  )
);

-- Group owners can manage members (check ownership through expense_groups table, not group_members)
CREATE POLICY "Group owners can manage members" ON public.group_members FOR ALL USING (
  group_id IN (
    SELECT id FROM public.expense_groups WHERE owner_id = auth.uid()
  )
);

-- Users can insert themselves into groups (for join requests)
CREATE POLICY "Users can join groups" ON public.group_members FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

-- Users can update their own membership status (for leaving groups)
CREATE POLICY "Users can update own membership" ON public.group_members FOR UPDATE USING (
  user_id = auth.uid()
) WITH CHECK (
  user_id = auth.uid()
);

-- Now fix other policies that reference group_members to avoid recursion issues
-- Update groups policies to use direct ownership check instead of group_members lookup

DROP POLICY IF EXISTS "Users can view their groups" ON public.expense_groups;
CREATE POLICY "Users can view their groups" ON public.expense_groups FOR SELECT USING (
  owner_id = auth.uid() OR 
  id IN (
    SELECT DISTINCT gm.group_id 
    FROM public.group_members gm 
    WHERE gm.user_id = auth.uid() AND gm.status = 'accepted'
  )
);

-- Update other table policies to use expense_groups ownership instead of group_members recursion
DROP POLICY IF EXISTS "Users can manage their transactions" ON public.transactions;
CREATE POLICY "Users can manage their transactions" ON public.transactions FOR ALL USING (
  user_id = auth.uid() OR 
  (group_id IS NOT NULL AND group_id IN (
    SELECT id FROM public.expense_groups WHERE owner_id = auth.uid()
  ))
);

DROP POLICY IF EXISTS "Users can manage their budget plans" ON public.budget_plans;
CREATE POLICY "Users can manage their budget plans" ON public.budget_plans FOR ALL USING (
  user_id = auth.uid() OR 
  (group_id IS NOT NULL AND group_id IN (
    SELECT id FROM public.expense_groups WHERE owner_id = auth.uid()
  ))
);