import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Palette,
  Database,
  Download,
  Upload,
  Trash2,
  Moon,
  Sun,
  Globe,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { 
  clearAllStoredData, 
  debugStoredData,
  getPersonalTransactions,
  getGroupTransactions 
} from '@/utils/dataStorage';

interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  currency: string;
  dateFormat: string;
  notifications: boolean;
  autoBackup: boolean;
  defaultView: 'personal' | 'group';
  language: string;
  budgetWarnings: boolean;
  compactView: boolean;
}

const Settings = () => {
  const { user, isPersonalMode, currentGroup, userGroups } = useApp();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'system',
    currency: 'INR',
    dateFormat: 'dd/MM/yyyy',
    notifications: true,
    autoBackup: false,
    defaultView: 'personal',
    language: 'en',
    budgetWarnings: true,
    compactView: false
  });

  const [stats, setStats] = useState({
    personalTransactions: 0,
    groupTransactions: 0,
    totalGroups: 0,
    dataSize: '0 KB'
  });

  useEffect(() => {
    loadSettings();
    calculateStats();
  }, [user]);

  const loadSettings = () => {
    try {
      const stored = localStorage.getItem('app_settings');
      if (stored) {
        setSettings({ ...settings, ...JSON.parse(stored) });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = (newSettings: Partial<AppSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem('app_settings', JSON.stringify(updatedSettings));
    
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated",
    });
  };

  const calculateStats = () => {
    if (!user) return;

    const personalTxns = getPersonalTransactions(user.id, user.email);
    const allGroupTxns = userGroups.flatMap(group => getGroupTransactions(group.id));
    
    // Calculate approximate data size
    const dataStr = JSON.stringify({
      transactions: personalTxns.concat(allGroupTxns),
      groups: userGroups
    });
    const dataSize = new Blob([dataStr]).size;
    const sizeStr = dataSize < 1024 ? `${dataSize} B` : 
                   dataSize < 1024 * 1024 ? `${(dataSize / 1024).toFixed(1)} KB` : 
                   `${(dataSize / (1024 * 1024)).toFixed(1)} MB`;

    setStats({
      personalTransactions: personalTxns.length,
      groupTransactions: allGroupTxns.length,
      totalGroups: userGroups.length,
      dataSize: sizeStr
    });
  };

  const exportSettings = () => {
    const exportData = {
      settings,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pocket-tracker-settings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Settings Exported",
      description: "Your settings have been downloaded",
    });
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        if (importData.settings) {
          saveSettings(importData.settings);
          toast({
            title: "Settings Imported",
            description: "Your settings have been restored",
          });
        }
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Invalid settings file",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const resetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to default?')) {
      const defaultSettings: AppSettings = {
        theme: 'system',
        currency: 'INR',
        dateFormat: 'dd/MM/yyyy',
        notifications: true,
        autoBackup: false,
        defaultView: 'personal',
        language: 'en',
        budgetWarnings: true,
        compactView: false
      };
      
      saveSettings(defaultSettings);
      toast({
        title: "Settings Reset",
        description: "All settings have been restored to default",
      });
    }
  };

  const clearAllData = () => {
    if (window.confirm('⚠️ This will permanently delete ALL your data including transactions, groups, and accounts. This action cannot be undone. Are you sure?')) {
      clearAllStoredData();
      toast({
        title: "Data Cleared",
        description: "All stored data has been deleted",
        variant: "destructive",
      });
      // Reload page to reset state
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const debugData = () => {
    const data = debugStoredData();
    toast({
      title: "Debug Data",
      description: `Check console for details. Total items: ${Object.values(data).reduce((a, b) => a + b, 0)}`,
    });
  };

  const currencies = [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' }
  ];

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिंदी (Hindi)' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' }
  ];

  const dateFormats = [
    'dd/MM/yyyy',
    'MM/dd/yyyy',
    'yyyy-MM-dd',
    'dd-MM-yyyy'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Customize your experience and manage your data
          </p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <SettingsIcon className="h-5 w-5 mr-2" />
                General Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={settings.currency} onValueChange={(value) => saveSettings({ currency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.symbol} {currency.name} ({currency.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select value={settings.dateFormat} onValueChange={(value) => saveSettings({ dateFormat: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dateFormats.map((format) => (
                        <SelectItem key={format} value={format}>
                          {format} (e.g., {new Date().toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          }).replace(/\//g, format.includes('/') ? '/' : '-')})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={settings.language} onValueChange={(value) => saveSettings({ language: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultView">Default View</Label>
                  <Select value={settings.defaultView} onValueChange={(value) => saveSettings({ defaultView: value as 'personal' | 'group' })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">Personal Mode</SelectItem>
                      <SelectItem value="group">Group Mode</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="budgetWarnings">Budget Warnings</Label>
                    <p className="text-sm text-gray-500">Get notified when approaching budget limits</p>
                  </div>
                  <Switch
                    id="budgetWarnings"
                    checked={settings.budgetWarnings}
                    onCheckedChange={(checked) => saveSettings({ budgetWarnings: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="compactView">Compact View</Label>
                    <p className="text-sm text-gray-500">Show more data in less space</p>
                  </div>
                  <Switch
                    id="compactView"
                    checked={settings.compactView}
                    onCheckedChange={(checked) => saveSettings({ compactView: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="h-5 w-5 mr-2" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select value={settings.theme} onValueChange={(value) => saveSettings({ theme: value as 'light' | 'dark' | 'system' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center">
                        <Sun className="h-4 w-4 mr-2" />
                        Light
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center">
                        <Moon className="h-4 w-4 mr-2" />
                        Dark
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center">
                        <Globe className="h-4 w-4 mr-2" />
                        System
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">Choose your preferred color scheme</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notifications">Enable Notifications</Label>
                  <p className="text-sm text-gray-500">Receive alerts and updates</p>
                </div>
                <Switch
                  id="notifications"
                  checked={settings.notifications}
                  onCheckedChange={(checked) => saveSettings({ notifications: checked })}
                />
              </div>

              <Alert>
                <Bell className="h-4 w-4" />
                <AlertDescription>
                  Browser notifications require permission. You may need to allow notifications in your browser settings.
                </AlertDescription>
              </Alert>
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
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Data Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.personalTransactions}</div>
                  <div className="text-xs text-blue-600">Personal Transactions</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.groupTransactions}</div>
                  <div className="text-xs text-green-600">Group Transactions</div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{stats.totalGroups}</div>
                  <div className="text-xs text-purple-600">Groups</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">{stats.dataSize}</div>
                  <div className="text-xs text-gray-600">Data Size</div>
                </div>
              </div>

              <Separator />

              {/* Backup & Export */}
              <div className="space-y-4">
                <h4 className="font-medium">Backup & Export</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button onClick={exportSettings} variant="outline" className="flex items-center">
                    <Download className="h-4 w-4 mr-2" />
                    Export Settings
                  </Button>
                  <div>
                    <Input
                      type="file"
                      accept=".json"
                      onChange={importSettings}
                      className="hidden"
                      id="import-settings"
                    />
                    <Button asChild variant="outline" className="w-full">
                      <label htmlFor="import-settings" className="flex items-center cursor-pointer">
                        <Upload className="h-4 w-4 mr-2" />
                        Import Settings
                      </label>
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Auto Backup */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoBackup">Auto Backup</Label>
                  <p className="text-sm text-gray-500">Automatically backup data weekly</p>
                </div>
                <Switch
                  id="autoBackup"
                  checked={settings.autoBackup}
                  onCheckedChange={(checked) => saveSettings({ autoBackup: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Advanced Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  These settings are for advanced users. Proceed with caution.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button onClick={debugData} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Debug Data
                  </Button>
                  <Button onClick={resetSettings} variant="outline">
                    <SettingsIcon className="h-4 w-4 mr-2" />
                    Reset Settings
                  </Button>
                  <Button onClick={clearAllData} variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All Data
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium">Storage Information</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• All data is stored locally in your browser</p>
                  <p>• Data persists until manually cleared or browser cache is cleared</p>
                  <p>• Export your data regularly to prevent loss</p>
                  <p>• Groups are shared across browser sessions via localStorage</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;