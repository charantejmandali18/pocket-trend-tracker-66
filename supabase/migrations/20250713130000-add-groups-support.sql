-- Add Groups Support for Family/Shared Expense Tracking

-- Groups table for family/shared expense tracking
CREATE TABLE public.expense_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL,
  group_code TEXT UNIQUE DEFAULT SUBSTRING(gen_random_uuid()::text, 1, 8),
  currency TEXT DEFAULT 'INR',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Group members table
CREATE TABLE public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.expense_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  joined_at TIMESTAMP WITH TIME ZONE,
  invited_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- User profiles table (extend auth.users)
CREATE TABLE public.user_profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  default_group_id UUID REFERENCES public.expense_groups(id),
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Update categories table to support groups and custom categories
ALTER TABLE public.categories ADD COLUMN group_id UUID REFERENCES public.expense_groups(id);
ALTER TABLE public.categories ADD COLUMN created_by UUID;
ALTER TABLE public.categories ALTER COLUMN is_system SET DEFAULT false;

-- Update budget_plans table to support groups
ALTER TABLE public.budget_plans ADD COLUMN group_id UUID REFERENCES public.expense_groups(id);
ALTER TABLE public.budget_plans ADD COLUMN created_by UUID;

-- Update transactions table to support groups
ALTER TABLE public.transactions ADD COLUMN group_id UUID REFERENCES public.expense_groups(id);
ALTER TABLE public.transactions ADD COLUMN created_by UUID;

-- Update accounts table to support groups
ALTER TABLE public.accounts ADD COLUMN group_id UUID REFERENCES public.expense_groups(id);

-- Update recurring_templates table to support groups
ALTER TABLE public.recurring_templates ADD COLUMN group_id UUID REFERENCES public.expense_groups(id);

-- Group invitations table for email invites
CREATE TABLE public.group_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.expense_groups(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID NOT NULL,
  token TEXT UNIQUE DEFAULT gen_random_uuid(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, email)
);

-- Import logs table for tracking data imports
CREATE TABLE public.import_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  group_id UUID REFERENCES public.expense_groups(id),
  import_type TEXT NOT NULL CHECK (import_type IN ('individual', 'group')),
  file_name TEXT NOT NULL,
  total_rows INTEGER DEFAULT 0,
  successful_rows INTEGER DEFAULT 0,
  failed_rows INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]',
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.expense_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Groups
CREATE POLICY "Users can view groups they belong to" ON public.expense_groups FOR SELECT USING (
  id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid() AND status = 'accepted')
  OR owner_id = auth.uid()
);

CREATE POLICY "Users can create groups" ON public.expense_groups FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Group owners can update their groups" ON public.expense_groups FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Group owners can delete their groups" ON public.expense_groups FOR DELETE USING (owner_id = auth.uid());

-- RLS Policies for Group Members
CREATE POLICY "Users can view group members" ON public.group_members FOR SELECT USING (
  group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid() AND status = 'accepted')
  OR user_id = auth.uid()
);

CREATE POLICY "Group owners and admins can manage members" ON public.group_members FOR ALL USING (
  group_id IN (
    SELECT g.id FROM public.expense_groups g 
    WHERE g.owner_id = auth.uid()
  ) OR
  group_id IN (
    SELECT gm.group_id FROM public.group_members gm 
    WHERE gm.user_id = auth.uid() AND gm.role IN ('owner', 'admin') AND gm.status = 'accepted'
  )
);

-- RLS Policies for User Profiles
CREATE POLICY "Users can view their own profile" ON public.user_profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can create their own profile" ON public.user_profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "Users can update their own profile" ON public.user_profiles FOR UPDATE USING (id = auth.uid());

-- Update existing RLS policies to support groups
DROP POLICY IF EXISTS "Users can manage their categories" ON public.categories;
CREATE POLICY "Users can manage their categories" ON public.categories FOR ALL USING (
  (group_id IS NULL AND auth.uid() = user_id) OR
  (group_id IS NOT NULL AND group_id IN (
    SELECT group_id FROM public.group_members WHERE user_id = auth.uid() AND status = 'accepted'
  ))
);

DROP POLICY IF EXISTS "Users can manage their budget plans" ON public.budget_plans;
CREATE POLICY "Users can manage their budget plans" ON public.budget_plans FOR ALL USING (
  (group_id IS NULL AND auth.uid() = user_id) OR
  (group_id IS NOT NULL AND group_id IN (
    SELECT group_id FROM public.group_members WHERE user_id = auth.uid() AND status = 'accepted'
  ))
);

DROP POLICY IF EXISTS "Users can manage their transactions" ON public.transactions;
CREATE POLICY "Users can manage their transactions" ON public.transactions FOR ALL USING (
  (group_id IS NULL AND auth.uid() = user_id) OR
  (group_id IS NOT NULL AND group_id IN (
    SELECT group_id FROM public.group_members WHERE user_id = auth.uid() AND status = 'accepted'
  ))
);

-- Insert default system categories for all users
DELETE FROM public.categories WHERE is_system = true;
INSERT INTO public.categories (user_id, name, color, icon, is_system) VALUES
  (gen_random_uuid(), 'Food & Dining', '#EF4444', 'utensils', true),
  (gen_random_uuid(), 'Transportation', '#3B82F6', 'car', true),
  (gen_random_uuid(), 'Shopping', '#8B5CF6', 'shopping-bag', true),
  (gen_random_uuid(), 'Entertainment', '#F59E0B', 'film', true),
  (gen_random_uuid(), 'Bills & Utilities', '#10B981', 'receipt', true),
  (gen_random_uuid(), 'Healthcare', '#EC4899', 'heart', true),
  (gen_random_uuid(), 'Education', '#6366F1', 'book', true),
  (gen_random_uuid(), 'Income', '#059669', 'trending-up', true),
  (gen_random_uuid(), 'Investment', '#7C3AED', 'trending-up', true),
  (gen_random_uuid(), 'Other', '#6B7280', 'more-horizontal', true);

-- Function to create user profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile after user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update triggers for updated_at
CREATE TRIGGER update_expense_groups_updated_at BEFORE UPDATE ON public.expense_groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();