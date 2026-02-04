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

            {/* 1. LAYERED BACKGROUND BLUR (ROBUST METHOD) */}
            {thumbnailUrl ? (
                <>
                    {/* Layer 1: Base Image (Scaled) */}
                    <div className="absolute inset-0 z-0">
                        <Image
                            src={thumbnailUrl}
                            alt="Background"
                            fill
                            className="object-cover scale-150 opacity-80"
                            unoptimized
                        />
                    </div>
                    {/* Layer 2: Heavy Backdrop Blur Overlay (This effectively blurs the image behind it) */}
                    <div className="absolute inset-0 z-10 backdrop-blur-[50px] bg-black/40" />

                    {/* Layer 3: Gradient Vignetts */}
                    <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/80 via-transparent to-black/60 pointer-events-none" />
                </>
            ) : (
                <div className="absolute inset-0 z-0 bg-[#0a0a0a]" />
            )}

            {/* Content Container */}
            <div className="relative z-30 flex flex-col items-center justify-center text-center w-full max-w-md px-4 py-2">

                {/* 2. CUSTOM SIGNAL ANIMATION (Inline Styles for guarantee) */}
                <div className="relative mb-6 transform scale-100">
                    <div className="h-20 px-8 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center gap-6 shadow-2xl">

                        {/* Host PC */}
                        <div className="flex flex-col items-center gap-1">
                            <ComputerDesktopIcon className="w-8 h-8 text-white/70" />
                            <span className="text-[9px] text-white/40 font-mono">HOST</span>
                        </div>

                        {/* SIGNAL WIRE */}
                        <div className="relative w-24 h-0.5 bg-white/10 overflow-visible flex items-center">
                            {/* The Moving Packet (Bright Dot) */}
                            <div className="signal-dot absolute w-12 h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent blur-[1px]"></div>
                            {/* Connection Line */}
                            <div className="w-full h-full bg-white/5 rounded-full"></div>
                        </div>

                        {/* Receiver PC */}
                        <div className="flex flex-col items-center gap-1 relative">
                            <ComputerDesktopIcon className="w-8 h-8 text-white drop-shadow-md" />
                            {/* Active Indicator */}
                            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e] animate-pulse"></div>
                            <span className="text-[9px] text-green-400/80 font-mono">TV</span>
                        </div>

                    </div>
                </div>

                {/* 3. Headline */}
                <div className="space-y-1 mb-6">
                    <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-2xl">
                        โหมด DJ 2 หน้าจอ
                    </h1>
                    <p className="text-xs text-white/60 font-medium tracking-wide">
                        กำลังส่งสัญญาณไปยังห้อง <span className="text-green-400 font-bold tracking-widest">{roomCode}</span>
                    </p>
                </div>

                {/* 4. Now Playing Card */}
                <div className="w-full max-w-sm relative mt-2 group/card">
                    <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-2.5 flex items-center gap-3 shadow-lg hover:bg-black/50 transition-colors">
                        {thumbnailUrl ? (
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 shadow-inner border border-white/10">
                                <Image
                                    src={thumbnailUrl}
                                    alt="Thumbnail"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            </div>
                        ) : (
                            <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center">
                                <span className="text-lg opacity-30">🎵</span>
                            </div>
                        )}

                        <div className="text-left flex-1 min-w-0 mr-1">
                            <p className="text-sm font-bold text-white truncate shadow-black drop-shadow-md">
                                {currentVideoTitle || currentVideo?.title || 'รอเพลงถัดไป...'}
                            </p>
                            <p className="text-[10px] text-white/50 uppercase tracking-wider mt-0.5">
                                Now Playing
                            </p>
                        </div>

                        <button
                            onClick={() => setIsDisconnectModalOpen(true)}
                            className="p-1.5 rounded-full text-white/30 hover:text-red-400 hover:bg-white/5 transition-colors"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

            </div>

            {/* INLINE STYLES FOR ANIMATION */}
            <style jsx>{`
                .signal-dot {
                    animation: signal-move 1.5s infinite linear;
                }
                @keyframes signal-move {
                    0% { left: -20%; opacity: 0; }
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
