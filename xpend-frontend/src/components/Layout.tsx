import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  Target, 
  Plus, 
  BarChart3, 
  Settings,
  Calendar,
  LogOut,
  Wallet,
  Users,
  ChevronDown,
  User,
  Copy,
  Upload,
  List,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useApp } from '@/contexts/AppContext';
import { 
  getStoredTransactions, 
  getPersonalTransactions, 
  getGroupTransactions 
} from '@/utils/dataStorage';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Planning', href: '/planning', icon: Target },
  { name: 'Add Transaction', href: '/add', icon: Plus },
  { name: 'Transactions', href: '/transactions', icon: List },
  { name: 'Import Data', href: '/import', icon: Upload },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Accounts', href: '/accounts', icon: Wallet },
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const Layout = () => {
  const location = useLocation();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const currentMonth = format(selectedMonth, 'MMMM yyyy');
  const { 
    user,
    currentGroup, 
    userGroups, 
    isPersonalMode, 
    switchToPersonal, 
    switchToGroup,
    createGroup,
    joinGroup,
    dataVersion
  } = useApp();

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupCode, setGroupCode] = useState('');
  const [monthlyStats, setMonthlyStats] = useState({
    income: 0,
    expenses: 0,
    balance: 0
  });

  useEffect(() => {
    if (user) {
      fetchMonthlyStats();
    }
  }, [user, isPersonalMode, currentGroup, selectedMonth, dataVersion]);

  const fetchMonthlyStats = async () => {
    if (!user) return;

    try {
      const currentMonthStart = format(startOfMonth(selectedMonth), 'yyyy-MM-dd');
      const currentMonthEnd = format(endOfMonth(selectedMonth), 'yyyy-MM-dd');

      // Get transactions based on mode
      let transactions;
      if (isPersonalMode) {
        transactions = getPersonalTransactions(user.id, user.email);
      } else if (currentGroup) {
        transactions = getGroupTransactions(currentGroup.id);
      } else {
        transactions = [];
      }
      
      // Filter by current month
      transactions = transactions.filter(t => 
        t.transaction_date >= currentMonthStart && t.transaction_date <= currentMonthEnd
      );

      const income = transactions
        .filter(t => t.transaction_type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expenses = transactions
        .filter(t => t.transaction_type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      setMonthlyStats({
        income,
        expenses,
        balance: income - expenses
      });
    } catch (error) {
      console.error('Error fetching monthly stats:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleCreateGroup = async () => {
    if (groupName.trim()) {
      const group = await createGroup(groupName.trim());
      if (group) {
        setGroupName('');
        setShowCreateGroup(false);
        switchToGroup(group.id);
      }
    }
  };

  const handleJoinGroup = async () => {
    if (groupCode.trim()) {
      const success = await joinGroup(groupCode.trim());
      if (success) {
        setGroupCode('');
        setShowJoinGroup(false);
      }
    }
  };

  const copyGroupCode = () => {
    if (currentGroup?.group_code) {
      navigator.clipboard.writeText(currentGroup.group_code);
    }
  };

  const goToPreviousMonth = () => {
    setSelectedMonth(subMonths(selectedMonth, 1));
  };

  const goToNextMonth = () => {
    setSelectedMonth(addMonths(selectedMonth, 1));
  };

  const goToCurrentMonth = () => {
    setSelectedMonth(new Date());
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Wallet className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Pocket Trend Tracker
                </h1>
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {currentMonth}
                  </p>
                  {!isPersonalMode && currentGroup && (
                    <Badge variant="secondary" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      {currentGroup.name}
                    </Badge>
                  )}
                  {isPersonalMode && (
                    <Badge variant="outline" className="text-xs">
                      <User className="h-3 w-3 mr-1" />
                      Personal
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="sm" onClick={goToPreviousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Dialog open={showMonthPicker} onOpenChange={setShowMonthPicker}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Calendar className="h-4 w-4 mr-2" />
                      {currentMonth}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Select Month</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Button variant="ghost" onClick={goToPreviousMonth}>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="text-lg font-medium">
                          {format(selectedMonth, 'MMMM yyyy')}
                        </div>
                        <Button variant="ghost" onClick={goToNextMonth}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex justify-center">
                        <Button onClick={() => { goToCurrentMonth(); setShowMonthPicker(false); }}>
                          Go to Current Month
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="ghost" size="sm" onClick={goToNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <aside className="w-64 flex-shrink-0">
            <Card className="p-4">
              {/* Mode Switcher */}
              <div className="mb-4">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Mode
                </div>
                <div className="space-y-1">
                  <Button
                    variant={isPersonalMode ? "default" : "ghost"}
                    size="sm"
                    className="w-full justify-start"
                    onClick={switchToPersonal}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Personal
                  </Button>
                  
                  {userGroups.map((group) => (
                    <Button
                      key={group.id}
                      variant={!isPersonalMode && currentGroup?.id === group.id ? "default" : "ghost"}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => switchToGroup(group.id)}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      {group.name}
                    </Button>
                  ))}
                  
                  <div className="flex space-x-1">
                    <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Plus className="h-3 w-3 mr-1" />
                          Create
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create Group</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="groupName">Group Name</Label>
                            <Input
                              id="groupName"
                              value={groupName}
                              onChange={(e) => setGroupName(e.target.value)}
                              placeholder="e.g., Family, Roommates"
                            />
                          </div>
                          <Button onClick={handleCreateGroup} className="w-full">
                            Create Group
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Dialog open={showJoinGroup} onOpenChange={setShowJoinGroup}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1">
                          Join
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Join Group</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="groupCode">Group Code</Label>
                            <Input
                              id="groupCode"
                              value={groupCode}
                              onChange={(e) => setGroupCode(e.target.value)}
                              placeholder="Enter 8-character code"
                            />
                          </div>
                          <Button onClick={handleJoinGroup} className="w-full">
                            Join Group
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>

              {/* Group Info */}
              {!isPersonalMode && currentGroup && (
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Group Code
                  </div>
                  <div className="flex items-center space-x-2">
                    <code className="text-sm font-mono bg-white dark:bg-gray-700 px-2 py-1 rounded border">
                      {currentGroup.group_code}
                    </code>
                    <Button size="sm" variant="ghost" onClick={copyGroupCode}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Share this code to invite others
                  </p>
                </div>
              )}

              <Separator className="my-4" />

              <nav className="space-y-2">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <item.icon className="h-5 w-5 mr-3" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
              
              <Separator className="my-4" />
              
              {/* Quick Stats */}
              <div className="space-y-3">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {format(selectedMonth, 'MMM yyyy')}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Income</span>
                    <span className="font-medium text-green-600">₹{monthlyStats.income.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Expenses</span>
                    <span className="font-medium text-red-600">₹{monthlyStats.expenses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Balance</span>
                    <span className={`font-medium ${monthlyStats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {monthlyStats.balance >= 0 ? '+' : ''}₹{monthlyStats.balance.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;