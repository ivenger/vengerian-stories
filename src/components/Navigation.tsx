
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

const Navigation = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const toggleMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
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
          <Link 
            to="/admin" 
            className={`text-gray-700 hover:text-black transition-colors relative pb-1 ${
              isActive('/admin') ? 'font-medium' : ''
            }`}
          >
            Admin
            {isActive('/admin') && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-900"></div>}
          </Link>
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
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
