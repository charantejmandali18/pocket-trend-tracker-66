import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Copy, 
  Calendar,
  Target,
  TrendingUp,
  TrendingDown,
  Edit2,
  Trash2,
  Save
} from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';

interface BudgetItem {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  name: string;
  plannedAmount: number;
  priority: 'high' | 'medium' | 'low';
  type: 'income' | 'expense';
}

const Planning = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([
    {
      id: '1',
      categoryId: 'income',
      categoryName: 'Salary',
      categoryColor: '#059669',
      name: 'Monthly Salary',
      plannedAmount: 50000,
      priority: 'high',
      type: 'income'
    },
    {
      id: '2',
      categoryId: 'food',
      categoryName: 'Food & Dining',
      categoryColor: '#EF4444',
      name: 'Groceries & Dining',
      plannedAmount: 8000,
      priority: 'high',
      type: 'expense'
    },
    {
      id: '3',
      categoryId: 'transport',
      categoryName: 'Transportation',
      categoryColor: '#3B82F6',
      name: 'Fuel & Transport',
      plannedAmount: 5000,
      priority: 'medium',
      type: 'expense'
    }
  ]);

  const [newItem, setNewItem] = useState({
    categoryId: '',
    name: '',
    plannedAmount: 0,
    priority: 'medium' as const,
    type: 'expense' as const
  });

  const categories = [
    { id: 'income', name: 'Income', color: '#059669', type: 'income' },
    { id: 'food', name: 'Food & Dining', color: '#EF4444', type: 'expense' },
    { id: 'transport', name: 'Transportation', color: '#3B82F6', type: 'expense' },
    { id: 'bills', name: 'Bills & Utilities', color: '#10B981', type: 'expense' },
    { id: 'entertainment', name: 'Entertainment', color: '#F59E0B', type: 'expense' },
    { id: 'shopping', name: 'Shopping', color: '#8B5CF6', type: 'expense' },
  ];

  const incomeItems = budgetItems.filter(item => item.type === 'income');
  const expenseItems = budgetItems.filter(item => item.type === 'expense');
  const totalIncome = incomeItems.reduce((sum, item) => sum + item.plannedAmount, 0);
  const totalExpenses = expenseItems.reduce((sum, item) => sum + item.plannedAmount, 0);
  const plannedSavings = totalIncome - totalExpenses;

  const handleAddItem = () => {
    if (!newItem.categoryId || !newItem.name || newItem.plannedAmount <= 0) return;

    const category = categories.find(c => c.id === newItem.categoryId);
    if (!category) return;

    const item: BudgetItem = {
      id: Date.now().toString(),
      categoryId: newItem.categoryId,
      categoryName: category.name,
      categoryColor: category.color,
      name: newItem.name,
      plannedAmount: newItem.plannedAmount,
      priority: newItem.priority,
      type: newItem.type
    };

    setBudgetItems([...budgetItems, item]);
    setNewItem({
      categoryId: '',
      name: '',
      plannedAmount: 0,
      priority: 'medium',
      type: 'expense'
    });
  };

  const handleDeleteItem = (id: string) => {
    setBudgetItems(budgetItems.filter(item => item.id !== id));
  };

  const copyFromPreviousMonth = () => {
    // TODO: Implement copy from previous month functionality
    console.log('Copy from previous month');
  };

  const saveBudget = () => {
    // TODO: Implement save budget functionality
    console.log('Save budget', { currentMonth, budgetItems });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Budget Planning
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Plan your income and expenses for {format(currentMonth, 'MMMM yyyy')}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={copyFromPreviousMonth}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Previous
          </Button>
          <Button onClick={saveBudget}>
            <Save className="h-4 w-4 mr-2" />
            Save Budget
          </Button>
        </div>
      </div>

      {/* Month Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              ← Previous
            </Button>
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-500" />
              <span className="text-lg font-semibold">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
            </div>
            <Button 
              variant="outline"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              Next →
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Budget Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">
              Total Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{totalIncome.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ₹{totalExpenses.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">
              Planned Savings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${plannedSavings >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              ₹{plannedSavings.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">
              {totalIncome > 0 ? `${((plannedSavings / totalIncome) * 100).toFixed(1)}% savings rate` : ''}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Items */}
      <Tabs defaultValue="expenses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="income">
            <TrendingUp className="h-4 w-4 mr-2" />
            Income ({incomeItems.length})
          </TabsTrigger>
          <TabsTrigger value="expenses">
            <TrendingDown className="h-4 w-4 mr-2" />
            Expenses ({expenseItems.length})
          </TabsTrigger>
          <TabsTrigger value="add">
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </TabsTrigger>
        </TabsList>

        <TabsContent value="income">
          <Card>
            <CardHeader>
              <CardTitle>Income Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {incomeItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: item.categoryColor }}
                      />
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.categoryName}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant={item.priority === 'high' ? 'destructive' : item.priority === 'medium' ? 'default' : 'secondary'}>
                        {item.priority}
                      </Badge>
                      <div className="text-lg font-semibold text-green-600">
                        ₹{item.plannedAmount.toLocaleString()}
                      </div>
                      <div className="flex space-x-1">
                        <Button size="sm" variant="ghost">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteItem(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle>Planned Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expenseItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: item.categoryColor }}
                      />
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.categoryName}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant={item.priority === 'high' ? 'destructive' : item.priority === 'medium' ? 'default' : 'secondary'}>
                        {item.priority}
                      </Badge>
                      <div className="text-lg font-semibold text-red-600">
                        ₹{item.plannedAmount.toLocaleString()}
                      </div>
                      <div className="flex space-x-1">
                        <Button size="sm" variant="ghost">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteItem(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add">
          <Card>
            <CardHeader>
              <CardTitle>Add New Budget Item</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={newItem.type} onValueChange={(value: string) => setNewItem({...newItem, type: value as 'expense'})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={newItem.categoryId} onValueChange={(value) => setNewItem({...newItem, categoryId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.filter(c => c.type === newItem.type).map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                            <span>{category.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newItem.name}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                    placeholder="Enter item name"
                  />
                </div>

                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={newItem.plannedAmount || ''}
                    onChange={(e) => setNewItem({...newItem, plannedAmount: parseFloat(e.target.value) || 0})}
                    placeholder="Enter amount"
                  />
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newItem.priority} onValueChange={(value: string) => setNewItem({...newItem, priority: value as 'medium'})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button onClick={handleAddItem} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Planning;