
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleSignOut = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
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
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const renderNavLinks = () => (
    <>
      <Link 
        to="/" 
        className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive("/") ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"}`}
        onClick={isMobile ? closeMobileMenu : undefined}
      >
        <Home size={18} className="mr-2" />
        <span className="font-semibold">Home</span>
      </Link>
      <Link 
        to="/about" 
        className={`md:ml-4 flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive("/about") ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"}`}
        onClick={isMobile ? closeMobileMenu : undefined}
      >
        <InfoIcon size={18} className="mr-2" />
        <span className="font-semibold">Author</span>
      </Link>
    </>
  );

  const renderUserMenu = () => (
    <>
      {user ? (
        <>
          <Link 
            to="/profile" 
            className="text-sm text-gray-700 hover:text-blue-600 font-medium flex items-center"
            onClick={isMobile ? closeMobileMenu : undefined}
          >
            <User size={16} className="mr-1" />
            <span className="max-w-[120px] truncate">{displayName}</span>
          </Link>
          
          {isAdmin && (
            <Link 
              to="/admin" 
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive("/admin") ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"}`}
              onClick={isMobile ? closeMobileMenu : undefined}
            >
              <Settings size={18} className="mr-2" />
              <span>Admin</span>
            </Link>
          )}
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={(e) => {
              handleSignOut(e);
              if (isMobile) closeMobileMenu();
            }}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
            type="button"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </Button>
        </>
      ) : (
        <Link to="/auth" onClick={isMobile ? closeMobileMenu : undefined}>
          <Button variant="outline" size="sm" className="font-medium">
            Sign In
          </Button>
        </Link>
      )}
    </>
  );

  return (
    <nav className="bg-white shadow-md w-full">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/brand section - always visible */}
          <div className="flex items-center">
            {isMobile ? (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleMobileMenu} 
                className="mr-2"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </Button>
            ) : (
              <div className="flex">
                {renderNavLinks()}
              </div>
            )}
          </div>
          
          {/* Desktop Navigation */}
          {!isMobile && (
            <div className="flex items-center space-x-4">
              {renderUserMenu()}
            </div>
          )}
        </div>
        
        {/* Mobile menu - shown/hidden based on state */}
        {isMobile && mobileMenuOpen && (
          <div className="px-2 pt-2 pb-4 space-y-3">
            <div className="flex flex-col space-y-2">
              {renderNavLinks()}
            </div>
            <div className="flex flex-col space-y-3 pt-2 border-t border-gray-200">
              {renderUserMenu()}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
