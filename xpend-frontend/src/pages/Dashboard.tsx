import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target,
  Calendar,
  Building,
  CreditCard,
  Home,
  Wallet
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { dashboardService, NetWorthSummary } from '@/services/dashboardService';

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dashboardData, setDashboardData] = useState(null);
  const [netWorthData, setNetWorthData] = useState<NetWorthSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch both transaction data and net worth data
      const [transactionData, netWorth] = await Promise.all([
        fetchTransactionData(),
        dashboardService.calculateNetWorth()
      ]);
      
      setDashboardData(transactionData);
      setNetWorthData(netWorth);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactionData = async () => {
    try {
      // Use transaction API directly since dashboard API has issues
      const devToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJkZXZAZXhhbXBsZS5jb20iLCJmdWxsTmFtZSI6IkRldmVsb3BtZW50IFVzZXIiLCJyb2xlcyI6WyJVU0VSIiwiQURNSU4iXSwiaWF0IjoxNzUzODE1MzA5LCJleHAiOjE3NTY0MDczMDl9.XSsRmCiKGgMKCzGOeZvvVnCH4NPK2SkoLJ7RQvS04vk';
      
      const response = await fetch('http://localhost:8082/api/transactions', {
        headers: {
          'Authorization': `Bearer ${devToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        const transactions = result.transactions || [];
        
        // Calculate dashboard data from transactions
        const income = transactions.filter(t => t.transactionType === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
        const expenses = transactions.filter(t => t.transactionType === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
        const netBalance = income - expenses;
        const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
        
        // Create category breakdown
        const expenseCategories = {};
        transactions.filter(t => t.transactionType === 'EXPENSE').forEach(t => {
          if (!expenseCategories[t.categoryId]) {
            expenseCategories[t.categoryId] = { amount: 0, count: 0 };
          }
          expenseCategories[t.categoryId].amount += t.amount;
          expenseCategories[t.categoryId].count += 1;
        });
        
        const categories = Object.entries(expenseCategories).map(([categoryId, data]) => ({
          categoryId,
          amount: data.amount,
          percentage: expenses > 0 ? (data.amount / expenses) * 100 : 0,
          transactionCount: data.count
        })).sort((a, b) => b.amount - a.amount);
        
        // Mock dashboard data structure
        const mockDashboardData = {
          financialSummary: {
            totalIncome: income,
            totalExpenses: expenses,
            netBalance: netBalance,
            savingsRate: savingsRate,
            transactionCount: transactions.length
          },
          categoryBreakdown: {
            categories: categories,
            totalExpenses: expenses,
            topCategory: categories[0] || null
          },
          monthlyProjections: {
            daysInMonth: 31,
            daysPassed: 29,
            daysRemaining: 2,
            currentExpenses: expenses,
            dailyAverage: expenses / 29,
            projectedTotal: (expenses / 29) * 31,
            projectedRemaining: income - ((expenses / 29) * 31)
          },
          trends: {
            dailyExpenses: {},
            averageDailySpending: expenses / 29
          },
          recentTransactions: transactions.slice(0, 5).map(t => ({
            id: t.id,
            description: t.description,
            amount: t.amount,
            transactionType: t.transactionType,
            transactionDate: t.transactionDate,
            categoryId: t.categoryId,
            paymentMethod: t.paymentMethod,
            createdAt: t.createdAt
          }))
        };
        
        return mockDashboardData;
      } else {
        throw new Error(`API error: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data. Using demo data.",
        variant: "destructive",
      });
      
      // Fallback to demo data
      setDashboardData({
        financialSummary: {
          totalIncome: 45000,
          totalExpenses: 20500,
          netBalance: 24500,
          savingsRate: 54.4,
          transactionCount: 5
        },
        categoryBreakdown: {
          categories: [],
          totalExpenses: 20500,
          topCategory: null
        },
        monthlyProjections: {
          daysInMonth: 31,
          daysPassed: 29,
          daysRemaining: 2,
          currentExpenses: 20500,
          dailyAverage: 706.9,
          projectedTotal: 21914,
          projectedRemaining: 23086
        },
        trends: {
          dailyExpenses: {},
          averageDailySpending: 706.9
        },
        recentTransactions: []
      });
    } finally {
      setLoading(false);
    }
  };

  const currentMonth = format(new Date(), 'MMMM yyyy');
  
  const handleCategoryClick = (categoryId: string) => {
    navigate(`/transactions?category=${categoryId}`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>
        <div className="text-center py-8">Loading dashboard...</div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>
        <div className="text-center py-8">No dashboard data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your financial overview for {currentMonth}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => navigate('/planning')}>
            <Calendar className="h-4 w-4 mr-2" />
            Change Month
          </Button>
          <Button onClick={() => navigate('/planning')}>
            <Target className="h-4 w-4 mr-2" />
            Create Budget
          </Button>
        </div>
      </div>

      {/* Account Balances Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(netWorthData?.netWorth || dashboardData.financialSummary.netBalance) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {(netWorthData?.netWorth || dashboardData.financialSummary.netBalance) >= 0 ? '+' : ''}₹{(netWorthData?.netWorth || dashboardData.financialSummary.netBalance).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              {netWorthData ? 'Assets - Liabilities' : 'Income - Expenses'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {dashboardData.financialSummary.savingsRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">
              Savings Rate
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Spent</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ₹{dashboardData.financialSummary.totalExpenses.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              {currentMonth}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Earned</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{dashboardData.financialSummary.totalIncome.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              {currentMonth}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Financial Metrics */}
      {netWorthData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Liabilities</CardTitle>
              <CreditCard className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ₹{netWorthData.liabilities.total.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">
                Loans + Credit Cards
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Liquid Assets</CardTitle>
              <Wallet className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                ₹{netWorthData.totalLiquidAssets.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">
                Bank Accounts + Cash
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transaction Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${netWorthData.transactionNetBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netWorthData.transactionNetBalance >= 0 ? '+' : ''}₹{netWorthData.transactionNetBalance.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">
                Transaction Income - Expenses
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Breakdown and Assets/Liabilities Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Spending Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.categoryBreakdown.categories.length > 0 ? (
                dashboardData.categoryBreakdown.categories.map((category) => (
                  <div 
                    key={category.categoryId} 
                    className="space-y-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors"
                    onClick={() => handleCategoryClick(category.categoryId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-sm font-medium">Category {category.categoryId}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        ₹{category.amount.toLocaleString()} ({category.transactionCount} transactions)
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Progress 
                        value={category.percentage} 
                        className="flex-1"
                      />
                      <span className="text-xs text-gray-500 w-12">
                        {category.percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>No expense data yet</p>
                  <p className="text-sm">Start adding transactions to see category breakdown</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Assets and Liabilities Detailed Breakdown */}
        {netWorthData ? (
          <Card>
            <CardHeader>
              <CardTitle>Assets & Liabilities Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-green-600 mb-2 flex items-center">
                    <Building className="h-4 w-4 mr-2" />
                    Assets (₹{netWorthData.assets.total.toLocaleString()})
                  </h4>
                  <div className="space-y-2 ml-6">
                    <div className="flex justify-between text-sm">
                      <span>Bank Accounts</span>
                      <span>₹{netWorthData.assets.bankAccounts.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Investments</span>
                      <span>₹{netWorthData.assets.investments.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Properties</span>
                      <span>₹{netWorthData.assets.properties.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Cash</span>
                      <span>₹{netWorthData.assets.cash.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-red-600 mb-2 flex items-center">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Liabilities (₹{netWorthData.liabilities.total.toLocaleString()})
                  </h4>
                  <div className="space-y-2 ml-6">
                    <div className="flex justify-between text-sm">
                      <span>Loans</span>
                      <span>₹{netWorthData.liabilities.loans.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Credit Cards</span>
                      <span>₹{netWorthData.liabilities.creditCards.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between font-semibold">
                    <span className="text-blue-600">Net Worth</span>
                    <span className={netWorthData.netWorth >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ₹{netWorthData.netWorth.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col space-y-2"
                  onClick={() => navigate('/planning')}
                >
                  <Target className="h-5 w-5" />
                  <span className="text-sm">Plan Budget</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col space-y-2"
                  onClick={() => navigate('/add')}
                >
                  <TrendingDown className="h-5 w-5" />
                  <span className="text-sm">Add Expense</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col space-y-2"
                  onClick={() => navigate('/add')}
                >
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-sm">Add Income</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col space-y-2"
                  onClick={() => navigate('/transactions')}
                >
                  <Calendar className="h-5 w-5" />
                  <span className="text-sm">View All</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Monthly Projections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Monthly Projections
          </CardTitle>
          <p className="text-sm text-gray-500">
            Based on your current spending patterns
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                ₹{dashboardData.monthlyProjections.dailyAverage.toLocaleString()}
              </div>
              <div className="text-xs text-blue-600">Daily Average</div>
              <div className="text-xs text-gray-500 mt-1">
                Current spending per day
              </div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                ₹{dashboardData.monthlyProjections.projectedTotal.toLocaleString()}
              </div>
              <div className="text-xs text-orange-600">Projected Total</div>
              <div className="text-xs text-gray-500 mt-1">
                Expected month-end spending
              </div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {dashboardData.monthlyProjections.daysRemaining}
              </div>
              <div className="text-xs text-purple-600">Days Remaining</div>
              <div className="text-xs text-gray-500 mt-1">
                In current month
              </div>
            </div>
            
            <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <div className={`text-2xl font-bold ${dashboardData.monthlyProjections.projectedRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {dashboardData.monthlyProjections.projectedRemaining >= 0 ? '+' : ''}₹{dashboardData.monthlyProjections.projectedRemaining.toLocaleString()}
              </div>
              <div className="text-xs text-indigo-600">Projected Remaining</div>
              <div className="text-xs text-gray-500 mt-1">
                Remaining budget
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default Dashboard;