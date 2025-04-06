
import { ReactNode } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useAuth } from "../hooks/useAuth";
import React from "react";

export const useAuthContext = () => {
  return React.useContext(AuthContext);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuth();

  console.log("AuthProvider - auth state:", { 
    isAuthenticated: !!auth.user,
    userEmail: auth.user?.email,
    isAdmin: auth.isAdmin,
    initialized: auth.authInitialized
  });

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};
