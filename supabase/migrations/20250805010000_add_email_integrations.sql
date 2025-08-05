-- Create email_integrations table to store OAuth tokens and connection info
CREATE TABLE public.email_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('gmail', 'outlook', 'yahoo')),
  email TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  scope TEXT,
  status TEXT DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected', 'error')),
  last_sync TIMESTAMP WITH TIME ZONE,
  transactions_processed INTEGER DEFAULT 0,
  accounts_discovered INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one connection per provider per user
  UNIQUE(user_id, provider, email)
);

-- Create unprocessed_accounts table for accounts discovered but needing manual review
CREATE TABLE public.unprocessed_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_email_integration_id UUID NOT NULL REFERENCES public.email_integrations(id) ON DELETE CASCADE,
  discovered_account_name TEXT NOT NULL,
  bank_name TEXT,
  account_type TEXT,
  balance DECIMAL(12,2),
  account_number_partial TEXT,
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  needs_review BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  discovery_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unprocessed_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their email integrations" ON public.email_integrations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their unprocessed accounts" ON public.unprocessed_accounts FOR ALL USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_email_integrations_updated_at 
  BEFORE UPDATE ON public.email_integrations 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_email_integrations_user_provider ON public.email_integrations(user_id, provider);
CREATE INDEX idx_unprocessed_accounts_user_status ON public.unprocessed_accounts(user_id, status);