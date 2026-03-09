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
 */
export const SystemService = {
    /**
     * Get global app settings from Firestore configs/app_settings document
     */
    getAppConfig: async (): Promise<AppConfig> => {
        try {
            if (!db) {
                console.warn("⚠️ SystemService: db is not initialized");
                return DEFAULT_CONFIG;
            }

            const configRef = doc(db, "configs", "app_settings");
            const configSnap = await getDoc(configRef);

            if (configSnap.exists()) {
                const data = configSnap.data();
                return {
                    guestLimit: typeof data.guestLimit === 'number' ? data.guestLimit : DEFAULT_CONFIG.guestLimit,
                };
            }

            return DEFAULT_CONFIG;
        } catch (error) {
            console.error("❌ SystemService.getAppConfig error:", error);
            return DEFAULT_CONFIG;
        }
    }
};
