import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  Save,
  CreditCard,
  Wallet,
  Smartphone,
  Building
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { transactionService } from '@/services/transactionService';

const AddTransactionSimple = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [transaction, setTransaction] = useState({
    transactionType: 'expense',
    amount: '',
    description: '',
    categoryId: '550e8400-e29b-41d4-a716-446655440001', // Default category
    transactionDate: format(new Date(), 'yyyy-MM-dd'),
    paymentMethod: 'cash',
    accountName: 'Checking Account',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState([]);

  const paymentMethods = [
    { id: 'cash', name: 'Cash', icon: Wallet },
    { id: 'card', name: 'Credit/Debit Card', icon: CreditCard },
    { id: 'upi', name: 'UPI', icon: Smartphone },
    { id: 'bank_transfer', name: 'Bank Transfer', icon: Building },
  ];

  const categories = [
    { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Food & Dining' },
    { id: '550e8400-e29b-41d4-a716-446655440002', name: 'Salary' },
    { id: '550e8400-e29b-41d4-a716-446655440003', name: 'Transportation' },
    { id: '550e8400-e29b-41d4-a716-446655440004', name: 'Entertainment' },
    { id: '550e8400-e29b-41d4-a716-446655440005', name: 'Shopping' }
  ];

  useEffect(() => {
    fetchRecentTransactions();
  }, []);

  const fetchRecentTransactions = async () => {
    try {
      const response = await transactionService.getAllTransactions();
      setRecentTransactions(response.transactions?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!transaction.amount || !transaction.description) {
      toast({
        title: "Error",
        description: "Please fill in amount and description",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const transactionData = {
        ...transaction,
        amount: parseFloat(transaction.amount),
        userId: 1 // Mock user ID
      };

      await transactionService.createTransaction(transactionData);
      
      toast({
        title: "Success!",
        description: "Transaction added successfully",
      });

      // Reset form
      setTransaction({
        transactionType: 'expense',
        amount: '',
        description: '',
        categoryId: '550e8400-e29b-41d4-a716-446655440001',
        transactionDate: format(new Date(), 'yyyy-MM-dd'),
        paymentMethod: 'cash',
        accountName: 'Checking Account',
        notes: ''
      });

      // Refresh recent transactions
      fetchRecentTransactions();

    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: "Error",
        description: "Failed to add transaction",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Add Transaction</h1>
        <Button variant="outline" onClick={() => navigate('/transactions')}>
          View All Transactions
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add Transaction Form */}
        <Card>
          <CardHeader>
            <CardTitle>New Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Transaction Type */}
              <div className="space-y-2">
                <Label>Transaction Type</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={transaction.transactionType === 'expense' ? 'default' : 'outline'}
                    onClick={() => setTransaction({ ...transaction, transactionType: 'expense' })}
                    className="flex-1"
                  >
                    <TrendingDown className="h-4 w-4 mr-2" />
                    Expense
                  </Button>
                  <Button
                    type="button"
                    variant={transaction.transactionType === 'income' ? 'default' : 'outline'}
                    onClick={() => setTransaction({ ...transaction, transactionType: 'income' })}
                    className="flex-1"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Income
                  </Button>
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={transaction.amount}
                  onChange={(e) => setTransaction({ ...transaction, amount: e.target.value })}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="What was this transaction for?"
                  value={transaction.description}
                  onChange={(e) => setTransaction({ ...transaction, description: e.target.value })}
                  required
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={transaction.categoryId}
                  onValueChange={(value) => setTransaction({ ...transaction, categoryId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={transaction.transactionDate}
                  onChange={(e) => setTransaction({ ...transaction, transactionDate: e.target.value })}
                  required
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select
                  value={transaction.paymentMethod}
                  onValueChange={(value) => setTransaction({ ...transaction, paymentMethod: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.id} value={method.id}>
                        <div className="flex items-center">
                          <method.icon className="h-4 w-4 mr-2" />
                          {method.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Account */}
              <div className="space-y-2">
                <Label htmlFor="account">Account</Label>
                <Input
                  id="account"
                  placeholder="Account name"
                  value={transaction.accountName}
                  onChange={(e) => setTransaction({ ...transaction, accountName: e.target.value })}
                  required
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes..."
                  value={transaction.notes}
                  onChange={(e) => setTransaction({ ...transaction, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Adding...' : 'Add Transaction'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {transaction.transactionType === 'income' ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                      <div>
                        <div className="font-medium">{transaction.description}</div>
                        <div className="text-sm text-gray-500">{transaction.transactionDate}</div>
                      </div>
                    </div>
                    <div className={`font-bold ${transaction.transactionType === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.transactionType === 'income' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>No recent transactions</p>
                  <p className="text-sm">Add your first transaction above</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddTransactionSimple;