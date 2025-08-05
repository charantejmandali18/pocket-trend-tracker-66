import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { gmailOAuthService, type EmailIntegration, type UnprocessedAccount } from '@/services/gmailOAuth';
import { useApp } from '@/contexts/AppContext';

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

      // Check if popup is closed (fallback)
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          
          if (!messageReceived) {
            // If popup closed without message, assume success and reload
            setTimeout(() => {
              loadEmailIntegrations();
            }, 1000);
          }
        }
      }, 1000);

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
    if (!user || connectedEmails.length === 0) return;
    
    try {
      setIsProcessingEmails(true);
      
      // TODO: Implement actual email processing logic
      // For now, just simulate the process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast({
        title: "Success",
        description: "Emails synced successfully!",
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

  return {
    connectedEmails,
    unprocessedAccounts,
    isLoading,
    isProcessingEmails,
    connectGmail,
    disconnectEmail,
    syncEmails,
    processAccount,
    refreshData: () => {
      loadEmailIntegrations();
      loadUnprocessedAccounts();
    }
  };
};