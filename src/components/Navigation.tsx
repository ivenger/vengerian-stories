
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthNav from "./AuthNav";

const Navigation = () => {
  const location = useLocation();
  const { isAdmin } = useAuth();
  
  // Check which link is active
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  return (
    <nav className="py-6 border-b border-gray-100">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-semibold text-gray-900">
          MinimalBlog
        </Link>
        
        <div className="flex items-center space-x-8">
          <Link 
            to="/"
            className={`text-sm ${
              isActive("/") 
                ? "text-gray-900 font-medium" 
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Home
          </Link>
          
          {isAdmin && (
            <Link 
              to="/admin"
              className={`text-sm ${
                isActive("/admin") 
                  ? "text-gray-900 font-medium" 
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Admin
            </Link>
          )}
          
          <Link 
            to="/about"
            className={`text-sm ${
              isActive("/about") 
                ? "text-gray-900 font-medium" 
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            About
          </Link>
          
          <AuthNav />
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
