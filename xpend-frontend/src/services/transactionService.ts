const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082';

export interface Transaction {
  id: string;
  userId: number;
  groupId: string | null;
  createdBy: number;
  transactionType: 'INCOME' | 'EXPENSE';
  amount: number;
  description: string;
  categoryId: string;
  transactionDate: string;
  paymentMethod?: string;
  accountName?: string;
  notes?: string;
  source: string;
  createdAt: string;
  memberEmail: string;
  categories?: {
    id: string;
    name: string;
    color: string;
    icon?: string;
  };
}

export interface TransactionCreateRequest {
  transactionType: 'INCOME' | 'EXPENSE';
  amount: number;
  description: string;
  categoryId: string;
  transactionDate: string;
  paymentMethod?: string;
  accountName?: string;
  notes?: string;
}

export interface TransactionUpdateRequest {
  transactionType?: 'INCOME' | 'EXPENSE';
  amount?: number;
  description?: string;
  categoryId?: string;
  transactionDate?: string;
  paymentMethod?: string;
  accountName?: string;
  notes?: string;
}

export interface TransactionSearchCriteria {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  startDate?: string;
  endDate?: string;
  transactionType?: 'INCOME' | 'EXPENSE';
  categoryId?: string;
  description?: string;
  minAmount?: number;
  maxAmount?: number;
  paymentMethod?: string;
  accountName?: string;
}

class TransactionService {
  private getAuthHeaders(): HeadersInit {
    // Use valid JWT token for development
    const devToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJkZXZAZXhhbXBsZS5jb20iLCJmdWxsTmFtZSI6IkRldmVsb3BtZW50IFVzZXIiLCJyb2xlcyI6WyJVU0VSIiwiQURNSU4iXSwiaWF0IjoxNzUzODE1MzA5LCJleHAiOjE3NTY0MDczMDl9.XSsRmCiKGgMKCzGOeZvvVnCH4NPK2SkoLJ7RQvS04vk';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${devToken}`
    };
  }

  async getAllTransactions(searchCriteria?: TransactionSearchCriteria): Promise<Transaction[]> {
    const params = new URLSearchParams();
    
    if (searchCriteria) {
      Object.entries(searchCriteria).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const response = await fetch(
      `${API_BASE_URL}/api/transactions${params.toString() ? `?${params.toString()}` : ''}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch transactions: ${response.statusText}`);
    }

    return response.json();
  }

  async getTransactionById(id: string): Promise<Transaction> {
    const response = await fetch(`${API_BASE_URL}/api/transactions/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch transaction: ${response.statusText}`);
    }

    return response.json();
  }

  async createTransaction(transaction: TransactionCreateRequest): Promise<Transaction> {
    console.log('TransactionService.createTransaction called with:', transaction);
    console.log('API_BASE_URL:', API_BASE_URL);
    
    const response = await fetch(`${API_BASE_URL}/api/transactions`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(transaction),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Failed to create transaction: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  async updateTransaction(id: string, transaction: TransactionUpdateRequest): Promise<Transaction> {
    const response = await fetch(`${API_BASE_URL}/api/transactions/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(transaction),
    });

    if (!response.ok) {
      throw new Error(`Failed to update transaction: ${response.statusText}`);
    }

    return response.json();
  }

  async deleteTransaction(id: string): Promise<void> {
    console.log('Deleting transaction with ID:', id);
    const response = await fetch(`${API_BASE_URL}/api/transactions/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    console.log('Delete response status:', response.status);
    console.log('Delete response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Delete error response:', errorText);
      throw new Error(`Failed to delete transaction: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    console.log('Transaction deleted successfully');
  }

  async createBulkTransactions(transactions: TransactionCreateRequest[]): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/transactions/bulk`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ transactions }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create bulk transactions: ${response.statusText}`);
    }

    return response.json();
  }
}

export const transactionService = new TransactionService();