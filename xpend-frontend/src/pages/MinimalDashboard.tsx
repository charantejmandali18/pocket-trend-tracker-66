import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target,
  Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MinimalDashboard = () => {
  const navigate = useNavigate();

  // Mock data (no service imports)
  const mockData = {
    totalIncome: 45000,
    totalExpenses: 32000,
    netBalance: 13000,
    savingsRate: 28.9,
    categories: [
      { id: '1', name: 'Food & Dining', amount: 12000, percentage: 37.5, transactions: 15 },
      { id: '2', name: 'Transportation', amount: 8000, percentage: 25.0, transactions: 8 },
      { id: '3', name: 'Entertainment', amount: 6000, percentage: 18.8, transactions: 12 },
      { id: '4', name: 'Shopping', amount: 4000, percentage: 12.5, transactions: 7 },
      { id: '5', name: 'Utilities', amount: 2000, percentage: 6.3, transactions: 3 }
    ],
    projections: {
      dailyAverage: 1103,
      projectedTotal: 34200,
      daysRemaining: 2,
      projectedRemaining: 10800
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center space-x-2">
          <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs font-medium">
            Microservices Ready
          </div>
          <div className="text-sm text-gray-500">
            January 2025
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
            <div className={`text-2xl font-bold ${mockData.netBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {mockData.netBalance >= 0 ? '+' : ''}₹{mockData.netBalance.toLocaleString()}
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
              {mockData.savingsRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">
              Monthly Savings
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
              ₹{mockData.totalExpenses.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              January 2025
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
              ₹{mockData.totalIncome.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              January 2025
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Top Spending Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockData.categories.map((category) => (
                <div 
                  key={category.id} 
                  className="space-y-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors"
                  onClick={() => navigate(`/transactions?category=${category.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-sm font-medium">{category.name}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      ₹{category.amount.toLocaleString()} ({category.transactions} transactions)
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
              ))}
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
                ₹{mockData.projections.dailyAverage.toLocaleString()}
              </div>
              <div className="text-xs text-blue-600">Daily Average</div>
              <div className="text-xs text-gray-500 mt-1">
                Current spending per day
              </div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                ₹{mockData.projections.projectedTotal.toLocaleString()}
              </div>
              <div className="text-xs text-orange-600">Projected Total</div>
              <div className="text-xs text-gray-500 mt-1">
                Expected month-end spending
              </div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {mockData.projections.daysRemaining}
              </div>
              <div className="text-xs text-purple-600">Days Remaining</div>
              <div className="text-xs text-gray-500 mt-1">
                In current month
              </div>
            </div>
            
            <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <div className={`text-2xl font-bold ${mockData.projections.projectedRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {mockData.projections.projectedRemaining >= 0 ? '+' : ''}₹{mockData.projections.projectedRemaining.toLocaleString()}
              </div>
              <div className="text-xs text-indigo-600">Projected Remaining</div>
              <div className="text-xs text-gray-500 mt-1">
                Expected remaining budget
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default MinimalDashboard;