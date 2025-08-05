-- Add enhanced fields for credit cards and loans to accounts table
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(12,2);
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS interest_rate DECIMAL(5,2);
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS monthly_emi DECIMAL(12,2);
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS next_due_date DATE;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS remaining_terms INTEGER;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS principal_amount DECIMAL(12,2);
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS loan_tenure_months INTEGER;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS interest_type TEXT CHECK (interest_type IN ('simple', 'compound', 'reducing_balance', 'flat_rate'));
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS processing_fee DECIMAL(12,2);
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS processing_fee_percentage DECIMAL(5,2);
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS is_no_cost_emi BOOLEAN DEFAULT false;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS is_interest_free BOOLEAN DEFAULT false;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS emi_start_date DATE;

-- Home loan specific fields
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS is_home_loan BOOLEAN DEFAULT false;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS is_under_construction BOOLEAN DEFAULT false;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS sanctioned_amount DECIMAL(12,2);
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS disbursed_amount DECIMAL(12,2);
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS moratorium_period_months INTEGER;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS moratorium_end_date DATE;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS is_in_moratorium BOOLEAN DEFAULT false;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS possession_date DATE;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS actual_moratorium_emi DECIMAL(12,2);

-- Sharing and pool fields
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS is_pool_contribution BOOLEAN DEFAULT false;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT false;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS split_type TEXT CHECK (split_type IN ('equal', 'fractional', 'custom'));

-- Update account_type constraint to include 'loan'
ALTER TABLE public.accounts DROP CONSTRAINT IF EXISTS accounts_account_type_check;
ALTER TABLE public.accounts ADD CONSTRAINT accounts_account_type_check 
  CHECK (account_type IN ('bank', 'credit_card', 'wallet', 'investment', 'loan', 'other'));