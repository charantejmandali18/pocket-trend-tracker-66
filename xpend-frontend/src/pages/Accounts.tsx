import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Wallet, 
  CreditCard as CreditCardIcon,
  Building,
  Plus,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Home,
  Car,
  Shield,
  Briefcase,
  Repeat,
  Calendar,
  Target,
  PieChart,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Edit2,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { accountService, Account, AccountCreateRequest } from '@/services/accountService';
import { creditCardService, CreditCard, CreditCardCreateRequest } from '@/services/creditCardService';
import { loanService, Loan, LoanCreateRequest } from '@/services/loanService';
import { investmentService, Investment, InvestmentCreateRequest } from '@/services/investmentService';
import { insuranceService, Insurance, InsuranceCreateRequest } from '@/services/insuranceService';
import { propertyService, Property, PropertyCreateRequest } from '@/services/propertyService';
import { recurringPaymentService, RecurringPayment, RecurringPaymentCreateRequest } from '@/services/recurringPaymentService';

const Accounts = () => {
  const user = { id: 1 }; // Mock user
  const isPersonalMode = true;
  const currentGroup = null;
  const userGroups = [];
  const dataVersion = 1;
  const refreshData = () => {}; // Mock function
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // All financial modules from backend services
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [insurance, setInsurance] = useState<Insurance[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [recurringPayments, setRecurringPayments] = useState<RecurringPayment[]>([]);
  
  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState<string | null>(null);
  const [showEditDialog, setShowEditDialog] = useState<string | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [loanToDelete, setLoanToDelete] = useState<Loan | null>(null);
  const [editingRecurringPayment, setEditingRecurringPayment] = useState<RecurringPayment | null>(null);
  const [recurringPaymentToDelete, setRecurringPaymentToDelete] = useState<RecurringPayment | null>(null);
  
  // Additional edit/delete states for other modules
  const [editingCreditCard, setEditingCreditCard] = useState<CreditCard | null>(null);
  const [creditCardToDelete, setCreditCardToDelete] = useState<CreditCard | null>(null);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [investmentToDelete, setInvestmentToDelete] = useState<Investment | null>(null);
  const [editingInsurance, setEditingInsurance] = useState<Insurance | null>(null);
  const [insuranceToDelete, setInsuranceToDelete] = useState<Insurance | null>(null);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  
  // Form states for different modules
  const [creditCardForm, setCreditCardForm] = useState<CreditCardCreateRequest>({
    name: '', bankName: '', cardNumberLast4: '', creditLimit: 0, currentBalance: 0,
    interestRate: 0, annualFee: 0, dueDate: 1, minimumPayment: 0, statementDate: 1
  });
  
  const [loanForm, setLoanForm] = useState<LoanCreateRequest>({
    name: '', loanType: 'home', bankName: '', principalAmount: 0, currentBalance: 0,
    interestRate: 0, tenureMonths: 0, emiAmount: 0, emiDate: 1, startDate: '', endDate: ''
  });

  // Enhanced loan state for home loan calculations
  const [loanCalculations, setLoanCalculations] = useState({
    monthlyEmi: 0,
    totalInterest: 0,
    totalPayment: 0,
    yearlyEmi: 0
  });
  
  const [investmentForm, setInvestmentForm] = useState<InvestmentCreateRequest>({
    name: '', investmentType: 'mutual_fund', platform: '', investedAmount: 0, currentValue: 0,
    sipAmount: 0, sipDate: 1, maturityDate: ''
  });
  
  const [insuranceForm, setInsuranceForm] = useState<InsuranceCreateRequest>({
    name: '', policyType: 'life', companyName: '', policyNumber: '', sumAssured: 0,
    premiumAmount: 0, premiumFrequency: 'monthly', premiumDueDate: 1,
    policyStartDate: '', policyEndDate: '', nominees: ['']
  });
  
  const [propertyForm, setPropertyForm] = useState<PropertyCreateRequest>({
    name: '', propertyType: 'residential', address: '', purchasePrice: 0, currentValue: 0,
    ownershipPercentage: 100, rentalIncome: 0, propertyTax: 0, maintenanceCost: 0, purchaseDate: ''
  });
  
  const [recurringForm, setRecurringForm] = useState<RecurringPaymentCreateRequest>({
    name: '', description: '', amount: 0, frequency: 'monthly', categoryId: '',
    paymentDate: 1, startDate: '', autoCreateTransaction: true
  });

  // Basic account form
  const [accountForm, setAccountForm] = useState<AccountCreateRequest>({
    accountName: '',
    accountType: 'SAVINGS',
    bankName: '',
    accountNumber: '',
    balance: 0,
    creditLimit: 0,
    interestRate: 0
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  // EMI calculation function for loans
  const calculateEMI = (principal: number, rate: number, tenure: number) => {
    if (!principal || !rate || !tenure) return { monthlyEmi: 0, totalInterest: 0, totalPayment: 0, yearlyEmi: 0 };
    
    const monthlyRate = rate / (12 * 100);
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / 
                (Math.pow(1 + monthlyRate, tenure) - 1);
    
    const totalPayment = emi * tenure;
    const totalInterest = totalPayment - principal;
    const yearlyEmi = emi * 12;
    
    return {
      monthlyEmi: Math.round(emi),
      totalInterest: Math.round(totalInterest),
      totalPayment: Math.round(totalPayment),
      yearlyEmi: Math.round(yearlyEmi)
    };
  };

  // Update loan calculations when form values change
  useEffect(() => {
    const calculations = calculateEMI(loanForm.principalAmount, loanForm.interestRate, loanForm.tenureMonths);
    setLoanCalculations(calculations);
    setLoanForm(prev => ({ ...prev, emiAmount: calculations.monthlyEmi }));
  }, [loanForm.principalAmount, loanForm.interestRate, loanForm.tenureMonths]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      console.log('Fetching all financial data from backend services...');
      
      // Fetch all financial modules from their respective backend services
      const [
        backendAccounts,
        backendCreditCards,
        backendLoans,
        backendInvestments,
        backendInsurance,
        backendProperties,
        backendRecurringPayments
      ] = await Promise.allSettled([
        accountService.getAllAccounts(),
        creditCardService.getAllCreditCards(),
        loanService.getAllLoans(),
        investmentService.getAllInvestments(),
        insuranceService.getAllInsurance(),
        propertyService.getAllProperties(),
        recurringPaymentService.getAllRecurringPayments()
      ]);

      // Set data from successful backend calls, with fallback to empty arrays
      setAccounts(backendAccounts.status === 'fulfilled' ? backendAccounts.value : []);
      setCreditCards(backendCreditCards.status === 'fulfilled' ? backendCreditCards.value : []);
      setLoans(backendLoans.status === 'fulfilled' ? backendLoans.value : []);
      setInvestments(backendInvestments.status === 'fulfilled' ? backendInvestments.value : []);
      setInsurance(backendInsurance.status === 'fulfilled' ? backendInsurance.value : []);
      setProperties(backendProperties.status === 'fulfilled' ? backendProperties.value : []);
      setRecurringPayments(backendRecurringPayments.status === 'fulfilled' ? backendRecurringPayments.value : []);

      console.log('Financial data loaded:', {
        accounts: backendAccounts.status === 'fulfilled' ? backendAccounts.value.length : 0,
        creditCards: backendCreditCards.status === 'fulfilled' ? backendCreditCards.value.length : 0,
        loans: backendLoans.status === 'fulfilled' ? backendLoans.value.length : 0,
        investments: backendInvestments.status === 'fulfilled' ? backendInvestments.value.length : 0,
        insurance: backendInsurance.status === 'fulfilled' ? backendInsurance.value.length : 0,
        properties: backendProperties.status === 'fulfilled' ? backendProperties.value.length : 0,
        recurringPayments: backendRecurringPayments.status === 'fulfilled' ? backendRecurringPayments.value.length : 0
      });
      
    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch some financial data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async () => {
    if (!accountForm.accountName.trim()) {
      toast({
        title: "Error",
        description: "Please enter an account name",
        variant: "destructive",
      });
      return;
    }

    try {
      const account = await accountService.createAccount(accountForm);
      setAccounts(prev => [...prev, account]);
      setAccountForm({
        accountName: '',
        accountType: 'SAVINGS',
        bankName: '',
        accountNumber: '',
        balance: 0,
        creditLimit: 0,
        interestRate: 0
      });
      setShowAddDialog(null);
      
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

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setAccountForm({
      accountName: account.accountName,
      accountType: account.accountType,
      bankName: account.bankName || '',
      accountNumber: account.accountNumber || '',
      balance: account.balance,
      creditLimit: account.creditLimit || 0,
      interestRate: account.interestRate || 0
    });
    setShowEditDialog('account');
  };

  const handleUpdateAccount = async () => {
    if (!editingAccount || !accountForm.accountName.trim()) {
      toast({
        title: "Error",
        description: "Please enter an account name",
        variant: "destructive",
      });
      return;
    }

    try {
      const updatedAccount = await accountService.updateAccount(editingAccount.id, accountForm);
      setAccounts(prev => prev.map(acc => acc.id === editingAccount.id ? updatedAccount : acc));
      setEditingAccount(null);
      setAccountForm({
        accountName: '',
        accountType: 'SAVINGS',
        bankName: '',
        accountNumber: '',
        balance: 0,
        creditLimit: 0,
        interestRate: 0
      });
      setShowEditDialog(null);
      
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

  const handleDeleteAccount = (account: Account) => {
    setAccountToDelete(account);
    setShowDeleteDialog(true);
  };

  const confirmDeleteAccount = async () => {
    if (!accountToDelete) return;

    try {
      await accountService.deleteAccount(accountToDelete.id);
      setAccounts(prev => prev.filter(acc => acc.id !== accountToDelete.id));
      setShowDeleteDialog(false);
      setAccountToDelete(null);
      
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

  const cancelDeleteAccount = () => {
    setShowDeleteDialog(false);
    setAccountToDelete(null);
  };

  // Loan handlers
  const handleEditLoan = (loan: Loan) => {
    setEditingLoan(loan);
    setLoanForm({
      name: loan.name,
      loanType: loan.loanType,
      bankName: loan.bankName,
      principalAmount: loan.principalAmount,
      currentBalance: loan.currentBalance,
      interestRate: loan.interestRate,
      tenureMonths: loan.tenureMonths,
      emiAmount: loan.emiAmount,
      emiDate: loan.emiDate,
      startDate: loan.startDate,
      endDate: loan.endDate
    });
    setShowEditDialog('loan');
  };

  const handleUpdateLoan = async () => {
    if (!editingLoan || !loanForm.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a loan name",
        variant: "destructive",
      });
      return;
    }

    try {
      const updatedLoan = await loanService.updateLoan(editingLoan.id, loanForm);
      setLoans(prev => prev.map(loan => loan.id === editingLoan.id ? updatedLoan : loan));
      setEditingLoan(null);
      setLoanForm({
        name: '', loanType: 'home', bankName: '', principalAmount: 0, currentBalance: 0,
        interestRate: 0, tenureMonths: 0, emiAmount: 0, emiDate: 1, startDate: '', endDate: ''
      });
      setShowEditDialog(null);
      
      toast({
        title: "Success",
        description: "Loan updated successfully",
      });
    } catch (error) {
      console.error('Error updating loan:', error);
      toast({
        title: "Error",
        description: "Failed to update loan",
        variant: "destructive",
      });
    }
  };

  const handleDeleteLoan = (loan: Loan) => {
    setLoanToDelete(loan);
    setShowDeleteDialog(true);
  };

  const confirmDeleteLoan = async () => {
    if (!loanToDelete) return;

    try {
      await loanService.deleteLoan(loanToDelete.id);
      setLoans(prev => prev.filter(loan => loan.id !== loanToDelete.id));
      setShowDeleteDialog(false);
      setLoanToDelete(null);
      
      toast({
        title: "Success",
        description: "Loan deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting loan:', error);
      toast({
        title: "Error",
        description: "Failed to delete loan",
        variant: "destructive",
      });
    }
  };

  // Recurring Payment handlers
  const handleEditRecurringPayment = (payment: RecurringPayment) => {
    setEditingRecurringPayment(payment);
    setRecurringForm({
      name: payment.name,
      description: payment.description,
      amount: payment.amount,
      frequency: payment.frequency,
      categoryId: payment.categoryId,
      paymentDate: payment.paymentDate,
      startDate: payment.startDate,
      autoCreateTransaction: payment.autoCreateTransaction
    });
    setShowEditDialog('recurring');
  };

  const handleUpdateRecurringPayment = async () => {
    if (!editingRecurringPayment || !recurringForm.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a payment name",
        variant: "destructive",
      });
      return;
    }

    try {
      const updatedPayment = await recurringPaymentService.updateRecurringPayment(editingRecurringPayment.id, recurringForm);
      setRecurringPayments(prev => prev.map(payment => payment.id === editingRecurringPayment.id ? updatedPayment : payment));
      setEditingRecurringPayment(null);
      setRecurringForm({
        name: '', description: '', amount: 0, frequency: 'monthly', categoryId: '',
        paymentDate: 1, startDate: '', autoCreateTransaction: true
      });
      setShowEditDialog(null);
      
      toast({
        title: "Success",
        description: "Recurring payment updated successfully",
      });
    } catch (error) {
      console.error('Error updating recurring payment:', error);
      toast({
        title: "Error",
        description: "Failed to update recurring payment",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRecurringPayment = (payment: RecurringPayment) => {
    setRecurringPaymentToDelete(payment);
    setShowDeleteDialog(true);
  };

  const confirmDeleteRecurringPayment = async () => {
    if (!recurringPaymentToDelete) return;

    try {
      await recurringPaymentService.deleteRecurringPayment(recurringPaymentToDelete.id);
      setRecurringPayments(prev => prev.filter(payment => payment.id !== recurringPaymentToDelete.id));
      setShowDeleteDialog(false);
      setRecurringPaymentToDelete(null);
      
      toast({
        title: "Success",
        description: "Recurring payment deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting recurring payment:', error);
      toast({
        title: "Error",
        description: "Failed to delete recurring payment",
        variant: "destructive",
      });
    }
  };

  const handleAddCreditCard = async () => {
    if (!creditCardForm.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a credit card name",
        variant: "destructive",
      });
      return;
    }

    try {
      const newCard = await creditCardService.createCreditCard(creditCardForm);
      setCreditCards(prev => [...prev, newCard]);
      setCreditCardForm({
        name: '', bankName: '', cardNumberLast4: '', creditLimit: 0, currentBalance: 0,
        interestRate: 0, annualFee: 0, dueDate: 1, minimumPayment: 0, statementDate: 1
      });
      setShowAddDialog(null);
      
      toast({
        title: "Success",
        description: "Credit card added successfully",
      });
    } catch (error) {
      console.error('Error adding credit card:', error);
      toast({
        title: "Error",
        description: "Failed to add credit card",
        variant: "destructive",
      });
    }
  };

  const handleAddLoan = async () => {
    if (!loanForm.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a loan name",
        variant: "destructive",
      });
      return;
    }

    try {
      const newLoan = await loanService.createLoan(loanForm);
      setLoans(prev => [...prev, newLoan]);
      setLoanForm({
        name: '', loanType: 'home', bankName: '', principalAmount: 0, currentBalance: 0,
        interestRate: 0, tenureMonths: 0, emiAmount: 0, emiDate: 1, startDate: '', endDate: ''
      });
      setShowAddDialog(null);
      
      toast({
        title: "Success",
        description: "Loan added successfully",
      });
    } catch (error) {
      console.error('Error adding loan:', error);
      toast({
        title: "Error",
        description: "Failed to add loan",
        variant: "destructive",
      });
    }
  };

  const handleAddInvestment = async () => {
    if (!investmentForm.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter an investment name",
        variant: "destructive",
      });
      return;
    }

    try {
      const newInvestment = await investmentService.createInvestment(investmentForm);
      setInvestments(prev => [...prev, newInvestment]);
      setInvestmentForm({
        name: '', investmentType: 'mutual_fund', platform: '', investedAmount: 0, currentValue: 0,
        sipAmount: 0, sipDate: 1, maturityDate: ''
      });
      setShowAddDialog(null);
      
      toast({
        title: "Success",
        description: "Investment added successfully",
      });
    } catch (error) {
      console.error('Error adding investment:', error);
      toast({
        title: "Error",
        description: "Failed to add investment",
        variant: "destructive",
      });
    }
  };

  const handleAddInsurance = async () => {
    if (!insuranceForm.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter an insurance policy name",
        variant: "destructive",
      });
      return;
    }

    try {
      const newInsurance = await insuranceService.createInsurance(insuranceForm);
      setInsurance(prev => [...prev, newInsurance]);
      setInsuranceForm({
        name: '', policyType: 'life', companyName: '', policyNumber: '', sumAssured: 0,
        premiumAmount: 0, premiumFrequency: 'monthly', premiumDueDate: 1,
        policyStartDate: '', policyEndDate: '', nominees: ['']
      });
      setShowAddDialog(null);
      
      toast({
        title: "Success",
        description: "Insurance policy added successfully",
      });
    } catch (error) {
      console.error('Error adding insurance:', error);
      toast({
        title: "Error",
        description: "Failed to add insurance policy",
        variant: "destructive",
      });
    }
  };

  const handleAddProperty = async () => {
    if (!propertyForm.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a property name",
        variant: "destructive",
      });
      return;
    }

    try {
      const newProperty = await propertyService.createProperty(propertyForm);
      setProperties(prev => [...prev, newProperty]);
      setPropertyForm({
        name: '', propertyType: 'residential', address: '', purchasePrice: 0, currentValue: 0,
        ownershipPercentage: 100, rentalIncome: 0, propertyTax: 0, maintenanceCost: 0, purchaseDate: ''
      });
      setShowAddDialog(null);
      
      toast({
        title: "Success",
        description: "Property added successfully",
      });
    } catch (error) {
      console.error('Error adding property:', error);
      toast({
        title: "Error",
        description: "Failed to add property",
        variant: "destructive",
      });
    }
  };

  const handleAddRecurringPayment = async () => {
    if (!recurringForm.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a recurring payment name",
        variant: "destructive",
      });
      return;
    }

    try {
      const newRecurring = await recurringPaymentService.createRecurringPayment(recurringForm);
      setRecurringPayments(prev => [...prev, newRecurring]);
      setRecurringForm({
        name: '', description: '', amount: 0, frequency: 'monthly', categoryId: '',
        paymentDate: 1, startDate: '', autoCreateTransaction: true
      });
      setShowAddDialog(null);
      
      toast({
        title: "Success",
        description: "Recurring payment added successfully",
      });
    } catch (error) {
      console.error('Error adding recurring payment:', error);
      toast({
        title: "Error",
        description: "Failed to add recurring payment",
        variant: "destructive",
      });
    }
  };

  // Additional confirm delete handlers
  const confirmDeleteCreditCard = async () => {
    if (!creditCardToDelete) return;

    try {
      await creditCardService.deleteCreditCard(creditCardToDelete.id);
      setCreditCards(prev => prev.filter(card => card.id !== creditCardToDelete.id));
      setShowDeleteDialog(false);
      setCreditCardToDelete(null);
      
      toast({
        title: "Success",
        description: "Credit card deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting credit card:', error);
      toast({
        title: "Error",
        description: "Failed to delete credit card",
        variant: "destructive",
      });
    }
  };

  const confirmDeleteInvestment = async () => {
    if (!investmentToDelete) return;

    try {
      await investmentService.deleteInvestment(investmentToDelete.id);
      setInvestments(prev => prev.filter(investment => investment.id !== investmentToDelete.id));
      setShowDeleteDialog(false);
      setInvestmentToDelete(null);
      
      toast({
        title: "Success",
        description: "Investment deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting investment:', error);
      toast({
        title: "Error",
        description: "Failed to delete investment",
        variant: "destructive",
      });
    }
  };

  const confirmDeleteInsurance = async () => {
    if (!insuranceToDelete) return;

    try {
      await insuranceService.deleteInsurance(insuranceToDelete.id);
      setInsurance(prev => prev.filter(policy => policy.id !== insuranceToDelete.id));
      setShowDeleteDialog(false);
      setInsuranceToDelete(null);
      
      toast({
        title: "Success",
        description: "Insurance policy deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting insurance:', error);
      toast({
        title: "Error",
        description: "Failed to delete insurance policy",
        variant: "destructive",
      });
    }
  };

  const confirmDeleteProperty = async () => {
    if (!propertyToDelete) return;

    try {
      await propertyService.deleteProperty(propertyToDelete.id);
      setProperties(prev => prev.filter(property => property.id !== propertyToDelete.id));
      setShowDeleteDialog(false);
      setPropertyToDelete(null);
      
      toast({
        title: "Success",
        description: "Property deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting property:', error);
      toast({
        title: "Error",
        description: "Failed to delete property",
        variant: "destructive",
      });
    }
  };

  // Credit Card edit/delete handlers
  const handleEditCreditCard = (creditCard: CreditCard) => {
    setEditingCreditCard(creditCard);
    setCreditCardForm({
      name: creditCard.name,
      bankName: creditCard.bankName,
      cardNumberLast4: creditCard.cardNumberLast4,
      creditLimit: creditCard.creditLimit,
      currentBalance: creditCard.currentBalance,
      interestRate: creditCard.interestRate,
      annualFee: creditCard.annualFee,
      dueDate: creditCard.dueDate,
      minimumPayment: creditCard.minimumPayment,
      statementDate: creditCard.statementDate
    });
    setShowEditDialog('creditCard');
  };

  const handleDeleteCreditCard = (creditCard: CreditCard) => {
    setCreditCardToDelete(creditCard);
    setShowDeleteDialog(true);
  };

  // Investment edit/delete handlers
  const handleEditInvestment = (investment: Investment) => {
    setEditingInvestment(investment);
    setInvestmentForm({
      name: investment.name,
      investmentType: investment.investmentType,
      platform: investment.platform,
      investedAmount: investment.investedAmount,
      currentValue: investment.currentValue,
      sipAmount: investment.sipAmount || 0,
      sipDate: investment.sipDate || 1,
      maturityDate: investment.maturityDate || ''
    });
    setShowEditDialog('investment');
  };

  const handleDeleteInvestment = (investment: Investment) => {
    setInvestmentToDelete(investment);
    setShowDeleteDialog(true);
  };

  // Insurance edit/delete handlers
  const handleEditInsurance = (insurance: Insurance) => {
    setEditingInsurance(insurance);
    setInsuranceForm({
      name: insurance.name,
      policyType: insurance.policyType,
      companyName: insurance.companyName,
      policyNumber: insurance.policyNumber,
      sumAssured: insurance.sumAssured,
      premiumAmount: insurance.premiumAmount,
      premiumFrequency: insurance.premiumFrequency,
      premiumDueDate: insurance.premiumDueDate,
      policyStartDate: insurance.policyStartDate,
      policyEndDate: insurance.policyEndDate,
      nominees: insurance.nominees
    });
    setShowEditDialog('insurance');
  };

  const handleDeleteInsurance = (insurance: Insurance) => {
    setInsuranceToDelete(insurance);
    setShowDeleteDialog(true);
  };

  // Property edit/delete handlers
  const handleEditProperty = (property: Property) => {
    setEditingProperty(property);
    setPropertyForm({
      name: property.name,
      propertyType: property.propertyType,
      address: property.address,
      purchasePrice: property.purchasePrice,
      currentValue: property.currentValue,
      ownershipPercentage: property.ownershipPercentage,
      rentalIncome: property.rentalIncome || 0,
      propertyTax: property.propertyTax || 0,
      maintenanceCost: property.maintenanceCost || 0,
      purchaseDate: property.purchaseDate
    });
    setShowEditDialog('property');
  };

  const handleDeleteProperty = (property: Property) => {
    setPropertyToDelete(property);
    setShowDeleteDialog(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Financial Modules</h1>
        </div>
        <div className="text-center py-8">Loading financial data...</div>
      </div>
    );
  }

  // Calculate totals
  const totalAssets = accounts
    .filter(a => !['CREDIT_CARD', 'LOAN'].includes(a.type))
    .reduce((sum, a) => sum + a.balance, 0) +
    investments.reduce((sum, inv) => sum + inv.currentValue, 0) +
    properties.reduce((sum, prop) => sum + prop.currentValue, 0);

  const totalLiabilities = creditCards.reduce((sum, cc) => sum + cc.currentBalance, 0) +
    loans.reduce((sum, loan) => sum + loan.currentBalance, 0) +
    accounts
      .filter(a => ['CREDIT_CARD', 'LOAN'].includes(a.type))
      .reduce((sum, a) => sum + a.balance, 0);

  const netWorth = totalAssets - totalLiabilities;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Financial Modules
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive financial management across all categories
          </p>
        </div>
      </div>

      {/* Net Worth Summary */}
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
              Total Assets - Total Liabilities
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
              Accounts + Investments + Properties
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="credit_cards">Credit Cards</TabsTrigger>
          <TabsTrigger value="loans">Loans</TabsTrigger>
          <TabsTrigger value="investments">Investments</TabsTrigger>
          <TabsTrigger value="insurance">Insurance</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="recurring">EMI/Recurring</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Basic Accounts Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Building className="h-4 w-4 mr-2 text-blue-600" />
                  Bank Accounts ({accounts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-blue-600">
                  ₹{accounts.reduce((sum, acc) => sum + acc.balance, 0).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">Total Balance</div>
              </CardContent>
            </Card>

            {/* Credit Cards Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <CreditCardIcon className="h-4 w-4 mr-2 text-red-600" />
                  Credit Cards ({creditCards.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-red-600">
                  ₹{creditCards.reduce((sum, cc) => sum + cc.currentBalance, 0).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">Outstanding Balance</div>
              </CardContent>
            </Card>

            {/* Loans Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Building className="h-4 w-4 mr-2 text-orange-600" />
                  Loans ({loans.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-orange-600">
                  ₹{loans.reduce((sum, loan) => sum + loan.currentBalance, 0).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">Outstanding Balance</div>
              </CardContent>
            </Card>

            {/* Investments Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2 text-purple-600" />
                  Investments ({investments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-purple-600">
                  ₹{investments.reduce((sum, inv) => sum + inv.currentValue, 0).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">Current Value</div>
              </CardContent>
            </Card>

            {/* Properties Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Home className="h-4 w-4 mr-2 text-emerald-600" />
                  Properties ({properties.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-emerald-600">
                  ₹{properties.reduce((sum, prop) => sum + prop.currentValue, 0).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">Total Value</div>
              </CardContent>
            </Card>

            {/* Insurance Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-blue-600" />
                  Insurance ({insurance.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-blue-600">
                  ₹{insurance.reduce((sum, ins) => sum + ins.sumAssured, 0).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">Total Coverage</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Bank Accounts</h3>
            <Button onClick={() => setShowAddDialog('account')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </div>
          
          <div className="grid gap-4">
            {accounts.map((account) => (
              <Card key={account.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{account.accountName}</h4>
                      <Badge variant="outline" className="mb-2">{account.accountType}</Badge>
                      <p className="text-sm text-gray-500">{account.bankName}</p>
                      <div className="mt-2 space-y-1">
                        <div className="text-sm">
                          <span className="text-gray-500">Balance:</span>
                          <span className="ml-2 font-medium text-green-600">₹{account.balance.toLocaleString()}</span>
                        </div>
                        {account.accountNumber && (
                          <div className="text-sm">
                            <span className="text-gray-500">Account:</span>
                            <span className="ml-2">••••{account.accountNumber.slice(-4)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => handleEditAccount(account)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteAccount(account)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {accounts.length === 0 && (
              <p className="text-center text-gray-500 py-8">No accounts added yet</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="credit_cards" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Credit Cards</h3>
            <Button onClick={() => setShowAddDialog('credit_card')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Credit Card
            </Button>
          </div>
          
          <div className="grid gap-4">
            {creditCards.map((card) => (
              <Card key={card.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{card.name}</h4>
                      <p className="text-sm text-gray-500">{card.bankName} •••• {card.cardNumberLast4}</p>
                      <div className="mt-2 space-y-1">
                        <div className="text-sm">
                          <span className="text-gray-500">Balance:</span>
                          <span className="ml-2 font-medium text-red-600">₹{card.currentBalance.toLocaleString()}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Limit:</span>
                          <span className="ml-2 font-medium">₹{card.creditLimit.toLocaleString()}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Due Date:</span>
                          <span className="ml-2">{card.dueDate} of every month</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => handleEditCreditCard(card)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteCreditCard(card)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {creditCards.length === 0 && (
              <p className="text-center text-gray-500 py-8">No credit cards added yet</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="loans" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Loans & EMIs</h3>
            <Button onClick={() => setShowAddDialog('loan')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Loan
            </Button>
          </div>
          
          <div className="grid gap-4">
            {loans.map((loan) => (
              <Card key={loan.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{loan.name}</h4>
                      <Badge variant="outline" className="mb-2">{loan.loanType}</Badge>
                      <p className="text-sm text-gray-500">{loan.bankName}</p>
                      <div className="mt-2 space-y-1">
                        <div className="text-sm">
                          <span className="text-gray-500">Outstanding:</span>
                          <span className="ml-2 font-medium text-orange-600">₹{loan.currentBalance.toLocaleString()}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">EMI:</span>
                          <span className="ml-2 font-medium">₹{loan.emiAmount.toLocaleString()}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">EMI Date:</span>
                          <span className="ml-2">{loan.emiDate} of every month</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Interest Rate:</span>
                          <span className="ml-2">{loan.interestRate}% p.a.</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => handleEditLoan(loan)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteLoan(loan)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {loans.length === 0 && (
              <p className="text-center text-gray-500 py-8">No loans added yet</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="investments" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Investments</h3>
            <Button onClick={() => setShowAddDialog('investment')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Investment
            </Button>
          </div>
          
          <div className="grid gap-4">
            {investments.map((investment) => (
              <Card key={investment.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{investment.name}</h4>
                      <Badge variant="outline" className="mb-2">{investment.investmentType}</Badge>
                      <p className="text-sm text-gray-500">{investment.platform}</p>
                      <div className="mt-2 space-y-1">
                        <div className="text-sm">
                          <span className="text-gray-500">Invested:</span>
                          <span className="ml-2 font-medium">₹{investment.investedAmount.toLocaleString()}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Current Value:</span>
                          <span className="ml-2 font-medium text-purple-600">₹{investment.currentValue.toLocaleString()}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Gain/Loss:</span>
                          <span className={`ml-2 font-medium ${(investment.currentValue - investment.investedAmount) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {(investment.currentValue - investment.investedAmount) >= 0 ? '+' : ''}₹{(investment.currentValue - investment.investedAmount).toLocaleString()}
                          </span>
                        </div>
                        {investment.sipAmount > 0 && (
                          <div className="text-sm">
                            <span className="text-gray-500">SIP:</span>
                            <span className="ml-2">₹{investment.sipAmount.toLocaleString()} on {investment.sipDate} of every month</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => handleEditInvestment(investment)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteInvestment(investment)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {investments.length === 0 && (
              <p className="text-center text-gray-500 py-8">No investments added yet</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="insurance" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Insurance Policies</h3>
            <Button onClick={() => setShowAddDialog('insurance')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Insurance
            </Button>
          </div>
          
          <div className="grid gap-4">
            {insurance.map((policy) => (
              <Card key={policy.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{policy.name}</h4>
                      <Badge variant="outline" className="mb-2">{policy.policyType}</Badge>
                      <p className="text-sm text-gray-500">{policy.companyName} • {policy.policyNumber}</p>
                      <div className="mt-2 space-y-1">
                        <div className="text-sm">
                          <span className="text-gray-500">Sum Assured:</span>
                          <span className="ml-2 font-medium text-blue-600">₹{policy.sumAssured.toLocaleString()}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Premium:</span>
                          <span className="ml-2 font-medium">₹{policy.premiumAmount.toLocaleString()} ({policy.premiumFrequency})</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Due Date:</span>
                          <span className="ml-2">{policy.premiumDueDate} of every month</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Policy Period:</span>
                          <span className="ml-2">{policy.policyStartDate} to {policy.policyEndDate}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => handleEditInsurance(policy)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteInsurance(policy)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {insurance.length === 0 && (
              <p className="text-center text-gray-500 py-8">No insurance policies added yet</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="properties" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Properties</h3>
            <Button onClick={() => setShowAddDialog('property')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          </div>
          
          <div className="grid gap-4">
            {properties.map((property) => (
              <Card key={property.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{property.name}</h4>
                      <Badge variant="outline" className="mb-2">{property.propertyType}</Badge>
                      <p className="text-sm text-gray-500">{property.address}</p>
                      <div className="mt-2 space-y-1">
                        <div className="text-sm">
                          <span className="text-gray-500">Purchase Price:</span>
                          <span className="ml-2 font-medium">₹{property.purchasePrice.toLocaleString()}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Current Value:</span>
                          <span className="ml-2 font-medium text-emerald-600">₹{property.currentValue.toLocaleString()}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Ownership:</span>
                          <span className="ml-2">{property.ownershipPercentage}%</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Appreciation:</span>
                          <span className={`ml-2 font-medium ${(property.currentValue - property.purchasePrice) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {(property.currentValue - property.purchasePrice) >= 0 ? '+' : ''}₹{(property.currentValue - property.purchasePrice).toLocaleString()}
                          </span>
                        </div>
                        {property.rentalIncome > 0 && (
                          <div className="text-sm">
                            <span className="text-gray-500">Rental Income:</span>
                            <span className="ml-2 text-green-600">₹{property.rentalIncome.toLocaleString()}/month</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => handleEditProperty(property)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteProperty(property)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {properties.length === 0 && (
              <p className="text-center text-gray-500 py-8">No properties added yet</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="recurring" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">EMI & Recurring Payments</h3>
            <Button onClick={() => setShowAddDialog('recurring')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Recurring Payment
            </Button>
          </div>
          
          <div className="grid gap-4">
            {recurringPayments.map((payment) => (
              <Card key={payment.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{payment.name}</h4>
                      <Badge variant="outline" className="mb-2">{payment.frequency}</Badge>
                      <p className="text-sm text-gray-500">{payment.description}</p>
                      <div className="mt-2 space-y-1">
                        <div className="text-sm">
                          <span className="text-gray-500">Amount:</span>
                          <span className="ml-2 font-medium text-red-600">₹{payment.amount.toLocaleString()}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Payment Date:</span>
                          <span className="ml-2">{payment.paymentDate} of every {payment.frequency.toLowerCase()}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Start Date:</span>
                          <span className="ml-2">{new Date(payment.startDate).toLocaleDateString()}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Auto Create Transaction:</span>
                          <span className={`ml-2 ${payment.autoCreateTransaction ? 'text-green-600' : 'text-gray-600'}`}>
                            {payment.autoCreateTransaction ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => handleEditRecurringPayment(payment)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteRecurringPayment(payment)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {recurringPayments.length === 0 && (
              <p className="text-center text-gray-500 py-8">No recurring payments added yet</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Account Dialog */}
      <Dialog open={showAddDialog === 'account'} onOpenChange={() => setShowAddDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Bank Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Account Name</Label>
              <Input
                value={accountForm.accountName}
                onChange={(e) => setAccountForm({ ...accountForm, accountName: e.target.value })}
                placeholder="e.g., Main Savings, Checking"
              />
            </div>
            <div>
              <Label>Account Type</Label>
              <Select value={accountForm.accountType} onValueChange={(value) => setAccountForm({ ...accountForm, accountType: value as Account['accountType'] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SAVINGS">Savings Account</SelectItem>
                  <SelectItem value="CHECKING">Checking Account</SelectItem>
                  <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                  <SelectItem value="INVESTMENT">Investment Account</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Bank Name</Label>
              <Input
                value={accountForm.bankName || ''}
                onChange={(e) => setAccountForm({ ...accountForm, bankName: e.target.value })}
                placeholder="e.g., HDFC Bank, ICICI"
              />
            </div>
            <div>
              <Label>Current Balance (₹)</Label>
              <Input
                type="number"
                value={accountForm.balance}
                onChange={(e) => setAccountForm({ ...accountForm, balance: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <Button onClick={handleAddAccount} className="w-full">
              Add Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Account Dialog */}
      <Dialog open={showEditDialog === 'account'} onOpenChange={() => setShowEditDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Account Name</Label>
              <Input
                value={accountForm.accountName}
                onChange={(e) => setAccountForm({ ...accountForm, accountName: e.target.value })}
                placeholder="e.g., Main Savings, Checking"
              />
            </div>
            <div>
              <Label>Account Type</Label>
              <Select value={accountForm.accountType} onValueChange={(value) => setAccountForm({ ...accountForm, accountType: value as Account['accountType'] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SAVINGS">Savings Account</SelectItem>
                  <SelectItem value="CHECKING">Checking Account</SelectItem>
                  <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                  <SelectItem value="INVESTMENT">Investment Account</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Bank Name</Label>
              <Input
                value={accountForm.bankName || ''}
                onChange={(e) => setAccountForm({ ...accountForm, bankName: e.target.value })}
                placeholder="e.g., HDFC Bank, ICICI"
              />
            </div>
            <div>
              <Label>Current Balance (₹)</Label>
              <Input
                type="number"
                value={accountForm.balance}
                onChange={(e) => setAccountForm({ ...accountForm, balance: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <Button onClick={handleUpdateAccount} className="w-full">
              Update Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Loan Dialog */}
      <Dialog open={showEditDialog === 'loan'} onOpenChange={() => setShowEditDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Loan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Loan Name</Label>
              <Input
                value={loanForm.name}
                onChange={(e) => setLoanForm({ ...loanForm, name: e.target.value })}
                placeholder="e.g., Home Loan, Car Loan"
              />
            </div>
            <div>
              <Label>Loan Type</Label>
              <Select value={loanForm.loanType} onValueChange={(value) => setLoanForm({ ...loanForm, loanType: value as Loan['loanType'] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">Home Loan</SelectItem>
                  <SelectItem value="car">Car Loan</SelectItem>
                  <SelectItem value="personal">Personal Loan</SelectItem>
                  <SelectItem value="education">Education Loan</SelectItem>
                  <SelectItem value="business">Business Loan</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Bank Name</Label>
              <Input
                value={loanForm.bankName}
                onChange={(e) => setLoanForm({ ...loanForm, bankName: e.target.value })}
                placeholder="e.g., HDFC Bank, SBI"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Principal Amount (₹)</Label>
                <Input
                  type="number"
                  value={loanForm.principalAmount}
                  onChange={(e) => setLoanForm({ ...loanForm, principalAmount: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Current Balance (₹)</Label>
                <Input
                  type="number"
                  value={loanForm.currentBalance}
                  onChange={(e) => setLoanForm({ ...loanForm, currentBalance: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Interest Rate (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={loanForm.interestRate}
                  onChange={(e) => setLoanForm({ ...loanForm, interestRate: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Tenure (Months)</Label>
                <Input
                  type="number"
                  value={loanForm.tenureMonths}
                  onChange={(e) => setLoanForm({ ...loanForm, tenureMonths: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>EMI Amount (₹)</Label>
                <Input
                  type="number"
                  value={loanForm.emiAmount}
                  onChange={(e) => setLoanForm({ ...loanForm, emiAmount: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>EMI Date</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={loanForm.emiDate}
                  onChange={(e) => setLoanForm({ ...loanForm, emiDate: parseInt(e.target.value) || 1 })}
                  placeholder="1"
                />
              </div>
            </div>
            <Button onClick={handleUpdateLoan} className="w-full">
              Update Loan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Recurring Payment Dialog */}
      <Dialog open={showEditDialog === 'recurring'} onOpenChange={() => setShowEditDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Recurring Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Payment Name</Label>
              <Input
                value={recurringForm.name}
                onChange={(e) => setRecurringForm({ ...recurringForm, name: e.target.value })}
                placeholder="e.g., Home Loan EMI, Netflix Subscription"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={recurringForm.description}
                onChange={(e) => setRecurringForm({ ...recurringForm, description: e.target.value })}
                placeholder="Additional details"
              />
            </div>
            <div>
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                value={recurringForm.amount}
                onChange={(e) => setRecurringForm({ ...recurringForm, amount: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Frequency</Label>
              <Select value={recurringForm.frequency} onValueChange={(value) => setRecurringForm({ ...recurringForm, frequency: value as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Payment Date</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={recurringForm.paymentDate}
                  onChange={(e) => setRecurringForm({ ...recurringForm, paymentDate: parseInt(e.target.value) || 1 })}
                  placeholder="1"
                />
              </div>
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={recurringForm.startDate}
                  onChange={(e) => setRecurringForm({ ...recurringForm, startDate: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoCreate"
                checked={recurringForm.autoCreateTransaction}
                onChange={(e) => setRecurringForm({ ...recurringForm, autoCreateTransaction: e.target.checked })}
              />
              <Label htmlFor="autoCreate">Automatically create transactions</Label>
            </div>
            <Button onClick={handleUpdateRecurringPayment} className="w-full">
              Update Recurring Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={() => setShowDeleteDialog(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {
              accountToDelete ? 'Account' : 
              loanToDelete ? 'Loan' : 
              creditCardToDelete ? 'Credit Card' :
              investmentToDelete ? 'Investment' :
              insuranceToDelete ? 'Insurance Policy' :
              propertyToDelete ? 'Property' :
              recurringPaymentToDelete ? 'Recurring Payment' : 'Item'
            }</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete "{
                accountToDelete?.accountName || 
                loanToDelete?.name || 
                creditCardToDelete?.name ||
                investmentToDelete?.name ||
                insuranceToDelete?.name ||
                propertyToDelete?.name ||
                recurringPaymentToDelete?.name
              }"? This action cannot be undone.
            </p>
            <div className="flex space-x-2 justify-end">
              <Button variant="outline" onClick={() => {
                setShowDeleteDialog(false);
                setAccountToDelete(null);
                setLoanToDelete(null);
                setCreditCardToDelete(null);
                setInvestmentToDelete(null);
                setInsuranceToDelete(null);
                setPropertyToDelete(null);
                setRecurringPaymentToDelete(null);
              }}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={
                accountToDelete ? confirmDeleteAccount : 
                loanToDelete ? confirmDeleteLoan : 
                creditCardToDelete ? confirmDeleteCreditCard :
                investmentToDelete ? confirmDeleteInvestment :
                insuranceToDelete ? confirmDeleteInsurance :
                propertyToDelete ? confirmDeleteProperty :
                recurringPaymentToDelete ? confirmDeleteRecurringPayment : 
                () => {}
              }>
                Delete {
                  accountToDelete ? 'Account' : 
                  loanToDelete ? 'Loan' : 
                  creditCardToDelete ? 'Credit Card' :
                  investmentToDelete ? 'Investment' :
                  insuranceToDelete ? 'Insurance' :
                  propertyToDelete ? 'Property' :
                  recurringPaymentToDelete ? 'Payment' : 'Item'
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Credit Card Dialog */}
      <Dialog open={showAddDialog === 'credit_card'} onOpenChange={() => setShowAddDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Credit Card</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Card Name</Label>
              <Input
                value={creditCardForm.name}
                onChange={(e) => setCreditCardForm({ ...creditCardForm, name: e.target.value })}
                placeholder="e.g., HDFC Regalia"
              />
            </div>
            <div>
              <Label>Bank Name</Label>
              <Input
                value={creditCardForm.bankName}
                onChange={(e) => setCreditCardForm({ ...creditCardForm, bankName: e.target.value })}
                placeholder="e.g., HDFC Bank"
              />
            </div>
            <div>
              <Label>Last 4 Digits</Label>
              <Input
                value={creditCardForm.cardNumberLast4}
                onChange={(e) => setCreditCardForm({ ...creditCardForm, cardNumberLast4: e.target.value })}
                placeholder="1234"
                maxLength={4}
              />
            </div>
            <div>
              <Label>Credit Limit (₹)</Label>
              <Input
                type="number"
                value={creditCardForm.creditLimit}
                onChange={(e) => setCreditCardForm({ ...creditCardForm, creditLimit: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Current Balance (₹)</Label>
              <Input
                type="number"
                value={creditCardForm.currentBalance}
                onChange={(e) => setCreditCardForm({ ...creditCardForm, currentBalance: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Due Date (Day of Month)</Label>
              <Input
                type="number"
                min="1"
                max="31"
                value={creditCardForm.dueDate}
                onChange={(e) => setCreditCardForm({ ...creditCardForm, dueDate: parseInt(e.target.value) || 1 })}
              />
            </div>
            <Button onClick={handleAddCreditCard} className="w-full">
              Add Credit Card
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Loan Dialog */}
      <Dialog open={showAddDialog === 'loan'} onOpenChange={() => setShowAddDialog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Loan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Loan Name</Label>
                <Input
                  value={loanForm.name}
                  onChange={(e) => setLoanForm({ ...loanForm, name: e.target.value })}
                  placeholder="e.g., Home Loan - Mumbai Flat"
                />
              </div>
              <div>
                <Label>Loan Type</Label>
                <Select value={loanForm.loanType} onValueChange={(value) => setLoanForm({ ...loanForm, loanType: value as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home">🏠 Home Loan</SelectItem>
                    <SelectItem value="car">🚗 Car Loan</SelectItem>
                    <SelectItem value="personal">👤 Personal Loan</SelectItem>
                    <SelectItem value="education">🎓 Education Loan</SelectItem>
                    <SelectItem value="business">💼 Business Loan</SelectItem>
                    <SelectItem value="other">📋 Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Bank/Lender</Label>
                <Input
                  value={loanForm.bankName}
                  onChange={(e) => setLoanForm({ ...loanForm, bankName: e.target.value })}
                  placeholder="e.g., SBI, HDFC Bank"
                />
              </div>
              <div>
                <Label>Interest Rate (% p.a.)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={loanForm.interestRate}
                  onChange={(e) => setLoanForm({ ...loanForm, interestRate: parseFloat(e.target.value) || 0 })}
                  placeholder="8.50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Principal Amount (₹)</Label>
                <Input
                  type="number"
                  value={loanForm.principalAmount}
                  onChange={(e) => setLoanForm({ ...loanForm, principalAmount: parseFloat(e.target.value) || 0 })}
                  placeholder="5000000"
                />
              </div>
              <div>
                <Label>Tenure (Months)</Label>
                <Input
                  type="number"
                  value={loanForm.tenureMonths}
                  onChange={(e) => setLoanForm({ ...loanForm, tenureMonths: parseInt(e.target.value) || 0 })}
                  placeholder="240"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {loanForm.tenureMonths ? `${Math.round(loanForm.tenureMonths / 12)} years` : ''}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Current Outstanding (₹)</Label>
                <Input
                  type="number"
                  value={loanForm.currentBalance}
                  onChange={(e) => setLoanForm({ ...loanForm, currentBalance: parseFloat(e.target.value) || 0 })}
                  placeholder="4500000"
                />
              </div>
              <div>
                <Label>EMI Date (Day of Month)</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={loanForm.emiDate}
                  onChange={(e) => setLoanForm({ ...loanForm, emiDate: parseInt(e.target.value) || 1 })}
                  placeholder="5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={loanForm.startDate}
                  onChange={(e) => setLoanForm({ ...loanForm, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={loanForm.endDate}
                  onChange={(e) => setLoanForm({ ...loanForm, endDate: e.target.value })}
                />
              </div>
            </div>

            {/* EMI Calculations Display */}
            {(loanForm.principalAmount > 0 && loanForm.interestRate > 0 && loanForm.tenureMonths > 0) && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">Loan Calculations</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Monthly EMI:</span>
                    <div className="font-semibold text-lg text-blue-600">₹{loanCalculations.monthlyEmi.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Yearly EMI:</span>
                    <div className="font-semibold text-lg text-blue-600">₹{loanCalculations.yearlyEmi.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Total Interest:</span>
                    <div className="font-semibold text-red-600">₹{loanCalculations.totalInterest.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Total Payment:</span>
                    <div className="font-semibold text-purple-600">₹{loanCalculations.totalPayment.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            )}

            <Button onClick={handleAddLoan} className="w-full">
              Add Loan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Investment Dialog */}
      <Dialog open={showAddDialog === 'investment'} onOpenChange={() => setShowAddDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Investment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Investment Name</Label>
              <Input
                value={investmentForm.name}
                onChange={(e) => setInvestmentForm({ ...investmentForm, name: e.target.value })}
                placeholder="e.g., HDFC Flexi Cap Fund"
              />
            </div>
            <div>
              <Label>Investment Type</Label>
              <Select value={investmentForm.investmentType} onValueChange={(value) => setInvestmentForm({ ...investmentForm, investmentType: value as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mutual_fund">Mutual Fund</SelectItem>
                  <SelectItem value="stocks">Stocks</SelectItem>
                  <SelectItem value="bonds">Bonds</SelectItem>
                  <SelectItem value="fd">Fixed Deposit</SelectItem>
                  <SelectItem value="rd">Recurring Deposit</SelectItem>
                  <SelectItem value="ppf">PPF</SelectItem>
                  <SelectItem value="nps">NPS</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Platform</Label>
              <Input
                value={investmentForm.platform}
                onChange={(e) => setInvestmentForm({ ...investmentForm, platform: e.target.value })}
                placeholder="e.g., Zerodha, Groww"
              />
            </div>
            <div>
              <Label>Invested Amount (₹)</Label>
              <Input
                type="number"
                value={investmentForm.investedAmount}
                onChange={(e) => setInvestmentForm({ ...investmentForm, investedAmount: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Current Value (₹)</Label>
              <Input
                type="number"
                value={investmentForm.currentValue}
                onChange={(e) => setInvestmentForm({ ...investmentForm, currentValue: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <Button onClick={handleAddInvestment} className="w-full">
              Add Investment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Insurance Dialog */}
      <Dialog open={showAddDialog === 'insurance'} onOpenChange={() => setShowAddDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Insurance Policy</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Policy Name</Label>
              <Input
                value={insuranceForm.name}
                onChange={(e) => setInsuranceForm({ ...insuranceForm, name: e.target.value })}
                placeholder="e.g., Life Insurance Policy"
              />
            </div>
            <div>
              <Label>Policy Type</Label>
              <Select value={insuranceForm.policyType} onValueChange={(value) => setInsuranceForm({ ...insuranceForm, policyType: value as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="life">Life Insurance</SelectItem>
                  <SelectItem value="health">Health Insurance</SelectItem>
                  <SelectItem value="vehicle">Vehicle Insurance</SelectItem>
                  <SelectItem value="home">Home Insurance</SelectItem>
                  <SelectItem value="travel">Travel Insurance</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Company Name</Label>
              <Input
                value={insuranceForm.companyName}
                onChange={(e) => setInsuranceForm({ ...insuranceForm, companyName: e.target.value })}
                placeholder="e.g., LIC, HDFC Life"
              />
            </div>
            <div>
              <Label>Policy Number</Label>
              <Input
                value={insuranceForm.policyNumber}
                onChange={(e) => setInsuranceForm({ ...insuranceForm, policyNumber: e.target.value })}
                placeholder="Policy number"
              />
            </div>
            <div>
              <Label>Sum Assured (₹)</Label>
              <Input
                type="number"
                value={insuranceForm.sumAssured}
                onChange={(e) => setInsuranceForm({ ...insuranceForm, sumAssured: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Premium Amount (₹)</Label>
              <Input
                type="number"
                value={insuranceForm.premiumAmount}
                onChange={(e) => setInsuranceForm({ ...insuranceForm, premiumAmount: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <Button onClick={handleAddInsurance} className="w-full">
              Add Insurance Policy
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Property Dialog */}
      <Dialog open={showAddDialog === 'property'} onOpenChange={() => setShowAddDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Property</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Property Name</Label>
              <Input
                value={propertyForm.name}
                onChange={(e) => setPropertyForm({ ...propertyForm, name: e.target.value })}
                placeholder="e.g., Home, Office"
              />
            </div>
            <div>
              <Label>Property Type</Label>
              <Select value={propertyForm.propertyType} onValueChange={(value) => setPropertyForm({ ...propertyForm, propertyType: value as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="land">Land</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Address</Label>
              <Input
                value={propertyForm.address}
                onChange={(e) => setPropertyForm({ ...propertyForm, address: e.target.value })}
                placeholder="Property address"
              />
            </div>
            <div>
              <Label>Purchase Price (₹)</Label>
              <Input
                type="number"
                value={propertyForm.purchasePrice}
                onChange={(e) => setPropertyForm({ ...propertyForm, purchasePrice: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Current Value (₹)</Label>
              <Input
                type="number"
                value={propertyForm.currentValue}
                onChange={(e) => setPropertyForm({ ...propertyForm, currentValue: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <Button onClick={handleAddProperty} className="w-full">
              Add Property
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Recurring Payment Dialog */}
      <Dialog open={showAddDialog === 'recurring'} onOpenChange={() => setShowAddDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Recurring Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Payment Name</Label>
              <Input
                value={recurringForm.name}
                onChange={(e) => setRecurringForm({ ...recurringForm, name: e.target.value })}
                placeholder="e.g., Home Loan EMI, Netflix Subscription"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={recurringForm.description}
                onChange={(e) => setRecurringForm({ ...recurringForm, description: e.target.value })}
                placeholder="Additional details"
              />
            </div>
            <div>
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                value={recurringForm.amount}
                onChange={(e) => setRecurringForm({ ...recurringForm, amount: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Frequency</Label>
              <Select value={recurringForm.frequency} onValueChange={(value) => setRecurringForm({ ...recurringForm, frequency: value as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Payment Date</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={recurringForm.paymentDate}
                  onChange={(e) => setRecurringForm({ ...recurringForm, paymentDate: parseInt(e.target.value) || 1 })}
                  placeholder="1"
                />
              </div>
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={recurringForm.startDate}
                  onChange={(e) => setRecurringForm({ ...recurringForm, startDate: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoCreateAdd"
                checked={recurringForm.autoCreateTransaction}
                onChange={(e) => setRecurringForm({ ...recurringForm, autoCreateTransaction: e.target.checked })}
              />
              <Label htmlFor="autoCreateAdd">Automatically create transactions</Label>
            </div>
            <Button onClick={handleAddRecurringPayment} className="w-full">
              Add Recurring Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Accounts;