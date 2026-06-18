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

  const [user, setUser] = useState<UserType | null>(null);

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

  // Removed periodic ID token refresh to drastically reduce Firestore Document Reads quota.
  // Firebase SDK automatically refreshes tokens 5 minutes before they expire (every 55 minutes).
  useEffect(() => {
    // Left intentionally empty to preserve effect structure if needed
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
