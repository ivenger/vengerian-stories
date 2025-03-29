
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { Button } from "@/components/ui/button";
import { LogOut, PenSquare, User, Menu, X } from "lucide-react";

const Navigation = () => {
  const { user, isAdmin, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  console.log("Navigation component - isAdmin:", isAdmin);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link 
              to="/" 
              className="text-xl font-bold text-gray-800"
              onClick={() => setIsMenuOpen(false)}
            >
              Vengerian Stories
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={toggleMenu}
              className="p-2 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100 focus:outline-none"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <Link to="/" className="text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md">
              Home
            </Link>
            <Link to="/about" className="text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md">
              About
            </Link>
            
            {loading ? (
              <span className="text-gray-400 px-3 py-2">Loading...</span>
            ) : user ? (
              <>
                {isAdmin && (
                  <Link to="/admin" className="text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md flex items-center">
                    <PenSquare className="h-4 w-4 mr-1" />
                    Admin
                  </Link>
                )}
                <Link to="/profile" className="text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  Profile
                </Link>
                <Button 
                  onClick={() => signOut()}
                  variant="outline"
                  size="sm"
                  className="flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Sign out
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => navigate("/auth")}
                variant="default"
                size="sm"
              >
                Sign in
              </Button>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-gray-200 space-y-2">
            <Link 
              to="/" 
              className="block text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-3 py-2 rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/about" 
              className="block text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-3 py-2 rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            
            {loading ? (
              <span className="block text-gray-400 px-3 py-2">Loading...</span>
            ) : user ? (
              <>
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    className="block text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-3 py-2 rounded-md flex items-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <PenSquare className="h-4 w-4 mr-1" />
                    Admin
                  </Link>
                )}
                <Link 
                  to="/profile" 
                  className="block text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-3 py-2 rounded-md flex items-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="h-4 w-4 mr-1" />
                  Profile
                </Link>
                <button 
                  onClick={() => {
                    signOut();
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-3 py-2 rounded-md flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Sign out
                </button>
              </>
            ) : (
              <button 
                onClick={() => {
                  navigate("/auth");
                  setIsMenuOpen(false);
                }}
                className="w-full text-left text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-3 py-2 rounded-md"
              >
                Sign in
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
