
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, InfoIcon, Settings, LogOut, Menu } from "lucide-react";
import { useAuth } from "./AuthProvider";
import LanguageSelector from "./LanguageSelector";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const Navigation = () => {
  const { user, signOut, isAdmin } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();

  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  const NavLinks = () => (
    <>
      <Link to="/" className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive("/") ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"}`}>
        <Home size={18} className="mr-2" />
        <span className="font-semibold">Home</span>
      </Link>
      <Link to="/about" className={`ml-4 flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive("/about") ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"}`}>
        <InfoIcon size={18} className="mr-2" />
        <span className="font-semibold">About the Author</span>
      </Link>
      
      {user && isAdmin && (
        <Link to="/admin" className={`ml-4 flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive("/admin") ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"}`}>
          <Settings size={18} className="mr-2" />
          <span>Admin</span>
        </Link>
      )}
    </>
  );

  const UserSection = () => (
    <>
      {user ? (
        <>
          <div className="text-sm text-gray-700 font-medium hidden md:block">
            {user.email}
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={signOut} 
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 ml-4"
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
    </>
  );
  
  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {isMobile ? (
            <>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <div className="flex flex-col gap-4 mt-8">
                    <NavLinks />
                  </div>
                </SheetContent>
              </Sheet>
              
              <div className="flex items-center space-x-3">
                <LanguageSelector />
                <UserSection />
              </div>
            </>
          ) : (
            <>
              <div className="flex">
                <NavLinks />
              </div>
              
              <div className="flex items-center space-x-4">
                <LanguageSelector />
                <UserSection />
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
