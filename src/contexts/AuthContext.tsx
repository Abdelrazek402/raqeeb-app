import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, db, sanitizeForFirestore } from '../utils/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  isGuest: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  continueAsGuest: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isGuest: false,
  loading: true,
  signInWithGoogle: async () => {},
  continueAsGuest: () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setIsGuest(false);
        // Ensure user document exists in Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        try {
          await setDoc(userRef, sanitizeForFirestore({
            uid: currentUser.uid,
            email: currentUser.email || '',
            lastLogin: new Date().toISOString()
          }), { merge: true });
        } catch (e) {
          console.error("Error setting user document (might be offline):", e);
        }
      }
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setIsGuest(false);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google Sign-In Error", error);
      if (error.code === 'auth/unauthorized-domain' || error.message.includes('auth/internal-error')) {
        console.error('The domain needs to be added to Firebase Authorized Domains.');
      }
      throw error;
    }
  };

  const continueAsGuest = () => {
    setIsGuest(true);
  };

  const logout = async () => {
    setIsGuest(false);
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign-Out Error", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isGuest, loading, signInWithGoogle, continueAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
