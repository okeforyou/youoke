import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useUIStore } from './useUIStore';

const BRIDGE_PORTS = [5050, 8055];
let _activeBridgePort: number | null = null;
let _serverCheckTime = 0;
const SERVER_CACHE_TTL = 10_000; // 10 seconds

async function getActiveBridgePort(): Promise<number | null> {
    const now = Date.now();
    // Return cached port if still valid
    if (_activeBridgePort && now - _serverCheckTime < SERVER_CACHE_TTL) {
        return _activeBridgePort;
    }
    // Check which port is available using fetchWithFallback for maximum reliability
    try {
        const res = await fetchWithFallback('/health', { signal: AbortSignal.timeout ? AbortSignal.timeout(3000) : undefined }, 0);
        if (res && res.url) {
            const port = res.url.includes(':5050') ? 5050 : 8055;
            _activeBridgePort = port;
            _serverCheckTime = now;
            return port;
        }
    } catch {
        // ignore
    }
    _activeBridgePort = null;
    _serverCheckTime = now;
    return null;
}

export async function getActiveBridgeBaseUrl(): Promise<string | null> {
    const port = await getActiveBridgePort();
    return port ? `http://127.0.0.1:${port}` : null;
}

async function fetchWithFallback(endpoint: string, options?: RequestInit, maxRetries = 0) {
    let delayMs = 1000;
    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        let res5050;
        try {
            res5050 = await fetch(`http://127.0.0.1:5050${endpoint}`, options);
            if (res5050.ok) return res5050;
        } catch (e) {
            lastError = e;
        }

        let res8055;
        try {
            res8055 = await fetch(`http://127.0.0.1:8055${endpoint}`, options);
            if (res8055.ok) return res8055;
        } catch (e) {
            lastError = e;
        }

        if (res5050) return res5050;
        if (res8055) return res8055;

        if (attempt < maxRetries) {
            console.warn(`[YouOke Plugin] Connection attempt ${attempt + 1} failed. Retrying in ${delayMs}ms...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
            delayMs *= 2;
        }
    }

    throw new Error(`AI Server is unreachable. Last error: ${lastError}`);
};

// Throttle: track last check time per batch (keyed by sorted videoIds)
const _cacheCheckThrottle = new Map<string, number>();
const CACHE_CHECK_INTERVAL = 30_000; // 30 seconds

interface AIVocalJob {
    status: 'idle' | 'processing' | 'ready' | 'error';
    progress: number;
    message: string;
    mode?: 'basic' | 'pro';
}

interface AIVocalState {
    isActive: boolean; // Is the currently playing song using AI Vocal?
    currentVideoId: string | null;
    defaultMode: 'basic' | 'pro';
    rapidapiKey: string | null;
    deepgramKey: string | null;
    groqKey: string | null;
    rapidapiQuota: { remaining: number; limit: number } | null;
    
    // Background jobs
    jobs: Record<string, AIVocalJob>;
    
    // Mixing states
    volumes: { vocals: number, instrumental: number, drums: number, bass: number, other: number };
    trackStates: {
        vocals: { muted: boolean, solo: boolean },
        instrumental: { muted: boolean, solo: boolean },
        drums: { muted: boolean, solo: boolean },
        bass: { muted: boolean, solo: boolean },
        other: { muted: boolean, solo: boolean }
    };

    // Actions
    setIsActive: (active: boolean) => void;
    setVolume: (type: 'vocals' | 'instrumental' | 'drums' | 'bass' | 'other', val: number) => void;
    toggleMute: (type: 'vocals' | 'instrumental' | 'drums' | 'bass' | 'other') => void;
    toggleSolo: (type: 'vocals' | 'instrumental' | 'drums' | 'bass' | 'other') => void;
    
    // API Actions
    processAudio: (videoId: string, titleOrMode?: string, modeOverride?: 'basic' | 'pro', useManualUpload?: boolean) => Promise<void>;
    uploadAudioFile: (videoId: string, file: File) => Promise<boolean>;
    checkCachedStatus: (videoIds: string[]) => Promise<void>;
    deleteJob: (videoId: string) => Promise<boolean>;
    pauseJob: (videoId: string) => Promise<boolean>;
    resumeJob: (videoId: string) => Promise<boolean>;
    reset: () => void;
    setCurrentVideoId: (id: string | null) => void;
    setDefaultMode: (mode: 'basic' | 'pro') => void;
    setRapidapiKey: (key: string | null) => void;
    setDeepgramKey: (key: string | null) => void;
    setGroqKey: (key: string | null) => void;
}

export const useAIVocalStore = create<AIVocalState>()(
    persist(
        (set, get) => ({
    isActive: false,
    currentVideoId: null,
    defaultMode: 'basic',
    rapidapiKey: null,
    deepgramKey: null,
    groqKey: null,
    rapidapiQuota: null,
    jobs: {},

    volumes: { vocals: 100, instrumental: 100, drums: 100, bass: 100, other: 100 },
    trackStates: {
        vocals: { muted: false, solo: false },
        instrumental: { muted: false, solo: false },
        drums: { muted: false, solo: false },
        bass: { muted: false, solo: false },
        other: { muted: false, solo: false }
    },

    setIsActive: (active) => set({ isActive: active }),
    setCurrentVideoId: (id) => set({ currentVideoId: id }),
    setDefaultMode: (mode) => set({ defaultMode: mode }),
    setRapidapiKey: (key) => set({ rapidapiKey: key }),
    setDeepgramKey: (key) => set({ deepgramKey: key }),
    setGroqKey: (key) => set({ groqKey: key }),

    setVolume: (type, val) => set((state) => ({
        volumes: { ...state.volumes, [type]: val }
    })),

    toggleMute: (type) => set((state) => ({
        trackStates: {
            ...state.trackStates,
            [type]: { ...state.trackStates[type], muted: !state.trackStates[type].muted }
        }
    })),

    toggleSolo: (type) => set((state) => {
        const newSolo = !state.trackStates[type].solo;
        return {
            trackStates: {
                vocals: { ...state.trackStates.vocals, solo: type === 'vocals' ? newSolo : false },
                instrumental: { ...state.trackStates.instrumental, solo: type === 'instrumental' ? newSolo : false },
                drums: { ...state.trackStates.drums, solo: type === 'drums' ? newSolo : false },
                bass: { ...state.trackStates.bass, solo: type === 'bass' ? newSolo : false },
                other: { ...state.trackStates.other, solo: type === 'other' ? newSolo : false }
            }
        };
    }),

    reset: () => set({
        isActive: false,
        currentVideoId: null,
        // We don't reset jobs here so background tasks can continue
        volumes: { vocals: 100, instrumental: 100, drums: 100, bass: 100, other: 100 },
        trackStates: {
            vocals: { muted: false, solo: false },
            instrumental: { muted: false, solo: false },
            drums: { muted: false, solo: false },
            bass: { muted: false, solo: false },
            other: { muted: false, solo: false }
        }
    }),

    processAudio: async (videoId: string, titleOrMode?: string, modeOverride?: 'basic' | 'pro', useManualUpload?: boolean) => {
        const { jobs, defaultMode, rapidapiKey } = get();
        
        let title = "Unknown Title";
        let targetMode = defaultMode;

        if (titleOrMode === 'basic' || titleOrMode === 'pro') {
            targetMode = titleOrMode;
        } else if (titleOrMode) {
            title = titleOrMode;
            if (modeOverride) {
                targetMode = modeOverride;
            }
        }

        if (!useManualUpload && (!rapidapiKey || rapidapiKey.trim() === "")) {
            if (typeof window !== "undefined") {
                useUIStore.getState().showConfirm({
                    title: "จำเป็นต้องใช้ API Key",
                    message: "กรุณากรอก API Key ของ RapidAPI ในเมนูตั้งค่า (แท็บ AI) ก่อนเริ่มแยกเสียงจาก YouTube ครับ เพื่อให้การดาวน์โหลดมีความเสถียรที่สุด",
                    type: "warning",
                    confirmText: "รับทราบ",
                    onConfirm: () => useUIStore.getState().hideConfirm()
                });
            }
            return;
        }

        const currentJob = jobs[videoId];
        
        // Prevent duplicate calls if already processing
        if (currentJob?.status === 'processing') {
            return;
        }
        // Prevent if already ready in the SAME mode
        if (currentJob?.status === 'ready' && currentJob?.mode === targetMode) {
            return;
        }

        // Init job
        set((state) => ({
            jobs: {
                ...state.jobs,
                [videoId]: { status: 'processing', progress: 0, message: 'กำลังเตรียมการ...', mode: targetMode }
            }
        }));
        
        let isPolling = true;

        const pollProgress = async () => {
            while (isPolling) {
                try {
                    const res = await fetchWithFallback(`/progress/${videoId}`);
                    if (res.ok) {
                        const data = await res.json();
                        set((state) => ({
                            jobs: {
                                ...state.jobs,
                                [videoId]: { ...state.jobs[videoId], message: data.message, progress: data.percent || 0, mode: data.mode || state.jobs[videoId]?.mode }
                            }
                        }));
                    }
                } catch (e) {
                    console.warn("Polling error:", e);
                }
                await new Promise(r => setTimeout(r, 1000));
            }
        };

        // Start polling in background
        pollProgress();

        try {
            const res = await fetchWithFallback("/separate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ video_id: videoId, title: title, mode: targetMode, rapidapi_key: rapidapiKey || "", use_manual_upload: useManualUpload })
            }, 4); // 4 retries = wait up to ~15s (1+2+4+8) for the bridge to start
            
            isPolling = false;
            const data = await res.json();
            
            if (res.ok && (data.status === "success" || data.status === "cached" || data.status === "already_exists")) {
                set((state) => ({
                    jobs: {
                        ...state.jobs,
                        [videoId]: { ...state.jobs[videoId], status: 'ready', message: 'พร้อมเล่น!', progress: 100, mode: data.mode || targetMode }
                    }
                }));
            } else if (data.status === 'error') {
                isPolling = false;
                let errorMessage = data.detail || data.message || 'เกิดข้อผิดพลาดในการแยกเสียง';
                
                // Detect PyInstaller temp folder deletion issue
                if (errorMessage.includes('Failed to start embedded python interpreter') || errorMessage.includes("No module named 'encodings'")) {
                    errorMessage = '🚨 กรุณา ปิดแล้วเปิดโปรแกรม YouOke Plugin ใหม่ (ไฟล์ชั่วคราวถูกลบโดยระบบ)';
                }

                set((state) => ({
                    jobs: {
                        ...state.jobs,
                        [videoId]: { ...state.jobs[videoId], status: 'error', message: errorMessage }
                    }
                }));
            }
        } catch (e) {
            isPolling = false;
            set((state) => ({
                jobs: {
                    ...state.jobs,
                    [videoId]: { ...state.jobs[videoId], status: 'error', message: 'เชื่อมต่อ YouOke Plugin ไม่สำเร็จ' }
                }
            }));
        }
    },
    
    uploadAudioFile: async (videoId: string, file: File): Promise<boolean> => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const res = await fetchWithFallback(`/upload/${videoId}`, {
                method: 'POST',
                body: formData
            }, 0);
            
            return res.ok;
        } catch (e) {
            console.error('Failed to upload audio file:', e);
            return false;
        }
    },

    checkCachedStatus: async (videoIds: string[]) => {
        if (!videoIds || videoIds.length === 0) return;
        const { jobs } = get();

        // Filter out already-known videos
        const unknownIds = videoIds.filter(id => {
            const s = jobs[id]?.status;
            return s !== 'ready' && s !== 'processing';
        });
        if (unknownIds.length === 0) return;

        // Throttle: use sorted IDs as key to avoid duplicate batches
        const batchKey = unknownIds.slice().sort().join(',');
        const lastCheck = _cacheCheckThrottle.get(batchKey) ?? 0;
        if (Date.now() - lastCheck < CACHE_CHECK_INTERVAL) return;
        _cacheCheckThrottle.set(batchKey, Date.now());

        // Check if server is available before sending batch
        const port = await getActiveBridgePort();
        if (!port) return; // Server offline, skip silently

        const updates: Record<string, AIVocalJob> = {};

        // Check one by one (sequentially) to avoid overwhelming server
        for (const id of unknownIds) {
            try {
                const res = await fetch(`http://127.0.0.1:${port}/files/${id}/vocals.m4a`, {
                    method: 'HEAD',
                    signal: AbortSignal.timeout(3000),
                });
                if (res.ok) {
                    const contentLength = res.headers.get('content-length');
                    if (contentLength && contentLength === '0') {
                        continue; // Skip: empty/corrupt file
                    }
                    let actualMode: 'basic' | 'pro' = 'basic';
                    try {
                        const drumsRes = await fetch(`http://127.0.0.1:${port}/files/${id}/drums.m4a`, {
                            method: 'HEAD',
                            signal: AbortSignal.timeout(2000),
                        });
                        if (drumsRes.ok) {
                            const drumsLength = drumsRes.headers.get('content-length');
                            if (!drumsLength || drumsLength !== '0') {
                                actualMode = 'pro';
                            }
                        }
                    } catch {
                        // ignore
                    }
                    updates[id] = { status: 'ready', message: 'พร้อมเล่น!', progress: 100, mode: actualMode };
                }
            } catch {
                // Ignore: file not found or server offline
            }
        }

        if (Object.keys(updates).length > 0) {
            set(state => ({
                jobs: { ...state.jobs, ...updates }
            }));
        }
    },

    deleteJob: async (videoId: string) => {
        // 1. Instantly remove from frontend Zustand store & localStorage
        set((state) => {
            const newJobs = { ...state.jobs };
            delete newJobs[videoId];
            return { jobs: newJobs };
        });

        // 2. Send DELETE request to local bridge server
        try {
            const port = await getActiveBridgePort();
            if (port) {
                const res = await fetch(`http://127.0.0.1:${port}/cache/${videoId}`, { method: 'DELETE' });
                return res.ok;
            }
        } catch (e) {
            console.error('[deleteJob] Error calling bridge DELETE:', e);
        }
        return true;
    },

    pauseJob: async (videoId: string) => {
        try {
            const port = await getActiveBridgePort();
            if (port) {
                const res = await fetch(`http://127.0.0.1:${port}/pause/${videoId}`, { method: 'POST' });
                if (res.ok) {
                    set(state => ({
                        jobs: {
                            ...state.jobs,
                            [videoId]: { ...state.jobs[videoId], status: 'idle', message: 'หยุดชั่วคราว' }
                        }
                    }));
                    return true;
                }
            }
        } catch (e) {
            console.error('[pauseJob] Error:', e);
        }
        return false;
    },

    resumeJob: async (videoId: string) => {
        try {
            const port = await getActiveBridgePort();
            if (port) {
                const res = await fetch(`http://127.0.0.1:${port}/resume/${videoId}`, { method: 'POST' });
                if (res.ok) {
                    set(state => ({
                        jobs: {
                            ...state.jobs,
                            [videoId]: { ...state.jobs[videoId], status: 'processing', message: 'รอคิว...' }
                        }
                    }));
                    return true;
                }
            }
        } catch (e) {
            console.error('[resumeJob] Error:', e);
        }
        return false;
    }
}),
    {
        name: 'ai-vocal-storage',
        partialize: (state) => ({ jobs: state.jobs, defaultMode: state.defaultMode, rapidapiKey: state.rapidapiKey, deepgramKey: state.deepgramKey, groqKey: state.groqKey }), 
    }
));
