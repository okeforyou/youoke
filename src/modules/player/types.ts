export type SourceType = 'youtube' | 'midi' | 'vcd' | 'search';

export interface MediaPlayerAdapter {
    id: string; // 'youtube' | 'local' | 'midi'
    play(): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>; // acts like play
    stop(): Promise<void>;
    seekTo(seconds: number): Promise<void>;
    setVolume(volume: number): Promise<void>;
    getDuration(): Promise<number>;
    getCurrentTime(): Promise<number>;
    loadMedia(source: string): Promise<void>;
}

export interface Video {
    id: string; // Unified ID (maps to youtubeId or filehash)
    sourceType: SourceType;

    // Metadata
    title: string;
    author: string;
    thumbnail?: string;
    duration?: number;

    // Source Specific
    videoId?: string; // YouTube ID (backward compat)
    filePath?: string; // Local/Network Path for VCD/MIDI

    addedBy?: {
        uid: string;
        displayName: string;
        photoURL?: string;
    };
}

export interface QueueItem extends Video {
    uuid: string; // Unique ID for queue manipulation (handling duplicates)
}

// ... keep existing interfaces

export interface PlayerState {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    isMuted: boolean;
    currentSource: string | null;
    adapterId: string;
    repeatMode: 'off' | 'one' | 'all';
}

export interface PlayerStore extends PlayerState {
    queue: QueueItem[];
    // ... (rest of PlayerStore)
    activeAdapterId: string;
    currentIndex: number;
    currentVideo: QueueItem | null;
    layoutMode: 'split' | 'fullscreen';
    isQueueVisible: boolean; // New state
    isQrVisible: boolean; // New state for large QR overlay
    fullscreenTrigger: number; // Timestamp or Counter for signal
    notification: { type: 'added' | 'upnext', video: any, timestamp: number } | null;

    // UI State (Unification)

    // UI State (Unification)
    searchTerm: string;
    isKaraoke: boolean;
    activeIndex: number;

    // Sync State
    seekTarget: number | null;
    ignoreUpdatesUntil: number;

    // Actions
    setVolume: (vol: number) => void;
    setMuted: (muted: boolean) => void;
    setLayoutMode: (mode: 'split' | 'fullscreen') => void;
    toggleQueueVisibility: () => void; // New action
    setQueueVisibility: (visible: boolean) => void; // New action
    setQrVisibility: (visible: boolean) => void; // New action
    toggleQr: (visible?: boolean) => void; // New action
    triggerFullscreen: () => void; // New action

    // UI Actions

    // UI Actions
    setSearchTerm: (term: string) => void;
    setIsKaraoke: (isKaraoke: boolean) => void;
    setActiveIndex: (index: number) => void;

    play: () => void;
    pause: () => void;
    togglePlay: () => void;
    setCurrentTime: (time: number) => void;
    seekTo: (time: number) => void; // New centralised seek with Lock
    syncRemoteTime: (time: number) => void;
    playVideo: (videoId: string) => void;
    setActiveAdapter: (id: string) => void;

    // Queue Actions
    addToQueue: (video: Video | Video[], autoPlay?: boolean) => void; // Updated signature to support bulk addition
    removeFromQueue: (uuid: string) => void;
    reorderQueue: (newQueue: QueueItem[]) => void;
    setCurrentIndex: (index: number) => void;
    playNext: () => void;
    playPrevious: () => void;
    playVideoAtIndex: (index: number) => void;
    removeVideoAtIndex: (index: number) => void;
    insertVideoAtIndex: (index: number, video: Video) => void;
    moveVideo: (fromIndex: number, toIndex: number) => void;
    clearQueue: () => void;

    // Internal (called by adapters)
    setPlayerState: (state: Partial<PlayerStore>) => void;
    setRepeatMode: (mode: 'off' | 'one' | 'all') => void;

    // Sync Action
    syncState: (state: Partial<PlayerStore>) => void;
    setNotification: (notif: any) => void;

    setDuration: (duration: number) => void;
    shuffleQueue: () => void;
}
