
import { Navigate } from "react-router-dom";
import { useAuthContext } from "./AuthProvider";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

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
  const { user, loading, isAdmin, error, authInitialized } = useAuthContext();

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

  // If authentication state is not initialized or still loading, show a loading indicator
  if (!authInitialized || loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-600">Verifying authentication...</p>
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
    console.log("Access denied: User is not an admin", { isAdmin, userId: user.id });
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
