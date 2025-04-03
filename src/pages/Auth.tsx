import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import Navigation from "../components/Navigation";
import { useAuthContext } from "@/components/AuthProvider";
import MultilingualTitle from "../components/MultilingualTitle";
import GoogleSignInButton from "./auth/GoogleSignInButton";
import EmailAuthForm from "./auth/EmailAuthForm";
import PasswordResetDialog from "./auth/PasswordResetDialog";
import OAuthErrorAlert from "./auth/OAuthErrorAlert";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useAuthContext();

  useEffect(() => {
    if (session) {
      navigate("/");
    }
  }, [session, navigate]);

  useEffect(() => {
    const checkForErrors = () => {
      const url = new URL(window.location.href);
      const errorDescription = url.searchParams.get("error_description");
      const error = url.searchParams.get("error");
      
      if (errorDescription || error) {
        console.error("OAuth error detected in URL:", { error, errorDescription });
        setOauthError(errorDescription || error || "Authentication failed");
        
        toast({
          title: "Authentication Error",
          description: errorDescription || error || "Authentication failed",
          variant: "destructive"
        });
        
        window.history.replaceState({}, document.title, '/auth');
        return true;
      }
      return false;
    };

    const hasErrors = checkForErrors();
    
    if (!hasErrors) {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const token = url.searchParams.get("access_token");
      
      if (code || token) {
        console.log("Auth code/token detected, waiting for session...");
        toast({
          title: "Authentication in progress",
          description: "Finalizing your sign-in...",
        });
      }
    }
  }, [navigate, toast]);

  useEffect(() => {
    if (oauthError?.includes("network")) {
      try {
        const testKey = "auth_test_" + Date.now();
        localStorage.setItem(testKey, "test");
        localStorage.removeItem(testKey);
        console.log("LocalStorage check: OK");
      } catch (err) {
        console.error("LocalStorage check failed:", err);
        setOauthError(prev => (prev || "") + " Browser storage access issues detected. Try enabling cookies or using private browsing mode.");
      }
    }
  }, [oauthError]);

  const handleRetry = () => {
    setOauthError(null);
    setTimeout(() => {
      setRetryCount(prev => prev + 1);
    }, 500);
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

          <OAuthErrorAlert error={oauthError} onRetry={handleRetry} />

          <div className="mt-6">
            <GoogleSignInButton 
              onError={setOauthError} 
              retryCount={retryCount} 
              setRetryCount={setRetryCount} 
            />
          </div>

          <div className="relative mt-6">
            <Separator className="mb-4" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-white px-2 text-gray-500 text-sm">or continue with email</span>
            </div>
          </div>

          <EmailAuthForm 
            isLogin={isLogin} 
            setShowResetDialog={setShowResetDialog} 
          />

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

      <PasswordResetDialog 
        showResetDialog={showResetDialog}
        setShowResetDialog={setShowResetDialog}
      />
    </div>
  );
};

export default Auth;
