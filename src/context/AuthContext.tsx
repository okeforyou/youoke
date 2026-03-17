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
  photoURL?: string | null;
}

interface AuthContextProps {
  user: UserType | null;
  loading: boolean;
  signUp: any;
  signup: any;
  logIn: any;
  login: any;
  logOut: any;
  logout: any;
  signInWithGoogle: any;
}

// Create auth context
const AuthContext = createContext<AuthContextProps>({
  user: null,
  loading: true,
  signUp: () => { },
  signup: () => { },
  logIn: () => { },
  login: () => { },
  logOut: () => { },
  logout: () => { },
  signInWithGoogle: () => { },
});

// Make auth context available across the app by exporting it
export const useAuth = () => useContext(AuthContext);

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

  const [user, setUser] = useState<UserType | null>(() => {
    if (storeUser) {
      return {
        email: storeUser.email,
        uid: storeUser.uid,
        role: storeUser.role,
        tier: storeUser.membership?.type,
        displayName: storeUser.displayName,
        photoURL: storeUser.photoURL,
      };
    }
    return null;
  });

  useEffect(() => {
    if (storeUser) {
      setUser({
        email: storeUser.email,
        uid: storeUser.uid,
        role: storeUser.role,
        tier: storeUser.membership?.type,
        displayName: storeUser.displayName,
        photoURL: storeUser.photoURL,
      });
    } else {
      setUser(null);
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
    if (typeof window === 'undefined' || !auth) return;

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
    <AuthContext.Provider value={{
      user,
      loading,
      signUp,
      signup: signUp,
      logIn,
      login: logIn,
      logOut,
      logout: logOut,
      signInWithGoogle
    }}>
      {children}
    </AuthContext.Provider>
  );
};
