import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarContent, AvatarFallback } from '@/components/ui/avatar';
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
  Trash2
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { emailAuthService, EmailAccount, ExtractionStats } from '@/services/emailAuthService';
import { 
  getPersonalTransactions, 
  getGroupTransactions,
  getUserMappings,
  getStoredGroups,
  getGroupMemberships,
  clearAllStoredData,
  type UserMapping,
  type StoredGroup,
  type GroupMembership
} from '@/utils/dataStorage';

const Profile = () => {
  // Use useMemo to prevent object recreation on every render
  const user = React.useMemo(() => ({ 
    id: 1, 
    email: 'dev@example.com', 
    fullName: 'Development User' 
  }), []); // Mock user
  const userGroups = [];
  const isPersonalMode = true;
  const currentGroup = null;
  const { toast } = useToast();
  
  const [userMappings, setUserMappings] = useState<UserMapping[]>([]);
  const [groupMemberships, setGroupMemberships] = useState<GroupMembership[]>([]);
  const [stats, setStats] = useState({
    personalTransactions: 0,
    groupTransactions: 0,
    totalAmount: 0,
    groupsOwned: 0,
    groupsJoined: 0
  });
  
  // Email authentication states
  const [connectedEmails, setConnectedEmails] = useState<EmailAccount[]>([]);
  const [extractionStats, setExtractionStats] = useState<ExtractionStats | null>(null);
  const [loadingAuth, setLoadingAuth] = useState<string | null>(null);
  const [loadingEmailData, setLoadingEmailData] = useState(false);
  const [oauthTokens, setOauthTokens] = useState<{
    email?: string;
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    provider?: string;
  } | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfileData();
      fetchEmailData();
    }
  }, [user.id]); // Only depend on user.id instead of the whole user object

  // Handle OAuth callback parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const auth = urlParams.get('auth');
    const provider = urlParams.get('provider');
    const email = urlParams.get('email');
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');
    const expiresIn = urlParams.get('expires_in');
    const error = urlParams.get('error');

    if (auth === 'success' && provider === 'gmail' && email && accessToken) {
      setOauthTokens({
        email: decodeURIComponent(email),
        access_token: decodeURIComponent(accessToken),
        refresh_token: refreshToken ? decodeURIComponent(refreshToken) : undefined,
        expires_in: expiresIn ? parseInt(expiresIn) : undefined,
        provider: provider.toUpperCase()
      });
      
      toast({
        title: "OAuth Success!",
        description: `Gmail tokens received for ${decodeURIComponent(email)}`,
      });

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (auth === 'error' && error) {
      toast({
        title: "OAuth Error",
        description: decodeURIComponent(error),
        variant: "destructive"
      });

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast]);

  const fetchProfileData = () => {
    if (!user) return;

    // Get user mappings
    const mappings = getUserMappings();
    setUserMappings(mappings);

    // Get group memberships
    const memberships = getGroupMemberships();
    const userMemberships = memberships.filter(m => m.user_id === user.id);
    setGroupMemberships(userMemberships);

    // Calculate stats
    const personalTxns = getPersonalTransactions(user.id, user.email);
    const allGroupTxns = userGroups.flatMap(group => getGroupTransactions(group.id));
    
    const personalAmount = personalTxns.reduce((sum, t) => {
      return sum + (t.transaction_type === 'income' ? t.amount : -t.amount);
    }, 0);
    
    const groupAmount = allGroupTxns.reduce((sum, t) => {
      return sum + (t.transaction_type === 'income' ? t.amount : -t.amount);
    }, 0);

    const groupsOwned = userGroups.filter(g => g.owner_id === user.id).length;
    const groupsJoined = userGroups.filter(g => g.owner_id !== user.id).length;

    setStats({
      personalTransactions: personalTxns.length,
      groupTransactions: allGroupTxns.length,
      totalAmount: personalAmount + groupAmount,
      groupsOwned,
      groupsJoined
    });
  };

  const fetchEmailData = async () => {
    // Prevent multiple simultaneous calls
    if (loadingEmailData) {
      console.log('Email data fetch already in progress, skipping...');
      return;
    }
    
    setLoadingEmailData(true);
    try {
      const [accounts, stats] = await Promise.all([
        emailAuthService.getConnectedAccounts(),
        emailAuthService.getExtractionStats(),
      ]);
      
      setConnectedEmails(accounts);
      setExtractionStats(stats);
    } catch (error) {
      console.error('Failed to fetch email data:', error);
    } finally {
      setLoadingEmailData(false);
    }
  };

  const handleConnectGmail = async () => {
    setLoadingAuth('GMAIL');
    try {
      const result = await emailAuthService.connectGmail();
      if (result.success) {
        toast({
          title: "Success",
          description: `Gmail account ${result.email} connected successfully`,
        });
        fetchEmailData(); // Refresh data
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to connect Gmail account",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect Gmail account",
        variant: "destructive",
      });
    } finally {
      setLoadingAuth(null);
    }
  };

  const handleConnectOutlook = async () => {
    setLoadingAuth('OUTLOOK');
    try {
      const result = await emailAuthService.connectOutlook();
      if (result.success) {
        toast({
          title: "Success",
          description: `Outlook account ${result.email} connected successfully`,
        });
        fetchEmailData(); // Refresh data
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to connect Outlook account",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect Outlook account",
        variant: "destructive",
      });
    } finally {
      setLoadingAuth(null);
    }
  };

  const handleDisconnectAccount = async (accountId: number, email: string) => {
    try {
      const success = await emailAuthService.disconnectAccount(accountId);
      if (success) {
        toast({
          title: "Success",
          description: `Disconnected ${email} successfully`,
        });
        fetchEmailData(); // Refresh data
      } else {
        toast({
          title: "Error",
          description: "Failed to disconnect account",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to disconnect account",
        variant: "destructive",
      });
    }
  };

  const handleSyncAccount = async (accountId: number) => {
    try {
      const success = await emailAuthService.triggerSync(accountId);
      if (success) {
        toast({
          title: "Success",
          description: "Sync triggered successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to trigger sync",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to trigger sync",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const exportData = () => {
    const personalTxns = getPersonalTransactions(user.id, user.email);
    const allGroupTxns = userGroups.flatMap(group => getGroupTransactions(group.id));
    
    const data = {
      user: {
        id: user.id,
        email: user.email,
        exportDate: new Date().toISOString()
      },
      personalTransactions: personalTxns,
      groupTransactions: allGroupTxns,
      groups: userGroups,
      userMappings: userMappings
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
  };

  const clearAllData = () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      clearAllStoredData();
      toast({
        title: "Data Cleared",
        description: "All stored data has been cleared",
        variant: "destructive",
      });
      // Reload page to reset state
      window.location.reload();
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
                <div className="text-xs text-gray-500 font-mono">{user.id.toString().slice(0, 12)}...</div>
              </div>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => copyToClipboard(user.id.toString(), 'User ID')}
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
                <div className={`text-2xl font-bold ${stats.totalAmount >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                  {stats.totalAmount >= 0 ? '+' : ''}₹{stats.totalAmount.toLocaleString()}
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
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{userMappings.length}</div>
                <div className="text-xs text-gray-600">Email Mappings</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="groups" className="space-y-4">
        <TabsList>
          <TabsTrigger value="groups">My Groups</TabsTrigger>
          <TabsTrigger value="email-auth">Email Accounts</TabsTrigger>
          <TabsTrigger value="mappings">Email Mappings</TabsTrigger>
          <TabsTrigger value="data">Data Management</TabsTrigger>
        </TabsList>

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
                              Created {format(new Date(group.created_at), 'MMM dd, yyyy')}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge variant={isOwner ? 'default' : 'secondary'}>
                            {isOwner ? 'Owner' : 'Member'}
                          </Badge>
                          <div className="text-right">
                            <div className="text-sm font-medium">Code: {group.group_code}</div>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => copyToClipboard(group.group_code, 'Group Code')}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
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

        <TabsContent value="email-auth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Account Integration</CardTitle>
              <p className="text-sm text-gray-500">
                Connect your email accounts to automatically extract transaction data
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Connected Email Accounts */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">
                  Connected Accounts ({connectedEmails.length})
                </h4>
                
                {connectedEmails.length > 0 ? (
                  <div className="space-y-3">
                    {connectedEmails.map((account) => (
                      <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            account.provider === 'GMAIL' ? 'bg-red-500' :
                            account.provider === 'OUTLOOK' ? 'bg-blue-500' : 'bg-purple-500'
                          }`}>
                            <Mail className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="font-medium">{account.emailAddress}</div>
                            <div className="text-sm text-gray-500 flex items-center space-x-2">
                              <span>{account.provider}</span>
                              <span>•</span>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                account.isActive && !account.tokenExpired ? 
                                'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {account.isActive && !account.tokenExpired ? 'Active' : 
                                 account.tokenExpired ? 'Token Expired' : 'Inactive'}
                              </span>
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {account.totalTransactionsExtracted} transactions extracted • 
                              Last sync: {account.lastSyncAt ? 
                                format(new Date(account.lastSyncAt), 'MMM dd, HH:mm') : 'Never'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {account.isActive && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleSyncAccount(account.id)}
                            >
                              Sync
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleDisconnectAccount(account.id, account.emailAddress)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No email accounts connected</p>
                    <p className="text-sm mb-4">Connect your email to automatically import transactions</p>
                  </div>
                )}
                
                {/* OAuth Tokens Debug Display */}
                {oauthTokens && (
                  <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-green-800 dark:text-green-200">🎉 OAuth Tokens Received!</h5>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => setOauthTokens(null)}
                        className="text-green-600 hover:text-green-800"
                      >
                        ✕
                      </Button>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Email:</span>
                        <span className="text-green-600 font-mono">{oauthTokens.email}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Provider:</span>
                        <span className="text-blue-600 font-mono">{oauthTokens.provider}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Access Token:</span>
                        <span className="text-purple-600 font-mono text-xs">{oauthTokens.access_token}</span>
                      </div>
                      {oauthTokens.refresh_token && (
                        <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border">
                          <span className="font-medium text-gray-700 dark:text-gray-300">Refresh Token:</span>
                          <span className="text-orange-600 font-mono text-xs">{oauthTokens.refresh_token}</span>
                        </div>
                      )}
                      {oauthTokens.expires_in && (
                        <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border">
                          <span className="font-medium text-gray-700 dark:text-gray-300">Expires In:</span>
                          <span className="text-red-600 font-mono">{oauthTokens.expires_in} seconds</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                      <p className="text-xs text-yellow-800 dark:text-yellow-200">
                        ✅ <strong>Success!</strong> Gmail OAuth is working. The tokens above prove the complete OAuth flow is functional.
                      </p>
                    </div>
                  </div>
                )}

                {/* Extraction Stats */}
                {extractionStats && (
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Extraction Statistics</h5>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Total Emails:</span>
                        <span className="ml-2 font-medium">{extractionStats.totalEmailsProcessed.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Transactions:</span>
                        <span className="ml-2 font-medium">{extractionStats.totalTransactionsExtracted.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Pending:</span>
                        <span className="ml-2 font-medium text-orange-600">{extractionStats.unprocessedTransactions}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Confidence:</span>
                        <span className="ml-2 font-medium">{(extractionStats.averageConfidence * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Add Email Account Buttons */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-3">Connect New Account</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button 
                    variant="outline" 
                    className="h-16 flex flex-col space-y-2"
                    onClick={handleConnectGmail}
                    disabled={loadingAuth === 'GMAIL'}
                  >
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                      <Mail className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm">
                      {loadingAuth === 'GMAIL' ? 'Connecting...' : 'Gmail'}
                    </span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-16 flex flex-col space-y-2"
                    onClick={handleConnectOutlook}
                    disabled={loadingAuth === 'OUTLOOK'}
                  >
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <Mail className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm">
                      {loadingAuth === 'OUTLOOK' ? 'Connecting...' : 'Outlook'}
                    </span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-16 flex flex-col space-y-2"
                    disabled
                  >
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                      <Mail className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm">Yahoo (Soon)</span>
                  </Button>
                </div>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  All email access tokens are encrypted and stored securely. We only read transaction-related emails.
                </AlertDescription>
              </Alert>
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