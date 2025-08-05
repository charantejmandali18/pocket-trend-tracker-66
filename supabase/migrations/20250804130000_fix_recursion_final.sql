-- Final fix for RLS recursion - completely remove recursive policies
-- and use application-level filtering instead for complex group membership queries

-- Drop ALL policies on group_members to stop recursion
DROP POLICY IF EXISTS "Users can view own group membership" ON public.group_members;
DROP POLICY IF EXISTS "Users can view group members they share groups with" ON public.group_members;
DROP POLICY IF EXISTS "Group owners can manage members" ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can update own membership" ON public.group_members;

-- Create simple, non-recursive policies for group_members
-- Policy 1: Users can always see their own membership records
CREATE POLICY "Users can view own membership" ON public.group_members FOR SELECT USING (
  user_id = auth.uid()
);

-- Policy 2: Group owners can manage all members in their groups
CREATE POLICY "Group owners can manage all members" ON public.group_members FOR ALL USING (
  group_id IN (
    SELECT id FROM public.expense_groups WHERE owner_id = auth.uid()
  )
);

-- Policy 3: Users can insert membership records for themselves (join requests)
CREATE POLICY "Users can join groups themselves" ON public.group_members FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

-- Policy 4: Users can update their own membership status
CREATE POLICY "Users can update own membership status" ON public.group_members FOR UPDATE USING (
  user_id = auth.uid()
) WITH CHECK (
  user_id = auth.uid()
);

-- For viewing other members in the same group, we'll handle this at the application level
-- by first checking what groups the user belongs to, then querying members of those groups

-- Also ensure the foreign key constraint exists for transactions -> categories
-- (This should already exist from the original migration, but let's make sure)
DO $$ 
BEGIN
    -- Check if the foreign key constraint exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'transactions_category_id_fkey'
        AND table_name = 'transactions'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        -- Add the foreign key constraint if it doesn't exist
        ALTER TABLE public.transactions 
        ADD CONSTRAINT transactions_category_id_fkey 
        FOREIGN KEY (category_id) REFERENCES public.categories(id);
    END IF;
END $$;