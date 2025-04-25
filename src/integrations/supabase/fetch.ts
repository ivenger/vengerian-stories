
import { SUPABASE_PUBLISHABLE_KEY, DEBUG_REQUESTS, GLOBAL_TIMEOUT_MS } from './config';

export const createCustomFetch = () => {
  return async (url: URL | RequestInfo, options?: RequestInit) => {
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
    
    if (DEBUG_REQUESTS) {
      console.log(`[${new Date().toISOString()}] Supabase request ${requestId} starting: ${options?.method || 'GET'} ${url.toString()}`);
    }
    
    const timeoutId = setTimeout(() => {
      console.log(`Global fetch timeout (${GLOBAL_TIMEOUT_MS}ms) exceeded for URL: ${url}`);
      controller.abort();
    }, GLOBAL_TIMEOUT_MS);
    
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
    
    const headers = {
      'apikey': SUPABASE_PUBLISHABLE_KEY,
      'Authorization': `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      'Cache-Control': 'no-cache',
      ...authHeaders,
      ...options?.headers,
    };
    
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
  };
};
