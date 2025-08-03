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
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { dashboardService, DashboardOverview } from '@/services/dashboardService';
import { useToast } from '@/hooks/use-toast';

// Mock data as fallback when API calls fail
const mockDashboardData: DashboardOverview = {
  financialSummary: {
    totalIncome: 45000,
    totalExpenses: 32000,
    netBalance: 13000,
    savingsRate: 28.9,
    transactionCount: 45
  },
  categoryBreakdown: {
    categories: [
      { categoryId: '1', amount: 12000, percentage: 37.5, transactionCount: 15 },
      { categoryId: '2', amount: 8000, percentage: 25.0, transactionCount: 8 },
      { categoryId: '3', amount: 6000, percentage: 18.8, transactionCount: 12 },
      { categoryId: '4', amount: 4000, percentage: 12.5, transactionCount: 7 },
      { categoryId: '5', amount: 2000, percentage: 6.3, transactionCount: 3 }
    ],
    totalExpenses: 32000,
    topCategory: { categoryId: '1', amount: 12000, percentage: 37.5, transactionCount: 15 }
  },
  monthlyProjections: {
    daysInMonth: 31,
    daysPassed: 29,
    daysRemaining: 2,
    currentExpenses: 32000,
    dailyAverage: 1103,
    projectedTotal: 34200,
    projectedRemaining: 10800
  },
  trends: {
    dailyExpenses: {
      '2025-01-01': 1200,
      '2025-01-02': 800,
      '2025-01-03': 1500,
      '2025-01-04': 900,
      '2025-01-05': 1100
    },
    averageDailySpending: 1103
  },
  recentTransactions: [
    {
      id: '1',
      description: 'Grocery Shopping',
      amount: 2500,
      transactionType: 'EXPENSE' as const,
      transactionDate: '2025-01-29',
      categoryId: '1',
      paymentMethod: 'card',
      createdAt: '2025-01-29T10:30:00Z'
    },
    {
      id: '2',
      description: 'Salary Credit',
      amount: 45000,
      transactionType: 'INCOME' as const,
      transactionDate: '2025-01-01',
      categoryId: '6',
      paymentMethod: 'bank_transfer',
      createdAt: '2025-01-01T09:00:00Z'
    }
  ]
};

const DashboardWithFallback = () => {
  const navigate = useNavigate();
  const { user, dataVersion } = useApp();
  const { toast } = useToast();
  const [dashboardData, setDashboardData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, dataVersion]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Set a timeout for the API call
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('API call timeout')), 5000)
      );
      
      const dataPromise = dashboardService.getDashboardOverview();
      
      const data = await Promise.race([dataPromise, timeoutPromise]) as DashboardOverview;
      setDashboardData(data);
      setUsingMockData(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      
      // Use mock data as fallback
      setDashboardData(mockDashboardData);
      setUsingMockData(true);
      
      toast({
        title: "Using Demo Data",
        description: "Could not connect to backend. Showing demo data.",
        variant: "destructive",
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
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center space-x-2">
          {usingMockData && (
            <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded text-xs font-medium">
              Demo Data
            </div>
          )}
          <div className="text-sm text-gray-500">
            {currentMonth}
          </div>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${dashboardData.financialSummary.netBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {dashboardData.financialSummary.netBalance >= 0 ? '+' : ''}₹{dashboardData.financialSummary.netBalance.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              Income - Expenses
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
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
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
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
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

      {/* Category Breakdown */}
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
              <div className="text-center py-4 text-gray-500">
                No spending data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
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

export default DashboardWithFallback;