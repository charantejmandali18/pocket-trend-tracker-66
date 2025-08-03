const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082';

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  savingsRate: number;
  transactionCount: number;
}

export interface NetWorthSummary {
  assets: {
    bankAccounts: number;
    investments: number;
    properties: number;
    cash: number;
    total: number;
  };
  liabilities: {
    loans: number;
    creditCards: number;
    total: number;
  };
  netWorth: number;
  transactionNetBalance: number;
  totalLiquidAssets: number;
}

export interface CategoryBreakdown {
  categories: Array<{
    categoryId: string;
    amount: number;
    percentage: number;
    transactionCount: number;
  }>;
  totalExpenses: number;
  topCategory: {
    categoryId: string;
    amount: number;
    percentage: number;
    transactionCount: number;
  } | null;
}

export interface MonthlyProjections {
  daysInMonth: number;
  daysPassed: number;
  daysRemaining: number;
  currentExpenses: number;
  dailyAverage: number;
  projectedTotal: number;
  projectedRemaining: number;
}

export interface DashboardOverview {
  financialSummary: FinancialSummary;
  categoryBreakdown: CategoryBreakdown;
  monthlyProjections: MonthlyProjections;
  trends: {
    dailyExpenses: Record<string, number>;
    averageDailySpending: number;
  };
  recentTransactions: Array<{
    id: string;
    description: string;
    amount: number;
    transactionType: 'INCOME' | 'EXPENSE';
    transactionDate: string;
    categoryId: string;
    paymentMethod: string;
    createdAt: string;
  }>;
}

class DashboardService {
  private getAuthHeaders(): HeadersInit {
    // Use valid JWT token for development  
    const devToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJkZXZAZXhhbXBsZS5jb20iLCJmdWxsTmFtZSI6IkRldmVsb3BtZW50IFVzZXIiLCJyb2xlcyI6WyJVU0VSIiwiQURNSU4iXSwiaWF0IjoxNzUzODE1MzA5LCJleHAiOjE3NTY0MDczMDl9.XSsRmCiKGgMKCzGOeZvvVnCH4NPK2SkoLJ7RQvS04vk';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${devToken}`
    };
  }

  async getDashboardOverview(startDate?: string, endDate?: string): Promise<DashboardOverview> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await fetch(
      `${API_BASE_URL}/api/dashboard/overview${params.toString() ? `?${params.toString()}` : ''}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch dashboard overview: ${response.statusText}`);
    }

    return response.json();
  }

  async getFinancialSummary(startDate?: string, endDate?: string): Promise<FinancialSummary> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await fetch(
      `${API_BASE_URL}/api/dashboard/financial-summary${params.toString() ? `?${params.toString()}` : ''}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch financial summary: ${response.statusText}`);
    }

    return response.json();
  }

  async getCategoryBreakdown(startDate?: string, endDate?: string): Promise<CategoryBreakdown> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await fetch(
      `${API_BASE_URL}/api/dashboard/category-breakdown${params.toString() ? `?${params.toString()}` : ''}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch category breakdown: ${response.statusText}`);
    }

    return response.json();
  }

  async getMonthlyProjections(month?: string): Promise<MonthlyProjections> {
    const params = new URLSearchParams();
    if (month) params.append('month', month);

    const response = await fetch(
      `${API_BASE_URL}/api/dashboard/monthly-projections${params.toString() ? `?${params.toString()}` : ''}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch monthly projections: ${response.statusText}`);
    }

    return response.json();
  }

  async getRecentTransactions(limit: number = 10): Promise<{
    transactions: Array<{
      id: string;
      description: string;
      amount: number;
      transactionType: 'INCOME' | 'EXPENSE';
      transactionDate: string;
      categoryId: string;
      paymentMethod: string;
      createdAt: string;
    }>;
    total: number;
    hasMore: boolean;
  }> {
    const response = await fetch(
      `${API_BASE_URL}/api/dashboard/recent-transactions?limit=${limit}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch recent transactions: ${response.statusText}`);
    }

    return response.json();
  }

  async calculateNetWorth(): Promise<NetWorthSummary> {
    // This method will aggregate data from all account services
    // Note: This is a client-side calculation that should ideally
    // be done on the backend for better performance and consistency
    try {
      const [accountsResponse, loansResponse, investmentsResponse, creditCardsResponse, propertiesResponse, transactionsResponse] = await Promise.allSettled([
        fetch('http://localhost:8083/api/accounts', { headers: this.getAuthHeaders() }),
        fetch('http://localhost:8085/api/loans', { headers: this.getAuthHeaders() }),
        fetch('http://localhost:8087/api/investments', { headers: this.getAuthHeaders() }),
        fetch('http://localhost:8084/api/credit-cards', { headers: this.getAuthHeaders() }),
        fetch('http://localhost:8088/api/properties', { headers: this.getAuthHeaders() }),
        fetch('http://localhost:8082/api/transactions', { headers: this.getAuthHeaders() })
      ]);

      // Parse successful responses
      const accounts = accountsResponse.status === 'fulfilled' && accountsResponse.value.ok 
        ? await accountsResponse.value.json() : [];
      const loans = loansResponse.status === 'fulfilled' && loansResponse.value.ok 
        ? await loansResponse.value.json() : [];
      const investments = investmentsResponse.status === 'fulfilled' && investmentsResponse.value.ok 
        ? await investmentsResponse.value.json() : [];
      const creditCards = creditCardsResponse.status === 'fulfilled' && creditCardsResponse.value.ok 
        ? await creditCardsResponse.value.json() : [];
      const properties = propertiesResponse.status === 'fulfilled' && propertiesResponse.value.ok 
        ? await propertiesResponse.value.json() : [];
      const transactionsResult = transactionsResponse.status === 'fulfilled' && transactionsResponse.value.ok 
        ? await transactionsResponse.value.json() : { transactions: [] };
      
      const transactions = transactionsResult.transactions || [];

      // Calculate assets
      const bankAccountsTotal = Array.isArray(accounts) ? accounts.reduce((sum: number, acc: any) => sum + (acc.balance || 0), 0) : 0;
      const investmentsTotal = Array.isArray(investments) ? investments.reduce((sum: number, inv: any) => sum + (inv.currentValue || 0), 0) : 0;
      const propertiesTotal = Array.isArray(properties) ? properties.reduce((sum: number, prop: any) => sum + (prop.currentValue || 0), 0) : 0;
      const cashAccounts = Array.isArray(accounts) ? accounts.filter((acc: any) => acc.accountType === 'CASH').reduce((sum: number, acc: any) => sum + (acc.balance || 0), 0) : 0;

      // Calculate liabilities
      const loansTotal = Array.isArray(loans) ? loans.reduce((sum: number, loan: any) => sum + (loan.currentBalance || 0), 0) : 0;
      const creditCardsTotal = Array.isArray(creditCards) ? creditCards.reduce((sum: number, cc: any) => sum + (cc.currentBalance || 0), 0) : 0;

      // Calculate transaction net balance (income - expenses)
      const income = transactions.filter((t: any) => t.transactionType === 'INCOME').reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
      const expenses = transactions.filter((t: any) => t.transactionType === 'EXPENSE').reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
      const transactionNetBalance = income - expenses;

      const assetsTotal = bankAccountsTotal + investmentsTotal + propertiesTotal + cashAccounts;
      const liabilitiesTotal = loansTotal + creditCardsTotal;
      const netWorth = assetsTotal - liabilitiesTotal + transactionNetBalance;
      const totalLiquidAssets = bankAccountsTotal + cashAccounts;

      return {
        assets: {
          bankAccounts: bankAccountsTotal,
          investments: investmentsTotal,
          properties: propertiesTotal,
          cash: cashAccounts,
          total: assetsTotal
        },
        liabilities: {
          loans: loansTotal,
          creditCards: creditCardsTotal,
          total: liabilitiesTotal
        },
        netWorth,
        transactionNetBalance,
        totalLiquidAssets
      };
    } catch (error) {
      console.error('Error calculating net worth:', error);
      // Return default values if calculation fails
      return {
        assets: {
          bankAccounts: 0,
          investments: 0,
          properties: 0,
          cash: 0,
          total: 0
        },
        liabilities: {
          loans: 0,
          creditCards: 0,
          total: 0
        },
        netWorth: 0,
        transactionNetBalance: 0,
        totalLiquidAssets: 0
      };
    }
  }
}

export const dashboardService = new DashboardService();