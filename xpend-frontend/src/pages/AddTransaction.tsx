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
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { STORAGE_CONFIG } from '@/config/storage';
import { 
  addStoredTransaction, 
  updateStoredTransaction,
  deleteStoredTransaction,
  getStoredTransactions,
  getPersonalTransactions,
  getGroupTransactions,
  getPersonalFinancialAccounts,
  getGroupFinancialAccounts,
  type StoredTransaction,
  type FinancialAccount
} from '@/utils/dataStorage';

type Transaction = StoredTransaction;

const AddTransaction = () => {
  const { user, categories, isPersonalMode, currentGroup, addCategory } = useApp();
  const { toast } = useToast();

  const [transaction, setTransaction] = useState<Partial<StoredTransaction>>({
    transaction_type: 'expense',
    amount: 0,
    description: '',
    category_id: '',
    transaction_date: format(new Date(), 'yyyy-MM-dd'),
    payment_method: 'cash',
    account_name: '',
    notes: ''
  });

  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6');
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  
  // Edit Transaction States
  const [showEditTransaction, setShowEditTransaction] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editTransaction, setEditTransaction] = useState<Partial<StoredTransaction>>({
    transaction_type: 'expense',
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
  }, [user, isPersonalMode, currentGroup]);

  const paymentMethods = [
    { id: 'cash', name: 'Cash', icon: Wallet },
    { id: 'card', name: 'Credit/Debit Card', icon: CreditCard },
    { id: 'upi', name: 'UPI', icon: Smartphone },
    { id: 'bank_transfer', name: 'Bank Transfer', icon: Building },
  ];

  const fetchAccounts = () => {
    if (!user) return;

    try {
      let userAccounts: FinancialAccount[] = [];
      if (isPersonalMode) {
        userAccounts = getPersonalFinancialAccounts(user.id);
      } else if (currentGroup) {
        userAccounts = getGroupFinancialAccounts(currentGroup.id);
      }
      setAccounts(userAccounts);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const quickAmounts = [50, 100, 200, 500, 1000, 2000];

  const fetchRecentTransactions = () => {
    if (!user) return;

    try {
      let transactions: StoredTransaction[] = [];
      if (isPersonalMode) {
        transactions = getPersonalTransactions(user.id, user.email);
      } else if (currentGroup) {
        transactions = getGroupTransactions(currentGroup.id);
      }
      
      // Sort by created_at descending and take latest 10
      const sortedTransactions = transactions
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);
      
      setRecentTransactions(sortedTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleSave = () => {
    if (!user || !transaction.description || !transaction.amount || !transaction.category_id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const selectedCategory = categories.find(c => c.id === transaction.category_id);
      
      const newTransaction: StoredTransaction = {
        id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: user.id,
        group_id: isPersonalMode ? null : currentGroup?.id || null,
        created_by: user.id,
        transaction_type: transaction.transaction_type || 'expense',
        amount: transaction.amount || 0,
        description: transaction.description || '',
        category_id: transaction.category_id || '',
        transaction_date: transaction.transaction_date || format(new Date(), 'yyyy-MM-dd'),
        payment_method: transaction.payment_method || 'cash',
        account_name: transaction.account_name || '',
        notes: transaction.notes || '',
        source: 'manual',
        created_at: new Date().toISOString(),
        member_email: user.email || '',
        categories: selectedCategory ? {
          id: selectedCategory.id,
          name: selectedCategory.name,
          color: selectedCategory.color || '#3B82F6',
          icon: selectedCategory.icon
        } : undefined
      };

      addStoredTransaction(newTransaction);

      toast({
        title: "Success",
        description: "Transaction added successfully!",
      });

      // Reset form
      setTransaction({
        transaction_type: 'expense',
        amount: 0,
        description: '',
        category_id: '',
        transaction_date: format(new Date(), 'yyyy-MM-dd'),
        payment_method: 'cash',
        account_name: '',
        notes: ''
      });

      // Refresh recent transactions
      fetchRecentTransactions();
    } catch (error) {
      console.error('Error saving transaction:', error);
      toast({
        title: "Error",
        description: "Failed to save transaction",
        variant: "destructive",
      });
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    const category = await addCategory(newCategoryName.trim(), newCategoryColor);
    if (category) {
      setTransaction({ ...transaction, category_id: category.id });
      setNewCategoryName('');
      setNewCategoryColor('#3B82F6');
      setShowAddCategory(false);
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditTransaction({
      transaction_type: transaction.transaction_type,
      amount: transaction.amount,
      description: transaction.description,
      category_id: transaction.category_id,
      transaction_date: transaction.transaction_date,
      payment_method: transaction.payment_method,
      account_name: transaction.account_name,
      notes: transaction.notes || ''
    });
    setShowEditTransaction(true);
  };

  const handleUpdateTransaction = () => {
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
      
      const updates: Partial<StoredTransaction> = {
        transaction_type: editTransaction.transaction_type || 'expense',
        amount: editTransaction.amount || 0,
        description: editTransaction.description || '',
        category_id: editTransaction.category_id || '',
        transaction_date: editTransaction.transaction_date || format(new Date(), 'yyyy-MM-dd'),
        payment_method: editTransaction.payment_method || 'cash',
        account_name: editTransaction.account_name || '',
        notes: editTransaction.notes || '',
        categories: selectedCategory ? {
          id: selectedCategory.id,
          name: selectedCategory.name,
          color: selectedCategory.color || '#3B82F6',
          icon: selectedCategory.icon
        } : undefined
      };

      updateStoredTransaction(editingTransaction.id, updates);

      toast({
        title: "Success",
        description: "Transaction updated successfully!",
      });

      // Reset form and close dialog
      setEditingTransaction(null);
      setEditTransaction({
        transaction_type: 'expense',
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

  const handleDeleteTransaction = (transactionId: string, description: string) => {
    if (!confirm(`Are you sure you want to delete "${description}"? This action cannot be undone.`)) {
      return;
    }

    try {
      deleteStoredTransaction(transactionId);
      
      toast({
        title: "Transaction Deleted",
        description: `Transaction "${description}" has been deleted successfully.`,
      });
      
      // Refresh recent transactions
      fetchRecentTransactions();
      
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive",
      });
    }
  };

  const getTransactionTypeCategories = () => {
    return categories.filter(c => {
      if (transaction.transaction_type === 'income') {
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
                    variant={transaction.transaction_type === 'expense' ? 'default' : 'outline'}
                    onClick={() => setTransaction({...transaction, transaction_type: 'expense', category_id: ''})}
                    className="flex-1"
                  >
                    <TrendingDown className="h-4 w-4 mr-2" />
                    Expense
                  </Button>
                  <Button
                    variant={transaction.transaction_type === 'income' ? 'default' : 'outline'}
                    onClick={() => setTransaction({...transaction, transaction_type: 'income', category_id: ''})}
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
                <Select value={transaction.category_id} onValueChange={(value) => setTransaction({...transaction, category_id: value})}>
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
                  value={transaction.transaction_date}
                  onChange={(e) => setTransaction({...transaction, transaction_date: e.target.value})}
                />
              </div>

              {/* Payment Method */}
              <div>
                <Label>Payment Method</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {paymentMethods.map((method) => (
                    <Button
                      key={method.id}
                      variant={transaction.payment_method === method.id ? 'default' : 'outline'}
                      onClick={() => setTransaction({...transaction, payment_method: method.id})}
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
                <Select value={transaction.account_name} onValueChange={(value) => setTransaction({...transaction, account_name: value})}>
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
                            ({account.type} • ₹{account.balance.toLocaleString()})
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
                            {format(new Date(trans.transaction_date), 'MMM dd')} • {trans.payment_method}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`text-sm font-semibold ${trans.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {trans.transaction_type === 'income' ? '+' : '-'}₹{trans.amount}
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
                  const today = format(new Date(), 'yyyy-MM-dd');
                  const todayTransactions = recentTransactions.filter(t => 
                    t.transaction_date === today
                  );
                  const todayIncome = todayTransactions
                    .filter(t => t.transaction_type === 'income')
                    .reduce((sum, t) => sum + t.amount, 0);
                  const todayExpenses = todayTransactions
                    .filter(t => t.transaction_type === 'expense')
                    .reduce((sum, t) => sum + t.amount, 0);
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
                  variant={editTransaction.transaction_type === 'expense' ? 'default' : 'outline'}
                  onClick={() => setEditTransaction({...editTransaction, transaction_type: 'expense', category_id: ''})}
                  className="flex-1"
                >
                  <TrendingDown className="h-4 w-4 mr-2" />
                  Expense
                </Button>
                <Button
                  variant={editTransaction.transaction_type === 'income' ? 'default' : 'outline'}
                  onClick={() => setEditTransaction({...editTransaction, transaction_type: 'income', category_id: ''})}
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
                    if (editTransaction.transaction_type === 'income') {
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
                          ({account.type} • ₹{account.balance.toLocaleString()})
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