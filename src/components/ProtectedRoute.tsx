
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
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
  const { user, loading, isAdmin } = useAuth();

  // If authentication is still loading, show a loading indicator
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  // If user is not authenticated, redirect to the login page
  if (!user) {
    return <Navigate to={redirectTo} />;
  }

  // If adminOnly flag is true, check if the current user is an admin
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" />;
  }

  // If user is authenticated and passes admin check if required, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
