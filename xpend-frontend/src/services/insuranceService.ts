const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8087'; // Insurance service port

export interface Insurance {
  id: string;
  userId: number;
  groupId: string | null;
  name: string;
  policyType: 'life' | 'health' | 'vehicle' | 'home' | 'travel' | 'other';
  companyName: string;
  policyNumber: string;
  sumAssured: number;
  premiumAmount: number;
  premiumFrequency: 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';
  premiumDueDate: number;
  policyStartDate: string;
  policyEndDate: string;
  nominees: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InsuranceCreateRequest {
  name: string;
  policyType: 'life' | 'health' | 'vehicle' | 'home' | 'travel' | 'other';
  companyName: string;
  policyNumber: string;
  sumAssured: number;
  premiumAmount: number;
  premiumFrequency: 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';
  premiumDueDate: number;
  policyStartDate: string;
  policyEndDate: string;
  nominees: string[];
}

export interface InsuranceUpdateRequest {
  name?: string;
  policyType?: 'life' | 'health' | 'vehicle' | 'home' | 'travel' | 'other';
  companyName?: string;
  policyNumber?: string;
  sumAssured?: number;
  premiumAmount?: number;
  premiumFrequency?: 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';
  premiumDueDate?: number;
  policyStartDate?: string;
  policyEndDate?: string;
  nominees?: string[];
  isActive?: boolean;
}

class InsuranceService {
  private getAuthHeaders(): HeadersInit {
    // Use valid JWT token for development
    const devToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJkZXZAZXhhbXBsZS5jb20iLCJmdWxsTmFtZSI6IkRldmVsb3BtZW50IFVzZXIiLCJyb2xlcyI6WyJVU0VSIiwiQURNSU4iXSwiaWF0IjoxNzUzODE1MzA5LCJleHAiOjE3NTY0MDczMDl9.XSsRmCiKGgMKCzGOeZvvVnCH4NPK2SkoLJ7RQvS04vk';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${devToken}`
    };
  }

  async getAllInsurance(): Promise<Insurance[]> {
    console.log('InsuranceService.getAllInsurance called');
    console.log('API_BASE_URL:', API_BASE_URL);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/insurance`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch insurance: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Failed to fetch insurance from backend:', error);
      // Return empty array when backend is not available
      return [];
    }
  }

  async getInsuranceById(id: string): Promise<Insurance> {
    const response = await fetch(`${API_BASE_URL}/api/insurance/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch insurance: ${response.statusText}`);
    }

    return response.json();
  }

  async createInsurance(insurance: InsuranceCreateRequest): Promise<Insurance> {
    console.log('InsuranceService.createInsurance called with:', insurance);

    try {
      const response = await fetch(`${API_BASE_URL}/api/insurance`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(insurance),
      });

      console.log('Create insurance response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Create insurance error response:', errorText);
        throw new Error(`Failed to create insurance: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Failed to create insurance:', error);
      throw error;
    }
  }

  async updateInsurance(id: string, insurance: InsuranceUpdateRequest): Promise<Insurance> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/insurance/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(insurance),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update insurance error response:', errorText);
        throw new Error(`Failed to update insurance: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Failed to update insurance:', error);
      throw error;
    }
  }

  async deleteInsurance(id: string): Promise<void> {
    console.log('Deleting insurance with ID:', id);
    try {
      const response = await fetch(`${API_BASE_URL}/api/insurance/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      console.log('Delete insurance response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete insurance error response:', errorText);
        throw new Error(`Failed to delete insurance: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      console.log('Insurance deleted successfully');
    } catch (error) {
      console.error('Failed to delete insurance:', error);
      throw error;
    }
  }
}

export const insuranceService = new InsuranceService();