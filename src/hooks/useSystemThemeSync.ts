
import { useEffect, useRef } from 'react';
import { useSystemConfig } from './useSystemConfig';
import { useUIStore } from '../stores/useUIStore';

/**
 * Synchronizes the Application Theme (Music Provider) with the System Configuration.
 * - On Initial Load: Sets the theme to the Admin's default provider.
 * - On Config Change: Updates the theme if the default provider changes.
 */
export const useSystemThemeSync = () => {
    const { config, loading } = useSystemConfig();
    const setMusicTheme = useUIStore((state) => state.setMusicTheme);
    const musicTheme = useUIStore((state) => state.musicTheme);

    // To track if we've already synced once to avoid overriding user manual changes too aggressively
    // However, for "Default Provider" enforcement, usually we want it to stick on load.
    const isSynced = useRef(false);

    useEffect(() => {
        if (!loading && config && config.player) {
            const defaultProvider = config.player.defaultProvider || 'spotify';

            // Only sync if the current theme is different from the default
            // AND we haven't synced yet (On Mount)
            // OR if you want to force it real-time, remove the isSynced check.
            // Let's settle on: Sync on Mount AND when the config value explicitly changes.

            if (musicTheme !== defaultProvider && !isSynced.current) {
                console.log(`[SystemSync] Setting Default Provider to: ${defaultProvider}`);
                setMusicTheme(defaultProvider);
                isSynced.current = true;
            }
        }
    }, [config, loading, setMusicTheme, musicTheme]);
};
