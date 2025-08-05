-- Redesign for proper expense management app

-- Categories table for expense classification
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT 'circle',
  parent_id UUID REFERENCES public.categories(id),
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Budget plans table (monthly budgets)
CREATE TABLE public.budget_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  month_year DATE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Monthly Budget',
  total_income_planned DECIMAL(12,2) DEFAULT 0,
  total_expenses_planned DECIMAL(12,2) DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, month_year)
);

-- Budget items (planned income/expenses by category)
CREATE TABLE public.budget_items (
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
CREATE TABLE public.transactions (
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
  external_id TEXT, -- for linking with bank transactions
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Accounts table (bank accounts, cards, wallets)
CREATE TABLE public.accounts (
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
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Recurring transactions template
CREATE TABLE public.recurring_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id),
  name TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense')),
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE,
  day_of_month INTEGER, -- for monthly recurring
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their categories" ON public.categories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their budget plans" ON public.budget_plans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their budget items" ON public.budget_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.budget_plans WHERE id = budget_plan_id AND user_id = auth.uid())
);
CREATE POLICY "Users can manage their transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their accounts" ON public.accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their recurring templates" ON public.recurring_templates FOR ALL USING (auth.uid() = user_id);

-- Update timestamps function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_budget_plans_updated_at BEFORE UPDATE ON public.budget_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default categories
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