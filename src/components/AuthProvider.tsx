
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
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
  isAdmin: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  const checkUserRole = async (userId: string) => {
    if (!userId) return false;
    
    try {
      const { data, error } = await supabase.rpc('is_admin', { user_id: userId });
      
      if (error) {
        console.error("Error checking admin role:", error);
        return false;
      }
      
      return data || false;
    } catch (err) {
      console.error("Failed to check user role:", err);
      return false;
    }
  };

  useEffect(() => {
    const setupAuth = async () => {
      try {
        // First check for existing session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        
        if (currentSession?.user) {
          const adminStatus = await checkUserRole(currentSession.user.id);
          setIsAdmin(adminStatus);
        }
      } catch (error) {
        console.error("Error setting up auth:", error);
      } finally {
        setLoading(false);
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state changed:", event);
        setSession(newSession);
        
        if (newSession?.user) {
          const adminStatus = await checkUserRole(newSession.user.id);
          setIsAdmin(adminStatus);
        } else {
          setIsAdmin(false);
        }
        
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
        } else if (event === 'PASSWORD_RECOVERY') {
          toast({
            title: "Password Recovery",
            description: "Please check your email for reset instructions.",
          });
        } else if (event === 'USER_UPDATED') {
          toast({
            title: "Profile Updated",
            description: "Your profile has been updated successfully.",
          });
        }
      }
    );

    setupAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      console.error("Error during sign out:", error.message);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
