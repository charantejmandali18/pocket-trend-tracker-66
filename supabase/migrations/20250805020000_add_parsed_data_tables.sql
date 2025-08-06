-- Create table for storing parsed transactions (before they're processed into main transactions)  
CREATE TABLE public.parsed_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_integration_id UUID NOT NULL REFERENCES public.email_integrations(id) ON DELETE CASCADE,
  
  -- Email metadata
  raw_email_id TEXT NOT NULL,
  email_subject TEXT,
  email_date TIMESTAMP WITH TIME ZONE,
  sender TEXT,
  
  -- Parsed transaction data
  transaction_type TEXT CHECK (transaction_type IN ('credit', 'debit', 'unknown')),
  amount DECIMAL(12,2),
  currency TEXT DEFAULT 'INR',
  transaction_date TIMESTAMP WITH TIME ZONE,
  description TEXT,
  merchant TEXT,
  category TEXT,
  
  -- Account information extracted from email
  bank_name TEXT,
  account_number_partial TEXT,
  account_type TEXT,
  
  -- Processing metadata
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  needs_review BOOLEAN DEFAULT true,
  parsing_notes TEXT,
  
  -- Processing status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'rejected', 'duplicate')),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_transaction_id UUID REFERENCES public.transactions(id),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure no duplicate processing of same email
  UNIQUE(email_integration_id, raw_email_id)
);

-- Create table for storing discovered accounts (before they're added to main accounts)
CREATE TABLE public.discovered_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_integration_id UUID NOT NULL REFERENCES public.email_integrations(id) ON DELETE CASCADE,
  
  -- Discovery metadata
  discovered_from_email_id TEXT NOT NULL,
  discovery_method TEXT DEFAULT 'email_parsing',
  
  -- Account details
  bank_name TEXT NOT NULL,
  account_number_partial TEXT,
  account_type TEXT,
  current_balance DECIMAL(12,2),
  account_holder_name TEXT,
  
  -- Additional account info that might be extracted
  branch_name TEXT,
  ifsc_code TEXT,
  
  -- Processing metadata
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  needs_review BOOLEAN DEFAULT true,
  discovery_notes TEXT,
  
  -- Processing status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'merged')),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_account_id UUID REFERENCES public.accounts(id),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Prevent duplicate discoveries
  UNIQUE(email_integration_id, bank_name, account_number_partial)
);

-- Enable RLS
ALTER TABLE public.parsed_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovered_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their parsed transactions" ON public.parsed_transactions 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their discovered accounts" ON public.discovered_accounts 
  FOR ALL USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_parsed_transactions_updated_at
  BEFORE UPDATE ON public.parsed_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_discovered_accounts_updated_at
  BEFORE UPDATE ON public.discovered_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_parsed_transactions_user_status ON public.parsed_transactions(user_id, status);
CREATE INDEX idx_parsed_transactions_email_integration ON public.parsed_transactions(email_integration_id);
CREATE INDEX idx_parsed_transactions_date ON public.parsed_transactions(transaction_date);

CREATE INDEX idx_discovered_accounts_user_status ON public.discovered_accounts(user_id, status);
CREATE INDEX idx_discovered_accounts_email_integration ON public.discovered_accounts(email_integration_id);
CREATE INDEX idx_discovered_accounts_bank ON public.discovered_accounts(bank_name);

-- Add some useful views
CREATE VIEW public.unprocessed_transactions AS
SELECT 
  pt.*,
  ei.email,
  ei.provider
FROM public.parsed_transactions pt
JOIN public.email_integrations ei ON pt.email_integration_id = ei.id
WHERE pt.status = 'pending'
ORDER BY pt.transaction_date DESC;

CREATE VIEW public.pending_account_discoveries AS
SELECT 
  da.*,
  ei.email,
  ei.provider
FROM public.discovered_accounts da
JOIN public.email_integrations ei ON da.email_integration_id = ei.id
WHERE da.status = 'pending'
ORDER BY da.confidence_score DESC;