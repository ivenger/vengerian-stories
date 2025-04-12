
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://dvalgsvmkrqzwfcxvbxg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2YWxnc3Zta3JxendmY3h2YnhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwMjI1MjcsImV4cCI6MjA1NzU5ODUyN30.v2iTZuy6PwIorHwEyfFes0fcM9gZtUyTuHCHTkCupuE";

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
    // Set reasonable timeouts for all requests
    fetch: (url, options) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      return fetch(url, {
        ...options,
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId));
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
