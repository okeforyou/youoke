import { useUIStore } from "../stores/useUIStore";
import { useModule } from "../hooks/useModule";
import SpotifyDashboard from "../modules/spotify-theme/components/SpotifyDashboard";
import YouTubeDashboard from "../modules/youtube-theme/components/YouTubeDashboard";
import { PremiumLockOverlay } from "./common/PremiumLockOverlay";

interface MusicProviderContainerProps {
    showTab?: boolean;
}

/**
 * MusicProviderContainer Strategy Pattern
 * - Acts as the switch between different Music Providers (Themes).
 * - Handles access control (Premium Logic) for restricted themes.
 */
export default function MusicProviderContainer({ showTab = true }: MusicProviderContainerProps) {
    const musicTheme = useUIStore((state) => state.musicTheme);
    const { hasModule, isLoading } = useModule('youtube-theme');

    // Strategy: YouTube Theme
    if (musicTheme === 'youtube') {
        if (isLoading) {
            return (
                <div className="flex h-64 w-full items-center justify-center">
                    <span className="loading loading-spinner loading-md text-red-600"></span>
                </div>
            );
        }

        if (!hasModule) {
            return <PremiumLockOverlay />;
        }

        return <YouTubeDashboard />;
    }

    // Strategy: Spotify Theme (Default)
    return <SpotifyDashboard showTab={showTab} />;
}
