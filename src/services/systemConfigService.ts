import { db } from "@/firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

export interface SystemConfig {
    // Global System Controls
    maintenanceMode: boolean;
    announcement: {
        enabled: boolean;
        message: string;
        type: 'info' | 'warning' | 'error';
    };

    // Marketplace Controls
    disabledModules: string[];

    // Feature Flags
    features: {
        guestMode: boolean;
        registration: boolean;
        search: boolean;
        remoteControl: boolean;
        cast: boolean;
        karaokeMode: boolean;
    };

    // Player Settings
    player: {
        defaultVolume: number;
        crossfade: number;
        allowedSources: ('youtube' | 'spotify')[];
        autoplay: boolean;
        defaultProvider: 'spotify' | 'youtube';
    };

    // UI Configuration
    ui: {
        showHero: boolean;
        showTrending: boolean;
        showGenres: boolean;
        themeColor: 'default' | 'red' | 'blue';
        genres?: string[]; // Dynamic genres
        hero?: {
            title: string;
            description: string;
            imageUrl: string;
        };
        font?: {
            family: string;
            googleFontsUrl?: string; // Optional if using presets
            baseFontSize?: number; // Base rem scale (default 16)
            sidebarFontSize?: number;
            variableName?: string;
        };
    };

    membership: {
        guest: {
            max_daily_songs: number;
            max_duration_sec: number;
            allow_cast: boolean;
            allow_remote: boolean;
            show_ads: boolean;
        };
        free: {
            max_daily_songs: number;
            max_duration_sec: number;
            allow_cast: boolean;
            allow_remote: boolean;
            show_ads: boolean;
        };
        premium: {
            max_daily_songs: number;
            max_duration_sec: number;
            allow_cast: boolean;
            allow_remote: boolean;
            show_ads: boolean;
        };
    };

    // Third-Party Integrations
    integrations: {
        youtube: {
            apiKeys: string[];
            useApi: boolean;
        };
        spotify: {
            clientId: string;
            clientSecret: string;
            refreshToken: string;
            enabled: boolean;
            market?: string; // e.g. 'TH'
            categories?: Record<string, string>; // e.g. { thai_pop: '0JQ5DAqbMKFHKcd02e071a' }
        };
        invidious: {
            instances: string[];
            enabled: boolean;
        };
    };

    // Payment Configuration (Dynamic)
    payment: {
        bankAccount: {
            bankName: string;
            accountName: string;
            accountNumber: string;
            branch?: string;
        };
        promptPay?: {
            id: string; // Phone or TaxID
            name: string;
            qrImageUrl?: string; // Static QR Image URL
        };
    };

    // Upsell / Marketing Configuration
    upsell: {
        title: string;
        subtitle: string;
        offer_text: string;
        offer_subtext: string;
        button_text: string;
    };
    recommendations: {
        topics: string[];
    };
    content: {
        login: {
            title: string;
            subtitle: string;
            termsLink?: string;
            privacyLink?: string;
            features: { title: string; desc: string; link?: string }[]
        }
    };
    tv: {
        template: 'classic' | 'ads' | 'split' | 'video';
        signageMessages: string[];
        signageImages: string[];
        ads: { type: 'image' | 'video', url: string, title?: string }[];
        guestSongLimit: number;
    };
}

// Firestore Collection: settings, Document: default
const CONFIG_COLLECTION = "settings";
const CONFIG_DOC_ID = "default";

export const DEFAULT_CONFIG: SystemConfig = {
    maintenanceMode: false,
    announcement: {
        enabled: false,
        message: "Welcome to YouOke! System maintenance is scheduled for Sunday.",
        type: 'info'
    },
    disabledModules: [],
    recommendations: {
        topics: [
            "Thailand Top 50",
            "เพลงฮิต TikTok",
            "ลูกทุ่งมาแรง",
            "เพลงใหม่ล่าสุด",
            "Viral Hits Thailand",
            "แกรมมี่ โกลด์",
            "เพลงสตริงฮิต"
        ]
    },
    content: {
        login: {
            title: "ปลดปล่อยพลังเสียง\nร้องเพลงที่คุณรัก",
            subtitle: "เข้าร่วมชุมชนคนรักเสียงเพลง สร้างเพลย์ลิสต์ส่วนตัว และสนุกไปกับคาราโอเกะคุณภาพสูงได้ที่นี่",
            termsLink: "#",
            privacyLink: "#",
            features: [
                { title: "คลังเพลงมหาศาล", desc: "อัปเดตใหม่ทุกวัน จาก YouTube & Spotify", link: "" },
                { title: "จัดการเพลย์ลิสต์ง่ายๆ", desc: "สร้าง แก้ไข และแชร์ให้เพื่อนๆ ได้ทันที", link: "" }
            ]
        }
    },
    features: {
        guestMode: true,
        registration: true,
        search: true,
        remoteControl: true,
        cast: true,
        karaokeMode: true,
    },
    player: {
        defaultVolume: 80,
        crossfade: 3,
        allowedSources: ['youtube'],
        autoplay: true,
        defaultProvider: 'spotify',
    },
    ui: {
        showHero: false,
        showTrending: false,
        showGenres: true,
        themeColor: 'default',
        genres: [
            "เพลงไทย", "ลูกทุ่ง", "ลูกกรุง", "เพื่อชีวิต", "คันทรี",
            "หมอลำ", "อีสาน", "ปักษ์ใต้", "ป็อป", "ป็อปร็อก",
            "ฮาร์ดร็อก", "ร็อกแอนด์โรล", "ริทึมแอนด์บลูส์"
        ],
        hero: {
            title: "",
            description: "",
            imageUrl: "https://images.unsplash.com/photo-1516280440614-6697288d5d38?q=80&w=2070&auto=format&fit=crop"
        },
        font: {
            family: '"IBM Plex Sans Thai Looped", sans-serif',
            googleFontsUrl: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai+Looped:wght@100;200;300;400;500;600;700&display=swap",
            baseFontSize: 16,
            sidebarFontSize: 14
        }
    },
    membership: {
        guest: {
            max_daily_songs: 10,
            max_duration_sec: 600,
            allow_cast: false,
            allow_remote: true,
            show_ads: true,
        },
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
    integrations: {
        youtube: {
            apiKeys: [],
            useApi: false
        },
        spotify: {
            clientId: process.env.SPOTIFY_CLIENT_ID || "",
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET || "",
            refreshToken: process.env.SPOTIFY_REFRESH_TOKEN || "",
            enabled: true,
            market: "TH",
            categories: {
                thai_pop: "0JQ5DAqbMKFHKcd02e071a",
                top_lists: "toplists",
                pop: "pop"
            }
        },
        invidious: {
            instances: ["https://yewtu.be", "https://inv.nadeko.net"],
            enabled: true
        }
    },
    payment: {
        bankAccount: {
            bankName: "ไทยพาณิชย์ (SCB)",
            accountName: "บุญยานันทน์ ชูพินิจ",
            accountNumber: "408-006876-3"
        },
        promptPay: {
            id: "4080068763",
            name: "บุญยานันทน์ ชูพินิจ",
            qrImageUrl: "/img/scb-qr.jpg"
        }
    },
    upsell: {
        title: "โควต้าการลองใช้งานสิ้นสุดแล้ว",
        subtitle: "กรุณาเชื่อมต่อผ่าน Gmail เพื่อใช้งานผ่านสิทธิส่วนบุคคลของคุณ\n(YouOke เป็นเพียงระบบจัดคิวเพลงผ่านบัญชีของสมาชิกเท่านั้น)\nเพื่อให้คุณเล่นเพลงโปรดได้ต่อเนื่องและไม่มีโฆษณาคั่น",
        offer_text: "ทดลองใช้พรีเมียมส่วนตัว!",
        offer_subtext: "ฟังเพลงไม่อั้น • ไม่มีโฆษณา • คิวเพลงไม่จำกัด",
        button_text: "เชื่อมต่อผ่าน Gmail เพื่อรับสิทธิพิเศษ"
    },
    tv: {
        template: 'classic',
        signageMessages: [
            "ยินดีต้อนรับสู่ YouOke Karaoke! 🎤",
            "โปรโมชั่น: สั่งอาหารครบ 500 บาท รับฟรีเฟรนช์ฟรายส์ 🍟",
            "สแกนรหัสเพื่อเชื่อมต่อรีโมท ->"
        ],
        signageImages: [
            'https://images.unsplash.com/photo-1516280440614-6697288d5d38?q=80&w=2070',
            'https://images.unsplash.com/photo-1533174072545-e8d4aa97edf9?q=80&w=2070',
            'https://images.unsplash.com/photo-1514525253440-b393452e8d03?q=80&w=2070'
        ],
        ads: [],
        guestSongLimit: 5
    }
};

/**
 * Get current system config once
 */
export const getSystemConfig = async (): Promise<SystemConfig> => {
    if (!db) throw new Error("Firestore not initialized");
    const docRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID);
    const snapshot = await getDoc(docRef);

    if (snapshot.exists()) {
        const data = snapshot.data() as Partial<SystemConfig>;
        // Deep merge for nested objects to ensure new fields (like ui.font) are picked up
        return {
            ...DEFAULT_CONFIG,
            ...data,
            features: { ...DEFAULT_CONFIG.features, ...data.features },
            player: { ...DEFAULT_CONFIG.player, ...data.player },
            tv: { ...DEFAULT_CONFIG.tv, ...data.tv },
            ui: {
                ...DEFAULT_CONFIG.ui,
                ...data.ui,
                font: {
                    family: data.ui?.font?.family || DEFAULT_CONFIG.ui.font!.family,
                    googleFontsUrl: data.ui?.font?.googleFontsUrl ?? DEFAULT_CONFIG.ui.font!.googleFontsUrl,
                    baseFontSize: data.ui?.font?.baseFontSize ?? DEFAULT_CONFIG.ui.font!.baseFontSize,
                    sidebarFontSize: data.ui?.font?.sidebarFontSize ?? DEFAULT_CONFIG.ui.font!.sidebarFontSize,
                    variableName: data.ui?.font?.variableName ?? DEFAULT_CONFIG.ui.font!.variableName
                }
            },
            integrations: {
                ...DEFAULT_CONFIG.integrations,
                ...data.integrations,
                youtube: { ...DEFAULT_CONFIG.integrations.youtube, ...data.integrations?.youtube },
                spotify: { ...DEFAULT_CONFIG.integrations.spotify, ...data.integrations?.spotify }
            },
            payment: { ...DEFAULT_CONFIG.payment, ...data.payment },
            upsell: { ...DEFAULT_CONFIG.upsell, ...data.upsell },
            membership: {
                guest: { ...DEFAULT_CONFIG.membership.guest, ...data.membership?.guest },
                free: { ...DEFAULT_CONFIG.membership.free, ...data.membership?.free },
                premium: { ...DEFAULT_CONFIG.membership.premium, ...data.membership?.premium }
            },
            content: { ...DEFAULT_CONFIG.content, ...data.content }
        };
    }

    await setDoc(docRef, DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
};

/**
 * Update system config (Admin only)
 */
export const updateSystemConfig = async (newConfig: Partial<SystemConfig>) => {
    if (!db) throw new Error("Firestore not initialized");
    const docRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID);

    // Sanitize: Remove undefined values which Firestore doesn't support
    const sanitize = (obj: any): any => {
        return JSON.parse(JSON.stringify(obj));
    };

    await setDoc(docRef, sanitize(newConfig), { merge: true });
};

/**
 * Subscribe to config changes
 */
export const subscribeToSystemConfig = (callback: (config: SystemConfig) => void) => {
    if (!db) return () => { };
    const docRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID);

    const unsubscribe = onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.data() as Partial<SystemConfig>;
            callback({
                ...DEFAULT_CONFIG,
                ...data,
                features: { ...DEFAULT_CONFIG.features, ...data.features },
                player: { ...DEFAULT_CONFIG.player, ...data.player },
                tv: { ...DEFAULT_CONFIG.tv, ...data.tv },
                ui: {
                    ...DEFAULT_CONFIG.ui,
                    ...data.ui,
                    font: {
                        family: data.ui?.font?.family || DEFAULT_CONFIG.ui.font!.family,
                        googleFontsUrl: data.ui?.font?.googleFontsUrl ?? DEFAULT_CONFIG.ui.font!.googleFontsUrl,
                        baseFontSize: data.ui?.font?.baseFontSize ?? DEFAULT_CONFIG.ui.font!.baseFontSize,
                        sidebarFontSize: data.ui?.font?.sidebarFontSize ?? DEFAULT_CONFIG.ui.font!.sidebarFontSize,
                        variableName: data.ui?.font?.variableName ?? DEFAULT_CONFIG.ui.font!.variableName
                    }
                },
                integrations: {
                    ...DEFAULT_CONFIG.integrations,
                    ...data.integrations,
                    youtube: { ...DEFAULT_CONFIG.integrations.youtube, ...data.integrations?.youtube },
                    spotify: { ...DEFAULT_CONFIG.integrations.spotify, ...data.integrations?.spotify }
                },
                recommendations: { ...DEFAULT_CONFIG.recommendations, ...data.recommendations },
                payment: { ...DEFAULT_CONFIG.payment, ...data.payment },
                upsell: { ...DEFAULT_CONFIG.upsell, ...data.upsell },
                membership: {
                    guest: { ...DEFAULT_CONFIG.membership.guest, ...data.membership?.guest },
                    free: { ...DEFAULT_CONFIG.membership.free, ...data.membership?.free },
                    premium: { ...DEFAULT_CONFIG.membership.premium, ...data.membership?.premium }
                },
                content: { ...DEFAULT_CONFIG.content, ...data.content }
            });
        } else {
            callback(DEFAULT_CONFIG);
        }
    }, (error) => {
        console.error("System Config Subscription Error:", error);
    });

    return unsubscribe;
};
