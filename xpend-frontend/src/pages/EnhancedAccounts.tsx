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
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  getAllUserFinancials,
  calculateNetWorth,
  addCreditCard,
  addLoan,
  addInvestment,
  addInsurance,
  addProperty,
  addRecurringPayment,
  clearAllStoredData,
  type CreditCard,
  type Loan,
  type Investment,
  type Insurance,
  type Property,
  type RecurringPayment
} from '@/utils/storageService';

const EnhancedAccounts = () => {
  const { user, isPersonalMode, currentGroup, userGroups, dataVersion, refreshData } = useApp();
  const { toast } = useToast();
  
  const [financials, setFinancials] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Dialog states
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState<string | null>(null);
  
  // Form states for different modules
  const [creditCardForm, setCreditCardForm] = useState({
    name: '', bank_name: '', card_number_last4: '', credit_limit: 0, current_balance: 0,
    interest_rate: 0, annual_fee: 0, due_date: 1, minimum_payment: 0, statement_date: 1
  });
  
  const [loanForm, setLoanForm] = useState({
    name: '', loan_type: 'home' as const, bank_name: '', principal_amount: 0, current_balance: 0,
    interest_rate: 0, tenure_months: 0, emi_amount: 0, emi_date: 1, start_date: '', end_date: ''
  });
  
  const [investmentForm, setInvestmentForm] = useState({
    name: '', investment_type: 'mutual_fund' as const, platform: '', invested_amount: 0, current_value: 0,
    sip_amount: 0, sip_date: 1, maturity_date: ''
  });
  
  const [insuranceForm, setInsuranceForm] = useState({
    name: '', policy_type: 'life' as const, company_name: '', policy_number: '', sum_assured: 0,
    premium_amount: 0, premium_frequency: 'monthly' as const, premium_due_date: 1,
    policy_start_date: '', policy_end_date: '', nominees: ['']
  });
  
  const [propertyForm, setPropertyForm] = useState({
    name: '', property_type: 'residential' as const, address: '', purchase_price: 0, current_value: 0,
    ownership_percentage: 100, rental_income: 0, property_tax: 0, maintenance_cost: 0, purchase_date: ''
  });
  
  const [recurringForm, setRecurringForm] = useState({
    name: '', description: '', amount: 0, frequency: 'monthly' as const, category_id: '',
    payment_date: 1, start_date: '', auto_create_transaction: true
  });

  useEffect(() => {
    fetchFinancials();
  }, [user, isPersonalMode, currentGroup, dataVersion]);

  const fetchFinancials = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const groupId = isPersonalMode ? undefined : currentGroup?.id;
      const allFinancials = await getAllUserFinancials(user.id, groupId);
      
      setFinancials(allFinancials);
    } catch (error) {
      console.error('Error fetching financials:', error);
      toast({
        title: "Error",
        description: "Failed to fetch financial data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearAllData = async () => {
    await clearAllStoredData();
  };

  const handleAddCreditCard = async () => {
    try {
      await addCreditCard({
        user_id: user.id,
        group_id: isPersonalMode ? null : currentGroup?.id,
        ...creditCardForm,
        is_active: true
      });
      
      setCreditCardForm({
        name: '', bank_name: '', card_number_last4: '', credit_limit: 0, current_balance: 0,
        interest_rate: 0, annual_fee: 0, due_date: 1, minimum_payment: 0, statement_date: 1
      });
      setShowAddDialog(null);
      fetchFinancials();
      refreshData();
      
      toast({
        title: "Success",
        description: "Credit card added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add credit card",
        variant: "destructive",
      });
    }
  };

  const handleAddLoan = async () => {
    try {
      await addLoan({
        user_id: user.id,
        group_id: isPersonalMode ? null : currentGroup?.id,
        ...loanForm,
        is_active: true
      });
      
      setLoanForm({
        name: '', loan_type: 'home', bank_name: '', principal_amount: 0, current_balance: 0,
        interest_rate: 0, tenure_months: 0, emi_amount: 0, emi_date: 1, start_date: '', end_date: ''
      });
      setShowAddDialog(null);
      fetchFinancials();
      refreshData();
      
      toast({
        title: "Success",
        description: "Loan added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add loan",
        variant: "destructive",
      });
    }
  };

  const handleAddInvestment = async () => {
    try {
      await addInvestment({
        user_id: user.id,
        group_id: isPersonalMode ? null : currentGroup?.id,
        ...investmentForm,
        is_active: true
      });
      
      setInvestmentForm({
        name: '', investment_type: 'mutual_fund', platform: '', invested_amount: 0, current_value: 0,
        sip_amount: 0, sip_date: 1, maturity_date: ''
      });
      setShowAddDialog(null);
      fetchFinancials();
      refreshData();
      
      toast({
        title: "Success",
        description: "Investment added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add investment",
        variant: "destructive",
      });
    }
  };

  const handleAddInsurance = async () => {
    try {
      await addInsurance({
        user_id: user.id,
        group_id: isPersonalMode ? null : currentGroup?.id,
        ...insuranceForm,
        is_active: true
      });
      
      setInsuranceForm({
        name: '', policy_type: 'life', company_name: '', policy_number: '', sum_assured: 0,
        premium_amount: 0, premium_frequency: 'monthly', premium_due_date: 1,
        policy_start_date: '', policy_end_date: '', nominees: ['']
      });
      setShowAddDialog(null);
      fetchFinancials();
      refreshData();
      
      toast({
        title: "Success",
        description: "Insurance policy added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add insurance policy",
        variant: "destructive",
      });
    }
  };

  const handleAddProperty = async () => {
    try {
      await addProperty({
        user_id: user.id,
        group_id: isPersonalMode ? null : currentGroup?.id,
        ...propertyForm,
        is_active: true
      });
      
      setPropertyForm({
        name: '', property_type: 'residential', address: '', purchase_price: 0, current_value: 0,
        ownership_percentage: 100, rental_income: 0, property_tax: 0, maintenance_cost: 0, purchase_date: ''
      });
      setShowAddDialog(null);
      fetchFinancials();
      refreshData();
      
      toast({
        title: "Success",
        description: "Property added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add property",
        variant: "destructive",
      });
    }
  };

  const handleAddRecurringPayment = async () => {
    try {
      await addRecurringPayment({
        user_id: user.id,
        group_id: isPersonalMode ? null : currentGroup?.id,
        ...recurringForm,
        is_active: true
      });
      
      setRecurringForm({
        name: '', description: '', amount: 0, frequency: 'monthly', category_id: '',
        payment_date: 1, start_date: '', auto_create_transaction: true
      });
      setShowAddDialog(null);
      fetchFinancials();
      refreshData();
      
      toast({
        title: "Success",
        description: "Recurring payment added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add recurring payment",
        variant: "destructive",
      });
    }
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

  const [netWorth, setNetWorth] = useState(0);

  useEffect(() => {
    const fetchNetWorth = async () => {
      if (user) {
        const worth = await calculateNetWorth(user.id, isPersonalMode ? undefined : currentGroup?.id);
        setNetWorth(worth);
      }
    };
    fetchNetWorth();
  }, [user, isPersonalMode, currentGroup, dataVersion]);
  const totalAssets = financials.investments?.reduce((sum: number, inv: Investment) => sum + inv.current_value, 0) +
                     financials.properties?.reduce((sum: number, prop: Property) => sum + prop.current_value, 0) || 0;
  const totalLiabilities = financials.creditCards?.reduce((sum: number, cc: CreditCard) => sum + cc.current_balance, 0) +
                          financials.loans?.reduce((sum: number, loan: Loan) => sum + loan.current_balance, 0) || 0;

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
        <div className="flex space-x-2">
          <Button variant="destructive" onClick={() => setShowClearDialog(true)}>
            Clear All Data
          </Button>
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
              Investments + Properties
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
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="credit_cards">Credit Cards</TabsTrigger>
          <TabsTrigger value="loans">Loans</TabsTrigger>
          <TabsTrigger value="investments">Investments</TabsTrigger>
          <TabsTrigger value="insurance">Insurance</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="recurring">EMIs/Recurring</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Credit Cards Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <CreditCardIcon className="h-4 w-4 mr-2 text-red-600" />
                  Credit Cards ({financials.creditCards?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-red-600">
                  ₹{financials.creditCards?.reduce((sum: number, cc: CreditCard) => sum + cc.current_balance, 0).toLocaleString() || '0'}
                </div>
                <div className="text-xs text-gray-500">Outstanding Balance</div>
              </CardContent>
            </Card>

            {/* Loans Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Building className="h-4 w-4 mr-2 text-orange-600" />
                  Loans ({financials.loans?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-orange-600">
                  ₹{financials.loans?.reduce((sum: number, loan: Loan) => sum + loan.current_balance, 0).toLocaleString() || '0'}
                </div>
                <div className="text-xs text-gray-500">Outstanding Balance</div>
              </CardContent>
            </Card>

            {/* Investments Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2 text-purple-600" />
                  Investments ({financials.investments?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-purple-600">
                  ₹{financials.investments?.reduce((sum: number, inv: Investment) => sum + inv.current_value, 0).toLocaleString() || '0'}
                </div>
                <div className="text-xs text-gray-500">Current Value</div>
              </CardContent>
            </Card>

            {/* Properties Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Home className="h-4 w-4 mr-2 text-emerald-600" />
                  Properties ({financials.properties?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-emerald-600">
                  ₹{financials.properties?.reduce((sum: number, prop: Property) => sum + prop.current_value, 0).toLocaleString() || '0'}
                </div>
                <div className="text-xs text-gray-500">Total Value</div>
              </CardContent>
            </Card>

            {/* Insurance Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-blue-600" />
                  Insurance ({financials.insurance?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-blue-600">
                  ₹{financials.insurance?.reduce((sum: number, ins: Insurance) => sum + ins.sum_assured, 0).toLocaleString() || '0'}
                </div>
                <div className="text-xs text-gray-500">Total Coverage</div>
              </CardContent>
            </Card>

            {/* Recurring Payments Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Repeat className="h-4 w-4 mr-2 text-indigo-600" />
                  Recurring ({financials.recurringPayments?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-indigo-600">
                  ₹{financials.recurringPayments?.reduce((sum: number, rec: RecurringPayment) => sum + rec.amount, 0).toLocaleString() || '0'}
                </div>
                <div className="text-xs text-gray-500">Monthly Commitments</div>
              </CardContent>
            </Card>
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
            {financials.creditCards?.map((card: CreditCard) => (
              <Card key={card.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{card.name}</h4>
                      <p className="text-sm text-gray-500">{card.bank_name} •••• {card.card_number_last4}</p>
                      <div className="mt-2 space-y-1">
                        <div className="text-sm">
                          <span className="text-gray-500">Balance:</span>
                          <span className="ml-2 font-medium text-red-600">₹{card.current_balance.toLocaleString()}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Limit:</span>
                          <span className="ml-2 font-medium">₹{card.credit_limit.toLocaleString()}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Due Date:</span>
                          <span className="ml-2">{card.due_date} of every month</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="ghost">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )) || <p className="text-center text-gray-500 py-8">No credit cards added yet</p>}
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
            {financials.loans?.map((loan: Loan) => (
              <Card key={loan.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{loan.name}</h4>
                      <Badge variant="outline" className="mb-2">{loan.loan_type}</Badge>
                      <p className="text-sm text-gray-500">{loan.bank_name}</p>
                      <div className="mt-2 space-y-1">
                        <div className="text-sm">
                          <span className="text-gray-500">Outstanding:</span>
                          <span className="ml-2 font-medium text-orange-600">₹{loan.current_balance.toLocaleString()}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">EMI:</span>
                          <span className="ml-2 font-medium">₹{loan.emi_amount.toLocaleString()}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">EMI Date:</span>
                          <span className="ml-2">{loan.emi_date} of every month</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Interest Rate:</span>
                          <span className="ml-2">{loan.interest_rate}% p.a.</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="ghost">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )) || <p className="text-center text-gray-500 py-8">No loans added yet</p>}
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
            {financials.investments?.map((investment: Investment) => (
              <Card key={investment.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{investment.name}</h4>
                      <Badge variant="outline" className="mb-2">{investment.investment_type}</Badge>
                      <p className="text-sm text-gray-500">{investment.platform}</p>
                      <div className="mt-2 space-y-1">
                        <div className="text-sm">
                          <span className="text-gray-500">Invested:</span>
                          <span className="ml-2 font-medium">₹{investment.invested_amount.toLocaleString()}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Current Value:</span>
                          <span className="ml-2 font-medium text-purple-600">₹{investment.current_value.toLocaleString()}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Gain/Loss:</span>
                          <span className={`ml-2 font-medium ${(investment.current_value - investment.invested_amount) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {(investment.current_value - investment.invested_amount) >= 0 ? '+' : ''}₹{(investment.current_value - investment.invested_amount).toLocaleString()}
                          </span>
                        </div>
                        {investment.sip_amount > 0 && (
                          <div className="text-sm">
                            <span className="text-gray-500">SIP:</span>
                            <span className="ml-2">₹{investment.sip_amount.toLocaleString()} on {investment.sip_date} of every month</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="ghost">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )) || <p className="text-center text-gray-500 py-8">No investments added yet</p>}
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
            {financials.insurance?.map((insurance: Insurance) => (
              <Card key={insurance.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{insurance.name}</h4>
                      <Badge variant="outline" className="mb-2">{insurance.policy_type}</Badge>
                      <p className="text-sm text-gray-500">{insurance.company_name} • {insurance.policy_number}</p>
                      <div className="mt-2 space-y-1">
                        <div className="text-sm">
                          <span className="text-gray-500">Sum Assured:</span>
                          <span className="ml-2 font-medium text-blue-600">₹{insurance.sum_assured.toLocaleString()}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Premium:</span>
                          <span className="ml-2 font-medium">₹{insurance.premium_amount.toLocaleString()} ({insurance.premium_frequency})</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Due Date:</span>
                          <span className="ml-2">{insurance.premium_due_date} of every month</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Policy Period:</span>
                          <span className="ml-2">{insurance.policy_start_date} to {insurance.policy_end_date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="ghost">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )) || <p className="text-center text-gray-500 py-8">No insurance policies added yet</p>}
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
            {financials.properties?.map((property: Property) => (
              <Card key={property.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{property.name}</h4>
                      <Badge variant="outline" className="mb-2">{property.property_type}</Badge>
                      <p className="text-sm text-gray-500">{property.address}</p>
                      <div className="mt-2 space-y-1">
                        <div className="text-sm">
                          <span className="text-gray-500">Purchase Price:</span>
                          <span className="ml-2 font-medium">₹{property.purchase_price.toLocaleString()}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Current Value:</span>
                          <span className="ml-2 font-medium text-emerald-600">₹{property.current_value.toLocaleString()}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Ownership:</span>
                          <span className="ml-2">{property.ownership_percentage}%</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Appreciation:</span>
                          <span className={`ml-2 font-medium ${(property.current_value - property.purchase_price) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {(property.current_value - property.purchase_price) >= 0 ? '+' : ''}₹{(property.current_value - property.purchase_price).toLocaleString()}
                          </span>
                        </div>
                        {property.rental_income > 0 && (
                          <div className="text-sm">
                            <span className="text-gray-500">Rental Income:</span>
                            <span className="ml-2 text-green-600">₹{property.rental_income.toLocaleString()}/month</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="ghost">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )) || <p className="text-center text-gray-500 py-8">No properties added yet</p>}
          </div>
        </TabsContent>

        <TabsContent value="recurring" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">EMIs & Recurring Payments</h3>
            <Button onClick={() => setShowAddDialog('recurring')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Recurring Payment
            </Button>
          </div>
          
          <div className="grid gap-4">
            {financials.recurringPayments?.map((payment: RecurringPayment) => (
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
                          <span className="ml-2 font-medium text-indigo-600">₹{payment.amount.toLocaleString()}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Payment Date:</span>
                          <span className="ml-2">{payment.payment_date} of every month</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Start Date:</span>
                          <span className="ml-2">{payment.start_date}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Auto Transaction:</span>
                          <span className="ml-2">
                            {payment.auto_create_transaction ? (
                              <Badge variant="outline" className="text-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Enabled
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-500">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Disabled
                              </Badge>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="ghost">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )) || <p className="text-center text-gray-500 py-8">No recurring payments added yet</p>}
          </div>
        </TabsContent>
      </Tabs>

      {/* Clear All Data Dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear All Data</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              This will permanently delete ALL your data including transactions, accounts, groups, and financial records. 
              This action cannot be undone.
            </p>
            <div className="flex space-x-2">
              <Button variant="destructive" onClick={handleClearAllData} className="flex-1">
                Yes, Clear Everything
              </Button>
              <Button variant="outline" onClick={() => setShowClearDialog(false)} className="flex-1">
                Cancel
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
                value={creditCardForm.bank_name}
                onChange={(e) => setCreditCardForm({ ...creditCardForm, bank_name: e.target.value })}
                placeholder="e.g., HDFC Bank"
              />
            </div>
            <div>
              <Label>Last 4 Digits</Label>
              <Input
                value={creditCardForm.card_number_last4}
                onChange={(e) => setCreditCardForm({ ...creditCardForm, card_number_last4: e.target.value })}
                placeholder="1234"
                maxLength={4}
              />
            </div>
            <div>
              <Label>Credit Limit (₹)</Label>
              <Input
                type="number"
                value={creditCardForm.credit_limit}
                onChange={(e) => setCreditCardForm({ ...creditCardForm, credit_limit: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Current Balance (₹)</Label>
              <Input
                type="number"
                value={creditCardForm.current_balance}
                onChange={(e) => setCreditCardForm({ ...creditCardForm, current_balance: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Due Date (Day of Month)</Label>
              <Input
                type="number"
                min="1"
                max="31"
                value={creditCardForm.due_date}
                onChange={(e) => setCreditCardForm({ ...creditCardForm, due_date: parseInt(e.target.value) || 1 })}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Loan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Loan Name</Label>
              <Input
                value={loanForm.name}
                onChange={(e) => setLoanForm({ ...loanForm, name: e.target.value })}
                placeholder="e.g., Car Loan"
              />
            </div>
            <div>
              <Label>Loan Type</Label>
              <Select value={loanForm.loan_type} onValueChange={(value) => setLoanForm({ ...loanForm, loan_type: value as any })}>
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
              <Label>Bank/Lender</Label>
              <Input
                value={loanForm.bank_name}
                onChange={(e) => setLoanForm({ ...loanForm, bank_name: e.target.value })}
                placeholder="e.g., SBI"
              />
            </div>
            <div>
              <Label>Principal Amount (₹)</Label>
              <Input
                type="number"
                value={loanForm.principal_amount}
                onChange={(e) => setLoanForm({ ...loanForm, principal_amount: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Current Outstanding (₹)</Label>
              <Input
                type="number"
                value={loanForm.current_balance}
                onChange={(e) => setLoanForm({ ...loanForm, current_balance: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div>
              <Label>EMI Amount (₹)</Label>
              <Input
                type="number"
                value={loanForm.emi_amount}
                onChange={(e) => setLoanForm({ ...loanForm, emi_amount: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div>
              <Label>EMI Date (Day of Month)</Label>
              <Input
                type="number"
                min="1"
                max="31"
                value={loanForm.emi_date}
                onChange={(e) => setLoanForm({ ...loanForm, emi_date: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div>
              <Label>Interest Rate (% p.a.)</Label>
              <Input
                type="number"
                step="0.1"
                value={loanForm.interest_rate}
                onChange={(e) => setLoanForm({ ...loanForm, interest_rate: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
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
              <Select value={investmentForm.investment_type} onValueChange={(value) => setInvestmentForm({ ...investmentForm, investment_type: value as any })}>
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
                value={investmentForm.invested_amount}
                onChange={(e) => setInvestmentForm({ ...investmentForm, invested_amount: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Current Value (₹)</Label>
              <Input
                type="number"
                value={investmentForm.current_value}
                onChange={(e) => setInvestmentForm({ ...investmentForm, current_value: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div>
              <Label>SIP Amount (₹) - Optional</Label>
              <Input
                type="number"
                value={investmentForm.sip_amount}
                onChange={(e) => setInvestmentForm({ ...investmentForm, sip_amount: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div>
              <Label>SIP Date (Day of Month)</Label>
              <Input
                type="number"
                min="1"
                max="31"
                value={investmentForm.sip_date}
                onChange={(e) => setInvestmentForm({ ...investmentForm, sip_date: parseInt(e.target.value) || 1 })}
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
              <Select value={insuranceForm.policy_type} onValueChange={(value) => setInsuranceForm({ ...insuranceForm, policy_type: value as any })}>
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
                value={insuranceForm.company_name}
                onChange={(e) => setInsuranceForm({ ...insuranceForm, company_name: e.target.value })}
                placeholder="e.g., LIC, HDFC Life"
              />
            </div>
            <div>
              <Label>Policy Number</Label>
              <Input
                value={insuranceForm.policy_number}
                onChange={(e) => setInsuranceForm({ ...insuranceForm, policy_number: e.target.value })}
                placeholder="Policy number"
              />
            </div>
            <div>
              <Label>Sum Assured (₹)</Label>
              <Input
                type="number"
                value={insuranceForm.sum_assured}
                onChange={(e) => setInsuranceForm({ ...insuranceForm, sum_assured: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Premium Amount (₹)</Label>
              <Input
                type="number"
                value={insuranceForm.premium_amount}
                onChange={(e) => setInsuranceForm({ ...insuranceForm, premium_amount: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Premium Frequency</Label>
              <Select value={insuranceForm.premium_frequency} onValueChange={(value) => setInsuranceForm({ ...insuranceForm, premium_frequency: value as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="half_yearly">Half Yearly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Premium Due Date (Day of Month)</Label>
              <Input
                type="number"
                min="1"
                max="31"
                value={insuranceForm.premium_due_date}
                onChange={(e) => setInsuranceForm({ ...insuranceForm, premium_due_date: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div>
              <Label>Policy Start Date</Label>
              <Input
                type="date"
                value={insuranceForm.policy_start_date}
                onChange={(e) => setInsuranceForm({ ...insuranceForm, policy_start_date: e.target.value })}
              />
            </div>
            <div>
              <Label>Policy End Date</Label>
              <Input
                type="date"
                value={insuranceForm.policy_end_date}
                onChange={(e) => setInsuranceForm({ ...insuranceForm, policy_end_date: e.target.value })}
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
              <Select value={propertyForm.property_type} onValueChange={(value) => setPropertyForm({ ...propertyForm, property_type: value as any })}>
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
                value={propertyForm.purchase_price}
                onChange={(e) => setPropertyForm({ ...propertyForm, purchase_price: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Current Value (₹)</Label>
              <Input
                type="number"
                value={propertyForm.current_value}
                onChange={(e) => setPropertyForm({ ...propertyForm, current_value: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Ownership Percentage (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={propertyForm.ownership_percentage}
                onChange={(e) => setPropertyForm({ ...propertyForm, ownership_percentage: parseFloat(e.target.value) || 100 })}
                placeholder="100"
              />
            </div>
            <div>
              <Label>Monthly Rental Income (₹) - Optional</Label>
              <Input
                type="number"
                value={propertyForm.rental_income}
                onChange={(e) => setPropertyForm({ ...propertyForm, rental_income: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Purchase Date</Label>
              <Input
                type="date"
                value={propertyForm.purchase_date}
                onChange={(e) => setPropertyForm({ ...propertyForm, purchase_date: e.target.value })}
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
                placeholder="e.g., Car EMI, Netflix"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={recurringForm.description}
                onChange={(e) => setRecurringForm({ ...recurringForm, description: e.target.value })}
                placeholder="Payment description"
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
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Payment Date (Day of Month)</Label>
              <Input
                type="number"
                min="1"
                max="31"
                value={recurringForm.payment_date}
                onChange={(e) => setRecurringForm({ ...recurringForm, payment_date: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={recurringForm.start_date}
                onChange={(e) => setRecurringForm({ ...recurringForm, start_date: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="auto_create"
                checked={recurringForm.auto_create_transaction}
                onChange={(e) => setRecurringForm({ ...recurringForm, auto_create_transaction: e.target.checked })}
              />
              <Label htmlFor="auto_create">Auto-create transactions</Label>
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

export default EnhancedAccounts;