const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8084'; // Credit card service port

export interface CreditCard {
  id: string;
  userId: number;
  groupId: string | null;
  name: string;
  bankName: string;
  cardNumberLast4: string;
  creditLimit: number;
  currentBalance: number;
  interestRate: number;
  annualFee: number;
  dueDate: number;
  minimumPayment: number;
  statementDate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreditCardCreateRequest {
  name: string;
  bankName: string;
  cardNumberLast4: string;
  creditLimit: number;
  currentBalance: number;
  interestRate: number;
  annualFee: number;
  dueDate: number;
  minimumPayment: number;
  statementDate: number;
}

export interface CreditCardUpdateRequest {
  name?: string;
  bankName?: string;
  cardNumberLast4?: string;
  creditLimit?: number;
  currentBalance?: number;
  interestRate?: number;
  annualFee?: number;
  dueDate?: number;
  minimumPayment?: number;
  statementDate?: number;
  isActive?: boolean;
}

class CreditCardService {
  private getAuthHeaders(): HeadersInit {
    // Use valid JWT token for development
    const devToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJkZXZAZXhhbXBsZS5jb20iLCJmdWxsTmFtZSI6IkRldmVsb3BtZW50IFVzZXIiLCJyb2xlcyI6WyJVU0VSIiwiQURNSU4iXSwiaWF0IjoxNzUzODE1MzA5LCJleHAiOjE3NTY0MDczMDl9.XSsRmCiKGgMKCzGOeZvvVnCH4NPK2SkoLJ7RQvS04vk';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${devToken}`
    };
  }

  async getAllCreditCards(): Promise<CreditCard[]> {
    console.log('CreditCardService.getAllCreditCards called');
    console.log('API_BASE_URL:', API_BASE_URL);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/credit-cards`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch credit cards: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Failed to fetch credit cards from backend:', error);
      // Return empty array when backend is not available
      return [];
    }
  }

  async getCreditCardById(id: string): Promise<CreditCard> {
    const response = await fetch(`${API_BASE_URL}/api/credit-cards/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch credit card: ${response.statusText}`);
    }

    return response.json();
  }

  async createCreditCard(creditCard: CreditCardCreateRequest): Promise<CreditCard> {
    console.log('CreditCardService.createCreditCard called with:', creditCard);

    try {
      const response = await fetch(`${API_BASE_URL}/api/credit-cards`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(creditCard),
      });

      console.log('Create credit card response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Create credit card error response:', errorText);
        throw new Error(`Failed to create credit card: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Failed to create credit card:', error);
      throw error;
    }
  }

  async updateCreditCard(id: string, creditCard: CreditCardUpdateRequest): Promise<CreditCard> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/credit-cards/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(creditCard),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update credit card error response:', errorText);
        throw new Error(`Failed to update credit card: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Failed to update credit card:', error);
      throw error;
    }
  }

  async deleteCreditCard(id: string): Promise<void> {
    console.log('Deleting credit card with ID:', id);
    try {
      const response = await fetch(`${API_BASE_URL}/api/credit-cards/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      console.log('Delete credit card response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete credit card error response:', errorText);
        throw new Error(`Failed to delete credit card: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      console.log('Credit card deleted successfully');
    } catch (error) {
      console.error('Failed to delete credit card:', error);
      throw error;
    }
  }
}

export const creditCardService = new CreditCardService();