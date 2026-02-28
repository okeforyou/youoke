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

    const isAnyCastOn = castMode !== 'none' || isConnected;

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
            label: isAnyCastOn ? "ยกเลิก" : "CAST",
            onClick: () => setCastModalOpen(true),
            active: isAnyCastOn,
            color: isAnyCastOn ? "text-red-500" : "text-primary"
        }
    ];

    return (
        <div className="shrink-0 select-none bg-white">

            {/* Horizontal Controls Row */}
            <div className="flex items-center justify-between px-1 py-1.5" style={{ backgroundColor: '#ffffff' }}>
                {controlItems.map((item, index) => (
                    <button
                        key={index}
                        onClick={item.onClick}
                        className="flex flex-col items-center justify-center flex-1 gap-1 group transition-all active:scale-95 bg-white"
                    >
                        <div className={clsx(
                            "p-1 rounded-lg transition-all relative",
                            item.active ? (item.label === "ยกเลิก" ? "bg-red-500 text-white" : "bg-red-50") : ""
                        )}>
                            <item.icon
                                size={22}
                                className={clsx(
                                    "transition-colors",
                                    item.active ? (item.label === "ยกเลิก" ? "text-white" : "text-primary fill-primary/20") : "text-primary"
                                )}
                            />
                            {item.label === "ยกเลิก" && (
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse border-2 border-white shadow-sm"></span>
                            )}
                        </div>
                        <span className={clsx(
                            "text-[9px] font-black uppercase tracking-tighter transition-colors",
                            item.active && item.label === "ยกเลิก" ? "text-red-600" : "text-primary"
                        )}>
                            {item.label}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};
