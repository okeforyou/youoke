import React from "react";
import { Play, Pause, SkipForward, RotateCcw, Volume2, VolumeX, Maximize, Cast } from "lucide-react";
import { usePlayerStore } from "../stores/usePlayerStore";
import { useShallow } from "zustand/react/shallow";
import { ListMusic, Trash2 } from "lucide-react";

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
            icon: RotateCcw,
            label: "ร้องซ้ำ",
            onClick: () => seekTo(0),
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
            onClick: () => {
                // Cast logic or trigger
                console.log("Cast triggered");
            },
            color: "text-primary"
        }
    ];

    return (
        <div className="border-b border-gray-100 shrink-0 select-none" style={{ backgroundColor: '#ffffff' }}>
            {/* Slim Progress Bar */}
            <div className="w-full h-[3px] bg-gray-100 overflow-hidden relative">
                <div
                    className="h-full bg-primary transition-all duration-300 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                    style={{ width: `${progressPercent}%` }}
                />
            </div>

            {/* Horizontal Controls Row */}
            <div className="flex items-center justify-between px-1 py-0.5" style={{ backgroundColor: '#ffffff' }}>
                {controlItems.map((item, index) => (
                    <button
                        key={index}
                        onClick={item.onClick}
                        className="flex flex-col items-center justify-center flex-1 gap-0 group transition-all active:scale-95 bg-white"
                    >
                        <div className={`p-1.5 rounded-lg transition-all ${item.active ? 'bg-red-50' : ''}`}>
                            <item.icon
                                size={18}
                                className={`text-primary transition-colors ${item.active ? 'fill-current' : ''}`}
                            />
                        </div>
                        <span className="text-[9px] font-bold text-primary uppercase tracking-tighter transition-colors">
                            {item.label}
                        </span>
                    </button>
                ))}
            </div>

            {/* Integrated Queue Info Row (Simplified V1 Style) */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-gray-50" style={{ backgroundColor: '#ffffff' }}>
                <div className="flex items-center gap-1.5">
                    <ListMusic size={12} className="text-gray-400" />
                    <span className="text-[11px] font-medium text-gray-400">
                        คิวเพลง ({usePlayerStore.getState().queue.length - (usePlayerStore.getState().currentIndex + 1) > 0 ? usePlayerStore.getState().queue.length - (usePlayerStore.getState().currentIndex + 1) : 0})
                    </span>
                </div>
                {usePlayerStore.getState().queue.length > 0 && (
                    <button
                        onClick={() => {
                            if (confirm('ต้องการลบคิวเพลงทั้งหมดหรือไม่?')) {
                                usePlayerStore.getState().clearQueue();
                            }
                        }}
                        className="text-[10px] font-bold text-red-400 hover:text-red-500 uppercase tracking-tight transition-colors flex items-center gap-1"
                    >
                        <Trash2 size={10} />
                        ล้างทั้งหมด
                    </button>
                )}
            </div>
        </div>
    );
};
