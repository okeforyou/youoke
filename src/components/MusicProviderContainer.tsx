import { useUIStore } from "../stores/useUIStore";
import { useModule } from "../hooks/useModule";
import SpotifyDashboard from "../modules/spotify-theme/components/SpotifyDashboard";
import YouTubeDashboard from "../modules/youtube-theme/components/YouTubeDashboard";
import { PremiumLockOverlay } from "./common/PremiumLockOverlay";

interface MusicProviderContainerProps {
    showTab?: boolean;
    mode?: 'default' | 'listening' | 'genres';
}

/**
 * MusicProviderContainer Strategy Pattern
 * - Acts as the switch between different Music Providers (Themes).
 * - Handles access control (Premium Logic) for restricted themes.
 */
export default function MusicProviderContainer({ showTab = true, mode = 'default' }: MusicProviderContainerProps) {
    // Restored Spotify Dashboard as the primary interface, backed by cached data
    return <SpotifyDashboard mode={mode} />;
}
