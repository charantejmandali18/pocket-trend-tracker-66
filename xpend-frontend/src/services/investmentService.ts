const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8086'; // Investment service port

export interface Investment {
  id: string;
  userId: number;
  groupId: string | null;
  name: string;
  investmentType: 'mutual_fund' | 'stocks' | 'bonds' | 'fd' | 'rd' | 'ppf' | 'nps' | 'other';
  platform: string;
  investedAmount: number;
  currentValue: number;
  sipAmount: number;
  sipDate: number;
  maturityDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InvestmentCreateRequest {
  name: string;
  investmentType: 'mutual_fund' | 'stocks' | 'bonds' | 'fd' | 'rd' | 'ppf' | 'nps' | 'other';
  platform: string;
  investedAmount: number;
  currentValue: number;
  sipAmount: number;
  sipDate: number;
  maturityDate: string;
}

export interface InvestmentUpdateRequest {
  name?: string;
  investmentType?: 'mutual_fund' | 'stocks' | 'bonds' | 'fd' | 'rd' | 'ppf' | 'nps' | 'other';
  platform?: string;
  investedAmount?: number;
  currentValue?: number;
  sipAmount?: number;
  sipDate?: number;
  maturityDate?: string;
  isActive?: boolean;
}

class InvestmentService {
  private getAuthHeaders(): HeadersInit {
    // Use valid JWT token for development
    const devToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJkZXZAZXhhbXBsZS5jb20iLCJmdWxsTmFtZSI6IkRldmVsb3BtZW50IFVzZXIiLCJyb2xlcyI6WyJVU0VSIiwiQURNSU4iXSwiaWF0IjoxNzUzODE1MzA5LCJleHAiOjE3NTY0MDczMDl9.XSsRmCiKGgMKCzGOeZvvVnCH4NPK2SkoLJ7RQvS04vk';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${devToken}`
    };
  }

  async getAllInvestments(): Promise<Investment[]> {
    console.log('InvestmentService.getAllInvestments called');
    console.log('API_BASE_URL:', API_BASE_URL);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/investments`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch investments: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Failed to fetch investments from backend:', error);
      // Return empty array when backend is not available
      return [];
    }
  }

  async getInvestmentById(id: string): Promise<Investment> {
    const response = await fetch(`${API_BASE_URL}/api/investments/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch investment: ${response.statusText}`);
    }

    return response.json();
  }

  async createInvestment(investment: InvestmentCreateRequest): Promise<Investment> {
    console.log('InvestmentService.createInvestment called with:', investment);

    try {
      const response = await fetch(`${API_BASE_URL}/api/investments`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(investment),
      });

      console.log('Create investment response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Create investment error response:', errorText);
        throw new Error(`Failed to create investment: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Failed to create investment:', error);
      throw error;
    }
  }

  async updateInvestment(id: string, investment: InvestmentUpdateRequest): Promise<Investment> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/investments/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(investment),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update investment error response:', errorText);
        throw new Error(`Failed to update investment: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Failed to update investment:', error);
      throw error;
    }
  }

  async deleteInvestment(id: string): Promise<void> {
    console.log('Deleting investment with ID:', id);
    try {
      const response = await fetch(`${API_BASE_URL}/api/investments/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      console.log('Delete investment response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete investment error response:', errorText);
        throw new Error(`Failed to delete investment: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      console.log('Investment deleted successfully');
    } catch (error) {
      console.error('Failed to delete investment:', error);
      throw error;
    }
  }
}

export const investmentService = new InvestmentService();