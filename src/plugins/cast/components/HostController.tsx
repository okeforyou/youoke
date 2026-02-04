import React, { useState } from 'react';
import { useFirebaseCast } from '../../../../context/FirebaseCastContext';
import { DisconnectModal } from './DisconnectModal';
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

            {/* 1. Background from THUMBNAIL - proper blur */}
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

                {/* TV Icon */}
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center ring-2 ring-primary/30 animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-primary">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
                    </svg>
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-white drop-shadow-lg">โหมด DJ 2 หน้าจอ ทำงานอยู่</h3>

                {/* 5. Subtitle - more visible */}
                <p className="text-white/80 text-xs drop-shadow-md">วิดีโอกำลังเล่นบนจอแยก (ห้อง {roomCode})</p>

                {/* Now Playing - 2. Small red box + 4. No blur card */}
                {currentVideo && (
                    <div className="w-full max-w-sm bg-black/60 rounded-lg p-3 border border-white/10">
                        {/* 2. NOW PLAYING - small red badge with blink */}
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-red-600 rounded text-[9px] font-bold text-white uppercase">
                                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                                Now Playing
                            </span>
                        </div>
                        <p className="text-sm font-medium text-white truncate">{currentVideoTitle || currentVideo.title}</p>
                    </div>
                )}

                {/* 3. Buttons INSIDE player */}
                <div className="flex items-center gap-2 mt-1">
                    <button
                        onClick={() => setIsDisconnectModalOpen(true)}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-full"
                    >
                        หยุด
                    </button>
                    <button
                        onClick={onDisconnect}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-full border border-white/20"
                    >
                        ยกเลิกการเชื่อมต่อ
                    </button>
                </div>

            </div>

            <DisconnectModal
                isOpen={isDisconnectModalOpen}
                onClose={() => setIsDisconnectModalOpen(false)}
                onConfirm={() => { setIsDisconnectModalOpen(false); onDisconnect(); }}
            />
        </div>
    );
};
