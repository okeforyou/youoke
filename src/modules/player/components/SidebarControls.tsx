import React from "react";
import { Play, Pause, SkipForward, RotateCcw, Volume2, VolumeX, Maximize, Cast } from "lucide-react";
import { usePlayerStore } from "../stores/usePlayerStore";
import { useShallow } from "zustand/react/shallow";
import { ListMusic, Trash2 } from "lucide-react";
import { useUIStore } from "../../../stores/useUIStore";
import { useCast } from "../../../plugins/cast/context/CastContext";

export const SidebarControls = () => {
    const {
        isPlaying,
        togglePlay,
        playNext,
        isMuted,
        setMuted,
        triggerFullscreen,
        currentTime,
        duration,
        seekTo
    } = usePlayerStore(
        useShallow(state => ({
            isPlaying: state.isPlaying,
            togglePlay: state.togglePlay,
            playNext: state.playNext,
            isMuted: state.isMuted,
            setMuted: state.setMuted,
            triggerFullscreen: state.triggerFullscreen,
            currentTime: state.currentTime,
            duration: state.duration,
            seekTo: state.seekTo
        }))
    );

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
    const { setCastModalOpen } = useUIStore();
    const { isConnected } = useCast();

    const controlItems = [
        {
            icon: isPlaying ? Pause : Play,
            label: "เล่น/หยุด",
            onClick: togglePlay,
            active: isPlaying,
            color: "text-primary"
        },
        {
            icon: SkipForward,
            label: "เพลงถัดไป",
            onClick: () => playNext(),
            color: "text-primary"
        },
        {
            icon: isMuted ? VolumeX : Volume2,
            label: isMuted ? "เปิดเสียง" : "ปิดเสียง",
            onClick: () => setMuted(!isMuted),
            active: isMuted,
            color: "text-primary"
        },
        {
            icon: Maximize,
            label: "เต็มจอ",
            onClick: triggerFullscreen,
            color: "text-primary"
        },
        {
            icon: Cast,
            label: "CAST",
            onClick: () => setCastModalOpen(true),
            active: isConnected,
            color: "text-primary"
        }
    ];

    return (
        <div className="border-b border-gray-200 shrink-0 select-none" style={{ backgroundColor: '#ffffff' }}>
            {/* Slim Progress Bar */}
            <div className="w-full h-[3px] bg-gray-100 overflow-hidden relative">
                <div
                    className="h-full bg-primary transition-all duration-300 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                    style={{ width: `${progressPercent}%` }}
                />
            </div>

            {/* Horizontal Controls Row */}
            <div className="flex items-center justify-between px-1 py-1.5" style={{ backgroundColor: '#ffffff' }}>
                {controlItems.map((item, index) => (
                    <button
                        key={index}
                        onClick={item.onClick}
                        className="flex flex-col items-center justify-center flex-1 gap-1 group transition-all active:scale-95 bg-white"
                    >
                        <div className={`p-1 rounded-lg transition-all ${item.active ? 'bg-red-50' : ''} relative`}>
                            <item.icon
                                size={22}
                                className={`text-primary transition-colors ${item.active ? 'fill-current' : ''}`}
                            />
                            {item.label === "CAST" && isConnected && (
                                <span className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full animate-pulse border ring-1 ring-white"></span>
                            )}
                        </div>
                        <span className="text-[9px] font-medium text-primary uppercase tracking-tighter transition-colors">
                            {item.label}
                        </span>
                    </button>
                ))}
            </div>

            {/* Integrated Queue Info Row (Dark Mastery) */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 mt-2" style={{ backgroundColor: '#ffffff' }}>
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-gray-50 flex items-center justify-center">
                        <ListMusic size={12} className="text-gray-900" />
                    </div>
                    <span className="text-[14px] font-black text-black tracking-tight">
                        คิวเพลง <span className="ml-0.5">({usePlayerStore.getState().queue.length - (usePlayerStore.getState().currentIndex + 1) > 0 ? usePlayerStore.getState().queue.length - (usePlayerStore.getState().currentIndex + 1) : 0})</span>
                    </span>
                </div>
                {usePlayerStore.getState().queue.length > 0 && (
                    <button
                        onClick={() => {
                            if (confirm('ต้องการลบคิวเพลงทั้งหมดหรือไม่?')) {
                                usePlayerStore.getState().clearQueue();
                            }
                        }}
                        className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-gray-900 hover:bg-gray-200 transition-all duration-300 active:scale-95 border border-gray-200/50"
                    >
                        <Trash2 size={11} className="transition-transform group-hover:scale-110" />
                        <span className="text-[10px] font-black uppercase tracking-wider">ล้างทั้งหมด</span>
                    </button>
                )}
            </div>
        </div>
    );
};
