const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082';

export interface Category {
  id: string;
  userId: number;
  groupId: string | null;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  categoryType: 'INCOME' | 'EXPENSE';
  isActive: boolean;
  isSystemDefault: boolean;
  parentCategoryId?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  updatedBy?: number;
}

export interface CategoryCreateRequest {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  categoryType: 'INCOME' | 'EXPENSE';
  parentCategoryId?: string;
  sortOrder?: number;
}

class CategoryService {
  private getAuthHeaders(): HeadersInit {
    // Use valid JWT token for development
    const devToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJkZXZAZXhhbXBsZS5jb20iLCJmdWxsTmFtZSI6IkRldmVsb3BtZW50IFVzZXIiLCJyb2xlcyI6WyJVU0VSIiwiQURNSU4iXSwiaWF0IjoxNzUzODE1MzA5LCJleHAiOjE3NTY0MDczMDl9.XSsRmCiKGgMKCzGOeZvvVnCH4NPK2SkoLJ7RQvS04vk';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${devToken}`
    };
  }

  async getAllCategories(type?: 'income' | 'expense', userId?: number, groupId?: string): Promise<Category[]> {
    const params = new URLSearchParams();
    
    if (type) params.append('type', type);
    if (userId) params.append('userId', userId.toString());
    if (groupId) params.append('groupId', groupId);

    const response = await fetch(
      `${API_BASE_URL}/api/categories${params.toString() ? `?${params.toString()}` : ''}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.statusText}`);
    }

    return response.json();
  }

  async getCategoryById(id: string): Promise<Category> {
    const response = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch category: ${response.statusText}`);
    }

    return response.json();
  }

  async createCategory(category: CategoryCreateRequest): Promise<Category> {
    const response = await fetch(`${API_BASE_URL}/api/categories`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(category),
    });

    if (!response.ok) {
      throw new Error(`Failed to create category: ${response.statusText}`);
    }

    return response.json();
  }

  async updateCategory(id: string, category: Partial<CategoryCreateRequest>): Promise<Category> {
    const response = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(category),
    });

    if (!response.ok) {
      throw new Error(`Failed to update category: ${response.statusText}`);
    }

    return response.json();
  }

  async deleteCategory(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete category: ${response.statusText}`);
    }
  }
}

export const categoryService = new CategoryService();