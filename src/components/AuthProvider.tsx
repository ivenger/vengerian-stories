
import { ReactNode } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useAuth as useAuthHook } from "../hooks/useAuth";
import React from "react";  // Required for the useContext call

// Rename this function to useAuthContext to avoid naming conflicts
export const useAuthContext = () => {
  // Import the context here so component consumers don't need to import it
  return React.useContext(AuthContext);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuthHook();

  // Add log to see what the current admin status is
  console.log("AuthProvider - auth state:", { 
    isAuthenticated: !!auth.user,
    userEmail: auth.user?.email,
    isAdmin: auth.isAdmin
  });

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};
