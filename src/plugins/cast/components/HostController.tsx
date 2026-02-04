import React, { useState } from 'react';
import { useFirebaseCast } from '../../../../context/FirebaseCastContext';
import { DisconnectModal } from './DisconnectModal';
import {
    Squares2X2Icon,
    XMarkIcon,
    ComputerDesktopIcon
} from '@heroicons/react/24/outline'; // Use Outline for cleaner look
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
        <div className="relative w-full aspect-video bg-[#181921] flex flex-col items-center justify-center text-white overflow-hidden">

            {/* Background Red Glow (Top) - Matches screenshot */}
            <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Main Content Container */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-6 w-full max-w-lg px-8">

                {/* 1. Dual Screen Icon (Top Center) */}
                <div className="relative mb-2">
                    {/* Circle Background */}
                    <div className="w-20 h-20 rounded-full bg-[#23242f] border border-white/5 flex items-center justify-center shadow-lg relative z-10">
                        {/* Using Squares2X2 to represent multiple screens/control */}
                        <ComputerDesktopIcon className="w-9 h-9 text-red-500/80 stroke-1" />
                        {/* Second screen Badge */}
                        <div className="absolute -bottom-1 -right-1 bg-[#181921] rounded-full p-1">
                            <Squares2X2Icon className="w-4 h-4 text-white/40" />
                        </div>
                    </div>
                </div>

                {/* 2. Headline Text (Bold Thai) */}
                <div className="space-y-1">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white drop-shadow-md">
                        โหมด DJ 2 หน้าจอ ทำงานอยู่
                    </h1>
                    <p className="text-base text-white/40 font-light">
                        วิดีโอกำลังเล่นบนจอแยก (Clean Feed)
                    </p>
                </div>

                {/* 3. Now Playing Card (Bottom Gradient Style) */}
                <div className="w-full mt-4 relative group">
                    {/* Gradient Border/Glow */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-xl opacity-50"></div>

                    <div className="relative bg-[#23242f] border border-white/5 rounded-xl p-4 flex items-center gap-4 shadow-xl">
                        {/* Thumbnail */}
                        {thumbnailUrl ? (
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-black/50 shadow-inner">
                                <Image
                                    src={thumbnailUrl}
                                    alt="Thumbnail"
                                    fill
                                    className="object-cover opacity-80"
                                    unoptimized
                                />
                            </div>
                        ) : (
                            <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center animate-pulse">
                                <span className="text-xs grayscale">🎵</span>
                            </div>
                        )}

                        {/* Song Info */}
                        <div className="text-left flex-1 min-w-0">
                            {/* Running Text Effect if needed, simple clamp for now */}
                            <p className="text-base font-medium text-white/90 truncate mr-2">
                                {currentVideoTitle || currentVideo?.title || 'รอเพลงถัดไป...'}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                                <span className="text-xs text-white/40 uppercase tracking-wider">Now Playing</span>
                            </div>
                        </div>

                        {/* Disconnect Icon Button (Subtle) */}
                        <button
                            onClick={() => setIsDisconnectModalOpen(true)}
                            className="p-2 text-white/20 hover:text-red-400 hover:bg-white/5 rounded-full transition-all"
                            title="ตัดการเชื่อมต่อ"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

            </div>

            {/* Room Code Badge (Floating Bottom Right) - Optional nice touch */}
            <div className="absolute bottom-4 right-4 text-xs font-mono text-white/20">
                ROOM: <span className="text-white/40">{roomCode}</span>
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
