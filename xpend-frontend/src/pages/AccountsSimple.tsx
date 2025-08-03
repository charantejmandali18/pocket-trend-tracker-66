import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  Home,
  Car
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { accountService, Account, AccountCreateRequest } from '@/services/accountService';

const AccountsSimple = () => {
  const { toast } = useToast();
  const user = { id: 1 }; // Mock user
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [newAccount, setNewAccount] = useState<AccountCreateRequest>({
    name: '',
    type: 'SAVINGS',
    bankName: '',
    accountNumber: '',
    balance: 0,
    creditLimit: 0,
    interestRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      console.log('Fetching accounts from backend...');
      const backendAccounts = await accountService.getAllAccounts();
      console.log('Backend accounts:', backendAccounts);
      setAccounts(backendAccounts);
    } catch (error) {
      console.warn('Failed to fetch accounts from backend, using mock data:', error);
      // Fallback to mock accounts
      const mockAccounts: Account[] = [
        { 
          id: '1', 
          userId: 1,
          groupId: null,
          name: 'Main Checking Account', 
          type: 'CHECKING',
          bankName: 'HDFC Bank',
          accountNumber: '****1234',
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
          accountNumber: '****5678',
          balance: 75000, 
          interestRate: 4.5,
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
          accountNumber: '****9012',
          balance: 8500, 
          creditLimit: 100000,
          interestRate: 24.0,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      setAccounts(mockAccounts);
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
      const account = await accountService.createAccount(newAccount);
      console.log('Account added:', account);

      setAccounts(prev => [...prev, account]);
      setNewAccount({
        name: '',
        type: 'SAVINGS',
        bankName: '',
        accountNumber: '',
        balance: 0,
        creditLimit: 0,
        interestRate: 0
      });
      setShowAddAccount(false);
      
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
      const updated = await accountService.updateAccount(editingAccount.id, {
        name: editingAccount.name,
        bankName: editingAccount.bankName,
        accountNumber: editingAccount.accountNumber,
        balance: editingAccount.balance,
        creditLimit: editingAccount.creditLimit,
        interestRate: editingAccount.interestRate,
        isActive: editingAccount.isActive
      });
      
      setAccounts(prev => prev.map(a => a.id === updated.id ? updated : a));
      setEditingAccount(null);
      
      toast({
        title: "Success",
        description: "Account updated successfully",
      });
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
    if (!confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
      return;
    }

    try {
      await accountService.deleteAccount(accountId);
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

  const getAccountTypeIcon = (type: Account['type']) => {
    switch (type) {
      case 'SAVINGS':
      case 'CHECKING':
        return Building;
      case 'CREDIT_CARD':
        return CreditCard;
      case 'INVESTMENT':
        return TrendingUp;
      case 'CASH':
        return Wallet;
      case 'REAL_ESTATE':
        return Home;
      case 'VEHICLE':
        return Car;
      case 'LOAN':
        return CreditCard;
      default:
        return DollarSign;
    }
  };

  const getAccountTypeColor = (type: Account['type']) => {
    switch (type) {
      case 'SAVINGS': return 'text-green-600';
      case 'CHECKING': return 'text-blue-600';
      case 'CREDIT_CARD': return 'text-red-600';
      case 'LOAN': return 'text-orange-600';
      case 'INVESTMENT': return 'text-purple-600';
      case 'CASH': return 'text-gray-600';
      case 'REAL_ESTATE': return 'text-emerald-600';
      case 'VEHICLE': return 'text-indigo-600';
      default: return 'text-gray-600';
    }
  };

  const accountTypes = [
    { value: 'SAVINGS', label: 'Savings Account' },
    { value: 'CHECKING', label: 'Checking Account' },
    { value: 'CREDIT_CARD', label: 'Credit Card' },
    { value: 'LOAN', label: 'Loan' },
    { value: 'INVESTMENT', label: 'Investment Account' },
    { value: 'CASH', label: 'Cash' },
    { value: 'REAL_ESTATE', label: 'Real Estate' },
    { value: 'VEHICLE', label: 'Vehicle' },
    { value: 'OTHER', label: 'Other' }
  ];

  const getTotalBalance = () => {
    return accounts.reduce((sum, account) => {
      if (account.type === 'CREDIT_CARD' || account.type === 'LOAN') {
        return sum - account.balance; // Negative for debts
      }
      return sum + account.balance;
    }, 0);
  };

  const getTotalAssets = () => {
    return accounts
      .filter(a => !['CREDIT_CARD', 'LOAN'].includes(a.type))
      .reduce((sum, a) => sum + a.balance, 0);
  };

  const getTotalLiabilities = () => {
    return accounts
      .filter(a => ['CREDIT_CARD', 'LOAN'].includes(a.type))
      .reduce((sum, a) => sum + a.balance, 0);
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
                <Select value={newAccount.type} onValueChange={(value) => setNewAccount({ ...newAccount, type: value as Account['type'] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accountTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
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
                  value={newAccount.bankName || ''}
                  onChange={(e) => setNewAccount({ ...newAccount, bankName: e.target.value })}
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
              {newAccount.type === 'CREDIT_CARD' && (
                <div>
                  <Label htmlFor="credit_limit">Credit Limit (₹)</Label>
                  <Input
                    id="credit_limit"
                    type="number"
                    value={newAccount.creditLimit || 0}
                    onChange={(e) => setNewAccount({ ...newAccount, creditLimit: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              )}
              <Button onClick={handleAddAccount} className="w-full">
                Add Account
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      </div>

      {/* Accounts List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Accounts ({accounts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {accounts.length > 0 ? (
              accounts.map((account) => {
                const IconComponent = getAccountTypeIcon(account.type);
                const colorClass = getAccountTypeColor(account.type);
                
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
                            {accountTypes.find(t => t.value === account.type)?.label}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500 space-x-4">
                          {account.bankName && (
                            <span className="flex items-center">
                              <Building className="h-3 w-3 mr-1" />
                              {account.bankName}
                            </span>
                          )}
                          {account.accountNumber && (
                            <span>••••{account.accountNumber.slice(-4)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <div className={`text-lg font-semibold ${['CREDIT_CARD', 'LOAN'].includes(account.type) ? 'text-red-600' : 'text-green-600'}`}>
                          {['CREDIT_CARD', 'LOAN'].includes(account.type) ? '-' : '+'}₹{account.balance.toLocaleString()}
                        </div>
                        {account.type === 'CREDIT_CARD' && account.creditLimit && (
                          <div className="text-xs text-gray-500">
                            Limit: ₹{account.creditLimit.toLocaleString()}
                          </div>
                        )}
                        {account.interestRate && (
                          <div className="text-xs text-gray-500">
                            {account.interestRate}% APR
                          </div>
                        )}
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
              {editingAccount.type === 'CREDIT_CARD' && (
                <div>
                  <Label htmlFor="edit-credit-limit">Credit Limit (₹)</Label>
                  <Input
                    id="edit-credit-limit"
                    type="number"
                    value={editingAccount.creditLimit || 0}
                    onChange={(e) => setEditingAccount({ ...editingAccount, creditLimit: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              )}
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

export default AccountsSimple;