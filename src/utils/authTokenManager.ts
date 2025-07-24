import { validateSession } from './security';
import { supabase } from '@/integrations/supabase/client';

// Centralized token management
export class AuthTokenManager {
  private static readonly TOKEN_KEY = 'sb-dvalgsvmkrqzwfcxvbxg-auth-token';
  
  static getStoredToken(): string | null {
    try {
      console.log('AuthTokenManager: Retrieving stored token');
      const token = localStorage.getItem(this.TOKEN_KEY);
      
      if (!token) {
        console.log('AuthTokenManager: No token found in storage');
        return null;
      }
      
      // Parse and validate token structure
      const parsedToken = JSON.parse(token);
      if (!parsedToken || !parsedToken.access_token) {
        console.warn('AuthTokenManager: Invalid token structure found');
        this.clearToken();
        return null;
      }
      
      console.log('AuthTokenManager: Valid token found');
      return parsedToken.access_token;
    } catch (error) {
      console.error('AuthTokenManager: Error retrieving token:', error);
      this.clearToken();
      return null;
    }
  }
  
  static async validateCurrentSession(): Promise<boolean> {
    try {
      console.log('AuthTokenManager: Validating current session');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('AuthTokenManager: Session validation error:', error);
        return false;
      }
      
      const isValid = validateSession(session);
      console.log('AuthTokenManager: Session validation result:', isValid);
      
      if (!isValid) {
        console.log('AuthTokenManager: Session invalid, clearing token');
        this.clearToken();
      }
      
      return isValid;
    } catch (error) {
      console.error('AuthTokenManager: Session validation failed:', error);
      return false;
    }
  }
  
  static clearToken(): void {
    console.log('AuthTokenManager: Clearing stored token');
    try {
      localStorage.removeItem(this.TOKEN_KEY);
    } catch (error) {
      console.error('AuthTokenManager: Error clearing token:', error);
    }
  }
  
  static async refreshIfNeeded(): Promise<boolean> {
    try {
      console.log('AuthTokenManager: Checking if token refresh is needed');
      
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        console.log('AuthTokenManager: No valid session for refresh');
        return false;
      }
      
      // Check if token expires within 5 minutes
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = session.expires_at || 0;
      const shouldRefresh = (expiresAt - now) < 300; // 5 minutes
      
      if (shouldRefresh) {
        console.log('AuthTokenManager: Refreshing token');
        const { data, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('AuthTokenManager: Token refresh failed:', refreshError);
          return false;
        }
        
        console.log('AuthTokenManager: Token refreshed successfully');
        return true;
      }
      
      return true;
    } catch (error) {
      console.error('AuthTokenManager: Error during token refresh:', error);
      return false;
    }
  }
}