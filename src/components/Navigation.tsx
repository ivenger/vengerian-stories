
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, InfoIcon, Settings, LogOut, User } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { Button } from "@/components/ui/button";

const Navigation = () => {
  const { user, signOut, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleSignOut = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Prevent any default button behavior
    e.stopPropagation(); // Stop event propagation
    
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error("Error in Navigation handleSignOut:", error);
    }
  };

  // Get display name based on auth method
  const getDisplayName = () => {
    if (!user) return null;
    
    // If user has metadata with first_name (typically from OAuth providers like Google)
    if (user.user_metadata?.full_name) {
      return user.user_metadata.full_name.split(' ')[0]; // Get first name
    }
    
    // If user has a name in user_metadata
    if (user.user_metadata?.name) {
      return user.user_metadata.name.split(' ')[0]; // Get first name 
    }
    
    // Otherwise extract from email
    if (user.email) {
      return user.email.split('@')[0];
    }
    
    return 'User'; // Fallback
  };
  
  const displayName = getDisplayName();
  
  console.log("Navigation component - isAdmin:", isAdmin);

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex">
            <Link to="/" className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive("/") ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"}`}>
              <Home size={18} className="mr-2" />
              <span className="font-semibold">Home</span>
            </Link>
            <Link to="/about" className={`ml-4 flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive("/about") ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"}`}>
              <InfoIcon size={18} className="mr-2" />
              <span className="font-semibold">About the Author</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/profile" className="text-sm text-gray-700 hover:text-blue-600 font-medium flex items-center">
                  <User size={16} className="mr-1" />
                  <span className="max-w-[120px] truncate">{displayName}</span>
                </Link>
                
                {isAdmin && ( // Only show Admin link if user is an admin
                  <Link to="/admin" className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive("/admin") ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"}`}>
                    <Settings size={18} className="mr-2" />
                    <span>Admin</span>
                  </Link>
                )}
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleSignOut}
                  className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
                  type="button"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button variant="outline" size="sm" className="font-medium">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
