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
        currentVideo,
        currentIndex,
        play
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
            currentVideo: state.currentVideo,
            currentIndex: state.currentIndex,
            play: state.play
        }))
    );

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
    const { setCastModalOpen } = useUIStore();
    const cast = useCast();
    const { isConnected } = cast;

    const isAnyCastOn = (castMode !== 'none' && castMode !== undefined) || isConnected;

    const controlItems = [
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
            icon: RotateCcw,
            label: "ร้องซ้ำ",
            onClick: () => {
                seekTo(0);
                play(); // Explicitly play locally to re-orient lock
                if (isConnected) {
                    cast.seekTo(0);
                    cast.play();
                }
            },
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
                const toggled = !isMuted;
                setMuted(toggled);
                if (isConnected) {
                    cast.setMuted(toggled);
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
            <div className="relative flex items-center justify-between px-2 h-[56px]">
                {controlItems.map((item, index) => (
                    <button
                        key={index}
                        onClick={item.onClick}
                        className="flex flex-col items-center justify-center flex-1 h-full active:scale-95 transition-all duration-200 group"
                    >
                        <div className={clsx(
                            "p-1 rounded-lg transition-all duration-300 relative",
                            item.active ? (item.label === "ยกเลิก" ? "text-white bg-red-500 shadow-sm" : "text-primary bg-primary/10") : "text-black group-hover:text-black"
                        )}>
                            <item.icon
                                size={20}
                                strokeWidth={item.active ? 2.2 : 1.5}
                                className={clsx("transition-transform duration-300", item.active && "scale-105")}
                            />
                            {item.label === "ยกเลิก" && isAnyCastOn && (
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse border-2 border-white shadow-sm"></span>
                            )}
                            {item.active && item.label !== "ยกเลิก" && (
                                <div className="absolute inset-0 bg-primary/5 blur-md -z-10" />
                            )}
                        </div>
                        <span className={clsx(
                            "text-[8px] font-black uppercase tracking-tighter transition-colors duration-200 mt-[-2px]",
                            item.active ? (item.label === "ยกเลิก" ? "text-red-600" : "text-primary") : "text-black/40"
                        )}>
                            {item.label}
                        </span>
                    </button>
                ))}
            </div>
            {/* Optional Progress Bar (Thin line at bottom) */}
            <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-gray-200/30">
                <div
                    className="h-full bg-primary transition-all duration-1000 shadow-[0_0_6px_rgba(239,68,68,0.4)]"
                    style={{ width: `${progressPercent}%` }}
                />
            </div>
        </div>
    );
};
