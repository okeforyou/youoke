import { useState, useEffect } from 'react';
import { useSystemConfig } from '../../../hooks/useSystemConfig';
import { DEFAULT_CONFIG } from '../../../services/systemConfigService';
import { useAuthStore } from '@/modules/auth/useAuthStore';
import { useUIStore } from '../../../stores/useUIStore';
import { usePlayerStore } from '../stores/usePlayerStore';
import { db } from '../../../firebase';
import { doc, getDoc } from 'firebase/firestore';

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

    useEffect(() => {
        if (!currentSource || maxDailySongs === 0 || showDjOverlay) return;

        const today = new Date().toISOString().split('T')[0];
        const storageKey = `daily_songs_${today}`;
        const currentCount = parseInt(localStorage.getItem(storageKey) || '0');

        // Update local state
        setDailyCount(currentCount);

        console.log(`📊 Daily Play Count: ${currentCount} / ${maxDailySongs}`);

        if (currentCount >= maxDailySongs) {
            console.log("⛔ Daily limit reached!");
            usePlayerStore.setState({ isPlaying: false }); // Stop playback
            setLimitModalOpen(true); // Trigger Global Modal
            return;
        }

        // Increment count
        const hasCountedKey = `counted_${currentSource}`;
        if (!sessionStorage.getItem(hasCountedKey)) {
            const newCount = currentCount + 1;
            localStorage.setItem(storageKey, newCount.toString());
            sessionStorage.setItem(hasCountedKey, 'true');
            setDailyCount(newCount);
        }

    }, [currentSource, maxDailySongs, showDjOverlay, setLimitModalOpen]);

    useEffect(() => {
        console.log("🔍 SidebarPlayer Limits Updated:", { userRole, maxDuration, showAds, configLoaded: !!config });
    }, [userRole, maxDuration, showAds, config]);

    return {
        dailyCount,
        maxDailySongs,
        maxDuration,
        showAds,
        userRole
    };
};
