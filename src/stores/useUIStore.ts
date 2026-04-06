import { create } from 'zustand';
import { SystemConfig, DEFAULT_CONFIG } from '../services/systemConfigService';

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

    castMode: 'none' | 'smarttv' | 'webmonitor' | 'dual' | 'google' | 'youtube';
    setCastMode: (mode: 'none' | 'smarttv' | 'webmonitor' | 'dual' | 'google' | 'youtube') => void;

    isSidebarCollapsed: boolean;
    setSidebarCollapsed: (collapsed: boolean) => void;

    isDarkMode: boolean;
    toggleDarkMode: () => void;

    confirmModal: {
        isOpen: boolean;
        title: string;
        message: string;
        confirmText?: string;
        cancelText?: string;
        type?: 'danger' | 'warning' | 'info' | 'success';
        onConfirm: () => void;
    };
    showConfirm: (data: {
        title: string;
        message: string;
        confirmText?: string;
        cancelText?: string;
        type?: 'danger' | 'warning' | 'info' | 'success';
        onConfirm: () => void;
    }) => void;
    hideConfirm: () => void;

    config: SystemConfig;
    setConfig: (config: SystemConfig) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
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

    musicTheme: 'youtube',
    setMusicTheme: (theme) => set({ musicTheme: theme }),

    isCastingLocal: false,
    setIsCastingLocal: (isCasting) => set({ isCastingLocal: isCasting }),

    castMode: 'none',
    setCastMode: (mode) => set({ castMode: mode }),

    isSidebarCollapsed: false,
    setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),

    // v4.9.75: Full Dark Mode State
    isDarkMode: typeof window !== 'undefined' ? (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) : false,
    toggleDarkMode: () => set((state) => {
        const newVal = !state.isDarkMode;
        localStorage.setItem('theme', newVal ? 'dark' : 'light');
        if (newVal) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        return { isDarkMode: newVal };
    }),

    confirmModal: {
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { }
    },
    showConfirm: (data) => set({
        confirmModal: {
            isOpen: true,
            title: data.title,
            message: data.message,
            confirmText: data.confirmText,
            cancelText: data.cancelText,
            type: data.type || 'info',
            onConfirm: data.onConfirm
        }
    }),
    hideConfirm: () => set({ confirmModal: { ...get().confirmModal, isOpen: false } }),

    config: DEFAULT_CONFIG,
    setConfig: (config) => set({ config }),
}));
