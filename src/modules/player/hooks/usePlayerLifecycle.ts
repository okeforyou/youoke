import { useState, useEffect } from 'react';
import { useSystemConfig } from '../../../hooks/useSystemConfig';
import { useAuthStore } from '@/modules/auth/useAuthStore';
import { useUIStore } from '../../../stores/useUIStore';
import { usePlayerStore } from '../stores/usePlayerStore';

export const usePlayerLifecycle = (currentSource: string | null, showDjOverlay: boolean) => {
    const { config } = useSystemConfig();
    const { user } = useAuthStore();
    const { setLimitModalOpen } = useUIStore();

    // Determine Role & Limits
    const isPremium = user ? (user.isAdmin || (user.membership?.type !== 'free' && user.membership?.status === 'active')) : false;
    const userRole = isPremium ? 'premium' : 'free';
    const limits = config?.membership?.[userRole];
    const maxDuration = limits?.max_duration_sec || 0;
    const showAds = limits?.show_ads || false; // Default false
    const maxDailySongs = limits?.max_daily_songs || 0;

    // Track Daily Songs
    const [dailyCount, setDailyCount] = useState(0);

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
