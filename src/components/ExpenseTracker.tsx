import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { format } from 'date-fns';

interface Income {
  id: string;
  name: string;
  amount: number;
}

interface FixedExpense {
  id: string;
  expense_name: string;
  due_date: number | null;
  amount: number;
  is_paid: boolean;
}

interface FloatingExpense {
  id: string;
  expense_name: string;
  amount: number;
}

interface BankBalance {
  id: string;
  bank_name: string;
  balance: number;
}

interface CreditCard {
  id: string;
  card_name: string;
  credit_limit: number;
  available_credit: number;
  outstanding_amount: number;
}

const ExpenseTracker = () => {
  const [income, setIncome] = useState<Income[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [floatingExpenses, setFloatingExpenses] = useState<FloatingExpense[]>([]);
  const [bankBalances, setBankBalances] = useState<BankBalance[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [currentMonth] = useState(format(new Date(), 'yyyy-MM-01'));
  const [user, setUser] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<{type: string, id: string} | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user, currentMonth]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchAllData = async () => {
    if (!user) return;

    try {
      const [incomeData, fixedData, floatingData, bankData, cardData] = await Promise.all([
        supabase.from('income').select('*').eq('user_id', user.id).eq('month_year', currentMonth),
        supabase.from('fixed_expenses').select('*').eq('user_id', user.id).eq('month_year', currentMonth),
        supabase.from('floating_expenses').select('*').eq('user_id', user.id).eq('month_year', currentMonth),
        supabase.from('bank_balances').select('*').eq('user_id', user.id).eq('month_year', currentMonth),
        supabase.from('credit_cards').select('*').eq('user_id', user.id).eq('month_year', currentMonth),
      ]);

      setIncome(incomeData.data || []);
      setFixedExpenses(fixedData.data || []);
      setFloatingExpenses(floatingData.data || []);
      setBankBalances(bankData.data || []);
      setCreditCards(cardData.data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      });
    }
  };

  // Calculation functions
  const totalIncome = income.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalFixedExpenses = fixedExpenses.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalFloatingExpenses = floatingExpenses.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalExpenses = totalFixedExpenses + totalFloatingExpenses;
  const remainingAmount = totalIncome - totalFixedExpenses;
  const finalBalance = totalIncome - totalExpenses;
  const totalBankBalance = bankBalances.reduce((sum, item) => sum + (item.balance || 0), 0);

  // CRUD operations
  const addIncomeItem = async () => {
    if (!user) return;
    
    const { error } = await supabase.from('income').insert({
      user_id: user.id,
      name: 'New Income',
      amount: 0,
      month_year: currentMonth,
    });

    if (!error) {
      fetchAllData();
      toast({ title: "Success", description: "Income item added" });
    }
  };

  const updateIncomeItem = async (id: string, updates: Partial<Income>) => {
    const { error } = await supabase.from('income').update(updates).eq('id', id);
    if (!error) {
      fetchAllData();
      setEditingItem(null);
    }
  };

  const deleteIncomeItem = async (id: string) => {
    const { error } = await supabase.from('income').delete().eq('id', id);
    if (!error) {
      fetchAllData();
      toast({ title: "Success", description: "Income item deleted" });
    }
  };

  // Fixed Expenses CRUD
  const addFixedExpense = async () => {
    if (!user) return;
    
    const { error } = await supabase.from('fixed_expenses').insert({
      user_id: user.id,
      expense_name: 'New Expense',
      amount: 0,
      due_date: 1,
      is_paid: false,
      month_year: currentMonth,
    });

    if (!error) {
      fetchAllData();
      toast({ title: "Success", description: "Fixed expense added" });
    }
  };

  const updateFixedExpense = async (id: string, updates: Partial<FixedExpense>) => {
    const { error } = await supabase.from('fixed_expenses').update(updates).eq('id', id);
    if (!error) {
      fetchAllData();
      setEditingItem(null);
    }
  };

  const deleteFixedExpense = async (id: string) => {
    const { error } = await supabase.from('fixed_expenses').delete().eq('id', id);
    if (!error) {
      fetchAllData();
      toast({ title: "Success", description: "Fixed expense deleted" });
    }
  };

  // Floating Expenses CRUD
  const addFloatingExpense = async () => {
    if (!user) return;
    
    const { error } = await supabase.from('floating_expenses').insert({
      user_id: user.id,
      expense_name: 'New Expense',
      amount: 0,
      month_year: currentMonth,
    });

    if (!error) {
      fetchAllData();
      toast({ title: "Success", description: "Floating expense added" });
    }
  };

  const updateFloatingExpense = async (id: string, updates: Partial<FloatingExpense>) => {
    const { error } = await supabase.from('floating_expenses').update(updates).eq('id', id);
    if (!error) {
      fetchAllData();
      setEditingItem(null);
    }
  };

  const deleteFloatingExpense = async (id: string) => {
    const { error } = await supabase.from('floating_expenses').delete().eq('id', id);
    if (!error) {
      fetchAllData();
      toast({ title: "Success", description: "Floating expense deleted" });
    }
  };

  // Bank Balances CRUD
  const addBankBalance = async () => {
    if (!user) return;
    
    const { error } = await supabase.from('bank_balances').insert({
      user_id: user.id,
      bank_name: 'New Bank',
      balance: 0,
      month_year: currentMonth,
    });

    if (!error) {
      fetchAllData();
      toast({ title: "Success", description: "Bank balance added" });
    }
  };

  const updateBankBalance = async (id: string, updates: Partial<BankBalance>) => {
    const { error } = await supabase.from('bank_balances').update(updates).eq('id', id);
    if (!error) {
      fetchAllData();
      setEditingItem(null);
    }
  };

  const deleteBankBalance = async (id: string) => {
    const { error } = await supabase.from('bank_balances').delete().eq('id', id);
    if (!error) {
      fetchAllData();
      toast({ title: "Success", description: "Bank balance deleted" });
    }
  };

  // Credit Cards CRUD
  const addCreditCard = async () => {
    if (!user) return;
    
    const { error } = await supabase.from('credit_cards').insert({
      user_id: user.id,
      card_name: 'New Card',
      credit_limit: 0,
      available_credit: 0,
      outstanding_amount: 0,
      month_year: currentMonth,
    });

    if (!error) {
      fetchAllData();
      toast({ title: "Success", description: "Credit card added" });
    }
  };

  const updateCreditCard = async (id: string, updates: Partial<CreditCard>) => {
    const { error } = await supabase.from('credit_cards').update(updates).eq('id', id);
    if (!error) {
      fetchAllData();
      setEditingItem(null);
    }
  };

  const deleteCreditCard = async (id: string) => {
    const { error } = await supabase.from('credit_cards').delete().eq('id', id);
    if (!error) {
      fetchAllData();
      toast({ title: "Success", description: "Credit card deleted" });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Please Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">You need to be signed in to use the expense tracker.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Expense Tracker - {format(new Date(currentMonth), 'MMMM yyyy')}</h1>
        
        {/* Top Row */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
          {/* Income */}
          <Card className="lg:col-span-1">
            <CardHeader className="bg-green-50 dark:bg-green-900/20">
              <CardTitle className="text-center">INCOME</CardTitle>
              <div className="text-2xl font-bold text-center">₹{totalIncome.toLocaleString()}</div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Name</span>
                  <span className="font-semibold">Amount</span>
                </div>
                {income.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    {editingItem?.type === 'income' && editingItem?.id === item.id ? (
                      <div className="flex gap-2 w-full">
                        <Input 
                          defaultValue={item.name}
                          onBlur={(e) => updateIncomeItem(item.id, { name: e.target.value })}
                          className="text-sm"
                        />
                        <Input 
                          type="number"
                          defaultValue={item.amount}
                          onBlur={(e) => updateIncomeItem(item.id, { amount: parseFloat(e.target.value) || 0 })}
                          className="text-sm w-24"
                        />
                        <Button size="sm" variant="ghost" onClick={() => setEditingItem(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{item.amount.toLocaleString()}</span>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => setEditingItem({type: 'income', id: item.id})}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => deleteIncomeItem(item.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={addIncomeItem} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Income
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Amount After Fixed Expenses */}
          <Card className="lg:col-span-1">
            <CardHeader className="bg-blue-50 dark:bg-blue-900/20">
              <CardTitle className="text-center">AMOUNT AFTER FIXED EXPENSES</CardTitle>
              <div className="text-2xl font-bold text-center">₹{remainingAmount.toLocaleString()}</div>
            </CardHeader>
          </Card>

          {/* Remaining Amount */}
          <Card className="lg:col-span-1">
            <CardHeader className="bg-yellow-50 dark:bg-yellow-900/20">
              <CardTitle className="text-center">REMAINING AMOUNT</CardTitle>
              <div className="text-2xl font-bold text-center">₹{(remainingAmount - totalFloatingExpenses).toLocaleString()}</div>
            </CardHeader>
          </Card>

          {/* Bank Balances */}
          <Card className="lg:col-span-1">
            <CardHeader className="bg-purple-50 dark:bg-purple-900/20">
              <CardTitle className="text-center">BANK BALANCES</CardTitle>
              <div className="text-2xl font-bold text-center">₹{totalBankBalance.toLocaleString()}</div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                {bankBalances.map((bank) => (
                  <div key={bank.id} className="flex justify-between items-center text-sm">
                    {editingItem?.type === 'bank' && editingItem?.id === bank.id ? (
                      <div className="flex gap-1 w-full">
                        <Input 
                          defaultValue={bank.bank_name}
                          onBlur={(e) => updateBankBalance(bank.id, { bank_name: e.target.value })}
                          className="text-xs"
                        />
                        <Input 
                          type="number"
                          defaultValue={bank.balance}
                          onBlur={(e) => updateBankBalance(bank.id, { balance: parseFloat(e.target.value) || 0 })}
                          className="text-xs w-20"
                        />
                        <Button size="sm" variant="ghost" onClick={() => setEditingItem(null)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span>{bank.bank_name}</span>
                        <div className="flex items-center gap-1">
                          <span>{bank.balance.toLocaleString()}</span>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => setEditingItem({type: 'bank', id: bank.id})}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => deleteBankBalance(bank.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={addBankBalance} className="w-full">
                  <Plus className="h-3 w-3 mr-1" />
                  Add Bank
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Credit Cards */}
          <Card className="lg:col-span-1">
            <CardHeader className="bg-red-50 dark:bg-red-900/20">
              <CardTitle className="text-center">CREDIT CARDS</CardTitle>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-center">
                  <div className="font-semibold">Available</div>
                  <div>₹{creditCards.reduce((sum, card) => sum + card.available_credit, 0).toLocaleString()}</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">Outstanding</div>
                  <div>₹{creditCards.reduce((sum, card) => sum + card.outstanding_amount, 0).toLocaleString()}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2 max-h-32 overflow-y-auto">
                <div className="grid grid-cols-4 gap-1 text-xs font-semibold">
                  <span>Name</span>
                  <span>Limit</span>
                  <span>Available</span>
                  <span>Outstanding</span>
                </div>
                {creditCards.map((card) => (
                  <div key={card.id} className="text-xs">
                    {editingItem?.type === 'credit' && editingItem?.id === card.id ? (
                      <div className="space-y-1">
                        <Input 
                          defaultValue={card.card_name}
                          onBlur={(e) => updateCreditCard(card.id, { card_name: e.target.value })}
                          className="text-xs h-6"
                        />
                        <div className="grid grid-cols-3 gap-1">
                          <Input 
                            type="number"
                            defaultValue={card.credit_limit}
                            onBlur={(e) => updateCreditCard(card.id, { credit_limit: parseFloat(e.target.value) || 0 })}
                            className="text-xs h-6"
                          />
                          <Input 
                            type="number"
                            defaultValue={card.available_credit}
                            onBlur={(e) => updateCreditCard(card.id, { available_credit: parseFloat(e.target.value) || 0 })}
                            className="text-xs h-6"
                          />
                          <Input 
                            type="number"
                            defaultValue={card.outstanding_amount}
                            onBlur={(e) => updateCreditCard(card.id, { outstanding_amount: parseFloat(e.target.value) || 0 })}
                            className="text-xs h-6"
                          />
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => setEditingItem(null)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-1 items-center">
                        <span>{card.card_name}</span>
                        <span>{card.credit_limit.toLocaleString()}</span>
                        <span>{card.available_credit.toLocaleString()}</span>
                        <span>{card.outstanding_amount.toLocaleString()}</span>
                        <div className="flex gap-1 col-span-4 justify-end">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => setEditingItem({type: 'credit', id: card.id})}
                          >
                            <Edit2 className="h-2 w-2" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => deleteCreditCard(card.id)}
                          >
                            <Trash2 className="h-2 w-2" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={addCreditCard} className="w-full">
                  <Plus className="h-3 w-3 mr-1" />
                  Add Card
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Fixed Expenses */}
          <Card>
            <CardHeader className="bg-red-100 dark:bg-red-900/30">
              <CardTitle>FIXED EXPENSES</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-4 gap-2 text-sm font-semibold">
                  <span>Expense</span>
                  <span>Date</span>
                  <span>Amount</span>
                  <span>Paid</span>
                </div>
                {fixedExpenses.map((expense) => (
                  <div key={expense.id} className="grid grid-cols-4 gap-2 text-sm items-center">
                    <span>{expense.expense_name}</span>
                    <span>{expense.due_date}</span>
                    <span>{expense.amount.toLocaleString()}</span>
                    <Checkbox 
                      checked={expense.is_paid}
                      onCheckedChange={(checked) => 
                        updateFixedExpense(expense.id, { is_paid: !!checked })
                      }
                    />
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={addFixedExpense} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Fixed Expense
                </Button>
                <div className="border-t pt-2 font-bold">
                  Total: ₹{totalFixedExpenses.toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Floating Expenses */}
          <Card>
            <CardHeader className="bg-orange-100 dark:bg-orange-900/30">
              <CardTitle>FLOATING EXPENSES</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-2 text-sm font-semibold">
                  <span>Expense</span>
                  <span>Amount</span>
                </div>
                {floatingExpenses.map((expense) => (
                  <div key={expense.id} className="grid grid-cols-2 gap-2 text-sm items-center">
                    {editingItem?.type === 'floating' && editingItem?.id === expense.id ? (
                      <div className="flex gap-1 col-span-2">
                        <Input 
                          defaultValue={expense.expense_name}
                          onBlur={(e) => updateFloatingExpense(expense.id, { expense_name: e.target.value })}
                          className="text-xs"
                        />
                        <Input 
                          type="number"
                          defaultValue={expense.amount}
                          onBlur={(e) => updateFloatingExpense(expense.id, { amount: parseFloat(e.target.value) || 0 })}
                          className="text-xs w-20"
                        />
                        <Button size="sm" variant="ghost" onClick={() => setEditingItem(null)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span>{expense.expense_name}</span>
                        <div className="flex items-center gap-1 justify-between">
                          <span>{expense.amount.toLocaleString()}</span>
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => setEditingItem({type: 'floating', id: expense.id})}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => deleteFloatingExpense(expense.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={addFloatingExpense} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Floating Expense
                </Button>
                <div className="border-t pt-2 font-bold">
                  Total: ₹{totalFloatingExpenses.toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="bg-gray-100 dark:bg-gray-800">
                <CardTitle className="text-center">FINAL BALANCES</CardTitle>
                <div className="text-2xl font-bold text-center">₹{finalBalance.toLocaleString()}</div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="bg-gray-100 dark:bg-gray-800">
                <CardTitle className="text-center">TOTAL EXP</CardTitle>
                <div className="text-2xl font-bold text-center">₹{totalExpenses.toLocaleString()}</div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="bg-gray-100 dark:bg-gray-800">
                <CardTitle className="text-center">INCOME - EXP</CardTitle>
                <div className="text-2xl font-bold text-center">₹{finalBalance.toLocaleString()}</div>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseTracker;