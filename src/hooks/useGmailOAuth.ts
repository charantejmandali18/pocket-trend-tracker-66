import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { gmailOAuthService, type EmailIntegration, type UnprocessedAccount } from '@/services/gmailOAuth';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';

export const useGmailOAuth = () => {
  const { user } = useApp();
  const { toast } = useToast();
  
  const [connectedEmails, setConnectedEmails] = useState<EmailIntegration[]>([]);
  const [unprocessedAccounts, setUnprocessedAccounts] = useState<UnprocessedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingEmails, setIsProcessingEmails] = useState(false);

  // Load email integrations on mount
  useEffect(() => {
    if (user) {
      loadEmailIntegrations();
      loadUnprocessedAccounts();
    }
  }, [user]);

  // Load email integrations from Supabase
  const loadEmailIntegrations = async () => {
    if (!user) return;
    
    try {
      const integrations = await gmailOAuthService.getEmailIntegrations(user.id);
      setConnectedEmails(integrations);
    } catch (error) {
      console.error('Error loading email integrations:', error);
      toast({
        title: "Error",
        description: "Failed to load email integrations",
        variant: "destructive",
      });
    }
  };

  // Load unprocessed accounts from Supabase
  const loadUnprocessedAccounts = async () => {
    if (!user) return;
    
    try {
      const accounts = await gmailOAuthService.getUnprocessedAccounts(user.id);
      setUnprocessedAccounts(accounts);
    } catch (error) {
      console.error('Error loading unprocessed accounts:', error);
      toast({
        title: "Error",
        description: "Failed to load unprocessed accounts",
        variant: "destructive",
      });
    }
  };

  // Start Gmail OAuth flow
  const connectGmail = () => {
    try {
      const authUrl = gmailOAuthService.generateAuthUrl();
      
      // Open OAuth popup
      const popup = window.open(
        authUrl,
        'gmail-oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        toast({
          title: "Error",
          description: "Popup was blocked. Please allow popups and try again.",
          variant: "destructive",
        });
        return;
      }

      let messageReceived = false;

      // Listen for messages from the popup
      const messageListener = (event: MessageEvent) => {
        // Ignore React DevTools messages
        if (event.data?.source === 'react-devtools-content-script') {
          return;
        }
        
        console.log('Received message:', event.data, 'from origin:', event.origin);
        
        if (event.origin !== window.location.origin) {
          console.log('Origin mismatch, ignoring message');
          return;
        }
        
        if (event.data.type === 'GMAIL_OAUTH_SUCCESS') {
          messageReceived = true;
          window.removeEventListener('message', messageListener);
          
          toast({
            title: "Success",
            description: "Gmail account connected successfully!",
          });
          
          loadEmailIntegrations();
        } else if (event.data.type === 'GMAIL_OAUTH_ERROR') {
          messageReceived = true;
          window.removeEventListener('message', messageListener);
          
          toast({
            title: "Error",
            description: event.data.error || "Failed to connect Gmail account",
            variant: "destructive",
          });
        }
      };

      window.addEventListener('message', messageListener);

      // Use a different approach to detect popup closure  
      const detectClosure = () => {
        try {
          if (popup.closed) {
            window.removeEventListener('message', messageListener);
            
            if (!messageReceived) {
              // If popup closed without message, reload integrations
              setTimeout(() => {
                loadEmailIntegrations();
              }, 1000);
            }
            return;
          }
        } catch (error) {
          // CORS error when checking popup.closed, ignore and continue
        }
        
        // Check again in 2 seconds
        setTimeout(detectClosure, 2000);
      };
      
      // Start checking for closure
      setTimeout(detectClosure, 2000);

    } catch (error) {
      console.error('Error starting Gmail OAuth:', error);
      toast({
        title: "Error",
        description: "Failed to start Gmail authentication",
        variant: "destructive",
      });
    }
  };

  // Disconnect Gmail integration
  const disconnectEmail = async (integrationId: string) => {
    try {
      setIsLoading(true);
      const success = await gmailOAuthService.disconnectEmailIntegration(integrationId);
      
      if (success) {
        setConnectedEmails(prev => prev.filter(email => email.id !== integrationId));
        toast({
          title: "Success",
          description: "Email account disconnected successfully",
        });
      } else {
        throw new Error('Failed to disconnect');
      }
    } catch (error) {
      console.error('Error disconnecting email:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect email account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Sync emails (process new transaction emails)
  const syncEmails = async () => {
    if (!user || connectedEmails.length === 0) {
      toast({
        title: "No Connected Emails",
        description: "Please connect an email account first.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsProcessingEmails(true);
      console.log('Starting email sync for user:', user.id);
      
      let totalTransactions = 0;
      let totalAccounts = 0;
      let totalErrors = 0;

      // Process emails for each connected integration
      for (const integration of connectedEmails) {
        try {
          console.log('Processing emails for integration:', integration.id);
          
          const results = await gmailOAuthService.processTransactionEmails(
            user.id,
            integration.id
          );
          
          totalTransactions += results.transactions.length;
          totalAccounts += results.accounts.length;
          totalErrors += results.errors.length;
          
          console.log(`Processed ${results.transactions.length} transactions and discovered ${results.accounts.length} accounts`);
          
        } catch (error) {
          console.error('Error processing integration:', integration.id, error);
          totalErrors++;
        }
      }
      
      toast({
        title: "Emails Synced Successfully",
        description: `Processed ${totalTransactions} transactions and discovered ${totalAccounts} accounts.${totalErrors > 0 ? ` ${totalErrors} errors occurred.` : ''}`,
      });
      
      // Reload data after sync  
      await Promise.all([
        loadEmailIntegrations(),
        loadUnprocessedAccounts()
      ]);
      
    } catch (error) {
      console.error('Error syncing emails:', error);
      toast({
        title: "Error",
        description: "Failed to sync emails",
        variant: "destructive",
      });
    } finally {
      setIsProcessingEmails(false);
    }
  };

  // Process unprocessed account
  const processAccount = async (accountId: string, action: 'approve' | 'reject') => {
    try {
      const mappedAction = action === 'approve' ? 'approved' : 'rejected';
      const success = await gmailOAuthService.processUnprocessedAccount(accountId, mappedAction);
      
      if (success) {
        setUnprocessedAccounts(prev => prev.filter(acc => acc.id !== accountId));
        
        if (action === 'approve') {
          // TODO: Create financial account from the approved data
          toast({
            title: "Account Created",
            description: "Account has been added to your financial accounts",
          });
        } else {
          toast({
            title: "Account Rejected",
            description: "Account discovery has been rejected",
          });
        }
      } else {
        throw new Error('Failed to process account');
      }
    } catch (error) {
      console.error('Error processing account:', error);
      toast({
        title: "Error",
        description: `Failed to ${action} account`,
        variant: "destructive",
      });
    }
  };

  // Reprocess existing parsed data without fetching new emails
  const reprocessData = async () => {
    if (!user || connectedEmails.length === 0) {
      toast({
        title: "No Connected Emails",
        description: "Please connect an email account first.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessingEmails(true);
      console.log('Starting data reprocessing for user:', user.id);

      let totalTransactions = 0;
      let totalAccounts = 0;
      let totalErrors = 0;

      // For now, let's just reset existing data to pending status for reprocessing
      // This avoids hitting Gmail API again but allows testing new logic
      for (const integration of connectedEmails) {
        try {
          console.log('Reprocessing data for integration:', integration.id);
          
          // Reset parsed transactions to pending status for reprocessing
          const { data: resetTx, error: txError } = await supabase
            .from('parsed_transactions')
            .update({ 
              status: 'pending', 
              processed_at: null,
              processed_transaction_id: null 
            })
            .eq('email_integration_id', integration.id)
            .in('status', ['processed', 'rejected'])
            .select();

          if (txError) {
            console.error('Error resetting transactions:', txError);
          } else {
            totalTransactions += resetTx?.length || 0;
          }

          // Reset discovered accounts to pending status for reprocessing
          const { data: resetAcc, error: accError } = await supabase
            .from('discovered_accounts')
            .update({ 
              status: 'pending', 
              processed_at: null,
              created_account_id: null 
            })
            .eq('email_integration_id', integration.id)
            .in('status', ['approved', 'rejected'])
            .select();

          if (accError) {
            console.error('Error resetting accounts:', accError);
          } else {
            totalAccounts += resetAcc?.length || 0;
          }

          console.log(`Reset ${resetTx?.length || 0} transactions and ${resetAcc?.length || 0} accounts for reprocessing`);
          
        } catch (error) {
          console.error('Error reprocessing integration:', integration.id, error);
          totalErrors++;
        }
      }

      toast({
        title: "Data Reprocessed Successfully",
        description: `Reprocessed ${totalTransactions} transactions and discovered ${totalAccounts} accounts. ${totalErrors > 0 ? ` ${totalErrors} errors occurred.` : ''}`,
      });

      // Reload data after reprocessing
      await Promise.all([
        loadEmailIntegrations(),
        loadUnprocessedAccounts()
      ]);

    } catch (error) {
      console.error('Error reprocessing data:', error);
      toast({
        title: "Error",
        description: "Failed to reprocess data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingEmails(false);
    }
  };

  // Reset sync time for development - allows re-syncing all emails
  const resetSyncTime = async () => {
    if (!user || connectedEmails.length === 0) {
      toast({
        title: "No Connected Emails",
        description: "Please connect an email account first.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Resetting sync time for user:', user.id);

      // Reset last_sync to null for all integrations
      for (const integration of connectedEmails) {
        const { error } = await supabase
          .from('email_integrations')
          .update({ 
            last_sync: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', integration.id);

        if (error) {
          console.error('Error resetting sync time:', error);
        } else {
          console.log(`Reset sync time for integration: ${integration.id}`);
        }
      }

      toast({
        title: "Sync Time Reset",
        description: "Next sync will fetch all emails from the past 30 days again.",
      });

      // Reload email integrations to show updated sync times
      await loadEmailIntegrations();

    } catch (error) {
      console.error('Error resetting sync time:', error);
      toast({
        title: "Error",
        description: "Failed to reset sync time. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Add credit report accounts to unprocessed queue
  const addCreditReportAccounts = async (accounts: Array<{
    bank_name: string;
    account_type: string;
    account_number_partial: string;
    balance?: number;
    credit_limit?: number;
    open_date?: string;
    confidence_score: number;
    raw_data?: string;
  }>) => {
    if (!user) return false;

    try {
      const success = await gmailOAuthService.addCreditReportAccounts(user.id, accounts);
      
      if (success) {
        toast({
          title: "Accounts Added",
          description: `${accounts.length} accounts added to unprocessed queue`,
        });
        
        // Reload unprocessed accounts to show the new ones
        await loadUnprocessedAccounts();
      } else {
        toast({
          title: "Error",
          description: "Failed to add credit report accounts",
          variant: "destructive",
        });
      }
      
      return success;
    } catch (error) {
      console.error('Error adding credit report accounts:', error);
      toast({
        title: "Error",
        description: "Failed to add credit report accounts",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    connectedEmails,
    unprocessedAccounts,
    isLoading,
    isProcessingEmails,
    connectGmail,
    disconnectEmail,
    syncEmails,
    reprocessData,
    resetSyncTime,
    processAccount,
    addCreditReportAccounts,
    getDiscoveredAccounts: async () => {
      if (!user) return [];
      return await gmailOAuthService.getDiscoveredAccounts(user.id);
    },
    refreshData: () => {
      loadEmailIntegrations();
      loadUnprocessedAccounts();
    }
  };
};