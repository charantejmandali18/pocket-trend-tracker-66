import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  PieChart,
  Activity,
  Target,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, subWeeks, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';
import { 
  getPersonalTransactions, 
  getGroupTransactions,
  getStoredCategories
} from '@/utils/dataStorage';

interface AnalyticsData {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  categories: CategoryAnalytics[];
  trends: TrendData[];
  comparison: ComparisonData;
}

interface CategoryAnalytics {
  id: string;
  name: string;
  amount: number;
  color: string;
  percentage: number;
  transactionCount: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
}

interface TrendData {
  period: string;
  income: number;
  expenses: number;
  net: number;
  date: string;
}

interface ComparisonData {
  previousPeriod: {
    income: number;
    expenses: number;
    net: number;
  };
  currentPeriod: {
    income: number;
    expenses: number;
    net: number;
  };
  changes: {
    income: number;
    expenses: number;
    net: number;
  };
}

const Analytics = () => {
  const { user, isPersonalMode, currentGroup, dataVersion } = useApp();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [viewType, setViewType] = useState<'week' | 'month'>('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user, isPersonalMode, currentGroup, viewType, dataVersion]);

  const fetchAnalyticsData = () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get transactions based on mode
      let transactions;
      if (isPersonalMode) {
        transactions = getPersonalTransactions(user.id, user.email);
      } else if (currentGroup) {
        transactions = getGroupTransactions(currentGroup.id);
      } else {
        transactions = [];
      }

      // Get current and previous period dates
      const now = new Date();
      let currentStart, currentEnd, previousStart, previousEnd;
      
      if (viewType === 'week') {
        currentStart = startOfWeek(now);
        currentEnd = endOfWeek(now);
        previousStart = startOfWeek(subWeeks(now, 1));
        previousEnd = endOfWeek(subWeeks(now, 1));
      } else {
        currentStart = startOfMonth(now);
        currentEnd = endOfMonth(now);
        previousStart = startOfMonth(subMonths(now, 1));
        previousEnd = endOfMonth(subMonths(now, 1));
      }

      // Filter transactions for current period
      const currentTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.transaction_date);
        return transactionDate >= currentStart && transactionDate <= currentEnd;
      });

      // Filter transactions for previous period
      const previousTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.transaction_date);
        return transactionDate >= previousStart && transactionDate <= previousEnd;
      });

      // Calculate totals for current period
      const totalIncome = currentTransactions
        .filter(t => t.transaction_type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpenses = currentTransactions
        .filter(t => t.transaction_type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const netBalance = totalIncome - totalExpenses;

      // Calculate totals for previous period
      const prevIncome = previousTransactions
        .filter(t => t.transaction_type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const prevExpenses = previousTransactions
        .filter(t => t.transaction_type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const prevNet = prevIncome - prevExpenses;

      // Category analysis
      const categoryMap = new Map<string, CategoryAnalytics>();
      const categories = getStoredCategories();
      
      currentTransactions
        .filter(t => t.transaction_type === 'expense')
        .forEach(transaction => {
          const category = transaction.categories || categories.find(c => c.id === transaction.category_id);
          if (category) {
            const existing = categoryMap.get(category.id);
            if (existing) {
              existing.amount += transaction.amount;
              existing.transactionCount += 1;
            } else {
              categoryMap.set(category.id, {
                id: category.id,
                name: category.name,
                amount: transaction.amount,
                color: category.color || '#3B82F6',
                percentage: 0,
                transactionCount: 1,
                trend: 'stable',
                change: 0
              });
            }
          }
        });

      // Calculate percentages and trends
      const categoryAnalytics = Array.from(categoryMap.values()).map(cat => {
        cat.percentage = totalExpenses > 0 ? (cat.amount / totalExpenses) * 100 : 0;
        
        // Calculate trend vs previous period
        const prevCategoryAmount = previousTransactions
          .filter(t => t.transaction_type === 'expense' && t.category_id === cat.id)
          .reduce((sum, t) => sum + t.amount, 0);
        
        if (prevCategoryAmount > 0) {
          cat.change = ((cat.amount - prevCategoryAmount) / prevCategoryAmount) * 100;
          cat.trend = cat.change > 5 ? 'up' : cat.change < -5 ? 'down' : 'stable';
        }
        
        return cat;
      }).sort((a, b) => b.amount - a.amount);

      // Generate trend data for the last periods
      const trends: TrendData[] = [];
      const periodsToShow = 8;
      
      for (let i = periodsToShow - 1; i >= 0; i--) {
        let periodStart, periodEnd, periodLabel;
        
        if (viewType === 'week') {
          const weekDate = subWeeks(now, i);
          periodStart = startOfWeek(weekDate);
          periodEnd = endOfWeek(weekDate);
          periodLabel = `Week ${format(periodStart, 'MMM dd')}`;
        } else {
          const monthDate = subMonths(now, i);
          periodStart = startOfMonth(monthDate);
          periodEnd = endOfMonth(monthDate);
          periodLabel = format(monthDate, 'MMM yyyy');
        }

        const periodTransactions = transactions.filter(t => {
          const transactionDate = new Date(t.transaction_date);
          return transactionDate >= periodStart && transactionDate <= periodEnd;
        });

        const periodIncome = periodTransactions
          .filter(t => t.transaction_type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        const periodExpenses = periodTransactions
          .filter(t => t.transaction_type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        trends.push({
          period: periodLabel,
          income: periodIncome,
          expenses: periodExpenses,
          net: periodIncome - periodExpenses,
          date: format(periodStart, 'yyyy-MM-dd')
        });
      }

      // Comparison data
      const comparison: ComparisonData = {
        previousPeriod: {
          income: prevIncome,
          expenses: prevExpenses,
          net: prevNet
        },
        currentPeriod: {
          income: totalIncome,
          expenses: totalExpenses,
          net: netBalance
        },
        changes: {
          income: prevIncome > 0 ? ((totalIncome - prevIncome) / prevIncome) * 100 : 0,
          expenses: prevExpenses > 0 ? ((totalExpenses - prevExpenses) / prevExpenses) * 100 : 0,
          net: prevNet !== 0 ? ((netBalance - prevNet) / Math.abs(prevNet)) * 100 : 0
        }
      };

      setAnalyticsData({
        totalIncome,
        totalExpenses,
        netBalance,
        categories: categoryAnalytics,
        trends,
        comparison
      });

    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <ArrowDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getChangeColor = (change: number, isExpense = false) => {
    if (change > 0) return isExpense ? 'text-red-600' : 'text-green-600';
    if (change < 0) return isExpense ? 'text-green-600' : 'text-red-600';
    return 'text-gray-400';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Analytics</h1>
        </div>
        <div className="text-center py-8">Loading analytics...</div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Analytics</h1>
        </div>
        <div className="text-center py-8">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No data to analyze</p>
          <p className="text-sm text-gray-500">Add some transactions to see insights</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Insights and trends for your {isPersonalMode ? 'personal' : 'group'} finances
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={viewType} onValueChange={(value) => setViewType(value as 'week' | 'month')}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards with Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{analyticsData.totalIncome.toLocaleString()}
            </div>
            <div className="flex items-center space-x-1 mt-2">
              {getChangeIcon(analyticsData.comparison.changes.income)}
              <span className={`text-xs ${getChangeColor(analyticsData.comparison.changes.income)}`}>
                {Math.abs(analyticsData.comparison.changes.income).toFixed(1)}% vs last {viewType}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ₹{analyticsData.totalExpenses.toLocaleString()}
            </div>
            <div className="flex items-center space-x-1 mt-2">
              {getChangeIcon(analyticsData.comparison.changes.expenses)}
              <span className={`text-xs ${getChangeColor(analyticsData.comparison.changes.expenses, true)}`}>
                {Math.abs(analyticsData.comparison.changes.expenses).toFixed(1)}% vs last {viewType}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${analyticsData.netBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {analyticsData.netBalance >= 0 ? '+' : ''}₹{analyticsData.netBalance.toLocaleString()}
            </div>
            <div className="flex items-center space-x-1 mt-2">
              {getChangeIcon(analyticsData.comparison.changes.net)}
              <span className={`text-xs ${getChangeColor(analyticsData.comparison.changes.net)}`}>
                {Math.abs(analyticsData.comparison.changes.net).toFixed(1)}% vs last {viewType}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                {viewType === 'week' ? 'Weekly' : 'Monthly'} Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.trends.map((trend, index) => (
                  <div key={index} className="grid grid-cols-4 gap-4 p-4 border rounded-lg">
                    <div>
                      <div className="text-sm font-medium">{trend.period}</div>
                      <div className="text-xs text-gray-500">{format(new Date(trend.date), 'MMM dd')}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">₹{trend.income.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">Income</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-red-600">₹{trend.expenses.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">Expenses</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${trend.net >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {trend.net >= 0 ? '+' : ''}₹{trend.net.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">Net</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="h-5 w-5 mr-2" />
                Category Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.categories.length > 0 ? (
                  analyticsData.categories.map((category) => (
                    <div key={category.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-sm font-medium">{category.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {category.transactionCount} transactions
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">₹{category.amount.toLocaleString()}</span>
                          <Badge variant={category.trend === 'up' ? 'destructive' : category.trend === 'down' ? 'default' : 'secondary'}>
                            {category.trend === 'up' ? '↑' : category.trend === 'down' ? '↓' : '→'} {Math.abs(category.change).toFixed(0)}%
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Progress value={category.percentage} className="flex-1" />
                        <span className="text-xs text-gray-500 w-12">{category.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <p>No expense categories to analyze</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Period Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-lg font-bold">Previous {viewType}</div>
                      <div className="text-sm text-green-600">₹{analyticsData.comparison.previousPeriod.income.toLocaleString()}</div>
                      <div className="text-sm text-red-600">₹{analyticsData.comparison.previousPeriod.expenses.toLocaleString()}</div>
                      <div className={`text-sm font-medium ${analyticsData.comparison.previousPeriod.net >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {analyticsData.comparison.previousPeriod.net >= 0 ? '+' : ''}₹{analyticsData.comparison.previousPeriod.net.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-lg font-bold">Current {viewType}</div>
                      <div className="text-sm text-green-600">₹{analyticsData.comparison.currentPeriod.income.toLocaleString()}</div>
                      <div className="text-sm text-red-600">₹{analyticsData.comparison.currentPeriod.expenses.toLocaleString()}</div>
                      <div className={`text-sm font-medium ${analyticsData.comparison.currentPeriod.net >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {analyticsData.comparison.currentPeriod.net >= 0 ? '+' : ''}₹{analyticsData.comparison.currentPeriod.net.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm">
                    <span className="font-medium">Savings Rate:</span>
                    <span className="ml-2">{analyticsData.totalIncome > 0 ? ((analyticsData.netBalance / analyticsData.totalIncome) * 100).toFixed(1) : 0}%</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Average Daily Spending:</span>
                    <span className="ml-2">₹{viewType === 'week' ? (analyticsData.totalExpenses / 7).toFixed(0) : (analyticsData.totalExpenses / new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()).toFixed(0)}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Top Category:</span>
                    <span className="ml-2">{analyticsData.categories[0]?.name || 'None'}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Total Transactions:</span>
                    <span className="ml-2">{analyticsData.categories.reduce((sum, cat) => sum + cat.transactionCount, 0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;