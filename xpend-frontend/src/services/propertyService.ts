const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8088'; // Property service port

export interface Property {
  id: string;
  userId: number;
  groupId: string | null;
  name: string;
  propertyType: 'residential' | 'commercial' | 'land' | 'other';
  address: string;
  purchasePrice: number;
  currentValue: number;
  ownershipPercentage: number;
  rentalIncome: number;
  propertyTax: number;
  maintenanceCost: number;
  purchaseDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyCreateRequest {
  name: string;
  propertyType: 'residential' | 'commercial' | 'land' | 'other';
  address: string;
  purchasePrice: number;
  currentValue: number;
  ownershipPercentage: number;
  rentalIncome: number;
  propertyTax: number;
  maintenanceCost: number;
  purchaseDate: string;
}

export interface PropertyUpdateRequest {
  name?: string;
  propertyType?: 'residential' | 'commercial' | 'land' | 'other';
  address?: string;
  purchasePrice?: number;
  currentValue?: number;
  ownershipPercentage?: number;
  rentalIncome?: number;
  propertyTax?: number;
  maintenanceCost?: number;
  purchaseDate?: string;
  isActive?: boolean;
}

class PropertyService {
  private getAuthHeaders(): HeadersInit {
    // Use valid JWT token for development
    const devToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJkZXZAZXhhbXBsZS5jb20iLCJmdWxsTmFtZSI6IkRldmVsb3BtZW50IFVzZXIiLCJyb2xlcyI6WyJVU0VSIiwiQURNSU4iXSwiaWF0IjoxNzUzODE1MzA5LCJleHAiOjE3NTY0MDczMDl9.XSsRmCiKGgMKCzGOeZvvVnCH4NPK2SkoLJ7RQvS04vk';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${devToken}`
    };
  }

  async getAllProperties(): Promise<Property[]> {
    console.log('PropertyService.getAllProperties called');
    console.log('API_BASE_URL:', API_BASE_URL);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/properties`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch properties: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Failed to fetch properties from backend:', error);
      // Return empty array when backend is not available
      return [];
    }
  }

  async getPropertyById(id: string): Promise<Property> {
    const response = await fetch(`${API_BASE_URL}/api/properties/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch property: ${response.statusText}`);
    }

    return response.json();
  }

  async createProperty(property: PropertyCreateRequest): Promise<Property> {
    console.log('PropertyService.createProperty called with:', property);

    try {
      const response = await fetch(`${API_BASE_URL}/api/properties`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(property),
      });

      console.log('Create property response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Create property error response:', errorText);
        throw new Error(`Failed to create property: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Failed to create property:', error);
      throw error;
    }
  }

  async updateProperty(id: string, property: PropertyUpdateRequest): Promise<Property> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/properties/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(property),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update property error response:', errorText);
        throw new Error(`Failed to update property: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Failed to update property:', error);
      throw error;
    }
  }

  async deleteProperty(id: string): Promise<void> {
    console.log('Deleting property with ID:', id);
    try {
      const response = await fetch(`${API_BASE_URL}/api/properties/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      console.log('Delete property response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete property error response:', errorText);
        throw new Error(`Failed to delete property: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      console.log('Property deleted successfully');
    } catch (error) {
      console.error('Failed to delete property:', error);
      throw error;
    }
  }
}

export const propertyService = new PropertyService();