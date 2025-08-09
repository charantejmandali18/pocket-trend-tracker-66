// Simple localStorage-based data storage for imported transactions
// This provides a temporary solution until the database schema is properly applied

export interface StoredTransaction {
  id: string;
  user_id: string; // The person who actually made the transaction
  group_id?: string | null;
  created_by: string; // The person who created the record (importer)
  transaction_type: 'income' | 'expense';
  amount: number;
  description: string;
  category_id: string;
  transaction_date: string;
  payment_method: string;
  account_name: string;
  notes: string;
  source: string;
  created_at: string;
  member_email?: string; // For group imports - the actual member's email
  categories?: {
    id: string;
    name: string;
    color: string;
    icon?: string;
  };
}

export interface StoredCategory {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface StoredAccount {
  id: string;
  name: string;
  email: string;
  type: 'user' | 'external';
  created_at: string;
}

const STORAGE_KEYS = {
  TRANSACTIONS: 'pocket_tracker_transactions',
  CATEGORIES: 'pocket_tracker_categories',
  ACCOUNTS: 'pocket_tracker_accounts'
};

// Default categories
const DEFAULT_CATEGORIES: StoredCategory[] = [
  { id: 'food', name: 'Food & Dining', color: '#EF4444', icon: 'utensils' },
  { id: 'transport', name: 'Transportation', color: '#3B82F6', icon: 'car' },
  { id: 'bills', name: 'Bills & Utilities', color: '#10B981', icon: 'receipt' },
  { id: 'entertainment', name: 'Entertainment', color: '#8B5CF6', icon: 'film' },
  { id: 'healthcare', name: 'Healthcare', color: '#EC4899', icon: 'heart' },
  { id: 'education', name: 'Education', color: '#F59E0B', icon: 'book' },
  { id: 'income', name: 'Income', color: '#059669', icon: 'trending-up' },
  { id: 'other', name: 'Other', color: '#6B7280', icon: 'tag' },
  
  // Financial account related categories
  { id: 'loan_payment', name: 'Loan Payment', color: '#DC2626', icon: 'credit-card' },
  { id: 'investment', name: 'Investment', color: '#059669', icon: 'trending-up' },
  { id: 'investment_withdrawal', name: 'Investment Withdrawal', color: '#DC2626', icon: 'trending-down' },
  { id: 'recurring_payment', name: 'Recurring Payment', color: '#7C3AED', icon: 'repeat' },
  { id: 'account_update', name: 'Account Update', color: '#6B7280', icon: 'edit' },
  { id: 'income_misc', name: 'Income - Miscellaneous', color: '#10B981', icon: 'plus' },
  { id: 'expense_misc', name: 'Expense - Miscellaneous', color: '#EF4444', icon: 'minus' }
];

// Transaction storage
export const getStoredTransactions = (): StoredTransaction[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading transactions from storage:', error);
    return [];
  }
};

export const addStoredTransaction = (transaction: Omit<StoredTransaction, 'id' | 'created_at'>): StoredTransaction | null => {
  const transactions = getStoredTransactions();
  
  // Check for duplicates
  const isDuplicate = transactions.some(existing => 
    existing.user_id === transaction.user_id &&
    existing.amount === transaction.amount &&
    existing.transaction_date === transaction.transaction_date &&
    existing.description === transaction.description &&
    existing.account_name === transaction.account_name
  );
  
  if (isDuplicate) {
    console.log('Duplicate transaction detected in localStorage, skipping insertion:', {
      amount: transaction.amount,
      date: transaction.transaction_date,
      description: transaction.description
    });
    return null;
  }
  
  const newTransaction: StoredTransaction = {
    ...transaction,
    id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString()
  };
  
  transactions.push(newTransaction);
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  return newTransaction;
};

export const updateStoredTransaction = (transactionId: string, updates: Partial<StoredTransaction>): boolean => {
  try {
    const transactions = getStoredTransactions();
    const index = transactions.findIndex(t => t.id === transactionId);
    
    if (index !== -1) {
      transactions[index] = { ...transactions[index], ...updates };
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error updating transaction:', error);
    return false;
  }
};

export const deleteStoredTransaction = (transactionId: string): boolean => {
  try {
    const transactions = getStoredTransactions();
    const filtered = transactions.filter(t => t.id !== transactionId);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return false;
  }
};

export const clearStoredTransactions = () => {
  localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
};

// Category storage
export const getStoredCategories = (): StoredCategory[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return stored ? JSON.parse(stored) : DEFAULT_CATEGORIES;
  } catch (error) {
    console.error('Error loading categories from storage:', error);
    return DEFAULT_CATEGORIES;
  }
};

export const addStoredCategory = (category: Omit<StoredCategory, 'id'>): StoredCategory => {
  const categories = getStoredCategories();
  const newCategory: StoredCategory = {
    ...category,
    id: category.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  };
  
  // Check if category already exists
  const exists = categories.find(c => c.id === newCategory.id || c.name.toLowerCase() === category.name.toLowerCase());
  if (exists) {
    return exists;
  }
  
  categories.push(newCategory);
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  return newCategory;
};

export const findOrCreateStoredCategory = (name: string, color?: string): StoredCategory => {
  const categories = getStoredCategories();
  const existing = categories.find(c => c.name.toLowerCase() === name.toLowerCase());
  
  if (existing) {
    return existing;
  }
  
  // Create new category
  const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];
  const defaultColor = color || colors[Math.floor(Math.random() * colors.length)];
  
  return addStoredCategory({ name, color: defaultColor });
};

// Account storage
export const getStoredAccounts = (): StoredAccount[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading accounts from storage:', error);
    return [];
  }
};

export const addStoredAccount = (account: Omit<StoredAccount, 'id' | 'created_at'>): StoredAccount => {
  const accounts = getStoredAccounts();
  
  // Check if account already exists
  const existing = accounts.find(a => a.email.toLowerCase() === account.email.toLowerCase());
  if (existing) {
    return existing;
  }
  
  const newAccount: StoredAccount = {
    ...account,
    id: `account_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString()
  };
  
  accounts.push(newAccount);
  localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  return newAccount;
};

// Group storage
export interface StoredGroup {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  group_code: string;
  created_at: string;
  is_active: boolean;
  members: string[]; // Array of user IDs who are members
}

// Group membership storage
export interface GroupMembership {
  user_id: string;
  group_id: string;
  joined_at: string;
  role: 'owner' | 'member';
}

const GROUPS_KEY = 'pocket_tracker_groups';
const GROUP_MEMBERSHIPS_KEY = 'pocket_tracker_group_memberships';

export const getStoredGroups = (): StoredGroup[] => {
  try {
    const stored = localStorage.getItem(GROUPS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading groups from storage:', error);
    return [];
  }
};

export const getGroupMemberships = (): GroupMembership[] => {
  try {
    const stored = localStorage.getItem(GROUP_MEMBERSHIPS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading group memberships from storage:', error);
    return [];
  }
};

export const getUserGroups = (userId: string): StoredGroup[] => {
  const allGroups = getStoredGroups();
  const memberships = getGroupMemberships();
  
  const userGroupIds = memberships
    .filter(m => m.user_id === userId)
    .map(m => m.group_id);
  
  return allGroups.filter(g => userGroupIds.includes(g.id) && g.is_active);
};

export const addStoredGroup = (group: Omit<StoredGroup, 'id' | 'group_code' | 'created_at' | 'members' | 'is_active'>): StoredGroup => {
  const groups = getStoredGroups();
  const memberships = getGroupMemberships();
  
  // Generate group code
  const groupCode = Math.random().toString(36).substr(2, 8).toUpperCase();
  
  const newGroup: StoredGroup = {
    ...group,
    id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    group_code: groupCode,
    created_at: new Date().toISOString(),
    is_active: true,
    members: [group.owner_id]
  };
  
  groups.push(newGroup);
  localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
  
  // Add owner as member
  const newMembership: GroupMembership = {
    user_id: group.owner_id,
    group_id: newGroup.id,
    joined_at: new Date().toISOString(),
    role: 'owner'
  };
  
  memberships.push(newMembership);
  localStorage.setItem(GROUP_MEMBERSHIPS_KEY, JSON.stringify(memberships));
  
  return newGroup;
};

export const joinStoredGroup = (groupCode: string, userId: string): boolean => {
  const groups = getStoredGroups();
  const memberships = getGroupMemberships();
  
  const group = groups.find(g => g.group_code === groupCode && g.is_active);
  if (!group) return false;
  
  // Check if already a member
  const existingMembership = memberships.find(m => 
    m.group_id === group.id && m.user_id === userId
  );
  if (existingMembership) return false;
  
  // Add membership
  const newMembership: GroupMembership = {
    user_id: userId,
    group_id: group.id,
    joined_at: new Date().toISOString(),
    role: 'member'
  };
  
  memberships.push(newMembership);
  localStorage.setItem(GROUP_MEMBERSHIPS_KEY, JSON.stringify(memberships));
  
  // Update group members list
  group.members.push(userId);
  localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
  
  return true;
};

export const findGroupByCode = (groupCode: string): StoredGroup | null => {
  const groups = getStoredGroups();
  return groups.find(g => g.group_code === groupCode && g.is_active) || null;
};

// Financial Account storage
export interface AccountGroupAssignment {
  id?: string;
  account_id: string;
  group_id: string;
  contribution_type: 'none' | 'amount' | 'percentage';
  contribution_amount?: number;
  contribution_percentage?: number;
  created_at?: string;
}

export interface FinancialAccount {
  id: string;
  user_id: string;
  group_id?: string | null;
  name: string;
  type: 'savings' | 'checking' | 'credit_card' | 'loan' | 'investment' | 'cash' | 'real_estate' | 'vehicle' | 'other' | 'recurring' | 'mutual_fund' | 'stocks' | 'sip' | 'insurance' | 'life_insurance' | 'health_insurance';
  bank_name?: string;
  account_number?: string;
  balance: number;
  credit_limit?: number;
  interest_rate?: number;
  created_at: string;
  is_active: boolean;
  
  // Legacy single group assignment (deprecated - use group_assignments instead)
  group_id?: string | null;
  contribution_type?: 'none' | 'amount' | 'percentage';
  contribution_amount?: number;
  contribution_percentage?: number;
  
  // Multiple group assignments
  group_assignments?: AccountGroupAssignment[];
  
  // Enhanced loan and EMI fields
  monthly_emi?: number;
  next_due_date?: string;
  remaining_terms?: number;
  frequency?: 'monthly' | 'quarterly' | 'yearly';
  
  // Advanced loan calculations
  principal_amount?: number; // Original loan amount
  loan_tenure_months?: number; // Total loan tenure in months
  interest_type?: 'simple' | 'compound' | 'reducing_balance' | 'flat_rate';
  processing_fee?: number;
  processing_fee_percentage?: number;
  is_no_cost_emi?: boolean; // For no-cost EMI products
  is_interest_free?: boolean; // For 0% interest loans
  effective_interest_rate?: number; // Calculated effective rate including fees
  total_interest_payable?: number; // Total interest to be paid over tenure
  total_amount_payable?: number; // Principal + Total Interest
  emi_start_date?: string;
  loan_end_date?: string;
  
  // Home loan specific features
  is_home_loan?: boolean; // Identifies home loans
  is_under_construction?: boolean; // Under construction property
  sanctioned_amount?: number; // Total sanctioned loan amount
  disbursed_amount?: number; // Amount actually disbursed so far
  moratorium_period_months?: number; // Interest-only payment period
  moratorium_end_date?: string; // When full EMI starts
  is_in_moratorium?: boolean; // Currently in moratorium period
  construction_stages?: ConstructionStage[]; // Disbursement stages
  possession_date?: string; // Expected possession date
  disbursement_history?: Array<{
    date: string;
    amount: number;
    cumulative_amount: number;
    emi_calculated: number;
  }>; // Track actual disbursements and their EMI impact
  actual_moratorium_emi?: number; // Override for real bank EMI amount
  
  // Group asset splitting
  is_shared?: boolean;
  split_type?: 'equal' | 'fractional' | 'custom';
  split_details?: GroupAssetSplit[];
  owned_by?: string; // For group assets, who originally owns it
  
  // Pool contribution features
  is_pool_contribution?: boolean; // True if this account represents a pool contribution
  linked_personal_account?: string; // ID of the original personal account
  contributed_to_pools?: string[]; // Array of group IDs this account contributes to
}

export interface GroupAssetSplit {
  user_id: string;
  user_email: string;
  percentage?: number;
  fixed_amount?: number;
  split_value: number; // Calculated split value
}

// Construction stage for home loans
export interface ConstructionStage {
  id: string;
  stage_name: string; // e.g., "Foundation", "Roof", "Finishing"
  percentage: number; // Percentage of total loan amount
  amount: number; // Amount to be disbursed
  expected_date: string;
  actual_disbursement_date?: string;
  is_completed: boolean;
  is_disbursed: boolean;
  notes?: string;
}

// Enhanced Financial Module Interfaces
export interface CreditCard {
  id: string;
  user_id: string;
  group_id?: string | null;
  name: string;
  bank_name: string;
  card_number_last4: string;
  credit_limit: number;
  current_balance: number;
  interest_rate: number;
  annual_fee: number;
  due_date: number; // Day of month
  minimum_payment: number;
  statement_date: number; // Day of month
  reward_type?: string;
  created_at: string;
  is_active: boolean;
}

export interface Loan {
  id: string;
  user_id: string;
  group_id?: string | null;
  name: string;
  loan_type: 'home' | 'car' | 'personal' | 'education' | 'business' | 'other';
  bank_name: string;
  principal_amount: number;
  current_balance: number;
  interest_rate: number;
  tenure_months: number;
  emi_amount: number;
  emi_date: number; // Day of month
  start_date: string;
  end_date: string;
  created_at: string;
  is_active: boolean;
}

export interface Investment {
  id: string;
  user_id: string;
  group_id?: string | null;
  name: string;
  investment_type: 'mutual_fund' | 'stocks' | 'bonds' | 'fd' | 'rd' | 'ppf' | 'nps' | 'other';
  platform: string;
  invested_amount: number;
  current_value: number;
  units?: number;
  nav?: number;
  sip_amount?: number;
  sip_date?: number; // Day of month
  maturity_date?: string;
  lock_in_period?: number; // months
  created_at: string;
  is_active: boolean;
}

export interface Insurance {
  id: string;
  user_id: string;
  group_id?: string | null;
  name: string;
  policy_type: 'life' | 'health' | 'vehicle' | 'home' | 'travel' | 'other';
  company_name: string;
  policy_number: string;
  sum_assured: number;
  premium_amount: number;
  premium_frequency: 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';
  premium_due_date: number; // Day of month
  policy_start_date: string;
  policy_end_date: string;
  nominees: string[];
  created_at: string;
  is_active: boolean;
}

export interface Property {
  id: string;
  user_id: string;
  group_id?: string | null;
  name: string;
  property_type: 'residential' | 'commercial' | 'land' | 'other';
  address: string;
  purchase_price: number;
  current_value: number;
  ownership_percentage: number; // For shared properties
  rental_income?: number;
  property_tax?: number;
  maintenance_cost?: number;
  loan_account_id?: string; // Link to home loan if any
  purchase_date: string;
  created_at: string;
  is_active: boolean;
}

export interface RecurringPayment {
  id: string;
  user_id: string;
  group_id?: string | null;
  name: string;
  description: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  category_id: string;
  payment_date: number; // Day of month/week
  start_date: string;
  end_date?: string;
  account_id?: string; // Link to financial account
  auto_create_transaction: boolean; // Whether to auto-create transactions
  created_at: string;
  is_active: boolean;
}

const FINANCIAL_ACCOUNTS_KEY = 'pocket_tracker_financial_accounts';
const CREDIT_CARDS_KEY = 'pocket_tracker_credit_cards';
const LOANS_KEY = 'pocket_tracker_loans';
const INVESTMENTS_KEY = 'pocket_tracker_investments';
const INSURANCE_KEY = 'pocket_tracker_insurance';
const PROPERTIES_KEY = 'pocket_tracker_properties';
const RECURRING_PAYMENTS_KEY = 'pocket_tracker_recurring_payments';

// Internal function to get all accounts (for operations)
const getAllFinancialAccounts = (): FinancialAccount[] => {
  try {
    const stored = localStorage.getItem(FINANCIAL_ACCOUNTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading financial accounts from storage:', error);
    return [];
  }
};

export const getFinancialAccounts = (userId?: string): FinancialAccount[] => {
  const allAccounts = getAllFinancialAccounts();
  
  // If no userId provided, return all accounts (for backward compatibility)
  if (!userId) return allAccounts;
  
  // Get user's groups to determine which group accounts they can access
  const userGroups = getStoredGroups().filter(g => {
    const membership = getGroupMemberships().find(m => 
      m.group_id === g.id && 
      m.user_id === userId && 
      ['active', 'accepted'].includes(m.status)
    );
    return !!membership;
  });
  
  const groupIds = userGroups.map(g => g.id);
  
  // Return personal accounts + accounts assigned to user's groups
  return allAccounts.filter(account => {
    // Personal accounts (no group_id or null group_id) owned by user
    const isPersonalAccount = (account.group_id === null || account.group_id === undefined) && account.user_id === userId;
    
    // Group accounts assigned to groups user is member of
    const isGroupAccount = account.group_id && groupIds.includes(account.group_id);
    
    return isPersonalAccount || isGroupAccount;
  });
};

export const addFinancialAccount = (account: Omit<FinancialAccount, 'id' | 'created_at'>): FinancialAccount => {
  const accounts = getAllFinancialAccounts(); // Get all accounts for adding
  
  const newAccount: FinancialAccount = {
    ...account,
    id: `fin_acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString(),
    is_active: true
  };
  
  accounts.push(newAccount);
  localStorage.setItem(FINANCIAL_ACCOUNTS_KEY, JSON.stringify(accounts));
  return newAccount;
};

export const updateFinancialAccount = (accountId: string, updates: Partial<FinancialAccount>, options?: { 
  createTransaction?: boolean, 
  transactionDescription?: string, 
  transactionCategory?: string,
  transactionType?: 'income' | 'expense'
}) => {
  const accounts = getAllFinancialAccounts();
  const index = accounts.findIndex(a => a.id === accountId);
  
  if (index !== -1) {
    const oldAccount = accounts[index];
    const newAccount = { ...oldAccount, ...updates };
    
    // Check if balance changed and auto-create transaction if requested
    if (options?.createTransaction && 'balance' in updates && updates.balance !== oldAccount.balance) {
      const balanceChange = updates.balance! - oldAccount.balance;
      
      if (balanceChange !== 0) {
        // Determine transaction type based on account type and balance change
        let transactionType: 'income' | 'expense' = options.transactionType || 'expense';
        let description = options.transactionDescription || '';
        
        if (!options.transactionType) {
          // Auto-determine transaction type based on account type and balance change
          if (['credit_card', 'loan'].includes(oldAccount.type)) {
            // For liabilities: increase in balance = expense, decrease = income (payment)
            transactionType = balanceChange > 0 ? 'expense' : 'income';
            description = description || (balanceChange > 0 ? 
              `${oldAccount.type === 'credit_card' ? 'Credit card spending' : 'Loan disbursement'} - ${oldAccount.name}` : 
              `${oldAccount.type === 'credit_card' ? 'Credit card payment' : 'Loan payment'} - ${oldAccount.name}`
            );
          } else {
            // For assets: increase in balance = income, decrease = expense
            transactionType = balanceChange > 0 ? 'income' : 'expense';
            description = description || (balanceChange > 0 ? 
              `Balance increase - ${oldAccount.name}` : 
              `Balance decrease - ${oldAccount.name}`
            );
          }
        }
        
        // Create automatic transaction
        const transaction: StoredTransaction = {
          id: `auto_txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          user_id: oldAccount.user_id,
          group_id: oldAccount.group_id,
          created_by: oldAccount.user_id,
          transaction_type: transactionType,
          amount: Math.abs(balanceChange),
          description,
          category_id: options.transactionCategory || (transactionType === 'income' ? 'income_misc' : 'expense_misc'),
          transaction_date: new Date().toISOString().split('T')[0],
          payment_method: oldAccount.type === 'cash' ? 'cash' : 'bank_transfer',
          account_name: oldAccount.name,
          notes: `Auto-generated transaction from account balance update`,
          source: 'account_balance_update',
          created_at: new Date().toISOString(),
          member_email: '',
          categories: {
            id: options.transactionCategory || (transactionType === 'income' ? 'income_misc' : 'expense_misc'),
            name: transactionType === 'income' ? 'Income - Miscellaneous' : 'Expense - Miscellaneous',
            color: transactionType === 'income' ? '#10B981' : '#EF4444'
          }
        };
        
        // Add the transaction
        addStoredTransaction(transaction);
        console.log(`Auto-created transaction for account ${oldAccount.name}:`, transaction);
      }
    }
    
    accounts[index] = newAccount;
    localStorage.setItem(FINANCIAL_ACCOUNTS_KEY, JSON.stringify(accounts));
    return newAccount;
  }
  
  return null;
};

export const deleteFinancialAccount = (accountId: string) => {
  const accounts = getAllFinancialAccounts();
  const filtered = accounts.filter(a => a.id !== accountId);
  localStorage.setItem(FINANCIAL_ACCOUNTS_KEY, JSON.stringify(filtered));
};

// Assign financial account to group
export const assignAccountToGroup = (accountId: string, groupId: string | null, contributionType?: 'none' | 'amount' | 'percentage', contributionAmount?: number, contributionPercentage?: number) => {
  const accounts = getAllFinancialAccounts();
  const index = accounts.findIndex(a => a.id === accountId);
  
  if (index !== -1) {
    const account = accounts[index];
    const updatedAccount = { 
      ...account, 
      group_id: groupId,
      contribution_type: contributionType || 'none',
      contribution_amount: contributionAmount,
      contribution_percentage: contributionPercentage
    };
    
    accounts[index] = updatedAccount;
    localStorage.setItem(FINANCIAL_ACCOUNTS_KEY, JSON.stringify(accounts));
    return updatedAccount;
  }
  
  throw new Error('Account not found');
};

// Multiple Group Assignment Functions
export const addAccountGroupAssignment = (accountId: string, groupId: string, contributionType: 'none' | 'amount' | 'percentage', contributionAmount?: number, contributionPercentage?: number): AccountGroupAssignment => {
  const assignment: AccountGroupAssignment = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    account_id: accountId,
    group_id: groupId,
    contribution_type: contributionType,
    contribution_amount: contributionAmount,
    contribution_percentage: contributionPercentage,
    created_at: new Date().toISOString()
  };
  
  // For local storage, we'll store assignments as part of account data for now
  const accounts = getAllFinancialAccounts();
  const accountIndex = accounts.findIndex(a => a.id === accountId);
  
  if (accountIndex !== -1) {
    if (!accounts[accountIndex].group_assignments) {
      accounts[accountIndex].group_assignments = [];
    }
    
    // Remove existing assignment for this group if it exists
    accounts[accountIndex].group_assignments = accounts[accountIndex].group_assignments!.filter(
      ga => ga.group_id !== groupId
    );
    
    // Add new assignment
    accounts[accountIndex].group_assignments!.push(assignment);
    localStorage.setItem(FINANCIAL_ACCOUNTS_KEY, JSON.stringify(accounts));
  }
  
  return assignment;
};

export const removeAccountGroupAssignment = (accountId: string, groupId: string) => {
  const accounts = getAllFinancialAccounts();
  const accountIndex = accounts.findIndex(a => a.id === accountId);
  
  if (accountIndex !== -1 && accounts[accountIndex].group_assignments) {
    accounts[accountIndex].group_assignments = accounts[accountIndex].group_assignments!.filter(
      ga => ga.group_id !== groupId
    );
    localStorage.setItem(FINANCIAL_ACCOUNTS_KEY, JSON.stringify(accounts));
  }
};

export const getAccountGroupAssignments = (accountId: string): AccountGroupAssignment[] => {
  const accounts = getAllFinancialAccounts();
  const account = accounts.find(a => a.id === accountId);
  return account?.group_assignments || [];
};

// Process EMI payment - automatically deducts from account and creates transaction
export const processEMIPayment = (loanAccountId: string, sourceAccountId: string, emiAmount?: number) => {
  const accounts = getAllFinancialAccounts();
  const loanAccount = accounts.find(a => a.id === loanAccountId);
  const sourceAccount = accounts.find(a => a.id === sourceAccountId);
  
  if (!loanAccount || !sourceAccount) {
    throw new Error('Account not found');
  }
  
  const paymentAmount = emiAmount || loanAccount.monthly_emi || 0;
  
  if (paymentAmount <= 0) {
    throw new Error('Invalid EMI amount');
  }
  
  if (sourceAccount.balance < paymentAmount) {
    throw new Error('Insufficient balance for EMI payment');
  }
  
  // Update loan account (reduce outstanding balance)
  updateFinancialAccount(loanAccountId, { 
    balance: loanAccount.balance - paymentAmount,
    remaining_terms: loanAccount.remaining_terms ? loanAccount.remaining_terms - 1 : undefined
  }, {
    createTransaction: true,
    transactionDescription: `EMI payment for ${loanAccount.name}`,
    transactionCategory: 'loan_payment',
    transactionType: 'income' // Reducing liability is like income
  });
  
  // Update source account (deduct payment amount)
  updateFinancialAccount(sourceAccountId, { 
    balance: sourceAccount.balance - paymentAmount 
  }, {
    createTransaction: true,
    transactionDescription: `EMI payment to ${loanAccount.name}`,
    transactionCategory: 'loan_payment',
    transactionType: 'expense'
  });
  
  return { loanAccount, sourceAccount, paymentAmount };
};

// Process investment update - automatically creates transaction
export const processInvestmentUpdate = (investmentAccountId: string, newBalance: number, sourceAccountId?: string) => {
  const accounts = getAllFinancialAccounts();
  const investmentAccount = accounts.find(a => a.id === investmentAccountId);
  
  if (!investmentAccount) {
    throw new Error('Investment account not found');
  }
  
  const balanceChange = newBalance - investmentAccount.balance;
  
  if (balanceChange === 0) {
    return investmentAccount; // No change
  }
  
  // If money is being added to investment and source account is provided
  if (balanceChange > 0 && sourceAccountId) {
    const sourceAccount = accounts.find(a => a.id === sourceAccountId);
    if (sourceAccount) {
      // Deduct from source account
      updateFinancialAccount(sourceAccountId, { 
        balance: sourceAccount.balance - balanceChange 
      }, {
        createTransaction: true,
        transactionDescription: `Investment in ${investmentAccount.name}`,
        transactionCategory: 'investment',
        transactionType: 'expense'
      });
    }
  }
  
  // Update investment account
  updateFinancialAccount(investmentAccountId, { 
    balance: newBalance 
  }, {
    createTransaction: true,
    transactionDescription: balanceChange > 0 ? 
      `Investment addition - ${investmentAccount.name}` : 
      `Investment withdrawal - ${investmentAccount.name}`,
    transactionCategory: balanceChange > 0 ? 'investment' : 'investment_withdrawal',
    transactionType: balanceChange > 0 ? 'expense' : 'income'
  });
  
  return accounts.find(a => a.id === investmentAccountId);
};

// Process recurring payment - automatically creates transaction and deducts from account
export const processRecurringPayment = (recurringAccountId: string, sourceAccountId: string) => {
  const accounts = getAllFinancialAccounts();
  const recurringAccount = accounts.find(a => a.id === recurringAccountId);
  const sourceAccount = accounts.find(a => a.id === sourceAccountId);
  
  if (!recurringAccount || !sourceAccount) {
    throw new Error('Account not found');
  }
  
  const paymentAmount = recurringAccount.balance; // For recurring, balance represents the payment amount
  
  if (sourceAccount.balance < paymentAmount) {
    throw new Error('Insufficient balance for recurring payment');
  }
  
  // Update source account (deduct payment amount)
  updateFinancialAccount(sourceAccountId, { 
    balance: sourceAccount.balance - paymentAmount 
  }, {
    createTransaction: true,
    transactionDescription: `Recurring payment - ${recurringAccount.name}`,
    transactionCategory: 'recurring_payment',
    transactionType: 'expense'
  });
  
  // Update next due date for recurring payment
  const nextDueDate = new Date();
  nextDueDate.setMonth(nextDueDate.getMonth() + 1);
  
  updateFinancialAccount(recurringAccountId, {
    next_due_date: nextDueDate.toISOString().split('T')[0]
  });
  
  return { recurringAccount, sourceAccount, paymentAmount };
};

// Get personal financial accounts
export const getPersonalFinancialAccounts = (userId: string): FinancialAccount[] => {
  const accounts = getAllFinancialAccounts();
  return accounts.filter(a => 
    a.user_id === userId && 
    a.is_active && 
    (!a.group_id || a.group_id === null)
  );
};

// Get group financial accounts
export const getGroupFinancialAccounts = (groupId: string): FinancialAccount[] => {
  const accounts = getAllFinancialAccounts();
  return accounts.filter(a => 
    a.group_id === groupId && 
    a.is_active
  );
};

// Get user's share of group assets
export const getUserGroupAssetValue = (userId: string, groupId: string): number => {
  const groupAccounts = getGroupFinancialAccounts(groupId);
  let userShare = 0;
  
  groupAccounts.forEach(account => {
    if (account.is_shared && account.split_details) {
      const userSplit = account.split_details.find(split => split.user_id === userId);
      if (userSplit) {
        userShare += userSplit.split_value;
      }
    }
  });
  
  return userShare;
};

// Calculate split values for group assets
export const calculateAssetSplits = (
  totalValue: number, 
  splitType: 'equal' | 'fractional' | 'custom', 
  members: Array<{user_id: string, user_email: string, percentage?: number, fixed_amount?: number}>
): GroupAssetSplit[] => {
  switch (splitType) {
    case 'equal':
      const equalShare = totalValue / members.length;
      return members.map(member => ({
        user_id: member.user_id,
        user_email: member.user_email,
        percentage: 100 / members.length,
        split_value: equalShare
      }));
      
    case 'fractional':
      return members.map(member => ({
        user_id: member.user_id,
        user_email: member.user_email,
        percentage: member.percentage || 0,
        split_value: totalValue * ((member.percentage || 0) / 100)
      }));
      
    case 'custom':
      return members.map(member => ({
        user_id: member.user_id,
        user_email: member.user_email,
        fixed_amount: member.fixed_amount || 0,
        split_value: member.fixed_amount || 0
      }));
      
    default:
      return [];
  }
};

// Share personal asset with group
export const shareAssetWithGroup = (
  accountId: string, 
  groupId: string, 
  splitType: 'equal' | 'fractional' | 'custom',
  splitDetails: GroupAssetSplit[]
): boolean => {
  try {
    const accounts = getAllFinancialAccounts();
    const accountIndex = accounts.findIndex(a => a.id === accountId);
    
    if (accountIndex !== -1) {
      accounts[accountIndex] = {
        ...accounts[accountIndex],
        group_id: groupId,
        is_shared: true,
        split_type: splitType,
        split_details: splitDetails,
        owned_by: accounts[accountIndex].user_id
      };
      
      localStorage.setItem(FINANCIAL_ACCOUNTS_KEY, JSON.stringify(accounts));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error sharing asset with group:', error);
    return false;
  }
};

// User email to ID mapping for transaction filtering
export interface UserMapping {
  email: string;
  user_id: string;
  name?: string;
}

const USER_MAPPINGS_KEY = 'pocket_tracker_user_mappings';

export const getUserMappings = (): UserMapping[] => {
  try {
    const stored = localStorage.getItem(USER_MAPPINGS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading user mappings from storage:', error);
    return [];
  }
};

export const addUserMapping = (mapping: UserMapping): void => {
  const mappings = getUserMappings();
  const existing = mappings.find(m => m.email === mapping.email);
  
  if (!existing) {
    mappings.push(mapping);
    localStorage.setItem(USER_MAPPINGS_KEY, JSON.stringify(mappings));
  }
};

export const getUserIdByEmail = (email: string): string | null => {
  const mappings = getUserMappings();
  const mapping = mappings.find(m => m.email === email);
  return mapping?.user_id || null;
};

// Get transactions for personal mode - shows ALL user's transactions (personal + all group transactions they have access to)
export const getPersonalTransactions = (currentUserId: string, currentUserEmail?: string): StoredTransaction[] => {
  const allTransactions = getStoredTransactions();
  return allTransactions.filter(t => {
    // For personal mode, show ALL transactions where the user is involved:
    // 1. user_id matches current user (their direct transactions)
    // 2. OR created_by is current user (they imported the data)
    // 3. OR member_email matches current user's email (group transactions for this user)
    return t.user_id === currentUserId || 
           t.created_by === currentUserId ||
           (currentUserEmail && t.member_email === currentUserEmail);
  });
};

// Get transactions for group mode - shows ONLY transactions assigned to specific group
export const getGroupTransactions = (groupId: string, currentUserId: string, currentUserEmail?: string): StoredTransaction[] => {
  const allTransactions = getStoredTransactions();
  return allTransactions.filter(t => {
    const isUserTransaction = t.user_id === currentUserId || 
                             t.created_by === currentUserId ||
                             (currentUserEmail && t.member_email === currentUserEmail);
    
    if (!isUserTransaction) return false;
    
    // Show ONLY transactions assigned to this specific group
    return t.group_id === groupId;
  });
};

// Assign transaction to a group (or unassign by passing null)
export const assignTransactionToGroup = (transactionId: string, groupId: string | null): boolean => {
  try {
    const transactions = getStoredTransactions();
    const index = transactions.findIndex(t => t.id === transactionId);
    
    if (index !== -1) {
      transactions[index] = { ...transactions[index], group_id: groupId };
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error assigning transaction to group:', error);
    return false;
  }
};

// Get transactions for account balance calculation (respects group context)
export const getTransactionsForBalanceCalculation = (
  accountName: string, 
  currentUserId: string, 
  groupId?: string | null,
  currentUserEmail?: string
): StoredTransaction[] => {
  const allTransactions = getStoredTransactions();
  
  return allTransactions.filter(t => {
    // Must be for this account and user
    const isAccountTransaction = t.account_name === accountName && 
                               (t.user_id === currentUserId || 
                                t.created_by === currentUserId ||
                                (currentUserEmail && t.member_email === currentUserEmail));
    
    if (!isAccountTransaction) return false;
    
    if (groupId) {
      // For group context: only include transactions assigned to this group
      return t.group_id === groupId;
    } else {
      // For personal context: include all transactions
      return true;
    }
  });
};

export const clearAllStoredData = () => {
  // Clear all storage keys
  localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
  localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
  localStorage.removeItem(STORAGE_KEYS.ACCOUNTS);
  localStorage.removeItem(GROUPS_KEY);
  localStorage.removeItem(FINANCIAL_ACCOUNTS_KEY);
  localStorage.removeItem(GROUP_MEMBERSHIPS_KEY);
  localStorage.removeItem(USER_MAPPINGS_KEY);
  localStorage.removeItem('app_settings');
  localStorage.removeItem(CREDIT_CARDS_KEY);
  localStorage.removeItem(LOANS_KEY);
  localStorage.removeItem(INVESTMENTS_KEY);
  localStorage.removeItem(INSURANCE_KEY);
  localStorage.removeItem(PROPERTIES_KEY);
  localStorage.removeItem(RECURRING_PAYMENTS_KEY);
  
  // Clear any other potential keys
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('pocket_tracker_')) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  console.log('All stored data cleared from localStorage');
  
  // Reload the page to reset application state
  window.location.reload();
};

// Credit Cards CRUD
export const getCreditCards = (): CreditCard[] => {
  try {
    const stored = localStorage.getItem(CREDIT_CARDS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading credit cards:', error);
    return [];
  }
};

export const addCreditCard = (card: Omit<CreditCard, 'id' | 'created_at'>): CreditCard => {
  const cards = getCreditCards();
  const newCard: CreditCard = {
    ...card,
    id: `cc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString()
  };
  
  cards.push(newCard);
  localStorage.setItem(CREDIT_CARDS_KEY, JSON.stringify(cards));
  return newCard;
};

// Loans CRUD
export const getLoans = (): Loan[] => {
  try {
    const stored = localStorage.getItem(LOANS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading loans:', error);
    return [];
  }
};

export const addLoan = (loan: Omit<Loan, 'id' | 'created_at'>): Loan => {
  const loans = getLoans();
  const newLoan: Loan = {
    ...loan,
    id: `loan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString()
  };
  
  loans.push(newLoan);
  localStorage.setItem(LOANS_KEY, JSON.stringify(loans));
  return newLoan;
};

// Investments CRUD
export const getInvestments = (): Investment[] => {
  try {
    const stored = localStorage.getItem(INVESTMENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading investments:', error);
    return [];
  }
};

export const addInvestment = (investment: Omit<Investment, 'id' | 'created_at'>): Investment => {
  const investments = getInvestments();
  const newInvestment: Investment = {
    ...investment,
    id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString()
  };
  
  investments.push(newInvestment);
  localStorage.setItem(INVESTMENTS_KEY, JSON.stringify(investments));
  return newInvestment;
};

// Insurance CRUD
export const getInsurance = (): Insurance[] => {
  try {
    const stored = localStorage.getItem(INSURANCE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading insurance:', error);
    return [];
  }
};

export const addInsurance = (insurance: Omit<Insurance, 'id' | 'created_at'>): Insurance => {
  const insurances = getInsurance();
  const newInsurance: Insurance = {
    ...insurance,
    id: `ins_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString()
  };
  
  insurances.push(newInsurance);
  localStorage.setItem(INSURANCE_KEY, JSON.stringify(insurances));
  return newInsurance;
};

// Properties CRUD
export const getProperties = (): Property[] => {
  try {
    const stored = localStorage.getItem(PROPERTIES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading properties:', error);
    return [];
  }
};

export const addProperty = (property: Omit<Property, 'id' | 'created_at'>): Property => {
  const properties = getProperties();
  const newProperty: Property = {
    ...property,
    id: `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString()
  };
  
  properties.push(newProperty);
  localStorage.setItem(PROPERTIES_KEY, JSON.stringify(properties));
  return newProperty;
};

// Recurring Payments CRUD
export const getRecurringPayments = (): RecurringPayment[] => {
  try {
    const stored = localStorage.getItem(RECURRING_PAYMENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading recurring payments:', error);
    return [];
  }
};

export const addRecurringPayment = (payment: Omit<RecurringPayment, 'id' | 'created_at'>): RecurringPayment => {
  const payments = getRecurringPayments();
  const newPayment: RecurringPayment = {
    ...payment,
    id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString()
  };
  
  payments.push(newPayment);
  localStorage.setItem(RECURRING_PAYMENTS_KEY, JSON.stringify(payments));
  return newPayment;
};

// Get all financial modules for a user
export const getAllUserFinancials = (userId: string, groupId?: string) => {
  const filter = (item: any) => {
    if (groupId) {
      return item.group_id === groupId && item.is_active;
    }
    return item.user_id === userId && item.is_active && (!item.group_id || item.group_id === null);
  };

  return {
    accounts: getAllFinancialAccounts().filter(filter),
    creditCards: getCreditCards().filter(filter),
    loans: getLoans().filter(filter),
    investments: getInvestments().filter(filter),
    insurance: getInsurance().filter(filter),
    properties: getProperties().filter(filter),
    recurringPayments: getRecurringPayments().filter(filter)
  };
};

// Calculate total net worth including all modules
export const calculateNetWorth = (userId: string, groupId?: string): number => {
  const financials = getAllUserFinancials(userId, groupId);
  
  let assets = 0;
  let liabilities = 0;
  
  // Financial Accounts
  financials.accounts.forEach(acc => {
    if (['savings', 'checking', 'investment', 'cash'].includes(acc.type)) {
      assets += acc.balance;
    } else if (['credit_card', 'loan'].includes(acc.type)) {
      liabilities += acc.balance;
    }
  });
  
  // Credit Cards (liabilities)
  financials.creditCards.forEach(cc => liabilities += cc.current_balance);
  
  // Loans (liabilities)
  financials.loans.forEach(loan => liabilities += loan.current_balance);
  
  // Investments (assets)
  financials.investments.forEach(inv => assets += inv.current_value);
  
  // Properties (assets)
  financials.properties.forEach(prop => assets += (prop.current_value * prop.ownership_percentage / 100));
  
  return assets - liabilities;
};

// Debug function to check what data exists
export const debugStoredData = () => {
  const data = {
    transactions: getStoredTransactions().length,
    categories: getStoredCategories().length,
    accounts: getStoredAccounts().length,
    groups: getStoredGroups().length,
    memberships: getGroupMemberships().length,
    userMappings: getUserMappings().length,
    financialAccounts: getAllFinancialAccounts().length
  };
  
  console.log('Stored data counts:', data);
  console.log('All groups:', getStoredGroups());
  return data;
};

// Loan and EMI Calculation Utilities
export interface LoanCalculationParams {
  principal: number;
  interestRate: number; // Annual interest rate as percentage
  tenureMonths: number;
  interestType: 'simple' | 'compound' | 'reducing_balance' | 'flat_rate';
  processingFee?: number;
  processingFeePercentage?: number;
  isNoCostEmi?: boolean;
  isInterestFree?: boolean;
}

export interface LoanCalculationResult {
  monthlyEmi: number;
  totalInterest: number;
  totalAmount: number;
  effectiveInterestRate: number;
  processingFeeAmount: number;
}

// Calculate EMI using reducing balance method (most common)
export const calculateReducingBalanceEMI = (principal: number, monthlyRate: number, tenureMonths: number): number => {
  if (monthlyRate === 0) return principal / tenureMonths;
  
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / 
              (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  return Math.round(emi * 100) / 100;
};

// Calculate flat rate EMI
export const calculateFlatRateEMI = (principal: number, annualRate: number, tenureMonths: number): number => {
  const totalInterest = (principal * annualRate * tenureMonths) / (12 * 100);
  return Math.round(((principal + totalInterest) / tenureMonths) * 100) / 100;
};

// Calculate simple interest
export const calculateSimpleInterest = (principal: number, annualRate: number, tenureMonths: number): number => {
  return (principal * annualRate * tenureMonths) / (12 * 100);
};

// Calculate compound interest
export const calculateCompoundInterest = (principal: number, annualRate: number, tenureMonths: number): number => {
  const monthlyRate = annualRate / (12 * 100);
  const amount = principal * Math.pow(1 + monthlyRate, tenureMonths);
  return amount - principal;
};

// Main loan calculation function
export const calculateLoanDetails = (params: LoanCalculationParams): LoanCalculationResult => {
  const {
    principal,
    interestRate,
    tenureMonths,
    interestType,
    processingFee = 0,
    processingFeePercentage = 0,
    isNoCostEmi = false,
    isInterestFree = false
  } = params;

  // Calculate processing fee
  const processingFeeAmount = processingFee + (principal * processingFeePercentage / 100);
  
  let monthlyEmi = 0;
  let totalInterest = 0;
  let effectiveInterestRate = interestRate;

  if (isInterestFree) {
    // Interest-free loan
    monthlyEmi = principal / tenureMonths;
    totalInterest = 0;
    effectiveInterestRate = 0;
  } else if (isNoCostEmi) {
    // No-cost EMI: Interest is absorbed by merchant/bank
    monthlyEmi = principal / tenureMonths;
    totalInterest = 0;
    effectiveInterestRate = 0;
  } else {
    // Regular loan calculations
    const monthlyRate = interestRate / (12 * 100);
    
    switch (interestType) {
      case 'reducing_balance':
        monthlyEmi = calculateReducingBalanceEMI(principal, monthlyRate, tenureMonths);
        totalInterest = (monthlyEmi * tenureMonths) - principal;
        break;
        
      case 'flat_rate':
        monthlyEmi = calculateFlatRateEMI(principal, interestRate, tenureMonths);
        totalInterest = (monthlyEmi * tenureMonths) - principal;
        // Flat rate effective interest is approximately double
        effectiveInterestRate = interestRate * 1.8;
        break;
        
      case 'simple':
        totalInterest = calculateSimpleInterest(principal, interestRate, tenureMonths);
        monthlyEmi = (principal + totalInterest) / tenureMonths;
        break;
        
      case 'compound':
        totalInterest = calculateCompoundInterest(principal, interestRate, tenureMonths);
        monthlyEmi = (principal + totalInterest) / tenureMonths;
        break;
        
      default:
        monthlyEmi = calculateReducingBalanceEMI(principal, monthlyRate, tenureMonths);
        totalInterest = (monthlyEmi * tenureMonths) - principal;
    }
  }

  // Include processing fee in effective calculations
  if (processingFeeAmount > 0) {
    const totalCost = totalInterest + processingFeeAmount;
    effectiveInterestRate = (totalCost / principal) * (12 / tenureMonths) * 100;
  }

  const totalAmount = principal + totalInterest;

  return {
    monthlyEmi: Math.round(monthlyEmi * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
    effectiveInterestRate: Math.round(effectiveInterestRate * 100) / 100,
    processingFeeAmount: Math.round(processingFeeAmount * 100) / 100
  };
};

// Generate EMI schedule
export interface EMIScheduleItem {
  emiNumber: number;
  emiDate: string;
  emiAmount: number;
  principalComponent: number;
  interestComponent: number;
  outstandingBalance: number;
}

export const generateEMISchedule = (
  principal: number,
  monthlyEmi: number,
  interestRate: number,
  tenureMonths: number,
  startDate: string
): EMIScheduleItem[] => {
  const schedule: EMIScheduleItem[] = [];
  let outstandingBalance = principal;
  const monthlyRate = interestRate / (12 * 100);
  
  for (let i = 1; i <= tenureMonths; i++) {
    const emiDate = new Date(startDate);
    emiDate.setMonth(emiDate.getMonth() + (i - 1));
    
    const interestComponent = outstandingBalance * monthlyRate;
    const principalComponent = monthlyEmi - interestComponent;
    outstandingBalance = Math.max(0, outstandingBalance - principalComponent);
    
    schedule.push({
      emiNumber: i,
      emiDate: emiDate.toISOString().split('T')[0],
      emiAmount: monthlyEmi,
      principalComponent: Math.round(principalComponent * 100) / 100,
      interestComponent: Math.round(interestComponent * 100) / 100,
      outstandingBalance: Math.round(outstandingBalance * 100) / 100
    });
  }
  
  return schedule;
};

// Utility to auto-calculate loan end date
export const calculateLoanEndDate = (startDate: string, tenureMonths: number): string => {
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + tenureMonths);
  return endDate.toISOString().split('T')[0];
};

// Home Loan Specific Calculations
export interface HomeLoanParams extends LoanCalculationParams {
  sanctionedAmount: number;
  disbursedAmount: number;
  moratoriumPeriodMonths: number;
  isUnderConstruction: boolean;
}

export interface HomeLoanResult extends LoanCalculationResult {
  moratoriumEmi: number; // Interest-only EMI during moratorium (current month)
  postMoratoriumEmi: number; // Full EMI after moratorium
  totalMoratoriumInterest: number;
  moratoriumEndDate: string;
  fullLoanStartDate: string;
  remainingTenureMonths: number; // Total remaining months for loan completion
  remainingPostMoratoriumMonths: number; // Remaining months after moratorium ends
  disbursementHistory?: Array<{month: number, disbursedAmount: number, emi: number}>; // Track varying EMI amounts
}

// Calculate home loan with moratorium - Based on real bank calculations
export const calculateHomeLoanDetails = (params: HomeLoanParams, startDate: string, constructionStages?: ConstructionStage[]): HomeLoanResult => {
  const {
    sanctionedAmount,
    disbursedAmount,
    moratoriumPeriodMonths,
    isUnderConstruction,
    interestRate,
    tenureMonths,
    interestType,
    processingFee = 0,
    processingFeePercentage = 0
  } = params;

  const monthlyInterestRate = interestRate / (12 * 100);
  
  // Calculate moratorium end date
  const moratoriumEndDate = new Date(startDate);
  moratoriumEndDate.setMonth(moratoriumEndDate.getMonth() + moratoriumPeriodMonths);
  
  // Full loan starts after moratorium with full sanctioned amount
  const fullLoanStartDate = moratoriumEndDate.toISOString().split('T')[0];
  const remainingTenure = tenureMonths - moratoriumPeriodMonths;

  // REAL BANK LOGIC: Moratorium EMI = Current Disbursed Amount × Monthly Interest Rate
  // This EMI changes each month as new disbursements happen during construction
  // The moratorium EMI is ONLY INTEREST, does not reduce principal
  
  // Calculate current moratorium EMI based on disbursed amount
  const currentMoratoriumEmi = disbursedAmount * monthlyInterestRate;
  
  // Debug log for troubleshooting
  console.log('Home Loan Calculation Debug:', {
    disbursedAmount: disbursedAmount.toLocaleString(),
    interestRate,
    monthlyInterestRate: (monthlyInterestRate * 100).toFixed(6) + '%',
    calculatedEmi: currentMoratoriumEmi.toLocaleString(),
    roundedEmi: Math.ceil(currentMoratoriumEmi).toLocaleString(),
    expectedEmi: '19,608', // User's actual EMI
    impliedDisbursedAmount: (19608 / monthlyInterestRate).toLocaleString(),
    difference: (19608 - Math.ceil(currentMoratoriumEmi)).toLocaleString(),
    percentageDiff: (((19608 - Math.ceil(currentMoratoriumEmi)) / 19608) * 100).toFixed(2) + '%'
  });
  
  // For construction loans, calculate more accurate moratorium interest based on progressive disbursement
  let totalMoratoriumInterest = 0;
  let disbursementHistory: Array<{month: number, disbursedAmount: number, emi: number}> = [];
  
  if (isUnderConstruction && moratoriumPeriodMonths > 0) {
    // If construction stages are provided, use them for accurate calculation
    if (constructionStages && constructionStages.length > 0) {
      // Use actual construction stage disbursements
      let runningDisbursedAmount = 0;
      
      // Sort stages by expected date
      const sortedStages = [...constructionStages].sort((a, b) => 
        new Date(a.expected_date).getTime() - new Date(b.expected_date).getTime()
      );
      
      for (let month = 1; month <= moratoriumPeriodMonths; month++) {
        const currentDate = new Date(startDate);
        currentDate.setMonth(currentDate.getMonth() + month - 1);
        
        // Check if any stages are completed/disbursed by this month
        sortedStages.forEach(stage => {
          if (stage.is_disbursed && new Date(stage.expected_date) <= currentDate) {
            if (runningDisbursedAmount < disbursedAmount) {
              runningDisbursedAmount = Math.min(runningDisbursedAmount + stage.amount, disbursedAmount);
            }
          }
        });
        
        // Calculate EMI for this month
        const monthlyEmi = runningDisbursedAmount * monthlyInterestRate;
        totalMoratoriumInterest += monthlyEmi;
        
        disbursementHistory.push({
          month,
          disbursedAmount: runningDisbursedAmount,
          emi: Math.ceil(monthlyEmi) // Banks round up to next rupee
        });
      }
    } else {
      // Fallback: Progressive disbursement model without specific stages
      const remainingDisbursement = sanctionedAmount - disbursedAmount;
      let runningDisbursedAmount = disbursedAmount;
      
      // Model: Gradual disbursement over construction period
      // Assume non-linear disbursement pattern (more in middle months)
      for (let month = 1; month <= moratoriumPeriodMonths; month++) {
        // Weighted disbursement pattern (slow start, faster middle, slower end)
        const progressRatio = month / moratoriumPeriodMonths;
        const disbursementWeight = Math.sin(progressRatio * Math.PI); // Bell curve pattern
        
        // Calculate additional disbursement for this month
        const monthlyDisbursement = (remainingDisbursement / moratoriumPeriodMonths) * disbursementWeight * 1.5;
        
        if (runningDisbursedAmount < sanctionedAmount) {
          runningDisbursedAmount = Math.min(
            runningDisbursedAmount + monthlyDisbursement,
            sanctionedAmount
          );
        }
        
        // Calculate EMI for this month
        const monthlyEmi = runningDisbursedAmount * monthlyInterestRate;
        totalMoratoriumInterest += monthlyEmi;
        
        disbursementHistory.push({
          month,
          disbursedAmount: runningDisbursedAmount,
          emi: Math.ceil(monthlyEmi) // Banks round up to next rupee
        });
      }
    }
  } else {
    // For fully disbursed loans during moratorium
    totalMoratoriumInterest = currentMoratoriumEmi * moratoriumPeriodMonths;
    
    // Create history for fully disbursed loan
    for (let month = 1; month <= moratoriumPeriodMonths; month++) {
      disbursementHistory.push({
        month,
        disbursedAmount: disbursedAmount,
        emi: Math.ceil(currentMoratoriumEmi)
      });
    }
  }

  // Post-moratorium: Normal EMI on full sanctioned amount
  // The accumulated moratorium interest does NOT get added to principal
  // Bank calculates EMI on original sanctioned amount only
  const postMoratoriumParams: LoanCalculationParams = {
    principal: sanctionedAmount, // Use original sanctioned amount, not including moratorium interest
    interestRate,
    tenureMonths: remainingTenure,
    interestType,
    processingFee: 0,
    processingFeePercentage: 0,
    isNoCostEmi: false,
    isInterestFree: false
  };

  const postMoratoriumDetails = calculateLoanDetails(postMoratoriumParams);
  
  // Total calculations
  const totalInterest = totalMoratoriumInterest + postMoratoriumDetails.totalInterest;
  const totalAmount = sanctionedAmount + totalInterest;
  const processingFeeAmount = processingFee + (sanctionedAmount * processingFeePercentage / 100);

  return {
    monthlyEmi: postMoratoriumDetails.monthlyEmi, // Post-moratorium EMI
    moratoriumEmi: Math.ceil(currentMoratoriumEmi), // Current month's moratorium EMI
    postMoratoriumEmi: postMoratoriumDetails.monthlyEmi,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalMoratoriumInterest: Math.round(totalMoratoriumInterest * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
    effectiveInterestRate: Math.round(((totalInterest + processingFeeAmount) / sanctionedAmount) * (12 / tenureMonths) * 100 * 100) / 100,
    processingFeeAmount: Math.round(processingFeeAmount * 100) / 100,
    moratoriumEndDate: moratoriumEndDate.toISOString().split('T')[0],
    fullLoanStartDate,
    remainingTenureMonths: tenureMonths, // Total remaining months including moratorium
    remainingPostMoratoriumMonths: remainingTenure, // Remaining months after moratorium
    disbursementHistory // New: Track EMI changes over time
  };
};

// Generate default construction stages
export const generateDefaultConstructionStages = (sanctionedAmount: number, startDate: string): ConstructionStage[] => {
  const stages = [
    { name: "Land/Agreement", percentage: 20 },
    { name: "Foundation & Plinth", percentage: 25 },
    { name: "Roof & Structure", percentage: 30 },
    { name: "Finishing Work", percentage: 20 },
    { name: "Final Completion", percentage: 5 }
  ];

  return stages.map((stage, index) => {
    const expectedDate = new Date(startDate);
    expectedDate.setMonth(expectedDate.getMonth() + (index * 3)); // 3 months between stages

    return {
      id: `stage_${index + 1}`,
      stage_name: stage.name,
      percentage: stage.percentage,
      amount: Math.round((sanctionedAmount * stage.percentage / 100) * 100) / 100,
      expected_date: expectedDate.toISOString().split('T')[0],
      is_completed: false,
      is_disbursed: false
    };
  });
};

// Calculate disbursed amount from completed stages
export const calculateDisbursedAmount = (stages: ConstructionStage[]): number => {
  return stages
    .filter(stage => stage.is_disbursed)
    .reduce((total, stage) => total + stage.amount, 0);
};

// Add manual disbursement entry for accurate EMI tracking
export const addManualDisbursement = (
  accountId: string,
  disbursementDate: string,
  disbursedAmount: number,
  cumulativeDisbursedAmount: number
): boolean => {
  try {
    const accounts = getAllFinancialAccounts();
    const accountIndex = accounts.findIndex(a => a.id === accountId);
    
    if (accountIndex === -1) return false;
    
    const account = accounts[accountIndex];
    if (!account.is_home_loan) return false;
    
    // Initialize disbursement history if not exists
    if (!account.disbursement_history) {
      account.disbursement_history = [];
    }
    
    // Add new disbursement entry
    const newEntry = {
      date: disbursementDate,
      amount: disbursedAmount,
      cumulative_amount: cumulativeDisbursedAmount,
      emi_calculated: cumulativeDisbursedAmount * ((account.interest_rate || 0) / (12 * 100))
    };
    
    account.disbursement_history.push(newEntry);
    
    // Sort by date
    account.disbursement_history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Update current disbursed amount
    account.disbursed_amount = cumulativeDisbursedAmount;
    
    // Recalculate EMI based on latest disbursement
    if (account.interest_rate) {
      const monthlyRate = account.interest_rate / (12 * 100);
      account.monthly_emi = Math.ceil(cumulativeDisbursedAmount * monthlyRate);
    }
    
    localStorage.setItem(FINANCIAL_ACCOUNTS_KEY, JSON.stringify(accounts));
    return true;
  } catch (error) {
    console.error('Error adding manual disbursement:', error);
    return false;
  }
};

// Process stage completion and disbursement
export const processStageCompletion = (
  accountId: string, 
  stageId: string, 
  completionDate: string,
  actualAmount?: number
): boolean => {
  try {
    const accounts = getAllFinancialAccounts();
    const accountIndex = accounts.findIndex(a => a.id === accountId);
    
    if (accountIndex === -1) return false;
    
    const account = accounts[accountIndex];
    if (!account.construction_stages) return false;
    
    const stageIndex = account.construction_stages.findIndex(s => s.id === stageId);
    if (stageIndex === -1) return false;
    
    // Update stage
    account.construction_stages[stageIndex] = {
      ...account.construction_stages[stageIndex],
      is_completed: true,
      is_disbursed: true,
      actual_disbursement_date: completionDate,
      amount: actualAmount || account.construction_stages[stageIndex].amount
    };
    
    // Recalculate disbursed amount
    account.disbursed_amount = calculateDisbursedAmount(account.construction_stages);
    
    // Update outstanding balance (disbursed amount is what you owe)
    account.balance = account.disbursed_amount || 0;
    
    // Save changes
    localStorage.setItem(FINANCIAL_ACCOUNTS_KEY, JSON.stringify(accounts));
    
    // Create transaction for disbursement
    const transaction: StoredTransaction = {
      id: `disbursement_${Date.now()}`,
      user_id: account.user_id,
      group_id: account.group_id,
      created_by: account.user_id,
      transaction_type: 'income',
      amount: actualAmount || account.construction_stages[stageIndex].amount,
      description: `Home loan disbursement - ${account.construction_stages[stageIndex].stage_name}`,
      category_id: 'loan_disbursement',
      transaction_date: completionDate,
      payment_method: 'bank_transfer',
      account_name: account.name,
      notes: `Construction stage: ${account.construction_stages[stageIndex].stage_name}`,
      source: 'automatic',
      created_at: new Date().toISOString(),
      member_email: ''
    };
    
    addStoredTransaction(transaction);
    
    return true;
  } catch (error) {
    console.error('Error processing stage completion:', error);
    return false;
  }
};