import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeSplit } from '@/utils/stringUtils';
import { PlayerState, Video, QueueItem, PlayerStore } from '../types';
// But for now, I'll just add the implementation.
// Wait, TS will complain. checking types file location.
import { generateUUID, broadcast, bc } from '../utils';

import { useUIStore } from '../../../stores/useUIStore';
import { useAuthStore } from '@/modules/auth/useAuthStore';
import { useAIVocalStore } from '../../../stores/useAIVocalStore';

let lastTimeSync = 0;

export const usePlayerStore = create<PlayerStore>()(
    persist(
        (set, get) => ({
            isPlaying: false,
            currentTime: 0,
            duration: 0,
            volume: 100,
            isMuted: false,
            currentSource: null,
            adapterId: 'youtube', // Default
            activeAdapterId: 'youtube',
            repeatMode: 'off',
            queue: [],
            currentIndex: 0,
            currentVideo: null,
            layoutMode: 'split',
            isQueueVisible: false, // Default hidden in fullscreen
            notification: null as { type: 'added' | 'upnext', video: any, timestamp: number } | null,
            setNotification: (notif: any) => {
                set({ notification: notif });
                broadcast({ notification: notif });
            },

            // Sync Locks
            seekTarget: null,
            ignoreUpdatesUntil: 0,

            syncState: (newState) => {
                // When receiving state from another tab, we also respect the smart lock.
                const { ignoreUpdatesUntil, seekTarget, currentTime: localTime } = get();
                const now = Date.now();

                // 1. SMART LOCK: If we are in the middle of a seek, ignore incoming times that don't match our target
                if (newState.currentTime !== undefined && ignoreUpdatesUntil && now < ignoreUpdatesUntil && seekTarget !== null) {
                    if (Math.abs(newState.currentTime - seekTarget) < 1.5) {
                        set({ ...newState, ignoreUpdatesUntil: 0, seekTarget: null });
                    } else {
                        const { currentTime, ...rest } = newState;
                        set({ ...rest });
                        return;
                    }
                }

                // 2. STALE TIME PROTECTION: Ignore backward jumps (loops) that are likely stale broadcasts
                if (newState.currentTime !== undefined && !newState.currentVideo) {
                    // If the incoming time is significantly behind our local time (> 2s), 
                    // and we're not explicitly seeking, ignore it.
                    if (newState.currentTime < localTime - 2 && !ignoreUpdatesUntil) {
                        const { currentTime, ...rest } = newState;
                        if (Object.keys(rest).length > 0) set(rest);
                        return;
                    }
                }

                set((prev) => ({ ...prev, ...newState }));
            },

            setVolume: (vol) => {
                set({ volume: vol });
                broadcast({ volume: vol });
            },
            setMuted: (muted) => {
                set({ isMuted: muted });
                broadcast({ isMuted: muted });
            },
            setLayoutMode: (mode) => {
                set({ layoutMode: mode });
                // Layout mode is arguably local preference, but let's sync for control
                broadcast({ layoutMode: mode });
            },
            setRepeatMode: (mode) => {
                set({ repeatMode: mode });
                broadcast({ repeatMode: mode });
            },
            toggleQueueVisibility: () => set((state) => {
                const newValue = !state.isQueueVisible;
                broadcast({ isQueueVisible: newValue });
                return { isQueueVisible: newValue };
            }),

            isQrVisible: false,
            setQrVisibility: (visible) => {
                set({ isQrVisible: visible });
                broadcast({ isQrVisible: visible }); // Optional sync
            },

            setQueueVisibility: (visible) => {
                set({ isQueueVisible: visible });
                broadcast({ isQueueVisible: visible });
            },

            // New QR Overlay State

            toggleQr: (visible) => set((state) => {
                const newVal = visible !== undefined ? visible : !state.isQrVisible;
                broadcast({ isQrVisible: newVal });
                return { isQrVisible: newVal };
            }),

            // Mobile Fullscreen Trigger (Signal Sync)
            fullscreenTrigger: 0,
            triggerFullscreen: () => set((state) => {
                // Toggle between fullscreen and split modes
                const newMode = state.layoutMode === 'fullscreen' ? 'split' : 'fullscreen';
                const newVal = Date.now();
                broadcast({ fullscreenTrigger: newVal, layoutMode: newMode });
                return { fullscreenTrigger: newVal, layoutMode: newMode };
            }),

            // UI State (Unification)
            searchTerm: "",
            isKaraoke: true, // Default true
            activeIndex: 1, // Default 1 (Recommend)
            searchHistory: [], // Native App History

            setSearchTerm: (term) => {
                set({ searchTerm: term });
                broadcast({ searchTerm: term });
            },
            setIsKaraoke: (isKaraoke) => {
                set({ isKaraoke });
                broadcast({ isKaraoke });
            },
            setActiveIndex: (index) => {
                set({ activeIndex: index });
                broadcast({ activeIndex: index });
            },

            addSearchHistory: (term) => set((state) => {
                if (!term || term.trim() === "") return {};
                const cleanTerm = term.trim();
                // Filter out existing and add to front (limit 10)
                const newHistory = [
                    cleanTerm,
                    ...state.searchHistory.filter(h => h.toLowerCase() !== cleanTerm.toLowerCase())
                ].slice(0, 10);
                broadcast({ searchHistory: newHistory });
                return { searchHistory: newHistory };
            }),

            removeSearchHistory: (term) => set((state) => {
                const newHistory = state.searchHistory.filter(h => h !== term);
                broadcast({ searchHistory: newHistory });
                return { searchHistory: newHistory };
            }),

            clearSearchHistory: () => {
                set({ searchHistory: [] });
                broadcast({ searchHistory: [] });
            },

            play: () => {
                set({ isPlaying: true });
                broadcast({ isPlaying: true });
            },
            pause: () => {
                set({ isPlaying: false });
                broadcast({ isPlaying: false });
            },
            togglePlay: () => set((state) => {
                const newVal = !state.isPlaying;
                broadcast({ isPlaying: newVal });
                return { isPlaying: newVal };
            }),

            setCurrentTime: (time) => {
                const { ignoreUpdatesUntil, seekTarget, currentTime: prevTime } = get();
                const now = Date.now();
                
                // v4.10.119: SMART LOCK ENFORCEMENT
                // If we are currently in an active seek lock (5s max)...
                if (ignoreUpdatesUntil && now < ignoreUpdatesUntil && seekTarget !== null) {
                    // Check if the current player time has finally "landed" near our target (within 2s)
                    if (Math.abs(time - seekTarget) < 2) {
                        console.log("🎯 [Store] Seek landed! Success at", time, " - Unlocking.");
                        set({ ignoreUpdatesUntil: 0, seekTarget: null });
                    } else {
                        // Otherwise, the player is still reporting old 'stale' time.
                        // WE MUST IGNORE THIS to prevent ProgressBar rubber-banding.
                        // console.log("⏳ [Store] Ignoring stale time during seek:", time, "target was", seekTarget);
                        return;
                    }
                }

                // STALE TIME JUMP PROTECTION (Cross-tab Loop Prevention)
                // If the new time is significantly behind our current time (> 3s) without a seek, ignore it.
                if (time < prevTime - 3 && !ignoreUpdatesUntil) {
                    return;
                }

                set({ currentTime: time });
                broadcast({ currentTime: time });
            },

            seekTo: (time) => {
                console.log("⏩ Store: seekTo (Smart Lock)", time);

                // Set Smart Seek Lock
                set({
                    currentTime: time,
                    seekTarget: time,
                    ignoreUpdatesUntil: Date.now() + 5000
                });

                // Broadcast seek immediately
                const channel = new BroadcastChannel('youoke_player_sync');
                channel.postMessage({ type: 'SEEK', time });
                channel.close();
            },

            syncRemoteTime: (time) => {
                // Update local state WITHOUT broadcasting (to avoid loops)
                set({ currentTime: time });
            },

            setDuration: (duration) => {
                set({ duration });
                broadcast({ duration });
            },

            shuffleQueue: () => set((state) => {
                if (state.queue.length <= 1) return {};

                const queue = [...state.queue];
                const currentIndex = state.currentIndex;

                // Shuffle logic: Keep current song, shuffle the rest (upcoming)
                if (currentIndex < queue.length - 1) {
                    const upcoming = queue.slice(currentIndex + 1);
                    // Fisher-Yates shuffle for upcoming
                    for (let i = upcoming.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [upcoming[i], upcoming[j]] = [upcoming[j], upcoming[i]];
                    }
                    const newQueue = [...queue.slice(0, currentIndex + 1), ...upcoming];
                    broadcast({ queue: newQueue });
                    return { queue: newQueue };
                }
                // If stopped or completed, shuffle entire queue
                else if (!state.isPlaying && queue.length > 1) {
                    for (let i = queue.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [queue[i], queue[j]] = [queue[j], queue[i]];
                    }
                    // Current index becomes 0 (start new shuffled list)
                    const updates = { queue, currentIndex: 0 };
                    broadcast(updates);
                    return updates;
                }

                return {};
            }),

            playVideo: (videoId) => set((state) => {
                const existingIdx = state.queue.findIndex(q => (q.videoId || q.id) === videoId);
                
                if (existingIdx !== -1) {
                    const newState = {
                        currentIndex: existingIdx,
                        currentVideo: state.queue[existingIdx],
                        currentSource: videoId,
                        isPlaying: true,
                        currentTime: 0
                    };
                    broadcast(newState);
                    return newState;
                }

                const newItem: QueueItem = {
                    id: videoId,
                    videoId, // Backward compat
                    sourceType: 'youtube',
                    title: 'Playing Video',
                    author: 'System',
                    uuid: generateUUID(),
                    thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
                };
                
                const newQueue = [...state.queue, newItem];
                const newState = {
                    queue: newQueue,
                    currentIndex: newQueue.length - 1,
                    currentVideo: newItem,
                    currentSource: videoId,
                    isPlaying: true,
                    currentTime: 0,
                    layoutMode: get().layoutMode
                };
                broadcast(newState);
                return newState;
            }),

            setActiveAdapter: (id) => set({ activeAdapterId: id }),

            setPlayerState: (state) => {
                set((prev) => ({ ...prev, ...state }));
                broadcast(state);
            },

            addToQueue: (video, options = { autoPlay: true, skipQuota: false }) => set((state) => {
                const { autoPlay = true, skipQuota = false } = typeof options === 'boolean' ? { autoPlay: options } : options;
                
                // 🛡️ [GATEKEEPER] v4.9.63: Daily Song Count & Membership Enforcement
                // v5.5.36: Bypass check if skipQuota is requested (Trusted Remote/Internal)
                if (!skipQuota) {
                    const authUser = useAuthStore.getState().user;
                    
                    // 🚨 GLOBAL LOGIN ENFORCEMENT: All users MUST log in to play any song
                    if (!authUser) {
                        console.warn("🚫 Global Gatekeeper: User not logged in. Forcing login.");
                        // LimitModal already asks guests to connect via Gmail
                        useUIStore.getState().setLimitModalOpen(true);
                        return {};
                    }
                    
                    let currentUsed = authUser.quota?.used || 0;
                    let dailyLimit = authUser.quota?.daily_limit !== undefined ? authUser.quota.daily_limit : 0;

                    const isPremium = (['premium', 'monthly', 'yearly', 'lifetime', 'day_pass', 'trial'].includes(authUser.membership?.type || '') && authUser.membership?.status === 'active') || authUser.role === 'admin';
                    if (isPremium) dailyLimit = -1; // Unlimited

                    // Development / Preview Bypass
                    if (typeof window !== 'undefined' && window.location.hostname !== 'play.okeforyou.com') {
                        dailyLimit = -1; // Unlimited for preview deployments and local testing
                    }

                    // If limit reached for the logged-in user, block adding and show modal
                    // We remove `&& dailyLimit > 0` because if dailyLimit is 0, they should be blocked immediately.
                    if (dailyLimit !== -1 && currentUsed >= dailyLimit) {
                        console.warn(`🚫 Global Gatekeeper: Daily limit reached on Host (${currentUsed}/${dailyLimit}). Blocking addition.`);
                        useUIStore.getState().setLimitModalOpen(true);
                        return {};
                    }
                }

                const videos = Array.isArray(video) ? video : [video];
                console.log(`🏗️ Store Action: addToQueue (${videos.length} items)`);

                const newItems: QueueItem[] = videos.map(v => ({ ...v, uuid: (v as any).uuid || generateUUID() }));
                
                // 🤖 Trigger background AI processing for any AI Vocal requests
                const aiVocalStore = useAIVocalStore.getState();
                newItems.forEach(item => {
                    if (item.aiVocalRequested) {
                        const vidId = item.videoId || item.id;
                        if (vidId && !aiVocalStore.jobs[vidId]) {
                            aiVocalStore.processAudio(vidId, item.title, aiVocalStore.defaultMode).catch(console.error);
                        }
                    }
                });

                const newQueue = [...state.queue, ...newItems];
                let updates: Partial<PlayerStore> = { queue: newQueue };

                if (!state.currentVideo && autoPlay && newItems.length > 0) {
                    const firstItem = newItems[0];
                    let source = firstItem.id;
                    const type = firstItem.sourceType || 'youtube';

                    if (type === 'youtube') {
                        source = firstItem.videoId || firstItem.id;
                    } else if (type === 'vcd') {
                        source = firstItem.filePath || firstItem.id;
                    } else if (type === 'midi') {
                        source = firstItem.id;
                    }

                    updates = {
                        ...updates,
                        currentIndex: state.queue.length,
                        currentVideo: firstItem,
                        currentSource: source,
                        isPlaying: true,
                        currentTime: 0
                    };
                } else {
                    console.log(`✅ Appended ${newItems.length} items to end of queue. Total: ${newQueue.length}`);
                }

                broadcast({ queue: newQueue, ...updates });
                return updates;
            }),

            removeFromQueue: (uuid) => set((state) => {
                const indexToRemove = state.queue.findIndex(item => item.uuid === uuid);
                if (indexToRemove === -1) return {};

                const newQueue = state.queue.filter(item => item.uuid !== uuid);
                
                let newIndex = state.currentIndex;
                if (indexToRemove < state.currentIndex) {
                    newIndex--;
                } else if (indexToRemove === state.currentIndex) {
                    if (newIndex >= newQueue.length) {
                        newIndex = Math.max(0, newQueue.length - 1);
                    }
                }

                const updates: any = { 
                    queue: newQueue, 
                    currentIndex: newIndex,
                    currentVideo: newQueue[newIndex] || null 
                };

                broadcast(updates);
                return updates;
            }),

            updateQueueItem: (uuid, itemUpdates) => set((state) => {
                const newQueue = state.queue.map(item => 
                    item.uuid === uuid ? { ...item, ...itemUpdates } : item
                );
                
                const updates: any = { queue: newQueue };
                
                // If the updated item is the currently playing one, update currentVideo too
                if (state.currentVideo && state.currentVideo.uuid === uuid) {
                    updates.currentVideo = { ...state.currentVideo, ...itemUpdates };
                }
                
                broadcast(updates);
                return updates;
            }),

            reorderQueue: (newQueue, newIndex) => {
                const updates: any = { queue: newQueue };
                if (newIndex !== undefined) {
                    updates.currentIndex = newIndex;
                    // Also update sync currentVideo just in case to keep it solid
                    if (newQueue[newIndex]) {
                        updates.currentVideo = newQueue[newIndex];
                    }
                }
                set(updates);
                broadcast(updates);
            },

            setCurrentIndex: (index) => set((state) => {
                // 🛡️ [GATEKEEPER] v4.9.63: Enforce quota on manual song switch
                const authUser = useAuthStore.getState().user;
                const today = safeSplit(new Date().toISOString(), 'T')[0];
                const storageKey = `daily_songs_${today}`;
                
                let currentUsed = 0;
                let dailyLimit = 0;

                if (authUser) {
                    currentUsed = authUser.quota?.used || 0;
                    dailyLimit = authUser.quota?.daily_limit || 0;
                    const isPremium = (['premium', 'monthly', 'yearly', 'lifetime', 'day_pass', 'trial'].includes(authUser.membership?.type || '') && authUser.membership?.status === 'active') || authUser.role === 'admin';
                    if (isPremium) dailyLimit = -1; // Unlimited
                } else {
                    currentUsed = parseInt(localStorage.getItem(storageKey) || '0');
                    dailyLimit = 5; // Default guess
                }

                // Development / Preview Bypass
                if (typeof window !== 'undefined' && window.location.hostname !== 'play.okeforyou.com') {
                    dailyLimit = -1; // Unlimited for preview deployments and local testing
                }

                if (dailyLimit !== -1 && currentUsed >= dailyLimit && dailyLimit > 0) {
                    useUIStore.getState().setLimitModalOpen(true);
                    return { isPlaying: false };
                }

                if (index < 0 || index >= state.queue.length) return {};
                const video = state.queue[index];

                let source = video.id;
                const type = video.sourceType || 'youtube';

                if (type === 'youtube') {
                    source = video.videoId || video.id;
                    if (!source) console.error("❌ PlayerStore: YouTube ID missing for item", video);
                } else if (type === 'vcd') {
                    source = video.filePath || video.id;
                }

                console.log(`▶️ Store: Switching Index to ${index}. Source: ${source}`);

                // 🤖 Trigger AI Vocal if requested
                const aiVocalStore = useAIVocalStore.getState();
                if (video.aiVocalRequested && source) {
                    console.log(`🎤 AI Vocal requested for ${source}, starting processing...`);
                    aiVocalStore.processAudio(source, video.title, aiVocalStore.defaultMode).catch(console.error);
                } else if (aiVocalStore.isActive) {
                    console.log(`🎤 AI Vocal not requested, resetting...`);
                    aiVocalStore.reset();
                }

                const updates = {
                    currentIndex: index,
                    currentVideo: video,
                    currentSource: source,
                    isPlaying: true,
                    currentTime: 0
                };
                broadcast(updates);
                return updates;
            }),

            playNext: () => {
                const state = get();
                const { queue, currentIndex } = state;

                if (queue.length > 0) {
                    // Determine where to slice from. 
                    // If we want to consume (vanish model), we remove everything before the NEXT song.
                    const nextIndex = currentIndex + 1;
                    const newQueue = queue.slice(nextIndex);

                    if (newQueue.length > 0) {
                        const nextVideo = newQueue[0];

                        let source = nextVideo.id;
                        const type = nextVideo.sourceType || 'youtube';

                        if (type === 'youtube') {
                            source = nextVideo.videoId || nextVideo.id;
                            if (!source) console.error("❌ PlayerStore: YouTube ID missing for item", nextVideo);
                        } else if (type === 'vcd') {
                            source = nextVideo.filePath || nextVideo.id;
                        }

                        console.log(`▶️ Store: Playing Next (from index ${currentIndex} -> consumed). Next Source: ${source}`);

                        const updates = {
                            queue: newQueue,
                            currentIndex: 0,
                            currentVideo: nextVideo,
                            currentSource: source,
                            isPlaying: true,
                            layoutMode: state.layoutMode,
                            currentTime: 0,
                            seekTarget: null,
                            ignoreUpdatesUntil: 0
                        };
                        set(updates);
                        broadcast(updates);
                    } else {
                        console.log("🏁 Store: Queue Finished");
                        const updates = {
                            queue: [],
                            currentIndex: 0,
                            currentVideo: null,
                            currentSource: null,
                            isPlaying: false,
                            layoutMode: state.layoutMode,
                            seekTarget: null,
                            ignoreUpdatesUntil: 0
                        };
                        set(updates);
                        broadcast(updates);
                    }
                }
            },

            playPrevious: () => {
                const state = get();
                if (state.currentIndex > 0) {
                    state.setCurrentIndex(state.currentIndex - 1);
                    // setCurrentIndex already broadcasts
                }
            },

            clearQueue: () => {
                const state = get();
                // Keep the current song if something is playing/selected
                if (state.queue && state.queue.length > 0 && state.currentIndex >= 0 && state.currentIndex < state.queue.length) {
                    const currentItem = state.queue[state.currentIndex];
                    const updates = {
                        queue: [currentItem],
                        currentIndex: 0
                    };
                    set(updates);
                    broadcast(updates);
                    console.log('🧹 Queue cleared (except current song)');
                } else {
                    const updates = { queue: [], currentVideo: null, currentSource: null, isPlaying: false, currentIndex: 0 };
                    set(updates);
                    broadcast(updates);
                }
            },

            playVideoAtIndex: (index) => {
                get().setCurrentIndex(index);
            },

            removeVideoAtIndex: (index) => set((state) => {
                if (index < 0 || index >= state.queue.length) return {};
                const newQueue = [...state.queue];
                newQueue.splice(index, 1);

                // Adjust currentIndex if necessary
                let newIndex = state.currentIndex;
                if (index < state.currentIndex) {
                    newIndex--;
                } else if (index === state.currentIndex) {
                    // If we removed the current video, play the next one (which is now at the same index)
                    // unless we removed the last one.
                    if (newIndex >= newQueue.length) {
                        newIndex = Math.max(0, newQueue.length - 1);
                    }
                }

                const newCurrentVideo = newQueue[newIndex] || null;
                broadcast({ queue: newQueue, currentIndex: newIndex, currentVideo: newCurrentVideo });
                return { queue: newQueue, currentIndex: newIndex, currentVideo: newCurrentVideo };
            }),

            insertVideoAtIndex: (index, video) => set((state) => {
                const newItem: QueueItem = { ...video, uuid: generateUUID() };
                const newQueue = [...state.queue];
                // Clamp index
                const insertIdx = Math.max(0, Math.min(index, newQueue.length));
                newQueue.splice(insertIdx, 0, newItem);

                // Adjust currentIndex
                let newIndex = state.currentIndex;
                if (insertIdx <= state.currentIndex) {
                    newIndex++;
                }

                broadcast({ queue: newQueue, currentIndex: newIndex });
                return { queue: newQueue, currentIndex: newIndex };
            }),

            moveVideo: (fromIndex, toIndex) => set((state) => {
                if (fromIndex < 0 || fromIndex >= state.queue.length || toIndex < 0 || toIndex >= state.queue.length) return {};

                const newQueue = [...state.queue];
                const [item] = newQueue.splice(fromIndex, 1);
                newQueue.splice(toIndex, 0, item);

                // Adjust currentIndex logic is complex here if strictly tracking the *playing* song.
                // For simplicity, we assume we just reorder list.
                // But ideally: if we moved the current song, currentIndex changes.
                // If we moved something above current song to below, index changes.

                let newIndex = state.currentIndex;
                if (state.currentIndex === fromIndex) {
                    newIndex = toIndex;
                } else {
                    if (fromIndex < state.currentIndex && toIndex >= state.currentIndex) {
                        newIndex--;
                    } else if (fromIndex > state.currentIndex && toIndex <= state.currentIndex) {
                        newIndex++;
                    }
                }

                broadcast({ queue: newQueue, currentIndex: newIndex });
                return { queue: newQueue, currentIndex: newIndex };
            })
        }),
        {
            name: 'youoke-player-storage-v3',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                volume: state.volume,
                // Persist Queue & Playback State
                queue: state.queue,
                currentIndex: state.currentIndex,
                currentVideo: state.currentVideo,
                currentSource: state.currentSource,
                // Persist UI State
                searchTerm: state.searchTerm,
                isKaraoke: state.isKaraoke,
                activeIndex: state.activeIndex,
                repeatMode: state.repeatMode,
                searchHistory: state.searchHistory,
            }),
            merge: (persistedState: any, currentState) => ({
                ...currentState,
                ...persistedState,
                layoutMode: 'split'
            }),
        }
    )
);

// Listen for incoming Sync messages
if (bc) {
    bc.onmessage = (event) => {
        if (event.data && event.data.type === 'SYNC' && event.data.state) {
            usePlayerStore.getState().syncState(event.data.state);
        }
    };
}
