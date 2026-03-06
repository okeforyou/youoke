import React from "react";
import { Play, Pause, SkipForward, RotateCcw, Volume2, VolumeX, Maximize, Cast } from "lucide-react";
import { usePlayerStore } from "../stores/usePlayerStore";
import { useShallow } from "zustand/react/shallow";
import { ListMusic, Trash2 } from "lucide-react";
import { useUIStore } from "../../../stores/useUIStore";
import { useCast } from "../../../plugins/cast/context/CastContext";
import clsx from 'clsx';

interface SidebarControlsProps {
    castMode?: string;
}

export const SidebarControls = ({ castMode = 'none' }: SidebarControlsProps) => {
    const {
        isPlaying,
        togglePlay,
        playNext,
        isMuted,
        setMuted,
        triggerFullscreen,
        currentTime,
        duration,
        seekTo,
        currentVideo
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
            seekTo: state.seekTo,
            currentVideo: state.currentVideo
        }))
    );

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
    const { setCastModalOpen } = useUIStore();
    const cast = useCast();
    const { isConnected } = cast;

    const isAnyCastOn = (castMode !== 'none' && castMode !== undefined) || isConnected;

    const controlItems = [
        {
            icon: RotateCcw,
            label: "ร้องซ้ำ",
            onClick: () => {
                if (isConnected && currentVideo) {
                    cast.playNow(currentVideo);
                } else {
                    seekTo(0);
                    if (!isPlaying) togglePlay();
                }
            },
            color: "text-primary"
        },
        {
            icon: isPlaying ? Pause : Play,
            label: "เล่น/หยุด",
            onClick: () => {
                if (isConnected) {
                    isPlaying ? cast.pause() : cast.play();
                } else {
                    togglePlay();
                }
            },
            active: isPlaying,
            color: "text-primary"
        },
        {
            icon: SkipForward,
            label: "เพลงถัดไป",
            onClick: () => {
                if (isConnected) {
                    cast.next();
                } else {
                    playNext();
                }
            },
            color: "text-primary"
        },
        {
            icon: isMuted ? VolumeX : Volume2,
            label: isMuted ? "เปิดเสียง" : "ปิดเสียง",
            onClick: () => {
                if (isConnected) {
                    isMuted ? cast.unmute() : cast.mute();
                } else {
                    setMuted(!isMuted);
                }
            },
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
            label: isAnyCastOn ? "ยกเลิก" : "CAST",
            onClick: () => setCastModalOpen(true),
            active: isAnyCastOn,
            color: isAnyCastOn ? "text-red-500" : "text-black"
        }
    ];

    return (
        <div className="shrink-0 select-none relative shadow-sm">
            {/* Glass Background matching Footer */}
            <div className="absolute inset-0 bg-[#f4f4f5]/95 backdrop-blur-xl border-b border-gray-200/50" />

            {/* Horizontal Controls Row - Full Width with depth */}
            <div className="relative flex items-center justify-between px-2 h-[72px]">
                {controlItems.map((item, index) => (
                    <button
                        key={index}
                        onClick={item.onClick}
                        className="flex flex-col items-center justify-center flex-1 gap-1 group transition-all active:scale-95"
                    >
                        <div className={clsx(
                            "p-2 rounded-xl transition-all duration-300 relative",
                            item.active ? (item.label === "ยกเลิก" ? "bg-red-500 text-white shadow-lg scale-105" : "text-primary bg-white shadow-md scale-105") : "text-black group-hover:text-black"
                        )}>
                            <item.icon
                                size={20}
                                strokeWidth={item.active ? 2.5 : 2}
                                className={clsx(
                                    "transition-all duration-300",
                                    item.active ? (item.label === "ยกเลิก" ? "text-white" : "text-primary") : "text-black"
                                )}
                            />
                            {item.label === "ยกเลิก" && isConnected && (
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse border-2 border-white shadow-sm"></span>
                            )}
                        </div>
                        <span className={clsx(
                            "text-[10px] font-medium transition-colors duration-200",
                            item.active && item.label === "ยกเลิก" ? "text-red-600 font-bold" : (item.active ? "text-primary font-bold" : "text-black/60")
                        )}>
                            {item.label}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};
