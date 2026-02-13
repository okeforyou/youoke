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

import { auth, database } from '../firebase'

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

  // (imports will be moved to top level in the next replacement chunk or handled here if possible) 
  // Intent: Remove these lines as they are invalid here.

  // listen for token changes
  // call setUser and write new token as a cookie
  useEffect(() => {
    // Skip if Firebase auth is not configured
    if (!auth) {
      console.warn('Firebase Auth not configured');
      setLoading(false);
      return;
    }

    // 🛡️ SAFETY TIMEOUT: Force UI unlock if Firebase is slow/stuck
    const safetyTimeout = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ [AuthContext] Init Timeout (5s). Forcing unlock.');
        setLoading(false);
      }
    }, 5000);

    return auth.onIdTokenChanged(async (user) => {
      clearTimeout(safetyTimeout);
      console.log('⚡ [AuthContext] Token Changed:', user ? 'User Found' : 'No User', user?.uid);

      if (!user) {
        setUser({
          email: null,
          uid: null,
          role: null,
          tier: null,
          displayName: null,
        });
        setLoading(false);
      } else {
        try {
          const token = await user.getIdToken();
          const idTokenResult = await user.getIdTokenResult();
          const customClaims = idTokenResult.claims;

          let role = customClaims.role || null;
          let tier = customClaims.tier || null;

          // FALLBACK: If role is missing in claims, check Firestore (Hybrid Mode Support)
          if (!role && database) {
            try {
              const userDocRef = doc(database, 'users', user.uid);
              const userDocSnap = await getDoc(userDocRef);
              if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                if (userData?.role) {
                  console.log('✅ [AuthContext] Found role in Firestore:', userData.role);
                  role = userData.role;
                }
              }
            } catch (err) {
              console.warn('⚠️ [AuthContext] Firestore check failed:', err);
            }
          }

          setUser({
            email: user.email,
            uid: user.uid,
            role: role,
            tier: tier,
            displayName: user.displayName,
          });
        } catch (e) {
          console.error('❌ [AuthContext] Token processing error:', e);
        } finally {
          setLoading(false);
        }
      }
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
