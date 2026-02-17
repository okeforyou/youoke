import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../../../firebase";

export const DEFAULT_CONFIG = {
    maintenanceMode: false,
    announcement: {
        enabled: false,
        message: "",
        type: "info"
    },
    general: {
        siteName: "YouOke",
        siteDescription: "คาราโอเกะออนไลน์บน YouTube",
        maxGuestsPerRoom: 10,
        defaultLanguage: "th"
    },
    features: {
        guestMode: true,
        registration: true,
        search: true,
        remoteControl: true,
        cast: true,
        karaokeMode: true,
        queue: true,
        shareRoom: true,
        voiceControl: false,
        lyrics: false,
        midi: false
    },
    content: {
        login: {
            title: "Welcome to YouOke",
            subtitle: "Sing your heart out!",
            features: [],
            termsLink: "",
            privacyLink: ""
        }
    },
    player: {
        defaultVolume: 80,
        crossfade: 3,
        autoplay: true,
        defaultProvider: 'spotify'
    },
    ui: {
        showHero: true,
        showTrending: true,
        showGenres: true,
        font: {
            family: "Kanit",
            url: "https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;700&display=swap"
        }
    },
    integrations: {
        youtube: { useApi: false, apiKeys: [] },
        spotify: { enabled: true, clientId: "", clientSecret: "", refreshToken: "" }
    },
    membership: {
        free: {
            max_daily_songs: 20,
            max_duration_sec: 0,
            allow_cast: false,
            allow_remote: true,
            show_ads: true,
        },
        premium: {
            max_daily_songs: 9999,
            max_duration_sec: 0,
            allow_cast: true,
            allow_remote: true,
            show_ads: false,
        },
    },
    payment: {
        bankAccount: { bankName: "", accountName: "", accountNumber: "", branch: "" },
        promptPay: { id: "", name: "" }
    }
};

export const SystemConfigService = {
    getConfig: async () => {
        if (!db) return DEFAULT_CONFIG;
        try {
            const docRef = doc(db, "settings", "default");
            const snapshot = await getDoc(docRef);
            if (snapshot.exists()) {
                return { ...DEFAULT_CONFIG, ...snapshot.data() };
            }
            return DEFAULT_CONFIG;
        } catch (error) {
            console.error("Error fetching config:", error);
            return DEFAULT_CONFIG;
        }
    },

    updateConfig: async (newConfig: any) => {
        if (!db) throw new Error("Firebase not initialized");
        const docRef = doc(db, "settings", "default");
        await setDoc(docRef, newConfig, { merge: true });
    },

    subscribeToConfig: (callback: (config: any) => void) => {
        if (!db) return () => { };
        const docRef = doc(db, "settings", "default");
        return onSnapshot(docRef, (doc) => {
            if (doc.exists()) {
                callback({ ...DEFAULT_CONFIG, ...doc.data() });
            } else {
                callback(DEFAULT_CONFIG);
            }
        });
    }
};
