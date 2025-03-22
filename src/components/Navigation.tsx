
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, InfoIcon, Settings, LogOut } from "lucide-react";
import { useAuth } from "./AuthProvider";
import LanguageSelector from "./LanguageSelector";
import { Button } from "@/components/ui/button";

const Navigation = () => {
  const { user, signOut, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Extract display name from email
  const displayName = user?.email ? user.email.split('@')[0] : null;
  
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
            <LanguageSelector />
            
            {user ? (
              <>
                <div className="text-sm text-gray-700 font-medium flex items-center">
                  {displayName}
                  {isAdmin && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded-full">
                      Admin
                    </span>
                  )}
                </div>
                
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
