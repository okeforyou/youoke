import React, { useState } from 'react';
import { useFirebaseCast } from '../../../../context/FirebaseCastContext';
import { DisconnectModal } from './DisconnectModal';
import {
    XMarkIcon,
    ComputerDesktopIcon,
    SignalIcon
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

            {/* 1. Extreme Atmosphere Background (Abstract Color Only) */}
            {thumbnailUrl ? (
                <div className="absolute inset-0 z-0 overflow-hidden">
                    {/* Layer 1: The image, extreme blur & scale */}
                    <Image
                        src={thumbnailUrl}
                        alt="Atmosphere"
                        fill
                        className="object-cover blur-[150px] scale-[3.0] opacity-60"
                        unoptimized
                    />
                    {/* Layer 2: Dark Overlay for contrast */}
                    <div className="absolute inset-0 bg-black/50 z-10" />
                </div>
            ) : (
                <div className="absolute inset-0 z-0 bg-neutral-900" />
            )}

            {/* Content Container */}
            <div className="relative z-30 flex flex-col items-center justify-center text-center w-full max-w-md px-4 py-2">

                {/* 2. Custom Dual Screen Signal Animation */}
                <div className="relative mb-5 transform scale-90">
                    <div className="h-16 px-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center gap-4 relative overflow-hidden shadow-2xl">

                        {/* Computer 1 (Host) */}
                        <ComputerDesktopIcon className="w-8 h-8 text-white/50" />

                        {/* Signal Path */}
                        <div className="relative w-12 h-0.5 bg-white/10 overflow-hidden">
                            {/* Moving Signal Dot */}
                            <div className="absolute top-0 left-0 w-8 h-full bg-gradient-to-r from-transparent via-green-400 to-transparent animate-[shimmer_1.5s_infinite_linear] opacity-80"></div>
                        </div>

                        {/* Computer 2 (Receiver) */}
                        <div className="relative">
                            <ComputerDesktopIcon className="w-8 h-8 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                            {/* Active Dot */}
                            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)] animate-pulse"></div>
                        </div>

                    </div>
                    {/* Label below animation */}
                    <div className="absolute -bottom-5 w-full text-center">
                        <p className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-light">Connected</p>
                    </div>
                </div>

                {/* 3. Headline */}
                <div className="space-y-1 mb-6 mt-1">
                    <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-xl">
                        โหมด DJ 2 หน้าจอ
                    </h1>
                    <p className="text-xs text-white/60 font-light flex items-center justify-center gap-2">
                        <span>ห้อง {roomCode}</span>
                        <span className="w-1 h-1 bg-white/40 rounded-full"></span>
                        <span>Clean Feed</span>
                    </p>
                </div>

                {/* 4. Now Playing Card */}
                <div className="w-full max-w-sm relative mt-2 group/card">
                    <div className="relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-xl p-2.5 flex items-center gap-3 shadow-lg transition-all duration-300 hover:bg-white/10">
                        {/* Thumbnail */}
                        {thumbnailUrl ? (
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 shadow-md border border-white/10 grayscale-[30%] group-hover/card:grayscale-0 transition-all">
                                <Image
                                    src={thumbnailUrl}
                                    alt="Thumbnail"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            </div>
                        ) : (
                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                                <span className="text-lg opacity-30">🎵</span>
                            </div>
                        )}

                        {/* Info */}
                        <div className="text-left flex-1 min-w-0 mr-1">
                            <p className="text-sm font-medium text-white/90 truncate leading-tight">
                                {currentVideoTitle || currentVideo?.title || 'รอเพลงถัดไป...'}
                            </p>
                            <p className="text-[9px] text-white/40 uppercase tracking-wider mt-0.5">
                                Now Playing
                            </p>
                        </div>

                        {/* Disconnect */}
                        <button
                            onClick={() => setIsDisconnectModalOpen(true)}
                            className="p-1.5 rounded-full text-white/30 hover:text-red-400 hover:bg-white/5 transition-colors"
                            title="ตัดการเชื่อมต่อ"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

            </div>

            {/* Styles for Shimmer Animation */}
            <style jsx>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
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
