import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { auth } from '@/firebase'
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
  const {
    user: storeUser,
    signIn: storeSignIn,
    signUp: storeSignUp,
    signOut: storeSignOut,
    signInWithGoogle: storeGoogleSignIn,
    isLoading
  } = useAuthStore();

  const [user, setUser] = useState<UserType>({
    email: null,
    uid: null,
    role: null,
    tier: null,
    displayName: null,
  });

  useEffect(() => {
    if (storeUser) {
      setUser({
        email: storeUser.email,
        uid: storeUser.uid,
        role: storeUser.role,
        tier: storeUser.membership?.type,
        displayName: storeUser.displayName,
      });
    } else {
      setUser({
        email: null,
        uid: null,
        role: null,
        tier: null,
        displayName: null,
      });
    }
  }, [storeUser]);

  // Compatibility actions
  const signUp = storeSignUp;
  const logIn = storeSignIn;
  const logOut = storeSignOut;
  const signInWithGoogle = storeGoogleSignIn;
  const loading = isLoading;

  // force refresh the token every 10 minutes
  useEffect(() => {
    if (!auth) return;

    const handle = setInterval(async () => {
      if (auth) {
        const currentUser = auth.currentUser;
        if (currentUser) {
          console.log('🔄 [AuthContext] Periodic ID Token Refresh...');
          await currentUser.getIdToken(true);
        }
      }
    }, 10 * 60 * 1000);

    return () => clearInterval(handle);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signUp, logIn, logOut, signInWithGoogle }}>
      {isLoading ? null : children}
    </AuthContext.Provider>
  );
};
