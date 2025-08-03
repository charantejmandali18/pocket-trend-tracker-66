const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8089'; // Recurring payment service port

export interface RecurringPayment {
  id: string;
  userId: number;
  groupId: string | null;
  name: string;
  description: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  categoryId: string;
  paymentDate: number;
  startDate: string;
  autoCreateTransaction: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringPaymentCreateRequest {
  name: string;
  description: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  categoryId: string;
  paymentDate: number;
  startDate: string;
  autoCreateTransaction: boolean;
}

export interface RecurringPaymentUpdateRequest {
  name?: string;
  description?: string;
  amount?: number;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  categoryId?: string;
  paymentDate?: number;
  startDate?: string;
  autoCreateTransaction?: boolean;
  isActive?: boolean;
}

class RecurringPaymentService {
  private getAuthHeaders(): HeadersInit {
    // Use valid JWT token for development
    const devToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJkZXZAZXhhbXBsZS5jb20iLCJmdWxsTmFtZSI6IkRldmVsb3BtZW50IFVzZXIiLCJyb2xlcyI6WyJVU0VSIiwiQURNSU4iXSwiaWF0IjoxNzUzODE1MzA5LCJleHAiOjE3NTY0MDczMDl9.XSsRmCiKGgMKCzGOeZvvVnCH4NPK2SkoLJ7RQvS04vk';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${devToken}`
    };
  }

  async getAllRecurringPayments(): Promise<RecurringPayment[]> {
    console.log('RecurringPaymentService.getAllRecurringPayments called');
    console.log('API_BASE_URL:', API_BASE_URL);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/recurring-payments`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch recurring payments: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Failed to fetch recurring payments from backend:', error);
      // Return empty array when backend is not available
      return [];
    }
  }

  async getRecurringPaymentById(id: string): Promise<RecurringPayment> {
    const response = await fetch(`${API_BASE_URL}/api/recurring-payments/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch recurring payment: ${response.statusText}`);
    }

    return response.json();
  }

  async createRecurringPayment(recurringPayment: RecurringPaymentCreateRequest): Promise<RecurringPayment> {
    console.log('RecurringPaymentService.createRecurringPayment called with:', recurringPayment);

    try {
      const response = await fetch(`${API_BASE_URL}/api/recurring-payments`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(recurringPayment),
      });

      console.log('Create recurring payment response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Create recurring payment error response:', errorText);
        throw new Error(`Failed to create recurring payment: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Failed to create recurring payment:', error);
      throw error;
    }
  }

  async updateRecurringPayment(id: string, recurringPayment: RecurringPaymentUpdateRequest): Promise<RecurringPayment> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/recurring-payments/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(recurringPayment),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update recurring payment error response:', errorText);
        throw new Error(`Failed to update recurring payment: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Failed to update recurring payment:', error);
      throw error;
    }
  }

  async deleteRecurringPayment(id: string): Promise<void> {
    console.log('Deleting recurring payment with ID:', id);
    try {
      const response = await fetch(`${API_BASE_URL}/api/recurring-payments/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      console.log('Delete recurring payment response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete recurring payment error response:', errorText);
        throw new Error(`Failed to delete recurring payment: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      console.log('Recurring payment deleted successfully');
    } catch (error) {
      console.error('Failed to delete recurring payment:', error);
      throw error;
    }
  }
}

export const recurringPaymentService = new RecurringPaymentService();