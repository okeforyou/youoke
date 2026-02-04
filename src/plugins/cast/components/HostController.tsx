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
        <div className="relative w-full aspect-video bg-black overflow-hidden select-none flex flex-col items-center justify-center">

            {/* === LAYER 1: BACKGROUND (z-0) === */}
            {thumbnailUrl ? (
                <div className="absolute inset-0 z-0">
                    <Image
                        src={thumbnailUrl}
                        alt="Background"
                        fill
                        className="object-cover opacity-60"
                        unoptimized
                        priority
                    />
                </div>
            ) : (
                <div className="absolute inset-0 z-0 bg-neutral-900" />
            )}

            {/* === LAYER 2: BLUR OVERLAY (z-10) === */}
            <div
                className="absolute inset-0 z-10 bg-black/70 backdrop-blur-3xl"
                style={{ backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)' }}
            />

            {/* === LAYER 3: CONTENT (z-20) === */}
            <div className="relative z-20 flex flex-col items-center justify-center w-full h-full max-w-sm px-4">

                {/* A. ANIMATION CARD - COMPACTED */}
                {/* Visual Fix: Reduced padding and height to make it less bulky */}
                <div className="mb-3">
                    <div className="flex items-center gap-5 px-5 py-2.5 rounded-xl bg-black/40 border border-white/10 shadow-xl backdrop-blur-md">

                        {/* Host Icon */}
                        <div className="flex flex-col items-center gap-0.5">
                            <ComputerDesktopIcon className="w-5 h-5 text-white/90" />
                            {/* Visual Fix: Lighter, thinner text to de-emphasize */}
                            <span className="text-[7px] font-medium text-white/40 tracking-widest leading-none">HOST</span>
                        </div>

                        {/* Signal Animation */}
                        <div className="relative w-14 h-[1.5px] bg-white/10 rounded-full overflow-hidden">
                            <div className="absolute top-0 left-0 w-8 h-full bg-gradient-to-r from-transparent via-green-400 to-transparent blur-[1px] animate-[signal-flow_1.5s_linear_infinite]"></div>
                        </div>

                        {/* TV Icon */}
                        <div className="flex flex-col items-center gap-0.5 relative">
                            <ComputerDesktopIcon className="w-5 h-5 text-white" />
                            {/* Visual Fix: Smaller dot */}
                            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-black animate-pulse"></div>
                            <span className="text-[7px] font-medium text-white/40 tracking-widest leading-none">TV</span>
                        </div>

                    </div>
                </div>

                {/* B. MAIN HEADLINE */}
                <div className="text-center mb-4 space-y-1.5">
                    {/* Visual Fix: Reduced font size slightly for elegance */}
                    <h1 className="text-lg font-bold text-white drop-shadow-md tracking-tight">
                        โหมด DJ 2 หน้าจอ
                    </h1>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                        <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-[9px] text-white/60 font-medium tracking-wide">
                            ห้อง <span className="font-bold text-white">{roomCode || '...'}</span>
                        </span>
                    </div>
                </div>

                {/* C. NOW PLAYING CARD - REFINED BADGE & LAYOUT */}
                <div className="relative w-full max-w-[260px]">
                    {/* Visual Fix: Slightly darker background for contrast against blur */}
                    <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#111]/80 border border-white/10 shadow-lg backdrop-blur-sm transition-transform hover:scale-[1.01]">

                        {/* Thumbnail */}
                        <div className="relative w-9 h-9 rounded bg-black flex-shrink-0 border border-white/10 overflow-hidden">
                            {thumbnailUrl ? (
                                <Image
                                    src={thumbnailUrl}
                                    alt="Thumb"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-[10px] text-white/20">🎵</span>
                                </div>
                            )}
                        </div>

                        {/* Text Info */}
                        <div className="flex-1 min-w-0 pr-1 text-left">
                            <p className="text-[11px] font-bold text-white truncate mb-0.5 leading-tight">
                                {currentVideoTitle || currentVideo?.title || 'รอเพลงถัดไป...'}
                            </p>

                            {/* BADGE FIX: Brighter border and text for readability */}
                            <div className="inline-flex items-center px-1.5 py-[1px] rounded-[3px] border border-red-500/40 bg-red-500/5">
                                <div className="w-1 h-1 mr-1 bg-red-500 rounded-full animate-pulse shadow-[0_0_4px_#ef4444]"></div>
                                {/* Visual Fix: Brighter red text (red-100) */}
                                <span className="text-[7px] font-bold text-red-200 tracking-widest leading-none opacity-90">NOW PLAYING</span>
                            </div>
                        </div>

                        {/* Disconnect Button */}
                        <button
                            onClick={() => setIsDisconnectModalOpen(true)}
                            className="p-1.5 text-white/30 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                        >
                            <XMarkIcon className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

            </div>

            {/* === GLOBAL STYLES === */}
            <style jsx global>{`
                @keyframes signal-flow {
                    0% { transform: translateX(-100%); opacity: 0; }
                    20% { opacity: 1; }
                    80% { opacity: 1; }
                    100% { transform: translateX(200%); opacity: 0; }
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
