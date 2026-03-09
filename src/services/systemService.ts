import { db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";

export interface AppConfig {
    guestLimit: number;
    // Add more config fields here if needed
}

const DEFAULT_CONFIG: AppConfig = {
    guestLimit: 3,
};

/**
 * Service to fetch global application configuration from Firestore.
 * Reads from the same 'settings/default' document used by the Admin ConfigPage.
 */
export const SystemService = {
    /**
     * Get guest limit from the admin-managed config at settings/default -> tv.guestSongLimit
     */
    getAppConfig: async (): Promise<AppConfig> => {
        try {
            if (!db) {
                console.warn("⚠️ SystemService: db is not initialized");
                return DEFAULT_CONFIG;
            }

            const configRef = doc(db, "settings", "default");
            const configSnap = await getDoc(configRef);

            if (configSnap.exists()) {
                const data = configSnap.data();
                const guestLimit = data?.tv?.guestSongLimit;
                return {
                    guestLimit: typeof guestLimit === 'number' ? guestLimit : DEFAULT_CONFIG.guestLimit,
                };
            }

            return DEFAULT_CONFIG;
        } catch (error) {
            console.error("❌ SystemService.getAppConfig error:", error);
            return DEFAULT_CONFIG;
        }
    }
};
