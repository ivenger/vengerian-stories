
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

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

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

  return (
    <AuthProvider>
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
    </AuthProvider>
  );
}

export default App;
