
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, InfoIcon, Settings, LogOut } from "lucide-react";
import { useAuth } from "./AuthProvider";
import LanguageSelector from "./LanguageSelector";
import { Button } from "@/components/ui/button";

const Navigation = () => {
  const { user, signOut, isAdmin } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex">
            <Link to="/" className={`flex items-center px-2 py-1 text-sm font-medium rounded-md ${isActive("/") ? "text-blue-600" : "text-gray-600 hover:text-blue-600"}`}>
              <Home size={18} className="mr-1" />
              <span className="font-semibold">Home</span>
            </Link>
            <Link to="/about" className={`ml-4 flex items-center px-2 py-1 text-sm font-medium rounded-md ${isActive("/about") ? "text-blue-600" : "text-gray-600 hover:text-blue-600"}`}>
              <InfoIcon size={18} className="mr-1" />
              <span className="font-semibold">About the Author</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <LanguageSelector />
            
            {user ? (
              <>
                <div className="text-sm text-gray-600">
                  {user.email}
                </div>
                
                {isAdmin && (
                  <Link to="/admin" className={`flex items-center px-2 py-1 text-sm font-medium rounded-md ${isActive("/admin") ? "text-blue-600" : "text-gray-600 hover:text-blue-600"}`}>
                    <Settings size={18} className="mr-1" />
                    <span>Admin</span>
                  </Link>
                )}
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={signOut} 
                  className="flex items-center gap-1 text-gray-600"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button variant="outline" size="sm">
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
