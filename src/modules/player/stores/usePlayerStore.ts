import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { PlayerState, Video, QueueItem, PlayerStore } from '../types';
// Enhance type definition inline if not editing types file, or assume it's merged.
// Actually I need to verify where PlayerStore is defined.
// Assuming it's in types.ts, I should edit that too.
// But for now, I'll just add the implementation.
// Wait, TS will complain. checking types file location.
import { generateUUID, broadcast, bc } from '../utils';

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
            queue: [],
            currentIndex: 0,
            currentVideo: null,
            layoutMode: 'split',
            isQueueVisible: false, // Default hidden in fullscreen

            // Sync Locks
            seekTarget: null,
            ignoreUpdatesUntil: 0,

            syncState: (newState) => {
                // When receiving state from another tab, we also respect the smart lock.
                const { ignoreUpdatesUntil, seekTarget } = get();
                const now = Date.now();

                // If we have a local lock, and the incoming state has a time...
                if (newState.currentTime !== undefined && ignoreUpdatesUntil && now < ignoreUpdatesUntil && seekTarget !== null) {
                    // Same smart check: is the incoming time close to our target?
                    if (Math.abs(newState.currentTime - seekTarget) < 1.5) {
                        // Unlock!
                        set({ ...newState, ignoreUpdatesUntil: 0, seekTarget: null });
                    } else {
                        // Ignore the time part of the sync, keep our local seek target time
                        // safely destructure to avoid overwriting with stale time
                        const { currentTime, ...rest } = newState;
                        set({ ...rest });
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
                const { ignoreUpdatesUntil, seekTarget } = get();
                const now = Date.now();

                // SMART LOCK CHECK:
                // If we have an active lock...
                if (ignoreUpdatesUntil && now < ignoreUpdatesUntil && seekTarget !== null) {
                    // Check if this new time is "close enough" to our target (within 1.5s)
                    // If it is, it means the player has successfully seeked. We can unlock!
                    if (Math.abs(time - seekTarget) < 1.5) {
                        // Unlock early!
                        set({ ignoreUpdatesUntil: 0, seekTarget: null });
                    } else {
                        // The time is still far from target (likely old stale time).
                        // Ignore this update to prevent rubber-banding.
                        return;
                    }
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
                const channel = new BroadcastChannel('player_sync');
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
                const newItem: QueueItem = {
                    id: videoId,
                    videoId, // Backward compat
                    sourceType: 'youtube',
                    title: 'Playing Video',
                    author: 'System',
                    uuid: generateUUID(),
                    thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
                };
                const newState = {
                    queue: [newItem],
                    currentIndex: 0,
                    currentVideo: newItem,
                    currentSource: videoId,
                    isPlaying: true,
                    layoutMode: get().layoutMode
                };
                broadcast(newState);
                return newState;
            }),

            setActiveAdapter: (id) => set({ activeAdapterId: id }),

            setPlayerState: (state) => set((prev) => ({ ...prev, ...state })),

            addToQueue: (video, autoPlay = true) => set((state) => {
                console.log('🏗️ Store Action: addToQueue', video);
                const newItem: QueueItem = { ...video, uuid: generateUUID() };
                const newQueue = [...state.queue, newItem];
                console.log('✅ New Queue Length:', newQueue.length);

                let updates: Partial<PlayerStore> = { queue: newQueue };

                // If queue was empty, set as current (only if autoPlay is true)
                if (state.queue.length === 0 && !state.currentVideo && autoPlay) {
                    // Determine source string based on type
                    // Robust Source Extraction
                    let source = newItem.id; // Default fallback
                    const type = newItem.sourceType || 'youtube'; // Default to YouTube if missing

                    if (type === 'youtube') {
                        source = newItem.videoId || newItem.id;
                        if (!source) console.error("❌ PlayerStore: YouTube ID missing for item", newItem);
                    } else if (type === 'vcd') {
                        source = newItem.filePath || newItem.id;
                    } else if (type === 'midi') {
                        source = newItem.id;
                    }

                    updates = {
                        ...updates,
                        currentIndex: 0,
                        currentVideo: newItem,
                        currentSource: source,
                        isPlaying: true
                    };
                    console.log(`▶️ Store: Playing ${source} (Type: ${newItem.sourceType})`);
                }

                broadcast(updates);
                return updates;
            }),

            removeFromQueue: (uuid) => set((state) => {
                const newQueue = state.queue.filter(item => item.uuid !== uuid);
                broadcast({ queue: newQueue });
                return { queue: newQueue };
            }),

            reorderQueue: (newQueue) => {
                set({ queue: newQueue });
                broadcast({ queue: newQueue });
            },

            setCurrentIndex: (index) => set((state) => {
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

                const updates = {
                    currentIndex: index,
                    currentVideo: video,
                    currentSource: source,
                    isPlaying: true
                };
                broadcast(updates);
                return updates;
            }),

            playNext: () => {
                const state = get();
                if (state.queue.length > 0) {
                    const newQueue = state.queue.slice(1);
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

                        console.log(`▶️ Store: Playing Next. Source: ${source}`);

                        const updates = {
                            queue: newQueue,
                            currentIndex: 0,
                            currentSource: source,
                            isPlaying: true,
                            layoutMode: get().layoutMode,
                            seekTarget: null,
                            ignoreUpdatesUntil: 0
                        };
                        set(updates);
                        broadcast(updates);
                    } else {
                        const updates = {
                            queue: [],
                            currentIndex: 0,
                            currentVideo: null,
                            currentSource: null,
                            isPlaying: false,
                            layoutMode: get().layoutMode,
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
                const updates = { queue: [], currentVideo: null, currentSource: null, isPlaying: false, currentIndex: 0 };
                set(updates);
                broadcast(updates);
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

                broadcast({ queue: newQueue, currentIndex: newIndex });
                return { queue: newQueue, currentIndex: newIndex };
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
                layoutMode: state.layoutMode,
                // Persist Queue & Playback State
                queue: state.queue,
                currentIndex: state.currentIndex,
                currentVideo: state.currentVideo,
                currentSource: state.currentSource,
                // Persist UI State
                searchTerm: state.searchTerm,
                isKaraoke: state.isKaraoke,
                activeIndex: state.activeIndex,
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
