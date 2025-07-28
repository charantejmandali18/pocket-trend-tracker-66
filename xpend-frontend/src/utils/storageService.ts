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

  async addStoredTransaction(transaction: any) {
    return this.useLocalStorage 
      ? LocalStorage.addStoredTransaction(transaction)
      : await SupabaseStorage.addStoredTransaction(transaction);
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

  async getGroupTransactions(groupId: string) {
    return this.useLocalStorage
      ? LocalStorage.getGroupTransactions(groupId)
      : await SupabaseStorage.getGroupTransactions(groupId);
  }

  // Clear data method
  async clearAllStoredData() {
    return this.useLocalStorage
      ? LocalStorage.clearAllStoredData()
      : await SupabaseStorage.clearAllStoredData();
  }

  // Additional local storage methods that might not exist in Supabase
  async addFinancialAccount(account: any) {
    console.log('StorageService.addFinancialAccount called:', { useLocalStorage: this.useLocalStorage, account });
    if (this.useLocalStorage) {
      const result = LocalStorage.addFinancialAccount(account);
      console.log('LocalStorage.addFinancialAccount result:', result);
      return result;
    }
    // Fallback for Supabase - could implement or return mock
    throw new Error('addFinancialAccount not implemented for Supabase storage');
  }

  async updateFinancialAccount(accountId: string, updates: any) {
    if (this.useLocalStorage) {
      return LocalStorage.updateFinancialAccount(accountId, updates);
    }
    throw new Error('updateFinancialAccount not implemented for Supabase storage');
  }

  async deleteFinancialAccount(accountId: string) {
    if (this.useLocalStorage) {
      return LocalStorage.deleteFinancialAccount(accountId);
    }
    throw new Error('deleteFinancialAccount not implemented for Supabase storage');
  }

  async getFinancialAccounts() {
    if (this.useLocalStorage) {
      return LocalStorage.getFinancialAccounts();
    }
    // Fallback for Supabase
    return [];
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
export const getStoredTransactions = (...args: any[]) => storageService.getStoredTransactions(...args);
export const addStoredTransaction = (...args: any[]) => storageService.addStoredTransaction(...args);
export const updateStoredTransaction = (...args: any[]) => storageService.updateStoredTransaction(...args);
export const deleteStoredTransaction = (...args: any[]) => storageService.deleteStoredTransaction(...args);
export const getStoredCategories = (...args: any[]) => storageService.getStoredCategories(...args);
export const addStoredCategory = (...args: any[]) => storageService.addStoredCategory(...args);
export const findOrCreateStoredCategory = (...args: any[]) => storageService.findOrCreateStoredCategory(...args);
export const getUserGroups = (...args: any[]) => storageService.getUserGroups(...args);
export const addStoredGroup = (...args: any[]) => storageService.addStoredGroup(...args);
export const joinStoredGroup = (...args: any[]) => storageService.joinStoredGroup(...args);
export const findGroupByCode = (...args: any[]) => storageService.findGroupByCode(...args);
export const getAllUserFinancials = (...args: any[]) => storageService.getAllUserFinancials(...args);
export const calculateNetWorth = (...args: any[]) => storageService.calculateNetWorth(...args);
export const addCreditCard = (...args: any[]) => storageService.addCreditCard(...args);
export const addLoan = (...args: any[]) => storageService.addLoan(...args);
export const addInvestment = (...args: any[]) => storageService.addInvestment(...args);
export const addInsurance = (...args: any[]) => storageService.addInsurance(...args);
export const addProperty = (...args: any[]) => storageService.addProperty(...args);
export const addRecurringPayment = (...args: any[]) => storageService.addRecurringPayment(...args);
export const getPersonalTransactions = (...args: any[]) => storageService.getPersonalTransactions(...args);
export const getGroupTransactions = (...args: any[]) => storageService.getGroupTransactions(...args);
export const clearAllStoredData = (...args: any[]) => storageService.clearAllStoredData(...args);
export const addFinancialAccount = (...args: any[]) => storageService.addFinancialAccount(...args);
export const updateFinancialAccount = (...args: any[]) => storageService.updateFinancialAccount(...args);
export const deleteFinancialAccount = (...args: any[]) => storageService.deleteFinancialAccount(...args);
export const getFinancialAccounts = (...args: any[]) => storageService.getFinancialAccounts(...args);
export const getCreditCards = (...args: any[]) => storageService.getCreditCards(...args);
export const getLoans = (...args: any[]) => storageService.getLoans(...args);
export const getInvestments = (...args: any[]) => storageService.getInvestments(...args);
export const getInsurance = (...args: any[]) => storageService.getInsurance(...args);
export const getProperties = (...args: any[]) => storageService.getProperties(...args);
export const getRecurringPayments = (...args: any[]) => storageService.getRecurringPayments(...args);