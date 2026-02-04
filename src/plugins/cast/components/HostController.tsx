import React, { useState } from 'react';
import { useFirebaseCast } from '../../../../context/FirebaseCastContext';
import { DisconnectModal } from './DisconnectModal';
import { ComputerDesktopIcon } from '@heroicons/react/24/solid';
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
        ? `https://i.ytimg.com/vi/${currentVideo.videoId}/maxresdefault.jpg`
        : null;

    return (
        <div className="w-full aspect-video relative bg-black flex flex-col items-center justify-center text-center overflow-hidden">

            {/* Background blur from thumbnail */}
            {thumbnailUrl && (
                <div className="absolute inset-0">
                    <Image
                        src={thumbnailUrl}
                        alt=""
                        fill
                        className="object-cover"
                        style={{ filter: 'blur(20px)', transform: 'scale(1.1)' }}
                        unoptimized
                    />
                    <div className="absolute inset-0 bg-black/30" />
                </div>
            )}

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-4 space-y-3">

                {/* 2. Two Computers Animation */}
                <div className="flex items-center gap-3">
                    <ComputerDesktopIcon className="w-6 h-6 text-white/60" />
                    <div className="relative w-10 h-[2px] bg-white/20 rounded overflow-hidden">
                        <div
                            className="absolute w-4 h-full bg-green-400 rounded animate-[slide_1s_linear_infinite]"
                            style={{ boxShadow: '0 0 8px #4ade80' }}
                        />
                    </div>
                    <div className="relative">
                        <ComputerDesktopIcon className="w-6 h-6 text-white" />
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    </div>
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-white drop-shadow-lg">โหมด DJ 2 หน้าจอ ทำงานอยู่</h3>
                <p className="text-white/80 text-xs drop-shadow-md">วิดีโอกำลังเล่นบนจอแยก (ห้อง {roomCode})</p>

                {/* Now Playing - 1. Smallest badge */}
                {currentVideo && (
                    <div className="w-full max-w-sm bg-black/60 rounded-lg p-3 border border-white/10">
                        <div className="flex items-center gap-1 mb-1">
                            <span className="w-1 h-1 bg-red-500 rounded-full animate-pulse"></span>
                            <span className="text-[8px] font-bold text-red-400 uppercase">Playing</span>
                        </div>
                        <p className="text-sm font-medium text-white truncate">{currentVideoTitle || currentVideo.title}</p>
                    </div>
                )}

                {/* 3. Single button only (both did same thing) */}
                <button
                    onClick={() => setIsDisconnectModalOpen(true)}
                    className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-full border border-white/20"
                >
                    ยกเลิกการเชื่อมต่อ
                </button>

            </div>

            {/* Animation keyframe */}
            <style jsx global>{`
                @keyframes slide {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(300%); }
                }
            `}</style>

            <DisconnectModal
                isOpen={isDisconnectModalOpen}
                onClose={() => setIsDisconnectModalOpen(false)}
                onConfirm={() => { setIsDisconnectModalOpen(false); onDisconnect(); }}
            />
        </div>
    );
};
