
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LogIn, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "./AuthProvider";

const Navigation = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const toggleMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Success",
        description: "You have been signed out",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  return (
    <nav className="py-6 mb-8 border-b border-gray-200">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-cursive font-medium tracking-tight">
          Vengerian Stories
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-8">
          <Link 
            to="/" 
            className={`text-gray-700 hover:text-black transition-colors relative pb-1 ${
              isActive('/') ? 'font-medium' : ''
            }`}
          >
            Stories
            {isActive('/') && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-900"></div>}
          </Link>
          <Link 
            to="/about" 
            className={`text-gray-700 hover:text-black transition-colors relative pb-1 ${
              isActive('/about') ? 'font-medium' : ''
            }`}
          >
            About
            {isActive('/about') && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-900"></div>}
          </Link>
          {user && (
            <Link 
              to="/admin" 
              className={`text-gray-700 hover:text-black transition-colors relative pb-1 ${
                isActive('/admin') ? 'font-medium' : ''
              }`}
            >
              Admin
              {isActive('/admin') && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-900"></div>}
            </Link>
          )}
          {user ? (
            <button
              onClick={handleSignOut}
              className="text-gray-700 hover:text-black transition-colors flex items-center gap-1"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          ) : (
            <Link
              to="/auth"
              className={`text-gray-700 hover:text-black transition-colors relative pb-1 flex items-center gap-1 ${
                isActive('/auth') ? 'font-medium' : ''
              }`}
            >
              <LogIn size={16} />
              Sign In
              {isActive('/auth') && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-900"></div>}
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMenu}
          className="md:hidden text-gray-700 hover:text-black transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white z-10 py-4 px-6 border-b border-gray-200">
          <div className="flex flex-col space-y-4">
            <Link 
              to="/" 
              className={`text-gray-700 hover:text-black transition-colors relative pb-1 ${
                isActive('/') ? 'font-medium' : ''
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Stories
              {isActive('/') && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-900"></div>}
            </Link>
            <Link 
              to="/about" 
              className={`text-gray-700 hover:text-black transition-colors relative pb-1 ${
                isActive('/about') ? 'font-medium' : ''
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              About
              {isActive('/about') && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-900"></div>}
            </Link>
            {user && (
              <Link 
                to="/admin" 
                className={`text-gray-700 hover:text-black transition-colors relative pb-1 ${
                  isActive('/admin') ? 'font-medium' : ''
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin
                {isActive('/admin') && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-900"></div>}
              </Link>
            )}
            {user ? (
              <button
                onClick={() => {
                  handleSignOut();
                  setMobileMenuOpen(false);
                }}
                className="text-gray-700 hover:text-black transition-colors flex items-center gap-1"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            ) : (
              <Link
                to="/auth"
                className={`text-gray-700 hover:text-black transition-colors relative pb-1 flex items-center gap-1 ${
                  isActive('/auth') ? 'font-medium' : ''
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <LogIn size={16} />
                Sign In
                {isActive('/auth') && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-900"></div>}
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
