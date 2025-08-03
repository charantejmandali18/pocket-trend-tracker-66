const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8085'; // Loan service port

export interface Loan {
  id: string;
  userId: number;
  groupId: string | null;
  name: string;
  loanType: 'home' | 'car' | 'personal' | 'education' | 'business' | 'other';
  bankName: string;
  principalAmount: number;
  currentBalance: number;
  interestRate: number;
  tenureMonths: number;
  emiAmount: number;
  emiDate: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoanCreateRequest {
  name: string;
  loanType: 'home' | 'car' | 'personal' | 'education' | 'business' | 'other';
  bankName: string;
  principalAmount: number;
  currentBalance: number;
  interestRate: number;
  tenureMonths: number;
  emiAmount: number;
  emiDate: number;
  startDate: string;
  endDate: string;
}

export interface LoanUpdateRequest {
  name?: string;
  loanType?: 'home' | 'car' | 'personal' | 'education' | 'business' | 'other';
  bankName?: string;
  principalAmount?: number;
  currentBalance?: number;
  interestRate?: number;
  tenureMonths?: number;
  emiAmount?: number;
  emiDate?: number;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

class LoanService {
  private getAuthHeaders(): HeadersInit {
    // Use valid JWT token for development
    const devToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJkZXZAZXhhbXBsZS5jb20iLCJmdWxsTmFtZSI6IkRldmVsb3BtZW50IFVzZXIiLCJyb2xlcyI6WyJVU0VSIiwiQURNSU4iXSwiaWF0IjoxNzUzODE1MzA5LCJleHAiOjE3NTY0MDczMDl9.XSsRmCiKGgMKCzGOeZvvVnCH4NPK2SkoLJ7RQvS04vk';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${devToken}`
    };
  }

  async getAllLoans(): Promise<Loan[]> {
    console.log('LoanService.getAllLoans called');
    console.log('API_BASE_URL:', API_BASE_URL);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/loans`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch loans: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Failed to fetch loans from backend:', error);
      // Return empty array when backend is not available
      return [];
    }
  }

  async getLoanById(id: string): Promise<Loan> {
    const response = await fetch(`${API_BASE_URL}/api/loans/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch loan: ${response.statusText}`);
    }

    return response.json();
  }

  async createLoan(loan: LoanCreateRequest): Promise<Loan> {
    console.log('LoanService.createLoan called with:', loan);

    try {
      const response = await fetch(`${API_BASE_URL}/api/loans`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(loan),
      });

      console.log('Create loan response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Create loan error response:', errorText);
        throw new Error(`Failed to create loan: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Failed to create loan:', error);
      throw error;
    }
  }

  async updateLoan(id: string, loan: LoanUpdateRequest): Promise<Loan> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/loans/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(loan),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update loan error response:', errorText);
        throw new Error(`Failed to update loan: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Failed to update loan:', error);
      throw error;
    }
  }

  async deleteLoan(id: string): Promise<void> {
    console.log('Deleting loan with ID:', id);
    try {
      const response = await fetch(`${API_BASE_URL}/api/loans/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      console.log('Delete loan response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete loan error response:', errorText);
        throw new Error(`Failed to delete loan: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      console.log('Loan deleted successfully');
    } catch (error) {
      console.error('Failed to delete loan:', error);
      throw error;
    }
  }
}

export const loanService = new LoanService();