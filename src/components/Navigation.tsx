
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, InfoIcon, Settings, LogOut, User, Menu, X } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

const Navigation = () => {
  const { user, signOut, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleSignOut = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Prevent any default button behavior
    e.stopPropagation(); // Stop event propagation
    
    try {
      await signOut();
      navigate('/');
      setMenuOpen(false);
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

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Home always visible */}
          <div className="flex">
            <Link to="/" className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive("/") ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"}`}>
              <Home size={18} className="mr-2" />
              <span className="font-semibold">Home</span>
            </Link>
          </div>
          
          {/* Mobile menu button */}
          {isMobile && (
            <button 
              onClick={toggleMenu}
              className="p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
          
          {/* Desktop menu */}
          {!isMobile && (
            <div className="flex items-center space-x-4">
              <Link to="/about" className={`ml-4 flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive("/about") ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"}`}>
                <InfoIcon size={18} className="mr-2" />
                <span className="font-semibold">Author</span>
              </Link>
              
              {user ? (
                <>
                  <Link to="/profile" className="text-sm text-gray-700 hover:text-blue-600 font-medium flex items-center">
                    <User size={16} className="mr-1" />
                    <span className="max-w-[120px] truncate">{displayName}</span>
                  </Link>
                  
                  {isAdmin && (
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
          )}
        </div>
        
        {/* Mobile menu dropdown */}
        {isMobile && menuOpen && (
          <div className="py-2 space-y-2 border-t border-gray-200">
            <Link 
              to="/about" 
              className={`block px-3 py-2 text-sm font-medium rounded-md ${isActive("/about") ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"}`}
              onClick={() => setMenuOpen(false)}
            >
              <div className="flex items-center">
                <InfoIcon size={18} className="mr-2" />
                <span className="font-semibold">Author</span>
              </div>
            </Link>
            
            {user ? (
              <>
                <Link 
                  to="/profile" 
                  className="block px-3 py-2 text-sm text-gray-700 hover:text-blue-600 font-medium"
                  onClick={() => setMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <User size={16} className="mr-2" />
                    <span>{displayName}</span>
                  </div>
                </Link>
                
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    className={`block px-3 py-2 text-sm font-medium rounded-md ${isActive("/admin") ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <Settings size={18} className="mr-2" />
                      <span>Admin</span>
                    </div>
                  </Link>
                )}
                
                <button 
                  onClick={handleSignOut}
                  className="block w-full text-left px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <LogOut size={16} className="mr-2" />
                    <span>Sign Out</span>
                  </div>
                </button>
              </>
            ) : (
              <Link 
                to="/auth" 
                className="block px-3 py-2"
                onClick={() => setMenuOpen(false)}
              >
                <Button variant="outline" size="sm" className="font-medium w-full justify-center">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
