import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Trash2, Database, HardDrive, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { clearAllSupabaseData, getSupabaseDataCounts } from '@/utils/clearSupabaseData';
import { clearAllStoredData } from '@/utils/dataStorage';

interface DataCounts {
  localStorage: number;
  supabase: {
    transactions: number;
    accounts: number;
    groups_owned: number;
    group_memberships: number;
    user_categories: number;
    budget_plans: number;
    recurring_templates: number;
  };
}

const ClearDataButton = () => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dataCounts, setDataCounts] = useState<DataCounts | null>(null);
  const [clearResults, setClearResults] = useState<string[]>([]);

  const checkDataCounts = async () => {
    try {
      // Check localStorage
      const localStorageKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('pocket_tracker_') || key === 'app_settings'
      );

      // Check Supabase
      const supabaseResult = await getSupabaseDataCounts();
      
      setDataCounts({
        localStorage: localStorageKeys.length,
        supabase: supabaseResult.success ? {
          transactions: supabaseResult.counts.transactions || 0,
          accounts: supabaseResult.counts.accounts || 0,
          groups_owned: supabaseResult.counts.groups_owned || 0,
          group_memberships: supabaseResult.counts.group_memberships || 0,
          user_categories: supabaseResult.counts.user_categories || 0,
          budget_plans: supabaseResult.counts.budget_plans || 0,
          recurring_templates: supabaseResult.counts.recurring_templates || 0
        } : {
          transactions: 0,
          accounts: 0,
          groups_owned: 0,
          group_memberships: 0,
          user_categories: 0,
          budget_plans: 0,
          recurring_templates: 0
        }
      });
    } catch (error) {
      console.error('Error checking data counts:', error);
    }
  };

  const handleClearLocalStorage = () => {
    try {
      clearAllStoredData();
      toast({
        title: "Success",
        description: "LocalStorage data cleared successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear localStorage data",
        variant: "destructive",
      });
    }
  };

  const handleClearSupabase = async () => {
    try {
      setClearing(true);
      setProgress(10);
      setClearResults([]);

      const result = await clearAllSupabaseData();
      setProgress(100);

      if (result.success) {
        setClearResults(result.results);
        toast({
          title: "Success",
          description: "Supabase data cleared successfully",
        });
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to clear Supabase data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setClearing(false);
      setProgress(0);
    }
  };

  const handleClearAll = async () => {
    try {
      setClearing(true);
      setProgress(0);
      setClearResults([]);

      // Clear localStorage first
      setProgress(25);
      clearAllStoredData();
      setClearResults(prev => [...prev, '✅ LocalStorage cleared']);

      // Clear Supabase
      setProgress(50);
      const result = await clearAllSupabaseData();
      
      if (result.success) {
        setClearResults(prev => [...prev, ...result.results]);
        setProgress(100);
        
        toast({
          title: "Success",
          description: "All data cleared successfully",
        });

        // Reload page after a delay
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to clear all data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setClearing(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      checkDataCounts();
    }
  }, [isOpen]);

  const totalSupabaseRecords = dataCounts ? Object.values(dataCounts.supabase).reduce((sum, count) => sum + count, 0) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="h-4 w-4 mr-2" />
          Clear All Data
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
            Clear All Data
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> This will permanently delete ALL your data. This action cannot be undone!
            </AlertDescription>
          </Alert>

          {dataCounts && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center">
                  <HardDrive className="h-4 w-4 mr-2" />
                  <span className="text-sm">LocalStorage</span>
                </div>
                <span className="text-sm font-medium">{dataCounts.localStorage} keys</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center">
                  <Database className="h-4 w-4 mr-2" />
                  <span className="text-sm">Supabase Database</span>
                </div>
                <span className="text-sm font-medium">{totalSupabaseRecords} records</span>
              </div>

              {totalSupabaseRecords > 0 && (
                <div className="text-xs text-gray-500 space-y-1">
                  <div>• Transactions: {dataCounts.supabase.transactions}</div>
                  <div>• Accounts: {dataCounts.supabase.accounts}</div>
                  <div>• Groups owned: {dataCounts.supabase.groups_owned}</div>
                  <div>• Group memberships: {dataCounts.supabase.group_memberships}</div>
                  <div>• Categories: {dataCounts.supabase.user_categories}</div>
                  <div>• Budget plans: {dataCounts.supabase.budget_plans}</div>
                  <div>• Recurring templates: {dataCounts.supabase.recurring_templates}</div>
                </div>
              )}
            </div>
          )}

          {clearing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Clearing data...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {clearResults.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Results:</div>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {clearResults.map((result, index) => (
                  <div key={index} className="text-xs font-mono">
                    {result}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Button 
              onClick={handleClearLocalStorage}
              variant="outline" 
              className="w-full"
              disabled={clearing}
            >
              <HardDrive className="h-4 w-4 mr-2" />
              Clear LocalStorage Only
            </Button>
            
            <Button 
              onClick={handleClearSupabase}
              variant="outline" 
              className="w-full"
              disabled={clearing}
            >
              <Database className="h-4 w-4 mr-2" />
              Clear Supabase Only
            </Button>
            
            <Button 
              onClick={handleClearAll}
              variant="destructive" 
              className="w-full"
              disabled={clearing}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Everything
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClearDataButton;