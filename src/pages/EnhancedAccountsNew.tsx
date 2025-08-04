import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Wallet, 
  CreditCard as CreditCardIcon,
  Building,
  Plus,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Edit2,
  Trash2,
  MoreHorizontal
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { 
  getFinancialAccounts,
  getPersonalFinancialAccounts,
  getGroupFinancialAccounts,
  updateFinancialAccount,
  addFinancialAccount,
  deleteFinancialAccount,
  processEMIPayment,
  processInvestmentUpdate,
  processRecurringPayment,
  calculateLoanDetails,
  calculateLoanEndDate,
  calculateHomeLoanDetails,
  generateDefaultConstructionStages,
  processStageCompletion,
  type FinancialAccount,
  type LoanCalculationParams,
  type HomeLoanParams,
  type ConstructionStage
} from '@/utils/dataStorage';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const EnhancedAccountsNew = () => {
  const { user, isPersonalMode, currentGroup, userGroups, dataVersion, refreshData } = useApp();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [financialSummary, setFinancialSummary] = useState({
    netWorth: 0,
    totalAssets: 0,
    totalLiabilities: 0,
    liquidCash: 0
  });
  
  // Add Account Dialog States
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: '',
    type: 'savings' as FinancialAccount['type'],
    bank_name: '',
    balance: 0,
    credit_limit: 0,
    interest_rate: 0,
    monthly_emi: 0,
    next_due_date: '',
    remaining_terms: 0,
    is_pool_contribution: false,
    is_shared: false,
    split_type: 'equal' as 'equal' | 'fractional' | 'custom',
    // Enhanced loan fields
    principal_amount: 0,
    loan_tenure_months: 0,
    interest_type: 'reducing_balance' as 'simple' | 'compound' | 'reducing_balance' | 'flat_rate',
    processing_fee: 0,
    processing_fee_percentage: 0,
    is_no_cost_emi: false,
    is_interest_free: false,
    emi_start_date: new Date().toISOString().split('T')[0],
    // Home loan fields
    is_home_loan: false,
    is_under_construction: false,
    sanctioned_amount: 0,
    disbursed_amount: 0,
    moratorium_period_months: 0,
    moratorium_end_date: '',
    is_in_moratorium: false,
    possession_date: '',
    actual_moratorium_emi: 0
  });

  // Edit Account Dialog States
  const [showEditAccount, setShowEditAccount] = useState(false);
  const [editingAccount, setEditingAccount] = useState<FinancialAccount | null>(null);
  const [editAccount, setEditAccount] = useState({
    name: '',
    type: 'savings' as FinancialAccount['type'],
    bank_name: '',
    balance: 0,
    credit_limit: 0,
    interest_rate: 0,
    monthly_emi: 0,
    next_due_date: '',
    remaining_terms: 0,
    is_pool_contribution: false,
    is_shared: false,
    split_type: 'equal' as 'equal' | 'fractional' | 'custom',
    // Enhanced loan fields
    principal_amount: 0,
    loan_tenure_months: 0,
    interest_type: 'reducing_balance' as 'simple' | 'compound' | 'reducing_balance' | 'flat_rate',
    processing_fee: 0,
    processing_fee_percentage: 0,
    is_no_cost_emi: false,
    is_interest_free: false,
    emi_start_date: new Date().toISOString().split('T')[0],
    // Home loan fields
    is_home_loan: false,
    is_under_construction: false,
    sanctioned_amount: 0,
    disbursed_amount: 0,
    moratorium_period_months: 0,
    moratorium_end_date: '',
    is_in_moratorium: false,
    possession_date: '',
    actual_moratorium_emi: 0
  });

  // Auto-calculate loan EMI for new account
  useEffect(() => {
    if (newAccount.type === 'loan' && newAccount.principal_amount > 0 && newAccount.loan_tenure_months > 0) {
      if (newAccount.is_home_loan && newAccount.moratorium_period_months > 0) {
        // Home loan with moratorium
        const homeLoanParams: HomeLoanParams = {
          principal: newAccount.principal_amount,
          interestRate: newAccount.interest_rate,
          tenureMonths: newAccount.loan_tenure_months,
          interestType: newAccount.interest_type,
          processingFee: newAccount.processing_fee,
          processingFeePercentage: newAccount.processing_fee_percentage,
          isNoCostEmi: newAccount.is_no_cost_emi,
          isInterestFree: newAccount.is_interest_free,
          sanctionedAmount: newAccount.sanctioned_amount || newAccount.principal_amount,
          disbursedAmount: newAccount.disbursed_amount || 0,
          moratoriumPeriodMonths: newAccount.moratorium_period_months,
          isUnderConstruction: newAccount.is_under_construction
        };
        
        // Generate default construction stages if none exist
        const constructionStages = newAccount.is_under_construction ? 
          generateDefaultConstructionStages(newAccount.sanctioned_amount || newAccount.principal_amount, newAccount.emi_start_date) : 
          undefined;
        
        const result = calculateHomeLoanDetails(homeLoanParams, newAccount.emi_start_date, constructionStages);
        
        setNewAccount(prev => ({
          ...prev,
          monthly_emi: result.postMoratoriumEmi,
          remaining_terms: result.remainingTenureMonths, // Use calculated remaining tenure
          balance: prev.balance === 0 ? (newAccount.disbursed_amount || newAccount.principal_amount) : prev.balance,
          moratorium_end_date: result.moratoriumEndDate,
          is_in_moratorium: new Date() < new Date(result.moratoriumEndDate)
        }));
      } else {
        // Regular loan
        const params: LoanCalculationParams = {
          principal: newAccount.principal_amount,
          interestRate: newAccount.interest_rate,
          tenureMonths: newAccount.loan_tenure_months,
          interestType: newAccount.interest_type,
          processingFee: newAccount.processing_fee,
          processingFeePercentage: newAccount.processing_fee_percentage,
          isNoCostEmi: newAccount.is_no_cost_emi,
          isInterestFree: newAccount.is_interest_free
        };
        
        const result = calculateLoanDetails(params);
        
        setNewAccount(prev => ({
          ...prev,
          monthly_emi: result.monthlyEmi,
          remaining_terms: newAccount.loan_tenure_months,
          balance: prev.balance === 0 ? newAccount.principal_amount : prev.balance
        }));
      }
    }
  }, [
    newAccount.principal_amount,
    newAccount.interest_rate,
    newAccount.loan_tenure_months,
    newAccount.interest_type,
    newAccount.processing_fee,
    newAccount.processing_fee_percentage,
    newAccount.is_no_cost_emi,
    newAccount.is_interest_free,
    newAccount.emi_start_date,
    newAccount.type,
    newAccount.is_home_loan,
    newAccount.sanctioned_amount,
    newAccount.disbursed_amount,
    newAccount.moratorium_period_months,
    newAccount.is_under_construction
  ]);

  // Auto-calculate loan EMI for edit account
  useEffect(() => {
    if (showEditAccount && editAccount.type === 'loan' && editAccount.principal_amount > 0 && editAccount.loan_tenure_months > 0) {
      if (editAccount.is_home_loan && editAccount.moratorium_period_months > 0) {
        // Home loan with moratorium
        const homeLoanParams: HomeLoanParams = {
          principal: editAccount.principal_amount,
          interestRate: editAccount.interest_rate,
          tenureMonths: editAccount.loan_tenure_months,
          interestType: editAccount.interest_type,
          processingFee: editAccount.processing_fee,
          processingFeePercentage: editAccount.processing_fee_percentage,
          isNoCostEmi: editAccount.is_no_cost_emi,
          isInterestFree: editAccount.is_interest_free,
          sanctionedAmount: editAccount.sanctioned_amount || editAccount.principal_amount,
          disbursedAmount: editAccount.disbursed_amount || 0,
          moratoriumPeriodMonths: editAccount.moratorium_period_months,
          isUnderConstruction: editAccount.is_under_construction
        };
        
        // Use existing construction stages if available
        const constructionStages = editingAccount?.construction_stages || 
          (editAccount.is_under_construction ? 
            generateDefaultConstructionStages(editAccount.sanctioned_amount || editAccount.principal_amount, editAccount.emi_start_date) : 
            undefined);
        
        const result = calculateHomeLoanDetails(homeLoanParams, editAccount.emi_start_date, constructionStages);
        
        setEditAccount(prev => ({
          ...prev,
          monthly_emi: result.postMoratoriumEmi,
          remaining_terms: result.remainingTenureMonths, // Use calculated remaining tenure
          moratorium_end_date: result.moratoriumEndDate,
          is_in_moratorium: new Date() < new Date(result.moratoriumEndDate)
        }));
      } else {
        // Regular loan
        const params: LoanCalculationParams = {
          principal: editAccount.principal_amount,
          interestRate: editAccount.interest_rate,
          tenureMonths: editAccount.loan_tenure_months,
          interestType: editAccount.interest_type,
          processingFee: editAccount.processing_fee,
          processingFeePercentage: editAccount.processing_fee_percentage,
          isNoCostEmi: editAccount.is_no_cost_emi,
          isInterestFree: editAccount.is_interest_free
        };
        
        const result = calculateLoanDetails(params);
        
        setEditAccount(prev => ({
          ...prev,
          monthly_emi: result.monthlyEmi
        }));
      }
    }
  }, [
    showEditAccount,
    editAccount.principal_amount,
    editAccount.interest_rate,
    editAccount.loan_tenure_months,
    editAccount.interest_type,
    editAccount.processing_fee,
    editAccount.processing_fee_percentage,
    editAccount.is_no_cost_emi,
    editAccount.is_interest_free,
    editAccount.emi_start_date,
    editAccount.type,
    editAccount.is_home_loan,
    editAccount.sanctioned_amount,
    editAccount.disbursed_amount,
    editAccount.moratorium_period_months,
    editAccount.is_under_construction
  ]);

  useEffect(() => {
    if (user) {
      console.log('EnhancedAccountsNew: User found', user.id);
      loadAccounts();
    }
  }, [user, isPersonalMode, currentGroup, dataVersion]);

  const loadAccounts = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get accounts based on mode
      let userAccounts: FinancialAccount[] = [];
      if (isPersonalMode) {
        userAccounts = getPersonalFinancialAccounts(user.id);
      } else if (currentGroup) {
        // Get group accounts AND pool contributions from all users
        const groupAccounts = getGroupFinancialAccounts(currentGroup.id);
        const allAccounts = getFinancialAccounts();
        
        // Find all accounts marked as pool contributions
        const poolContributions = allAccounts.filter(a => 
          a.is_pool_contribution && 
          a.is_active &&
          !a.group_id // Personal accounts marked for pool contribution
        );
        
        userAccounts = [...groupAccounts, ...poolContributions];
      }
      
      console.log('Loaded accounts:', userAccounts.length);
      setAccounts(userAccounts);
      
      // Calculate financial summary
      const totalAssets = userAccounts
        .filter(a => !['credit_card', 'loan'].includes(a.type))
        .reduce((sum, a) => sum + a.balance, 0);
      
      const totalLiabilities = userAccounts
        .filter(a => ['credit_card', 'loan'].includes(a.type))
        .reduce((sum, a) => sum + a.balance, 0);
      
      const liquidCash = userAccounts
        .filter(a => a.type === 'cash')
        .reduce((sum, a) => sum + a.balance, 0);
      
      const netWorth = totalAssets - totalLiabilities;
      
      setFinancialSummary({
        netWorth,
        totalAssets,
        totalLiabilities,
        liquidCash
      });
      
    } catch (error) {
      console.error('Error loading accounts:', error);
      toast({
        title: "Error",
        description: "Failed to load accounts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEMIPayment = async (loanAccountId: string) => {
    if (!user) return;

    try {
      // Find a cash or savings account to deduct from
      const sourceAccount = accounts.find(a => ['cash', 'savings', 'checking'].includes(a.type) && a.balance > 0);
      
      if (!sourceAccount) {
        toast({
          title: "Error",
          description: "No account found with sufficient balance for EMI payment",
          variant: "destructive",
        });
        return;
      }

      const result = processEMIPayment(loanAccountId, sourceAccount.id);
      
      toast({
        title: "EMI Payment Successful",
        description: `₹${result.paymentAmount.toLocaleString()} paid towards ${result.loanAccount.name}. Transaction automatically created.`,
      });
      
      // Refresh accounts and data
      loadAccounts();
      refreshData();
      
    } catch (error) {
      console.error('EMI Payment Error:', error);
      toast({
        title: "EMI Payment Failed",
        description: error instanceof Error ? error.message : "Failed to process EMI payment",
        variant: "destructive",
      });
    }
  };

  const handleInvestmentUpdate = async (investmentAccountId: string, newBalance: number) => {
    if (!user) return;

    try {
      // Find a cash or savings account to deduct from (if increasing investment)
      const sourceAccount = accounts.find(a => ['cash', 'savings', 'checking'].includes(a.type) && a.balance > 0);
      
      const result = processInvestmentUpdate(investmentAccountId, newBalance, sourceAccount?.id);
      
      toast({
        title: "Investment Updated",
        description: `Investment balance updated. Transaction automatically created.`,
      });
      
      // Refresh accounts and data
      loadAccounts();
      refreshData();
      
    } catch (error) {
      console.error('Investment Update Error:', error);
      toast({
        title: "Investment Update Failed",
        description: error instanceof Error ? error.message : "Failed to update investment",
        variant: "destructive",
      });
    }
  };

  const handleRecurringPayment = async (recurringAccountId: string) => {
    if (!user) return;

    try {
      // Find a cash or savings account to deduct from
      const sourceAccount = accounts.find(a => ['cash', 'savings', 'checking'].includes(a.type) && a.balance > 0);
      
      if (!sourceAccount) {
        toast({
          title: "Error",
          description: "No account found with sufficient balance for recurring payment",
          variant: "destructive",
        });
        return;
      }

      const result = processRecurringPayment(recurringAccountId, sourceAccount.id);
      
      toast({
        title: "Recurring Payment Successful",
        description: `₹${result.paymentAmount.toLocaleString()} paid for ${result.recurringAccount.name}. Transaction automatically created.`,
      });
      
      // Refresh accounts and data
      loadAccounts();
      refreshData();
      
    } catch (error) {
      console.error('Recurring Payment Error:', error);
      toast({
        title: "Recurring Payment Failed",
        description: error instanceof Error ? error.message : "Failed to process recurring payment",
        variant: "destructive",
      });
    }
  };

  const handleAddAccount = () => {
    if (!user || !newAccount.name.trim()) {
      toast({
        title: "Error",
        description: "Please fill in the account name",
        variant: "destructive",
      });
      return;
    }

    try {
      const accountData: Omit<FinancialAccount, 'id' | 'created_at'> = {
        user_id: user.id,
        group_id: isPersonalMode ? null : currentGroup?.id || null,
        name: newAccount.name.trim(),
        type: newAccount.type,
        bank_name: newAccount.bank_name || undefined,
        balance: newAccount.balance,
        credit_limit: newAccount.credit_limit || undefined,
        interest_rate: newAccount.interest_rate || undefined,
        monthly_emi: newAccount.monthly_emi || undefined,
        next_due_date: newAccount.next_due_date || undefined,
        remaining_terms: newAccount.remaining_terms || undefined,
        is_active: true,
        is_pool_contribution: newAccount.is_pool_contribution,
        is_shared: newAccount.is_shared,
        split_type: newAccount.split_type,
        
        // Enhanced loan fields
        principal_amount: newAccount.principal_amount || undefined,
        loan_tenure_months: newAccount.loan_tenure_months || undefined,
        interest_type: newAccount.interest_type || undefined,
        processing_fee: newAccount.processing_fee || undefined,
        processing_fee_percentage: newAccount.processing_fee_percentage || undefined,
        is_no_cost_emi: newAccount.is_no_cost_emi || undefined,
        is_interest_free: newAccount.is_interest_free || undefined,
        emi_start_date: newAccount.emi_start_date || undefined,
        
        // Home loan specific fields
        is_home_loan: newAccount.is_home_loan || undefined,
        is_under_construction: newAccount.is_under_construction || undefined,
        sanctioned_amount: newAccount.sanctioned_amount || undefined,
        disbursed_amount: newAccount.disbursed_amount || undefined,
        moratorium_period_months: newAccount.moratorium_period_months || undefined,
        moratorium_end_date: newAccount.moratorium_end_date || undefined,
        is_in_moratorium: newAccount.is_in_moratorium || undefined,
        possession_date: newAccount.possession_date || undefined,
        actual_moratorium_emi: newAccount.actual_moratorium_emi || undefined,
        
        // Generate construction stages for home loans under construction
        construction_stages: newAccount.is_home_loan && newAccount.is_under_construction ? 
          generateDefaultConstructionStages(
            newAccount.sanctioned_amount || newAccount.principal_amount, 
            newAccount.emi_start_date
          ) : undefined
      };

      addFinancialAccount(accountData);

      toast({
        title: "Success",
        description: `${newAccount.name} added successfully!`,
      });

      // Reset form
      setNewAccount({
        name: '',
        type: 'savings',
        bank_name: '',
        balance: 0,
        credit_limit: 0,
        interest_rate: 0,
        monthly_emi: 0,
        next_due_date: '',
        remaining_terms: 0,
        is_pool_contribution: false,
        is_shared: false,
        split_type: 'equal' as 'equal' | 'fractional' | 'custom',
        // Enhanced loan fields
        principal_amount: 0,
        loan_tenure_months: 0,
        interest_type: 'reducing_balance' as 'simple' | 'compound' | 'reducing_balance' | 'flat_rate',
        processing_fee: 0,
        processing_fee_percentage: 0,
        is_no_cost_emi: false,
        is_interest_free: false,
        emi_start_date: new Date().toISOString().split('T')[0],
        // Home loan fields
        is_home_loan: false,
        is_under_construction: false,
        sanctioned_amount: 0,
        disbursed_amount: 0,
        moratorium_period_months: 0,
        moratorium_end_date: '',
        is_in_moratorium: false,
        possession_date: '',
        actual_moratorium_emi: 0
      });

      // Close dialog and refresh data
      setShowAddAccount(false);
      loadAccounts();
      refreshData();

    } catch (error) {
      console.error('Error adding account:', error);
      toast({
        title: "Error",
        description: "Failed to add account",
        variant: "destructive",
      });
    }
  };

  const handleEditAccount = (account: FinancialAccount) => {
    try {
      setEditingAccount(account);
      setEditAccount({
        name: account.name || '',
        type: account.type || 'savings',
        bank_name: account.bank_name || '',
        balance: account.balance || 0,
        credit_limit: account.credit_limit || 0,
        interest_rate: account.interest_rate || 0,
        monthly_emi: account.monthly_emi || 0,
        next_due_date: account.next_due_date || '',
        remaining_terms: account.remaining_terms || 0,
        is_pool_contribution: account.is_pool_contribution || false,
        is_shared: account.is_shared || false,
        split_type: account.split_type || 'equal',
        // Enhanced loan fields - safe fallbacks for existing accounts
        principal_amount: account.principal_amount ?? (account.type === 'loan' ? account.balance : 0),
        loan_tenure_months: account.loan_tenure_months ?? (account.remaining_terms || 0),
        interest_type: (account.interest_type as any) || 'reducing_balance',
        processing_fee: account.processing_fee ?? 0,
        processing_fee_percentage: account.processing_fee_percentage ?? 0,
        is_no_cost_emi: account.is_no_cost_emi ?? false,
        is_interest_free: account.is_interest_free ?? false,
        emi_start_date: account.emi_start_date || new Date().toISOString().split('T')[0],
        // Home loan fields
        is_home_loan: account.is_home_loan ?? false,
        is_under_construction: account.is_under_construction ?? false,
        sanctioned_amount: account.sanctioned_amount ?? (account.type === 'loan' ? account.balance : 0),
        disbursed_amount: account.disbursed_amount ?? 0,
        moratorium_period_months: account.moratorium_period_months ?? 0,
        moratorium_end_date: account.moratorium_end_date || '',
        is_in_moratorium: account.is_in_moratorium ?? false,
        possession_date: account.possession_date || '',
        actual_moratorium_emi: account.actual_moratorium_emi ?? 0
      });
      
      setShowEditAccount(true);
    } catch (error) {
      console.error('Error in handleEditAccount:', error);
      toast({
        title: "Error",
        description: "Failed to open edit dialog",
        variant: "destructive",
      });
    }
  };

  const handleUpdateAccount = () => {
    if (!editingAccount || !editAccount.name.trim()) {
      toast({
        title: "Error",
        description: "Please fill in the account name",
        variant: "destructive",
      });
      return;
    }

    try {
      const updates: Partial<FinancialAccount> = {
        name: editAccount.name.trim(),
        type: editAccount.type,
        bank_name: editAccount.bank_name || undefined,
        balance: editAccount.balance,
        credit_limit: editAccount.credit_limit || undefined,
        interest_rate: editAccount.interest_rate || undefined,
        monthly_emi: editAccount.monthly_emi || undefined,
        next_due_date: editAccount.next_due_date || undefined,
        remaining_terms: editAccount.remaining_terms || undefined,
        is_pool_contribution: editAccount.is_pool_contribution,
        is_shared: editAccount.is_shared,
        split_type: editAccount.split_type,
        
        // Enhanced loan fields
        principal_amount: editAccount.principal_amount || undefined,
        loan_tenure_months: editAccount.loan_tenure_months || undefined,
        interest_type: editAccount.interest_type || undefined,
        processing_fee: editAccount.processing_fee || undefined,
        processing_fee_percentage: editAccount.processing_fee_percentage || undefined,
        is_no_cost_emi: editAccount.is_no_cost_emi || undefined,
        is_interest_free: editAccount.is_interest_free || undefined,
        emi_start_date: editAccount.emi_start_date || undefined,
        
        // Home loan specific fields
        is_home_loan: editAccount.is_home_loan || undefined,
        is_under_construction: editAccount.is_under_construction || undefined,
        sanctioned_amount: editAccount.sanctioned_amount || undefined,
        disbursed_amount: editAccount.disbursed_amount || undefined,
        moratorium_period_months: editAccount.moratorium_period_months || undefined,
        moratorium_end_date: editAccount.moratorium_end_date || undefined,
        is_in_moratorium: editAccount.is_in_moratorium || undefined,
        possession_date: editAccount.possession_date || undefined,
        actual_moratorium_emi: editAccount.actual_moratorium_emi || undefined
      };

      updateFinancialAccount(editingAccount.id, updates, {
        createTransaction: true,
        transactionDescription: `Account update - ${editingAccount.name}`,
        transactionCategory: 'account_update'
      });

      toast({
        title: "Success",
        description: `${editAccount.name} updated successfully!`,
      });

      // Reset form and close dialog
      setEditingAccount(null);
      setEditAccount({
        name: '',
        type: 'savings',
        bank_name: '',
        balance: 0,
        credit_limit: 0,
        interest_rate: 0,
        monthly_emi: 0,
        next_due_date: '',
        remaining_terms: 0,
        is_pool_contribution: false,
        is_shared: false,
        split_type: 'equal',
        // Enhanced loan fields
        principal_amount: 0,
        loan_tenure_months: 0,
        interest_type: 'reducing_balance' as 'simple' | 'compound' | 'reducing_balance' | 'flat_rate',
        processing_fee: 0,
        processing_fee_percentage: 0,
        is_no_cost_emi: false,
        is_interest_free: false,
        emi_start_date: new Date().toISOString().split('T')[0],
        // Home loan fields
        is_home_loan: false,
        is_under_construction: false,
        sanctioned_amount: 0,
        disbursed_amount: 0,
        moratorium_period_months: 0,
        moratorium_end_date: '',
        is_in_moratorium: false,
        possession_date: '',
        actual_moratorium_emi: 0
      });
      setShowEditAccount(false);
      
      // Refresh data
      loadAccounts();
      refreshData();

    } catch (error) {
      console.error('Error updating account:', error);
      toast({
        title: "Error",
        description: "Failed to update account",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = (accountId: string, accountName: string) => {
    if (!confirm(`Are you sure you want to delete "${accountName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      deleteFinancialAccount(accountId);
      
      toast({
        title: "Account Deleted",
        description: `${accountName} has been deleted successfully.`,
      });
      
      // Refresh accounts and data
      loadAccounts();
      refreshData();
      
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Error",
        description: "Failed to delete account",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Enhanced Accounts</h1>
        </div>
        <div className="text-center py-8">Loading accounts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Enhanced Financial Accounts
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage all your financial accounts, investments, loans, and assets
          </p>
        </div>
        <Dialog open={showAddAccount} onOpenChange={setShowAddAccount}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Account</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="accountName">Account Name *</Label>
                <Input
                  id="accountName"
                  value={newAccount.name}
                  onChange={(e) => setNewAccount({...newAccount, name: e.target.value})}
                  placeholder="e.g., HDFC Savings, SBI Credit Card"
                />
              </div>
              
              <div>
                <Label htmlFor="accountType">Account Type *</Label>
                <Select value={newAccount.type} onValueChange={(value: FinancialAccount['type']) => setNewAccount({...newAccount, type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="savings">Savings Account</SelectItem>
                    <SelectItem value="checking">Checking Account</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="loan">Loan</SelectItem>
                    <SelectItem value="investment">Investment</SelectItem>
                    <SelectItem value="mutual_fund">Mutual Fund</SelectItem>
                    <SelectItem value="stocks">Stocks</SelectItem>
                    <SelectItem value="sip">SIP</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="recurring">Recurring Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="bankName">Bank/Institution</Label>
                <Input
                  id="bankName"
                  value={newAccount.bank_name}
                  onChange={(e) => setNewAccount({...newAccount, bank_name: e.target.value})}
                  placeholder="e.g., HDFC Bank, SBI"
                />
              </div>
              
              <div>
                <Label htmlFor="balance">
                  {newAccount.type === 'loan' ? 'Outstanding Loan Balance *' : 'Current Balance *'}
                </Label>
                <Input
                  id="balance"
                  type="number"
                  value={newAccount.balance}
                  onChange={(e) => setNewAccount({...newAccount, balance: Number(e.target.value)})}
                  placeholder="0"
                />
                {newAccount.type === 'loan' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the current outstanding amount (remaining to be paid)
                  </p>
                )}
              </div>
              
              {['credit_card'].includes(newAccount.type) && (
                <div>
                  <Label htmlFor="creditLimit">Credit Limit</Label>
                  <Input
                    id="creditLimit"
                    type="number"
                    value={newAccount.credit_limit}
                    onChange={(e) => setNewAccount({...newAccount, credit_limit: Number(e.target.value)})}
                    placeholder="0"
                  />
                </div>
              )}
              
              {['loan'].includes(newAccount.type) && (
                <div className="space-y-4 border border-gray-200 rounded-lg p-4">
                  <Label className="text-lg font-semibold">Loan Details</Label>
                  
                  {/* Loan Type Options */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="isInterestFree"
                        checked={newAccount.is_interest_free}
                        onCheckedChange={(checked) => 
                          setNewAccount({...newAccount, is_interest_free: !!checked, interest_rate: checked ? 0 : newAccount.interest_rate})
                        }
                      />
                      <Label htmlFor="isInterestFree" className="text-sm">Interest-Free Loan</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="isNoCostEmi"
                        checked={newAccount.is_no_cost_emi}
                        onCheckedChange={(checked) => 
                          setNewAccount({...newAccount, is_no_cost_emi: !!checked})
                        }
                      />
                      <Label htmlFor="isNoCostEmi" className="text-sm">No-Cost EMI</Label>
                    </div>
                  </div>

                  {/* Principal Amount */}
                  <div>
                    <Label htmlFor="principalAmount">Principal Loan Amount *</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="principalAmount"
                        type="number"
                        value={newAccount.principal_amount}
                        onChange={(e) => setNewAccount({...newAccount, principal_amount: Number(e.target.value)})}
                        placeholder="0"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setNewAccount({...newAccount, balance: newAccount.principal_amount})}
                        disabled={newAccount.principal_amount === 0}
                      >
                        Set as Outstanding
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Original loan amount. Click "Set as Outstanding" for new loans.
                    </p>
                  </div>

                  {/* Loan Tenure */}
                  <div>
                    <Label htmlFor="loanTenure">Loan Tenure (months) *</Label>
                    <Input
                      id="loanTenure"
                      type="number"
                      value={newAccount.loan_tenure_months}
                      onChange={(e) => setNewAccount({...newAccount, loan_tenure_months: Number(e.target.value)})}
                      placeholder="0"
                    />
                  </div>

                  {/* Interest Rate and Type */}
                  {!newAccount.is_interest_free && !newAccount.is_no_cost_emi && (
                    <>
                      <div>
                        <Label htmlFor="interestRate">Annual Interest Rate (%)</Label>
                        <Input
                          id="interestRate"
                          type="number"
                          step="0.01"
                          value={newAccount.interest_rate}
                          onChange={(e) => setNewAccount({...newAccount, interest_rate: Number(e.target.value)})}
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <Label htmlFor="interestType">Interest Type</Label>
                        <Select 
                          value={newAccount.interest_type} 
                          onValueChange={(value: 'simple' | 'compound' | 'reducing_balance' | 'flat_rate') => 
                            setNewAccount({...newAccount, interest_type: value})
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select interest type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="reducing_balance">Reducing Balance (Most Common)</SelectItem>
                            <SelectItem value="flat_rate">Flat Rate</SelectItem>
                            <SelectItem value="simple">Simple Interest</SelectItem>
                            <SelectItem value="compound">Compound Interest</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {/* Processing Fees */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="processingFee">Processing Fee (₹)</Label>
                      <Input
                        id="processingFee"
                        type="number"
                        value={newAccount.processing_fee}
                        onChange={(e) => setNewAccount({...newAccount, processing_fee: Number(e.target.value)})}
                        placeholder="0"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="processingFeePercentage">Processing Fee (%)</Label>
                      <Input
                        id="processingFeePercentage"
                        type="number"
                        step="0.01"
                        value={newAccount.processing_fee_percentage}
                        onChange={(e) => setNewAccount({...newAccount, processing_fee_percentage: Number(e.target.value)})}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* EMI Start Date */}
                  <div>
                    <Label htmlFor="emiStartDate">EMI Start Date</Label>
                    <Input
                      id="emiStartDate"
                      type="date"
                      value={newAccount.emi_start_date}
                      onChange={(e) => setNewAccount({...newAccount, emi_start_date: e.target.value})}
                    />
                  </div>

                  {/* Home Loan Specific Fields */}
                  <div className="space-y-3 border-t pt-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="isHomeLoan"
                        checked={newAccount.is_home_loan}
                        onCheckedChange={(checked) => {
                          const updates: any = { is_home_loan: !!checked };
                          if (checked) {
                            updates.sanctioned_amount = newAccount.principal_amount;
                            updates.disbursed_amount = 0;
                            updates.moratorium_period_months = 12; // Default 12 months
                          }
                          setNewAccount({...newAccount, ...updates});
                        }}
                      />
                      <Label htmlFor="isHomeLoan" className="text-sm font-medium">Home Loan</Label>
                    </div>

                    {newAccount.is_home_loan && (
                      <>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="isUnderConstruction"
                            checked={newAccount.is_under_construction}
                            onCheckedChange={(checked) => 
                              setNewAccount({...newAccount, is_under_construction: !!checked})
                            }
                          />
                          <Label htmlFor="isUnderConstruction" className="text-sm">Under Construction Property</Label>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="sanctionedAmount">Sanctioned Amount *</Label>
                            <Input
                              id="sanctionedAmount"
                              type="number"
                              value={newAccount.sanctioned_amount}
                              onChange={(e) => setNewAccount({...newAccount, sanctioned_amount: Number(e.target.value)})}
                              placeholder="0"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="disbursedAmount">Disbursed Amount</Label>
                            <Input
                              id="disbursedAmount"
                              type="number"
                              value={newAccount.disbursed_amount}
                              onChange={(e) => setNewAccount({...newAccount, disbursed_amount: Number(e.target.value)})}
                              placeholder="0"
                            />
                            <p className="text-xs text-gray-500 mt-1">Amount released so far</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="moratoriumPeriod">Moratorium Period (months)</Label>
                            <Input
                              id="moratoriumPeriod"
                              type="number"
                              value={newAccount.moratorium_period_months}
                              onChange={(e) => setNewAccount({...newAccount, moratorium_period_months: Number(e.target.value)})}
                              placeholder="12"
                            />
                            <p className="text-xs text-gray-500 mt-1">Interest-only payment period</p>
                          </div>

                          <div>
                            <Label htmlFor="possessionDate">Expected Possession</Label>
                            <Input
                              id="possessionDate"
                              type="date"
                              value={newAccount.possession_date}
                              onChange={(e) => setNewAccount({...newAccount, possession_date: e.target.value})}
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Calculated Values (Read-only) */}
                  {newAccount.monthly_emi > 0 && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <Label className="text-sm font-medium text-blue-800">Calculated EMI Details</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                        <div>Monthly EMI: <span className="font-semibold">₹{newAccount.monthly_emi.toLocaleString()}</span></div>
                        <div>Outstanding: <span className="font-semibold">₹{newAccount.balance.toLocaleString()}</span></div>
                        {newAccount.is_home_loan && newAccount.moratorium_period_months > 0 && (
                          <>
                            <div>Moratorium EMI: <span className="font-semibold">
                              ₹{(() => {
                                // Use actual bank EMI if provided, otherwise calculate
                                if (newAccount.actual_moratorium_emi) {
                                  return newAccount.actual_moratorium_emi.toLocaleString();
                                }
                                if (newAccount.disbursed_amount > 0 && newAccount.interest_rate > 0) {
                                  const monthlyRate = newAccount.interest_rate / (12 * 100);
                                  const moratoriumEmi = newAccount.disbursed_amount * monthlyRate;
                                  return Math.ceil(moratoriumEmi).toLocaleString(); // Banks round UP to next rupee
                                }
                                return '0';
                              })()}
                            </span></div>
                            <div>Sanctioned: <span className="font-semibold">₹{newAccount.sanctioned_amount.toLocaleString()}</span></div>
                            <div>Disbursed: <span className="font-semibold">₹{newAccount.disbursed_amount.toLocaleString()}</span></div>
                            {newAccount.moratorium_period_months > 0 && (
                              <div>Moratorium: <span className="font-semibold">{newAccount.moratorium_period_months} months</span></div>
                            )}
                            <div>Remaining Tenure: <span className="font-semibold">{newAccount.remaining_terms || newAccount.loan_tenure_months || 'N/A'} months</span></div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Pool Contribution and Sharing Options */}
              <div className="space-y-3 border-t pt-3">
                <Label className="text-sm font-medium">Group Sharing Options</Label>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="poolContribution"
                      checked={newAccount.is_pool_contribution}
                      onCheckedChange={(checked) => 
                        setNewAccount({...newAccount, is_pool_contribution: !!checked})
                      }
                    />
                    <Label htmlFor="poolContribution" className="text-sm">
                      Add to Group Pool (amount available to all members)
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="shareAccount"
                      checked={newAccount.is_shared}
                      onCheckedChange={(checked) => 
                        setNewAccount({...newAccount, is_shared: !!checked})
                      }
                    />
                    <Label htmlFor="shareAccount" className="text-sm">
                      Share account with group members
                    </Label>
                  </div>
                  
                  {newAccount.is_shared && (
                    <div className="ml-6">
                      <Label htmlFor="splitType" className="text-sm">Split Type</Label>
                      <Select 
                        value={newAccount.split_type} 
                        onValueChange={(value: 'equal' | 'fractional' | 'custom') => 
                          setNewAccount({...newAccount, split_type: value})
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equal">Equal Split</SelectItem>
                          <SelectItem value="fractional">Percentage Split</SelectItem>
                          <SelectItem value="custom">Custom Split</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              
              <div className="flex space-x-2">
                <Button onClick={handleAddAccount} className="flex-1">
                  Add Account
                </Button>
                <Button variant="outline" onClick={() => setShowAddAccount(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Account Dialog */}
      <Dialog open={showEditAccount} onOpenChange={setShowEditAccount}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editAccountName">Account Name *</Label>
              <Input
                id="editAccountName"
                value={editAccount.name}
                onChange={(e) => setEditAccount({...editAccount, name: e.target.value})}
                placeholder="e.g., HDFC Savings, SBI Credit Card"
              />
            </div>
            
            <div>
              <Label htmlFor="editAccountType">Account Type *</Label>
              <Select value={editAccount.type} onValueChange={(value: FinancialAccount['type']) => setEditAccount({...editAccount, type: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="savings">Savings Account</SelectItem>
                  <SelectItem value="checking">Checking Account</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="loan">Loan</SelectItem>
                  <SelectItem value="investment">Investment</SelectItem>
                  <SelectItem value="mutual_fund">Mutual Fund</SelectItem>
                  <SelectItem value="stocks">Stocks</SelectItem>
                  <SelectItem value="sip">SIP</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                  <SelectItem value="recurring">Recurring Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="editBankName">Bank/Institution</Label>
              <Input
                id="editBankName"
                value={editAccount.bank_name}
                onChange={(e) => setEditAccount({...editAccount, bank_name: e.target.value})}
                placeholder="e.g., HDFC Bank, SBI"
              />
            </div>
            
            <div>
              <Label htmlFor="editBalance">
                {editAccount.type === 'loan' ? 'Outstanding Loan Balance *' : 'Current Balance *'}
              </Label>
              <Input
                id="editBalance"
                type="number"
                value={editAccount.balance}
                onChange={(e) => setEditAccount({...editAccount, balance: Number(e.target.value)})}
                placeholder="0"
              />
              {editAccount.type === 'loan' && (
                <p className="text-xs text-gray-500 mt-1">
                  Current outstanding amount (remaining to be paid)
                </p>
              )}
            </div>
            
            {['credit_card'].includes(editAccount.type) && (
              <div>
                <Label htmlFor="editCreditLimit">Credit Limit</Label>
                <Input
                  id="editCreditLimit"
                  type="number"
                  value={editAccount.credit_limit}
                  onChange={(e) => setEditAccount({...editAccount, credit_limit: Number(e.target.value)})}
                  placeholder="0"
                />
              </div>
            )}
            
            {['loan'].includes(editAccount.type) && (
              <div className="space-y-4 border border-gray-200 rounded-lg p-4">
                <Label className="text-lg font-semibold">Loan Details</Label>
                
                {/* Loan Type Options */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="editIsInterestFree"
                      checked={editAccount.is_interest_free}
                      onCheckedChange={(checked) => 
                        setEditAccount({...editAccount, is_interest_free: !!checked, interest_rate: checked ? 0 : editAccount.interest_rate})
                      }
                    />
                    <Label htmlFor="editIsInterestFree" className="text-sm">Interest-Free Loan</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="editIsNoCostEmi"
                      checked={editAccount.is_no_cost_emi}
                      onCheckedChange={(checked) => 
                        setEditAccount({...editAccount, is_no_cost_emi: !!checked})
                      }
                    />
                    <Label htmlFor="editIsNoCostEmi" className="text-sm">No-Cost EMI</Label>
                  </div>
                </div>

                {/* Principal Amount */}
                <div>
                  <Label htmlFor="editPrincipalAmount">Principal Loan Amount *</Label>
                  <Input
                    id="editPrincipalAmount"
                    type="number"
                    value={editAccount.principal_amount}
                    onChange={(e) => setEditAccount({...editAccount, principal_amount: Number(e.target.value)})}
                    placeholder="0"
                  />
                </div>

                {/* Loan Tenure */}
                <div>
                  <Label htmlFor="editLoanTenure">Loan Tenure (months) *</Label>
                  <Input
                    id="editLoanTenure"
                    type="number"
                    value={editAccount.loan_tenure_months}
                    onChange={(e) => setEditAccount({...editAccount, loan_tenure_months: Number(e.target.value)})}
                    placeholder="0"
                  />
                </div>

                {/* Interest Rate and Type */}
                {!editAccount.is_interest_free && !editAccount.is_no_cost_emi && (
                  <>
                    <div>
                      <Label htmlFor="editInterestRate">Annual Interest Rate (%)</Label>
                      <Input
                        id="editInterestRate"
                        type="number"
                        step="0.01"
                        value={editAccount.interest_rate}
                        onChange={(e) => setEditAccount({...editAccount, interest_rate: Number(e.target.value)})}
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <Label htmlFor="editInterestType">Interest Type</Label>
                      <Select 
                        value={editAccount.interest_type} 
                        onValueChange={(value: 'simple' | 'compound' | 'reducing_balance' | 'flat_rate') => 
                          setEditAccount({...editAccount, interest_type: value})
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select interest type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="reducing_balance">Reducing Balance (Most Common)</SelectItem>
                          <SelectItem value="flat_rate">Flat Rate</SelectItem>
                          <SelectItem value="simple">Simple Interest</SelectItem>
                          <SelectItem value="compound">Compound Interest</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {/* Processing Fees */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="editProcessingFee">Processing Fee (₹)</Label>
                    <Input
                      id="editProcessingFee"
                      type="number"
                      value={editAccount.processing_fee}
                      onChange={(e) => setEditAccount({...editAccount, processing_fee: Number(e.target.value)})}
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="editProcessingFeePercentage">Processing Fee (%)</Label>
                    <Input
                      id="editProcessingFeePercentage"
                      type="number"
                      step="0.01"
                      value={editAccount.processing_fee_percentage}
                      onChange={(e) => setEditAccount({...editAccount, processing_fee_percentage: Number(e.target.value)})}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* EMI Start Date */}
                <div>
                  <Label htmlFor="editEmiStartDate">EMI Start Date</Label>
                  <Input
                    id="editEmiStartDate"
                    type="date"
                    value={editAccount.emi_start_date}
                    onChange={(e) => setEditAccount({...editAccount, emi_start_date: e.target.value})}
                  />
                </div>

                {/* Remaining Terms */}
                <div>
                  <Label htmlFor="editRemainingTerms">Remaining Terms (months)</Label>
                  <Input
                    id="editRemainingTerms"
                    type="number"
                    value={editAccount.remaining_terms}
                    onChange={(e) => setEditAccount({...editAccount, remaining_terms: Number(e.target.value)})}
                    placeholder="0"
                  />
                </div>

                {/* Home Loan Specific Fields */}
                <div className="space-y-3 border-t pt-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="editIsHomeLoan"
                      checked={editAccount.is_home_loan}
                      onCheckedChange={(checked) => {
                        const updates: any = { is_home_loan: !!checked };
                        if (checked) {
                          updates.sanctioned_amount = editAccount.principal_amount;
                          updates.moratorium_period_months = 12;
                        }
                        setEditAccount({...editAccount, ...updates});
                      }}
                    />
                    <Label htmlFor="editIsHomeLoan" className="text-sm font-medium">Home Loan</Label>
                  </div>

                  {editAccount.is_home_loan && (
                    <>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="editIsUnderConstruction"
                          checked={editAccount.is_under_construction}
                          onCheckedChange={(checked) => 
                            setEditAccount({...editAccount, is_under_construction: !!checked})
                          }
                        />
                        <Label htmlFor="editIsUnderConstruction" className="text-sm">Under Construction Property</Label>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="editSanctionedAmount">Sanctioned Amount *</Label>
                          <Input
                            id="editSanctionedAmount"
                            type="number"
                            value={editAccount.sanctioned_amount}
                            onChange={(e) => setEditAccount({...editAccount, sanctioned_amount: Number(e.target.value)})}
                            placeholder="0"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="editDisbursedAmount">Disbursed Amount</Label>
                          <Input
                            id="editDisbursedAmount"
                            type="number"
                            value={editAccount.disbursed_amount}
                            onChange={(e) => setEditAccount({...editAccount, disbursed_amount: Number(e.target.value)})}
                            placeholder="0"
                          />
                          <p className="text-xs text-gray-500 mt-1">Amount released so far</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="editMoratoriumPeriod">Moratorium Period (months)</Label>
                          <Input
                            id="editMoratoriumPeriod"
                            type="number"
                            value={editAccount.moratorium_period_months}
                            onChange={(e) => setEditAccount({...editAccount, moratorium_period_months: Number(e.target.value)})}
                            placeholder="12"
                          />
                          <p className="text-xs text-gray-500 mt-1">Interest-only payment period</p>
                        </div>

                        <div>
                          <Label htmlFor="editPossessionDate">Expected Possession</Label>
                          <Input
                            id="editPossessionDate"
                            type="date"
                            value={editAccount.possession_date}
                            onChange={(e) => setEditAccount({...editAccount, possession_date: e.target.value})}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Calculated Values (Read-only) */}
                {editAccount.monthly_emi > 0 && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <Label className="text-sm font-medium text-blue-800">Calculated EMI Details</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                      <div>Monthly EMI: <span className="font-semibold">₹{editAccount.monthly_emi.toLocaleString()}</span></div>
                      <div>Outstanding: <span className="font-semibold">₹{editAccount.balance.toLocaleString()}</span></div>
                      {editAccount.is_home_loan && editAccount.moratorium_period_months > 0 && (
                        <>
                          <div>Moratorium EMI: <span className="font-semibold">
                            ₹{(() => {
                              // Use actual bank EMI if provided, otherwise calculate
                              if (editAccount.actual_moratorium_emi) {
                                return editAccount.actual_moratorium_emi.toLocaleString();
                              }
                              if (editAccount.disbursed_amount > 0 && editAccount.interest_rate > 0) {
                                const monthlyRate = editAccount.interest_rate / (12 * 100);
                                const moratoriumEmi = editAccount.disbursed_amount * monthlyRate;
                                return Math.ceil(moratoriumEmi).toLocaleString(); // Banks round UP to next rupee
                              }
                              return '0';
                            })()}
                          </span></div>
                          <div>Sanctioned: <span className="font-semibold">₹{editAccount.sanctioned_amount.toLocaleString()}</span></div>
                          <div>Disbursed: <span className="font-semibold">₹{editAccount.disbursed_amount.toLocaleString()}</span></div>
                          {editAccount.moratorium_period_months > 0 && (
                            <div>Moratorium: <span className="font-semibold">{editAccount.moratorium_period_months} months</span></div>
                          )}
                          <div>Remaining Tenure: <span className="font-semibold">{editAccount.remaining_terms || editAccount.loan_tenure_months || 'N/A'} months</span></div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Pool Contribution and Sharing Options */}
            <div className="space-y-3 border-t pt-3">
              <Label className="text-sm font-medium">Group Sharing Options</Label>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="editPoolContribution"
                    checked={editAccount.is_pool_contribution}
                    onCheckedChange={(checked) => 
                      setEditAccount({...editAccount, is_pool_contribution: !!checked})
                    }
                  />
                  <Label htmlFor="editPoolContribution" className="text-sm">
                    Add to Group Pool (amount available to all members)
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="editShareAccount"
                    checked={editAccount.is_shared}
                    onCheckedChange={(checked) => 
                      setEditAccount({...editAccount, is_shared: !!checked})
                    }
                  />
                  <Label htmlFor="editShareAccount" className="text-sm">
                    Share account with group members
                  </Label>
                </div>
                
                {editAccount.is_shared && (
                  <div className="ml-6">
                    <Label htmlFor="editSplitType" className="text-sm">Split Type</Label>
                    <Select 
                      value={editAccount.split_type} 
                      onValueChange={(value: 'equal' | 'fractional' | 'custom') => 
                        setEditAccount({...editAccount, split_type: value})
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equal">Equal Split</SelectItem>
                        <SelectItem value="fractional">Percentage Split</SelectItem>
                        <SelectItem value="custom">Custom Split</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            
            <div className="flex space-x-2">
              <Button onClick={handleUpdateAccount} className="flex-1">
                Update Account
              </Button>
              <Button variant="outline" onClick={() => setShowEditAccount(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
            <div className={`text-2xl font-bold ${financialSummary.netWorth >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {financialSummary.netWorth >= 0 ? '+' : ''}₹{financialSummary.netWorth.toLocaleString()}
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
              ₹{financialSummary.totalAssets.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              Savings + Investments
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
              ₹{financialSummary.totalLiabilities.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              Loans + Credit Cards
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Wallet className="h-4 w-4 mr-2" />
              Liquid Cash
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              ₹{financialSummary.liquidCash.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              Available cash
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different account types */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="cash">Cash</TabsTrigger>
          <TabsTrigger value="cards">Credit Cards</TabsTrigger>
          <TabsTrigger value="loans">Loans</TabsTrigger>
          <TabsTrigger value="investments">Investments</TabsTrigger>
          <TabsTrigger value="insurance">Insurance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {accounts.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Assets Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                    Assets Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {accounts.filter(a => !['credit_card', 'loan'].includes(a.type)).map((account) => (
                      <div key={account.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm">{account.name}</span>
                        </div>
                        <span className="text-sm font-medium text-green-600">
                          ₹{account.balance.toLocaleString()}
                        </span>
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex items-center justify-between font-medium">
                        <span>Total Assets</span>
                        <span className="text-green-600">₹{financialSummary.totalAssets.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Liabilities Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingDown className="h-5 w-5 mr-2 text-red-600" />
                    Liabilities Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {accounts.filter(a => ['credit_card', 'loan'].includes(a.type)).length > 0 ? (
                    <div className="space-y-3">
                      {accounts.filter(a => ['credit_card', 'loan'].includes(a.type)).map((account) => (
                        <div key={account.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-sm">{account.name}</span>
                          </div>
                          <span className="text-sm font-medium text-red-600">
                            ₹{account.balance.toLocaleString()}
                          </span>
                        </div>
                      ))}
                      <div className="border-t pt-2 mt-2">
                        <div className="flex items-center justify-between font-medium">
                          <span>Total Liabilities</span>
                          <span className="text-red-600">₹{financialSummary.totalLiabilities.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      <p className="text-sm">No liabilities found</p>
                      <p className="text-xs">Great! You have no debts.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Account Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-500 py-8">
                  <Wallet className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No accounts found</p>
                  <p className="text-sm">Add your first account to get started</p>
                  <Button variant="outline" className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="accounts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Bank Accounts
                <Button size="sm" onClick={() => setShowAddAccount(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Account
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {accounts.filter(a => ['savings', 'checking'].includes(a.type)).length > 0 ? (
                <div className="space-y-4">
                  {accounts.filter(a => ['savings', 'checking'].includes(a.type)).map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Wallet className="h-5 w-5 text-blue-600" />
                        <div>
                          <h3 className="font-medium">{account.name}</h3>
                          <p className="text-sm text-gray-500">
                            {account.bank_name} • {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="text-lg font-semibold text-green-600">
                            ₹{account.balance.toLocaleString()}
                          </div>
                          {account.is_pool_contribution && (
                            <Badge variant="secondary" className="text-xs">
                              Pool Contribution
                            </Badge>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Edit clicked for account:', account.name);
                                handleEditAccount(account);
                              }}
                            >
                              <Edit2 className="h-4 w-4 mr-2" />
                              Edit Account
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteAccount(account.id, account.name)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Account
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Wallet className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No bank accounts found</p>
                  <p className="text-sm">Add your savings or checking accounts to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cash">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Cash & Liquid Money
                <Button size="sm" onClick={() => { setNewAccount({...newAccount, type: 'cash'}); setShowAddAccount(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Cash Account
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {accounts.filter(a => a.type === 'cash').length > 0 ? (
                <div className="space-y-4">
                  {accounts.filter(a => a.type === 'cash').map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <div>
                          <h3 className="font-medium">{account.name}</h3>
                          <p className="text-sm text-gray-500">
                            Cash • {account.bank_name || 'Physical Cash'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="text-lg font-semibold text-green-600">
                            ₹{account.balance.toLocaleString()}
                          </div>
                          {account.is_pool_contribution && (
                            <Badge variant="secondary" className="text-xs">
                              Pool Contribution
                            </Badge>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Edit clicked for account:', account.name);
                                handleEditAccount(account);
                              }}
                            >
                              <Edit2 className="h-4 w-4 mr-2" />
                              Edit Account
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteAccount(account.id, account.name)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Account
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-3 mt-3">
                    <div className="flex items-center justify-between font-medium">
                      <span>Total Liquid Cash</span>
                      <span className="text-green-600">₹{financialSummary.liquidCash.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No cash accounts found</p>
                  <p className="text-sm">Add your cash on hand, petty cash, or liquid money</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cards">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Credit Cards
                <Button size="sm" onClick={() => { setNewAccount({...newAccount, type: 'credit_card'}); setShowAddAccount(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Credit Card
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {accounts.filter(a => a.type === 'credit_card').length > 0 ? (
                <div className="space-y-4">
                  {accounts.filter(a => a.type === 'credit_card').map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CreditCardIcon className="h-5 w-5 text-orange-600" />
                        <div>
                          <h3 className="font-medium">{account.name}</h3>
                          <p className="text-sm text-gray-500">
                            {account.bank_name} • Limit: ₹{account.credit_limit?.toLocaleString() || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="text-lg font-semibold text-red-600">
                            ₹{account.balance.toLocaleString()}
                          </div>
                          {account.credit_limit && (
                            <div className="text-xs text-gray-500">
                              {((account.balance / account.credit_limit) * 100).toFixed(1)}% used
                            </div>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Edit clicked for account:', account.name);
                                handleEditAccount(account);
                              }}
                            >
                              <Edit2 className="h-4 w-4 mr-2" />
                              Edit Account
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteAccount(account.id, account.name)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Account
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <CreditCardIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No credit cards found</p>
                  <p className="text-sm">Add your credit cards to track balances and limits</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loans">
          <div className="space-y-6">
            {/* Loans Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Loans & EMIs
                  <Button size="sm" onClick={() => { setNewAccount({...newAccount, type: 'loan'}); setShowAddAccount(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Loan
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {accounts.filter(a => a.type === 'loan').length > 0 ? (
                  <div className="space-y-4">
                    {accounts.filter(a => a.type === 'loan').map((account) => (
                      <div key={account.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <Building className="h-5 w-5 text-red-600" />
                            <div>
                              <h3 className="font-medium">{account.name}</h3>
                              <p className="text-sm text-gray-500">
                                {account.bank_name} • {account.interest_rate ? `${account.interest_rate}% APR` : 'Loan'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <div className="text-lg font-semibold text-red-600">
                                ₹{account.balance.toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-500">Outstanding</div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log('Edit clicked for account:', account.name);
                                    handleEditAccount(account);
                                  }}
                                >
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  Edit Account
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteAccount(account.id, account.name)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Account
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        
                        {/* EMI Details */}
                        <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t text-sm">
                          <div>
                            <span className="text-gray-500">Monthly EMI</span>
                            <p className="font-medium">₹{(account.monthly_emi || 0).toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Next Due</span>
                            <p className="font-medium">{account.next_due_date || 'Not set'}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Remaining Terms</span>
                            <p className="font-medium">{account.remaining_terms || 'N/A'} months</p>
                          </div>
                        </div>
                        
                        {/* EMI Action Button */}
                        {account.monthly_emi && (
                          <div className="mt-3 pt-3 border-t">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEMIPayment(account.id)}
                              className="text-green-600 hover:bg-green-50"
                            >
                              Pay EMI ₹{account.monthly_emi.toLocaleString()}
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No loans found</p>
                    <p className="text-sm">Add your loans and EMIs to track outstanding amounts</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Monthly Recurring Payments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Monthly Recurring Payments
                  <Button size="sm" onClick={() => { setNewAccount({...newAccount, type: 'recurring'}); setShowAddAccount(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Recurring Payment
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {accounts.filter(a => a.type === 'recurring').length > 0 ? (
                  <div className="space-y-3">
                    {accounts.filter(a => a.type === 'recurring').map((account) => (
                      <div key={account.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <div>
                            <h4 className="font-medium text-sm">{account.name}</h4>
                            <p className="text-xs text-gray-500">
                              Next: {account.next_due_date || 'Not set'} • {account.frequency || 'Monthly'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="text-right">
                            <div className="font-medium text-orange-600">
                              ₹{account.balance.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">per month</div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleRecurringPayment(account.id)}
                              className="text-orange-600 hover:bg-orange-50 mt-1"
                            >
                              Pay Now
                            </Button>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => console.log('Dropdown trigger clicked')}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('Edit clicked for account:', account.name);
                                  handleEditAccount(account);
                                }}
                              >
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit Payment
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteAccount(account.id, account.name)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Payment
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                    <div className="border-t pt-3 mt-3">
                      <div className="flex items-center justify-between font-medium">
                        <span>Total Monthly Recurring</span>
                        <span className="text-orange-600">
                          ₹{accounts.filter(a => a.type === 'recurring').reduce((sum, a) => sum + a.balance, 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-6">
                    <div className="w-8 h-8 bg-gray-300 rounded-full mx-auto mb-3"></div>
                    <p className="text-sm font-medium">No recurring payments</p>
                    <p className="text-xs">Add subscriptions, utilities, or other monthly payments</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="investments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Investments
                <Button size="sm" onClick={() => { setNewAccount({...newAccount, type: 'investment'}); setShowAddAccount(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Investment
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {accounts.filter(a => ['investment', 'mutual_fund', 'stocks', 'sip'].includes(a.type)).length > 0 ? (
                <div className="space-y-4">
                  {accounts.filter(a => ['investment', 'mutual_fund', 'stocks', 'sip'].includes(a.type)).map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        <div>
                          <h3 className="font-medium">{account.name}</h3>
                          <p className="text-sm text-gray-500">
                            {account.bank_name || 'Investment'} • {account.type.charAt(0).toUpperCase() + account.type.slice(1).replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="text-lg font-semibold text-green-600">
                            ₹{account.balance.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">Current Value</div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              const newBalance = prompt(`Enter new balance for ${account.name}:`, account.balance.toString());
                              if (newBalance && !isNaN(Number(newBalance))) {
                                handleInvestmentUpdate(account.id, Number(newBalance));
                              }
                            }}
                            className="text-green-600 hover:bg-green-50 mt-1"
                          >
                            Update Value
                          </Button>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Edit clicked for account:', account.name);
                                handleEditAccount(account);
                              }}
                            >
                              <Edit2 className="h-4 w-4 mr-2" />
                              Edit Investment
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteAccount(account.id, account.name)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Investment
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No investments found</p>
                  <p className="text-sm">Add your investments, mutual funds, and SIPs</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insurance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Insurance Policies
                <Button size="sm" onClick={() => { setNewAccount({...newAccount, type: 'insurance'}); setShowAddAccount(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Policy
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {accounts.filter(a => ['insurance', 'life_insurance', 'health_insurance'].includes(a.type)).length > 0 ? (
                <div className="space-y-4">
                  {accounts.filter(a => ['insurance', 'life_insurance', 'health_insurance'].includes(a.type)).map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Building className="h-5 w-5 text-blue-600" />
                        <div>
                          <h3 className="font-medium">{account.name}</h3>
                          <p className="text-sm text-gray-500">
                            {account.bank_name || 'Insurance'} • {account.type.charAt(0).toUpperCase() + account.type.slice(1).replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="text-lg font-semibold text-blue-600">
                            ₹{account.balance.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">Coverage/Premium</div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Edit clicked for account:', account.name);
                                handleEditAccount(account);
                              }}
                            >
                              <Edit2 className="h-4 w-4 mr-2" />
                              Edit Policy
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteAccount(account.id, account.name)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Policy
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No insurance policies found</p>
                  <p className="text-sm">Add your insurance policies to track coverage</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedAccountsNew;