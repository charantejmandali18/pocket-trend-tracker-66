import { supabase } from '@/integrations/supabase/client';
import { OAUTH_CONFIG } from '@/config/oauth';

export interface EmailIntegration {
  id: string;
  user_id: string;
  provider: 'gmail' | 'outlook' | 'yahoo';
  email: string;
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
  scope?: string;
  status: 'connected' | 'disconnected' | 'error';
  last_sync?: string;
  transactions_processed: number;
  accounts_discovered: number;
  created_at: string;
  updated_at: string;
}

export interface UnprocessedAccount {
  id: string;
  user_id: string;
  source_email_integration_id: string;
  discovered_account_name: string;
  bank_name?: string;
  account_type?: string;
  balance?: number;
  account_number_partial?: string;
  confidence_score?: number;
  needs_review: boolean;
  status: 'pending' | 'approved' | 'rejected';
  discovery_date: string;
  processed_date?: string;
  created_at: string;
}

class GmailOAuthService {
  // Generate OAuth URL
  generateAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: OAUTH_CONFIG.gmail.client_id,
      redirect_uri: OAUTH_CONFIG.gmail.redirect_uri,
      scope: OAUTH_CONFIG.gmail.scope,
      response_type: OAUTH_CONFIG.gmail.response_type,
      access_type: OAUTH_CONFIG.gmail.access_type,
      prompt: OAUTH_CONFIG.gmail.prompt
    });

    return `https://accounts.google.com/o/oauth2/auth?${params.toString()}`;
  }

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(code: string) {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: OAUTH_CONFIG.gmail.client_id,
          client_secret: OAUTH_CONFIG.gmail.client_secret,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: OAUTH_CONFIG.gmail.redirect_uri,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.statusText}`);
      }

      const tokens = await response.json();
      return tokens;
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw new Error('Failed to exchange authorization code for tokens');
    }
  }

  // Get user info from Google
  async getUserInfo(accessToken: string) {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get user info: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting user info:', error);
      throw new Error('Failed to get user information');
    }
  }

  // Store email integration in Supabase
  async storeEmailIntegration(
    userId: string,
    email: string,
    accessToken: string,
    refreshToken?: string,
    expiresAt?: Date
  ): Promise<EmailIntegration> {
    try {
      const { data, error } = await supabase
        .from('email_integrations')
        .insert({
          user_id: userId,
          provider: 'gmail',
          email: email,
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: expiresAt?.toISOString(),
          scope: OAUTH_CONFIG.gmail.scope,
          status: 'connected',
          transactions_processed: 0,
          accounts_discovered: 0
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error storing email integration:', error);
      throw new Error('Failed to store email integration');
    }
  }

  // Get email integrations for a user
  async getEmailIntegrations(userId: string): Promise<EmailIntegration[]> {
    try {
      const { data, error } = await supabase
        .from('email_integrations')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'connected')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching email integrations:', error);
      return [];
    }
  }

  // Update email integration
  async updateEmailIntegration(
    integrationId: string,
    updates: Partial<EmailIntegration>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('email_integrations')
        .update(updates)
        .eq('id', integrationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating email integration:', error);
      return false;
    }
  }

  // Disconnect email integration
  async disconnectEmailIntegration(integrationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('email_integrations')
        .update({ status: 'disconnected' })
        .eq('id', integrationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error disconnecting email integration:', error);
      return false;
    }
  }

  // Refresh access token using refresh token
  async refreshAccessToken(refreshToken: string) {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: OAUTH_CONFIG.gmail.client_id,
          client_secret: OAUTH_CONFIG.gmail.client_secret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.statusText}`);
      }

      const tokens = await response.json();
      return tokens;
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  // Get Gmail messages (for transaction processing)
  async getGmailMessages(
    accessToken: string,
    query: string = 'from:alerts OR from:noreply OR subject:transaction OR subject:payment',
    maxResults: number = 50
  ) {
    try {
      const params = new URLSearchParams({
        q: query,
        maxResults: maxResults.toString()
      });

      const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?${params}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`);
      }

      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      console.error('Error fetching Gmail messages:', error);
      throw new Error('Failed to fetch Gmail messages');
    }
  }

  // Get specific message content
  async getMessageContent(accessToken: string, messageId: string) {
    try {
      const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch message: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching message content:', error);
      throw new Error('Failed to fetch message content');
    }
  }

  // Get unprocessed accounts for a user
  async getUnprocessedAccounts(userId: string): Promise<UnprocessedAccount[]> {
    try {
      const { data, error } = await supabase
        .from('unprocessed_accounts')
        .select(`
          *,
          email_integrations:source_email_integration_id (
            email,
            provider
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('discovery_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching unprocessed accounts:', error);
      return [];
    }
  }

  // Process unprocessed account (approve/reject)
  async processUnprocessedAccount(
    accountId: string,
    action: 'approved' | 'rejected'
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('unprocessed_accounts')
        .update({
          status: action,
          processed_date: new Date().toISOString()
        })
        .eq('id', accountId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error processing unprocessed account:', error);
      return false;
    }
  }
}

export const gmailOAuthService = new GmailOAuthService();