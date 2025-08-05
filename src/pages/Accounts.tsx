import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Wallet, 
  CreditCard,
  Building,
  Plus,
  Edit2,
  Trash2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Target,
  Calendar,
  Percent,
  Home,
  Car,
  Users
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { getStoredTransactions } from '@/utils/storageService';
import { supabase } from '@/integrations/supabase/client';

// Account type definition based on Supabase accounts table constraint
interface Account {
  id: string;
  user_id: string;
  group_id?: string;
  name: string;
  account_type: 'bank' | 'credit_card' | 'wallet' | 'investment' | 'other'; // Database constraint values
  bank_name?: string;
  account_number_masked?: string;
  balance: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// UI Account type for form display
interface UIAccountType {
  ui_value: string;
  db_value: Account['account_type'];
  label: string;
  category: string;
}

const Accounts = () => {
  console.log('Accounts component rendering...');
  
  const { user, isPersonalMode, currentGroup, userGroups, dataVersion, refreshData } = useApp();
  const { toast } = useToast();
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [newAccount, setNewAccount] = useState({
    name: '',
    account_type: 'bank' as Account['account_type'], // Use database-allowed type
    ui_type: 'savings', // UI display type
    bank_name: '',
    account_number_masked: '',
    balance: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccounts();
  }, [user, isPersonalMode, currentGroup, dataVersion]);

  const fetchAccounts = async () => {
    if (!user) return;

    try {
      console.log('fetchAccounts called', { user: user.id, isPersonalMode, currentGroup });
      setLoading(true);
      
      let query = supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);
      
      if (isPersonalMode) {
        // Personal mode: get only personal accounts (no group_id)
        query = query.is('group_id', null);
      } else if (currentGroup) {
        // Group mode: get accounts for this specific group
        query = query.eq('group_id', currentGroup.id);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching accounts:', error);
        throw error;
      }
      
      console.log('Fetched accounts:', data?.length || 0);
      setAccounts((data || []) as Account[]);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch accounts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async () => {
    if (!newAccount.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter an account name",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Adding account:', newAccount);
      
      // Map UI type to database type
      const dbAccountType = getDbTypeFromUiType(newAccount.ui_type);
      console.log('Account type mapping:', { uiType: newAccount.ui_type, dbType: dbAccountType });
      
      const { data, error } = await supabase
        .from('accounts')
        .insert({
          user_id: user.id,
          group_id: isPersonalMode ? null : currentGroup?.id,
          name: newAccount.name.trim(),
          account_type: dbAccountType,
          bank_name: newAccount.bank_name.trim() || null,
          account_number_masked: newAccount.account_number_masked.trim() || null,
          balance: newAccount.balance || 0,
          currency: 'INR',
          is_active: true
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error adding account:', error);
        throw error;
      }
      
      console.log('Account added:', data);

      setNewAccount({
        name: '',
        account_type: 'bank',
        ui_type: 'savings',
        bank_name: '',
        account_number_masked: '',
        balance: 0,
      });
      setShowAddAccount(false);
      
      fetchAccounts();
      refreshData();
      
      toast({
        title: "Success",
        description: "Account added successfully",
      });
    } catch (error) {
      console.error('Error adding account:', error);
      toast({
        title: "Error",
        description: "Failed to add account",
        variant: "destructive",
      });
    }
  };

  const handleUpdateAccount = async () => {
    if (!editingAccount) return;

    try {
      const { data, error } = await supabase
        .from('accounts')
        .update({
          name: editingAccount.name,
          bank_name: editingAccount.bank_name,
          account_number_masked: editingAccount.account_number_masked,
          balance: editingAccount.balance,
        })
        .eq('id', editingAccount.id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating account:', error);
        throw error;
      }
      
      if (data) {
        setAccounts(prev => prev.map(a => a.id === data.id ? data as Account : a));
        setEditingAccount(null);
        
        toast({
          title: "Success",
          description: "Account updated successfully",
        });
      }
    } catch (error) {
      console.error('Error updating account:', error);
      toast({
        title: "Error",
        description: "Failed to update account",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from('accounts')
        .update({ is_active: false })
        .eq('id', accountId)
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error deleting account:', error);
        throw error;
      }
      
      setAccounts(prev => prev.filter(a => a.id !== accountId));
      
      toast({
        title: "Success",
        description: "Account deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Error",
        description: "Failed to delete account",
        variant: "destructive",
      });
    }
  };

  // State for storing transactions so we don't need to make async calls in render
  const [allTransactions, setAllTransactions] = useState<any[]>([]);

  // Load transactions when component mounts
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const transactions = await getStoredTransactions();
        setAllTransactions(transactions);
      } catch (error) {
        console.error('Error loading transactions:', error);
      }
    };
    
    if (user) {
      loadTransactions();
    }
  }, [user, dataVersion]);

  const getAccountTransactions = (accountName: string) => {
    return allTransactions.filter(t => 
      t.account_name?.toLowerCase().includes(accountName.toLowerCase()) ||
      t.description.toLowerCase().includes(accountName.toLowerCase())
    );
  };

  const getAccountSpending = (accountName: string) => {
    const transactions = getAccountTransactions(accountName);
    const expenses = transactions
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const income = transactions
      .filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    return { expenses, income, netFlow: income - expenses };
  };

  const getTotalBalance = () => {
    return accounts.reduce((sum, account) => {
      if (account.account_type === 'credit_card' || account.account_type === 'loan') {
        return sum - account.balance; // Negative for debts
      }
      return sum + account.balance;
    }, 0);
  };

  const getTotalAssets = () => {
    return accounts
      .filter(a => !['credit_card', 'loan'].includes(a.account_type))
      .reduce((sum, a) => sum + a.balance, 0);
  };

  const getTotalLiabilities = () => {
    return accounts
      .filter(a => ['credit_card', 'loan'].includes(a.account_type))
      .reduce((sum, a) => sum + a.balance, 0);
  };

  const getCreditUtilization = () => {
    const creditCards = accounts.filter(a => a.account_type === 'credit_card');
    if (creditCards.length === 0) return 0;
    
    const totalUsed = creditCards.reduce((sum, a) => sum + a.balance, 0);
    // For now, assume credit limit is balance * 2 (we'll need to add credit_limit column later)
    const totalLimit = creditCards.reduce((sum, a) => sum + (a.balance * 2), 0);
    
    return totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0;
  };

  const getAccountTypeIcon = (type: Account['account_type']) => {
    // Map database type to UI type for icon selection
    const uiType = getUiTypeFromDbType(type);
    switch (uiType) {
      case 'savings':
      case 'checking':
        return Building;
      case 'credit_card':
        return CreditCard;
      case 'investment':
        return TrendingUp;
      case 'cash':
        return Wallet;
      case 'real_estate':
        return Home;
      case 'vehicle':
        return Car;
      case 'loan':
        return CreditCard;
      default:
        return DollarSign;
    }
  };

  const getAccountTypeColor = (type: Account['account_type']) => {
    // Map database type to UI type for color selection
    const uiType = getUiTypeFromDbType(type);
    switch (uiType) {
      case 'savings': return 'text-green-600';
      case 'checking': return 'text-blue-600';
      case 'credit_card': return 'text-red-600';
      case 'loan': return 'text-orange-600';
      case 'investment': return 'text-purple-600';
      case 'cash': return 'text-gray-600';
      case 'real_estate': return 'text-emerald-600';
      case 'vehicle': return 'text-indigo-600';
      default: return 'text-gray-600';
    }
  };

  // Map UI account types to database-allowed types
  const accountTypes: UIAccountType[] = [
    { ui_value: 'savings', db_value: 'bank', label: 'Savings Account', category: 'bank' },
    { ui_value: 'checking', db_value: 'bank', label: 'Checking Account', category: 'bank' },
    { ui_value: 'credit_card', db_value: 'credit_card', label: 'Credit Card', category: 'liability' },
    { ui_value: 'loan', db_value: 'other', label: 'Loan', category: 'liability' },
    { ui_value: 'investment', db_value: 'investment', label: 'Investment Account', category: 'investment' },
    { ui_value: 'cash', db_value: 'wallet', label: 'Cash/Wallet', category: 'asset' },
    { ui_value: 'real_estate', db_value: 'other', label: 'Real Estate', category: 'asset' },
    { ui_value: 'vehicle', db_value: 'other', label: 'Vehicle', category: 'asset' },
    { ui_value: 'other', db_value: 'other', label: 'Other', category: 'other' }
  ];

  // Helper function to get database type from UI type
  const getDbTypeFromUiType = (uiType: string): Account['account_type'] => {
    const accountType = accountTypes.find(t => t.ui_value === uiType);
    return accountType?.db_value || 'other';
  };

  // Helper function to get UI type from database type (for display)
  const getUiTypeFromDbType = (dbType: Account['account_type']): string => {
    const accountType = accountTypes.find(t => t.db_value === dbType);
    return accountType?.ui_value || 'other';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Accounts</h1>
        </div>
        <div className="text-center py-8">Loading accounts...</div>
      </div>
    );
  }

  const netWorth = getTotalBalance();
  const totalAssets = getTotalAssets();
  const totalLiabilities = getTotalLiabilities();
  const creditUtilization = getCreditUtilization();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Financial Accounts
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your bank accounts, credit cards, loans, and investments
          </p>
        </div>
        <Dialog open={showAddAccount} onOpenChange={setShowAddAccount}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Financial Account</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Account Name</Label>
                <Input
                  id="name"
                  value={newAccount.name}
                  onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                  placeholder="e.g., Main Savings, Credit Card"
                />
              </div>
              <div>
                <Label htmlFor="type">Account Type</Label>
                <Select value={newAccount.ui_type} onValueChange={(value) => setNewAccount({ ...newAccount, ui_type: value, account_type: getDbTypeFromUiType(value) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accountTypes.map((type) => (
                      <SelectItem key={type.ui_value} value={type.ui_value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="bank">Bank/Institution</Label>
                <Input
                  id="bank"
                  value={newAccount.bank_name}
                  onChange={(e) => setNewAccount({ ...newAccount, bank_name: e.target.value })}
                  placeholder="e.g., HDFC Bank, ICICI"
                />
              </div>
              <div>
                <Label htmlFor="balance">Current Balance (₹)</Label>
                <Input
                  id="balance"
                  type="number"
                  value={newAccount.balance}
                  onChange={(e) => setNewAccount({ ...newAccount, balance: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <Button onClick={handleAddAccount} className="w-full">
                Add Account
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Net Worth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {netWorth >= 0 ? '+' : ''}₹{netWorth.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              Assets - Liabilities
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
              Total Assets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{totalAssets.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              Savings + Investments + Cash
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingDown className="h-4 w-4 mr-2 text-red-600" />
              Total Liabilities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ₹{totalLiabilities.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              Credit Cards + Loans
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Percent className="h-4 w-4 mr-2" />
              Credit Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${creditUtilization > 30 ? 'text-red-600' : creditUtilization > 10 ? 'text-yellow-600' : 'text-green-600'}`}>
              {creditUtilization.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">
              Credit used vs limit
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="accounts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="accounts">All Accounts</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4">
          {/* Accounts List */}
          <Card>
            <CardHeader>
              <CardTitle>Your Accounts ({accounts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {accounts.length > 0 ? (
                  accounts.map((account) => {
                    const IconComponent = getAccountTypeIcon(account.account_type);
                    const colorClass = getAccountTypeColor(account.account_type);
                    const { expenses, income, netFlow } = getAccountSpending(account.name);
                    
                    return (
                      <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800`}>
                            <IconComponent className={`h-6 w-6 ${colorClass}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-lg">{account.name}</span>
                              <Badge variant="outline">
                                {accountTypes.find(t => t.db_value === account.account_type)?.label}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-500 space-x-4">
                              {account.bank_name && (
                                <span className="flex items-center">
                                  <Building className="h-3 w-3 mr-1" />
                                  {account.bank_name}
                                </span>
                              )}
                              {account.account_number_masked && (
                                <span>••••{account.account_number_masked.slice(-4)}</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400 mt-1 space-x-4">
                              <span className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                Added {format(new Date(account.created_at), 'MMM dd, yyyy')}
                              </span>
                              {netFlow !== 0 && (
                                <>
                                  <span>•</span>
                                  <span className={netFlow > 0 ? 'text-green-600' : 'text-red-600'}>
                                    {netFlow > 0 ? '+' : ''}₹{netFlow.toLocaleString()} net flow
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-right">
                            <div className={`text-lg font-semibold ${['credit_card', 'loan'].includes(account.account_type) ? 'text-red-600' : 'text-green-600'}`}>
                              {['credit_card', 'loan'].includes(account.account_type) ? '-' : '+'}₹{account.balance.toLocaleString()}
                            </div>
                          </div>
                          <div className="flex space-x-1">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => setEditingAccount(account)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleDeleteAccount(account.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Wallet className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No accounts found</p>
                    <p className="text-sm">Add your first financial account to get started</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setShowAddAccount(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Account
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Account Type Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="h-5 w-5 mr-2" />
                  Account Type Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {accountTypes.map((type) => {
                    const typeAccounts = accounts.filter(a => a.account_type === type.db_value);
                    const typeBalance = typeAccounts.reduce((sum, a) => sum + a.balance, 0);
                    const percentage = totalAssets > 0 ? (typeBalance / totalAssets) * 100 : 0;
                    
                    if (typeAccounts.length === 0) return null;
                    
                    return (
                      <div key={type.ui_value} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{type.label} ({typeAccounts.length})</span>
                          <span className="font-medium">₹{typeBalance.toLocaleString()}</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                        <div className="text-xs text-gray-500 text-right">
                          {percentage.toFixed(1)}% of total
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Credit Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Credit Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Credit Utilization</span>
                    <Badge variant={creditUtilization > 30 ? 'destructive' : creditUtilization > 10 ? 'secondary' : 'default'}>
                      {creditUtilization.toFixed(1)}%
                    </Badge>
                  </div>
                  <Progress value={creditUtilization} className="h-3" />
                  <div className="text-xs text-gray-500">
                    {creditUtilization <= 10 && <span className="text-green-600">Excellent - Keep it under 10%</span>}
                    {creditUtilization > 10 && creditUtilization <= 30 && <span className="text-yellow-600">Good - Try to keep under 10%</span>}
                    {creditUtilization > 30 && <span className="text-red-600">High - Consider paying down balances</span>}
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="text-sm font-medium mb-2">Credit Accounts</div>
                    {accounts.filter(a => a.account_type === 'credit_card').map((card) => (
                      <div key={card.id} className="flex justify-between text-sm py-1">
                        <span>{card.name}</span>
                        <span>₹{card.balance.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Net Worth Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Account Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Total Assets</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">₹{totalAssets.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <TrendingDown className="h-5 w-5 text-red-600" />
                      <span className="font-medium">Total Liabilities</span>
                    </div>
                    <span className="text-lg font-bold text-red-600">₹{totalLiabilities.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Net Worth</span>
                    </div>
                    <span className={`text-xl font-bold ${netWorth >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {netWorth >= 0 ? '+' : ''}₹{netWorth.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Health Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Financial Health Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {creditUtilization > 30 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Your credit utilization is high. Consider paying down credit card balances.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {totalLiabilities > totalAssets && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Your liabilities exceed your assets. Focus on debt reduction.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {accounts.filter(a => getUiTypeFromDbType(a.account_type) === 'savings').length === 0 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Consider opening a savings account for emergency funds.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {accounts.length > 0 && creditUtilization <= 10 && totalAssets > totalLiabilities && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Great job! Your financial health looks good. Keep it up!
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Account Dialog */}
      {editingAccount && (
        <Dialog open={!!editingAccount} onOpenChange={() => setEditingAccount(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Account</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Account Name</Label>
                <Input
                  id="edit-name"
                  value={editingAccount.name}
                  onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-balance">Current Balance (₹)</Label>
                <Input
                  id="edit-balance"
                  type="number"
                  value={editingAccount.balance}
                  onChange={(e) => setEditingAccount({ ...editingAccount, balance: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="edit-bank">Bank/Institution</Label>
                <Input
                  id="edit-bank"
                  value={editingAccount.bank_name || ''}
                  onChange={(e) => setEditingAccount({ ...editingAccount, bank_name: e.target.value })}
                />
              </div>
              <Button onClick={handleUpdateAccount} className="w-full">
                Update Account
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Accounts;