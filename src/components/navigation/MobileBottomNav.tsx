import React from 'react';
import { Home, Star, Flame, Library, User, ListMusic, Search, Gem } from 'lucide-react';
import { usePlayerStore } from '../../modules/player/stores/usePlayerStore';
import { useUIStore } from '../../stores/useUIStore';
import clsx from 'clsx';
import { useShallow } from 'zustand/react/shallow';
import { useRouter } from 'next/router';

export const MobileBottomNav = () => {
    const { activeIndex, setActiveIndex, setSearchTerm, queue, currentIndex } = usePlayerStore(
        useShallow(state => ({
            activeIndex: state.activeIndex,
            setActiveIndex: state.setActiveIndex,
            setSearchTerm: state.setSearchTerm,
            queue: state.queue,
            currentIndex: state.currentIndex
        }))
    );
    const { setPlayerHidden, setQueueOpen, isQueueOpen, isPlayerHidden } = useUIStore();

    const navItems = [
        { id: 1, label: 'หน้าหลัก', icon: Home },
        { id: 2, label: 'แนะนำ', icon: Star },
        { id: 3, label: 'มาแรง', icon: Flame },
        { id: 4, label: 'เพลย์ลิสต์', icon: Library },
        { id: 5, label: 'คิวเพลง', icon: ListMusic },
    ];

    const handleNavClick = (index: number) => {
        if (index === 5) {
            // Queue Action: Toggle Player/Queue visibility
            if (isQueueOpen && !isPlayerHidden) {
                setPlayerHidden(true); // Hide completely logic
                setQueueOpen(false);
            } else {
                setPlayerHidden(false); // Ensure visible
                setQueueOpen(true); // Open Queue
            }
            return;
        } else {
            setSearchTerm(''); // Clear search logic from MainLayout
            setActiveIndex(index);
            setQueueOpen(false); // Close queue when changing main tabs

            // Explicit scroll reset for navigation commands
            if (typeof window !== 'undefined') {
                const main = document.querySelector('main');
                if (main) main.scrollTo({ top: 0, behavior: 'instant' });
            }
        }
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[60] pb-[env(safe-area-inset-bottom)] lg:hidden subpixel-antialiased antialiased">
            {/* Glass Background */}
            <div className="absolute inset-0 bg-[#f4f4f5]/95 backdrop-blur-xl border-t border-gray-200/50" />

            <div className="relative flex justify-around items-center h-[72px] px-2 pb-2">
                {navItems.map((item) => {
                    const isActive = item.id === 5 ? isQueueOpen : (!isQueueOpen && activeIndex === item.id);
                    return (
                        <button
                            key={item.id}
                            onClick={() => handleNavClick(item.id)}
                            className="flex-1 flex flex-col items-center justify-center gap-1 py-2 active:scale-95 transition-all duration-200 group"
                        >
                            <div className={clsx(
                                "p-1.5 rounded-xl transition-all duration-300 relative",
                                isActive ? "text-primary bg-primary/10" : "text-black group-hover:text-black"
                            )}>
                                <item.icon
                                    size={24}
                                    strokeWidth={isActive ? 2.5 : 2}
                                    className={clsx("transition-transform duration-300", isActive && "scale-110")}
                                />
                                {isActive && (
                                    <div className="absolute inset-0 bg-primary/10 blur-lg" />
                                )}
                                {/* Queue Badge */}
                                {item.id === 5 && (queue.length - (currentIndex + 1)) > 0 && (
                                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center border border-white shadow-sm">
                                        {queue.length - (currentIndex + 1)}
                                    </div>
                                )}
                            </div>
                            <span className={clsx(
                                "text-[10px] font-medium transition-colors duration-200",
                                isActive ? "text-primary font-bold" : "text-black"
                            )}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
