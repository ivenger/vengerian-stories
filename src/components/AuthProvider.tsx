
import { ReactNode } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useAuthProvider } from "../hooks/useAuthProvider";
import React from "react";  // Required for the useContext call

export const useAuth = () => {
  // Import the context here so component consumers don't need to import it
  return React.useContext(AuthContext);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuthProvider();

  // Add log to see what the current admin status is
  console.log("AuthProvider - auth state:", { 
    isAuthenticated: !!auth.user,
    userEmail: auth.user?.email,
    isAdmin: auth.isAdmin
  });

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};
