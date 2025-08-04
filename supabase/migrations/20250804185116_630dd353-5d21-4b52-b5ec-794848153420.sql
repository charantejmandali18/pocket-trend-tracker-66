-- Fix account type constraint to match the interface
ALTER TABLE public.accounts DROP CONSTRAINT IF EXISTS accounts_account_type_check;

-- Add new constraint with all the types used in the interface
ALTER TABLE public.accounts ADD CONSTRAINT accounts_account_type_check 
CHECK (account_type IN (
  'savings', 'checking', 'credit_card', 'loan', 'investment', 'cash', 
  'real_estate', 'vehicle', 'other', 'recurring', 'mutual_fund', 'stocks', 
  'sip', 'insurance', 'life_insurance', 'health_insurance', 
  'bank', 'wallet'
));