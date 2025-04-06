
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://dvalgsvmkrqzwfcxvbxg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2YWxnc3Zta3JxendmY3h2YnhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwMjI1MjcsImV4cCI6MjA1NzU5ODUyN30.v2iTZuy6PwIorHwEyfFes0fcM9gZtUyTuHCHTkCupuE";

// Create a custom fetch function with retry logic for 500 errors
const fetchWithRetry = async (url: string, options: any) => {
  const MAX_RETRIES = 3;
  let retries = 0;
  let lastError;

  while (retries < MAX_RETRIES) {
    try {
      const response = await fetch(url, options);
      if (response.status === 500) {
        // If it's a 500 error, retry after a delay
        retries++;
        lastError = new Error(`Server error (500) on attempt ${retries}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * retries)); // Exponential backoff
        continue;
      }
      return response;
    } catch (error) {
      retries++;
      lastError = error;
      if (retries >= MAX_RETRIES) break;
      await new Promise(resolve => setTimeout(resolve, 1000 * retries));
    }
  }

  throw lastError || new Error(`Failed after ${MAX_RETRIES} retries`);
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'vengerian-stories-auth',
    storage: window.localStorage
  },
  global: {
    fetch: fetchWithRetry
  },
  // Add better error logging
  debug: process.env.NODE_ENV === 'development'
});
