import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';
import { STORAGE_CONFIG } from '@/config/storage';

// Import both storage implementations
import { 
  getUserGroups as getSupabaseUserGroups, 
  addStoredGroup as addSupabaseGroup, 
  joinStoredGroup as joinSupabaseGroup,
  findGroupByCode as findSupabaseGroupByCode, 
  getStoredCategories as getSupabaseCategories,
  addStoredCategory as addSupabaseCategory,
  type StoredGroup as SupabaseStoredGroup 
} from '@/utils/supabaseDataStorage';

import {
  getUserGroups as getLocalUserGroups,
  addStoredGroup as addLocalGroup,
  joinStoredGroup as joinLocalGroup,
  findGroupByCode as findLocalGroupByCode,
  getStoredCategories as getLocalCategories,
  addStoredCategory as addLocalCategory,
  type StoredGroup as LocalStoredGroup
} from '@/utils/dataStorage';

type StoredGroup = SupabaseStoredGroup | LocalStoredGroup;

type ExpenseGroup = Tables<'expense_groups'>;
type UserProfile = Tables<'user_profiles'>;
type Category = Tables<'categories'>;

interface AppContextType {
  // User & Profile
  user: any;
  userProfile: UserProfile | null;
  
  // Groups
  currentGroup: StoredGroup | null;
  userGroups: StoredGroup[];
  isPersonalMode: boolean;
  
  // Categories
  categories: any[];
  
  // Data version for triggering updates
  dataVersion: number;
  
  // Actions
  switchToPersonal: () => void;
  switchToGroup: (groupId: string) => void;
  createGroup: (name: string, description?: string) => Promise<StoredGroup | null>;
  joinGroup: (groupCode: string) => Promise<boolean>;
  addCategory: (name: string, color: string, icon?: string) => Promise<any>;
  refreshCategories: () => Promise<void>;
  refreshGroups: () => Promise<void>;
  refreshData: () => void;
  
  // Loading states
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentGroup, setCurrentGroup] = useState<StoredGroup | null>(null);
  const [userGroups, setUserGroups] = useState<StoredGroup[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isPersonalMode, setIsPersonalMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [dataVersion, setDataVersion] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      refreshGroups();
      refreshCategories();
    }
  }, [user]);

  const checkUser = async () => {
    // Always use Supabase authentication regardless of storage mode
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    setLoading(false);
  };

  const fetchUserProfile = async () => {
    if (!user) return;

    if (STORAGE_CONFIG.USE_LOCAL_STORAGE) {
      // For local storage, create a mock profile but use real user data from auth
      const mockProfile = {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        default_group_id: null,
        avatar_url: null,
        preferences: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setUserProfile(mockProfile);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setUserProfile(data);
        if (data.default_group_id) {
          const { data: group } = await supabase
            .from('expense_groups')
            .select('*')
            .eq('id', data.default_group_id)
            .single();
          
          if (group) {
            setCurrentGroup(group);
            setIsPersonalMode(false);
          }
        }
      } else {
        // Create user profile if it doesn't exist
        const { data: newProfile } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            email: user.email!,
            full_name: user.user_metadata?.full_name || null,
          })
          .select()
          .single();
        
        setUserProfile(newProfile);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const refreshGroups = async () => {
    if (!user) return;

    try {
      // Get user's groups (both owned and joined)
      const userGroups = STORAGE_CONFIG.USE_LOCAL_STORAGE 
        ? getLocalUserGroups(user.id)
        : await getSupabaseUserGroups(user.id);
      setUserGroups(userGroups);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const refreshCategories = async () => {
    if (!user) return;

    try {
      // Get stored categories
      const storedCategories = STORAGE_CONFIG.USE_LOCAL_STORAGE 
        ? getLocalCategories()
        : await getSupabaseCategories();
      setCategories(storedCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const switchToPersonal = () => {
    setIsPersonalMode(true);
    setCurrentGroup(null);
    refreshCategories();
  };

  const switchToGroup = (groupId: string) => {
    const group = userGroups.find(g => g.id === groupId);
    if (group) {
      setCurrentGroup(group);
      setIsPersonalMode(false);
      refreshCategories();
    }
  };

  const createGroup = async (name: string, description?: string): Promise<StoredGroup | null> => {
    if (!user) {
      console.error('No user found for group creation');
      toast({
        title: "Error",
        description: "You must be logged in to create a group",
        variant: "destructive",
      });
      return null;
    }

    console.log('Creating group:', name, 'for user:', user.id);

    try {
      const newGroup = STORAGE_CONFIG.USE_LOCAL_STORAGE
        ? addLocalGroup({
            name,
            description,
            owner_id: user.id
          })
        : await addSupabaseGroup({
            name,
            description,
            owner_id: user.id
          });

      if (newGroup) {
        await refreshGroups();
        toast({
          title: "Success",
          description: `Group "${name}" created successfully! Code: ${newGroup.group_code}`,
        });
        return newGroup;
      } else {
        throw new Error('Group creation returned null');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Error",
        description: `Failed to create group: ${errorMessage}`,
        variant: "destructive",
      });
      return null;
    }
  };

  const joinGroup = async (groupCode: string): Promise<boolean> => {
    if (!user || !user.email) return false;

    try {
      const success = STORAGE_CONFIG.USE_LOCAL_STORAGE
        ? joinLocalGroup(groupCode, user.id)
        : await joinSupabaseGroup(groupCode, user.id, user.email);
      
      if (!success) {
        const group = STORAGE_CONFIG.USE_LOCAL_STORAGE
          ? findLocalGroupByCode(groupCode)
          : await findSupabaseGroupByCode(groupCode);
        if (!group) {
          toast({
            title: "Error",
            description: "Invalid group code",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Info",
            description: "You are already a member of this group",
          });
        }
        return false;
      }

      const group = STORAGE_CONFIG.USE_LOCAL_STORAGE
        ? findLocalGroupByCode(groupCode)
        : await findSupabaseGroupByCode(groupCode);
      if (group) {
        setCurrentGroup(group);
        setIsPersonalMode(false);
        await refreshGroups();
        
        toast({
          title: "Success",
          description: `Joined group "${group.name}" successfully!`,
        });
      }

      return true;
    } catch (error) {
      console.error('Error joining group:', error);
      toast({
        title: "Error",
        description: "Failed to join group",
        variant: "destructive",
      });
      return false;
    }
  };

  const addCategory = async (name: string, color: string, icon?: string): Promise<any> => {
    if (!user) return null;

    try {
      const newCategory = STORAGE_CONFIG.USE_LOCAL_STORAGE
        ? addLocalCategory({
            name,
            color,
            icon: icon || 'circle'
          })
        : await addSupabaseCategory({
            name,
            color,
            icon: icon || 'circle'
          });

      if (newCategory) {
        await refreshCategories();
        toast({
          title: "Success",
          description: `Category "${name}" added successfully!`,
        });
      }

      return newCategory;
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: "Error",
        description: "Failed to add category",
        variant: "destructive",
      });
      return null;
    }
  };

  const refreshData = () => {
    // Trigger a re-render by incrementing data version
    // This will cause all components to refresh their data
    setDataVersion(prev => prev + 1);
    if (user) {
      refreshGroups();
      refreshCategories();
    }
  };

  const value: AppContextType = {
    user,
    userProfile,
    currentGroup,
    userGroups,
    isPersonalMode,
    categories,
    dataVersion,
    switchToPersonal,
    switchToGroup,
    createGroup,
    joinGroup,
    addCategory,
    refreshCategories,
    refreshGroups,
    refreshData,
    loading,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};