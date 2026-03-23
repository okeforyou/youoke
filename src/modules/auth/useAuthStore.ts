import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
    getAuth, 
    onIdTokenChanged, 
    signInWithEmailAndPassword, 
    signOut as firebaseSignOut, 
    GoogleAuthProvider,
    signInWithRedirect,
    getRedirectResult,
    updateProfile,
    linkWithRedirect,
    setPersistence,
    browserLocalPersistence
} from 'firebase/auth';
import { getApps } from 'firebase/app';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { ref, update as rtdbUpdate, get as rtdbGet } from 'firebase/database';
import nookies from 'nookies';

// Mock/Fallback structures
const DEFAULT_MEMBERSHIP = { type: 'free', status: 'pending' };

export interface UserData {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    role: 'user' | 'admin';
    isAdmin: boolean;
    membership: any;
    installed_modules?: string[];
    quota?: any;
    isYouTubeConnected?: boolean;
    youtubeEmail?: string | null;
    googleAccessToken?: string | null;
    credits?: number;
}

interface AuthState {
    user: UserData | null;
    isLoading: boolean;
    isHydrated: boolean;
    error: string | null;
    initialize: () => void;
    signInWithGoogle: () => Promise<void>;
    linkGoogleAccount: () => Promise<void>;
    signInWithCustomToken: (token: string) => Promise<void>;
    devLogin: () => void;
    signOut: () => Promise<void>;
    setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isLoading: true,
            isHydrated: false,
            error: null,

            initialize: async () => {
                const apps = getApps();
                if (apps.length === 0) return;
                const auth = getAuth(apps[0]);
                const { getFirestore } = await import('firebase/firestore');
                const db = getFirestore(apps[0]);
                const { getDatabase } = await import('firebase/database');
                const realtimeDb = getDatabase(apps[0]);

                console.log('🔐 Auth Store: Initializing...');

                // 1. Handle Redirect Result (For YouTube Shell Identity capture)
                try {
                    const result = await getRedirectResult(auth);
                    if (result) {
                        const credential = GoogleAuthProvider.credentialFromResult(result);
                        const accessToken = credential?.accessToken;
                        const firebaseUser = result.user;
                        
                        console.log('⚡ [Auth] Redirect Login Success:', firebaseUser.uid);
                        
                        if (accessToken && db) {
                            const userRef = doc(db, 'users', firebaseUser.uid);
                            const googleProfile = firebaseUser.providerData.find(p => p.providerId === 'google.com');
                            
                            const updates: any = {
                                isYouTubeConnected: true,
                                youtubeEmail: googleProfile?.email || null,
                                googleAccessToken: accessToken,
                                updatedAt: serverTimestamp()
                            };

                            // Grant 1-day pass if needed
                            const userSnap = await getDoc(userRef);
                            if (userSnap.exists()) {
                                const currentMembership = userSnap.data()?.membership;
                                if (!currentMembership || currentMembership.status !== 'active') {
                                    updates.membership = {
                                        type: 'day_pass',
                                        status: 'active',
                                        startedAt: serverTimestamp(),
                                        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
                                    };
                                }
                                await updateDoc(userRef, updates);
                            } else {
                                // Profile doesn't exist yet, it will be created in onIdTokenChanged
                                // tokens will be saved during that creation if we store them in state now
                                set({ user: { ...get().user, googleAccessToken: accessToken } as any });
                            }
                        }
                    }
                } catch (error: any) {
                    console.error('⚡ [Auth] Redirect Result Error:', error);
                    set({ error: error.message });
                }

                // 2. Register Global Listener
                const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
                    console.time('AuthLifecycle');
                    if (!firebaseUser) {
                        const currentUser = get().user;
                        if (currentUser?.uid === 'dev-admin') {
                            set({ isLoading: false });
                            return;
                        }
                        set({ user: null, isLoading: false });
                        nookies.destroy(null, 'token');
                        nookies.destroy(null, 'uid');
                    } else {
                        try {
                            const token = await firebaseUser.getIdToken();
                            const userRef = doc(db, 'users', firebaseUser.uid);
                            let [userSnap, rtdbSnap] = await Promise.all([
                                getDoc(userRef),
                                realtimeDb ? rtdbGet(ref(realtimeDb, `users/${firebaseUser.uid}`)) : Promise.resolve(null)
                            ]);

                            const rtdbData = (rtdbSnap && typeof rtdbSnap.exists === 'function' && rtdbSnap.exists()) ? rtdbSnap.val() : null;

                            if (!userSnap.exists()) {
                                const newProfile: any = {
                                    uid: firebaseUser.uid,
                                    email: firebaseUser.email,
                                    displayName: rtdbData?.displayName || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                                    photoURL: rtdbData?.photoURL || firebaseUser.photoURL || null,
                                    role: 'user',
                                    membership: {
                                        type: 'day_pass',
                                        status: 'active',
                                        startedAt: serverTimestamp(),
                                        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
                                    },
                                    quota: { daily_limit: 5, used: 0, last_reset: new Date().toISOString() },
                                    createdAt: serverTimestamp(),
                                    updatedAt: serverTimestamp(),
                                };
                                // Capture token if it was just received in getRedirectResult
                                if (get().user?.googleAccessToken) {
                                    newProfile.googleAccessToken = get().user?.googleAccessToken;
                                    newProfile.isYouTubeConnected = true;
                                    newProfile.youtubeEmail = firebaseUser.email;
                                }
                                await setDoc(userRef, newProfile);
                                userSnap = await getDoc(userRef);
                            }

                            if (userSnap.exists()) {
                                const userData = userSnap.data();
                                set({
                                    user: {
                                        uid: firebaseUser.uid,
                                        email: firebaseUser.email,
                                        displayName: userData.displayName || firebaseUser.displayName,
                                        photoURL: userData.photoURL || firebaseUser.photoURL,
                                        role: userData.role || 'user',
                                        isAdmin: userData.role === 'admin',
                                        membership: userData.membership || DEFAULT_MEMBERSHIP,
                                        installed_modules: userData.installed_modules || [],
                                        quota: userData.quota,
                                        isYouTubeConnected: userData.isYouTubeConnected || false,
                                        youtubeEmail: userData.youtubeEmail || null,
                                        googleAccessToken: userData.googleAccessToken || null
                                    },
                                    isLoading: false
                                });
                                // Set Cookies for Middleware
                                nookies.set(null, 'token', token, { path: '/' });
                                nookies.set(null, 'uid', firebaseUser.uid, { path: '/' });
                            }
                        } catch (err: any) {
                            console.error('🔥 Auth Sync Error:', err);
                            set({ error: err.message, isLoading: false });
                        }
                    }
                    console.timeEnd('AuthLifecycle');
                });

                return () => unsubscribe();
            },

            signInWithGoogle: async () => {
                const apps = getApps();
                const auth = getAuth(apps[0]);
                const provider = new GoogleAuthProvider();
                provider.addScope('https://www.googleapis.com/auth/youtube.readonly');
                set({ isLoading: true, error: null });
                try {
                    await signInWithRedirect(auth, provider);
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                }
            },

            linkGoogleAccount: async () => {
                const apps = getApps();
                const auth = getAuth(apps[0]);
                const provider = new GoogleAuthProvider();
                provider.addScope('https://www.googleapis.com/auth/youtube.readonly');
                if (!auth.currentUser) return;
                set({ isLoading: true, error: null });
                try {
                    await linkWithRedirect(auth.currentUser, provider);
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                }
            },

            signInWithCustomToken: async (token: string) => {
                const apps = getApps();
                const auth = getAuth(apps[0]);
                set({ isLoading: true, error: null });
                try {
                    const { signInWithCustomToken: firebaseSignIn } = await import('firebase/auth');
                    await firebaseSignIn(auth, token);
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                }
            },

            devLogin: () => {
                const devUser: UserData = {
                    uid: 'dev-admin',
                    email: 'admin@localhost',
                    displayName: 'Dev Admin',
                    photoURL: null,
                    role: 'admin',
                    isAdmin: true,
                    membership: { type: 'yearly', status: 'active' }
                };
                set({ user: devUser, isLoading: false });
            },

            signOut: async () => {
                const apps = getApps();
                const auth = getAuth(apps[0]);
                set({ isLoading: true });
                try {
                    await firebaseSignOut(auth);
                    set({ user: null, isLoading: false });
                    nookies.destroy(null, 'token');
                    nookies.destroy(null, 'uid');
                    localStorage.removeItem('auth-storage');
                    window.location.href = '/';
                } catch (error: any) {
                    set({ isLoading: false, error: error.message });
                }
            },

            setHydrated: () => set({ isHydrated: true })
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
            onRehydrateStorage: () => (state) => {
                state?.setHydrated();
            }
        }
    )
);
