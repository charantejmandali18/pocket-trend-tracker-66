const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8083';

export interface Account {
  id: string;
  userId: number;
  groupId: string | null;
  accountName: string;
  accountType: 'SAVINGS' | 'CHECKING' | 'CREDIT_CARD' | 'LOAN' | 'INVESTMENT' | 'CASH' | 'REAL_ESTATE' | 'VEHICLE' | 'OTHER';
  bankName?: string;
  accountNumber?: string;
  balance: number;
  creditLimit?: number;
  interestRate?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AccountCreateRequest {
  accountName: string;
  accountType: 'SAVINGS' | 'CHECKING' | 'CREDIT_CARD' | 'LOAN' | 'INVESTMENT' | 'CASH' | 'REAL_ESTATE' | 'VEHICLE' | 'OTHER';
  bankName?: string;
  accountNumber?: string;
  balance: number;
  creditLimit?: number;
  interestRate?: number;
}

export interface AccountUpdateRequest {
  accountName?: string;
  bankName?: string;
  accountNumber?: string;
  balance?: number;
  creditLimit?: number;
  interestRate?: number;
  isActive?: boolean;
}

class AccountService {
  private getAuthHeaders(): HeadersInit {
    // Use valid JWT token for development
    const devToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJkZXZAZXhhbXBsZS5jb20iLCJmdWxsTmFtZSI6IkRldmVsb3BtZW50IFVzZXIiLCJyb2xlcyI6WyJVU0VSIiwiQURNSU4iXSwiaWF0IjoxNzUzODE1MzA5LCJleHAiOjE3NTY0MDczMDl9.XSsRmCiKGgMKCzGOeZvvVnCH4NPK2SkoLJ7RQvS04vk';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${devToken}`
    };
  }

  async getAllAccounts(): Promise<Account[]> {
    console.log('AccountService.getAllAccounts called');
    console.log('API_BASE_URL:', API_BASE_URL);
    
    const response = await fetch(`${API_BASE_URL}/api/accounts`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Failed to fetch accounts: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  async getAccountById(id: string): Promise<Account> {
    const response = await fetch(`${API_BASE_URL}/api/accounts/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch account: ${response.statusText}`);
    }

    return response.json();
  }

  async createAccount(account: AccountCreateRequest): Promise<Account> {
    console.log('AccountService.createAccount called with:', account);
    
    const response = await fetch(`${API_BASE_URL}/api/accounts`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(account),
    });

    console.log('Create account response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Create account error response:', errorText);
      throw new Error(`Failed to create account: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  async updateAccount(id: string, account: AccountCreateRequest): Promise<Account> {
    const response = await fetch(`${API_BASE_URL}/api/accounts/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(account),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Update account error response:', errorText);
      throw new Error(`Failed to update account: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  async deleteAccount(id: string): Promise<void> {
    console.log('Deleting account with ID:', id);
    const response = await fetch(`${API_BASE_URL}/api/accounts/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    console.log('Delete account response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Delete account error response:', errorText);
      throw new Error(`Failed to delete account: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    console.log('Account deleted successfully');
  }
}

export const accountService = new AccountService();