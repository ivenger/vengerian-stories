
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://dvalgsvmkrqzwfcxvbxg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2YWxnc3Zta3JxendmY3h2YnhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwMjI1MjcsImV4cCI6MjA1NzU5ODUyN30.v2iTZuy6PwIorHwEyfFes0fcM9gZtUyTuHCHTkCupuE";

// Set reasonable global timeout - shorter than before to avoid blocking
const GLOBAL_TIMEOUT_MS = 10000; 
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
          const item = localStorage.getItem(key);
          console.log(`Storage getItem: ${key} => ${item ? "found" : "not found"}`);
          return Promise.resolve(item);
        } catch (error) {
          console.error('Error accessing localStorage:', error);
          return Promise.resolve(null);
        }
      },
      setItem: (key: string, value: string) => {
        try {
          localStorage.setItem(key, value);
          console.log(`Storage setItem: ${key} => saved`);
          return Promise.resolve();
        } catch (error) {
          console.error('Error setting localStorage:', error);
          return Promise.resolve();
        }
      },
      removeItem: (key: string) => {
        try {
          localStorage.removeItem(key);
          console.log(`Storage removeItem: ${key} => removed`);
          return Promise.resolve();
        } catch (error) {
          console.error('Error removing from localStorage:', error);
          return Promise.resolve();
        }
      },
    }
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
    fetch: async (url, options) => {
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
      
      // Get current session token directly from localStorage for more reliability
      let authHeaders = {};
      try {
        const tokenStr = localStorage.getItem('sb-dvalgsvmkrqzwfcxvbxg-auth-token');
        let accessToken = null;
        
        if (tokenStr) {
          try {
            const tokenData = JSON.parse(tokenStr);
            accessToken = tokenData?.access_token;
          } catch (e) {
            console.error("Error parsing auth token:", e);
          }
        }
        
        if (accessToken) {
          authHeaders = {
            'Authorization': `Bearer ${accessToken}`
          };
          if (DEBUG_REQUESTS) {
            console.log(`[${new Date().toISOString()}] Supabase request ${requestId} using local storage auth token`);
          }
        } else {
          if (DEBUG_REQUESTS) {
            console.log(`[${new Date().toISOString()}] Supabase request ${requestId} no local storage token, using anon key`);
          }
        }
      } catch (e) {
        console.error(`[${new Date().toISOString()}] Error getting auth token from storage:`, e);
      }
      
      // Ensure default headers are set
      const headers = {
        'apikey': SUPABASE_PUBLISHABLE_KEY,
        'Authorization': `Bearer ${SUPABASE_PUBLISHABLE_KEY}`, // Default to anon key
        'Cache-Control': 'no-cache',
        ...authHeaders, // Add auth headers if present (will override default Authorization)
        ...options?.headers,
      };
      
      // Ensure Content-Type is set for methods with a body
      const method = (options?.method || 'GET').toUpperCase();
      if (['POST', 'PUT', 'PATCH'].includes(method) &&
        !Object.keys(headers).some(h => h.toLowerCase() === 'content-type')) {
        headers['Content-Type'] = 'application/json';
      }
      
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

// Add connection state monitoring
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Supabase auth state changed:', event, session?.user?.email || 'no user');
});

// Setup auto-reconnect for realtime
let isReconnecting = false;

// Create a dedicated channel for connection status
const connectionStatusChannel = supabase.channel('connection-status');

// Listen for connection status changes
connectionStatusChannel
  .on('system', { event: 'disconnect' }, () => {
    console.log('Lost connection to Supabase');
    if (!isReconnecting) {
      isReconnecting = true;
      setTimeout(async () => {
        try {
          // Attempt to reconnect the channel
          await connectionStatusChannel.subscribe();
          console.log('Reconnected to Supabase');
        } catch (error) {
          console.error('Failed to reconnect:', error);
        } finally {
          isReconnecting = false;
        }
      }, 1000);
    }
  })
  .subscribe();

// Enable realtime on the reading_history table for live updates
const setupRealtimeForReadingHistory = async () => {
  try {
    // Create a channel specific for reading_history changes
    const channel = supabase.channel('reading_history_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'reading_history',
        },
        (payload) => {
          console.log(`[${new Date().toISOString()}] Reading history realtime update:`, payload);
        }
      )
      .subscribe();

    console.log(`[${new Date().toISOString()}] Setup realtime subscription for reading_history table`);
    return channel;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error setting up realtime for reading_history:`, error);
    return null;
  }
};

// Call this function to set up realtime for reading_history
setupRealtimeForReadingHistory();
