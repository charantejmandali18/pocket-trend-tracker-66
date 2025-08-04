import { supabase } from '@/integrations/supabase/client';

// Function to clear all Supabase data for the current user
export const clearAllSupabaseData = async () => {
  try {
    console.log('Starting Supabase data clearing...');
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('No user logged in');
    }

    const userId = user.id;
    const results = [];

    // 1. Clear transactions
    const { error: transactionsError } = await supabase
      .from('transactions')
      .delete()
      .or(`user_id.eq.${userId},created_by.eq.${userId}`);
    
    if (transactionsError) {
      results.push(`Transactions error: ${transactionsError.message}`);
    } else {
      results.push('✅ Transactions cleared');
    }

    // 2. Clear budget items (through budget_plans relationship)
    const { data: userBudgetPlans } = await supabase
      .from('budget_plans')
      .select('id')
      .eq('user_id', userId);
    
    if (userBudgetPlans && userBudgetPlans.length > 0) {
      const budgetPlanIds = userBudgetPlans.map(plan => plan.id);
      
      const { error: budgetItemsError } = await supabase
        .from('budget_items')
        .delete()
        .in('budget_plan_id', budgetPlanIds);
      
      if (budgetItemsError) {
        results.push(`Budget items error: ${budgetItemsError.message}`);
      } else {
        results.push('✅ Budget items cleared');
      }
    }

    // 3. Clear budget plans
    const { error: budgetPlansError } = await supabase
      .from('budget_plans')
      .delete()
      .eq('user_id', userId);
    
    if (budgetPlansError) {
      results.push(`Budget plans error: ${budgetPlansError.message}`);
    } else {
      results.push('✅ Budget plans cleared');
    }

    // 4. Clear accounts
    const { error: accountsError } = await supabase
      .from('accounts')
      .delete()
      .eq('user_id', userId);
    
    if (accountsError) {
      results.push(`Accounts error: ${accountsError.message}`);
    } else {
      results.push('✅ Accounts cleared');
    }

    // 5. Clear recurring templates
    const { error: recurringError } = await supabase
      .from('recurring_templates')
      .delete()
      .eq('user_id', userId);
    
    if (recurringError) {
      results.push(`Recurring templates error: ${recurringError.message}`);
    } else {
      results.push('✅ Recurring templates cleared');
    }

    // 6. Clear categories (user-created ones)
    const { error: categoriesError } = await supabase
      .from('categories')
      .delete()
      .eq('user_id', userId)
      .eq('is_system', false);
    
    if (categoriesError) {
      results.push(`Categories error: ${categoriesError.message}`);
    } else {
      results.push('✅ User categories cleared');
    }

    // 7. Clear import logs
    const { error: importLogsError } = await supabase
      .from('import_logs')
      .delete()
      .eq('user_id', userId);
    
    if (importLogsError) {
      results.push(`Import logs error: ${importLogsError.message}`);
    } else {
      results.push('✅ Import logs cleared');
    }

    // 8. Clear group memberships where user is a member
    const { error: groupMembersError } = await supabase
      .from('group_members')
      .delete()
      .eq('user_id', userId);
    
    if (groupMembersError) {
      results.push(`Group memberships error: ${groupMembersError.message}`);
    } else {
      results.push('✅ Group memberships cleared');
    }

    // 9. Clear group invitations for this user
    const { error: groupInvitationsError } = await supabase
      .from('group_invitations')
      .delete()
      .or(`invited_by.eq.${userId},email.eq.${user.email}`);
    
    if (groupInvitationsError) {
      results.push(`Group invitations error: ${groupInvitationsError.message}`);
    } else {
      results.push('✅ Group invitations cleared');
    }

    // 10. Clear groups owned by user (this will cascade delete related data)
    const { error: groupsError } = await supabase
      .from('expense_groups')
      .delete()
      .eq('owner_id', userId);
    
    if (groupsError) {
      results.push(`Groups error: ${groupsError.message}`);
    } else {
      results.push('✅ Groups cleared');
    }

    console.log('Supabase data clearing completed:', results);
    return {
      success: true,
      results,
      message: 'All Supabase data cleared successfully'
    };

  } catch (error) {
    console.error('Error clearing Supabase data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to clear Supabase data'
    };
  }
};

// Function to clear specific tables
export const clearSpecificSupabaseTables = async (tableNames: string[]) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('No user logged in');
    }

    const results = [];

    // Type-safe table access
    const validTables = [
      'transactions', 'categories', 'expense_groups', 'accounts', 
      'bank_balances', 'budget_items', 'credit_cards', 'fixed_expenses', 
      'floating_expenses', 'group_invitations', 'group_members', 
      'import_logs', 'income', 'insurance', 'investments', 'loans', 
      'properties', 'recurring_templates', 'user_profiles', 'budget_plans'
    ] as const;

    for (const tableName of tableNames) {
      if (!validTables.includes(tableName as any)) {
        results.push(`❌ ${tableName}: Invalid table name`);
        continue;
      }
      
      try {
        const { error } = await (supabase as any)
          .from(tableName)
          .delete()
          .eq('user_id', user.id);
        
        if (error) {
          results.push(`❌ ${tableName}: ${error.message}`);
        } else {
          results.push(`✅ ${tableName}: cleared`);
        }
      } catch (err) {
        results.push(`❌ ${tableName}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    return { success: true, results };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Function to get data counts for verification
export const getSupabaseDataCounts = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'No user logged in' };
    }

    const counts: { [key: string]: number } = {};

    // Count transactions
    const { count: transactionsCount, error: transactionsError } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    
    counts.transactions = transactionsCount || 0;

    // Count accounts
    const { count: accountsCount } = await supabase
      .from('accounts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    
    counts.accounts = accountsCount || 0;

    // Count groups owned
    const { count: groupsCount } = await supabase
      .from('expense_groups')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', user.id);
    
    counts.groups_owned = groupsCount || 0;

    // Count group memberships
    const { count: membershipsCount } = await supabase
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    
    counts.group_memberships = membershipsCount || 0;

    // Count categories
    const { count: categoriesCount } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_system', false);
    
    counts.user_categories = categoriesCount || 0;

    // Count budget plans
    const { count: budgetPlansCount } = await supabase
      .from('budget_plans')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    
    counts.budget_plans = budgetPlansCount || 0;

    // Count recurring templates
    const { count: recurringCount } = await supabase
      .from('recurring_templates')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    
    counts.recurring_templates = recurringCount || 0;

    return { success: true, counts };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};