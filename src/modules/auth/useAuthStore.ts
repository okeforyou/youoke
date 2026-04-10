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
    updateProfile,
    linkWithPopup,
    linkWithRedirect
} from 'firebase/auth';
import { getApps } from 'firebase/app';
import { serverTimestamp, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import nookies from 'nookies';
import { ref, get as rtdbGet, update as rtdbUpdate } from 'firebase/database';
import { realtimeDb } from '../../firebase';
// Removed unused notification import causing lint errors

interface MembershipState {
    type: 'free' | 'day_pass' | 'monthly' | 'yearly' | 'lifetime' | 'trial';
    status: 'active' | 'expired' | 'pending';
    startedAt: any;
    expiresAt: any | null;
    showAds?: boolean;
}

interface UserData {
    uid: string | null;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    role: 'admin' | 'user' | 'owner';
    membership: MembershipState;
    isAdmin: boolean;
    isPremium: boolean;
    tier: string;
    // YouTube Shell Integration
    isYouTubeConnected?: boolean;
    youtubeEmail?: string | null;
    googleAccessToken?: string | null;
    lineUserId?: string | null;
    // Marketplace & Apps
    credits?: number;
    installed_modules?: string[];
    quota?: {
        daily_limit: number;
        used: number;
        last_reset: string;
    };
    // Expiry Notifications
    expiryStatus?: {
        isExpiringSoon: boolean;
        daysRemaining: number;
        isExpired: boolean;
    };
}

interface UserState {
    user: UserData | null;
    isLoading: boolean;
    error: string | null;
    isHydrated: boolean;
    showExpiryAlert: boolean;
}

interface AuthActions {
    initialize: () => () => void;
    signIn: (email: string, pass: string) => Promise<void>;
    signUp: (email: string, pass: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    linkGoogleAccount: () => Promise<void>;
    signInWithLine: (state?: string) => void;
    signInWithCustomToken: (token: string) => Promise<void>;
    signOut: () => Promise<void>;
    setHydrated: () => void;
    setLoading: (loading: boolean) => void;
    setExpiryAlert: (show: boolean) => void;
    devLogin: () => void;
}

const DEFAULT_MEMBERSHIP: MembershipState = {
    type: 'free',
    status: 'active',
    startedAt: null,
    expiresAt: null,
    showAds: false
};

const EXPIRED_MEMBERSHIP: MembershipState = {
    type: 'free',
    status: 'expired',
    startedAt: null,
    expiresAt: null,
    showAds: true
};

export const useAuthStore = create<UserState & AuthActions>()(
    persist(
        (set, get) => ({
            user: null,
            isLoading: true,
            error: null,
            isHydrated: false,
            showExpiryAlert: false,

            setLoading: (loading: boolean) => set({ isLoading: loading }),
            setExpiryAlert: (show: boolean) => set({ showExpiryAlert: show }),

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

                console.log('🔐 Auth Store: Initializing...');

                // 🚀 YouTube Shell: Handle Redirect Result (Non-blocking)
                getRedirectResult(auth).then(async (result) => {
                    if (result && db) {
                        const credential = GoogleAuthProvider.credentialFromResult(result);
                        const accessToken = credential?.accessToken;
                        const firebaseUser = result.user;
                        console.log('⚡ [Auth] Redirect Result Found:', firebaseUser.uid);

                        if (accessToken) {
                            const googleProfile = firebaseUser.providerData.find(p => p.providerId === 'google.com');
                            const userRef = doc(db, 'users', firebaseUser.uid);
                            const updates: any = {
                                isYouTubeConnected: true,
                                youtubeEmail: googleProfile?.email || null,
                                googleAccessToken: accessToken,
                                updatedAt: serverTimestamp()
                            };

                            const userSnap = await getDoc(userRef);
                            if (userSnap.exists()) {
                                const currentMembership = userSnap.data()?.membership;
                                if (!currentMembership || currentMembership.status !== 'active') {
                                    updates.membership = {
                                        type: 'day_pass',
                                        status: 'active',
                                        startedAt: serverTimestamp(),
                                        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                                        showAds: false
                                    };
                                }
                                await updateDoc(userRef, updates);
                                console.log('⚡ [Auth] Token persisted to Firestore.');
                            }
                        }
                    }
                }).catch(error => {
                    console.error('⚡ [Auth] Redirect Error:', error);
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
                                    isPremium: true,
                                    tier: 'day_pass',
                                    membership: DEFAULT_MEMBERSHIP
                                },
                                isLoading: false
                            });
                            return;
                        }

                        // Sync with backend (Strict Validation)
                        try {
                            const token = await firebaseUser.getIdToken();
                            if (!db) throw new Error("Firestore not initialized");
                            const userRef = doc(db, 'users', firebaseUser.uid);

                            // 🚀 DEEP SYNC: Fetch from both Databases in Parallel
                            let [userSnap, rtdbSnap] = await Promise.all([
                                getDoc(userRef),
                                realtimeDb ? rtdbGet(ref(realtimeDb, `users/${firebaseUser.uid}`)) : Promise.resolve(null)
                            ]);

                            const rtdbData = (rtdbSnap && typeof rtdbSnap.exists === 'function' && rtdbSnap.exists()) ? rtdbSnap.val() : null;

                            // Self-healing: If profile missing in BOTH or just Firestore
                            if (!userSnap.exists()) {
                                console.log('🩹 [AuthStore] Initializing missing Firestore profile...');
                                const newProfile = {
                                    uid: firebaseUser.uid,
                                    email: firebaseUser.email,
                                    displayName: rtdbData?.displayName || firebaseUser.displayName || (typeof firebaseUser.email === 'string' ? firebaseUser.email.split('@')[0] : 'User'),
                                    photoURL: rtdbData?.photoURL || firebaseUser.photoURL || null,
                                    role: 'user',
                                    membership: {
                                        type: 'day_pass',
                                        status: 'active',
                                        startedAt: serverTimestamp(),
                                        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                                        showAds: false
                                    },
                                    tier: 'free',
                                    isPremium: false,
                                    quota: {
                                        daily_limit: 5,
                                        used: 0,
                                        last_reset: new Date().toISOString()
                                    },
                                    createdAt: serverTimestamp(),
                                    updatedAt: serverTimestamp(),
                                };
                                await setDoc(userRef, newProfile);
                                userSnap = await getDoc(userRef);
                            }

                            if (userSnap.exists()) {
                                const userData = userSnap.data();
                                let membership = userData.membership || DEFAULT_MEMBERSHIP;

                                // 🛡️ SERVER-SIDE VALIDATION: CHECK EXPIRY
                                if (membership.expiresAt) {
                                    const expiry = membership.expiresAt.toDate ? membership.expiresAt.toDate() : new Date(membership.expiresAt);
                                    const now = new Date();
                                    const isExpired = now > expiry;

                                    // Calculate days remaining
                                    const diffMs = expiry.getTime() - now.getTime();
                                    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

                                    if (isExpired && membership.status !== 'expired') {
                                        // 👑 v4.9.140: NEVER Downgrade Admins/Owners
                                        if (userData.role === 'admin' || userData.role === 'owner' || firebaseUser.email === 'boonyanone@gmail.com' || firebaseUser.email === 'youoke.okeforyou@gmail.com') {
                                            console.log('🛡️ [AuthStore] Admin detected. Skipping expiry downgrade.');
                                            membership.status = 'active'; // Force active
                                            membership.type = 'lifetime'; // Force lifetime view
                                        } else {
                                            console.warn('⚠️ Membership Expired! Downgrading to Free...');
                                            membership = {
                                                ...EXPIRED_MEMBERSHIP
                                            };
                                            // Update Firestore and RTDB immediately
                                            const { updateDoc } = await import('firebase/firestore');
                                            updateDoc(userRef, { membership }).catch(e => console.error('Firestore expiry sync failed', e));

                                            if (realtimeDb) {
                                                rtdbUpdate(ref(realtimeDb, `users/${firebaseUser.uid}/subscription`), {
                                                    status: 'expired',
                                                    plan: 'free'
                                                }).catch(e => console.error('RTDB expiry sync failed', e));
                                            }

                                            // Show Alert for recently expired users
                                            set({ showExpiryAlert: true });
                                        }
                                    } else if (!isExpired && daysRemaining <= 3 && daysRemaining >= 0) {
                                        // 🔔 Warn user if expiring soon (last 3 days)
                                        set({ showExpiryAlert: true });
                                    }

                                    // Store status in UserData for UI consumption
                                    userData.expiryStatus = {
                                        isExpiringSoon: !isExpired && daysRemaining <= 3 && daysRemaining >= 0,
                                        daysRemaining: daysRemaining,
                                        isExpired: isExpired
                                    };
                                }

                                // 👑 [HARDENED ROLE SECURITY] - v4.10.140
                                // Always prioritize 'admin' or 'owner' roles if present in database OR email
                                let role = userData.role || 'user';
                                let isAdmin = false;

                                const isOwnerEmail = firebaseUser.email === 'boonyanone@gmail.com' || firebaseUser.email === 'youoke.okeforyou@gmail.com';

                                if (role === 'admin' || role === 'owner' || isOwnerEmail) {
                                    if (isOwnerEmail) {
                                        role = 'owner';
                                    } else if (role !== 'owner') {
                                        role = 'admin';
                                    }
                                    isAdmin = true;

                                    const requiredMembership = {
                                        ...membership,
                                        type: 'lifetime',
                                        status: 'active',
                                        expiresAt: null
                                    };

                                    // 🛡️ v5.3.34: Pure Flat Shield - Force sync to Firestore to fix UI discrepancies in Admin Panel
                                    if (userData.role !== role || userData.membership?.status !== 'active') {
                                        console.log('🛡️ [AuthStore] Auto-Healing Admin Role & Lifetime Data in Firestore...');
                                        const { updateDoc } = await import('firebase/firestore');
                                        updateDoc(userRef, { 
                                            role: role, 
                                            membership: requiredMembership 
                                        }).catch(e => console.warn('Admin self-healing failed', e));

                                        if (realtimeDb) {
                                            rtdbUpdate(ref(realtimeDb, `users/${firebaseUser.uid}`), {
                                                role: role,
                                            }).catch(e => console.warn('Admin RTDB self-healing failed', e));
                                            rtdbUpdate(ref(realtimeDb, `users/${firebaseUser.uid}/subscription`), {
                                                status: 'active',
                                                plan: 'lifetime'
                                            }).catch(e => console.warn('Admin RTDB sub healing failed', e));
                                        }
                                    }

                                    membership = requiredMembership;

                                    console.log(`👑 [AuthStore] ${role.toUpperCase()} Identified: Shielded Session Active`);
                                }

                                // 🛡️ SELF-HEALING: SYNC MISSING photoURL FROM AUTH PROVIDER
                                if (!userData.photoURL && firebaseUser.photoURL) {
                                    console.log('🩹 [AuthStore] Healing missing photoURL in Firestore...');
                                    const { updateDoc } = await import('firebase/firestore');
                                    updateDoc(userRef, { photoURL: firebaseUser.photoURL }).catch(e => console.warn('Self-healing failed', e));
                                }

                                set({
                                    user: {
                                        uid: firebaseUser.uid,
                                        email: firebaseUser.email,
                                        displayName: userData.displayName || rtdbData?.displayName || firebaseUser.displayName,
                                        photoURL: userData.photoURL || rtdbData?.photoURL || firebaseUser.photoURL ||
                                            `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.displayName || firebaseUser.displayName || 'YouOke')}&background=000&color=fff&bold=true`,
                                        role: role,
                                        isAdmin: isAdmin,
                                        isPremium: userData.isPremium || !!isAdmin,
                                        tier: userData.tier || (isAdmin ? 'lifetime' : 'free'),
                                        membership: membership,
                                        installed_modules: userData.installed_modules || [],
                                        quota: userData.quota || undefined,
                                        isYouTubeConnected: userData.isYouTubeConnected || firebaseUser.providerData.some(p => p.providerId === 'google.com'),
                                        youtubeEmail: userData.youtubeEmail || (firebaseUser.providerData.find(p => p.providerId === 'google.com')?.email) || null,
                                        googleAccessToken: userData.googleAccessToken || null,
                                        lineUserId: userData.lineUserId || null
                                    },
                                    isLoading: false
                                });
                                console.timeEnd('AuthLifecycle');
                            } else {
                                set({ user: null, isLoading: false }); // Should never happen due to self-healing
                            }

                            // Set cookies for SSR/Middleware if needed
                            nookies.set(null, 'token', token, { path: '/', maxAge: 3600, sameSite: 'Lax' });
                            nookies.set(null, 'uid', firebaseUser.uid, { path: '/', maxAge: 3600, sameSite: 'Lax' });
                        } catch (error) {
                            console.error('⚠️ Auth Verification Failed:', error);
                            // 🛑 CRITICAL: Revert Optimistic Update if Server Refuses
                            // This prevents "Ghost Users" who are authenticated on Firebase but banned/invalid on Firestore
                            set({ user: null, isLoading: false });
                            nookies.destroy(null, 'token');
                            nookies.destroy(null, 'uid');
                            // Ensure we kill the firebase session too
                            if (auth) firebaseSignOut(auth).catch(e => console.warn('Force logout failed', e));
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
                            isPremium: false,
                            tier: 'free',
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
                    const displayName = typeof email === 'string' ? email.split('@')[0] : 'User';

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
                            type: 'day_pass',
                            status: 'active',
                            startedAt: serverTimestamp(),
                            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                            showAds: false
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
                                type: 'day_pass',
                                status: 'active',
                                startedAt: new Date(),
                                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                                showAds: false
                            },
                            isPremium: true,
                            tier: 'day_pass',
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
                // 🛑 SAFARI/CHROME POPUP FIX: Try popup first, fallback to redirect if blocked
                try {
                    const provider = new GoogleAuthProvider();
                    if (!auth) throw new Error("Firebase Auth not initialized");

                    console.log('⚡ GoogleSignIn: Starting Popup Flow');
                    await signInWithPopup(auth, provider);
                    console.log('⚡ GoogleSignIn: Popup Success');
                } catch (error: any) {
                    console.error('⚡ GoogleSignIn: Error', error);
                    
                    // 🛡️ SMART FALLBACK: If popup is closed or blocked, use Redirect
                    if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-blocked') {
                        console.warn('🛡️ [Auth] Popup failed/blocked. Switching to Redirect Flow...');
                        const provider = new GoogleAuthProvider();
                        if (auth) {
                            await signInWithRedirect(auth, provider);
                        }
                    } else {
                        set({ error: error.message, isLoading: false });
                        throw error;
                    }
                }
            },

            linkGoogleAccount: async () => {
                console.log('⚡ LinkGoogleAccount: Started');
                set({ isLoading: true, error: null });
                try {
                    const provider = new GoogleAuthProvider();
                    if (!auth || !auth.currentUser) throw new Error("User must be logged in to link accounts");

                    console.log('⚡ LinkGoogleAccount: Starting Popup Flow');
                    await linkWithPopup(auth.currentUser, provider);
                } catch (error: any) {
                    console.error('⚡ LinkGoogleAccount: Error', error);
                    // 🛡️ SMART FALLBACK for Linking
                    if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-blocked') {
                        console.warn('🛡️ [Auth] Link Popup failed/blocked. Switching to Redirect Flow...');
                        const provider = new GoogleAuthProvider();
                        if (auth && auth.currentUser) {
                            await linkWithRedirect(auth.currentUser, provider);
                        }
                    } else {
                        set({ error: error.message, isLoading: false });
                        throw error;
                    }
                }
            },

            signInWithLine: (state?: string) => {
                const clientId = process.env.NEXT_PUBLIC_LINE_LOGIN_CHANNEL_ID;
                const queryState = state || 'auth_login'; 

                if (typeof window === 'undefined') return;

                const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                // 🛡️ v4.10.142: Ensure redirect matches the current environment
                const redirectUri = isDev 
                    ? 'http://localhost:3000/login/' 
                    : `${window.location.origin}/login/`;
                
                console.log('🔗 [AuthStore] LINE Redirect URI:', redirectUri);

                if (!clientId) {
                    console.error("LINE_LOGIN_CHANNEL_ID not set");
                    set({ error: "LINE Login Configuration Missing" });
                    return;
                }

                const lineAuthUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${queryState}&scope=profile%20openid%20email&bot_prompt=aggressive`;

                window.location.replace(lineAuthUrl);
            },

            signInWithCustomToken: async (token: string) => {
                set({ isLoading: true, error: null });
                try {
                    const { signInWithCustomToken } = await import('firebase/auth');
                    if (!auth) throw new Error("Firebase Auth not initialized");
                    const userCredential = await signInWithCustomToken(auth, token);
                    const firebaseUser = userCredential.user;
                    console.log('⚡ CustomToken SignIn: Success', firebaseUser.uid);

                    // Optimistic Update: Skip waiting for global listener to trigger instant redirect
                    set({
                        user: {
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            displayName: firebaseUser.displayName,
                            photoURL: firebaseUser.photoURL,
                            role: 'user',
                            isAdmin: false,
                            isPremium: false,
                            tier: 'free',
                            membership: DEFAULT_MEMBERSHIP,
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

                    // 5. Force Reload to clear memory and prevent resurrection (Redirect to Home)
                    window.location.href = '/';
                } catch (error: any) {
                    console.error('⚡ SignOut: Error', error);
                    set({ user: null, error: error.message, isLoading: false });
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem('auth-storage');
                    }
                    // Force redirect anyway (Redirect to Home)
                    window.location.href = '/';
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
