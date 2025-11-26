import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
} from 'firebase/auth'
import nookies from 'nookies'
import React, { createContext, useContext, useEffect, useState } from 'react'

import { auth } from '../firebase'

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
  // Define the constants for the user and loading state
  const [user, setUser] = useState<UserType>({
    email: null,
    uid: null,
    role: null,
    tier: null,
    displayName: null,
  });
  const [loading, setLoading] = useState<Boolean>(true);

  // listen for token changes
  // call setUser and write new token as a cookie
  useEffect(() => {
    // Skip if Firebase auth is not configured
    if (!auth) {
      console.warn('Firebase Auth not configured');
      setLoading(false);
      return;
    }

    return auth.onIdTokenChanged(async (user) => {
      if (!user) {
        setUser({
          email: null,
          uid: null,
          role: null,
          tier: null,
          displayName: null,
        });
        nookies.set(undefined, "token", "", { path: "/" });
      } else {
        const token = await user.getIdToken();
        const idTokenResult = await user.getIdTokenResult();
        const customClaims = idTokenResult.claims;

        setUser({
          email: user.email,
          uid: user.uid,
          role: customClaims.role || null,
          tier: customClaims.tier || null,
          displayName: user.displayName,
        });
        nookies.set(undefined, "token", token, { path: "/" });
      }
      setLoading(false);
    });
  }, []);

  // force refresh the token every 10 minutes
  useEffect(() => {
    // Skip if Firebase auth is not configured
    if (!auth) {
      return;
    }

    const handle = setInterval(async () => {
      const user = auth.currentUser;
      if (user) await user.getIdToken(true);
    }, 10 * 60 * 1000);

    // clean up setInterval
    return () => clearInterval(handle);
  }, []);

  // Sign up the user
  const signUp = (email: string, password: string) => {
    if (!auth) {
      return Promise.reject(new Error('Firebase Auth not configured'));
    }
    return createUserWithEmailAndPassword(auth, email, password);
  };

  // Login the user
  const logIn = (email: string, password: string) => {
    if (!auth) {
      return Promise.reject(new Error('Firebase Auth not configured'));
    }
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Logout the user
  const logOut = async () => {
    if (!auth) {
      return Promise.reject(new Error('Firebase Auth not configured'));
    }
    setUser({
      email: null,
      uid: null,
      role: null,
      tier: null,
      displayName: null,
    });
    return await signOut(auth);
  };

  // Wrap the children with the context provider

  return (
    <AuthContext.Provider value={{ user, signUp, logIn, logOut }}>
      {loading ? null : children}
    </AuthContext.Provider>
  );
};
