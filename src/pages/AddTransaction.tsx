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
  CreditCard as CreditCardIcon,
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
  MoreHorizontal,
  Target
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { STORAGE_CONFIG } from '@/config/storage';
// Import from unified storage service
import { 
  addStoredTransaction, 
  updateStoredTransaction,
  deleteStoredTransaction,
  getStoredTransactions,
  getPersonalTransactions,
  getGroupTransactions,
  getFinancialAccounts,
  updateFinancialAccount,
  type StoredTransaction,
  type FinancialAccount
} from '@/utils/storageService';

type Transaction = StoredTransaction;

const AddTransaction = () => {
  const { user, categories, isPersonalMode, currentGroup, addCategory, refreshData } = useApp();
  const { toast } = useToast();

  const [transaction, setTransaction] = useState<Partial<StoredTransaction>>({
    transaction_type: 'debit', // Changed from 'expense' to 'debit'
    amount: 0,
    description: '',
    category_id: '',
    transaction_date: format(new Date(), 'yyyy-MM-dd'),
    payment_method: 'cash',
    account_name: '',
    notes: ''
  });
  
  const [insufficientBalance, setInsufficientBalance] = useState(false);
  const [noCashAccount, setNoCashAccount] = useState(false);
  const [noCreditCardAccount, setNoCreditCardAccount] = useState(false);
  const [noLoanAccount, setNoLoanAccount] = useState(false);

  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6');
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  
  // Edit Transaction States
  const [showEditTransaction, setShowEditTransaction] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editTransaction, setEditTransaction] = useState<Partial<StoredTransaction>>({
    transaction_type: 'debit',
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

  // Auto-select account based on payment method
  useEffect(() => {
    if (accounts.length > 0 && transaction.payment_method) {
      autoSelectAccount();
    }
  }, [accounts, transaction.payment_method]);

  const autoSelectAccount = () => {
    if (!transaction.payment_method || accounts.length === 0) return;

    let suggestedAccount;
    
    switch (transaction.payment_method) {
      case 'cash':
        // Find cash account only - cash is liquid and separate from banks
        suggestedAccount = accounts.find(a => a.type === 'cash');
        break;
      case 'debit_card':
        // Debits card uses your bank account money (savings/checking)
        suggestedAccount = accounts.find(a => 
          a.type === 'savings' || a.type === 'checking'
        );
        break;
      case 'credit_card':
        // Credit card uses credit line from credit card accounts
        suggestedAccount = accounts.find(a => a.type === 'credit_card');
        break;
      case 'loan_payment':
        // For loan payments, select the first loan account
        suggestedAccount = accounts.find(a => a.type === 'loan');
        break;
      case 'upi':
      case 'bank_transfer':
        // Find bank accounts only (savings, checking)
        suggestedAccount = accounts.find(a => 
          a.type === 'savings' || a.type === 'checking'
        );
        break;
    }

    // Special handling for specific payment methods - don't fallback to other accounts
    if (transaction.payment_method === 'cash' && !suggestedAccount) {
      setNoCashAccount(true);
      setNoCreditCardAccount(false);
      return;
    } else if (transaction.payment_method === 'credit_card' && !suggestedAccount) {
      setNoCreditCardAccount(true);
      setNoCashAccount(false);
      setNoLoanAccount(false);
      return;
    } else if (transaction.payment_method === 'loan_payment' && !suggestedAccount) {
      setNoLoanAccount(true);
      setNoCashAccount(false);
      setNoCreditCardAccount(false);
      return;
    } else {
      setNoCashAccount(false);
      setNoCreditCardAccount(false);
      setNoLoanAccount(false);
    }

    // For generic payment methods, if no specific account found, use the first available account
    if (!suggestedAccount && !['cash', 'credit_card', 'loan_payment'].includes(transaction.payment_method!)) {
      suggestedAccount = accounts[0];
    }

    if (suggestedAccount && (!transaction.account_name || transaction.account_name === '')) {
      setTransaction(prev => ({ ...prev, account_name: suggestedAccount!.name }));
    }
  };

  const paymentMethods = [
    { id: 'cash', name: 'Cash', icon: Wallet },
    { id: 'debit_card', name: 'Debit Card', icon: CreditCard },
    { id: 'credit_card', name: 'Credit Card', icon: CreditCardIcon },
    { id: 'upi', name: 'UPI', icon: Smartphone },
    { id: 'bank_transfer', name: 'Bank Transfer', icon: Building },
    { id: 'loan_payment', name: 'Loan Payment', icon: Target },
  ];

  const fetchAccounts = async () => {
    if (!user) return;

    try {
      console.log('🔄 AddTransaction fetching accounts for user:', user.id, 'Personal mode:', isPersonalMode);
      const allAccounts = await getFinancialAccounts();
      console.log('📊 AddTransaction - All accounts from storage:', allAccounts.length, allAccounts);
      
      let userAccounts: FinancialAccount[] = [];
      if (isPersonalMode) {
        // Personal mode: get accounts with no group_id
        userAccounts = allAccounts.filter(a => 
          a.user_id === user.id && 
          (a.group_id === null || a.group_id === undefined) &&
          a.is_active
        );
        console.log('👤 AddTransaction - Personal accounts filtered:', userAccounts.length);
      } else if (currentGroup) {
        // Group mode: get accounts for this specific group
        userAccounts = allAccounts.filter(a => 
          a.group_id === currentGroup.id &&
          a.is_active
        );
        console.log('👥 AddTransaction - Group accounts filtered:', userAccounts.length);
      }
      
      setAccounts(userAccounts);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const quickAmounts = [50, 100, 200, 500, 1000, 2000];

  // Filter accounts based on selected payment method
  const getEligibleAccounts = (paymentMethod: string) => {
    if (!paymentMethod) return accounts;

    switch (paymentMethod) {
      case 'cash':
        return accounts.filter(account => account.type === 'cash');
      case 'debit_card':
      case 'upi':
      case 'bank_transfer':
        return accounts.filter(account => 
          account.type === 'savings' || 
          account.type === 'checking' || 
          account.type === 'current'
        );
      case 'credit_card':
        return accounts.filter(account => account.type === 'credit_card');
      case 'loan_payment':
        return accounts.filter(account => account.type === 'loan');
      default:
        return accounts;
    }
  };

  const fetchRecentTransactions = async () => {
    if (!user) return;

    try {
      let transactions: StoredTransaction[] = [];
      if (isPersonalMode) {
        transactions = await getPersonalTransactions(user.id, user.email);
      } else if (currentGroup) {
        transactions = await getGroupTransactions(currentGroup.id);
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

  const updateAccountBalance = async (accountName: string, amount: number, transactionType: 'credit' | 'debit') => {
    try {
      const account = accounts.find(a => a.name === accountName);
      if (!account) {
        console.error('Account not found:', accountName);
        return false;
      }

      // Calculate new balance based on transaction type and account type
      let newBalance;
      
      if (account.type === 'credit_card') {
        // For credit cards: debit increases outstanding balance, credit decreases it
        if (transactionType === 'debit') {
          newBalance = account.balance + amount; // Increase outstanding amount
        } else {
          newBalance = account.balance - amount; // Decrease outstanding amount (payment)
        }
      } else {
        // For regular accounts (cash, savings, checking): debit decreases balance, credit increases it
        if (transactionType === 'debit') {
          newBalance = account.balance - amount; // Money going out
        } else {
          newBalance = account.balance + amount; // Money coming in
        }
      }

      console.log(`💰 Updating ${account.type} account ${accountName}: ${account.balance} -> ${newBalance} (${transactionType} ₹${amount})`);

      // Update account balance
      const result = await updateFinancialAccount(account.id, { balance: newBalance });
      return result !== null;
    } catch (error) {
      console.error('Error updating account balance:', error);
      return false;
    }
  };

  const handleSave = async () => {
    if (!user || !transaction.description || !transaction.amount || !transaction.category_id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Special validation for cash transactions
    if (transaction.payment_method === 'cash') {
      const cashAccount = accounts.find(a => a.type === 'cash');
      if (!cashAccount) {
        toast({
          title: "No Cash Account",
          description: "Please add a cash account first to record cash transactions. You can add one from the Accounts page.",
          variant: "destructive",
        });
        return;
      }
      
      // Check cash balance for expenses
      if (transaction.transaction_type === 'debit' && cashAccount.balance < transaction.amount!) {
        toast({
          title: "Insufficient Cash Balance",
          description: `You don't have enough cash. Available: ₹${cashAccount.balance.toLocaleString()}, Required: ₹${transaction.amount!.toLocaleString()}`,
          variant: "destructive",
        });
        setInsufficientBalance(true);
        return;
      }
    }

    // Special validation for credit card transactions
    if (transaction.payment_method === 'credit_card') {
      const creditCardAccount = accounts.find(a => a.type === 'credit_card');
      if (!creditCardAccount) {
        toast({
          title: "No Credit Card Account",
          description: "Please add a credit card account first to record credit card transactions. You can add one from the Accounts page.",
          variant: "destructive",
        });
        return;
      }
      
      // For credit cards, check available credit limit for expenses
      if (transaction.transaction_type === 'debit') {
        const availableCredit = (creditCardAccount.credit_limit || 0) - (creditCardAccount.balance || 0);
        if (availableCredit < transaction.amount!) {
          toast({
            title: "Credit Limit Exceeded",
            description: `Transaction exceeds available credit. Available: ₹${availableCredit.toLocaleString()}, Required: ₹${transaction.amount!.toLocaleString()}`,
            variant: "destructive",
          });
          setInsufficientBalance(true);
          return;
        }
      }
    }

    // Special validation for loan payment transactions
    if (transaction.payment_method === 'loan_payment') {
      const loanAccount = accounts.find(a => a.type === 'loan');
      if (!loanAccount) {
        toast({
          title: "No Loan Account",
          description: "Please add a loan account first to record loan payments. You can add one from the Accounts page.",
          variant: "destructive",
        });
        return;
      }
      
      // For loan payments, ensure we're making a payment (debit transaction)
      if (transaction.transaction_type !== 'debit') {
        toast({
          title: "Invalid Loan Transaction",
          description: "Loan payments should be debit transactions (reducing loan balance).",
          variant: "destructive",
        });
        return;
      }
      
      // Check if payment amount doesn't exceed outstanding loan balance
      if (transaction.amount! > loanAccount.balance) {
        toast({
          title: "Payment Exceeds Loan Balance",
          description: `Payment amount exceeds outstanding loan balance. Outstanding: ₹${loanAccount.balance.toLocaleString()}, Payment: ₹${transaction.amount!.toLocaleString()}`,
          variant: "destructive",
        });
        return;
      }
    }

    // Validate account selection for other payment methods
    if (!['cash', 'credit_card', 'loan_payment'].includes(transaction.payment_method!) && !transaction.account_name) {
      toast({
        title: "Error",
        description: "Please select an account for this transaction",
        variant: "destructive",
      });
      return;
    }
    
    setInsufficientBalance(false);

    try {
      // Determine the account to use based on payment method
      let accountToUse = transaction.account_name;
      if (transaction.payment_method === 'cash') {
        const cashAccount = accounts.find(a => a.type === 'cash');
        accountToUse = cashAccount!.name;
      } else if (transaction.payment_method === 'credit_card') {
        const creditCardAccount = accounts.find(a => a.type === 'credit_card');
        accountToUse = creditCardAccount!.name;
      } else if (transaction.payment_method === 'loan_payment') {
        const loanAccount = accounts.find(a => a.type === 'loan');
        accountToUse = loanAccount!.name;
      }

      // First update account balance
      const balanceUpdated = await updateAccountBalance(
        accountToUse!,
        transaction.amount!,
        transaction.transaction_type!
      );

      if (!balanceUpdated) {
        toast({
          title: "Error",
          description: "Failed to update account balance",
          variant: "destructive",
        });
        return;
      }

      const selectedCategory = categories.find(c => c.id === transaction.category_id);
      
      const newTransaction: Omit<StoredTransaction, 'id' | 'created_at' | 'updated_at'> = {
        user_id: user.id,
        group_id: isPersonalMode ? null : currentGroup?.id || null,
        created_by: user.id,
        transaction_type: transaction.transaction_type || 'expense',
        amount: transaction.amount || 0,
        description: transaction.description || '',
        category_id: transaction.category_id || '',
        transaction_date: transaction.transaction_date || format(new Date(), 'yyyy-MM-dd'),
        payment_method: transaction.payment_method || 'cash',
        account_name: accountToUse || '',
        notes: transaction.notes || '',
        source: 'manual',
        member_email: user.email || ''
      };

      const result = await addStoredTransaction(newTransaction, true); // Skip balance update since we handle it manually

      if (!result) {
        // If transaction creation failed, we should rollback the account balance
        await updateAccountBalance(
          accountToUse!,
          transaction.amount!,
          transaction.transaction_type === 'debit' ? 'credit' : 'debit' // Reverse the operation
        );
        
        toast({
          title: "Error",
          description: "Failed to save transaction",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Transaction added successfully and account balance updated!",
      });

      // Reset form
      setTransaction({
        transaction_type: 'debit',
        amount: 0,
        description: '',
        category_id: '',
        transaction_date: format(new Date(), 'yyyy-MM-dd'),
        payment_method: 'cash',
        account_name: '',
        notes: ''
      });

      // Refresh both transactions and accounts
      await fetchRecentTransactions();
      await fetchAccounts();
      
      // Refresh data to update sidebar statistics
      refreshData();
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

  const handleUpdateTransaction = async () => {
    if (!editingTransaction || !editTransaction.description || !editTransaction.amount || !editTransaction.category_id || !editTransaction.account_name) {
      toast({
        title: "Error",
        description: "Please fill in all required fields including account selection",
        variant: "destructive",
      });
      return;
    }

    try {
      // Handle account balance changes if amount, type, or account changed
      const amountChanged = editingTransaction.amount !== editTransaction.amount;
      const typeChanged = editingTransaction.transaction_type !== editTransaction.transaction_type;
      const accountChanged = editingTransaction.account_name !== editTransaction.account_name;

      if (amountChanged || typeChanged || accountChanged) {
        // Reverse the original transaction's effect on the old account
        if (editingTransaction.account_name) {
          await updateAccountBalance(
            editingTransaction.account_name,
            editingTransaction.amount,
            editingTransaction.transaction_type === 'debit' ? 'credit' : 'debit'
          );
        }

        // Apply the new transaction's effect on the new account
        await updateAccountBalance(
          editTransaction.account_name!,
          editTransaction.amount!,
          editTransaction.transaction_type!
        );
      }

      const selectedCategory = categories.find(c => c.id === editTransaction.category_id);
      
      const updates: Partial<StoredTransaction> = {
        transaction_type: editTransaction.transaction_type || 'expense',
        amount: editTransaction.amount || 0,
        description: editTransaction.description || '',
        category_id: editTransaction.category_id || '',
        transaction_date: editTransaction.transaction_date || format(new Date(), 'yyyy-MM-dd'),
        payment_method: editTransaction.payment_method || 'cash',
        account_name: editTransaction.account_name || '',
        notes: editTransaction.notes || ''
      };

      const result = await updateStoredTransaction(editingTransaction.id, updates);

      if (!result) {
        toast({
          title: "Error",
          description: "Failed to update transaction",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Transaction updated successfully and account balances updated!",
      });

      // Reset form and close dialog
      setEditingTransaction(null);
      setEditTransaction({
        transaction_type: 'debit',
        amount: 0,
        description: '',
        category_id: '',
        transaction_date: format(new Date(), 'yyyy-MM-dd'),
        payment_method: 'cash',
        account_name: '',
        notes: ''
      });
      setShowEditTransaction(false);

      // Refresh both transactions and accounts
      await fetchRecentTransactions();
      await fetchAccounts();
      
      // Refresh data to update sidebar statistics
      refreshData();
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
      // Find the transaction to get its details for balance reversal
      const transactionToDelete = recentTransactions.find(t => t.id === transactionId);
      
      if (transactionToDelete && transactionToDelete.account_name) {
        // Reverse the transaction's effect on the account balance
        await updateAccountBalance(
          transactionToDelete.account_name,
          transactionToDelete.amount,
          transactionToDelete.transaction_type === 'debit' ? 'credit' : 'debit'
        );
      }

      const result = await deleteStoredTransaction(transactionId);
      
      if (!result) {
        toast({
          title: "Error",
          description: "Failed to delete transaction",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Transaction Deleted",
        description: `Transaction "${description}" has been deleted and account balance updated.`,
      });
      
      // Refresh both transactions and accounts
      await fetchRecentTransactions();
      await fetchAccounts();
      
      // Refresh data to update sidebar statistics
      refreshData();
      
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
      if (transaction.transaction_type === 'credit') {
        return c.name.toLowerCase().includes('income') || 
               c.name.toLowerCase().includes('salary') || 
               c.name.toLowerCase().includes('freelance') ||
               c.name.toLowerCase().includes('investment') ||
               c.name.toLowerCase().includes('credit');
      } else {
        return !c.name.toLowerCase().includes('income') && 
               !c.name.toLowerCase().includes('salary') && 
               !c.name.toLowerCase().includes('freelance') &&
               !c.name.toLowerCase().includes('investment') &&
               !c.name.toLowerCase().includes('credit');
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
                    variant={transaction.transaction_type === 'debit' ? 'default' : 'outline'}
                    onClick={() => setTransaction({...transaction, transaction_type: 'debit', category_id: ''})}
                    className="flex-1"
                  >
                    <TrendingDown className="h-4 w-4 mr-2" />
                    Debit
                  </Button>
                  <Button
                    variant={transaction.transaction_type === 'credit' ? 'default' : 'outline'}
                    onClick={() => setTransaction({...transaction, transaction_type: 'credit', category_id: ''})}
                    className="flex-1"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Credit
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
                    onChange={(e) => {
                      const amount = parseFloat(e.target.value) || 0;
                      setTransaction({...transaction, amount});
                      
                      // Check balance for cash transactions
                      if (transaction.payment_method === 'cash' && transaction.transaction_type === 'debit' && transaction.account_name) {
                        const cashAccount = accounts.find(a => a.name === transaction.account_name);
                        setInsufficientBalance(cashAccount ? cashAccount.balance < amount : false);
                      }
                    }}
                    placeholder="Enter amount"
                    className={`text-xl font-semibold ${insufficientBalance ? 'border-red-300' : ''}`}
                  />
                  <div className="flex space-x-2">
                    {quickAmounts.map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setTransaction({...transaction, amount});
                          
                          // Check balance for cash transactions
                          if (transaction.payment_method === 'cash' && transaction.transaction_type === 'debit' && transaction.account_name) {
                            const cashAccount = accounts.find(a => a.name === transaction.account_name);
                            setInsufficientBalance(cashAccount ? cashAccount.balance < amount : false);
                          }
                        }}
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
                      onClick={() => setTransaction({...transaction, payment_method: method.id, account_name: ''})}
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
                  <SelectTrigger className={insufficientBalance ? 'border-red-300' : ''}>
                    <SelectValue placeholder="Account will be auto-selected" />
                  </SelectTrigger>
                  <SelectContent>
                    {getEligibleAccounts(transaction.payment_method || '').length > 0 ? (
                      getEligibleAccounts(transaction.payment_method || '').map((account) => (
                        <SelectItem key={account.id} value={account.name}>
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                            <span>{account.name}</span>
                            <span className={`text-xs ${
                              transaction.payment_method === 'cash' && 
                              transaction.transaction_type === 'debit' && 
                              account.balance < (transaction.amount || 0)
                                ? 'text-red-500' 
                                : 'text-gray-500'
                            }`}>
                              ({account.type} • ₹{account.balance.toLocaleString()})
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-accounts" disabled>
                        {transaction.payment_method === 'cash' 
                          ? 'No cash account available. Please add a cash account first.'
                          : transaction.payment_method === 'credit_card'
                          ? 'No credit card account available. Please add a credit card account first.'
                          : transaction.payment_method === 'loan_payment'
                          ? 'No loan account available. Please add a loan account first.'
                          : (transaction.payment_method === 'debit_card' || transaction.payment_method === 'upi' || transaction.payment_method === 'bank_transfer')
                          ? 'No bank account available. Please add a savings/checking account first.'
                          : 'No eligible accounts available. Please add an account first.'
                        }
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {noCashAccount && transaction.payment_method === 'cash' && (
                  <div className="text-sm text-orange-600 mt-1 p-2 bg-orange-50 rounded">
                    <p>💡 No cash account found. <Link to="/accounts" className="underline font-medium">Add a cash account</Link> to track cash transactions.</p>
                  </div>
                )}
                {noCreditCardAccount && transaction.payment_method === 'credit_card' && (
                  <div className="text-sm text-orange-600 mt-1 p-2 bg-orange-50 rounded">
                    <p>💳 No credit card account found. <Link to="/accounts" className="underline font-medium">Add a credit card account</Link> to track credit card transactions.</p>
                  </div>
                )}
                {noLoanAccount && transaction.payment_method === 'loan_payment' && (
                  <div className="text-sm text-orange-600 mt-1 p-2 bg-orange-50 rounded">
                    <p>🏦 No loan account found. <Link to="/accounts" className="underline font-medium">Add a loan account</Link> to track loan payments.</p>
                  </div>
                )}
                {insufficientBalance && (
                  <p className="text-sm text-red-600 mt-1">⚠️ Insufficient balance in selected account</p>
                )}
                {transaction.account_name && !noCashAccount && !noCreditCardAccount && !noLoanAccount && (
                  <p className="text-sm text-green-600 mt-1">✓ Account auto-selected based on payment method</p>
                )}
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
                        <div className={`text-sm font-semibold ${trans.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                          {trans.transaction_type === 'credit' ? '+' : '-'}₹{trans.amount}
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
                  const todayCredits = todayTransactions
                    .filter(t => t.transaction_type === 'credit')
                    .reduce((sum, t) => sum + t.amount, 0);
                  const todayDebitss = todayTransactions
                    .filter(t => t.transaction_type === 'debit')
                    .reduce((sum, t) => sum + t.amount, 0);
                  const net = todayCredits - todayDebitss;

                  return (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Credits</span>
                        <span className="font-medium text-green-600">₹{todayCredits.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Debitss</span>
                        <span className="font-medium text-red-600">₹{todayDebitss.toLocaleString()}</span>
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
                  variant={editTransaction.transaction_type === 'debit' ? 'default' : 'outline'}
                  onClick={() => setEditTransaction({...editTransaction, transaction_type: 'debit', category_id: ''})}
                  className="flex-1"
                >
                  <TrendingDown className="h-4 w-4 mr-2" />
                  Debit
                </Button>
                <Button
                  variant={editTransaction.transaction_type === 'credit' ? 'default' : 'outline'}
                  onClick={() => setEditTransaction({...editTransaction, transaction_type: 'credit', category_id: ''})}
                  className="flex-1"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Credit
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
                    if (editTransaction.transaction_type === 'credit') {
                      return c.name.toLowerCase().includes('income') || 
                             c.name.toLowerCase().includes('salary') || 
                             c.name.toLowerCase().includes('freelance') ||
                             c.name.toLowerCase().includes('investment') ||
                             c.name.toLowerCase().includes('credit');
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
                    onClick={() => setEditTransaction({...editTransaction, payment_method: method.id, account_name: ''})}
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
                  {getEligibleAccounts(editTransaction.payment_method || '').length > 0 ? (
                    getEligibleAccounts(editTransaction.payment_method || '').map((account) => (
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
                      {editTransaction.payment_method === 'cash' 
                        ? 'No cash account available. Please add a cash account first.'
                        : editTransaction.payment_method === 'credit_card'
                        ? 'No credit card account available. Please add a credit card account first.'
                        : editTransaction.payment_method === 'loan_payment'
                        ? 'No loan account available. Please add a loan account first.'
                        : (editTransaction.payment_method === 'debit_card' || editTransaction.payment_method === 'upi' || editTransaction.payment_method === 'bank_transfer')
                        ? 'No bank account available. Please add a savings/checking account first.'
                        : 'No eligible accounts available. Please add an account first.'
                      }
                    </SelectItem>
                  )}
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