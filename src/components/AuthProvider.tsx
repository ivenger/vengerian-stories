
import { ReactNode } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useAuthProvider } from "../hooks/useAuthProvider";

export const useAuth = () => {
  // Import the context here so component consumers don't need to import it
  return React.useContext(AuthContext);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuthProvider();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

import React from "react";  // Required for the useContext call
