
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
  }
});

// Add connection state monitoring
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Supabase auth state changed:', event, session?.user?.email || 'no user');
});

// Setup auto-reconnect for realtime
let isReconnecting = false;

// Use the channel API instead of the deprecated realtime.on method
const channel = supabase.channel('connection_status');

channel
  .on('presence', { event: 'sync' }, () => {
    console.log('Connected to Supabase realtime');
  })
  .on('presence', { event: 'join' }, () => {
    console.log('Joined Supabase realtime channel');
  })
  .on('presence', { event: 'leave' }, () => {
    console.log('Left Supabase realtime channel');
    
    if (!isReconnecting) {
      isReconnecting = true;
      setTimeout(async () => {
        try {
          await channel.subscribe();
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
