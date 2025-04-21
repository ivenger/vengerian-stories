
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
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'apikey': SUPABASE_PUBLISHABLE_KEY,
      'x-client-info': `@supabase/js@latest`,
      'Content-Type': 'application/json' // Explicitly set Content-Type header for all requests
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
        'Content-Type': 'application/json', // Always set Content-Type header
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
