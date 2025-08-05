-- Fix foreign key relationship between group_members and expense_groups
ALTER TABLE group_members ADD CONSTRAINT fk_group_members_group_id 
FOREIGN KEY (group_id) REFERENCES expense_groups(id) ON DELETE CASCADE;

-- Create security definer function to avoid infinite recursion in RLS policies
CREATE OR REPLACE FUNCTION public.get_user_group_memberships(user_uuid UUID)
RETURNS TABLE (group_id UUID, status TEXT, role TEXT) AS $$
BEGIN
  RETURN QUERY 
  SELECT gm.group_id, gm.status, gm.role
  FROM group_members gm
  WHERE gm.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Fix the group_members RLS policy to avoid infinite recursion
DROP POLICY IF EXISTS "Users can manage group members" ON group_members;
DROP POLICY IF EXISTS "Users can view group members" ON group_members;

CREATE POLICY "Users can manage group members" ON group_members
FOR ALL USING (
  (group_id IN (SELECT id FROM expense_groups WHERE owner_id = auth.uid())) OR 
  (user_id = auth.uid()) OR 
  (invited_by = auth.uid())
);

CREATE POLICY "Users can view group members" ON group_members
FOR SELECT USING (
  (group_id IN (SELECT id FROM expense_groups WHERE owner_id = auth.uid())) OR
  (user_id = auth.uid()) OR
  (invited_by = auth.uid()) OR
  (group_id IN (SELECT group_id FROM public.get_user_group_memberships(auth.uid()) WHERE status = 'accepted'))
);