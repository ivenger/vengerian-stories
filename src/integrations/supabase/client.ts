
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://dvalgsvmkrqzwfcxvbxg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2YWxnc3Zta3JxendmY3h2YnhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwMjI1MjcsImV4cCI6MjA1NzU5ODUyN30.v2iTZuy6PwIorHwEyfFes0fcM9gZtUyTuHCHTkCupuE";

// Set reasonable global timeout - longer than individual query timeouts
const GLOBAL_TIMEOUT_MS = 15000; 
// Log requests to debug authentication and network issues
const DEBUG_REQUESTS = true;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: {
      getItem: (key: string) => {
        try {
          return Promise.resolve(localStorage.getItem(key));
        } catch (error) {
          console.error('Error accessing localStorage:', error);
          return Promise.resolve(null);
        }
      },
      setItem: (key: string, value: string) => {
        try {
          localStorage.setItem(key, value);
          return Promise.resolve();
        } catch (error) {
          console.error('Error setting localStorage:', error);
          return Promise.resolve();
        }
      },
      removeItem: (key: string) => {
        try {
          localStorage.removeItem(key);
          return Promise.resolve();
        } catch (error) {
          console.error('Error removing from localStorage:', error);
          return Promise.resolve();
        }
      },
    }
  },
  global: {
    headers: {
      'apikey': SUPABASE_PUBLISHABLE_KEY,
      'x-client-info': `@supabase/js@latest`
    },
    fetch: (url, options) => {
      const requestId = Math.random().toString(36).substring(2, 10);
      
      // Create a controller that will abort the fetch after GLOBAL_TIMEOUT_MS
      const controller = new AbortController();
      const signal = options?.signal || null;
      
      // If there's an existing signal, listen to it to propagate abort
      if (signal) {
        if (signal.aborted) {
          controller.abort();
        } else {
          signal.addEventListener('abort', () => controller.abort());
        }
      }
      
      if (DEBUG_REQUESTS) {
        console.log(`[${new Date().toISOString()}] Supabase request ${requestId} starting: ${options?.method || 'GET'} ${url.toString()}`);
      }
      
      // Set our own timeout
      const timeoutId = setTimeout(() => {
        console.log(`Global fetch timeout (${GLOBAL_TIMEOUT_MS}ms) exceeded for URL: ${url}`);
        controller.abort();
      }, GLOBAL_TIMEOUT_MS);
      
      // Ensure default headers are set
      const headers = {
        'apikey': SUPABASE_PUBLISHABLE_KEY,
        'Authorization': `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        'Cache-Control': 'no-cache',
        ...options?.headers,
      };
      
      if (DEBUG_REQUESTS) {
        console.log(`[${new Date().toISOString()}] Supabase request ${requestId} headers:`, headers);
      }
      
      return fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      })
      .then(response => {
        if (DEBUG_REQUESTS) {
          console.log(`[${new Date().toISOString()}] Supabase request ${requestId} completed with status: ${response.status}`);
        }
        return response;
      })
      .catch(error => {
        if (DEBUG_REQUESTS) {
          console.log(`[${new Date().toISOString()}] Supabase request ${requestId} failed:`, error);
        }
        throw error;
      })
      .finally(() => {
        clearTimeout(timeoutId);
      });
    }
  }
});

// Add a helper to get the URL
export const getSupabaseUrl = () => SUPABASE_URL;

// Add connection state monitoring
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Supabase auth state changed:', event, session?.user?.email || 'no user');
});

// Simple connection monitoring via auth events instead of realtime channels
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Browser went online, checking auth session...');
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        console.log('Session found, resuming connection');
        supabase.auth.refreshSession();
      }
    });
  });
  
  window.addEventListener('offline', () => {
    console.log('Browser went offline, connection to Supabase may be interrupted');
  });
}
