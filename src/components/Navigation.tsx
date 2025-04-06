
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, InfoIcon, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

const Navigation = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

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
        </div>
        
        {/* Mobile menu - shown/hidden based on state */}
        {isMobile && mobileMenuOpen && (
          <div className="px-2 pt-2 pb-4 space-y-3">
            <div className="flex flex-col space-y-2">
              {renderNavLinks()}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
