import { useState, useEffect } from 'react';
import { useSystemConfig } from '../../../hooks/useSystemConfig';
import { DEFAULT_CONFIG } from '../../../services/systemConfigService';
import { useAuthStore } from '@/modules/auth/useAuthStore';
import { useUIStore } from '../../../stores/useUIStore';
import { usePlayerStore } from '../stores/usePlayerStore';
import { db } from '../../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const usePlayerLifecycle = (currentSource: string | null, showDjOverlay: boolean) => {
    const { config } = useSystemConfig();
    const { user } = useAuthStore();
    const { setLimitModalOpen } = useUIStore();

    const [dailyCount, setDailyCount] = useState(0);
    const [planLimits, setPlanLimits] = useState<{ maxDailySongs: number, showAds: boolean, maxDuration: number } | null>(null);

    // 🏷️ Role Resolution Logic (Guest vs Free vs Premium)
    let userRole: string = 'guest';
    if (user) {
        userRole = user.membership?.type || 'free';
    }

    // Load Plan Limits from Database
    useEffect(() => {
        const fetchPlan = async () => {
            if (!db) return;
            try {
                const planRef = doc(db, 'plans', userRole);
                const planSnap = await getDoc(planRef);
                
                if (planSnap.exists()) {
                    const data = planSnap.data();
                    setPlanLimits({
                        maxDailySongs: data.maxDailySongs || 0,
                        showAds: data.showAds ?? true,
                        maxDuration: data.maxDurationSec || 0
                    });
                } else {
                    // Fallback to System Config / Defaults
                    const role = (userRole as 'guest' | 'free' | 'premium') || 'guest';
                    const limits = config?.membership?.[role] || DEFAULT_CONFIG.membership[role] || DEFAULT_CONFIG.membership.guest;
                    setPlanLimits({
                        maxDailySongs: limits?.max_daily_songs || 0,
                        showAds: limits?.show_ads ?? true,
                        maxDuration: limits?.max_duration_sec || 0
                    });
                }
            } catch (err) {
                console.error("Error fetching plan limits:", err);
            }
        };

        fetchPlan();
    }, [userRole, db, config]);

    const maxDailySongs = planLimits?.maxDailySongs || 0;
    const showAds = planLimits?.showAds ?? true;
    const maxDuration = planLimits?.maxDuration || 0;

    // Initial Load
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const today = new Date().toISOString().split('T')[0];
            const storageKey = `daily_songs_${today}`;
            setDailyCount(parseInt(localStorage.getItem(storageKey) || '0'));
        }
    }, [currentSource]);

    // 🏷️ Quota Enforcement Logic
    useEffect(() => {
        if (!currentSource || showDjOverlay) return;

        // 1. Determine local source of truth
        const today = new Date().toISOString().split('T')[0];
        const storageKey = `daily_songs_${today}`;
        
        let currentCount = 0;
        let limit = maxDailySongs;

        if (user) {
            // Logged in user: use their quota from profile
            currentCount = user.quota?.used || 0;
            limit = user.quota?.daily_limit || 0;
            
            // If they are on a lifetime or premium plan without specific quota, give them "virtual unlimited"
            if (userRole === 'lifetime' || userRole === 'premium' || user.role === 'admin') {
                limit = -1; // Unlimited
            }
        } else {
            // Guest: use local storage
            currentCount = parseInt(localStorage.getItem(storageKey) || '0');
        }

        setDailyCount(currentCount);

        console.log(`📊 Quota Check: [${userRole}] ${currentCount} / ${limit === -1 ? 'Unlimited' : limit}`);

        // 2. Check Limit (Block if zero or reached)
        // If limit is -1, it's unlimited. If limit is 0, it's blocked.
        if (limit !== -1 && currentCount >= limit) {
            console.log("⛔ Daily limit reached! Blocking playback.");
            usePlayerStore.setState({ isPlaying: false });
            setLimitModalOpen(true);
            return;
        }

        // 3. Increment logic
        const hasCountedKey = `counted_${currentSource}`;
        if (!sessionStorage.getItem(hasCountedKey)) {
            const newCount = currentCount + 1;
            
            // Update Local Storage (for guest fallback)
            localStorage.setItem(storageKey, newCount.toString());
            sessionStorage.setItem(hasCountedKey, 'true');
            setDailyCount(newCount);

            // 💾 Update Firestore for logged in users
            if (user?.uid && db) {
                console.log(`💾 Syncing Quota to Firestore: ${newCount}`);
                const userRef = doc(db, 'users', user.uid);
                setDoc(userRef, {
                    quota: {
                        used: newCount,
                        last_play: today
                    }
                }, { merge: true }).catch((err: any) => console.error("Quota sync error:", err));
            }
        }

    }, [currentSource, maxDailySongs, showDjOverlay, setLimitModalOpen, user, userRole]);

    return {
        dailyCount,
        maxDailySongs,
        maxDuration,
        showAds,
        userRole
    };
};
