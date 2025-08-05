import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
  Download,
  Edit2,
  Trash2,
  Plus,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';
// Import from unified storage service
import { 
  getStoredTransactions,
  getPersonalTransactions, 
  getGroupTransactions,
  deleteStoredTransaction,
  updateStoredTransaction,
  getFinancialAccounts,
  updateFinancialAccount,
  type FinancialAccount
} from '@/utils/storageService';

type Transaction = Tables<'transactions'> & {
  categories: Tables<'categories'>;
};

interface FilterState {
  search: string;
  category: string;
  type: string;
  dateFrom: string;
  dateTo: string;
  paymentMethod: string;
}

const Transactions = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isPersonalMode, currentGroup, categories, dataVersion, refreshData } = useApp();
  const { toast } = useToast();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [editForm, setEditForm] = useState({
    description: '',
    amount: '',
    category_id: '',
    transaction_date: '',
    payment_method: '',
    account_name: '',
    notes: '',
    transaction_type: 'debit' as 'credit' | 'debit'
  });

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: searchParams.get('category') || '',
    type: '',
    dateFrom: '',
    dateTo: '',
    paymentMethod: ''
  });

  useEffect(() => {
    if (user) {
      fetchTransactions();
      fetchAccounts();
    }
  }, [user, isPersonalMode, currentGroup, dataVersion]);

  const fetchAccounts = async () => {
    if (!user) return;

    try {
      const allAccounts = await getFinancialAccounts();
      
      let userAccounts: FinancialAccount[] = [];
      if (isPersonalMode) {
        userAccounts = allAccounts.filter(a => 
          a.user_id === user.id && 
          (a.group_id === null || a.group_id === undefined) &&
          a.is_active
        );
      } else if (currentGroup) {
        userAccounts = allAccounts.filter(a => 
          a.group_id === currentGroup.id &&
          a.is_active
        );
      }
      
      setAccounts(userAccounts);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const updateAccountBalance = async (accountName: string, amount: number, transactionType: 'credit' | 'debit') => {
    try {
      const account = accounts.find(a => a.name === accountName);
      if (!account) {
        console.error('Account not found:', accountName);
        return false;
      }

      let newBalance;
      if (account.type === 'credit_card') {
        // For credit cards: debit increases outstanding balance, credit decreases it
        if (transactionType === 'debit') {
          newBalance = account.balance + amount; // Increase outstanding amount
        } else {
          newBalance = account.balance - amount; // Decrease outstanding amount (payment)
        }
      } else {
        // For regular accounts: debit decreases balance, credit increases it
        if (transactionType === 'debit') {
          newBalance = account.balance - amount; // Money going out
        } else {
          newBalance = account.balance + amount; // Money coming in
        }
      }

      console.log(`💰 Updating ${account.type} account ${accountName}: ${account.balance} -> ${newBalance} (${transactionType} ₹${amount})`);

      const result = await updateFinancialAccount(account.id, { balance: newBalance });
      return result !== null;
    } catch (error) {
      console.error('Error updating account balance:', error);
      return false;
    }
  };

  useEffect(() => {
    applyFilters();
  }, [transactions, filters]);

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get transactions based on mode
      let filteredData;
      if (isPersonalMode) {
        filteredData = await getPersonalTransactions(user.id, user.email);
      } else if (currentGroup) {
        filteredData = await getGroupTransactions(currentGroup.id);
      } else {
        filteredData = [];
      }
      
      console.log('🔍 Transactions fetched:', filteredData.length, 'transactions');

      setTransactions(filteredData);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = transactions;

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(searchLower) ||
        t.categories?.name.toLowerCase().includes(searchLower) ||
        t.notes?.toLowerCase().includes(searchLower)
      );
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(t => t.category_id === filters.category);
    }

    // Type filter
    if (filters.type) {
      filtered = filtered.filter(t => t.transaction_type === filters.type);
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(t => t.transaction_date >= filters.dateFrom);
    }
    if (filters.dateTo) {
      filtered = filtered.filter(t => t.transaction_date <= filters.dateTo);
    }

    // Payment method filter
    if (filters.paymentMethod) {
      filtered = filtered.filter(t => t.payment_method === filters.paymentMethod);
    }

    setFilteredTransactions(filtered);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      type: '',
      dateFrom: '',
      dateTo: '',
      paymentMethod: ''
    });
    setShowFilters(false);
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditForm({
      description: transaction.description,
      amount: transaction.amount.toString(),
      category_id: transaction.category_id,
      transaction_date: transaction.transaction_date,
      payment_method: transaction.payment_method || '',
      account_name: transaction.account_name || '',
      notes: transaction.notes || '',
      transaction_type: transaction.transaction_type as 'credit' | 'debit'
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!editingTransaction) return;

    try {
      const originalTransaction = editingTransaction;
      const newAmount = parseFloat(editForm.amount);
      const newTransactionType = editForm.transaction_type as 'credit' | 'debit';
      const newAccountName = editForm.account_name;

      // Check if balance-affecting fields changed
      const amountChanged = originalTransaction.amount !== newAmount;
      const typeChanged = originalTransaction.transaction_type !== newTransactionType;
      const accountChanged = originalTransaction.account_name !== newAccountName;

      if (amountChanged || typeChanged || accountChanged) {
        // Reverse the original transaction's effect if it had an account
        if (originalTransaction.account_name) {
          await updateAccountBalance(
            originalTransaction.account_name,
            originalTransaction.amount,
            originalTransaction.transaction_type === 'debit' ? 'credit' : 'debit'
          );
        }

        // Apply the new transaction's effect if it has an account
        if (newAccountName) {
          await updateAccountBalance(
            newAccountName,
            newAmount,
            newTransactionType
          );
        }
      }

      const updates = {
        description: editForm.description,
        amount: newAmount,
        category_id: editForm.category_id,
        transaction_date: editForm.transaction_date,
        payment_method: editForm.payment_method,
        account_name: newAccountName,
        notes: editForm.notes,
        transaction_type: newTransactionType
      };

      const success = await updateStoredTransaction(editingTransaction.id, updates);
      
      if (success) {
        toast({
          title: "Success",
          description: "Transaction updated successfully and account balances updated",
        });
        setShowEditDialog(false);
        setEditingTransaction(null);
        fetchTransactions();
        fetchAccounts(); // Refresh accounts to show updated balances
        refreshData();
      } else {
        throw new Error('Failed to update transaction');
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast({
        title: "Error",
        description: "Failed to update transaction",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (transactionId: string) => {
    try {
      // Find the transaction to get its details for balance reversal
      const transactionToDelete = transactions.find(t => t.id === transactionId);
      
      // Reverse the transaction's effect on the account balance if it has an account
      if (transactionToDelete && transactionToDelete.account_name) {
        await updateAccountBalance(
          transactionToDelete.account_name,
          transactionToDelete.amount,
          transactionToDelete.transaction_type === 'debit' ? 'credit' : 'debit'
        );
      }

      const success = await deleteStoredTransaction(transactionId);
      
      if (success) {
        toast({
          title: "Success",
          description: "Transaction deleted successfully and account balance updated",
        });
        fetchTransactions();
        fetchAccounts(); // Refresh accounts to show updated balances
        refreshData();
      } else {
        throw new Error('Failed to delete transaction');
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive",
      });
    }
  };

  const exportTransactions = () => {
    const csvContent = [
      ['Date', 'Type', 'Description', 'Category', 'Amount', 'Payment Method', 'Account', 'Notes'],
      ...filteredTransactions.map(t => [
        t.transaction_date,
        t.transaction_type,
        t.description,
        t.categories?.name || 'Uncategorized',
        t.amount,
        t.payment_method || '',
        t.account_name || '',
        t.notes || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const totalCredit = filteredTransactions
    .filter(t => t.transaction_type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDebit = filteredTransactions
    .filter(t => t.transaction_type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);

  const paymentMethods = ['cash', 'debit_card', 'credit_card', 'upi', 'bank_transfer', 'loan_payment'];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Transactions</h1>
        </div>
        <div className="text-center py-8">Loading transactions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Transactions
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage all your transactions
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={exportTransactions}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => navigate('/add')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredTransactions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Total Credit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{totalCredit.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Total Debit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ₹{totalDebit.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search transactions..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              {(filters.category || filters.type || filters.dateFrom || filters.dateTo || filters.paymentMethod) && (
                <Button variant="ghost" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-4 border-t">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All categories</SelectItem>
                      {categories.map((category) => (
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

                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All types</SelectItem>
                      <SelectItem value="credit">Credit</SelectItem>
                      <SelectItem value="debit">Debit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dateFrom">From Date</Label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="dateTo">To Date</Label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select value={filters.paymentMethod} onValueChange={(value) => setFilters({ ...filters, paymentMethod: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="All methods" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All methods</SelectItem>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method === 'debit_card' ? 'Debit Card' : 
                           method === 'credit_card' ? 'Credit Card' :
                           method === 'bank_transfer' ? 'Bank Transfer' :
                           method === 'loan_payment' ? 'Loan Payment' :
                           method.charAt(0).toUpperCase() + method.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Transactions ({filteredTransactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: transaction.categories?.color || '#3B82F6' }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{transaction.description}</span>
                        <Badge variant={transaction.transaction_type === 'credit' ? 'default' : 'secondary'}>
                          {transaction.transaction_type === 'credit' ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          )}
                          {transaction.transaction_type}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500 space-x-4">
                        <span>{transaction.categories?.name || 'Uncategorized'}</span>
                        <span>•</span>
                        <span>{format(new Date(transaction.transaction_date), 'MMM dd, yyyy')}</span>
                        <span>•</span>
                        <span>{transaction.payment_method === 'debit_card' ? 'Debit Card' : 
                               transaction.payment_method === 'credit_card' ? 'Credit Card' :
                               transaction.payment_method === 'bank_transfer' ? 'Bank Transfer' :
                               transaction.payment_method === 'loan_payment' ? 'Loan Payment' :
                               transaction.payment_method?.charAt(0).toUpperCase() + transaction.payment_method?.slice(1)}</span>
                        {transaction.account_name && (
                          <>
                            <span>•</span>
                            <span>{transaction.account_name}</span>
                          </>
                        )}
                      </div>
                      {transaction.notes && (
                        <div className="text-xs text-gray-400 mt-1">
                          {transaction.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className={`text-lg font-semibold ${transaction.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.transaction_type === 'credit' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                    </div>
                    <div className="flex space-x-1">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleEdit(transaction)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleDelete(transaction.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p>No transactions found</p>
                <p className="text-sm">Try adjusting your filters or add some transactions</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => navigate('/add')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Transaction
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Transaction Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editDescription">Description</Label>
              <Input
                id="editDescription"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Transaction description"
              />
            </div>

            <div>
              <Label htmlFor="editAmount">Amount</Label>
              <Input
                id="editAmount"
                type="number"
                step="0.01"
                value={editForm.amount}
                onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="editType">Type</Label>
              <Select value={editForm.transaction_type} onValueChange={(value) => setEditForm({ ...editForm, transaction_type: value as 'credit' | 'debit' })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="debit">Debit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="editCategory">Category</Label>
              <Select value={editForm.category_id} onValueChange={(value) => setEditForm({ ...editForm, category_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
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

            <div>
              <Label htmlFor="editDate">Date</Label>
              <Input
                id="editDate"
                type="date"
                value={editForm.transaction_date}
                onChange={(e) => setEditForm({ ...editForm, transaction_date: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="editPaymentMethod">Payment Method</Label>
              <Select value={editForm.payment_method} onValueChange={(value) => setEditForm({ ...editForm, payment_method: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method === 'debit_card' ? 'Debit Card' : 
                       method === 'credit_card' ? 'Credit Card' :
                       method === 'bank_transfer' ? 'Bank Transfer' :
                       method === 'loan_payment' ? 'Loan Payment' :
                       method.charAt(0).toUpperCase() + method.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="editAccount">Account</Label>
              <Select value={editForm.account_name} onValueChange={(value) => setEditForm({ ...editForm, account_name: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.length > 0 ? (
                    accounts.map((account) => (
                      <SelectItem key={account.id} value={account.name}>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                          <span>{account.name}</span>
                          <span className="text-xs text-gray-500">
                            ({account.type} • ₹{account.balance.toLocaleString()})
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-accounts" disabled>
                      No accounts available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="editNotes">Notes</Label>
              <Textarea
                id="editNotes"
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Additional notes"
                rows={3}
              />
            </div>

            <div className="flex space-x-2">
              <Button onClick={handleSaveEdit} className="flex-1">
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setShowEditDialog(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Transactions;