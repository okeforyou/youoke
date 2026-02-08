import { create } from 'zustand';

interface UIState {
    isQueueOpen: boolean;
    setQueueOpen: (isOpen: boolean) => void;
    toggleQueue: () => void;

    isNavOpen: boolean;
    setNavOpen: (isOpen: boolean) => void;

    isMobileSearchOpen: boolean;
    setMobileSearchOpen: (isOpen: boolean) => void;

    isMobilePlayerExpanded: boolean;
    setMobilePlayerExpanded: (expanded: boolean) => void;

    isProfileOpen: boolean;
    setProfileOpen: (isOpen: boolean) => void;

    isCastModalOpen: boolean;
    setCastModalOpen: (isOpen: boolean) => void;

    isReceiverModalOpen: boolean;
    setReceiverModalOpen: (isOpen: boolean) => void;

    isLimitModalOpen: boolean;
    setLimitModalOpen: (isOpen: boolean) => void;

    isPlayerHidden: boolean;
    setPlayerHidden: (hidden: boolean) => void;

    backAction: (() => void) | null;
    setBackAction: (action: (() => void) | null) => void;

    isFullscreen: boolean;
    setFullscreen: (fullscreen: boolean) => void;

    musicTheme: 'spotify' | 'youtube';
    setMusicTheme: (theme: 'spotify' | 'youtube') => void;
}



export const useUIStore = create<UIState>((set) => ({
    isQueueOpen: false,
    setQueueOpen: (isOpen) => set({ isQueueOpen: isOpen }),
    toggleQueue: () => set((state) => ({ isQueueOpen: !state.isQueueOpen })),

    isNavOpen: false,
    setNavOpen: (isOpen) => set({ isNavOpen: isOpen }),

    isMobileSearchOpen: false,
    setMobileSearchOpen: (isOpen) => set({ isMobileSearchOpen: isOpen }),

    isMobilePlayerExpanded: false,
    setMobilePlayerExpanded: (expanded) => set({ isMobilePlayerExpanded: expanded }),

    isProfileOpen: false,
    setProfileOpen: (isOpen) => set({ isProfileOpen: isOpen }),

    isCastModalOpen: false,
    setCastModalOpen: (isOpen) => set({ isCastModalOpen: isOpen }),

    isReceiverModalOpen: false,
    setReceiverModalOpen: (isOpen) => set({ isReceiverModalOpen: isOpen }),

    isLimitModalOpen: false,
    setLimitModalOpen: (isOpen) => set({ isLimitModalOpen: isOpen }),

    isPlayerHidden: false, // Default visible
    setPlayerHidden: (hidden) => set({ isPlayerHidden: hidden }),

    backAction: null,
    setBackAction: (action) => set({ backAction: action }),

    isFullscreen: false,
    setFullscreen: (fullscreen) => set({ isFullscreen: fullscreen }),

    musicTheme: 'spotify',
    setMusicTheme: (theme) => set({ musicTheme: theme }),
}));
