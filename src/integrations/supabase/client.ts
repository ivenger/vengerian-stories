import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://dvalgsvmkrqzwfcxvbxg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2YWxnc3Zta3JxendmY3h2YnhnIiwicm9zZSI6ImFub24iLCJpYXQiOjE3NDIwMjI1MjcsImV4cCI6MjA1NzU5ODUyN30.v2iTZuy6PwIorHwEyfFes0fcM9gZtUyTuHCHTkCupuE";

const GLOBAL_TIMEOUT_MS = 15000; 
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
    },
  },
  global: {
    fetch: async (url, options) => {
      const requestId = Math.random().toString(36).substring(2, 10);
      const controller = new AbortController();
      const signal = options?.signal || null;

      if (signal) {
        if (signal.aborted) {
          controller.abort();
        } else {
          signal.addEventListener('abort', () => controller.abort());
        }
      }

      const headers = {
        'apikey': SUPABASE_PUBLISHABLE_KEY,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        ...options?.headers,
      };

      // Dynamically set Authorization header based on session
      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.access_token) {
        headers['Authorization'] = `Bearer ${session.session.access_token}`;
      }

      if (DEBUG_REQUESTS) {
        console.log(`[${new Date().toISOString()}] Supabase request ${requestId} headers:`, headers);
      }

      const timeoutId = setTimeout(() => {
        console.log(`Global fetch timeout (${GLOBAL_TIMEOUT_MS}ms) exceeded for URL: ${url}`);
        controller.abort();
      }, GLOBAL_TIMEOUT_MS);

      return fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      })
        .then(response => {
          clearTimeout(timeoutId);
          return response;
        })
        .catch(error => {
          clearTimeout(timeoutId);
          throw error;
        });
    },
  },
});

supabase.auth.onAuthStateChange((event, session) => {
  console.log('Supabase auth state changed:', event, session?.user?.email || 'no user');
});
