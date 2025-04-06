import React, { createContext, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useAuth } from '@/hooks/useAuth';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  userRoles: string[];
  hasRole: (role: string) => boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<boolean>;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

if (!success) {
  setSession(null);
  setUser(null);
  setUserRoles([]);
  toast({
    title: 'Session expired',
    description: 'Please sign in again.',
    variant: 'destructive',
  });
}

catch (err: any) {
  console.error('Sign in failed:', err);
  toast({
    title: 'Sign in failed',
    description: err.message || 'An unexpected error occurred. Please try again.',
    variant: 'destructive',
  });
  throw err;
}

if (error) {
  toast({
    title: 'Error',
    description: 'Failed to sign out. Please try again.',
    variant: 'destructive',
  });
  return false;
}
