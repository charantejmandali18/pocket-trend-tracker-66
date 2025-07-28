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
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { STORAGE_CONFIG } from '@/config/storage';

// Import both storage implementations
import { 
  getStoredTransactions as getSupabaseTransactions, 
  getStoredCategories as getSupabaseCategories, 
  getPersonalTransactions as getSupabasePersonalTransactions, 
  getGroupTransactions as getSupabaseGroupTransactions 
} from '@/utils/supabaseDataStorage';

import {
  getStoredTransactions as getLocalTransactions,
  getPersonalTransactions as getLocalPersonalTransactions,
  getGroupTransactions as getLocalGroupTransactions,
  getFinancialAccounts,
  getPersonalFinancialAccounts,
  getGroupFinancialAccounts
} from '@/utils/dataStorage';

interface DashboardData {
  totalIncome: number;
  totalExpenses: number;
  categories: CategorySummary[];
  memberSpending?: { [email: string]: number }; // For group mode
  
  // Financial Overview
  accountBalances: {
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
    liquidCash: number;
  };
  
  // Improved Monthly Projections
  monthlyOverview: {
    startingBalance: number;
    currentBalance: number;
    totalSpent: number;
    totalEarned: number;
    daysInMonth: number;
    daysRemaining: number;
    avgDailySpending: number;
    projectedMonthEndBalance: number;
    budgetStatus: 'under' | 'on_track' | 'over' | 'danger';
  };
}

interface CategorySummary {
  id: string;
  name: string;
  amount: number;
  color: string;
  transactionCount: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isPersonalMode, currentGroup, categories, dataVersion } = useApp();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalIncome: 0,
    totalExpenses: 0,
    categories: [],
    accountBalances: {
      totalAssets: 0,
      totalLiabilities: 0,
      netWorth: 0,
      liquidCash: 0
    },
    monthlyOverview: {
      startingBalance: 0,
      currentBalance: 0,
      totalSpent: 0,
      totalEarned: 0,
      daysInMonth: 30,
      daysRemaining: 15,
      avgDailySpending: 0,
      projectedMonthEndBalance: 0,
      budgetStatus: 'on_track'
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, isPersonalMode, currentGroup, dataVersion]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get transactions based on mode and storage type
      let transactions;
      if (isPersonalMode) {
        transactions = STORAGE_CONFIG.USE_LOCAL_STORAGE
          ? getLocalPersonalTransactions(user.id, user.email)
          : await getSupabasePersonalTransactions(user.id, user.email);
      } else if (currentGroup) {
        transactions = STORAGE_CONFIG.USE_LOCAL_STORAGE
          ? getLocalGroupTransactions(currentGroup.id)
          : await getSupabaseGroupTransactions(currentGroup.id);
      } else {
        transactions = [];
      }
      
      // Get financial accounts
      let accounts;
      if (isPersonalMode) {
        accounts = getPersonalFinancialAccounts(user.id);
      } else if (currentGroup) {
        // Get group accounts AND pool contributions from all users
        const groupAccounts = getGroupFinancialAccounts(currentGroup.id);
        const allAccounts = getFinancialAccounts();
        
        // Find all accounts marked as pool contributions
        const poolContributions = allAccounts.filter(a => 
          a.is_pool_contribution && 
          a.is_active &&
          !a.group_id // Personal accounts marked for pool contribution
        );
        
        accounts = [...groupAccounts, ...poolContributions];
      } else {
        accounts = [];
      }

      // Calculate account balances
      const totalAssets = accounts
        .filter(a => !['credit_card', 'loan'].includes(a.type))
        .reduce((sum, a) => sum + a.balance, 0);
      
      const totalLiabilities = accounts
        .filter(a => ['credit_card', 'loan'].includes(a.type))
        .reduce((sum, a) => sum + a.balance, 0);
      
      const liquidCash = accounts
        .filter(a => a.type === 'cash')
        .reduce((sum, a) => sum + a.balance, 0);
      
      const netWorth = totalAssets - totalLiabilities;

      // Filter transactions by current month
      const currentMonthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const currentMonthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');
      
      const monthlyTransactions = transactions.filter(t => 
        t.transaction_date >= currentMonthStart && t.transaction_date <= currentMonthEnd
      );

      // Calculate monthly totals
      const totalIncome = monthlyTransactions
        .filter(t => t.transaction_type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpenses = monthlyTransactions
        .filter(t => t.transaction_type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      // Group by categories
      const categoryMap = new Map<string, CategorySummary>();
      
      monthlyTransactions.forEach(transaction => {
        const category = transaction.categories;
        if (category && transaction.transaction_type === 'expense') {
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
              transactionCount: 1
            });
          }
        }
      });

      const categorySummaries = Array.from(categoryMap.values())
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      // Calculate monthly overview
      const now = new Date();
      const currentDay = now.getDate();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const daysRemaining = daysInMonth - currentDay;
      
      const avgDailySpending = currentDay > 0 ? totalExpenses / currentDay : 0;
      const projectedMonthlySpending = avgDailySpending * daysInMonth;
      const projectedMonthEndBalance = netWorth + totalIncome - projectedMonthlySpending;
      
      // Determine budget status
      const spendingRate = currentDay > 0 ? totalExpenses / currentDay : 0;
      const monthlyBudget = totalIncome * 0.8; // Assume 80% of income as budget
      const projectedMonthlyTotal = spendingRate * daysInMonth;
      
      let budgetStatus: 'under' | 'on_track' | 'over' | 'danger' = 'on_track';
      if (projectedMonthlyTotal < monthlyBudget * 0.7) budgetStatus = 'under';
      else if (projectedMonthlyTotal > monthlyBudget * 1.2) budgetStatus = 'danger';
      else if (projectedMonthlyTotal > monthlyBudget) budgetStatus = 'over';

      const monthlyOverview = {
        startingBalance: netWorth - totalIncome + totalExpenses, // Approximate starting balance
        currentBalance: netWorth,
        totalSpent: totalExpenses,
        totalEarned: totalIncome,
        daysInMonth,
        daysRemaining,
        avgDailySpending,
        projectedMonthEndBalance,
        budgetStatus
      };

      // For group mode, calculate member spending
      let memberSpending = {};
      if (!isPersonalMode && currentGroup) {
        memberSpending = {
          [user.id]: totalExpenses * 0.6, // Mock: current user contributed 60%
          'other-member-1': totalExpenses * 0.25, // Mock: other member 25%
          'other-member-2': totalExpenses * 0.15, // Mock: another member 15%
        };
      }

      setDashboardData({
        totalIncome,
        totalExpenses,
        categories: categorySummaries,
        memberSpending: !isPersonalMode ? memberSpending : undefined,
        accountBalances: {
          totalAssets,
          totalLiabilities,
          netWorth,
          liquidCash
        },
        monthlyOverview
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentMonth = format(new Date(), 'MMMM yyyy');
  const { accountBalances, monthlyOverview } = dashboardData;
  const remainingBudget = dashboardData.totalIncome - dashboardData.totalExpenses;
  const savingsRate = dashboardData.totalIncome > 0 
    ? ((dashboardData.totalIncome - dashboardData.totalExpenses) / dashboardData.totalIncome) * 100 
    : 0;

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/transactions?category=${categoryId}`);
  };

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
            <div className={`text-2xl font-bold ${accountBalances.netWorth >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {accountBalances.netWorth >= 0 ? '+' : ''}₹{accountBalances.netWorth.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              Assets - Liabilities
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Liquid Cash</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{accountBalances.liquidCash.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              Available cash & savings
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
              ₹{dashboardData.totalExpenses.toLocaleString()}
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
              ₹{dashboardData.totalIncome.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              {currentMonth}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown and Group Members */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Spending Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.categories.length > 0 ? (
                dashboardData.categories.map((category) => (
                  <div 
                    key={category.id} 
                    className="space-y-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors"
                    onClick={() => handleCategoryClick(category.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-sm font-medium">{category.name}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        ₹{category.amount.toLocaleString()} ({category.transactionCount} transactions)
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Progress 
                        value={dashboardData.totalExpenses > 0 ? (category.amount / dashboardData.totalExpenses) * 100 : 0} 
                        className="flex-1"
                      />
                      <span className="text-xs text-gray-500 w-12">
                        {dashboardData.totalExpenses > 0 ? ((category.amount / dashboardData.totalExpenses) * 100).toFixed(0) : 0}%
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

        {/* Group Members or Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>
              {!isPersonalMode && currentGroup ? 'Group Member Spending' : 'Quick Actions'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!isPersonalMode && currentGroup && dashboardData.memberSpending ? (
              <div className="space-y-4">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Group Asset: ₹{dashboardData.totalExpenses.toLocaleString()} total spent
                </div>
                {Object.entries(dashboardData.memberSpending).map(([userId, amount]) => (
                  <div key={userId} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium">
                          {userId === user.id ? 'You' : userId.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm">
                        {userId === user.id ? 'You' : `Member ${userId.slice(0, 8)}`}
                      </span>
                    </div>
                    <div className="text-sm font-medium">
                      ₹{(amount as number).toLocaleString()}
                    </div>
                  </div>
                ))}
                <div className="pt-3 border-t">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Your contribution:</span>
                    <span>
                      {dashboardData.totalExpenses > 0 
                        ? ((((dashboardData.memberSpending[user.id] as number) || 0) / dashboardData.totalExpenses) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>
            ) : (
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
            )}
          </CardContent>
        </Card>
      </div>

      {/* Projections Section */}
      {dashboardData.projections && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Monthly Projections & Budget Reconciliation
            </CardTitle>
            <p className="text-sm text-gray-500">
              Based on your current spending patterns and daily burn rate
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  ₹{dashboardData.projections.dailyBurnRate.toLocaleString()}
                </div>
                <div className="text-xs text-blue-600">Daily Burn Rate</div>
                <div className="text-xs text-gray-500 mt-1">
                  Current spending per day
                </div>
              </div>
              
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  ₹{dashboardData.projections.projectedSpending.toLocaleString()}
                </div>
                <div className="text-xs text-orange-600">Projected Total</div>
                <div className="text-xs text-gray-500 mt-1">
                  Expected month-end spending
                </div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className={`text-2xl font-bold ${dashboardData.projections.budgetUtilization > 100 ? 'text-red-600' : dashboardData.projections.budgetUtilization > 80 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {dashboardData.projections.budgetUtilization.toFixed(1)}%
                </div>
                <div className="text-xs text-purple-600">Budget Utilization</div>
                <div className="text-xs text-gray-500 mt-1">
                  Of projected budget
                </div>
              </div>
              
              <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                <div className={`text-2xl font-bold ${dashboardData.projections.monthEndBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {dashboardData.projections.monthEndBalance >= 0 ? '+' : ''}₹{dashboardData.projections.monthEndBalance.toLocaleString()}
                </div>
                <div className="text-xs text-indigo-600">Projected Balance</div>
                <div className="text-xs text-gray-500 mt-1">
                  Expected month-end balance
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-white">Budget Forecast</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Current Spending ({format(new Date(), 'MMM dd')})</span>
                    <span className="font-medium">₹{dashboardData.totalExpenses.toLocaleString()}</span>
                  </div>
                  <Progress 
                    value={(dashboardData.totalExpenses / dashboardData.projections.projectedSpending) * 100} 
                    className="h-2" 
                  />
                  <div className="flex justify-between text-sm">
                    <span>Projected Total</span>
                    <span className="font-medium">₹{dashboardData.projections.projectedSpending.toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {dashboardData.projections.daysRemaining} days remaining in {format(new Date(), 'MMMM')}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-white">Financial Health</h4>
                <div className="space-y-2">
                  {dashboardData.projections.budgetUtilization <= 80 && (
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">On track with budget</span>
                    </div>
                  )}
                  {dashboardData.projections.budgetUtilization > 80 && dashboardData.projections.budgetUtilization <= 100 && (
                    <div className="flex items-center space-x-2 text-yellow-600">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">Approaching budget limit</span>
                    </div>
                  )}
                  {dashboardData.projections.budgetUtilization > 100 && (
                    <div className="flex items-center space-x-2 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">Over budget - reduce spending</span>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500 mt-2">
                    Daily recommended spending: ₹{((dashboardData.totalIncome * 0.8) / new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()).toLocaleString()}
                  </div>
                  
                  {dashboardData.projections.monthEndBalance < 0 && (
                    <div className="text-xs text-red-600 mt-2">
                      ⚠️ Projected to overspend by ₹{Math.abs(dashboardData.projections.monthEndBalance).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
};

export default Dashboard;