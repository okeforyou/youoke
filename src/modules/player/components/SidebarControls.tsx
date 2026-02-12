import React from "react";
import { Play, Pause, SkipForward, RotateCcw, Volume2, VolumeX, Maximize, Cast } from "lucide-react";
import { usePlayerStore } from "../stores/usePlayerStore";
import { useShallow } from "zustand/react/shallow";

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
            color: "text-red-500"
        },
        {
            icon: SkipForward,
            label: "เพลงถัดไป",
            onClick: () => playNext(),
            color: "text-red-500"
        },
        {
            icon: RotateCcw,
            label: "ร้องซ้ำ",
            onClick: () => seekTo(0),
            color: "text-red-500"
        },
        {
            icon: isMuted ? VolumeX : Volume2,
            label: isMuted ? "เปิดเสียง" : "ปิดเสียง",
            onClick: () => setMuted(!isMuted),
            active: isMuted,
            color: "text-red-500"
        },
        {
            icon: Maximize,
            label: "เต็มจอ",
            onClick: triggerFullscreen,
            color: "text-red-500"
        },
        {
            icon: Cast,
            label: "CAST",
            onClick: () => {
                // Cast logic or trigger
                console.log("Cast triggered");
            },
            color: "text-red-500"
        }
    ];

    return (
        <div className="bg-transparent border-b border-gray-100 shrink-0 select-none">
            {/* Slim Progress Bar */}
            <div className="w-full h-[3px] bg-gray-100 overflow-hidden relative">
                <div
                    className="h-full bg-primary transition-all duration-300 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                    style={{ width: `${progressPercent}%` }}
                />
            </div>

            {/* Horizontal Controls Row */}
            <div className="flex items-center justify-between px-1 py-0.5">
                {controlItems.map((item, index) => (
                    <button
                        key={index}
                        onClick={item.onClick}
                        className="flex flex-col items-center justify-center flex-1 gap-0 group transition-all active:scale-95"
                    >
                        <div className={`
                            p-1 rounded-lg transition-all
                            ${item.active ? 'bg-red-50' : 'hover:bg-gray-50'}
                        `}>
                            <item.icon
                                size={20}
                                className={`${item.color} ${item.active ? 'fill-current' : ''}`}
                            />
                        </div>
                        <span className="text-[9px] font-bold text-red-500 uppercase tracking-tighter group-hover:text-red-600 transition-colors">
                            {item.label}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};
