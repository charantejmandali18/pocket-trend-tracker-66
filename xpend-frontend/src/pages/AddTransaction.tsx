import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Calendar as CalendarIcon,
  CreditCard,
  Wallet,
  Smartphone,
  Building,
  TrendingUp,
  TrendingDown,
  Save,
  X,
  Palette,
  Edit2,
  Trash2,
  MoreHorizontal
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { transactionService, Transaction, TransactionCreateRequest } from '@/services/transactionService';
import { categoryService, Category } from '@/services/categoryService';
import { accountService, Account } from '@/services/accountService';

// Using Transaction type from transactionService

const AddTransaction = () => {
  const user = { id: 1 }; // Mock user for now
  const categories = [
    { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Food & Dining', color: '#3B82F6' },
    { id: '550e8400-e29b-41d4-a716-446655440002', name: 'Salary', color: '#10B981' },
    { id: '550e8400-e29b-41d4-a716-446655440003', name: 'Transportation', color: '#F59E0B' },
    { id: '550e8400-e29b-41d4-a716-446655440004', name: 'Entertainment', color: '#8B5CF6' },
    { id: '550e8400-e29b-41d4-a716-446655440005', name: 'Shopping', color: '#EC4899' }
  ]; // Mock categories
  const isPersonalMode = true;
  const currentGroup = null;
  const { toast } = useToast();

  const [transaction, setTransaction] = useState<Partial<TransactionCreateRequest>>({
    transactionType: 'EXPENSE',
    amount: 0,
    description: '',
    categoryId: '',
    transactionDate: format(new Date(new Date().getTime() - 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    paymentMethod: 'cash',
    accountName: 'Checking Account',
    notes: ''
  });

  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6');
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  // Edit Transaction States
  const [showEditTransaction, setShowEditTransaction] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editTransaction, setEditTransaction] = useState({
    transaction_type: 'EXPENSE',
    amount: 0,
    description: '',
    category_id: '',
    transaction_date: format(new Date(), 'yyyy-MM-dd'),
    payment_method: 'cash',
    account_name: '',
    notes: ''
  });

  const colorOptions = [
    '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', 
    '#EC4899', '#059669', '#7C3AED', '#6B7280', '#DC2626'
  ];

  useEffect(() => {
    fetchRecentTransactions();
    fetchAccounts();
  }, []);

  const paymentMethods = [
    { id: 'cash', name: 'Cash', icon: Wallet },
    { id: 'card', name: 'Credit/Debit Card', icon: CreditCard },
    { id: 'upi', name: 'UPI', icon: Smartphone },
    { id: 'bank_transfer', name: 'Bank Transfer', icon: Building },
  ];

  const fetchAccounts = async () => {
    try {
      console.log('Fetching accounts from backend...');
      const backendAccounts = await accountService.getAllAccounts();
      console.log('Backend accounts:', backendAccounts);
      setAccounts(backendAccounts);
    } catch (error) {
      console.warn('Failed to fetch accounts from backend, using mock data:', error);
      // Fallback to mock accounts if backend is not available
      const mockAccounts: Account[] = [
        { 
          id: '1', 
          userId: 1,
          groupId: null,
          name: 'Checking Account', 
          type: 'CHECKING',
          bankName: 'HDFC Bank',
          balance: 25000, 
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        { 
          id: '2', 
          userId: 1,
          groupId: null,
          name: 'Savings Account', 
          type: 'SAVINGS',
          bankName: 'ICICI Bank',
          balance: 50000, 
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        { 
          id: '3', 
          userId: 1,
          groupId: null,
          name: 'Credit Card', 
          type: 'CREDIT_CARD',
          bankName: 'SBI Card',
          balance: 5000, 
          creditLimit: 50000,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      setAccounts(mockAccounts);
    }
  };

  const quickAmounts = [50, 100, 200, 500, 1000, 2000];

  const fetchRecentTransactions = async () => {
    if (!user) return;

    try {
      const response = await transactionService.getAllTransactions({
        page: 0,
        size: 10,
        sortBy: 'createdAt',
        sortDirection: 'DESC'
      });
      
      // The API returns an object with transactions array
      const transactions = response.transactions || response || [];
      setRecentTransactions(Array.isArray(transactions) ? transactions : []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setRecentTransactions([]); // Ensure it's always an array
      toast({
        title: "Error",
        description: "Failed to fetch recent transactions",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    console.log('handleSave called');
    console.log('Current transaction state:', transaction);
    console.log('User:', user);
    console.log('Validation checks:', {
      hasUser: !!user,
      hasDescription: !!transaction.description,
      hasValidAmount: transaction.amount > 0,
      hasCategoryId: !!transaction.categoryId,
      hasPaymentMethod: !!transaction.paymentMethod,
      hasAccountName: !!transaction.accountName
    });

    if (!user || !transaction.description || transaction.amount <= 0 || !transaction.categoryId || !transaction.paymentMethod || !transaction.accountName) {
      console.log('Validation failed');
      toast({
        title: "Error",
        description: "Please fill in all required fields (description, amount, category, payment method, account)",
        variant: "destructive",
      });
      return;
    }

    try {
      const newTransaction: TransactionCreateRequest = {
        transactionType: transaction.transactionType || 'EXPENSE',
        amount: transaction.amount || 0,
        description: transaction.description || '',
        categoryId: transaction.categoryId || '',
        transactionDate: transaction.transactionDate || format(new Date(), 'yyyy-MM-dd'),
        paymentMethod: transaction.paymentMethod || 'cash',
        accountName: transaction.accountName || '',
        notes: transaction.notes || ''
      };

      console.log('Sending transaction:', newTransaction);
      await transactionService.createTransaction(newTransaction);

      toast({
        title: "Success",
        description: "Transaction added successfully!",
      });

      // Reset form
      setTransaction({
        transactionType: 'EXPENSE',
        amount: 0,
        description: '',
        categoryId: '',
        transactionDate: format(new Date(new Date().getTime() - 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        paymentMethod: 'cash',
        accountName: 'Checking Account',
        notes: ''
      });

      // Refresh recent transactions
      fetchRecentTransactions();
    } catch (error) {
      console.error('Error saving transaction:', error);
      console.error('Error details:', error?.response || error?.message || error);
      toast({
        title: "Error",
        description: `Failed to save transaction: ${error?.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    // Mock category creation for now
    const category = { 
      id: Date.now().toString(), 
      name: newCategoryName.trim(), 
      color: newCategoryColor 
    };
    if (category) {
      setTransaction({ ...transaction, categoryId: category.id });
      setNewCategoryName('');
      setNewCategoryColor('#3B82F6');
      setShowAddCategory(false);
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditTransaction({
      transaction_type: transaction.transactionType || transaction.transaction_type,
      amount: transaction.amount,
      description: transaction.description,
      category_id: transaction.categoryId || transaction.category_id,
      transaction_date: transaction.transactionDate || transaction.transaction_date,
      payment_method: transaction.paymentMethod || transaction.payment_method,
      account_name: transaction.accountName || transaction.account_name,
      notes: transaction.notes || ''
    });
    setShowEditTransaction(true);
  };

  const handleUpdateTransaction = async () => {
    if (!editingTransaction || !editTransaction.description || !editTransaction.amount || !editTransaction.category_id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const selectedCategory = categories.find(c => c.id === editTransaction.category_id);
      
      const updates = {
        transactionType: editTransaction.transaction_type || 'EXPENSE',
        amount: editTransaction.amount || 0,
        description: editTransaction.description || '',
        categoryId: editTransaction.category_id || '',
        transactionDate: editTransaction.transaction_date || format(new Date(), 'yyyy-MM-dd'),
        paymentMethod: editTransaction.payment_method || 'cash',
        accountName: editTransaction.account_name || '',
        notes: editTransaction.notes || '',
        categories: selectedCategory ? {
          id: selectedCategory.id,
          name: selectedCategory.name,
          color: selectedCategory.color || '#3B82F6',
          icon: selectedCategory.icon
        } : undefined
      };

      await transactionService.updateTransaction(editingTransaction.id, {
        description: updates.description,
        amount: updates.amount,
        transactionType: updates.transactionType.toUpperCase() as 'INCOME' | 'EXPENSE',
        categoryId: updates.categoryId,
        transactionDate: updates.transactionDate,
        paymentMethod: updates.paymentMethod,
        accountName: updates.accountName,
        notes: updates.notes
      });

      toast({
        title: "Success",
        description: "Transaction updated successfully!",
      });

      // Reset form and close dialog
      setEditingTransaction(null);
      setEditTransaction({
        transaction_type: 'EXPENSE',
        amount: 0,
        description: '',
        category_id: '',
        transaction_date: format(new Date(), 'yyyy-MM-dd'),
        payment_method: 'cash',
        account_name: '',
        notes: ''
      });
      setShowEditTransaction(false);

      // Refresh recent transactions
      fetchRecentTransactions();
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast({
        title: "Error",
        description: "Failed to update transaction",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTransaction = async (transactionId: string, description: string) => {
    if (!confirm(`Are you sure you want to delete "${description}"? This action cannot be undone.`)) {
      return;
    }

    try {
      console.log('About to delete transaction:', transactionId);
      await transactionService.deleteTransaction(transactionId);
      
      console.log('Delete completed successfully');
      toast({
        title: "Transaction Deleted",
        description: `Transaction "${description}" has been deleted successfully.`,
      });
      
      // Refresh recent transactions
      fetchRecentTransactions();
      
    } catch (error) {
      console.error('Error deleting transaction:', error);
      console.error('Error type:', typeof error);
      console.error('Error message:', error?.message);
      console.error('Full error object:', error);
      
      toast({
        title: "Error",
        description: `Failed to delete transaction: ${error?.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const getTransactionTypeCategories = () => {
    return categories.filter(c => {
      if (transaction.transactionType === 'INCOME') {
        return c.name.toLowerCase().includes('income') || 
               c.name.toLowerCase().includes('salary') || 
               c.name.toLowerCase().includes('freelance') ||
               c.name.toLowerCase().includes('investment');
      } else {
        return !c.name.toLowerCase().includes('income') && 
               !c.name.toLowerCase().includes('salary') && 
               !c.name.toLowerCase().includes('freelance') &&
               !c.name.toLowerCase().includes('investment');
      }
    });
  };

  const filteredCategories = getTransactionTypeCategories();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Add Transaction
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Record your income and expenses
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Type Toggle */}
              <div>
                <Label>Transaction Type</Label>
                <div className="flex space-x-2 mt-2">
                  <Button
                    variant={transaction.transactionType === 'EXPENSE' ? 'default' : 'outline'}
                    onClick={() => setTransaction({...transaction, transactionType: 'EXPENSE', categoryId: ''})}
                    className="flex-1"
                  >
                    <TrendingDown className="h-4 w-4 mr-2" />
                    Expense
                  </Button>
                  <Button
                    variant={transaction.transactionType === 'INCOME' ? 'default' : 'outline'}
                    onClick={() => setTransaction({...transaction, transactionType: 'INCOME', categoryId: ''})}
                    className="flex-1"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Income
                  </Button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <Label htmlFor="amount">Amount (₹)</Label>
                <div className="space-y-2">
                  <Input
                    id="amount"
                    type="number"
                    value={transaction.amount || ''}
                    onChange={(e) => setTransaction({...transaction, amount: parseFloat(e.target.value) || 0})}
                    placeholder="Enter amount"
                    className="text-xl font-semibold"
                  />
                  <div className="flex space-x-2">
                    {quickAmounts.map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        size="sm"
                        onClick={() => setTransaction({...transaction, amount})}
                      >
                        ₹{amount}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={transaction.description}
                  onChange={(e) => setTransaction({...transaction, description: e.target.value})}
                  placeholder="What did you spend on?"
                />
              </div>

              {/* Category */}
              <div>
                <div className="flex items-center justify-between">
                  <Label>Category</Label>
                  <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="h-3 w-3 mr-1" />
                        Add Category
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Category</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="categoryName">Category Name</Label>
                          <Input
                            id="categoryName"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="Enter category name"
                          />
                        </div>
                        <div>
                          <Label>Color</Label>
                          <div className="flex space-x-2 mt-2">
                            {colorOptions.map((color) => (
                              <button
                                key={color}
                                className={`w-8 h-8 rounded-full border-2 ${
                                  newCategoryColor === color ? 'border-gray-800' : 'border-gray-300'
                                }`}
                                style={{ backgroundColor: color }}
                                onClick={() => setNewCategoryColor(color)}
                              />
                            ))}
                          </div>
                        </div>
                        <Button onClick={handleAddCategory} className="w-full">
                          Add Category
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <Select value={transaction.categoryId} onValueChange={(value) => setTransaction({...transaction, categoryId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color || '#3B82F6' }} />
                          <span>{category.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date */}
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={transaction.transactionDate}
                  onChange={(e) => setTransaction({...transaction, transactionDate: e.target.value})}
                />
              </div>

              {/* Payment Method */}
              <div>
                <Label>Payment Method</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {paymentMethods.map((method) => (
                    <Button
                      key={method.id}
                      variant={transaction.paymentMethod === method.id ? 'default' : 'outline'}
                      onClick={() => setTransaction({...transaction, paymentMethod: method.id})}
                      className="justify-start"
                    >
                      <method.icon className="h-4 w-4 mr-2" />
                      {method.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Account */}
              <div>
                <Label>Account</Label>
                <Select value={transaction.accountName} onValueChange={(value) => setTransaction({...transaction, accountName: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.name}>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                          <span>{account.name}</span>
                          <span className="text-xs text-gray-500">
                            ({account.type.toLowerCase()} • ₹{account.balance.toLocaleString()})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={transaction.notes}
                  onChange={(e) => setTransaction({...transaction, notes: e.target.value})}
                  placeholder="Add any additional notes"
                  rows={3}
                />
              </div>

              {/* Save Button */}
              <Button onClick={handleSave} className="w-full" size="lg">
                <Save className="h-4 w-4 mr-2" />
                Save Transaction
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentTransactions.map((trans) => (
                  <div key={trans.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full mt-1"
                          style={{ backgroundColor: trans.categories?.color || '#3B82F6' }}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{trans.description}</div>
                          <div className="text-xs text-gray-500">{trans.categories?.name || 'Uncategorized'}</div>
                          <div className="text-xs text-gray-400">
                            {format(new Date(trans.transactionDate || trans.transaction_date), 'MMM dd')} • {trans.paymentMethod || trans.payment_method}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`text-sm font-semibold ${trans.transactionType === 'INCOME' || trans.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {trans.transactionType === 'INCOME' || trans.transaction_type === 'income' ? '+' : '-'}₹{trans.amount}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditTransaction(trans)}>
                              <Edit2 className="h-4 w-4 mr-2" />
                              Edit Transaction
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteTransaction(trans.id, trans.description)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Transaction
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
                {recentTransactions.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <p>No recent transactions</p>
                    <p className="text-sm">Add your first transaction above</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Today's Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(() => {
                  try {
                    const today = format(new Date(), 'yyyy-MM-dd');
                    const todayTransactions = recentTransactions.filter(t => {
                      const transactionDate = t.transactionDate || t.transaction_date;
                      return transactionDate && transactionDate.includes(today);
                    });
                    const todayIncome = todayTransactions
                      .filter(t => (t.transactionType === 'INCOME' || t.transaction_type === 'income'))
                      .reduce((sum, t) => sum + (t.amount || 0), 0);
                    const todayExpenses = todayTransactions
                      .filter(t => (t.transactionType === 'EXPENSE' || t.transaction_type === 'expense'))
                      .reduce((sum, t) => sum + (t.amount || 0), 0);
                    const net = todayIncome - todayExpenses;

                  return (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Income</span>
                        <span className="font-medium text-green-600">₹{todayIncome.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Expenses</span>
                        <span className="font-medium text-red-600">₹{todayExpenses.toLocaleString()}</span>
                      </div>
                      <hr />
                      <div className="flex justify-between text-sm font-medium">
                        <span>Net</span>
                        <span className={net >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {net >= 0 ? '+' : ''}₹{net.toLocaleString()}
                        </span>
                      </div>
                    </>
                  );
                  } catch (error) {
                    console.error('Error in Today\'s Summary:', error);
                    return (
                      <div className="text-center text-gray-500 py-4">
                        <p>Unable to load today's summary</p>
                      </div>
                    );
                  }
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Transaction Dialog */}
      <Dialog open={showEditTransaction} onOpenChange={setShowEditTransaction}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Type Toggle */}
            <div>
              <Label>Transaction Type</Label>
              <div className="flex space-x-2 mt-2">
                <Button
                  variant={editTransaction.transaction_type === 'EXPENSE' ? 'default' : 'outline'}
                  onClick={() => setEditTransaction({...editTransaction, transaction_type: 'EXPENSE', category_id: ''})}
                  className="flex-1"
                >
                  <TrendingDown className="h-4 w-4 mr-2" />
                  Expense
                </Button>
                <Button
                  variant={editTransaction.transaction_type === 'INCOME' ? 'default' : 'outline'}
                  onClick={() => setEditTransaction({...editTransaction, transaction_type: 'INCOME', category_id: ''})}
                  className="flex-1"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Income
                </Button>
              </div>
            </div>

            {/* Amount */}
            <div>
              <Label htmlFor="editAmount">Amount (₹)</Label>
              <Input
                id="editAmount"
                type="number"
                value={editTransaction.amount || ''}
                onChange={(e) => setEditTransaction({...editTransaction, amount: parseFloat(e.target.value) || 0})}
                placeholder="Enter amount"
                className="text-xl font-semibold"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="editDescription">Description</Label>
              <Input
                id="editDescription"
                value={editTransaction.description}
                onChange={(e) => setEditTransaction({...editTransaction, description: e.target.value})}
                placeholder="What did you spend on?"
              />
            </div>

            {/* Category */}
            <div>
              <Label>Category</Label>
              <Select value={editTransaction.category_id} onValueChange={(value) => setEditTransaction({...editTransaction, category_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter(c => {
                    if (editTransaction.transaction_type === 'INCOME') {
                      return c.name.toLowerCase().includes('income') || 
                             c.name.toLowerCase().includes('salary') || 
                             c.name.toLowerCase().includes('freelance') ||
                             c.name.toLowerCase().includes('investment');
                    } else {
                      return !c.name.toLowerCase().includes('income') && 
                             !c.name.toLowerCase().includes('salary') && 
                             !c.name.toLowerCase().includes('freelance') &&
                             !c.name.toLowerCase().includes('investment');
                    }
                  }).map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color || '#3B82F6' }} />
                        <span>{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={editTransaction.transaction_date}
                onChange={(e) => setEditTransaction({...editTransaction, transaction_date: e.target.value})}
              />
            </div>

            {/* Payment Method */}
            <div>
              <Label>Payment Method</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {paymentMethods.map((method) => (
                  <Button
                    key={method.id}
                    variant={editTransaction.payment_method === method.id ? 'default' : 'outline'}
                    onClick={() => setEditTransaction({...editTransaction, payment_method: method.id})}
                    className="justify-start"
                  >
                    <method.icon className="h-4 w-4 mr-2" />
                    {method.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Account */}
            <div>
              <Label>Account</Label>
              <Select value={editTransaction.account_name} onValueChange={(value) => setEditTransaction({...editTransaction, account_name: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.name}>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span>{account.name}</span>
                        <span className="text-xs text-gray-500">
                          ({account.type.toLowerCase()} • ₹{account.balance.toLocaleString()})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="editNotes">Notes (Optional)</Label>
              <Textarea
                id="editNotes"
                value={editTransaction.notes}
                onChange={(e) => setEditTransaction({...editTransaction, notes: e.target.value})}
                placeholder="Add any additional notes"
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button onClick={handleUpdateTransaction} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                Update Transaction
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowEditTransaction(false)}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddTransaction;