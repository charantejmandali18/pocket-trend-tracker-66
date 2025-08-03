interface User {
  id: number;
  email: string;
  fullName: string;
  profilePictureUrl?: string;
  roles: string[];
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  userId: number;
  email: string;
  fullName: string;
  profilePictureUrl?: string;
  roles: string[];
}

interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface RegisterRequest {
  email: string;
  fullName: string;
  password: string;
  confirmPassword: string;
}

class AuthService {
  private baseURL = 'http://localhost:8081/api/auth';
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private user: User | null = null;

  constructor() {
    // Load tokens from localStorage on initialization
    this.loadTokensFromStorage();
  }

  private loadTokensFromStorage() {
    this.accessToken = localStorage.getItem('xpend_access_token');
    this.refreshToken = localStorage.getItem('xpend_refresh_token');
    const userStr = localStorage.getItem('xpend_user');
    if (userStr) {
      try {
        this.user = JSON.parse(userStr);
      } catch (error) {
        console.error('Failed to parse user from localStorage:', error);
        this.clearTokens();
      }
    }
  }

  private saveTokensToStorage(authResponse: AuthResponse) {
    this.accessToken = authResponse.accessToken;
    this.refreshToken = authResponse.refreshToken;
    this.user = {
      id: authResponse.userId,
      email: authResponse.email,
      fullName: authResponse.fullName,
      profilePictureUrl: authResponse.profilePictureUrl,
      roles: authResponse.roles
    };

    localStorage.setItem('xpend_access_token', this.accessToken);
    localStorage.setItem('xpend_refresh_token', this.refreshToken);
    localStorage.setItem('xpend_user', JSON.stringify(this.user));
  }

  private clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    this.user = null;
    localStorage.removeItem('xpend_access_token');
    localStorage.removeItem('xpend_refresh_token');
    localStorage.removeItem('xpend_user');
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...options.headers,
    };

    // Add Authorization header if we have an access token
    if (this.accessToken && !endpoint.includes('/login') && !endpoint.includes('/register')) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // If we get a 401 and have a refresh token, try to refresh
    if (response.status === 401 && this.refreshToken && !endpoint.includes('/refresh-token')) {
      try {
        await this.refreshAccessToken();
        // Retry the original request with the new token
        headers['Authorization'] = `Bearer ${this.accessToken}`;
        return fetch(url, {
          ...options,
          headers,
        });
      } catch (refreshError) {
        // Refresh failed, redirect to login
        this.clearTokens();
        window.location.reload();
        throw refreshError;
      }
    }

    return response;
  }

  async register(request: RegisterRequest): Promise<AuthResponse> {
    const response = await this.makeRequest('/register', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    const authResponse: AuthResponse = await response.json();
    this.saveTokensToStorage(authResponse);
    return authResponse;
  }

  async login(request: LoginRequest): Promise<AuthResponse> {
    const response = await this.makeRequest('/login', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const authResponse: AuthResponse = await response.json();
    this.saveTokensToStorage(authResponse);
    return authResponse;
  }

  async logout(): Promise<void> {
    try {
      if (this.refreshToken) {
        await this.makeRequest('/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        });
      }
    } catch (error) {
      console.error('Logout request failed:', error);
      // Continue with local logout even if server request fails
    } finally {
      this.clearTokens();
    }
  }

  async refreshAccessToken(): Promise<AuthResponse> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.baseURL}/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken: this.refreshToken }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Token refresh failed');
    }

    const authResponse: AuthResponse = await response.json();
    this.saveTokensToStorage(authResponse);
    return authResponse;
  }

  async validateToken(): Promise<boolean> {
    if (!this.refreshToken) {
      return false;
    }

    try {
      const response = await this.makeRequest('/validate-token', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!response.ok) {
        return false;
      }

      const result = await response.json();
      return result.valid === true;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  }

  isAuthenticated(): boolean {
    return this.accessToken !== null && this.user !== null;
  }

  getCurrentUser(): User | null {
    return this.user;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  // Google OAuth login
  async loginWithGoogle(idToken: string): Promise<AuthResponse> {
    const response = await this.makeRequest('/oauth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Google login failed');
    }

    const authResponse: AuthResponse = await response.json();
    this.saveTokensToStorage(authResponse);
    return authResponse;
  }
}

// Export a singleton instance
export const authService = new AuthService();
export type { User, AuthResponse, LoginRequest, RegisterRequest };