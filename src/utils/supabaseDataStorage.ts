import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Type definitions for our data structures
export type StoredTransaction = Database['public']['Tables']['transactions']['Row'] & {
  member_email?: string;
  categories?: {
    id: string;
    name: string;
    color: string;
    icon?: string;
  };
};

export type StoredCategory = Database['public']['Tables']['categories']['Row'];
export type StoredGroup = Database['public']['Tables']['expense_groups']['Row'];
export type GroupMembership = Database['public']['Tables']['group_members']['Row'];

// Helper functions to map between UI terminology and database terminology
const mapTransactionTypeToDb = (uiType: string): string => {
  switch (uiType) {
    case 'credit': return 'income';
    case 'debit': return 'expense';
    default: return uiType; // fallback
  }
};

const mapTransactionTypeFromDb = (dbType: string): string => {
  switch (dbType) {
    case 'income': return 'credit';
    case 'expense': return 'debit';
    default: return dbType; // fallback
  }
};

// Enhanced Financial Module Interfaces for Supabase
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
  due_date: number;
  minimum_payment: number;
  statement_date: number;
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
  emi_date: number;
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
  sip_date?: number;
  maturity_date?: string;
  lock_in_period?: number;
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
  premium_due_date: number;
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
  ownership_percentage: number;
  rental_income?: number;
  property_tax?: number;
  maintenance_cost?: number;
  loan_account_id?: string;
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
  payment_date: number;
  start_date: string;
  end_date?: string;
  account_id?: string;
  auto_create_transaction: boolean;
  created_at: string;
  is_active: boolean;
}

// Default categories
const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', color: '#EF4444', icon: 'utensils' },
  { name: 'Transportation', color: '#3B82F6', icon: 'car' },
  { name: 'Bills & Utilities', color: '#10B981', icon: 'receipt' },
  { name: 'Entertainment', color: '#8B5CF6', icon: 'film' },
  { name: 'Healthcare', color: '#EC4899', icon: 'heart' },
  { name: 'Education', color: '#F59E0B', icon: 'book' },
  { name: 'Income', color: '#059669', icon: 'trending-up' },
  { name: 'Other', color: '#6B7280', icon: 'tag' }
];

// Helper function to get current user
const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Transaction Management
export const getStoredTransactions = async (): Promise<StoredTransaction[]> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        categories (
          id,
          name,
          color,
          icon
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Map transaction types back to UI terminology
    const mappedData = (data || []).map(transaction => ({
      ...transaction,
      transaction_type: mapTransactionTypeFromDb(transaction.transaction_type)
    }));
    
    return mappedData;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
};

// Helper function to automatically update account balance when a transaction is processed
const updateAccountBalanceForTransaction = async (transaction: StoredTransaction): Promise<void> => {
  try {
    console.log('🏦 Updating account balance for transaction:', {
      amount: transaction.amount,
      type: transaction.transaction_type,
      account: transaction.account_name
    });

    if (!transaction.account_name) {
      console.log('❌ No account name provided, skipping balance update');
      return;
    }

    // Extract bank name and account number from account_name (format: "Bank Name ****1234")
    const accountParts = transaction.account_name.match(/^(.+?)\s+\*{4}(\d{4})$/);
    let bankName: string | null = null;
    let accountNumber: string | null = null;

    if (accountParts) {
      bankName = accountParts[1].trim();
      accountNumber = accountParts[2];
    } else {
      // Fallback: treat the entire account_name as bank name
      bankName = transaction.account_name;
    }

    console.log('🔍 Parsed account info:', { bankName, accountNumber });

    // Find matching accounts in both the accounts table and discovered_accounts table
    let accountsToUpdate: any[] = [];

    // 1. Check main accounts table first
    const accountsQuery = supabase
      .from('accounts')
      .select('id, account_type, balance')
      .eq('user_id', transaction.user_id)
      .eq('is_active', true);

    if (accountNumber) {
      accountsQuery.ilike('account_number', `%${accountNumber}%`);
    }
    if (bankName) {
      accountsQuery.ilike('bank_name', `%${bankName}%`);
    }

    const { data: accounts, error: accountsError } = await accountsQuery;
    
    if (!accountsError && accounts && accounts.length > 0) {
      accountsToUpdate = accounts.map(acc => ({ ...acc, table: 'accounts' }));
    }

    // 2. If no matches in accounts, check discovered_accounts table
    if (accountsToUpdate.length === 0) {
      const discoveredQuery = supabase
        .from('discovered_accounts')
        .select('id, account_type, current_balance')
        .eq('user_id', transaction.user_id)
        .eq('status', 'approved');

      if (accountNumber) {
        discoveredQuery.ilike('account_number_partial', accountNumber);
      }
      if (bankName) {
        discoveredQuery.ilike('bank_name', `%${bankName}%`);
      }

      const { data: discoveredAccounts, error: discoveredError } = await discoveredQuery;
      
      if (!discoveredError && discoveredAccounts && discoveredAccounts.length > 0) {
        accountsToUpdate = discoveredAccounts.map(acc => ({ 
          ...acc, 
          table: 'discovered_accounts',
          balance: acc.current_balance 
        }));
      }
    }

    if (accountsToUpdate.length === 0) {
      console.log('⚠️ No matching accounts found for balance update');
      
      // Edge case: Create a discovered account entry for future matching
      if (bankName && accountNumber) {
        console.log('🔄 Creating discovered account entry for future transactions');
        try {
          const { error: createError } = await supabase
            .from('discovered_accounts')
            .insert({
              user_id: transaction.user_id,
              bank_name: bankName,
              account_number_partial: accountNumber,
              account_type: 'bank', // Default assumption
              current_balance: transaction.transaction_type === 'credit' ? transaction.amount : -transaction.amount,
              discovery_method: 'transaction_processing',
              status: 'pending',
              confidence_score: 0.7,
              discovery_notes: `Auto-created from transaction: ${transaction.description}`
            });

          if (!createError) {
            console.log('✅ Created discovered account entry for future matching');
          }
        } catch (error) {
          console.error('❌ Failed to create discovered account:', error);
        }
      }
      
      return;
    }

    // 3. Update balances for all matching accounts
    for (const account of accountsToUpdate) {
      try {
        const currentBalance = parseFloat(account.balance || '0');
        let newBalance = currentBalance;

        // Calculate new balance based on transaction type and account type
        if (transaction.transaction_type === 'credit') {
          // Money coming IN (positive)
          if (['bank', 'savings', 'checking', 'wallet', 'cash'].includes(account.account_type)) {
            newBalance = currentBalance + transaction.amount; // Add to asset accounts
          } else if (account.account_type === 'credit_card') {
            newBalance = currentBalance - transaction.amount; // Reduce credit card debt
          }
        } else if (transaction.transaction_type === 'debit') {
          // Money going OUT (negative)
          if (['bank', 'savings', 'checking', 'wallet', 'cash'].includes(account.account_type)) {
            newBalance = currentBalance - transaction.amount; // Subtract from asset accounts
          } else if (account.account_type === 'credit_card') {
            newBalance = currentBalance + transaction.amount; // Increase credit card debt
          }
        }

        // Validate balance constraints
        let shouldUpdate = true;
        let warningMessage = '';

        // Warn about negative balances in asset accounts (but don't prevent the update)
        if (['bank', 'savings', 'checking', 'wallet', 'cash'].includes(account.account_type) && newBalance < 0) {
          warningMessage = `⚠️ Warning: Account will have negative balance: ${newBalance}`;
          console.warn(warningMessage);
          // Still allow the update but log a warning
        }

        // Prevent extremely large negative balances (potential data error)
        if (newBalance < -1000000) { // 10 lakh rupees negative
          console.error(`❌ Preventing extreme negative balance: ${newBalance}`);
          shouldUpdate = false;
        }

        console.log('💰 Balance update:', {
          account: account.id,
          accountType: account.account_type,
          currentBalance,
          transactionAmount: transaction.amount,
          transactionType: transaction.transaction_type,
          newBalance,
          table: account.table,
          shouldUpdate,
          warning: warningMessage || 'None'
        });

        if (!shouldUpdate) {
          console.log('❌ Skipping balance update due to validation failure');
          continue;
        }

        // Update the appropriate table
        if (account.table === 'accounts') {
          const { error: updateError } = await supabase
            .from('accounts')
            .update({ balance: newBalance.toString() })
            .eq('id', account.id);

          if (updateError) {
            console.error('❌ Error updating account balance:', updateError);
          } else {
            console.log('✅ Successfully updated account balance');
          }
        } else if (account.table === 'discovered_accounts') {
          const { error: updateError } = await supabase
            .from('discovered_accounts')
            .update({ current_balance: newBalance.toString() })
            .eq('id', account.id);

          if (updateError) {
            console.error('❌ Error updating discovered account balance:', updateError);
          } else {
            console.log('✅ Successfully updated discovered account balance');
          }
        }

      } catch (error) {
        console.error('❌ Error updating individual account balance:', error);
      }
    }

  } catch (error) {
    console.error('❌ Error in updateAccountBalanceForTransaction:', error);
    // Don't throw here - balance update failure shouldn't break transaction creation
  }
};

export const addStoredTransaction = async (transaction: Omit<StoredTransaction, 'id' | 'created_at' | 'updated_at'>): Promise<StoredTransaction | null> => {
  try {
    // First check if a similar transaction already exists to prevent duplicates
    const { data: existingTransactions, error: checkError } = await supabase
      .from('transactions')
      .select('id')
      .eq('user_id', transaction.user_id)
      .eq('amount', transaction.amount)
      .eq('transaction_date', transaction.transaction_date)
      .eq('description', transaction.description)
      .eq('account_name', transaction.account_name || '')
      .limit(1);

    if (checkError) {
      console.warn('Error checking for duplicate transactions:', checkError);
    }

    // If a duplicate exists, return null (or optionally return the existing transaction)
    if (existingTransactions && existingTransactions.length > 0) {
      console.log('Duplicate transaction detected, skipping insertion:', {
        amount: transaction.amount,
        date: transaction.transaction_date,
        description: transaction.description
      });
      return null;
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: transaction.user_id,
        group_id: transaction.group_id,
        created_by: transaction.created_by,
        transaction_type: mapTransactionTypeToDb(transaction.transaction_type),
        amount: transaction.amount,
        description: transaction.description,
        category_id: transaction.category_id,
        transaction_date: transaction.transaction_date,
        payment_method: transaction.payment_method,
        account_name: transaction.account_name,
        notes: transaction.notes,
        source: transaction.source
      })
      .select()
      .single();

    if (error) throw error;
    
    // Map transaction type back to UI terminology
    if (data) {
      data.transaction_type = mapTransactionTypeFromDb(data.transaction_type);
      
      // Automatically update account balance after successful transaction creation
      await updateAccountBalanceForTransaction(data);
    }
    
    return data;
  } catch (error) {
    console.error('Error adding transaction:', error);
    return null;
  }
};

// Batch insert transactions with duplicate prevention
export const addStoredTransactionsBatch = async (transactions: Array<Omit<StoredTransaction, 'id' | 'created_at' | 'updated_at'>>): Promise<StoredTransaction[]> => {
  try {
    const successfulInserts: StoredTransaction[] = [];
    
    // Process in smaller batches to avoid overwhelming the database
    const batchSize = 10;
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      
      for (const transaction of batch) {
        const result = await addStoredTransaction(transaction);
        if (result) {
          successfulInserts.push(result);
          // Note: Balance updates are already handled in addStoredTransaction
        }
      }
      
      // Small delay between batches to be nice to the database
      if (i + batchSize < transactions.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`Successfully inserted ${successfulInserts.length} out of ${transactions.length} transactions (duplicates skipped)`);
    return successfulInserts;
  } catch (error) {
    console.error('Error in batch transaction insert:', error);
    return [];
  }
};

export const updateStoredTransaction = async (transactionId: string, updates: Partial<StoredTransaction>): Promise<boolean> => {
  try {
    // Get the original transaction first to reverse its balance effect
    const { data: originalTransaction, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (fetchError) throw fetchError;

    // Map transaction type to database terminology if it exists in updates
    const mappedUpdates = { ...updates };
    if (mappedUpdates.transaction_type) {
      mappedUpdates.transaction_type = mapTransactionTypeToDb(mappedUpdates.transaction_type);
    }
    
    const { error } = await supabase
      .from('transactions')
      .update(mappedUpdates)
      .eq('id', transactionId);

    if (error) throw error;

    // Handle balance updates for transaction changes
    if (originalTransaction) {
      // Check if any balance-affecting fields changed
      const amountChanged = updates.amount !== undefined && updates.amount !== originalTransaction.amount;
      const accountChanged = updates.account_name !== undefined && updates.account_name !== originalTransaction.account_name;
      const typeChanged = updates.transaction_type !== undefined && mapTransactionTypeToDb(updates.transaction_type) !== originalTransaction.transaction_type;

      if (amountChanged || accountChanged || typeChanged) {
        console.log('🔄 Transaction update requires balance adjustment:', {
          amountChanged: amountChanged ? `${originalTransaction.amount} → ${updates.amount}` : false,
          accountChanged: accountChanged ? `${originalTransaction.account_name} → ${updates.account_name}` : false,
          typeChanged: typeChanged ? `${originalTransaction.transaction_type} → ${updates.transaction_type}` : false
        });
        
        // Method 1: If account changed, handle old and new accounts separately
        if (accountChanged) {
          // Reverse the effect on the old account
          const reverseTransaction = {
            ...originalTransaction,
            transaction_type: originalTransaction.transaction_type === 'income' ? 'expense' : 'income',
          };
          
          await updateAccountBalanceForTransaction({
            ...reverseTransaction,
            transaction_type: mapTransactionTypeFromDb(reverseTransaction.transaction_type)
          } as StoredTransaction);

          // Apply the new effect to the new account
          const newTransaction = {
            ...originalTransaction,
            ...updates,
            transaction_type: mappedUpdates.transaction_type || originalTransaction.transaction_type
          };
          
          await updateAccountBalanceForTransaction({
            ...newTransaction,
            transaction_type: mapTransactionTypeFromDb(newTransaction.transaction_type)
          } as StoredTransaction);
        }
        // Method 2: If only amount or type changed (same account), calculate the difference
        else {
          const oldAmount = originalTransaction.amount;
          const newAmount = updates.amount !== undefined ? updates.amount : originalTransaction.amount;
          const oldType = originalTransaction.transaction_type;
          const newType = mappedUpdates.transaction_type || originalTransaction.transaction_type;
          
          console.log('📊 Calculating balance difference:', {
            oldAmount,
            newAmount,
            oldType: mapTransactionTypeFromDb(oldType),
            newType: mapTransactionTypeFromDb(newType)
          });

          // Calculate the net effect difference
          let balanceDifference = 0;
          
          // Convert old transaction effect to a number (positive = increase balance, negative = decrease balance)
          const oldEffect = oldType === 'income' ? oldAmount : -oldAmount;
          // Convert new transaction effect to a number
          const newEffect = newType === 'income' ? newAmount : -newAmount;
          
          balanceDifference = newEffect - oldEffect;
          
          console.log('💰 Net balance difference to apply:', balanceDifference);

          if (balanceDifference !== 0) {
            // Create a difference transaction to apply the net change
            const differenceTransaction = {
              ...originalTransaction,
              amount: Math.abs(balanceDifference),
              transaction_type: balanceDifference > 0 ? 'income' : 'expense'
            };

            await updateAccountBalanceForTransaction({
              ...differenceTransaction,
              transaction_type: mapTransactionTypeFromDb(differenceTransaction.transaction_type)
            } as StoredTransaction);
          }
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Error updating transaction:', error);
    return false;
  }
};

export const deleteStoredTransaction = async (transactionId: string): Promise<boolean> => {
  try {
    // Get the transaction first to reverse its balance effect
    const { data: transactionToDelete, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (fetchError) throw fetchError;

    // Delete the transaction
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId);

    if (error) throw error;

    // Reverse the balance effect of the deleted transaction
    if (transactionToDelete) {
      console.log('🔄 Reversing balance effect of deleted transaction');
      
      // Create a reverse transaction to undo the balance effect
      const reverseTransaction = {
        ...transactionToDelete,
        transaction_type: transactionToDelete.transaction_type === 'income' ? 'expense' : 'income',
      };
      
      await updateAccountBalanceForTransaction({
        ...reverseTransaction,
        transaction_type: mapTransactionTypeFromDb(reverseTransaction.transaction_type)
      } as StoredTransaction);
    }

    return true;
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return false;
  }
};

// Category Management
export const getStoredCategories = async (): Promise<StoredCategory[]> => {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    if (error) throw error;

    // If no categories exist, create default ones
    if (!data || data.length === 0) {
      await createDefaultCategories(user.id);
      return getStoredCategories();
    }

    return data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

const createDefaultCategories = async (userId: string) => {
  try {
    const categoriesToInsert = DEFAULT_CATEGORIES.map(cat => ({
      user_id: userId,
      name: cat.name,
      color: cat.color,
      icon: cat.icon,
      is_system: true
    }));

    await supabase.from('categories').insert(categoriesToInsert);
  } catch (error) {
    console.error('Error creating default categories:', error);
  }
};

export const addStoredCategory = async (category: Omit<StoredCategory, 'id' | 'created_at' | 'user_id'>): Promise<StoredCategory | null> => {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('categories')
      .insert({
        user_id: user.id,
        name: category.name,
        color: category.color,
        icon: category.icon,
        group_id: category.group_id,
        parent_id: category.parent_id,
        is_system: false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding category:', error);
    return null;
  }
};

export const findOrCreateStoredCategory = async (name: string, color?: string): Promise<StoredCategory | null> => {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    // Check if category exists
    const { data: existing } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .ilike('name', name)
      .single();

    if (existing) return existing;

    // Create new category
    const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];
    const defaultColor = color || colors[Math.floor(Math.random() * colors.length)];
    
    return addStoredCategory({ 
      name, 
      color: defaultColor, 
      icon: 'circle',
      group_id: null,
      created_by: user.id,
      is_system: false,
      parent_id: null
    });
  } catch (error) {
    console.error('Error finding/creating category:', error);
    return null;
  }
};

// Group Management
export const getStoredGroups = async (): Promise<StoredGroup[]> => {
  try {
    const { data, error } = await supabase
      .from('expense_groups')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching groups:', error);
    return [];
  }
};

export const getUserGroups = async (userId: string): Promise<StoredGroup[]> => {
  try {
    const { data, error } = await supabase
      .from('group_members')
      .select(`
        expense_groups (*)
      `)
      .eq('user_id', userId)
      .eq('status', 'accepted');

    if (error) throw error;
    
    // Type-safe extraction of group data
    const groups = data?.map((item: any) => item.expense_groups).filter(Boolean) || [];
    return groups as StoredGroup[];
  } catch (error) {
    console.error('Error fetching user groups:', error);
    return [];
  }
};

export const addStoredGroup = async (group: { name: string; description?: string; owner_id: string }): Promise<StoredGroup | null> => {
  try {
    console.log('Creating group with data:', group);
    
    // Get current user to get their email
    const user = await getCurrentUser();
    if (!user) {
      console.error('No authenticated user found');
      throw new Error('No authenticated user found');
    }

    console.log('Current user:', user.id, user.email);

    // Generate group code
    const groupCode = Math.random().toString(36).substr(2, 8).toUpperCase();
    console.log('Generated group code:', groupCode);

    const groupData = {
      name: group.name,
      description: group.description,
      owner_id: group.owner_id,
      group_code: groupCode,
      is_active: true
    };

    console.log('Inserting group data:', groupData);

    const { data: newGroup, error: groupError } = await supabase
      .from('expense_groups')
      .insert(groupData)
      .select()
      .single();

    if (groupError) {
      console.error('Group creation error:', groupError);
      throw groupError;
    }

    console.log('Group created successfully:', newGroup);

    // Add owner as member with their email
    const memberData = {
      user_id: group.owner_id,
      group_id: newGroup.id,
      email: user.email || '',
      invited_by: group.owner_id,
      role: 'owner',
      status: 'active'
    };

    console.log('Adding member with data:', memberData);

    const { error: memberError } = await supabase
      .from('group_members')
      .insert(memberData);

    if (memberError) {
      console.error('Member creation error:', memberError);
      throw memberError;
    }

    console.log('Member added successfully');
    return newGroup;
  } catch (error) {
    console.error('Error creating group:', error);
    throw error; // Re-throw to let the calling function handle it
  }
};

export const joinStoredGroup = async (groupCode: string, userId: string, userEmail: string): Promise<boolean> => {
  try {
    // Find group by code
    const { data: group, error: groupError } = await supabase
      .from('expense_groups')
      .select('*')
      .eq('group_code', groupCode)
      .eq('is_active', true)
      .single();

    if (groupError || !group) return false;

    // Check if already a member
    const { data: existing } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', group.id)
      .eq('user_id', userId)
      .single();

    if (existing) return false;

    // Add membership
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({
        user_id: userId,
        group_id: group.id,
        email: userEmail,
        invited_by: group.owner_id,
        role: 'member',
        status: 'active'
      });

    if (memberError) throw memberError;
    return true;
  } catch (error) {
    console.error('Error joining group:', error);
    return false;
  }
};

export const findGroupByCode = async (groupCode: string): Promise<StoredGroup | null> => {
  try {
    const { data, error } = await supabase
      .from('expense_groups')
      .select('*')
      .eq('group_code', groupCode)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error finding group by code:', error);
    return null;
  }
};

// Enhanced Financial Modules - We'll need to create these tables in Supabase
// For now, let's create them using the existing 'accounts' table structure and extend it

// Since the enhanced financial modules need custom tables, let's use a generic approach
// with the existing accounts table for now, and add type field to differentiate

export const addCreditCard = async (card: Omit<CreditCard, 'id' | 'created_at'>): Promise<CreditCard | null> => {
  try {
    // We'll store in accounts table with account_type as 'credit_card'
    const { data, error } = await supabase
      .from('accounts')
      .insert({
        user_id: card.user_id,
        group_id: card.group_id,
        name: card.name,
        account_type: 'credit_card',
        bank_name: card.bank_name,
        balance: card.current_balance,
        // Store additional data in a JSON field if available, or we'll need to extend the schema
      })
      .select()
      .single();

    if (error) throw error;
    
    // For now, return a mapped structure
    return {
      id: data.id,
      user_id: data.user_id,
      group_id: data.group_id,
      name: data.name,
      bank_name: data.bank_name || '',
      card_number_last4: card.card_number_last4,
      credit_limit: card.credit_limit,
      current_balance: data.balance || 0,
      interest_rate: card.interest_rate,
      annual_fee: card.annual_fee,
      due_date: card.due_date,
      minimum_payment: card.minimum_payment,
      statement_date: card.statement_date,
      created_at: data.created_at,
      is_active: data.is_active || true
    };
  } catch (error) {
    console.error('Error adding credit card:', error);
    return null;
  }
};

// Similar functions for other financial modules...
export const addLoan = async (loan: Omit<Loan, 'id' | 'created_at'>): Promise<Loan | null> => {
  // Implementation similar to addCreditCard
  console.log('Adding loan:', loan);
  return null; // Placeholder
};

export const addInvestment = async (investment: Omit<Investment, 'id' | 'created_at'>): Promise<Investment | null> => {
  console.log('Adding investment:', investment);
  return null; // Placeholder
};

export const addInsurance = async (insurance: Omit<Insurance, 'id' | 'created_at'>): Promise<Insurance | null> => {
  console.log('Adding insurance:', insurance);
  return null; // Placeholder
};

export const addProperty = async (property: Omit<Property, 'id' | 'created_at'>): Promise<Property | null> => {
  console.log('Adding property:', property);
  return null; // Placeholder
};

export const addRecurringPayment = async (payment: Omit<RecurringPayment, 'id' | 'created_at'>): Promise<RecurringPayment | null> => {
  try {
    const { data, error } = await supabase
      .from('recurring_templates')
      .insert({
        user_id: payment.user_id,
        group_id: payment.group_id,
        name: payment.name,
        amount: payment.amount,
        frequency: payment.frequency,
        category_id: payment.category_id,
        day_of_month: payment.payment_date,
        start_date: payment.start_date,
        end_date: payment.end_date,
        transaction_type: 'expense', // Default
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      user_id: data.user_id,
      group_id: data.group_id,
      name: data.name,
      description: payment.description,
      amount: data.amount,
      frequency: data.frequency as any,
      category_id: data.category_id,
      payment_date: data.day_of_month || 1,
      start_date: data.start_date,
      end_date: data.end_date,
      auto_create_transaction: payment.auto_create_transaction,
      created_at: data.created_at,
      is_active: data.is_active || true
    };
  } catch (error) {
    console.error('Error adding recurring payment:', error);
    return null;
  }
};

// Get all financial data for a user
export const getAllUserFinancials = async (userId: string, groupId?: string) => {
  try {
    const filter = groupId 
      ? { group_id: groupId, is_active: true }
      : { user_id: userId, is_active: true, group_id: null };

    const [accounts, recurringPayments] = await Promise.all([
      supabase.from('accounts').select('*').match(filter),
      supabase.from('recurring_templates').select('*').match(filter)
    ]);

    return {
      accounts: accounts.data || [],
      creditCards: [], // Will be filtered from accounts
      loans: [], // Will be filtered from accounts  
      investments: [], // Will be filtered from accounts
      insurance: [], // Placeholder
      properties: [], // Placeholder
      recurringPayments: recurringPayments.data || []
    };
  } catch (error) {
    console.error('Error fetching user financials:', error);
    return {
      accounts: [],
      creditCards: [],
      loans: [],
      investments: [],
      insurance: [],
      properties: [],
      recurringPayments: []
    };
  }
};

// Calculate net worth
export const calculateNetWorth = async (userId: string, groupId?: string): Promise<number> => {
  try {
    const financials = await getAllUserFinancials(userId, groupId);
    
    let assets = 0;
    let liabilities = 0;
    
    financials.accounts.forEach(acc => {
      if (['savings', 'checking', 'investment', 'cash'].includes(acc.account_type)) {
        assets += acc.balance || 0;
      } else if (['credit_card', 'loan'].includes(acc.account_type)) {
        liabilities += acc.balance || 0;
      }
    });
    
    return assets - liabilities;
  } catch (error) {
    console.error('Error calculating net worth:', error);
    return 0;
  }
};

// Get transactions for personal mode
export const getPersonalTransactions = async (currentUserId: string, currentUserEmail?: string): Promise<StoredTransaction[]> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        categories (
          id,
          name,
          color,
          icon
        )
      `)
      .or(`user_id.eq.${currentUserId},and(group_id.is.null,created_by.eq.${currentUserId})`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Map transaction types back to UI terminology
    const mappedData = (data || []).map(transaction => ({
      ...transaction,
      transaction_type: mapTransactionTypeFromDb(transaction.transaction_type)
    }));
    
    return mappedData;
  } catch (error) {
    console.error('Error fetching personal transactions:', error);
    return [];
  }
};

// Get transactions for group mode
export const getGroupTransactions = async (groupId: string): Promise<StoredTransaction[]> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        categories (
          id,
          name,
          color,
          icon
        )
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Map transaction types back to UI terminology
    const mappedData = (data || []).map(transaction => ({
      ...transaction,
      transaction_type: mapTransactionTypeFromDb(transaction.transaction_type)
    }));
    
    return mappedData;
  } catch (error) {
    console.error('Error fetching group transactions:', error);
    return [];
  }
};

// Map UI account types to database-allowed types
const mapAccountTypeToDatabase = (uiType: string): string => {
  const mapping: { [key: string]: string } = {
    'savings': 'bank',
    'checking': 'bank', 
    'credit_card': 'credit_card',
    'loan': 'loan', // Keep loan as loan for proper filtering
    'investment': 'investment',
    'cash': 'wallet',
    'wallet': 'wallet',
    'real_estate': 'other',
    'vehicle': 'other',
    'other': 'other',
    'recurring': 'other',
    'mutual_fund': 'investment',
    'stocks': 'investment',
    'sip': 'investment',
    'insurance': 'other',
    'life_insurance': 'other',
    'health_insurance': 'other'
  };
  
  return mapping[uiType] || 'other';
};

// Map database account type back to UI type for compatibility
const mapDbTypeToUiType = (dbType: string): string => {
  const mapping: { [key: string]: string } = {
    'bank': 'savings', // Default bank accounts to savings for UI
    'credit_card': 'credit_card',
    'loan': 'loan', // Map loan back to loan for UI
    'wallet': 'cash',
    'investment': 'investment',
    'other': 'other'
  };
  
  return mapping[dbType] || 'other';
};

// Financial Account Management
export const getFinancialAccounts = async () => {
  try {
    console.log('getFinancialAccounts called');
    
    const user = await getCurrentUser();
    if (!user) {
      console.log('No user logged in');
      return [];
    }

    console.log('Fetching accounts for user:', user.id);

    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching accounts:', error);
      throw error;
    }
    
    // Map Supabase data to FinancialAccount interface format
    const mappedAccounts = (data || []).map(account => ({
      id: account.id,
      user_id: account.user_id,
      group_id: account.group_id,
      name: account.name,
      type: mapDbTypeToUiType(account.account_type), // Map account_type to type
      bank_name: account.bank_name,
      account_number: account.account_number_masked,
      balance: account.balance || 0,
      currency: account.currency,
      is_active: account.is_active,
      created_at: account.created_at,
      updated_at: account.updated_at,
      // Credit card specific fields
      credit_limit: account.credit_limit,
      // Loan specific fields
      interest_rate: account.interest_rate,
      monthly_emi: account.monthly_emi,
      next_due_date: account.next_due_date,
      remaining_terms: account.remaining_terms,
      principal_amount: account.principal_amount,
      loan_tenure_months: account.loan_tenure_months,
      interest_type: account.interest_type,
      processing_fee: account.processing_fee,
      processing_fee_percentage: account.processing_fee_percentage,
      is_no_cost_emi: account.is_no_cost_emi,
      is_interest_free: account.is_interest_free,
      emi_start_date: account.emi_start_date,
      // Home loan specific fields
      is_home_loan: account.is_home_loan,
      is_under_construction: account.is_under_construction,
      sanctioned_amount: account.sanctioned_amount,
      disbursed_amount: account.disbursed_amount,
      moratorium_period_months: account.moratorium_period_months,
      moratorium_end_date: account.moratorium_end_date,
      is_in_moratorium: account.is_in_moratorium,
      possession_date: account.possession_date,
      actual_moratorium_emi: account.actual_moratorium_emi,
      // Sharing fields
      is_pool_contribution: account.is_pool_contribution,
      is_shared: account.is_shared,
      split_type: account.split_type
    }));
    
    console.log('Retrieved and mapped accounts:', mappedAccounts.length, mappedAccounts);
    return mappedAccounts;
  } catch (error) {
    console.error('Error fetching financial accounts:', error);
    return [];
  }
};

export const addFinancialAccount = async (account: any) => {
  try {
    console.log('addFinancialAccount called with:', account);
    
    const user = await getCurrentUser();
    if (!user) throw new Error('No user logged in');

    console.log('Current user:', user.id);

    // Map the UI account type to database-allowed type
    const uiAccountType = account.type || account.account_type || 'other';
    const dbAccountType = mapAccountTypeToDatabase(uiAccountType);
    
    console.log('Account type mapping:', { uiType: uiAccountType, dbType: dbAccountType });

    // Check for duplicate accounts before inserting
    const duplicateFilters = [
      supabase.from('accounts').select('id').eq('user_id', user.id).eq('name', account.name).eq('is_active', true)
    ];

    // If we have bank name and account number, also check by those
    if (account.bank_name && account.account_number) {
      duplicateFilters.push(
        supabase.from('accounts').select('id')
          .eq('user_id', user.id)
          .eq('bank_name', account.bank_name)
          .eq('account_number_masked', account.account_number)
          .eq('is_active', true)
      );
    }

    // Check for duplicates
    for (const filter of duplicateFilters) {
      const { data: existingAccounts, error: checkError } = await filter.limit(1);
      
      if (checkError) {
        console.warn('Error checking for duplicate accounts:', checkError);
        continue;
      }

      if (existingAccounts && existingAccounts.length > 0) {
        console.log('Duplicate account detected, skipping insertion:', {
          name: account.name,
          bank_name: account.bank_name,
          account_number: account.account_number
        });
        return null;
      }
    }

    const insertData = {
      user_id: user.id,
      name: account.name,
      account_type: dbAccountType,
      balance: account.balance || account.current_balance || 0,
      bank_name: account.bank_name || null,
      account_number_masked: account.account_number || null,
      group_id: account.group_id || null,
      currency: 'INR',
      is_active: account.is_active !== false,
      // Credit card specific fields
      credit_limit: account.credit_limit || null,
      // Loan specific fields
      interest_rate: account.interest_rate || null,
      monthly_emi: account.monthly_emi || null,
      next_due_date: account.next_due_date || null,
      remaining_terms: account.remaining_terms || null,
      principal_amount: account.principal_amount || null,
      loan_tenure_months: account.loan_tenure_months || null,
      interest_type: account.interest_type || null,
      processing_fee: account.processing_fee || null,
      processing_fee_percentage: account.processing_fee_percentage || null,
      is_no_cost_emi: account.is_no_cost_emi || null,
      is_interest_free: account.is_interest_free || null,
      emi_start_date: account.emi_start_date || null,
      // Home loan specific fields
      is_home_loan: account.is_home_loan || null,
      is_under_construction: account.is_under_construction || null,
      sanctioned_amount: account.sanctioned_amount || null,
      disbursed_amount: account.disbursed_amount || null,
      moratorium_period_months: account.moratorium_period_months || null,
      moratorium_end_date: account.moratorium_end_date || null,
      is_in_moratorium: account.is_in_moratorium || null,
      possession_date: account.possession_date || null,
      actual_moratorium_emi: account.actual_moratorium_emi || null,
      // Sharing fields
      is_pool_contribution: account.is_pool_contribution || false,
      is_shared: account.is_shared || false,
      split_type: account.split_type || null
    };

    console.log('Inserting account data:', insertData);

    const { data, error } = await supabase
      .from('accounts')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    console.log('Account successfully created:', data);
    return data;
  } catch (error) {
    console.error('Error adding financial account:', error);
    return null;
  }
};

export const updateFinancialAccount = async (accountId: string, updates: any) => {
  try {
    console.log('updateFinancialAccount called with:', updates);
    
    // Map UI fields to database fields
    const mappedUpdates = { ...updates };
    
    // Map type to account_type if present
    if (mappedUpdates.type) {
      mappedUpdates.account_type = mapAccountTypeToDatabase(mappedUpdates.type);
      delete mappedUpdates.type; // Remove the UI field
    }
    
    console.log('Mapped updates for database:', mappedUpdates);

    const { data, error } = await supabase
      .from('accounts')
      .update(mappedUpdates)
      .eq('id', accountId)
      .select()
      .single();

    if (error) throw error;
    
    console.log('Account updated successfully:', data);
    return data;
  } catch (error) {
    console.error('Error updating financial account:', error);
    return null;
  }
};

export const deleteFinancialAccount = async (accountId: string) => {
  try {
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', accountId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting financial account:', error);
    return false;
  }
};

// Clear all data function
export const clearAllStoredData = async () => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.error('No user logged in');
      return;
    }

    // Clear transactions
    await supabase.from('transactions').delete().eq('user_id', user.id);
    
    // Clear accounts
    await supabase.from('accounts').delete().eq('user_id', user.id);
    
    // Clear user categories (non-system)
    await supabase.from('categories').delete().eq('user_id', user.id).eq('is_system', false);
    
    // Clear recurring templates
    await supabase.from('recurring_templates').delete().eq('user_id', user.id);
    
    // Clear group memberships
    await supabase.from('group_members').delete().eq('user_id', user.id);
    
    // Clear owned groups
    await supabase.from('expense_groups').delete().eq('owner_id', user.id);
    
    console.log('All Supabase data cleared successfully!');
    window.location.reload();
  } catch (error) {
    console.error('Error clearing Supabase data:', error);
  }
};