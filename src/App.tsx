
import React, { useState, useEffect } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Index from "./pages/Index";
import BlogPost from "./pages/BlogPost";
import About from "./pages/About";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./components/AuthProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import { Toaster } from "@/components/ui/toaster"
import { createContext } from 'react';

// Create a context for language
export const LanguageContext = createContext<{
  currentLanguage: string;
  setCurrentLanguage: (lang: string) => void;
}>({
  currentLanguage: 'Russian',
  setCurrentLanguage: () => {},
});

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('Russian');

  useEffect(() => {
    // On mount, read the preferred theme from local storage
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }

    // Load language preference
    const storedLanguage = localStorage.getItem('preferredLanguage');
    if (storedLanguage) {
      setCurrentLanguage(storedLanguage);
    }
  }, []);

  useEffect(() => {
    // Whenever `isDarkMode` changes, update local storage and the document class
    if (isDarkMode) {
      localStorage.setItem('theme', 'dark');
      document.documentElement.classList.add('dark');
    } else {
      localStorage.setItem('theme', 'light');
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Save language preference whenever it changes
  useEffect(() => {
    localStorage.setItem('preferredLanguage', currentLanguage);
  }, [currentLanguage]);

  // Create language context value
  const languageContextValue = {
    currentLanguage,
    setCurrentLanguage,
  };

  return (
    <AuthProvider>
      <LanguageContext.Provider value={languageContextValue}>
        <RouterProvider router={
          createBrowserRouter([
            {
              path: "/",
              element: <Index />
            },
            {
              path: "/blog/:id",
              element: <BlogPost />
            },
            {
              path: "/about",
              element: <About />
            },
            {
              path: "/auth",
              element: <Auth />
            },
            {
              path: "/admin",
              element: (
                <ProtectedRoute adminOnly={true}>
                  <Admin />
                </ProtectedRoute>
              )
            },
            {
              path: "*",
              element: <NotFound />
            }
          ])
        } />
        <Toaster />
      </LanguageContext.Provider>
    </AuthProvider>
  );
}

export default App;
