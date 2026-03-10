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
    // We enforce YouTubeDashboard for everyone now, as it is the primary interface.
    // Membership logic can be handled inside the dashboard components if needed.
    return <YouTubeDashboard />;
}
