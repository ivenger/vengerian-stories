import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://dvalgsvmkrqzwfcxvbxg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2YWxnc3Zta3JxendmY3h2YnhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwMjI1MjcsImV4cCI6MjA1NzU5ODUyN30.v2iTZuy6PwIorHwEyfFes0fcM9gZtUyTuHCHTkCupuE";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'vengerian-stories-auth',
    storage: {
      getItem: (key) => {
        const value = localStorage.getItem(key);
        console.log(`[${new Date().toISOString()}] Storage.getItem: ${key} =`, value);
        return value;
      },
      setItem: (key, value) => {
        console.log(`[${new Date().toISOString()}] Storage.setItem: ${key} =`, value);
        localStorage.setItem(key, value);
      },
      removeItem: (key) => {
        console.log(`[${new Date().toISOString()}] Storage.removeItem: ${key}`);
        localStorage.removeItem(key);
      }
    }
  }
});

console.log(`[${new Date().toISOString()}] Supabase client initialized with persistSession and autoRefreshToken.`);