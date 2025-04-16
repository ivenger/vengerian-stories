
import { ReactNode } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useAuthProvider } from "../hooks/useAuthProvider";
import { useSessionRefresh } from "../hooks/filters/useSessionRefresh";

console.log('AuthProvider - Session in localStorage:', localStorage.getItem('supabase.auth.token'));

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuthProvider();
  // Initialize session refresh mechanism at the auth provider level
  useSessionRefresh();

  console.log("AuthProvider - auth state:", { 
    isAuthenticated: !!auth.user,
    userEmail: auth.user?.email,
    isAdmin: auth.isAdmin
  });

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};
