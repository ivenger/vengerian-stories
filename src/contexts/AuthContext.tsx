
import { createContext } from "react";
import { Session } from "@supabase/supabase-js";

export type AuthContextType = {
  session: Session | null;
  user: Session['user'] | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  error: string | null;
  refreshSession: () => Promise<boolean>;
  authInitialized: boolean;
};

export const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
  isAdmin: false,
  error: null,
  refreshSession: async () => false,
  authInitialized: false,
});
