import React, { useState } from 'react';
import { useFirebaseCast } from '../../../../context/FirebaseCastContext';
import { DisconnectModal } from './DisconnectModal';
import {
    XMarkIcon,
    ComputerDesktopIcon
} from '@heroicons/react/24/solid';
import Image from 'next/image';

interface HostControllerProps {
    isCasting: boolean;
    isDualMode: boolean;
    roomCode: string;
    onDisconnect: () => void;
    currentVideoTitle?: string;
}

export const HostController: React.FC<HostControllerProps> = ({
    isCasting,
    isDualMode,
    roomCode,
    onDisconnect,
    currentVideoTitle
}) => {
    const { state } = useFirebaseCast();
    const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);

    const currentVideo = state.currentVideo;
    const thumbnailUrl = currentVideo?.videoId
        ? `https://i.ytimg.com/vi/${currentVideo.videoId}/mqdefault.jpg`
        : null;

    return (
        <div className="relative w-full aspect-video bg-black overflow-hidden select-none flex flex-col items-center justify-center group">

            {/* 1. ATMOSPHERE BACKGROUND (EXTREME BLUR - REVERTED TO WORKING METHOD) */}
            {thumbnailUrl ? (
                <div className="absolute inset-0 z-0 overflow-hidden">
                    {/* Scale up and blur heavily to create abstract color wash */}
                    <Image
                        src={thumbnailUrl}
                        alt="Atmosphere"
                        fill
                        className="object-cover blur-[100px] scale-[2.5] opacity-70"
                        unoptimized
                    />
                    {/* Dark overlay for contrast */}
                    <div className="absolute inset-0 bg-black/40 z-10" />
                </div>
            ) : (
                <div className="absolute inset-0 z-0 bg-[#050505]" />
            )}

            {/* Content Container */}
            <div className="relative z-30 flex flex-col items-center justify-center text-center w-full max-w-sm px-4 py-2">

                {/* 2. REFINED ANIMATION CARD - DARKER & SMALLER TEXT */}
                <div className="relative mb-5">
                    {/* Dark background (bg-[#111]/90) for high contrast */}
                    <div className="h-16 px-6 rounded-xl bg-[#111]/90 border border-white/10 flex items-center gap-5 shadow-2xl relative overflow-hidden backdrop-blur-md">

                        {/* HOST */}
                        <div className="flex flex-col items-center gap-1 z-10">
                            <ComputerDesktopIcon className="w-5 h-5 text-white/90" />
                            <span className="text-[9px] text-white/60 font-bold tracking-wider">HOST</span>
                        </div>

                        {/* VISIBLE SIGNAL WIRE */}
                        <div className="relative w-16 h-0.5 bg-white/20 rounded-full flex items-center overflow-visible">
                            {/* Moving Light Dot - Bright Green */}
                            <div className="absolute w-8 h-1 bg-green-500 blur-[2px] rounded-full animate-[signal_1.5s_linear_infinite] shadow-[0_0_10px_#22c55e]"></div>
                        </div>

                        {/* TV */}
                        <div className="flex flex-col items-center gap-1 z-10 relative">
                            <ComputerDesktopIcon className="w-5 h-5 text-white drop-shadow-md" />
                            {/* Status Dot */}
                            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse"></div>
                            <span className="text-[9px] text-green-400 font-bold tracking-wider">TV</span>
                        </div>

                    </div>
                    {/* Label */}
                    <div className="absolute -bottom-4 w-full text-center">
                        <span className="text-[9px] text-white/30 uppercase tracking-[0.2em]">Connected</span>
                    </div>
                </div>

                {/* 3. HEADLINE */}
                <div className="space-y-1 mb-5 mt-1">
                    <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-lg">
                        โหมด DJ 2 หน้าจอ
                    </h1>
                    <div className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-black/50 rounded-full border border-white/10 backdrop-blur-sm">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                        <p className="text-[10px] text-white/80 font-medium tracking-wide">
                            ห้อง <span className="font-bold text-white">{roomCode}</span>
                        </p>
                    </div>
                </div>

                {/* 4. NOW PLAYING - DARKER CARD */}
                <div className="w-full max-w-[280px] relative mt-1">
                    {/* Dark background (bg-[#111]/90) */}
                    <div className="relative bg-[#111]/90 border border-white/10 rounded-xl p-2.5 flex items-center gap-3 shadow-xl transition-colors hover:bg-black">
                        {thumbnailUrl ? (
                            <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0 shadow-inner border border-white/10">
                                <Image
                                    src={thumbnailUrl}
                                    alt="Thumbnail"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            </div>
                        ) : (
                            <div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center">
                                <span className="text-xs opacity-30">🎵</span>
                            </div>
                        )}

                        <div className="text-left flex-1 min-w-0 mr-1">
                            <p className="text-xs font-bold text-white/90 truncate">
                                {currentVideoTitle || currentVideo?.title || 'รอเพลงถัดไป...'}
                            </p>
                            <p className="text-[9px] text-white/40 uppercase tracking-wider mt-0.5 font-medium">
                                Now Playing
                            </p>
                        </div>

                        <button
                            onClick={() => setIsDisconnectModalOpen(true)}
                            className="p-1.5 rounded-full text-white/30 hover:text-red-400 hover:bg-white/10 transition-colors"
                        >
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>

            </div>

            {/* FORCE KEYFRAMES */}
            <style jsx global>{`
                @keyframes signal {
                    0% { left: -20px; opacity: 0; }
                    20% { opacity: 1; }
                    80% { opacity: 1; }
                    100% { left: 100%; opacity: 0; }
                }
            `}</style>

            <DisconnectModal
                isOpen={isDisconnectModalOpen}
                onClose={() => setIsDisconnectModalOpen(false)}
                onConfirm={() => {
                    setIsDisconnectModalOpen(false);
                    onDisconnect();
                }}
            />
        </div>
    );
};
