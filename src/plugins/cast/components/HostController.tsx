import React, { useState } from 'react';
import { useFirebaseCast } from '../../../../context/FirebaseCastContext';
import { DisconnectModal } from './DisconnectModal';
import {
    Squares2X2Icon,
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
        <div className="relative w-full aspect-video bg-[#0a0a0a] overflow-hidden select-none flex flex-col items-center justify-center group">

            {/* Dynamic Saturated Atmosphere Background (Extreme Blur) */}
            {thumbnailUrl ? (
                <div className="absolute inset-0 z-0 overflow-hidden">
                    {/* Scale up immensely and blur to create abstract color washes */}
                    <div className="absolute inset-0 bg-black/30 z-10" /> {/* Dimming for contrast */}
                    <Image
                        src={thumbnailUrl}
                        alt="Ambient Atmosphere"
                        fill
                        className="object-cover blur-[80px] scale-[2.0] opacity-80"
                        unoptimized
                    />
                    {/* Add a subtle gradient overlay to ensure text readability at bottom/top */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 z-20 pointer-events-none" />
                </div>
            ) : (
                /* Fallback Dark Mesh Gradient */
                <div className="absolute inset-0 z-0 bg-gradient-to-br from-gray-900 to-black">
                    <div className="absolute top-[-50%] left-[-20%] w-[80%] h-[80%] bg-blue-900/20 rounded-full blur-[100px] opacity-40"></div>
                </div>
            )}

            {/* Content Container (z-30 to sit above atmosphere) */}
            <div className="relative z-30 flex flex-col items-center justify-center text-center w-full max-w-md px-4 py-2">

                {/* 1. Computer Icon (Glassy) */}
                <div className="relative mb-4 transform scale-100">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex items-center justify-center border border-white/20 relative">
                        <ComputerDesktopIcon className="w-8 h-8 text-white drop-shadow-md" />

                        {/* Status Dot */}
                        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-green-500 border-2 border-white/10 shadow-[0_0_10px_rgba(34,197,94,0.6)] animate-pulse"></div>
                    </div>
                </div>

                {/* 2. Headline */}
                <div className="space-y-1 mb-6">
                    <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-lg" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                        โหมด DJ 2 หน้าจอ
                    </h1>
                    <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-black/20 backdrop-blur-md rounded-full border border-white/10 shadow-lg mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse"></span>
                        <span className="text-xs text-white/90 font-medium tracking-wide">
                            ควบคุมห้อง {roomCode}
                        </span>
                    </div>
                </div>

                {/* 3. Now Playing Card (Glassmorphism + Thumbnail Restored) */}
                <div className="w-full max-w-sm relative mt-2 group/card">
                    {/* Glass Container */}
                    <div className="relative bg-white/10 backdrop-blur-2xl border border-white/20 rounded-xl p-2.5 flex items-center gap-3 shadow-[0_8px_32px_rgba(0,0,0,0.2)] transition-all duration-300 hover:bg-white/15">

                        {/* Thumbnail (Restored & Sharp) */}
                        {thumbnailUrl ? (
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 shadow-lg border border-white/10 group-hover/card:scale-105 transition-transform duration-300">
                                <Image
                                    src={thumbnailUrl}
                                    alt="Thumbnail"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            </div>
                        ) : (
                            <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center border border-white/5">
                                <span className="text-xl opacity-50">🎵</span>
                            </div>
                        )}

                        {/* Text Info */}
                        <div className="text-left flex-1 min-w-0 mr-1">
                            <p className="text-sm font-bold text-white shadow-black drop-shadow-md truncate leading-tight">
                                {currentVideoTitle || currentVideo?.title || 'รอเพลงถัดไป...'}
                            </p>
                            <p className="text-[10px] text-white/70 uppercase tracking-wider font-semibold mt-0.5 flex items-center gap-1">
                                <span className="w-1 h-1 bg-green-400 rounded-full"></span>
                                Now Playing
                            </p>
                        </div>

                        {/* Disconnect Button (Subtle Glass) */}
                        <button
                            onClick={() => setIsDisconnectModalOpen(true)}
                            className="p-2 rounded-full bg-white/5 hover:bg-red-500/80 text-white/70 hover:text-white transition-all backdrop-blur-sm border border-white/5 hover:border-red-500/50 hover:shadow-[0_0_15px_rgba(239,68,68,0.6)]"
                            title="ตัดการเชื่อมต่อ"
                        >
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>

            </div>

            {/* Footer Branding (Optional watermarks) */}
            <div className="absolute bottom-3 text-[9px] text-white/20 font-light tracking-widest uppercase pointer-events-none z-20">
                Play.Okeforyou • Clean Feed
            </div>

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
