import { useState, useEffect } from 'react';
import { useSystemConfig } from '../../../hooks/useSystemConfig';
import { safeSplit } from '@/utils/stringUtils';
import { DEFAULT_CONFIG } from '../../../services/systemConfigService';
import { useAuthStore } from '@/modules/auth/useAuthStore';
import { useUIStore } from '../../../stores/useUIStore';
import { usePlayerStore } from '../stores/usePlayerStore';
import { db } from '../../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export const usePlayerLifecycle = (currentSource: string | null, showDjOverlay: boolean) => {
    const { config } = useSystemConfig();
    const { user } = useAuthStore();
    const { setLimitModalOpen } = useUIStore();

    const [dailyCount, setDailyCount] = useState(0);
    const [planLimits, setPlanLimits] = useState<{ maxDailySongs: number, showAds: boolean } | null>(null);

    // 🏷️ Role Resolution Logic (Guest vs Free vs Premium)
    let userRole: string = 'guest';
    if (user) {
        userRole = user.membership?.type || 'free';
        // Normalize role for plan lookup if needed
        if (['monthly', 'yearly', 'day_pass', 'trial', 'lifetime'].includes(userRole)) {
            userRole = 'premium'; 
        }
    }

    // Set Initial Limits from User Profile or System Config
    useEffect(() => {
        if (!config) return;

        const role = (userRole as 'guest' | 'free' | 'premium') || 'guest';
        
        // Use user's specific membership properties if available (e.g. from useAuthStore)
        const membershipLimits = user?.membership;
        
        // Get defaults from system config
        const defaultLimits = config.membership?.[role] || DEFAULT_CONFIG.membership[role] || DEFAULT_CONFIG.membership.guest;
        
        // 🛡️ HARD PROTECTION: Non-guests should NOT use guest-level defaults
        const actualMaxDuration = (role !== 'guest' && (defaultLimits.max_duration_sec === undefined || defaultLimits.max_duration_sec === null)) 
            ? 0 
            : (defaultLimits.max_duration_sec || 0);

        setPlanLimits({
            maxDailySongs: defaultLimits.max_daily_songs || 0,
            showAds: membershipLimits?.showAds ?? defaultLimits.show_ads ?? true
        });
    }, [userRole, config, user?.membership]);

    const maxDailySongs = planLimits?.maxDailySongs || 0;
    const showAds = planLimits?.showAds ?? true;
    const maxDuration = 0; // Duration limit removed entirely (v2.10.3)

    // Initial Load
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const today = safeSplit(new Date().toISOString(), 'T')[0];
            const storageKey = `daily_songs_${today}`;
            setDailyCount(parseInt(localStorage.getItem(storageKey) || '0'));
        }
    }, [currentSource]);

    // 🏷️ Quota Enforcement Logic
    useEffect(() => {
        if (!currentSource || showDjOverlay) return;

        // 1. Determine local source of truth
        const today = safeSplit(new Date().toISOString(), 'T')[0];
        const storageKey = `daily_songs_${today}`;
        
        let currentCount = 0;
        let limit = maxDailySongs;

        if (user) {
            // Logged in user: use their quota from profile
            currentCount = user.quota?.used || 0;
            limit = user.quota?.daily_limit !== undefined ? user.quota.daily_limit : maxDailySongs; // Fallback to plan limit
            
            // 🛡️ UNLIMITED CHECK: If they are on any premium plan or are Admin
            const isUnlimited = 
                ['premium', 'monthly', 'yearly', 'lifetime', 'day_pass'].includes(user.membership?.type || '') ||
                user.role === 'admin' ||
                user.role === 'owner' ||
                user.isAdmin;

            if (isUnlimited) {
                limit = -1; // Unlimited
            }
        } else {
            // Guest: use local storage
            currentCount = parseInt(localStorage.getItem(storageKey) || '0');
        }

        // Development / Preview Bypass
        if (typeof window !== 'undefined' && window.location.hostname !== 'play.okeforyou.com') {
            limit = -1; // Unlimited for preview deployments and local testing
        }

        setDailyCount(currentCount);

        console.log(`📊 Quota Check: [${userRole}] ${currentCount} / ${limit === -1 ? 'Unlimited' : limit}`);

        // 2. Check Limit (Block if zero or reached)
        // If limit is -1, it's unlimited. If limit is 0, it's blocked.
        if (limit !== -1 && currentCount >= limit) {
            console.log(`⛔ Daily limit reached! Blocking playback. (${currentCount}/${limit})`);
            usePlayerStore.setState({ isPlaying: false });
            setLimitModalOpen(true);
            return;
        }

        // 4. Medley/Long Video Check (Removed v2.10.3 - Gated at Playback Level instead)

        // 5. Increment logic
        const hasCountedKey = `counted_${currentSource}`;
        if (!sessionStorage.getItem(hasCountedKey)) {
            const newCount = currentCount + 1;
            
            // Update Local Storage (for guest fallback)
            localStorage.setItem(storageKey, newCount.toString());
            sessionStorage.setItem(hasCountedKey, 'true');
            setDailyCount(newCount);

            // 💾 Update Firestore for logged in users (Avoid Guest sync)
            const isGuest = !user || user.displayName === 'Guest';
            if (user?.uid && !isGuest && db) {
                console.log(`💾 Syncing Quota to Firestore: ${newCount}`);
                const userRef = doc(db, 'users', user.uid);
                updateDoc(userRef, {
                    quota: {
                        used: newCount,
                        last_play: today
                    }
                }).catch((err: any) => console.error("Quota sync error:", err));
            }
        }

    }, [currentSource, maxDailySongs, maxDuration, showDjOverlay, setLimitModalOpen, user, userRole, config]);

    return {
        dailyCount,
        maxDailySongs,
        maxDuration,
        showAds,
        userRole
    };
};
