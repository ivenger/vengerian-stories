import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseSupabaseRequestOptions {
  maxAttempts?: number;
  onError?: (error: any) => void;
  onSuccess?: () => void;
}

export function useSupabaseRequest<T>(
  operation: () => Promise<T>,
  options: UseSupabaseRequestOptions = {}
) {
  const {
    maxAttempts = 3,
    onError,
    onSuccess
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const isMountedRef = useRef(true);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  const validateSession = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const { data, error } = await supabase.auth.refreshSession();
        if (error || !data.session) {
          throw new Error("Session expired");
        }
      }
      return true;
    } catch (err) {
      console.error("Session validation failed:", err);
      return false;
    }
  }, []);

  const execute = useCallback(async (forceRefresh = false) => {
    if (!isMountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      // Validate session before proceeding
      const isValid = await validateSession();
      if (!isValid) {
        throw new Error("Session expired");
      }

      const result = await operation();
      
      if (!isMountedRef.current) return;

      setData(result);
      setRetryCount(0);
      onSuccess?.();
      return result;
    } catch (error: any) {
      console.error("Operation failed:", error);
      
      if (!isMountedRef.current) return;

      if (error.message === "Session expired") {
        setError("Your session has expired. Please refresh the page to continue.");
      } else if (retryCount < maxAttempts - 1) {
        // Implement exponential backoff for retries
        const delay = Math.min(1000 * Math.pow(2, retryCount) + Math.random() * 1000, 10000);
        console.log(`Retrying in ${delay}ms (attempt ${retryCount + 1})`);
        
        setRetryCount(prev => prev + 1);
        retryTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            execute(true);
          }
        }, delay);
      } else {
        const errorMessage = error.message || "Operation failed. Please try again later.";
        setError(errorMessage);
        onError?.(error);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [operation, retryCount, maxAttempts, validateSession, onSuccess, onError]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setRetryCount(0);
    setLoading(false);
  }, []);

  return {
    execute,
    data,
    loading,
    error,
    reset,
    retryCount
  };
}