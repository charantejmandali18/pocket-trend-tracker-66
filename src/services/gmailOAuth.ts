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
      // First, try to update existing integration
      const { data: existingData, error: updateError } = await supabase
        .from('email_integrations')
        .update({
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: expiresAt?.toISOString(),
          scope: OAUTH_CONFIG.gmail.scope,
          status: 'connected',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('provider', 'gmail')
        .eq('email', email)
        .select()
        .single();

      // If update succeeded, return the updated data
      if (!updateError && existingData) {
        console.log('Updated existing email integration:', existingData);
        return existingData;
      }

      // If no existing record, insert new one
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

      if (error) {
        console.error('Supabase error storing email integration:', error);
        throw error;
      }
      
      console.log('Email integration stored successfully:', data);
      return data;
    } catch (error) {
      console.error('Error storing email integration:', error);
      throw new Error(`Failed to store email integration: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    maxResults: number = 50,
    integrationId?: string
  ) {
    try {
      const params = new URLSearchParams({
        q: query,
        maxResults: maxResults.toString()
      });

      let currentToken = accessToken;
      
      const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?${params}`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      // If token is expired, try to refresh it
      if (response.status === 401 && integrationId) {
        console.log('Access token expired, attempting to refresh...');
        
        try {
          // Get the integration with refresh token
          const { data: integration, error } = await supabase
            .from('email_integrations')
            .select('refresh_token')
            .eq('id', integrationId)
            .single();

          if (error || !integration?.refresh_token) {
            throw new Error('No refresh token available');
          }

          // Refresh the token
          const newTokens = await this.refreshAccessToken(integration.refresh_token);
          
          // Update the integration with new tokens
          await supabase
            .from('email_integrations')
            .update({
              access_token: newTokens.access_token,
              expires_at: newTokens.expires_in ? new Date(Date.now() + newTokens.expires_in * 1000).toISOString() : null,
              updated_at: new Date().toISOString()
            })
            .eq('id', integrationId);

          // Retry the request with new token
          const retryResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?${params}`, {
            headers: {
              Authorization: `Bearer ${newTokens.access_token}`,
            },
          });

          if (!retryResponse.ok) {
            throw new Error(`Failed to fetch messages after token refresh: ${retryResponse.statusText}`);
          }

          const data = await retryResponse.json();
          return data.messages || [];

        } catch (refreshError) {
          console.error('Error refreshing token:', refreshError);
          throw new Error('Token expired and refresh failed. Please reconnect your Gmail account.');
        }
      }

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
  async getMessageContent(accessToken: string, messageId: string, integrationId?: string) {
    try {
      const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // If token is expired, try to refresh it
      if (response.status === 401 && integrationId) {
        console.log('Access token expired for message content, attempting to refresh...');
        
        try {
          // Get the integration with refresh token
          const { data: integration, error } = await supabase
            .from('email_integrations')
            .select('refresh_token, access_token')
            .eq('id', integrationId)
            .single();

          if (error || !integration?.refresh_token) {
            throw new Error('No refresh token available');
          }

          // Refresh the token
          const newTokens = await this.refreshAccessToken(integration.refresh_token);
          
          // Update the integration with new tokens
          await supabase
            .from('email_integrations')
            .update({
              access_token: newTokens.access_token,
              expires_at: newTokens.expires_in ? new Date(Date.now() + newTokens.expires_in * 1000).toISOString() : null,
              updated_at: new Date().toISOString()
            })
            .eq('id', integrationId);

          // Retry the request with new token
          const retryResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`, {
            headers: {
              Authorization: `Bearer ${newTokens.access_token}`,
            },
          });

          if (!retryResponse.ok) {
            throw new Error(`Failed to fetch message after token refresh: ${retryResponse.statusText}`);
          }

          const data = await retryResponse.json();
          return data;

        } catch (refreshError) {
          console.error('Error refreshing token for message content:', refreshError);
          throw new Error('Token expired and refresh failed. Please reconnect your Gmail account.');
        }
      }

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

  // Process transaction emails using the email parser
  async processTransactionEmails(userId: string, integrationId: string): Promise<{
    transactions: any[];
    accounts: any[];
    processed_count: number;
    errors: string[];
  }> {
    try {
      console.log('Starting email processing for user:', userId, 'integration:', integrationId);
      
      // Import the email parsing service
      const { emailParsingService } = await import('./emailParser');
      
      // Process emails for the user
      const results = await emailParsingService.processEmailsForUser(userId, integrationId);
      
      console.log('Email processing completed:', results);
      
      // Update integration stats
      await this.updateEmailIntegration(integrationId, {
        last_sync: new Date().toISOString(),
        transactions_processed: results.transactions.length,
        accounts_discovered: results.accounts.length
      });
      
      return results;
    } catch (error) {
      console.error('Error processing transaction emails:', error);
      throw new Error(`Failed to process emails: ${error}`);
    }
  }

  // Reprocess stored emails without fetching new ones
  async reprocessStoredEmails(userId: string, integrationId: string): Promise<{
    transactions: any[];
    accounts: any[];
    processed_count: number;
    errors: string[];
  }> {
    try {
      console.log('Starting email reprocessing for user:', userId, 'integration:', integrationId);
      
      // Import the email parsing service
      const { emailParsingService } = await import('./emailParser');
      
      // Reprocess stored emails
      const results = await emailParsingService.reprocessStoredEmails(userId, integrationId);
      
      console.log('Email reprocessing completed:', results);
      
      // Update integration stats
      await this.updateEmailIntegration(integrationId, {
        transactions_processed: results.transactions.length,
        accounts_discovered: results.accounts.length
      });
      
      return results;
    } catch (error) {
      console.error('Error reprocessing stored emails:', error);
      throw new Error(`Failed to reprocess emails: ${error}`);
    }
  }

  // Get unprocessed accounts for a user
  async getUnprocessedAccounts(userId: string): Promise<UnprocessedAccount[]> {
    try {
      // Try to get from the view first
      const { data: viewData, error: viewError } = await supabase
        .from('pending_account_discoveries')
        .select('*')
        .eq('user_id', userId)
        .order('confidence_score', { ascending: false });

      if (!viewError && viewData && viewData.length > 0) {
        console.log('Found accounts from view:', viewData.length);
        return viewData;
      }

      // Fallback: get directly from discovered_accounts table
      console.log('View returned no data, trying discovered_accounts table directly');
      const { data, error } = await supabase
        .from('discovered_accounts')
        .select(`
          *,
          email_integrations:email_integration_id (
            email,
            provider
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('confidence_score', { ascending: false });

      if (error) {
        console.error('Error fetching from discovered_accounts:', error);
        throw error;
      }
      
      console.log('Found accounts from table:', data?.length || 0);
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
      if (action === 'approved') {
        // Get the discovered account details
        const { data: account, error: fetchError } = await supabase
          .from('discovered_accounts')
          .select('*')
          .eq('id', accountId)
          .single();

        if (fetchError || !account) {
          throw new Error('Account not found');
        }

        // Create a financial account from the discovered account
        const { addFinancialAccount } = await import('@/utils/storageService');
        
        const accountData = {
          name: account.bank_name && account.account_number_partial 
            ? `${account.bank_name} ****${account.account_number_partial}`
            : account.bank_name || 'Discovered Account',
          type: account.account_type || 'savings',
          balance: account.current_balance || 0,
          bank_name: account.bank_name,
          account_number_partial: account.account_number_partial,
          user_id: account.user_id,
          group_id: null // Personal account
        };

        const success = await addFinancialAccount(accountData);
        
        if (success) {
          // Mark the discovered account as approved
          await supabase
            .from('discovered_accounts')
            .update({
              status: 'approved',
              processed_at: new Date().toISOString()
            })
            .eq('id', accountId);
        }

        return success;
      } else {
        // Mark as rejected
        await supabase
          .from('discovered_accounts')
          .update({
            status: 'rejected',
            processed_at: new Date().toISOString()
          })
          .eq('id', accountId);
        
        return true;
      }
    } catch (error) {
      console.error('Error processing unprocessed account:', error);
      return false;
    }
  }

  // Get or create a special integration ID for credit report uploads
  private async getOrCreateCreditReportIntegration(userId: string): Promise<string> {
    try {
      // First, try to use an existing email integration for this user
      const { data: existingIntegrations, error: fetchError } = await supabase
        .from('email_integrations')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'connected')
        .limit(1);

      if (!fetchError && existingIntegrations && existingIntegrations.length > 0) {
        return existingIntegrations[0].id;
      }

      // If no existing integration, create a special gmail integration for credit reports
      const { data: newIntegration, error: insertError } = await supabase
        .from('email_integrations')
        .insert({
          user_id: userId,
          provider: 'gmail',
          email: `credit-report-${userId}@placeholder.local`,
          access_token: 'credit_report_placeholder_token',
          status: 'connected',
          transactions_processed: 0,
          accounts_discovered: 0,
          scope: 'credit_report_upload'
        })
        .select('id')
        .single();

      if (insertError) {
        throw insertError;
      }

      return newIntegration.id;
    } catch (error) {
      console.error('Error creating credit report integration:', error);
      // Last resort fallback: try to find any integration for this user
      const { data: anyIntegration } = await supabase
        .from('email_integrations')
        .select('id')
        .eq('user_id', userId)
        .limit(1);
        
      if (anyIntegration && anyIntegration.length > 0) {
        return anyIntegration[0].id;
      }
      
      // If all else fails, throw an error - this shouldn't happen in normal operation
      throw new Error('Unable to create or find email integration for credit report uploads');
    }
  }

  // Add credit report accounts to unprocessed accounts
  async addCreditReportAccounts(
    userId: string,
    accounts: Array<{
      bank_name: string;
      account_type: string;
      account_number_partial: string;
      balance?: number;
      credit_limit?: number;
      open_date?: string;
      confidence_score: number;
      raw_data?: string;
    }>
  ): Promise<boolean> {
    try {
      console.log(`🔍 Processing ${accounts.length} credit report accounts for user:`, userId);
      
      // Create or get a special integration ID for credit reports
      const creditReportIntegrationId = await this.getOrCreateCreditReportIntegration(userId);
      console.log('📧 Using credit report integration ID:', creditReportIntegrationId);
      
      const accountsToInsert = [];
      const accountsToUpdate = [];
      
      // Check each account for duplicates before inserting
      for (let i = 0; i < accounts.length; i++) {
        const account = accounts[i];
        console.log(`🏦 Processing account ${i + 1}/${accounts.length}:`, {
          bank_name: account.bank_name,
          account_type: account.account_type,
          account_number_partial: account.account_number_partial,
          confidence_score: account.confidence_score
        });
        const accountNumberPartial = account.account_number_partial || 'unknown';
        
        // Check for any existing account (including rejected ones)
        const { data: existingAccounts, error: checkError } = await supabase
          .from('discovered_accounts')
          .select('id, status')
          .eq('email_integration_id', creditReportIntegrationId)
          .eq('bank_name', account.bank_name)
          .eq('account_number_partial', accountNumberPartial)
          .limit(1);

        if (checkError) {
          console.warn('Error checking for duplicate discovered account:', checkError);
          continue;
        }

        if (!existingAccounts || existingAccounts.length === 0) {
          // No existing account, create new one
          accountsToInsert.push({
            user_id: userId,
            email_integration_id: creditReportIntegrationId,
            discovered_from_email_id: `credit-report-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            bank_name: account.bank_name,
            account_type: account.account_type,
            current_balance: account.balance,
            account_number_partial: accountNumberPartial,
            confidence_score: account.confidence_score,
            needs_review: account.confidence_score < 0.8,
            status: 'pending' as const
          });
          console.log('✅ New account to be inserted:', account.bank_name);
        } else {
          const existingAccount = existingAccounts[0];
          if (existingAccount.status === 'rejected') {
            // Update rejected account back to pending
            accountsToUpdate.push({
              id: existingAccount.id,
              current_balance: account.balance,
              confidence_score: account.confidence_score,
              needs_review: account.confidence_score < 0.8,
              status: 'pending' as const,
              updated_at: new Date().toISOString()
            });
            console.log('🔄 Rejected account to be updated back to pending:', account.bank_name);
          } else {
            console.log('⏭️ Account already exists with status:', existingAccount.status, '-', account.bank_name);
          }
        }
      }

      let insertedCount = 0;
      let updatedCount = 0;

      // Insert new accounts
      if (accountsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('discovered_accounts')
          .insert(accountsToInsert);

        if (insertError) {
          console.error('Error inserting credit report accounts:', insertError);
          throw insertError;
        }
        insertedCount = accountsToInsert.length;
        console.log(`✅ Successfully inserted ${insertedCount} new accounts`);
      }

      // Update rejected accounts back to pending
      if (accountsToUpdate.length > 0) {
        for (const updateData of accountsToUpdate) {
          const { id, ...updates } = updateData;
          const { error: updateError } = await supabase
            .from('discovered_accounts')
            .update(updates)
            .eq('id', id);

          if (updateError) {
            console.error('Error updating rejected account:', updateError);
          } else {
            updatedCount++;
          }
        }
        console.log(`🔄 Successfully updated ${updatedCount} rejected accounts back to pending`);
      }

      if (insertedCount === 0 && updatedCount === 0) {
        console.log('All credit report accounts already exist with active status');
      }

      console.log(`Successfully processed ${accounts.length} credit report accounts`);
      return true;
    } catch (error) {
      console.error('Error adding credit report accounts:', error);
      return false;
    }
  }

  // Debug function to check discovered accounts
  async getDiscoveredAccounts(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('discovered_accounts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log(`Found ${data?.length || 0} discovered accounts for user:`, data);
      return data || [];
    } catch (error) {
      console.error('Error fetching discovered accounts:', error);
      return [];
    }
  }
}

export const gmailOAuthService = new GmailOAuthService();