import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { auth, db } from '../../firebase';
import {
    onIdTokenChanged,
    signOut as firebaseSignOut,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    setPersistence,
    browserLocalPersistence,
    updateProfile,
    ParsedToken
} from 'firebase/auth';
import { getApps } from 'firebase/app';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import nookies from 'nookies';
import { ref, get as rtdbGet, update as rtdbUpdate } from 'firebase/database';
import { realtimeDb } from '../../firebase';
import { createNotification } from '@/services/notificationService';

interface MembershipState {
    type: 'free' | 'day_pass' | 'monthly' | 'yearly' | 'lifetime';
    status: 'active' | 'expired' | 'pending';
    startedAt: any;
    expiresAt: any | null;
}

interface UserData {
    uid: string | null;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    role: 'admin' | 'user' | 'owner';
    membership: MembershipState;
    isAdmin: boolean;
    // Marketplace & Apps
    credits?: number;
    installed_modules?: string[];
    quota?: {
        daily_limit: number;
        used: number;
        last_reset: string;
    };
}

interface UserState {
    user: UserData | null;
    isLoading: boolean;
    error: string | null;
    isHydrated: boolean;
}

interface AuthActions {
    initialize: () => () => void;
    signIn: (email: string, pass: string) => Promise<void>;
    signUp: (email: string, pass: string, name?: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signInWithLine: () => void;
    signInWithCustomToken: (token: string) => Promise<void>;
    signOut: () => Promise<void>;
    setHydrated: () => void;
    setLoading: (loading: boolean) => void;
    devLogin: () => void;
}

const DEFAULT_MEMBERSHIP: MembershipState = {
    type: 'free',
    status: 'active',
    startedAt: null,
    expiresAt: null
};

export const useAuthStore = create<UserState & AuthActions>()(
    persist(
        (set, get) => ({
            user: null,
            isLoading: true,
            error: null,
            isHydrated: false,

            setLoading: (loading: boolean) => set({ isLoading: loading }),

            initialize: () => {
                if (!auth) {
                    set({ isLoading: false, error: 'Firebase not configured' });
                    return () => { };
                }

                if (typeof window !== 'undefined') {
                    console.log('🔐 Auth Store: Initializing...', {
                        path: window.location.pathname,
                        apps: getApps().length
                    });
                }

                // 🛡️ SAFETY TIMEOUT: Force UI unlock if Firebase is slow/stuck
                const safetyTimeout = setTimeout(() => {
                    if (get().isLoading) {
                        console.warn('⚠️ Auth Init Timeout (15s). Forcing UI unlock.');
                        set({ isLoading: false });
                    }
                }, 15000);

                // 🛡️ SET PERSISTENCE: Crucial for Mobile Auth 
                if (auth) {
                    setPersistence(auth, browserLocalPersistence)
                        .then(() => console.log('🛡️ Persistence set to LOCAL'))
                        .catch(err => console.warn('🛡️ Persistence Error:', err));
                }

                // 🚀 HANDLE REDIRECT RESULTS (Crucial for Mobile Google Login)
                getRedirectResult(auth).then((result) => {
                    if (result?.user) {
                        console.log('🏁 Google Redirect Success:', result.user.uid);
                    }
                }).catch((error) => {
                    console.error('🏁 Google Redirect Error:', error);
                    set({ error: error.message, isLoading: false });
                });

                console.log('🔐 Auth Store: Registering onIdTokenChanged listener...');

                const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
                    console.time('AuthLifecycle');
                    console.log('⚡ [AuthStore] onIdTokenChanged Fired!', {
                        uid: firebaseUser?.uid,
                        isAnonymous: firebaseUser?.isAnonymous,
                        email: firebaseUser?.email
                    });
                    if (!firebaseUser) {
                        // 🛑 SYSTEM FIX: Don't kill Dev Admin session
                        const currentUser = get().user;
                        if (currentUser?.uid === 'dev-admin') {
                            console.log('🛡️ Dev Admin detected. Ignoring Firebase logout.');
                            set({ isLoading: false });
                            return;
                        }

                        set({ user: null, isLoading: false });
                        nookies.destroy(null, 'token');
                        nookies.destroy(null, 'uid');
                    } else {
                        // ⬇️ MOVED: Optimistic update removed to prevent "Ghost User Flash"
                        // We maintain isLoading: true and only set user after server validation.

                        // ⬇️ ANONYMOUS USER HANDLING (Monitor/Guest Mode)
                        if (firebaseUser.isAnonymous) {
                            console.log('👻 Anonymous User Detected:', firebaseUser.uid);

                            // 🛑 SYSTEM FIX: PREVENT GHOST LOGIN ON MAIN APP
                            // If user is guest/anonymous, ONLY allow if on designated Monitor/TV/Remote pages
                            if (typeof window !== 'undefined') {
                                const path = window.location.pathname;
                                const isAllowedGuestPage = [
                                    '/monitor',
                                    '/tv',
                                    '/receiver',
                                    '/chromecast',
                                    '/remote'
                                ].some(p => path.startsWith(p));

                                if (!isAllowedGuestPage) {
                                    console.warn('🚫 [Auth] Guest Session blocked on main app page:', path);
                                    // Set user to null immediately to clean up UI
                                    set({ user: null, isLoading: false });
                                    // Clean up Firebase session
                                    if (auth) {
                                        firebaseSignOut(auth).catch(e => console.warn('Guest cleanup failed', e));
                                    }
                                    return;
                                }
                            }

                            console.log('✅ Guest Access Allowed on designated page');
                            set({
                                user: {
                                    uid: firebaseUser.uid,
                                    email: null,
                                    displayName: 'Guest',
                                    photoURL: null,
                                    role: 'user',
                                    isAdmin: false,
                                    membership: DEFAULT_MEMBERSHIP
                                },
                                isLoading: false
                            });
                            return;
                        }

                        // Sync with backend (With Fallback for Mobile)
                        try {
                            const token = await firebaseUser.getIdToken();
                            if (!db) throw new Error("Firestore not initialized");
                            const userRef = doc(db, 'users', firebaseUser.uid);

                            // 🚀 DEEP SYNC with 7-Second Timeout (Crucial for Mobile WebSockets)
                            const syncPromise = Promise.all([
                                getDoc(userRef),
                                realtimeDb ? rtdbGet(ref(realtimeDb, `users/${firebaseUser.uid}`)) : Promise.resolve(null)
                            ]);

                            const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve('TIMEOUT'), 7000));
                            
                            const result = await Promise.race([syncPromise, timeoutPromise]);
                            
                            let userDataFromDB = null;
                            let rtdbData = null;

                            if (result === 'TIMEOUT') {
                                console.warn('⚠️ Firestore Sync Timeout (Mobile Network Issue?). Falling back to basic Auth Profile.');
                            } else {
                                const [userSnap, rtdbSnap] = result as any;
                                rtdbData = (rtdbSnap && typeof rtdbSnap.exists === 'function' && rtdbSnap.exists()) ? rtdbSnap.val() : null;

                                // Self-healing: If profile missing in BOTH or just Firestore
                                if (!userSnap.exists()) {
                                    console.log('🩹 [AuthStore] Initializing missing Firestore profile...');
                                    const newProfile = {
                                        uid: firebaseUser.uid,
                                        email: firebaseUser.email,
                                        displayName: rtdbData?.displayName || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                                        photoURL: rtdbData?.photoURL || firebaseUser.photoURL || null,
                                        role: 'user',
                                        membership: {
                                            type: 'free',
                                            status: 'active',
                                            startedAt: serverTimestamp(),
                                            expiresAt: null
                                        },
                                        quota: {
                                            daily_limit: 5,
                                            used: 0,
                                            last_reset: new Date().toISOString()
                                        },
                                        createdAt: serverTimestamp(),
                                        updatedAt: serverTimestamp(),
                                    };
                                    await setDoc(userRef, newProfile).catch(e => console.warn("Init New Profile Failed (Offline?)", e));
                                    userDataFromDB = newProfile;
                                } else {
                                    userDataFromDB = userSnap.data();
                                }
                            }

                            // Build final user object (using DB data if available, or Auth Profile as fallback)
                            let membership = userDataFromDB?.membership || DEFAULT_MEMBERSHIP;
                            let role = userDataFromDB?.role || 'user';
                            let isAdmin = userDataFromDB?.role === 'admin';

                            // 🛡️ SERVER-SIDE VALIDATION: CHECK EXPIRY
                            if (membership.expiresAt && membership.status !== 'expired') {
                                const expiry = membership.expiresAt.toDate ? membership.expiresAt.toDate() : new Date(membership.expiresAt);
                                if (new Date() > expiry) {
                                    console.warn('⚠️ Membership Expired! Downgrading to Free...');
                                    membership = {
                                        ...DEFAULT_MEMBERSHIP,
                                        status: 'expired',
                                        type: 'free'
                                    };
                                    if (result !== 'TIMEOUT') {
                                        const { updateDoc } = await import('firebase/firestore');
                                        updateDoc(userRef, { membership }).catch(e => console.error('Firestore expiry sync failed', e));
                                    }
                                }
                            }

                            // 👑 HARDCODE OWNER ROLE
                            if (firebaseUser.email === 'boonyanone@gmail.com') {
                                role = 'owner';
                                isAdmin = true;
                                console.log('👑 [AuthStore] Owner Identified: Access Granted');
                            }

                            set({
                                user: {
                                    uid: firebaseUser.uid,
                                    email: firebaseUser.email,
                                    displayName: userDataFromDB?.displayName || rtdbData?.displayName || firebaseUser.displayName || 'User',
                                    photoURL: userDataFromDB?.photoURL || rtdbData?.photoURL || firebaseUser.photoURL || null,
                                    role: role,
                                    isAdmin: isAdmin,
                                    membership: membership,
                                    installed_modules: userDataFromDB?.installed_modules || [],
                                    quota: userDataFromDB?.quota || undefined
                                },
                                isLoading: false
                            });
                            console.timeEnd('AuthLifecycle');

                            // Set cookies for SSR/Middleware if needed
                            nookies.set(null, 'token', token, { path: '/', maxAge: 3600, sameSite: 'Lax', secure: process.env.NODE_ENV === 'production' });
                            nookies.set(null, 'uid', firebaseUser.uid, { path: '/', maxAge: 3600, sameSite: 'Lax', secure: process.env.NODE_ENV === 'production' });

                        } catch (error) {
                            console.error('⚠️ Auth Database Sync Failed completely:', error);
                            // 🛑 PREVENT SILENT LOGOUT: Fallback to basic profile so UI isn't stuck
                            console.warn('🛡️ Bypassing strict validation due to network error. Trusting Firebase Auth payload.');
                            set({
                                user: {
                                    uid: firebaseUser.uid,
                                    email: firebaseUser.email,
                                    displayName: firebaseUser.displayName || 'User',
                                    photoURL: firebaseUser.photoURL || null,
                                    role: firebaseUser.email === 'boonyanone@gmail.com' ? 'owner' : 'user',
                                    isAdmin: firebaseUser.email === 'boonyanone@gmail.com',
                                    membership: DEFAULT_MEMBERSHIP,
                                },
                                isLoading: false
                            });
                        }
                    }
                });

                return () => {
                    clearTimeout(safetyTimeout);
                    unsubscribe();
                };
            },

            signIn: async (email, password) => {
                console.log('⚡ SignIn: Started');
                set({ isLoading: true, error: null });
                try {
                    if (!auth) throw new Error("Firebase Auth not initialized");
                    console.time('FirebaseSignIn');
                    const userCredential = await signInWithEmailAndPassword(auth, email, password);
                    console.timeEnd('FirebaseSignIn');

                    const firebaseUser = userCredential.user;
                    console.log('⚡ SignIn: Auth Success', firebaseUser.uid);

                    // Optimistic Update: Set user immediately to trigger redirect
                    set({
                        user: {
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            displayName: firebaseUser.displayName,
                            photoURL: firebaseUser.photoURL,
                            role: 'user',
                            isAdmin: false,
                            membership: DEFAULT_MEMBERSHIP,
                            installed_modules: [],
                            quota: undefined
                        },
                        isLoading: false
                    });
                    console.log('⚡ SignIn: State Updated');
                } catch (error: any) {
                    console.error('⚡ SignIn: Error', error);
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            signUp: async (email, password) => {
                set({ isLoading: true, error: null });
                try {
                    if (!auth || !db) throw new Error("Firebase not initialized");
                    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                    const user = userCredential.user;
                    const displayName = email.split('@')[0];

                    // Update Auth Profile immediately
                    await updateProfile(user, { displayName });

                    // Create User Profile in Firestore
                    await setDoc(doc(db, "users", user.uid), {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName || displayName,
                        photoURL: user.photoURL || null,
                        role: 'user',
                        membership: {
                            type: 'free',
                            status: 'active',
                            startedAt: serverTimestamp(),
                            expiresAt: null
                        },
                        tier: 'free',
                        credits: 0,
                        isPremium: false,
                        quota: {
                            daily_limit: 5,
                            used: 0,
                            last_reset: new Date().toISOString()
                        },
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp(),
                    });

                    // Optimistic Update
                    set({
                        user: {
                            uid: user.uid,
                            email: user.email,
                            displayName: displayName,
                            photoURL: user.photoURL,
                            role: 'user',
                            isAdmin: false,
                            membership: {
                                type: 'free',
                                status: 'active',
                                startedAt: new Date(),
                                expiresAt: null
                            },
                            installed_modules: [],
                            quota: undefined
                        },
                        isLoading: false
                    });
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            signInWithGoogle: async () => {
                console.log('⚡ GoogleSignIn: Started');
                set({ isLoading: true, error: null });
                try {
                    const provider = new GoogleAuthProvider();
                    if (!auth) throw new Error("Firebase Auth not initialized");

                    const isMobile = typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                    
                    if (isMobile) {
                        console.log('📱 GoogleSignIn: Using Redirect (Mobile optimized)');
                        await signInWithRedirect(auth, provider);
                    } else {
                        console.log('💻 GoogleSignIn: Using Popup');
                        const userCredential = await signInWithPopup(auth, provider);
                        const firebaseUser = userCredential.user;
                        console.log('⚡ GoogleSignIn: Auth Success', firebaseUser.uid);

                        set({
                            user: {
                                uid: firebaseUser.uid,
                                email: firebaseUser.email,
                                displayName: firebaseUser.displayName,
                                photoURL: firebaseUser.photoURL,
                                role: 'user',
                                isAdmin: false,
                                membership: DEFAULT_MEMBERSHIP,
                                installed_modules: [],
                                quota: undefined
                            },
                        });
                    }
                    set({ isLoading: false });
                } catch (error: any) {
                    console.error('⚡ GoogleSignIn: Error', error);
                    let msg = error.message;
                    if (error.code === 'auth/popup-closed-by-user') {
                        msg = 'การเข้าสู่ระบบถูกยกเลิก (หน้าต่างถูกปิด)';
                    }
                    set({ error: msg, isLoading: false });
                    throw error;
                }
            },

            signInWithLine: () => {
                const clientId = process.env.NEXT_PUBLIC_LINE_LOGIN_CHANNEL_ID;
                // CRITICAL: This URL must MATCH EXACTLY with LINE Developers Console
                // 1. https://playyouoke.vercel.app/login/
                // 2. http://localhost:3000/login/ (For testing)

                // Use dynamic origin for multi-domain support (Vercel + Custom Domain)
                const origin = (typeof window !== 'undefined') ? window.location.origin : 'https://play.okeforyou.com';
                const redirectUri = `${origin}/login/`;

                console.log('🔗 LINE Redirect URI:', redirectUri);
                const state = 'random_state_string'; // Should be random

                if (!clientId) {
                    console.error("LINE_LOGIN_CHANNEL_ID not set");
                    set({ error: "LINE Login Configuration Missing" });
                    return;
                }

                const lineAuthUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=profile%20openid%20email`;

                window.location.replace(lineAuthUrl);
            },

            signInWithCustomToken: async (token: string) => {
                set({ isLoading: true, error: null });
                try {
                    const { signInWithCustomToken: firebaseSignIn } = await import('firebase/auth');
                    if (!auth) throw new Error("Firebase Auth not initialized");
                    const userCredential = await firebaseSignIn(auth, token);
                    const firebaseUser = userCredential.user;
                    console.log('⚡ CustomToken SignIn: Success', firebaseUser.uid);
                    
                    // Force state update to prevent UI race conditions
                    set({ 
                        user: {
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            displayName: firebaseUser.displayName,
                            photoURL: firebaseUser.photoURL,
                            role: 'user',
                            isAdmin: false,
                            membership: DEFAULT_MEMBERSHIP,
                            installed_modules: []
                        },
                        isLoading: false 
                    });
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    throw error;
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
                    membership: {
                        type: 'yearly',
                        status: 'active',
                        startedAt: { toDate: () => new Date() }, // Mock Timestamp
                        expiresAt: { toDate: () => new Date(new Date().setFullYear(new Date().getFullYear() + 1)) }
                    }
                };
                console.log('⚡ DevLogin: Access Granted', devUser);
                set({ user: devUser, isLoading: false });
                if (typeof window !== 'undefined') {
                    // Bypass firebase persistence, just set local state
                    localStorage.setItem('auth-storage', JSON.stringify({
                        state: { user: devUser, isHydrated: true },
                        version: 0
                    }));
                    window.location.href = '/admin';
                }
            },

            signOut: async () => {
                console.log('⚡ [Debug] SignOut Action Triggered (Nuclear Mode)');
                console.trace('SignOut Trace');
                console.log('⚡ SignOut: Started (Nuclear Mode)');
                set({ isLoading: true });
                try {
                    // 1. Force clear state UI
                    set({ user: null, isLoading: false });

                    // 2. Clear All Storage
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem('auth-storage'); // Specific clear
                        // Optional: localStorage.clear(); if you want to wipe everything

                        // 3. Nuke IndexedDB (Firebase Persistence)
                        try {
                            if (window.indexedDB && window.indexedDB.databases) {
                                const dbs = await window.indexedDB.databases();
                                dbs.forEach(db => {
                                    if (db.name && db.name.includes('firebase')) {
                                        window.indexedDB.deleteDatabase(db.name);
                                    }
                                });
                                console.log('⚡ SignOut: IndexedDB Nuked');
                            }
                        } catch (e) {
                            console.warn('⚡ SignOut: IDB Cleanup Failed', e);
                        }
                    }

                    // 4. Official Firebase SignOut
                    if (auth) await firebaseSignOut(auth);
                    console.log('⚡ SignOut: Firebase Success');

                    // 5. Force Reload to clear memory and prevent resurrection
                    window.location.href = '/login';
                } catch (error: any) {
                    console.error('⚡ SignOut: Error', error);
                    set({ user: null, error: error.message, isLoading: false });
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem('auth-storage');
                    }
                    // Force redirect anyway
                    window.location.href = '/login';
                }
            },

            setHydrated: () => set({ isHydrated: true })
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
            onRehydrateStorage: () => (state) => {
                state?.setHydrated();
                if (state?.user) {
                    state.setLoading(false);
                }
            },
            partialize: (state) => {
                // 🛑 SYSTEM FIX: Do NOT persist Guest/Anonymous users
                // This prevents the "Auto-login as Guest" annoyance
                if (state.user?.displayName === 'Guest' || state.user?.email === null) {
                    return {};
                }
                return { user: state.user };
            },
        }
    )
);
