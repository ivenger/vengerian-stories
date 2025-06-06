import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import type { Session } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config';
import { customStorage } from './storage';
import { createCustomFetch } from './fetch';
import { setupConnectionMonitoring, setupRealtimeForReadingHistory } from './realtime';

// Create the Supabase client
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: customStorage
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'apikey': SUPABASE_PUBLISHABLE_KEY,
      'x-client-info': `@supabase/js@latest`
    },
    fetch: createCustomFetch()
  }
});

// Add function to register auth change callbacks
export const registerAuthChangeCallback = (callback: (event: string, session: Session | null) => void) => {
  return supabase.auth.onAuthStateChange(callback);
};

// Set up auth state monitoring
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Supabase auth state changed:', event, session?.user?.email || 'no user');
});

// Initialize connection monitoring
setupConnectionMonitoring();

// Initialize realtime subscriptions
setupRealtimeForReadingHistory();
