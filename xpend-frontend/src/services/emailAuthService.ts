import { toast } from '@/hooks/use-toast';

const EXTRACTION_SERVICE_URL = 'http://localhost:8089';

export interface EmailAccount {
  id: number;
  provider: 'GMAIL' | 'OUTLOOK' | 'YAHOO';
  emailAddress: string;
  isActive: boolean;
  lastSyncAt: string;
  tokenExpiresAt: string;
  syncFromDate: string;
  totalEmailsProcessed: number;
  totalTransactionsExtracted: number;
  createdAt: string;
  tokenExpired: boolean;
  needsRefresh: boolean;
}

export interface ExtractionStats {
  connectedAccounts: number;
  activeAccounts: number;
  totalEmailsProcessed: number;
  totalTransactionsExtracted: number;
  unprocessedTransactions: number;
  recentExtractions24h: number;
  averageConfidence: number;
  accounts: EmailAccount[];
}

export interface ExtractedTransaction {
  id: number;
  emailSubject: string;
  senderEmail: string;
  transactionDate: string;
  transactionType: string;
  amount: number;
  currency: string;
  merchantName: string;
  accountNumberLast4: string;
  cardLast4: string;
  transactionId: string;
  description: string;
  categorySuggestion: string;
  confidenceScore: number;
  isProcessed: boolean;
  processedAt: string;
  createdTransactionId: number;
  extractedAt: string;
}

class EmailAuthService {
  private getAuthHeaders(): Record<string, string> {
    // Use the same token storage as AuthService
    const token = localStorage.getItem('xpend_access_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      'ngrok-skip-browser-warning': 'true',
    };
  }

  async initiateGmailAuth(): Promise<string> {
    try {
      const response = await fetch(`${EXTRACTION_SERVICE_URL}/api/email-auth/gmail/authorize`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to initiate Gmail authentication');
      }

      const data = await response.json();
      return data.authUrl;
    } catch (error) {
      console.error('Failed to initiate Gmail auth:', error);
      throw error;
    }
  }

  async initiateOutlookAuth(): Promise<string> {
    try {
      const response = await fetch(`${EXTRACTION_SERVICE_URL}/api/email-auth/outlook/authorize`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to initiate Outlook authentication');
      }

      const data = await response.json();
      return data.authUrl;
    } catch (error) {
      console.error('Failed to initiate Outlook auth:', error);
      throw error;
    }
  }

  async getConnectedAccounts(): Promise<EmailAccount[]> {
    try {
      const response = await fetch(`${EXTRACTION_SERVICE_URL}/api/email-auth/accounts`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to get connected accounts');
      }

      const data = await response.json();
      return data.accounts;
    } catch (error) {
      console.error('Failed to get connected accounts:', error);
      throw error;
    }
  }

  async disconnectAccount(accountId: number): Promise<boolean> {
    try {
      const response = await fetch(`${EXTRACTION_SERVICE_URL}/api/email-auth/accounts/${accountId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to disconnect account:', error);
      return false;
    }
  }

  async triggerSync(accountId: number): Promise<boolean> {
    try {
      const response = await fetch(`${EXTRACTION_SERVICE_URL}/api/email-auth/accounts/${accountId}/sync`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to trigger sync:', error);
      return false;
    }
  }

  async getExtractionStats(): Promise<ExtractionStats> {
    try {
      const response = await fetch(`${EXTRACTION_SERVICE_URL}/api/extraction/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to get extraction stats');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get extraction stats:', error);
      throw error;
    }
  }

  async getExtractedTransactions(page = 0, size = 20, processed?: boolean): Promise<{
    transactions: ExtractedTransaction[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    size: number;
  }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
      });

      if (processed !== undefined) {
        params.append('processed', processed.toString());
      }

      const response = await fetch(`${EXTRACTION_SERVICE_URL}/api/extraction/transactions?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to get extracted transactions');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get extracted transactions:', error);
      throw error;
    }
  }

  async approveTransaction(transactionId: number, approved: boolean, notes?: string): Promise<boolean> {
    try {
      const response = await fetch(`${EXTRACTION_SERVICE_URL}/api/extraction/transactions/${transactionId}/approve`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          approved,
          notes: notes || '',
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to approve/reject transaction:', error);
      return false;
    }
  }

  openOAuthPopup(url: string, provider: string): Promise<{ success: boolean; email?: string; error?: string }> {
    return new Promise((resolve) => {
      const popup = window.open(
        url,
        `oauth_${provider}`,
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        resolve({ success: false, error: 'Popup blocked. Please allow popups and try again.' });
        return;
      }

      // Check for popup closure or message
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          
          // Check URL parameters for success/error
          const urlParams = new URLSearchParams(window.location.search);
          const authStatus = urlParams.get('auth');
          const authProvider = urlParams.get('provider');
          const email = urlParams.get('email');
          const error = urlParams.get('error');

          if (authStatus === 'success' && authProvider === provider.toLowerCase()) {
            resolve({ success: true, email: email || undefined });
            
            // Clean up URL parameters
            window.history.replaceState({}, document.title, window.location.pathname);
          } else if (authStatus === 'error' && authProvider === provider.toLowerCase()) {
            resolve({ success: false, error: error || 'Authentication failed' });
            
            // Clean up URL parameters
            window.history.replaceState({}, document.title, window.location.pathname);
          } else {
            resolve({ success: false, error: 'Authentication was cancelled or failed' });
          }
        }
      }, 1000);

      // Handle message from popup (alternative approach)
      const messageHandler = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'OAUTH_SUCCESS') {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          popup.close();
          resolve({ success: true, email: event.data.email });
        } else if (event.data.type === 'OAUTH_ERROR') {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          popup.close();
          resolve({ success: false, error: event.data.error });
        }
      };

      window.addEventListener('message', messageHandler);

      // Timeout after 5 minutes
      setTimeout(() => {
        if (!popup.closed) {
          popup.close();
        }
        clearInterval(checkClosed);
        window.removeEventListener('message', messageHandler);
        resolve({ success: false, error: 'Authentication timed out' });
      }, 300000); // 5 minutes
    });
  }

  async connectGmail(): Promise<{ success: boolean; email?: string; error?: string }> {
    try {
      const authUrl = await this.initiateGmailAuth();
      return await this.openOAuthPopup(authUrl, 'GMAIL');
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to connect Gmail' 
      };
    }
  }

  async connectOutlook(): Promise<{ success: boolean; email?: string; error?: string }> {
    try {
      const authUrl = await this.initiateOutlookAuth();
      return await this.openOAuthPopup(authUrl, 'OUTLOOK');
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to connect Outlook' 
      };
    }
  }
}

export const emailAuthService = new EmailAuthService();