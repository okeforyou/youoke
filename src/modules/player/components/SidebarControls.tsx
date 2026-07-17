import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipForward, RotateCcw, Volume2, VolumeX, Maximize, Cast, Mic, MicOff, ChevronUp } from "lucide-react";
import { usePlayerStore } from "../stores/usePlayerStore";
import { useMixerStore } from "../stores/useMixerStore";
import { useShallow } from "zustand/react/shallow";
import { useUIStore } from "../../../stores/useUIStore";
import { useCast } from "../../../plugins/cast/context/CastContext";
import clsx from 'clsx';
import { AIVocalControls } from "./AIVocalControls";

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

    const {
        trackStates,
    } = useMixerStore();

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
    const { setCastModalOpen } = useUIStore();
    const cast = useCast();
    const { isConnected, isRecovering } = cast;

    const isAnyCastOn = (castMode !== 'none' && castMode !== undefined) || isConnected;



    // Build control items dynamically
    const controlItems = [
        {
            id: 'play',
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
            id: 'repeat',
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
            id: 'next',
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
    ];



    controlItems.push(
        {
            id: 'volume',
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
            id: 'fullscreen',
            icon: Maximize,
            label: "เต็มจอ",
            onClick: triggerFullscreen,
            color: "text-primary"
        },
        {
            id: 'cast',
            icon: Cast,
            label: isRecovering ? "กำลังเชื่อมต่อ..." : (isAnyCastOn ? "ยกเลิก" : "CAST"),
            onClick: () => {
                if (castMode === 'google' && !isConnected) {
                    useUIStore.getState().setCastMode('none');
                }
                setCastModalOpen(true);
            },
            active: isAnyCastOn,
            // v5.5.6: Neutral color for icon, state moved to the dot indicator
            color: "text-black dark:text-zinc-200"
        }
    );

    return (
        <div className="shrink-0 select-none relative shadow-sm">
            {/* Glass Background matching Footer */}
            <div className="absolute inset-0 bg-[#f4f4f5]/95 dark:bg-zinc-900/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-zinc-800/50 transition-colors" />



            {/* Horizontal Controls Row - Full Width with depth */}
            <div className="relative flex items-center justify-between px-2 h-[56px]">
                {/* AI Vocal Button - Inserted at the beginning or alongside other controls */}
                <div className="flex-1 flex justify-center items-center h-full border-r border-gray-200/30 dark:border-zinc-800/30">
                    <AIVocalControls mobile={true} />
                </div>
                
                {controlItems.map((item, index) => (
                    <button
                        key={item.id}
                        onClick={(e) => {
                            item.onClick();
                        }}
                        className="flex flex-col items-center justify-center flex-1 h-full active:scale-95 transition-all duration-200 group relative"
                    >
                        <div className={clsx(
                            "p-1 rounded-xl transition-all duration-300 relative flex items-center justify-center gap-0.5",
                            item.active ? "text-primary bg-primary/10" : "text-black dark:text-zinc-400 group-hover:text-black dark:group-hover:text-white"
                        )}>
                            <item.icon
                                size={20}
                                strokeWidth={item.active ? 2.2 : 1.5}
                                className={clsx("transition-transform duration-300", item.active && "scale-105")}
                            />
                            {/* v5.5.6: Unified Status Dot for Cast Modes */}
                            {(item.label === "CAST" || item.label === "ยกเลิก" || item.label === "กำลังเชื่อมต่อ...") && (
                                <>
                                    {isRecovering ? (
                                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-orange-500 rounded-full animate-pulse border-2 border-white dark:border-zinc-950 shadow-sm"></span>
                                    ) : isAnyCastOn ? (
                                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-zinc-950 shadow-sm"></span>
                                    ) : null}
                                </>
                            )}
                            {item.active && item.label !== "ยกเลิก" && item.label !== "กำลังเชื่อมต่อ..." && item.label !== "CAST" && (
                                <div className="absolute inset-0 bg-primary/5 blur-md -z-10" />
                            )}
                        </div>
                        <span className={clsx(
                            "text-[10px] font-medium uppercase tracking-wide transition-colors duration-200 mt-0.5",
                            (item.label === "CAST" || item.label === "ยกเลิก" || item.label === "กำลังเชื่อมต่อ...") 
                                ? (isAnyCastOn ? "text-primary" : "text-black/60 dark:text-zinc-400")
                                : (item.active ? "text-primary" : "text-black/60 dark:text-zinc-400")
                        )}>
                            {item.label === "ยกเลิก" || item.label === "กำลังเชื่อมต่อ..." ? "CAST" : item.label}
                        </span>
                    </button>
                ))}
            </div>
            
            {/* Optional Progress Bar (Thin line at bottom) */}
            <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-gray-200/30 dark:bg-zinc-800/30">
                <div
                    className="h-full bg-primary transition-all duration-1000 shadow-[0_0_6px_rgba(239,68,68,0.4)]"
                    style={{ width: `${progressPercent}%` }}
                />
            </div>
        </div>
    );
};

