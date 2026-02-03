import React, { useState } from 'react';
import { useFirebaseCast } from '../../../../context/FirebaseCastContext';
import { DisconnectModal } from './DisconnectModal';
import {
    TvIcon,
    ComputerDesktopIcon,
    XMarkIcon
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

    // Get thumbnail URL from videoId
    const currentVideo = state.currentVideo;
    const thumbnailUrl = currentVideo?.videoId
        ? `https://i.ytimg.com/vi/${currentVideo.videoId}/mqdefault.jpg`
        : null;

    return (
        <div className="relative w-full aspect-video bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center overflow-hidden">

            {/* Background Pattern (subtle) */}
            <div className="absolute inset-0 opacity-5">
                <div className="w-full h-full" style={{
                    backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px)',
                    backgroundSize: '30px 30px'
                }} />
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 space-y-4">

                {/* Connection Status Icon */}
                <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-xl">
                        {isCasting ? (
                            <TvIcon className="w-8 h-8 text-primary" />
                        ) : (
                            <ComputerDesktopIcon className="w-8 h-8 text-primary" />
                        )}
                    </div>
                    {/* Live indicator */}
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900 animate-pulse" />
                </div>

                {/* Status Text */}
                <div className="space-y-1">
                    <p className="text-white/50 text-xs uppercase tracking-widest">
                        {isCasting ? 'เชื่อมต่อจอทีวี' : 'เชื่อมต่อหน้าจอที่ 2'}
                    </p>
                    <p className="text-white text-lg font-bold">
                        ห้อง {roomCode}
                    </p>
                </div>

                {/* Current Song (small) */}
                {currentVideo && (
                    <div className="flex items-center gap-3 bg-black/30 backdrop-blur-sm rounded-lg px-3 py-2 max-w-xs">
                        {thumbnailUrl && (
                            <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">
                                <Image
                                    src={thumbnailUrl}
                                    alt="Thumbnail"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            </div>
                        )}
                        <div className="text-left min-w-0">
                            <p className="text-[10px] text-white/40 uppercase">กำลังเล่น</p>
                            <p className="text-xs text-white/80 truncate">
                                {currentVideoTitle || currentVideo.title}
                            </p>
                        </div>
                    </div>
                )}

                {/* Disconnect Button */}
                <button
                    onClick={() => setIsDisconnectModalOpen(true)}
                    className="mt-2 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-error/80 text-white/70 hover:text-white rounded-full text-xs font-medium transition-all border border-white/10 hover:border-error"
                >
                    <XMarkIcon className="w-3.5 h-3.5" />
                    <span>ตัดการเชื่อมต่อ</span>
                </button>
            </div>

            {/* Disconnect Modal */}
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
