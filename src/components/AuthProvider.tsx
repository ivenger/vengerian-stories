
import { createContext, useContext, useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  session: Session | null;
  user: Session['user'] | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  error: string | null;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
  isAdmin: false,
  error: null,
});

export const useAuth = () => useContext(AuthContext);

// Version hash to force logout on application rebuilds
const APP_VERSION = Date.now().toString();
const LAST_VERSION_KEY = 'app_version';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const checkUserRole = async (userId: string) => {
    if (!userId) return false;
    
    try {
      console.log("Checking admin role for user:", userId);
      const { data, error } = await supabase.rpc('is_admin', { user_id: userId });
      
      if (error) {
        console.error("Error checking admin role:", error);
        return false;
      }
      
      console.log("Admin check result:", data);
      return Boolean(data); // Ensure we return a boolean
    } catch (err) {
      console.error("Failed to check user role:", err);
      return false;
    }
  };

  // Check if app was rebuilt and force logout if needed
  useEffect(() => {
    const storedVersion = localStorage.getItem(LAST_VERSION_KEY);
    const currentVersion = APP_VERSION;
    
    console.log("App version check - Stored:", storedVersion, "Current:", currentVersion);
    
    if (storedVersion && storedVersion !== currentVersion) {
      console.log("App version changed, forcing logout");
      supabase.auth.signOut().then(() => {
        console.log("User signed out due to app version change");
        localStorage.setItem(LAST_VERSION_KEY, currentVersion);
      });
    } else {
      localStorage.setItem(LAST_VERSION_KEY, currentVersion);
    }
  }, []);

  // Handle auth state changes and session management
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    console.log("Setting up auth state listener");
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state changed:", event);
        
        if (!isMounted) return;
        
        if (newSession?.user) {
          setSession(newSession);
          
          try {
            const adminStatus = await checkUserRole(newSession.user.id);
            if (isMounted) setIsAdmin(adminStatus);
          } catch (roleError) {
            console.error("Error checking admin status:", roleError);
            if (isMounted) setIsAdmin(false); // Default to non-admin on error
          }
        } else {
          setSession(null);
          setIsAdmin(false);
        }
        
        if (isMounted) setLoading(false);
        
        // Show toast for specific events
        if (event === 'SIGNED_IN') {
          toast({
            title: "Welcome back!",
            description: "You've successfully signed in.",
          });
        } else if (event === 'SIGNED_OUT') {
          toast({
            title: "Signed out",
            description: "You've been signed out successfully.",
          });
        }
      }
    );

    console.log("Checking for existing session");
    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session: currentSession }, error: sessionError }) => {
      if (!isMounted) return;
      
      if (sessionError) {
        console.error("Session error:", sessionError);
        setError("Failed to retrieve authentication session. Please check your network connection.");
        setLoading(false);
        return;
      }
      
      console.log("Current session:", currentSession ? "exists" : "none");
      setSession(currentSession);
      
      if (currentSession?.user) {
        try {
          const adminStatus = await checkUserRole(currentSession.user.id);
          if (isMounted) setIsAdmin(adminStatus);
        } catch (roleError) {
          console.error("Error checking initial admin status:", roleError);
          if (isMounted) setIsAdmin(false); // Default to non-admin on error
        }
      }
      
      if (isMounted) setLoading(false);
    }).catch(err => {
      if (isMounted) {
        console.error("Failed to get session:", err);
        setError("Connection error. Please check your network and try again.");
        setLoading(false);
      }
    });

    return () => {
      console.log("Cleaning up auth listener");
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [toast]);

  const signOut = async () => {
    try {
      console.log("Attempting to sign out");
      
      // Clear local state first for better UX (feels faster)
      setSession(null);
      setIsAdmin(false);
      
      // Then perform the actual signout operation
      const { error: signOutError } = await supabase.auth.signOut();
      
      if (signOutError) {
        console.error("Error signing out:", signOutError);
        toast({
          title: "Error",
          description: "Failed to sign out. Please try again.",
          variant: "destructive"
        });
      } else {
        console.log("Sign out successful");
        
        toast({
          title: "Signed out",
          description: "You've been signed out successfully.",
        });
      }
    } catch (err) {
      console.error("Sign out exception:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const value = {
    session,
    user: session?.user || null,
    loading,
    signOut,
    isAdmin,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
