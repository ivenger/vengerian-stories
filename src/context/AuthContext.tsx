
import React, { createContext, useContext, useState, useEffect } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useToast } from '../hooks/use-toast';

export type UserRole = 'admin' | 'viewer';

interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
}

interface AuthContextType {
  currentUser: AuthUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  setUserAsAdmin: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Check if user has admin role
  const isAdmin = currentUser?.role === 'admin';

  // Fetch user's role from Firestore
  const fetchUserRole = async (user: User): Promise<UserRole> => {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data().role as UserRole;
    } else {
      // Create new user with viewer role by default
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: 'viewer',
        createdAt: new Date(),
      });
      return 'viewer';
    }
  };

  // Set a user as admin
  const setUserAsAdmin = async (userId: string) => {
    if (!isAdmin) {
      toast({
        title: "Permission denied",
        description: "Only administrators can assign admin privileges.",
        variant: "destructive"
      });
      return;
    }

    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, { role: 'admin' }, { merge: true });
      toast({
        title: "Success",
        description: "User has been granted admin privileges.",
      });
    } catch (error) {
      console.error("Error setting admin role:", error);
      toast({
        title: "Error",
        description: "Failed to update user role.",
        variant: "destructive"
      });
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      toast({
        title: "Success",
        description: "Successfully signed in with Google.",
      });
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to sign in with Google.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Success",
        description: "Successfully signed out.",
      });
    } catch (error: any) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to sign out.",
        variant: "destructive"
      });
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const role = await fetchUserRole(user);
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role,
        });
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    signInWithGoogle,
    logout,
    isAdmin,
    setUserAsAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
