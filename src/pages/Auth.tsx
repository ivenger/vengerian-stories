
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Navigation from "../components/Navigation";
import { useAuth } from "@/components/AuthProvider";
import MultilingualTitle from "../components/MultilingualTitle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleAuthLoading, setGoogleAuthLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (session) {
      navigate("/");
    }
  }, [session, navigate]);

  // Check for OAuth related errors in URL
  useEffect(() => {
    const url = new URL(window.location.href);
    const errorDescription = url.searchParams.get("error_description");
    
    if (errorDescription) {
      toast({
        title: "Authentication Error",
        description: errorDescription,
        variant: "destructive"
      });
      
      // Clear the error from URL
      navigate('/auth', { replace: true });
    }
  }, [navigate, toast]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Sign in
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Logged in successfully!",
        });
        
        navigate("/");
      } else {
        // Sign up - with email confirmation enabled
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
          }
        });

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Registration email sent! Please check your inbox to confirm your account.",
        });
      }
    } catch (error: any) {
      let errorMessage = error.message;
      
      // Provide more user-friendly error messages
      if (error.message.includes("User already registered")) {
        errorMessage = "This email is already registered. Please try logging in instead.";
      } else if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Invalid email or password. Please try again.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Password reset instructions sent to your email",
      });
      
      setShowResetDialog(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset instructions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleAuthLoading(true);
      
      console.log("Starting Google OAuth signin, redirecting to:", window.location.origin);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) throw error;
      
      // No need for success toast as we're redirecting away
    } catch (error: any) {
      console.error("Google OAuth Error:", error);
      
      toast({
        title: "Error",
        description: error.message || "Failed to sign in with Google",
        variant: "destructive",
      });
      
      setGoogleAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navigation />
      <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <MultilingualTitle />
            
            <h2 className="text-2xl font-bold mt-4">
              {isLogin ? "Sign in to your account" : "Create a new account"}
            </h2>
            <p className="mt-2 text-gray-600">
              {isLogin
                ? "Enter your credentials to access Vengerian Stories"
                : "Sign up to start using Vengerian Stories"}
            </p>
          </div>

          <div className="mt-6">
            <Button 
              onClick={handleGoogleSignIn} 
              type="button" 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2 py-2"
              disabled={googleAuthLoading}
            >
              {googleAuthLoading ? (
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
          </div>

          <div className="relative mt-6">
            <Separator className="mb-4" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-white px-2 text-gray-500 text-sm">or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleAuth} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="mt-1"
                />
              </div>
            </div>

            {isLogin && (
              <div className="text-sm text-right">
                <button
                  type="button"
                  onClick={() => setShowResetDialog(true)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Forgot your password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-gray-900 text-white rounded hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : isLogin ? (
                "Sign in"
              ) : (
                "Sign up"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-gray-600 hover:text-gray-900"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </main>

      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset your password</DialogTitle>
            <DialogDescription>
              Enter your email address and we'll send you instructions to reset your password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordReset} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="mt-1"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowResetDialog(false)}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-700 disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send instructions"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
