import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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

    isCastingLocal: boolean;
    setIsCastingLocal: (isCasting: boolean) => void;

    castMode: string;
    setCastMode: (mode: string) => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            isQueueOpen: false,
            setQueueOpen: (isOpen: boolean) => set({ isQueueOpen: isOpen }),
            toggleQueue: () => set((state) => ({ isQueueOpen: !state.isQueueOpen })),

            isNavOpen: false,
            setNavOpen: (isOpen: boolean) => set({ isNavOpen: isOpen }),

            isMobileSearchOpen: false,
            setMobileSearchOpen: (isOpen: boolean) => set({ isMobileSearchOpen: isOpen }),

            isMobilePlayerExpanded: false,
            setMobilePlayerExpanded: (expanded: boolean) => set({ isMobilePlayerExpanded: expanded }),

            isProfileOpen: false,
            setProfileOpen: (isOpen: boolean) => set({ isProfileOpen: isOpen }),

            isCastModalOpen: false,
            setCastModalOpen: (isOpen: boolean) => set({ isCastModalOpen: isOpen }),

            isReceiverModalOpen: false,
            setReceiverModalOpen: (isOpen: boolean) => set({ isReceiverModalOpen: isOpen }),

            isLimitModalOpen: false,
            setLimitModalOpen: (isOpen: boolean) => set({ isLimitModalOpen: isOpen }),

            isPlayerHidden: false,
            setPlayerHidden: (hidden: boolean) => set({ isPlayerHidden: hidden }),

            backAction: null,
            setBackAction: (action: (() => void) | null) => set({ backAction: action }),

            isFullscreen: false,
            setFullscreen: (fullscreen: boolean) => set({ isFullscreen: fullscreen }),

            musicTheme: 'spotify',
            setMusicTheme: (theme: 'spotify' | 'youtube') => set({ musicTheme: theme }),

            isCastingLocal: false,
            setIsCastingLocal: (isCasting: boolean) => set({ isCastingLocal: isCasting }),

            castMode: 'none',
            setCastMode: (mode: string) => set({ castMode: mode }),
        }),
        {
            name: 'youoke-ui-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                isQueueOpen: state.isQueueOpen,
                castMode: state.castMode,
                musicTheme: state.musicTheme,
            }),
        }
    )
);
