// Storage configuration
export const STORAGE_CONFIG = {
  // Set to true to use localStorage for data, false to use Supabase for data
  // Note: Authentication ALWAYS uses Supabase regardless of this setting
  // Now using Supabase for all data storage
  USE_LOCAL_STORAGE: false,
  
  // Supabase is ready and configured
  SUPABASE_READY: true
};

// Helper function to switch storage modes
export const switchToSupabaseMode = () => {
  console.warn('To switch to Supabase mode, change USE_LOCAL_STORAGE to false in src/config/storage.ts');
  console.warn('Make sure Supabase database and RLS policies are properly configured before switching!');
  console.log('Authentication will continue to use Supabase in both modes.');
};

export const switchToLocalStorageMode = () => {
  console.log('Already in local storage mode. Data is stored in browser localStorage.');
  console.log('Authentication still uses Supabase for login/signup/verification.');
};