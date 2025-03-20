
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, InfoIcon, Settings } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import LanguageSelector from "./LanguageSelector";

const Navigation = () => {
  const { isAdmin } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex">
            <Link
              to="/"
              className={`flex items-center px-2 py-1 text-sm font-medium rounded-md ${
                isActive("/")
                  ? "text-blue-600"
                  : "text-gray-600 hover:text-blue-600"
              }`}
            >
              <Home size={18} className="mr-1" />
              <span>Home</span>
            </Link>
            <Link
              to="/about"
              className={`ml-4 flex items-center px-2 py-1 text-sm font-medium rounded-md ${
                isActive("/about")
                  ? "text-blue-600"
                  : "text-gray-600 hover:text-blue-600"
              }`}
            >
              <InfoIcon size={18} className="mr-1" />
              <span>About</span>
            </Link>
          </div>
          
          <div className="flex items-center">
            <LanguageSelector />
            
            {isAdmin && (
              <Link
                to="/admin"
                className={`ml-4 flex items-center px-2 py-1 text-sm font-medium rounded-md ${
                  isActive("/admin")
                    ? "text-blue-600"
                    : "text-gray-600 hover:text-blue-600"
                }`}
              >
                <Settings size={18} className="mr-1" />
                <span>Admin</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
