import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
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

        // Clear cookies using both nookies and document.cookie
        try {
          nookies.destroy(null, 'token', { path: '/' });
          nookies.destroy(null, 'uid', { path: '/' });
        } catch (error) {
          console.warn('nookies.destroy failed:', error);
        }

        // Also clear with document.cookie
        if (typeof window !== 'undefined') {
          document.cookie = 'token=; path=/; max-age=0';
          document.cookie = 'uid=; path=/; max-age=0';
        }

        console.log('🗑️ Cookies cleared');
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

        // Set cookies using BOTH nookies and document.cookie for maximum compatibility
        // nookies for SSR, document.cookie as backup for client-side
        const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
        const maxAge = 7 * 24 * 60 * 60; // 7 days

        // Method 1: Use nookies for SSR compatibility
        try {
          nookies.set(null, 'token', token, {
            path: '/',
            maxAge: maxAge,
            sameSite: 'lax',
            secure: isSecure,
          });
          nookies.set(null, 'uid', user.uid, {
            path: '/',
            maxAge: maxAge,
            sameSite: 'lax',
            secure: isSecure,
          });
        } catch (error) {
          console.warn('nookies.set failed:', error);
        }

        // Method 2: Also use document.cookie as fallback
        if (typeof window !== 'undefined') {
          const cookieOptions = `path=/; max-age=${maxAge}; SameSite=Lax${isSecure ? '; Secure' : ''}`;
          document.cookie = `token=${token}; ${cookieOptions}`;
          document.cookie = `uid=${user.uid}; ${cookieOptions}`;
        }

        // Verify cookies were set
        const allCookies = nookies.get(null);
        console.log('✅ Cookies set:', {
          tokenLength: token.length,
          uid: user.uid,
          secure: isSecure,
          domain: typeof window !== 'undefined' ? window.location.hostname : 'server',
          nookiesCookies: Object.keys(allCookies),
          hasToken: !!allCookies.token,
          hasUid: !!allCookies.uid,
          documentCookies: typeof window !== 'undefined' ? document.cookie.includes('token') : 'N/A',
        });
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

  // Sign in with Google
  const signInWithGoogle = async () => {
    if (!auth) {
      return Promise.reject(new Error('Firebase Auth not configured'));
    }
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  // Wrap the children with the context provider

  return (
    <AuthContext.Provider value={{ user, signUp, logIn, logOut, signInWithGoogle }}>
      {loading ? null : children}
    </AuthContext.Provider>
  );
};
