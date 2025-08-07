import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Mail,
  Calendar,
  Shield,
  Users,
  Activity,
  BarChart3,
  Settings,
  LogOut,
  Copy,
  CheckCircle,
  AlertCircle,
  Crown,
  UserPlus,
  Database,
  Download,
  Trash2,
  Link,
  Unlink,
  Inbox,
  RefreshCw,
  AlertTriangle,
  Plus,
  Clock
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  getPersonalTransactions, 
  getGroupTransactions,
  clearAllStoredData
} from '@/utils/storageService';
import {
  getUserMappings,
  getStoredGroups,
  getGroupMemberships,
  type UserMapping,
  type StoredGroup,
  type GroupMembership
} from '@/utils/dataStorage';
import { useGmailOAuth } from '@/hooks/useGmailOAuth';
import CreditReportUpload from '@/components/CreditReportUpload';
import { creditReportParser, type CreditReportAccount } from '@/services/creditReportParser';
import { supabase } from '@/integrations/supabase/client';

const Profile = () => {
  const { user, userGroups, isPersonalMode, currentGroup, deleteGroup } = useApp();
  const { toast } = useToast();
  
  // Safe date formatting helper
  const safeFormatDate = (date: string | null | undefined, formatStr: string, fallback: string = 'Unknown') => {
    if (!date) return fallback;
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return fallback;
      return format(dateObj, formatStr);
    } catch (error) {
      console.error('Date formatting error:', error);
      return fallback;
    }
  };
  
  const [userMappings, setUserMappings] = useState<UserMapping[]>([]);
  const [groupMemberships, setGroupMemberships] = useState<GroupMembership[]>([]);
  const [stats, setStats] = useState({
    personalTransactions: 0,
    groupTransactions: 0,
    totalAmount: 0,
    groupsOwned: 0,
    groupsJoined: 0,
    parsedTransactions: 0,
    discoveredAccounts: 0,
    recentActivity: 0
  });

  // Gmail OAuth integration
  const {
    connectedEmails,
    unprocessedAccounts,
    isLoading,
    isProcessingEmails,
    connectGmail,
    disconnectEmail,
    syncEmails,
    reprocessData,
    resetSyncTime,
    processAccount,
    addCreditReportAccounts,
    getDiscoveredAccounts
  } = useGmailOAuth();

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    if (!user) return;

    try {
      // Get user mappings (still from localStorage for now)
      const mappings = getUserMappings();
      setUserMappings(mappings);

      // Get group memberships (still from localStorage for now)
      const memberships = getGroupMemberships();
      const userMemberships = memberships.filter(m => m.user_id === user.id);
      setGroupMemberships(userMemberships);

      // Calculate stats using unified storage service (works with Supabase)
      const personalTxns = await getPersonalTransactions(user.id, user.email);
      const allGroupTxns = await Promise.all(
        userGroups.map(group => getGroupTransactions(group.id))
      ).then(results => results.flat());
      
      // Calculate net balance using actual account balances instead of transaction flows
      // Net Balance = Bank accounts + Savings + Checking + Wallets - Credit Card balances
      let netBalance = 0;
      try {
        // Get balances from main accounts table
        const { data: accounts, error: accountsError } = await supabase
          .from('accounts')
          .select('account_type, balance')
          .eq('user_id', user.id)
          .eq('is_active', true);
        
        if (!accountsError && accounts) {
          netBalance = accounts.reduce((sum, account) => {
            const balance = parseFloat(account.balance) || 0;
            // Add positive balances for asset accounts, subtract credit card balances (debt)
            if (['bank', 'savings', 'checking', 'wallet', 'cash', 'investment'].includes(account.account_type)) {
              return sum + balance;
            } else if (account.account_type === 'credit_card') {
              return sum - balance; // Credit card balance is debt, so subtract it
            }
            return sum; // For other account types like loans, don't include in net balance
          }, 0);
        }

        // Also include approved discovered accounts with known balances
        const { data: discoveredAccs, error: discoveredError } = await supabase
          .from('discovered_accounts')
          .select('account_type, current_balance')
          .eq('user_id', user.id)
          .eq('status', 'approved')
          .not('current_balance', 'is', null);
        
        if (!discoveredError && discoveredAccs) {
          const discoveredBalance = discoveredAccs.reduce((sum, account) => {
            const balance = parseFloat(account.current_balance) || 0;
            if (['bank', 'savings', 'checking', 'wallet', 'cash'].includes(account.account_type)) {
              return sum + balance;
            } else if (account.account_type === 'credit_card') {
              return sum - balance; // Credit card balance is debt
            }
            return sum;
          }, 0);
          netBalance += discoveredBalance;
        }
      } catch (error) {
        console.error('Error calculating net balance from accounts:', error);
        // Fallback to old transaction-based calculation if accounts query fails
        const personalAmount = personalTxns.reduce((sum, t) => {
          return sum + (t.transaction_type === 'income' ? t.amount : -t.amount);
        }, 0);
        
        const groupAmount = allGroupTxns.reduce((sum, t) => {
          return sum + (t.transaction_type === 'income' ? t.amount : -t.amount);
        }, 0);
        
        netBalance = personalAmount + groupAmount;
      }

      const groupsOwned = userGroups.filter(g => g.owner_id === user.id).length;
      const groupsJoined = userGroups.filter(g => g.owner_id !== user.id).length;

      // Get additional activity data from Supabase
      let parsedTransactions = 0;
      let discoveredAccounts = 0;
      let recentActivity = 0;

      try {
        // Get parsed transactions count
        const { data: parsedTx, error: txError } = await supabase
          .from('parsed_transactions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);
        
        if (!txError) {
          parsedTransactions = parsedTx || 0;
        }

        // Get discovered accounts count
        const { data: discoveredAcc, error: accError } = await supabase
          .from('discovered_accounts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);
        
        if (!accError) {
          discoveredAccounts = discoveredAcc || 0;
        }

        // Recent activity: transactions + parsed transactions from last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { data: recentParsed, error: recentError } = await supabase
          .from('parsed_transactions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', sevenDaysAgo.toISOString());
        
        if (!recentError) {
          recentActivity = (recentParsed || 0) + personalTxns.filter(t => {
            const txDate = new Date(t.transaction_date || t.created_at || 0);
            return txDate >= sevenDaysAgo;
          }).length;
        }

      } catch (error) {
        console.error('Error fetching activity data:', error);
      }

      setStats({
        personalTransactions: personalTxns.length,
        groupTransactions: allGroupTxns.length,
        totalAmount: netBalance,
        groupsOwned,
        groupsJoined,
        parsedTransactions,
        discoveredAccounts,
        recentActivity
      });
    } catch (error) {
      console.error('Error fetching profile data:', error);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const handleDeleteGroup = async (group: any) => {
    if (window.confirm(`Are you sure you want to delete the group "${group.name}"? This action cannot be undone and will affect all group members.`)) {
      await deleteGroup(group.id);
    }
  };

  const exportData = async () => {
    try {
      const personalTxns = await getPersonalTransactions(user.id, user.email);
      const allGroupTxns = await Promise.all(
        userGroups.map(group => getGroupTransactions(group.id))
      ).then(results => results.flat());
    
      const data = {
        user: {
          id: user.id,
          email: user.email,
          exportDate: new Date().toISOString()
        },
        personalTransactions: personalTxns,
        groupTransactions: allGroupTxns,
        groups: userGroups,
        userMappings: userMappings,
        stats: stats
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pocket-tracker-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Data exported successfully",
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      });
    }
  };

  const clearAllData = async () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      try {
        await clearAllStoredData();
        toast({
          title: "Data Cleared",
          description: "All stored data has been cleared",
          variant: "destructive",
        });
        // Reload page to reset state
        window.location.reload();
      } catch (error) {
        console.error('Error clearing data:', error);
        toast({
          title: "Error",
          description: "Failed to clear all data",
          variant: "destructive",
        });
      }
    }
  };

  // Email authentication functions
  const connectEmail = (provider: 'gmail' | 'outlook' | 'yahoo') => {
    if (provider === 'gmail') {
      connectGmail();
    } else {
      toast({
        title: "Coming Soon",
        description: `${provider} integration will be available soon`,
      });
    }
  };

  // Handle credit report account extraction
  const handleCreditReportAccounts = async (accounts: CreditReportAccount[]) => {
    if (!user) return;

    try {
      // Convert credit report accounts to the format expected by the service
      const accountsToAdd = accounts.map(account => ({
        bank_name: account.bankName,
        account_type: account.accountType,
        account_number_partial: account.accountNumber.slice(-4),
        balance: account.balance,
        credit_limit: account.creditLimit,
        open_date: account.openDate,
        confidence_score: account.confidenceScore,
        raw_data: account.rawText
      }));

      await addCreditReportAccounts(accountsToAdd);
    } catch (error) {
      console.error('Error handling credit report accounts:', error);
      toast({
        title: "Error",
        description: "Failed to add credit report accounts",
        variant: "destructive",
      });
    }
  };


  if (!user) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">Please log in to view your profile.</div>
      </div>
    );
  }

  const userInitials = user.email?.slice(0, 2).toUpperCase() || 'U';
  const memberSince = new Date(user.created_at || Date.now());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your account and view your activity
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{userInitials}</span>
              </div>
            </div>
            <CardTitle className="text-xl">{user.email}</CardTitle>
            <p className="text-sm text-gray-500">
              Member since {format(memberSince, 'MMM yyyy')}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Mail className="h-5 w-5 text-gray-500" />
              <div className="flex-1">
                <div className="text-sm font-medium">Email</div>
                <div className="text-xs text-gray-500">{user.email}</div>
              </div>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => copyToClipboard(user.email, 'Email')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Shield className="h-5 w-5 text-gray-500" />
              <div className="flex-1">
                <div className="text-sm font-medium">User ID</div>
                <div className="text-xs text-gray-500 font-mono">{user.id.slice(0, 12)}...</div>
              </div>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => copyToClipboard(user.id, 'User ID')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Activity className="h-5 w-5 text-gray-500" />
              <div className="flex-1">
                <div className="text-sm font-medium">Current Mode</div>
                <div className="text-xs text-gray-500">
                  {isPersonalMode ? 'Personal' : `Group: ${currentGroup?.name}`}
                </div>
              </div>
              <Badge variant={isPersonalMode ? 'outline' : 'default'}>
                {isPersonalMode ? 'Personal' : 'Group'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Stats & Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Activity Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.personalTransactions}</div>
                <div className="text-xs text-blue-600">Personal Transactions</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.groupTransactions}</div>
                <div className="text-xs text-green-600">Group Transactions</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className={`text-2xl font-bold ${stats.totalAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{stats.totalAmount.toLocaleString()}
                </div>
                <div className="text-xs text-purple-600">Net Balance</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{stats.groupsOwned}</div>
                <div className="text-xs text-yellow-600">Groups Owned</div>
              </div>
              <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">{stats.groupsJoined}</div>
                <div className="text-xs text-indigo-600">Groups Joined</div>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{stats.parsedTransactions}</div>
                <div className="text-xs text-orange-600">Email Transactions</div>
              </div>
              <div className="text-center p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                <div className="text-2xl font-bold text-teal-600">{stats.discoveredAccounts}</div>
                <div className="text-xs text-teal-600">Discovered Accounts</div>
              </div>
              <div className="text-center p-4 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                <div className="text-2xl font-bold text-rose-600">{stats.recentActivity}</div>
                <div className="text-xs text-rose-600">Recent Activity (7d)</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{userMappings.length}</div>
                <div className="text-xs text-gray-600">Email Mappings</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="email-auth" className="space-y-4">
        <TabsList>
          <TabsTrigger value="email-auth">Email Integration</TabsTrigger>
          <TabsTrigger value="unprocessed">Unprocessed Accounts</TabsTrigger>
          <TabsTrigger value="credit-report">Import Credit Report</TabsTrigger>
          <TabsTrigger value="groups">My Groups</TabsTrigger>
          <TabsTrigger value="mappings">Email Mappings</TabsTrigger>
          <TabsTrigger value="data">Data Management</TabsTrigger>
        </TabsList>

        <TabsContent value="email-auth" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Connected Email Accounts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Inbox className="h-5 w-5 mr-2" />
                  Connected Email Accounts ({connectedEmails.length})
                </CardTitle>
                <p className="text-sm text-gray-500">
                  Manage your connected email accounts for automatic transaction processing
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {connectedEmails.length > 0 ? (
                  connectedEmails.map((email) => (
                    <div key={email.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            email.provider === 'gmail' ? 'bg-red-100 text-red-600' :
                            email.provider === 'outlook' ? 'bg-blue-100 text-blue-600' :
                            'bg-purple-100 text-purple-600'
                          }`}>
                            <Mail className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-medium">{email.email}</div>
                            <div className="text-sm text-gray-500 capitalize">
                              {email.provider} • Connected {safeFormatDate(email.created_at, 'MMM dd')}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={email.status === 'connected' ? 'default' : 'secondary'}>
                            {email.status}
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => disconnectEmail(email.id)}
                          >
                            <Unlink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-gray-500">Last Sync</div>
                          <div className="font-medium">
                            {safeFormatDate(email.last_sync, 'MMM dd, HH:mm')}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">Transactions</div>
                          <div className="font-medium">{email.transactions_processed}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Accounts Found</div>
                          <div className="font-medium">{email.accounts_discovered}</div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No email accounts connected</p>
                    <p className="text-sm">Connect your email to start automatic transaction processing</p>
                  </div>
                )}

                <div className="flex space-x-2 pt-4 border-t">
                  <Button 
                    onClick={syncEmails} 
                    disabled={isProcessingEmails || connectedEmails.length === 0}
                    className="flex-1"
                  >
                    {isProcessingEmails ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Sync Emails
                  </Button>
                  <Button 
                    onClick={reprocessData} 
                    disabled={isProcessingEmails}
                    variant="outline"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reprocess
                  </Button>
                  <Button 
                    onClick={resetSyncTime} 
                    disabled={isProcessingEmails}
                    variant="outline"
                    size="sm"
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    Reset Sync
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Add New Email Connection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="h-5 w-5 mr-2" />
                  Connect New Email Account
                </CardTitle>
                <p className="text-sm text-gray-500">
                  Add email accounts to automatically process transaction notifications
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    We only read transaction-related emails and never access personal messages. All data is encrypted and stored securely.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <Button 
                    onClick={() => connectEmail('gmail')} 
                    variant="outline" 
                    className="w-full h-16 flex items-center justify-center space-x-3"
                  >
                    <div className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Connect Gmail</div>
                      <div className="text-sm text-gray-500">Most popular email service</div>
                    </div>
                  </Button>

                  <Button 
                    onClick={() => connectEmail('outlook')} 
                    variant="outline" 
                    className="w-full h-16 flex items-center justify-center space-x-3"
                  >
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Connect Outlook</div>
                      <div className="text-sm text-gray-500">Microsoft email service</div>
                    </div>
                  </Button>

                  <Button 
                    onClick={() => connectEmail('yahoo')} 
                    variant="outline" 
                    className="w-full h-16 flex items-center justify-center space-x-3"
                  >
                    <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Connect Yahoo Mail</div>
                      <div className="text-sm text-gray-500">Yahoo email service</div>
                    </div>
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">What we can process:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Bank transaction notifications</li>
                    <li>• Credit card statements and alerts</li>
                    <li>• UPI payment confirmations</li>
                    <li>• EMI and loan payment receipts</li>
                    <li>• Investment transaction confirmations</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="unprocessed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Unprocessed Accounts ({unprocessedAccounts.length})
              </CardTitle>
              <p className="text-sm text-gray-500">
                These accounts were discovered from your emails and credit reports but need manual review before adding
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {unprocessedAccounts.length > 0 ? (
                  unprocessedAccounts.map((account) => (
                    <div key={account.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-medium">{account.bank_name} ****{account.account_number_partial}</div>
                          <div className="text-sm text-gray-500">
                            Discovered from {account.email || 'Unknown'} • {safeFormatDate(account.created_at, 'MMM dd, yyyy')}
                          </div>
                        </div>
                        <Badge variant="outline">
                          {Math.round(account.confidence_score * 100)}% confidence
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                        <div>
                          <div className="text-gray-500">Bank</div>
                          <div className="font-medium">{account.bank_name}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Type</div>
                          <div className="font-medium capitalize">{account.account_type}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Balance</div>
                          <div className="font-medium">₹{account.current_balance?.toLocaleString() || 'Unknown'}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Status</div>
                          <div className="font-medium text-yellow-600">Needs Review</div>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          onClick={() => processAccount(account.id, 'approve')}
                          className="flex-1"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Add Account
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => processAccount(account.id, 'reject')}
                          className="flex-1"
                        >
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-300" />
                    <p className="text-lg font-medium">All caught up!</p>
                    <p className="text-sm">No unprocessed accounts found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credit-report" className="space-y-4">
          <CreditReportUpload 
            onAccountsExtracted={handleCreditReportAccounts}
            isUploading={isLoading}
          />
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Groups ({userGroups.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userGroups.length > 0 ? (
                  userGroups.map((group) => {
                    const membership = groupMemberships.find(m => m.group_id === group.id);
                    const isOwner = group.owner_id === user.id;
                    
                    return (
                      <div key={group.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                            {isOwner ? (
                              <Crown className="h-5 w-5 text-white" />
                            ) : (
                              <Users className="h-5 w-5 text-white" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{group.name}</div>
                            <div className="text-sm text-gray-500">
                              {group.description || 'No description'}
                            </div>
                            <div className="text-xs text-gray-400">
                              Created {safeFormatDate(group.created_at, 'MMM dd, yyyy')}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge variant={isOwner ? 'default' : 'secondary'}>
                            {isOwner ? 'Owner' : 'Member'}
                          </Badge>
                          <div className="text-right">
                            <div className="text-sm font-medium">Code: {group.group_code}</div>
                            <div className="flex items-center gap-1">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => copyToClipboard(group.group_code, 'Group Code')}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              {isOwner && (
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleDeleteGroup(group)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No groups yet</p>
                    <p className="text-sm">Create or join a group to start collaborating</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mappings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Mappings ({userMappings.length})</CardTitle>
              <p className="text-sm text-gray-500">
                These are email addresses mapped to user IDs for imported transactions
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userMappings.length > 0 ? (
                  userMappings.map((mapping) => (
                    <div key={mapping.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium">{mapping.name || mapping.email.split('@')[0]}</div>
                          <div className="text-sm text-gray-500">{mapping.email}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-400 font-mono">
                          {mapping.user_id.slice(0, 16)}...
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => copyToClipboard(mapping.user_id, 'User ID')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No email mappings</p>
                    <p className="text-sm">Import group data to create email mappings</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Data Management
              </CardTitle>
              <p className="text-sm text-gray-500">
                Export your data or clear all stored information
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  All data is stored locally in your browser. Export regularly to avoid data loss.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={exportData} className="h-20 flex flex-col space-y-2">
                  <Download className="h-6 w-6" />
                  <span>Export All Data</span>
                  <span className="text-xs opacity-75">Download JSON backup</span>
                </Button>

                <Button 
                  variant="destructive" 
                  onClick={clearAllData}
                  className="h-20 flex flex-col space-y-2"
                >
                  <Trash2 className="h-6 w-6" />
                  <span>Clear All Data</span>
                  <span className="text-xs opacity-75">Cannot be undone</span>
                </Button>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Storage Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Personal Transactions:</span>
                    <span className="ml-2 font-medium">{stats.personalTransactions}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Group Transactions:</span>
                    <span className="ml-2 font-medium">{stats.groupTransactions}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Groups:</span>
                    <span className="ml-2 font-medium">{userGroups.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Email Mappings:</span>
                    <span className="ml-2 font-medium">{userMappings.length}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;