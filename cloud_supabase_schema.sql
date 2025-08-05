-- Complete Database Schema for Cloud Supabase
-- Run this in your Supabase SQL Editor: https://app.supabase.com/project/eideyzrojfkkqyajlbyw/sql

-- Categories table for expense classification
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT 'circle',
  parent_id UUID REFERENCES public.categories(id),
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  group_id UUID,
  created_by UUID
);

-- Budget plans table (monthly budgets)
CREATE TABLE IF NOT EXISTS public.budget_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  month_year DATE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Monthly Budget',
  total_income_planned DECIMAL(12,2) DEFAULT 0,
  total_expenses_planned DECIMAL(12,2) DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  group_id UUID,
  created_by UUID,
  UNIQUE(user_id, month_year)
);

-- Budget items (planned income/expenses by category)
CREATE TABLE IF NOT EXISTS public.budget_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_plan_id UUID NOT NULL REFERENCES public.budget_plans(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id),
  item_type TEXT NOT NULL CHECK (item_type IN ('income', 'expense')),
  name TEXT NOT NULL,
  planned_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Transactions table (actual income/expenses)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  budget_item_id UUID REFERENCES public.budget_items(id),
  category_id UUID NOT NULL REFERENCES public.categories(id),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense')),
  amount DECIMAL(12,2) NOT NULL,
  description TEXT NOT NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  account_name TEXT,
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'upi', 'other')),
  is_recurring BOOLEAN DEFAULT false,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'gmail', 'bank_api', 'csv_import')),
  external_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  group_id UUID,
  created_by UUID,
  member_email TEXT
);

-- Accounts table (bank accounts, cards, wallets)
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('bank', 'credit_card', 'wallet', 'investment', 'other')),
  balance DECIMAL(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  is_active BOOLEAN DEFAULT true,
  bank_name TEXT,
  account_number_masked TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  group_id UUID
);

-- Expense Groups table for family/shared expense tracking
CREATE TABLE IF NOT EXISTS public.expense_groups (
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

-- Group members table (no recursive RLS policies to avoid infinite recursion)
CREATE TABLE IF NOT EXISTS public.group_members (
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

-- User profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  default_group_id UUID REFERENCES public.expense_groups(id),
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Recurring transactions template
CREATE TABLE IF NOT EXISTS public.recurring_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id),
  name TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense')),
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE,
  day_of_month INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  group_id UUID
);

-- Group invitations table
CREATE TABLE IF NOT EXISTS public.group_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.expense_groups(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID NOT NULL,
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Import logs table
CREATE TABLE IF NOT EXISTS public.import_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  group_id UUID REFERENCES public.expense_groups(id),
  import_type TEXT NOT NULL CHECK (import_type IN ('gmail', 'csv', 'bank_api')),
  file_name TEXT,
  total_rows INTEGER DEFAULT 0,
  successful_rows INTEGER DEFAULT 0,
  failed_rows INTEGER DEFAULT 0,
  errors JSONB,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

-- Temporarily disable RLS on group_members to avoid recursion issues
ALTER TABLE public.group_members DISABLE ROW LEVEL SECURITY;

-- Simple RLS Policies (non-recursive to avoid infinite loops)
CREATE POLICY "Users can manage their categories" ON public.categories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their budget plans" ON public.budget_plans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their budget items" ON public.budget_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.budget_plans WHERE id = budget_plan_id AND user_id = auth.uid())
);
CREATE POLICY "Users can manage their transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their accounts" ON public.accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own profile" ON public.user_profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can manage their recurring templates" ON public.recurring_templates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their groups" ON public.expense_groups FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can manage their group invitations" ON public.group_invitations FOR ALL USING (auth.uid() = invited_by);
CREATE POLICY "Users can manage their import logs" ON public.import_logs FOR ALL USING (auth.uid() = user_id);

-- Update timestamps function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_budget_plans_updated_at ON public.budget_plans;
CREATE TRIGGER update_budget_plans_updated_at BEFORE UPDATE ON public.budget_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_accounts_updated_at ON public.accounts;
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default system categories
INSERT INTO public.categories (user_id, name, color, icon, is_system) VALUES
  ('00000000-0000-0000-0000-000000000000', 'Food & Dining', '#EF4444', 'utensils', true),
  ('00000000-0000-0000-0000-000000000000', 'Transportation', '#3B82F6', 'car', true),
  ('00000000-0000-0000-0000-000000000000', 'Shopping', '#8B5CF6', 'shopping-bag', true),
  ('00000000-0000-0000-0000-000000000000', 'Entertainment', '#F59E0B', 'film', true),
  ('00000000-0000-0000-0000-000000000000', 'Bills & Utilities', '#10B981', 'receipt', true),
  ('00000000-0000-0000-0000-000000000000', 'Healthcare', '#EC4899', 'heart', true),
  ('00000000-0000-0000-0000-000000000000', 'Education', '#6366F1', 'book', true),
  ('00000000-0000-0000-0000-000000000000', 'Income', '#059669', 'trending-up', true),
  ('00000000-0000-0000-0000-000000000000', 'Investment', '#7C3AED', 'trending-up', true),
  ('00000000-0000-0000-0000-000000000000', 'Other', '#6B7280', 'more-horizontal', true)
ON CONFLICT DO NOTHING;