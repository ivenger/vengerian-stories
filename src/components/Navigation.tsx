
import React, { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, InfoIcon, Settings, LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth"; 
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

const Navigation = () => {
  const { user, signOut, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    console.log("Navigation: Admin status changed:", isAdmin);
    console.log("Navigation: Screen type:", isMobile ? "mobile" : "desktop");
  }, [isAdmin, isMobile]);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleSignOut = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      console.log("Navigation: Initiating sign out");
      toast({
        title: "Signing out",
        description: "Processing your request...",
      });
      
      await signOut();
      
      // Force navigation to home page
      navigate('/');
      
      // Force clear local storage as an additional fallback
      try {
        localStorage.removeItem('sb-dvalgsvmkrqzwfcxvbxg-auth-token');
      } catch (e) {
        console.warn("Navigation: Could not clear localStorage:", e);
      }
    } catch (error) {
      console.error("Error in Navigation handleSignOut:", error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try refreshing the page.",
        variant: "destructive"
      });
    }
  };

  const getDisplayName = () => {
    if (!user) return null;
    
    if (user.user_metadata?.full_name) {
      return user.user_metadata.full_name.split(' ')[0];
    }
    
    if (user.user_metadata?.name) {
      return user.user_metadata.name.split(' ')[0];
    }
    
    if (user.email) {
      return user.email.split('@')[0];
    }
    
    return 'User';
  };
  
  const displayName = getDisplayName();

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left navigation group */}
          <div className="flex">
            <Link to="/" className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive("/") ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"}`}>
              <Home size={18} className="mr-2" />
              <span className="font-semibold">Home</span>
            </Link>
            <Link to="/about" className={`ml-4 flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive("/about") ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"}`}>
              <InfoIcon size={18} className="mr-2" />
              <span className="font-semibold">About</span>
            </Link>
          </div>
          
          {/* Right navigation group - user-related items */}
          <div className={`flex ${isMobile ? 'flex-col items-end' : 'items-center space-x-2'}`}>
            {user ? (
              <>
                <div className={`flex items-center ${isMobile ? 'mb-1 justify-end w-full' : ''}`}>
                  <Link to="/profile" className="text-sm text-gray-700 hover:text-blue-600 font-medium flex items-center">
                    <User size={16} className="mr-1" />
                    <span className="max-w-[80px] truncate">{displayName}</span>
                  </Link>
                  
                  {isAdmin && (
                    <Link 
                      to="/admin" 
                      className={`flex items-center px-2 py-1 ml-2 text-xs font-medium rounded-md ${
                        isActive("/admin") ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                      }`}
                    >
                      <Settings size={16} className="mr-1" />
                      <span>Admin</span>
                    </Link>
                  )}
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleSignOut}
                  className={`flex items-center gap-1 text-gray-700 hover:text-gray-900 ${isMobile ? 'px-2 py-1 h-auto' : ''}`}
                  type="button"
                >
                  <LogOut size={14} />
                  <span className="text-xs">Sign Out</span>
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
