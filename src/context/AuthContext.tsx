import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore';
import nookies from 'nookies'
import React, { createContext, useContext, useEffect, useState } from 'react'

import { auth, database } from '@/firebase'
import { useAuthStore } from '@/modules/auth/useAuthStore';

// User data type interface
interface UserType {
  email: string | null;
  uid: string | null;
  role?: string | null;
  tier?: string | null;
  displayName?: string | null;
}

// Create auth context
const AuthContext = createContext({});

// Make auth context available across the app by exporting it
export const useAuth = () => useContext<any>(AuthContext);

// Create the auth context provider
export const AuthContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  // 🔄 BRIDGE: Unified Auth State from Store
  const {
    user: storeUser,
    isLoading: storeLoading,
    signIn,
    signUp: storeSignUp,
    signOut: storeSignOut,
    signInWithGoogle: storeGoogleSignIn
  } = useAuthStore();

  // Map store user to legacy return type if necessary, 
  // but useAuthStore's user is already more complete.
  const user = storeUser as any;
  const loading = storeLoading;

  // force refresh the token every 10 minutes (Parity with legacy behavior)
  useEffect(() => {
    // Skip if Firebase auth is not configured
    if (!auth) {
      return;
    }

    const handle = setInterval(async () => {
      if (!auth) return;
      const user = auth.currentUser;
      if (user) {
        console.log('🔄 [AuthContext] Periodic ID Token Refresh...');
        await user.getIdToken(true);
      }
    }, 10 * 60 * 1000);

    // clean up setInterval
    return () => clearInterval(handle);
  }, []);

  // Wrappers for backward compatibility
  const signUp = (email: string, password: string) => storeSignUp(email, password);
  const logIn = (email: string, password: string) => signIn(email, password);
  const logOut = async () => storeSignOut();
  const signInWithGoogle = async () => storeGoogleSignIn();

  return (
    <AuthContext.Provider value={{ user, loading, signUp, logIn, logOut, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
};
