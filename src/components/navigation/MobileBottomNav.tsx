import React from 'react';
import { Home, BarChart2, Headphones, Library, User, ListMusic, Search, Gem } from 'lucide-react';
import { usePlayerStore } from '../../modules/player/stores/usePlayerStore';
import { useUIStore } from '../../stores/useUIStore';
import { useSystem } from '../../core/container/SystemContext';
import clsx from 'clsx';
import { useShallow } from 'zustand/react/shallow';
import { useRouter } from 'next/router';
import { auth } from '../../firebase';

export const MobileBottomNav = () => {
    const router = useRouter();
    const { user } = useSystem().auth();
    const { activeIndex, setActiveIndex, setSearchTerm } = usePlayerStore(
        useShallow(state => ({
            activeIndex: state.activeIndex,
            setActiveIndex: state.setActiveIndex,
            setSearchTerm: state.setSearchTerm,
        }))
    );
    const { setProfileOpen, isProfileOpen, setQueueOpen, isQueueOpen } = useUIStore();

    const navItems = [
        { id: 1, label: 'หน้าหลัก', icon: Home },
        { id: 2, label: 'ชาร์ตเพลง', icon: BarChart2 },
        { id: 3, label: 'สถานีเพลง', icon: Headphones },
        { id: 4, label: 'เพลย์ลิสต์', icon: Library },
        { id: 5, label: 'บัญชี', icon: User },
    ];

    const handleNavClick = (index: number) => {
        if (index === 5) {
            if (!user) {
                router.push('/login');
                return;
            }
            setProfileOpen(true);
            return;
        } else {
            setSearchTerm(''); // Clear search logic from MainLayout
            setActiveIndex(index);
            setQueueOpen(false); // Close queue when changing main tabs

            // Sync with URL like Sidebar
            const tabMap: Record<number, string> = { 1: 'home', 2: 'trending', 3: 'station', 4: 'library' };
            router.push({
                pathname: '/',
                query: { tab: tabMap[index] }
            }, undefined, { shallow: true });

            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[60] pb-[env(safe-area-inset-bottom)] lg:hidden subpixel-antialiased antialiased">
            {/* Glass Background */}
            <div className="absolute inset-0 bg-[#f4f4f5]/95 backdrop-blur-xl border-t border-gray-200/50" />

            <div className="relative flex justify-around items-center h-[72px] px-2 pb-2">
                {navItems.map((item) => {
                    const isActive = item.id === 5 ? isProfileOpen : (!isQueueOpen && activeIndex === item.id);
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
                                {item.id === 5 ? (
                                    (() => {
                                        const photoURL = user?.photoURL || auth?.currentUser?.photoURL;
                                        
                                        if (photoURL && user) {
                                            return <img src={photoURL} className={clsx("w-6 h-6 rounded-full border transition-transform duration-300", isActive ? "scale-110 border-primary" : "border-transparent")} alt="Profile" />;
                                        }
                                        
                                        return (
                                            <item.icon
                                                size={24}
                                                strokeWidth={isActive ? 2.5 : 2}
                                                className={clsx("transition-transform duration-300", isActive && "scale-110")}
                                            />
                                        );
                                    })()
                                ) : (
                                    <item.icon
                                        size={24}
                                        strokeWidth={isActive ? 2.5 : 2}
                                        className={clsx("transition-transform duration-300", isActive && "scale-110")}
                                    />
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

