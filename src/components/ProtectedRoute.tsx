
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth"; 
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  adminOnly?: boolean;
}

const ProtectedRoute = ({ 
  children, 
  redirectTo = "/auth",
  adminOnly = false
}: ProtectedRouteProps) => {
  const { user, loading, isAdmin, error, refreshSession } = useAuth();
  // Add state to track refresh attempts to prevent loops
  const [hasAttemptedRefresh, setHasAttemptedRefresh] = useState(false);

  // Debug output for admin status
  useEffect(() => {
    if (adminOnly) {
      console.log("ProtectedRoute - Admin check:", { 
        isAdmin, 
        userId: user?.id,
        email: user?.email,
        isLoading: loading,
        error: error || "none"
      });
    }

    // Attempt refresh only once if needed
    if (!loading && !user && !hasAttemptedRefresh) {
      console.log("ProtectedRoute - No user after loading, attempting refresh");
      setHasAttemptedRefresh(true);
      refreshSession().catch(() => {
        console.log("ProtectedRoute - Refresh attempt failed");
      });
    }
  }, [adminOnly, isAdmin, user, loading, error, hasAttemptedRefresh, refreshSession]);

  // If there's an authentication error, show error message with retry option
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-red-800 mb-2">Authentication Error</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
            className="border-red-300 hover:bg-red-50"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // If authentication is still loading, show a loading indicator
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // If user is not authenticated, redirect to the login page
  if (!user) {
    console.log("User not authenticated, redirecting to", redirectTo);
    return <Navigate to={redirectTo} />;
  }

  // If adminOnly flag is true, check if the current user is an admin
  if (adminOnly && !isAdmin) {
    console.log("Access denied: User is not an admin", { isAdmin, userId: user.id, error: error || "none" });
    return (
      <div className="flex flex-col justify-center items-center h-screen p-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-amber-800 mb-2">Permission Denied</h2>
          <p className="text-gray-700 mb-4">
            You don't have admin privileges to access this page.
          </p>
          <Button 
            onClick={() => window.location.href = '/'} 
            variant="outline"
            className="border-amber-300 hover:bg-amber-50"
          >
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  // If user is authenticated and passes admin check if required, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
