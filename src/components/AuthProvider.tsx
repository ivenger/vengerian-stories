
import { ReactNode } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useAuthProvider } from "../hooks/useAuthProvider";
import React from "react";  // Required for the useContext call
import { useSessionRefresh } from "../hooks/filters/useSessionRefresh";

export const useAuth = () => {
  // Import the context here so component consumers don't need to import it
  return React.useContext(AuthContext);
};

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
