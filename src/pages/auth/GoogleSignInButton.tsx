
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export interface GoogleSignInButtonProps {
  onError: (message: string) => void;
  retryCount: number;
  setRetryCount: (count: number | ((prev: number) => number)) => void;
}

export const GoogleSignInButton = ({ 
  onError, 
  retryCount, 
  setRetryCount 
}: GoogleSignInButtonProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      
      console.log(`Starting Google OAuth signin (attempt ${retryCount + 1}), redirecting to:`, window.location.origin);
      
      const { error, data } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        console.error("Google OAuth Error:", error);
        onError(error.message);
        throw error;
      }
      
      console.log("OAuth flow initiated successfully:", data);
      toast({
        title: "Redirecting to Google",
        description: "You'll be redirected to Google to continue sign-in",
      });
    } catch (error: any) {
      console.error("Google OAuth Error:", error);
      
      let errorMessage = error.message || "Failed to sign in with Google";
      
      // Check for specific network errors
      if (error.message?.includes("network") || error.message?.includes("fetch")) {
        errorMessage = "Network error connecting to authentication service. Please check your internet connection and try again.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      onError(errorMessage);
      setRetryCount(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Button 
      onClick={handleGoogleSignIn} 
      type="button" 
      variant="outline" 
      className="w-full flex items-center justify-center gap-2 py-2"
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Connecting to Google...
        </>
      ) : (
        <>
          <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
          </svg>
          Continue with Google
        </>
      )}
    </Button>
  );
};

export default GoogleSignInButton;
