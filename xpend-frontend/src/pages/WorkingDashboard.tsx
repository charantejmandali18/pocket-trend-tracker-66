import React, { useState, useEffect } from 'react';
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
import { useToast } from '@/hooks/use-toast';

const WorkingDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Test if we can get transactions from backend
      const devToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJkZXZAZXhhbXBsZS5jb20iLCJmdWxsTmFtZSI6IkRldmVsb3BtZW50IFVzZXIiLCJyb2xlcyI6WyJVU0VSIiwiQURNSU4iXSwiaWF0IjoxNzUzODE1MzA5LCJleHAiOjE3NTY0MDczMDl9.XSsRmCiKGgMKCzGOeZvvVnCH4NPK2SkoLJ7RQvS04vk';
      
      const response = await fetch('http://localhost:8082/api/transactions', {
        headers: {
          'Authorization': `Bearer ${devToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Backend Response:', result);
        
        // Calculate basic stats from real data
        const transactions = result.transactions || [];
        const income = transactions.filter(t => t.transactionType === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
        const expenses = transactions.filter(t => t.transactionType === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
        
        setData({
          totalIncome: income,
          totalExpenses: expenses,
          netBalance: income - expenses,
          transactionCount: transactions.length,
          transactions: transactions
        });
        
        toast({
          title: "Success!",
          description: `Loaded ${transactions.length} transactions from backend`,
        });
      } else {
        throw new Error(`Backend error: ${response.status}`);
      }
    } catch (err) {
      console.error('API Error:', err);
      setError(err.message);
      
      // Use fallback data
      setData({
        totalIncome: 45000,
        totalExpenses: 20500,
        netBalance: 24500,
        transactionCount: 5,
        transactions: []
      });
      
      toast({
        title: "Using Fallback Data",
        description: "Could not connect to backend, showing demo data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="text-center py-8">Loading data from backend...</div>
      </div>
    );
  }

  const isRealData = !error;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center space-x-2">
          {isRealData ? (
            <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded text-xs font-medium">
              Real Backend Data
            </div>
          ) : (
            <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded text-xs font-medium">
              Demo Data
            </div>
          )}
          <div className="text-sm text-gray-500">
            January 2025
          </div>
        </div>
      </div>

      {/* Show backend status */}
      {error && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4">
            <div className="text-sm text-yellow-800">
              <strong>Backend Status:</strong> {error}
            </div>
            <div className="text-xs text-yellow-600 mt-1">
              Your microservices are running but returning errors. Database has {data?.transactionCount || 0} transactions.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data?.netBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {data?.netBalance >= 0 ? '+' : ''}₹{data?.netBalance?.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              Income - Expenses
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
              ₹{data?.totalIncome?.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              This month
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
              ₹{data?.totalExpenses?.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              This month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {data?.transactionCount}
            </div>
            <div className="text-xs text-gray-500">
              Total count
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.transactions?.length > 0 ? (
            <div className="space-y-2">
              {data.transactions.slice(0, 5).map((transaction, index) => (
                <div key={index} className="flex justify-between items-center p-2 border rounded">
                  <div>
                    <div className="font-medium">{transaction.description}</div>
                    <div className="text-sm text-gray-500">{transaction.transactionDate}</div>
                  </div>
                  <div className={`font-bold ${transaction.transactionType === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.transactionType === 'INCOME' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No transactions available {isRealData ? 'in backend' : '(using demo data)'}
            </div>
          )}
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
              onClick={() => navigate('/add')}
            >
              <TrendingDown className="h-5 w-5" />
              <span className="text-sm">Add Transaction</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col space-y-2"
              onClick={() => navigate('/transactions')}
            >
              <Calendar className="h-5 w-5" />
              <span className="text-sm">View All</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col space-y-2"
              onClick={fetchData}
            >
              <Target className="h-5 w-5" />
              <span className="text-sm">Refresh Data</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col space-y-2"
              onClick={() => {
                console.log('Current data:', data);
                console.log('Error:', error);
              }}
            >
              <DollarSign className="h-5 w-5" />
              <span className="text-sm">Debug Info</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkingDashboard;