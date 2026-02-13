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

    console.log('🔐 [AuthContext] Initializing...');

    // 🛡️ SAFETY TIMEOUT: Force UI unlock if Firebase is slow/stuck
    const safetyTimeout = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ [AuthContext] Init Timeout (10s). Forcing unlock.');
        setLoading(false);
      }
    }, 10000);

    return auth.onIdTokenChanged(async (userData) => {
      clearTimeout(safetyTimeout);
      console.log('⚡ [AuthContext] Token Changed:', userData ? 'User Found' : 'No User', userData?.uid);

      if (!userData) {
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
          const token = await userData.getIdToken();
          const idTokenResult = await userData.getIdTokenResult();
          const customClaims = idTokenResult.claims;

          let role = (customClaims.role as string) || null;
          let tier = (customClaims.tier as string) || null;

          // FALLBACK: If role is missing in claims, check Firestore (Hybrid Mode Support)
          if (!role && database) {
            try {
              const userDocRef = doc(database, 'users', userData.uid);
              const userDocSnap = await getDoc(userDocRef);
              if (userDocSnap.exists()) {
                const data = userDocSnap.data();
                if (data?.role) {
                  console.log('✅ [AuthContext] Found role in Firestore:', data.role);
                  role = data.role as string;
                }
              }
            } catch (err) {
              console.warn('⚠️ [AuthContext] Firestore check failed:', err);
            }
          }

          // HARDCODE OWNER ROLE
          if (userData.email === 'boonyanone@gmail.com') {
            role = 'owner';
            console.log('👑 [AuthContext] Owner Identified: Access Granted');
          }

          setUser({
            email: userData.email,
            uid: userData.uid,
            role: role,
            tier: tier,
            displayName: userData.displayName,
          });
        } catch (e) {
          console.error('❌ [AuthContext] Processing error:', e);
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
    <AuthContext.Provider value={{ user, loading, signUp, logIn, logOut, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
};
