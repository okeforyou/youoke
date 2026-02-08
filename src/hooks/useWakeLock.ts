import { useEffect, useRef } from "react";

export function useWakeLock(isCasting: boolean, isMoniter: boolean) {
    const wakeLockRef = useRef<any>(null);

    useEffect(() => {
        // Only apply wake lock for Remote (not Monitor)
        if (isMoniter) return;

        const requestWakeLock = async () => {
            // Only request wake lock when casting
            if (!isCasting) {
                // Release wake lock if not casting
                if (wakeLockRef.current) {
                    try {
                        await wakeLockRef.current.release();
                        wakeLockRef.current = null;
                        console.log('📱 Screen wake lock released');
                    } catch (err) {
                        console.warn('⚠️ Failed to release wake lock:', err);
                    }
                }
                return;
            }

            // Check if Wake Lock API is supported
            if (!('wakeLock' in navigator)) {
                console.warn('⚠️ Screen Wake Lock API not supported');
                return;
            }

            try {
                // Request screen wake lock
                wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
                console.log('✅ Screen wake lock activated - screen will not sleep during cast');

                // Listen for wake lock release (e.g., when tab becomes hidden)
                wakeLockRef.current.addEventListener('release', () => {
                    console.log('📱 Screen wake lock was released');
                });
            } catch (err) {
                console.warn('⚠️ Failed to request wake lock:', err);
            }
        };

        requestWakeLock();

        // Re-request wake lock when visibility changes (e.g., returning to tab)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && isCasting && !wakeLockRef.current) {
                console.log('📱 Tab visible again, re-requesting wake lock...');
                requestWakeLock();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Cleanup
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (wakeLockRef.current) {
                wakeLockRef.current.release().catch((err: any) => {
                    console.warn('⚠️ Failed to release wake lock on cleanup:', err);
                });
            }
        };
    }, [isCasting, isMoniter]);
}
