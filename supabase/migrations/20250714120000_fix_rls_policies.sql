-- Fix RLS Policies and Foreign Key Issues

-- First, ensure all necessary foreign key constraints exist
DO $$
BEGIN
    -- Add foreign key constraints if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'categories_group_id_fkey' AND table_name = 'categories'
    ) THEN
        ALTER TABLE public.categories 
        ADD CONSTRAINT categories_group_id_fkey 
        FOREIGN KEY (group_id) REFERENCES public.expense_groups(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'transactions_group_id_fkey' AND table_name = 'transactions'
    ) THEN
        ALTER TABLE public.transactions 
        ADD CONSTRAINT transactions_group_id_fkey 
        FOREIGN KEY (group_id) REFERENCES public.expense_groups(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'transactions_category_id_fkey' AND table_name = 'transactions'
    ) THEN
        ALTER TABLE public.transactions 
        ADD CONSTRAINT transactions_category_id_fkey 
        FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Fix Group Members RLS policies - the status should be 'accepted' not 'active'
DROP POLICY IF EXISTS "Users can view group members" ON public.group_members;
CREATE POLICY "Users can view group members" ON public.group_members FOR SELECT USING (
  group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid() AND status = 'accepted')
  OR user_id = auth.uid()
  OR group_id IN (SELECT id FROM public.expense_groups WHERE owner_id = auth.uid())
);

-- Allow users to insert themselves as group members when joining
DROP POLICY IF EXISTS "Group owners and admins can manage members" ON public.group_members;
CREATE POLICY "Users can manage group members" ON public.group_members FOR ALL USING (
  group_id IN (SELECT id FROM public.expense_groups WHERE owner_id = auth.uid())
  OR user_id = auth.uid()
  OR invited_by = auth.uid()
);

-- Fix expense_groups policies to be more permissive for creation
DROP POLICY IF EXISTS "Users can create groups" ON public.expense_groups;
CREATE POLICY "Users can create groups" ON public.expense_groups FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can view groups they belong to" ON public.expense_groups;
CREATE POLICY "Users can view groups they belong to" ON public.expense_groups FOR SELECT USING (
  id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid() AND status = 'accepted')
  OR owner_id = auth.uid()
);

-- Fix user_profiles policies to allow profile creation
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;

CREATE POLICY "Users can manage their own profile" ON public.user_profiles FOR ALL USING (id = auth.uid());

-- Fix categories policies to handle group relationships properly
DROP POLICY IF EXISTS "Users can manage their categories" ON public.categories;
CREATE POLICY "Users can manage their categories" ON public.categories FOR ALL USING (
  (group_id IS NULL AND auth.uid() = user_id) OR
  (group_id IS NOT NULL AND (
    group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid() AND status = 'accepted') OR
    group_id IN (SELECT id FROM public.expense_groups WHERE owner_id = auth.uid())
  ))
);

-- Fix transactions policies to handle group relationships properly  
DROP POLICY IF EXISTS "Users can manage their transactions" ON public.transactions;
CREATE POLICY "Users can manage their transactions" ON public.transactions FOR ALL USING (
  (group_id IS NULL AND auth.uid() = user_id) OR
  (group_id IS NOT NULL AND (
    group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid() AND status = 'accepted') OR
    group_id IN (SELECT id FROM public.expense_groups WHERE owner_id = auth.uid())
  )) OR
  auth.uid() = created_by
);

-- Add member_email column to transactions if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'member_email'
    ) THEN
        ALTER TABLE public.transactions ADD COLUMN member_email TEXT;
    END IF;
END $$;

-- Create default categories for current authenticated users
INSERT INTO public.categories (user_id, name, color, icon, is_system)
SELECT 
    auth.uid(),
    unnest(ARRAY['Food & Dining', 'Transportation', 'Bills & Utilities', 'Entertainment', 'Healthcare', 'Education', 'Income', 'Other']),
    unnest(ARRAY['#EF4444', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B', '#059669', '#6B7280']),
    unnest(ARRAY['utensils', 'car', 'receipt', 'film', 'heart', 'book', 'trending-up', 'tag']),
    true
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;