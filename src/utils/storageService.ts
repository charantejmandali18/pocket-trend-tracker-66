// Unified storage service that automatically chooses between local storage and Supabase
import { STORAGE_CONFIG } from '@/config/storage';

// Import both implementations
import * as SupabaseStorage from './supabaseDataStorage';
import * as LocalStorage from './dataStorage';

// Types (use the local storage types as they're comprehensive)
export type {
  StoredTransaction,
  StoredCategory,
  StoredGroup,
  GroupMembership,
  CreditCard,
  Loan,
  Investment,
  Insurance,
  Property,
  RecurringPayment,
  FinancialAccount,
  GroupAssetSplit,
  UserMapping
} from './dataStorage';

// Storage Service Interface
class StorageService {
  get useLocalStorage() {
    return STORAGE_CONFIG.USE_LOCAL_STORAGE;
  }

  // Transaction methods
  async getStoredTransactions() {
    return this.useLocalStorage ? LocalStorage.getStoredTransactions() : await SupabaseStorage.getStoredTransactions();
  }

  async addStoredTransaction(transaction: any, skipBalanceUpdate = false) {
    return this.useLocalStorage 
      ? LocalStorage.addStoredTransaction(transaction)
      : await SupabaseStorage.addStoredTransaction(transaction, skipBalanceUpdate);
  }

  async addStoredTransactionsBatch(transactions: any[]) {
    return this.useLocalStorage
      ? Promise.all(transactions.map(t => LocalStorage.addStoredTransaction(t)))
      : await SupabaseStorage.addStoredTransactionsBatch(transactions);
  }

  async updateStoredTransaction(id: string, updates: any) {
    return this.useLocalStorage
      ? LocalStorage.updateStoredTransaction(id, updates)
      : await SupabaseStorage.updateStoredTransaction(id, updates);
  }

  async deleteStoredTransaction(id: string) {
    return this.useLocalStorage
      ? LocalStorage.deleteStoredTransaction(id)
      : await SupabaseStorage.deleteStoredTransaction(id);
  }

  // Category methods
  async getStoredCategories() {
    return this.useLocalStorage ? LocalStorage.getStoredCategories() : await SupabaseStorage.getStoredCategories();
  }

  async addStoredCategory(category: any) {
    return this.useLocalStorage
      ? LocalStorage.addStoredCategory(category)
      : await SupabaseStorage.addStoredCategory(category);
  }

  async findOrCreateStoredCategory(name: string, color?: string) {
    return this.useLocalStorage
      ? LocalStorage.findOrCreateStoredCategory(name, color)
      : await SupabaseStorage.findOrCreateStoredCategory(name, color);
  }

  // Group methods
  async getUserGroups(userId: string) {
    return this.useLocalStorage 
      ? LocalStorage.getUserGroups(userId)
      : await SupabaseStorage.getUserGroups(userId);
  }

  async addStoredGroup(group: any) {
    return this.useLocalStorage
      ? LocalStorage.addStoredGroup(group)
      : await SupabaseStorage.addStoredGroup(group);
  }

  async joinStoredGroup(groupCode: string, userId: string, userEmail?: string) {
    return this.useLocalStorage
      ? LocalStorage.joinStoredGroup(groupCode, userId)
      : await SupabaseStorage.joinStoredGroup(groupCode, userId, userEmail || '');
  }

  async findGroupByCode(groupCode: string) {
    return this.useLocalStorage
      ? LocalStorage.findGroupByCode(groupCode)
      : await SupabaseStorage.findGroupByCode(groupCode);
  }

  // Financial methods
  async getAllUserFinancials(userId: string, groupId?: string) {
    return this.useLocalStorage
      ? LocalStorage.getAllUserFinancials(userId, groupId)
      : await SupabaseStorage.getAllUserFinancials(userId, groupId);
  }

  async calculateNetWorth(userId: string, groupId?: string) {
    return this.useLocalStorage
      ? LocalStorage.calculateNetWorth(userId, groupId)
      : await SupabaseStorage.calculateNetWorth(userId, groupId);
  }

  // Enhanced Financial Module methods
  async addCreditCard(card: any) {
    return this.useLocalStorage
      ? LocalStorage.addCreditCard(card)
      : await SupabaseStorage.addCreditCard(card);
  }

  async addLoan(loan: any) {
    return this.useLocalStorage
      ? LocalStorage.addLoan(loan)
      : await SupabaseStorage.addLoan(loan);
  }

  async addInvestment(investment: any) {
    return this.useLocalStorage
      ? LocalStorage.addInvestment(investment)
      : await SupabaseStorage.addInvestment(investment);
  }

  async addInsurance(insurance: any) {
    return this.useLocalStorage
      ? LocalStorage.addInsurance(insurance)
      : await SupabaseStorage.addInsurance(insurance);
  }

  async addProperty(property: any) {
    return this.useLocalStorage
      ? LocalStorage.addProperty(property)
      : await SupabaseStorage.addProperty(property);
  }

  async addRecurringPayment(payment: any) {
    return this.useLocalStorage
      ? LocalStorage.addRecurringPayment(payment)
      : await SupabaseStorage.addRecurringPayment(payment);
  }

  // Transaction filtering methods
  async getPersonalTransactions(userId: string, userEmail?: string) {
    return this.useLocalStorage
      ? LocalStorage.getPersonalTransactions(userId, userEmail)
      : await SupabaseStorage.getPersonalTransactions(userId, userEmail);
  }

  async getGroupTransactions(groupId: string, currentUserId: string, currentUserEmail?: string) {
    return this.useLocalStorage
      ? LocalStorage.getGroupTransactions(groupId, currentUserId, currentUserEmail)
      : await SupabaseStorage.getGroupTransactions(groupId, currentUserId, currentUserEmail);
  }

  // Assign transaction to group
  async assignTransactionToGroup(transactionId: string, groupId: string | null) {
    return this.useLocalStorage
      ? LocalStorage.assignTransactionToGroup(transactionId, groupId)
      : await SupabaseStorage.assignTransactionToGroup(transactionId, groupId);
  }

  // Get transactions for balance calculation
  async getTransactionsForBalanceCalculation(accountName: string, currentUserId: string, groupId?: string | null, currentUserEmail?: string) {
    return this.useLocalStorage
      ? LocalStorage.getTransactionsForBalanceCalculation(accountName, currentUserId, groupId, currentUserEmail)
      : await SupabaseStorage.getTransactionsForBalanceCalculation(accountName, currentUserId, groupId, currentUserEmail);
  }

  // Clear data method
  async clearAllStoredData() {
    return this.useLocalStorage
      ? LocalStorage.clearAllStoredData()
      : await SupabaseStorage.clearAllStoredData();
  }

  // Financial account methods - properly implemented for both storage types
  async addFinancialAccount(account: any) {
    console.log('StorageService.addFinancialAccount called - routing to', this.useLocalStorage ? 'localStorage' : 'Supabase');
    
    if (this.useLocalStorage) {
      return LocalStorage.addFinancialAccount(account);
    }
    
    return await SupabaseStorage.addFinancialAccount(account);
  }

  async updateFinancialAccount(accountId: string, updates: any) {
    if (this.useLocalStorage) {
      return LocalStorage.updateFinancialAccount(accountId, updates);
    }
    return await SupabaseStorage.updateFinancialAccount(accountId, updates);
  }

  async deleteFinancialAccount(accountId: string) {
    if (this.useLocalStorage) {
      return LocalStorage.deleteFinancialAccount(accountId);
    }
    return await SupabaseStorage.deleteFinancialAccount(accountId);
  }

  async getFinancialAccounts(userId?: string) {
    if (this.useLocalStorage) {
      return LocalStorage.getFinancialAccounts(userId);
    }
    return await SupabaseStorage.getFinancialAccounts();
  }

  async assignAccountToGroup(accountId: string, groupId: string | null, contributionType?: 'none' | 'amount' | 'percentage', contributionAmount?: number, contributionPercentage?: number) {
    if (this.useLocalStorage) {
      return LocalStorage.assignAccountToGroup(accountId, groupId, contributionType, contributionAmount, contributionPercentage);
    }
    return await SupabaseStorage.assignAccountToGroup(accountId, groupId, contributionType, contributionAmount, contributionPercentage);
  }

  getCreditCards() {
    if (this.useLocalStorage) {
      return LocalStorage.getCreditCards();
    }
    return [];
  }

  getLoans() {
    if (this.useLocalStorage) {
      return LocalStorage.getLoans();
    }
    return [];
  }

  getInvestments() {
    if (this.useLocalStorage) {
      return LocalStorage.getInvestments();
    }
    return [];
  }

  getInsurance() {
    if (this.useLocalStorage) {
      return LocalStorage.getInsurance();
    }
    return [];
  }

  getProperties() {
    if (this.useLocalStorage) {
      return LocalStorage.getProperties();
    }
    return [];
  }

  getRecurringPayments() {
    if (this.useLocalStorage) {
      return LocalStorage.getRecurringPayments();
    }
    return [];
  }
}

// Export singleton instance
export const storageService = new StorageService();

// Export individual methods for easier importing (bound to the service instance)
export const getStoredTransactions = storageService.getStoredTransactions.bind(storageService);
export const addStoredTransaction = (transaction: any, skipBalanceUpdate = false) => 
  storageService.addStoredTransaction(transaction, skipBalanceUpdate);
export const addStoredTransactionsBatch = storageService.addStoredTransactionsBatch.bind(storageService);
export const updateStoredTransaction = storageService.updateStoredTransaction.bind(storageService);
export const deleteStoredTransaction = storageService.deleteStoredTransaction.bind(storageService);
export const getStoredCategories = storageService.getStoredCategories.bind(storageService);
export const addStoredCategory = storageService.addStoredCategory.bind(storageService);
export const findOrCreateStoredCategory = storageService.findOrCreateStoredCategory.bind(storageService);
export const getUserGroups = storageService.getUserGroups.bind(storageService);
export const addStoredGroup = storageService.addStoredGroup.bind(storageService);
export const joinStoredGroup = storageService.joinStoredGroup.bind(storageService);
export const findGroupByCode = storageService.findGroupByCode.bind(storageService);
export const getAllUserFinancials = storageService.getAllUserFinancials.bind(storageService);
export const calculateNetWorth = storageService.calculateNetWorth.bind(storageService);
export const addCreditCard = storageService.addCreditCard.bind(storageService);
export const addLoan = storageService.addLoan.bind(storageService);
export const addInvestment = storageService.addInvestment.bind(storageService);
export const addInsurance = storageService.addInsurance.bind(storageService);
export const addProperty = storageService.addProperty.bind(storageService);
export const getPersonalTransactions = storageService.getPersonalTransactions.bind(storageService);
export const getGroupTransactions = storageService.getGroupTransactions.bind(storageService);
export const assignTransactionToGroup = storageService.assignTransactionToGroup.bind(storageService);
export const getTransactionsForBalanceCalculation = storageService.getTransactionsForBalanceCalculation.bind(storageService);
export const addFinancialAccount = storageService.addFinancialAccount.bind(storageService);
export const updateFinancialAccount = storageService.updateFinancialAccount.bind(storageService);
export const deleteFinancialAccount = storageService.deleteFinancialAccount.bind(storageService);
export const getFinancialAccounts = storageService.getFinancialAccounts.bind(storageService);
export const assignAccountToGroup = storageService.assignAccountToGroup.bind(storageService);
export const addRecurringPayment = storageService.addRecurringPayment.bind(storageService);
export const clearAllStoredData = storageService.clearAllStoredData.bind(storageService);
export const getCreditCards = storageService.getCreditCards.bind(storageService);
export const getLoans = storageService.getLoans.bind(storageService);
export const getInvestments = storageService.getInvestments.bind(storageService);
export const getInsurance = storageService.getInsurance.bind(storageService);
export const getProperties = storageService.getProperties.bind(storageService);
export const getRecurringPayments = storageService.getRecurringPayments.bind(storageService);