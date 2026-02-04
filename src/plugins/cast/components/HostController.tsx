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
    // Use 'mqdefault' (Medium Quality) because 'maxresdefault' often returns 404 for non-HD videos
    const thumbnailUrl = currentVideo?.videoId
        ? `https://i.ytimg.com/vi/${currentVideo.videoId}/mqdefault.jpg`
        : null;

    return (
        // ROOT CONTAINER: Removed 'isolate' to avoid stacking context issues
        <div className="relative w-full aspect-video bg-black overflow-hidden select-none flex flex-col items-center justify-center">

            {/* === LAYER 1: BACKGROUND IMAGE (z-0) === */}
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
            {/* Using standard Tailwind backdrop-blur if possible, or style fallback */}
            <div
                className="absolute inset-0 z-10 bg-black/70 backdrop-blur-3xl"
                // Fallback for browsers with issues
                style={{ backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)' }}
            />

            {/* === LAYER 3: CONTENT (z-20) === */}
            <div className="relative z-20 flex flex-col items-center justify-center w-full h-full max-w-md px-4">

                {/* A. ANIMATION CARD */}
                <div className="mb-4">
                    <div className="flex items-center gap-6 px-6 py-3 rounded-2xl bg-black/40 border border-white/20 shadow-2xl backdrop-blur-md">

                        {/* Host Icon */}
                        <div className="flex flex-col items-center gap-1">
                            <ComputerDesktopIcon className="w-6 h-6 text-white/90" />
                            <span className="text-[9px] font-medium text-white/60 tracking-widest leading-none">HOST</span>
                        </div>

                        {/* Signal Animation */}
                        <div className="relative w-16 h-[2px] bg-white/10 rounded-full overflow-hidden">
                            <div className="absolute top-0 left-0 w-8 h-full bg-gradient-to-r from-transparent via-green-400 to-transparent blur-[1px] animate-[signal-flow_1.5s_linear_infinite]"></div>
                        </div>

                        {/* TV Icon */}
                        <div className="flex flex-col items-center gap-1 relative">
                            <ComputerDesktopIcon className="w-6 h-6 text-white" />
                            {/* Status Dot */}
                            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-black animate-pulse"></div>
                            <span className="text-[9px] font-medium text-white/60 tracking-widest leading-none">TV</span>
                        </div>

                    </div>
                </div>

                {/* B. MAIN HEADLINE */}
                <div className="text-center mb-5 space-y-2">
                    <h1 className="text-xl font-bold text-white drop-shadow-lg tracking-tight">
                        โหมด DJ 2 หน้าจอ
                    </h1>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-[10px] text-white/80 font-medium">
                            ห้อง <span className="font-bold text-white">{roomCode || '...'}</span>
                        </span>
                    </div>
                </div>

                {/* C. NOW PLAYING CARD (Premium Outline Style) */}
                <div className="relative w-full max-w-[280px]">
                    <div className="flex items-center gap-3 p-2 rounded-xl bg-black/80 border border-white/20 shadow-xl backdrop-blur-sm transition-transform hover:scale-[1.02]">

                        {/* Thumbnail */}
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/10 flex-shrink-0 bg-black">
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
                                    <span className="text-xs text-white/30">🎵</span>
                                </div>
                            )}
                        </div>

                        {/* Text Info */}
                        <div className="flex-1 min-w-0 pr-2 text-left">
                            <p className="text-xs font-bold text-white truncate mb-1">
                                {currentVideoTitle || currentVideo?.title || 'รอเพลงถัดไป...'}
                            </p>

                            {/* Badge */}
                            <div className="inline-flex items-center px-1.5 py-[2px] rounded border border-red-500/30 bg-red-500/10">
                                <div className="w-1 h-1 mr-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_4px_rgba(239,68,68,0.8)]"></div>
                                <span className="text-[8px] font-bold text-red-100 tracking-wider leading-none">NOW PLAYING</span>
                            </div>
                        </div>

                        {/* Disconnect Button */}
                        <button
                            onClick={() => setIsDisconnectModalOpen(true)}
                            className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                        >
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>

            </div>

            {/* === GLOBAL STYLES FOR ANIMATION === */}
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
