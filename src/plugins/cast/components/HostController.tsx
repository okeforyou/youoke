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
        ? `https://i.ytimg.com/vi/${currentVideo.videoId}/mqdefault.jpg`
        : null;

    return (
        <div className="w-full h-full relative group bg-neutral-900 flex flex-col items-center justify-center text-center p-6 space-y-4 overflow-hidden">

            {/* Background - More Visible Blur */}
            {thumbnailUrl && (
                <div className="absolute inset-0 pointer-events-none">
                    <Image
                        src={thumbnailUrl}
                        alt=""
                        fill
                        className="object-cover blur-2xl scale-125 opacity-70"
                        unoptimized
                    />
                    <div className="absolute inset-0 bg-black/40" />
                </div>
            )}

            {/* TV Icon */}
            <div className="relative z-10 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-primary/20 animate-pulse shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-primary">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
                </svg>
            </div>

            {/* Title */}
            <div className="relative z-10 w-full px-4">
                <h3 className="text-lg font-bold text-white tracking-tight">โหมด DJ 2 หน้าจอ ทำงานอยู่</h3>
                <p className="text-white/60 text-xs mt-1">วิดีโอกำลังเล่นบนจอแยก (ห้อง {roomCode})</p>
            </div>

            {/* Now Playing Card */}
            {currentVideo && (
                <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-xl p-3 w-full border border-white/20 shrink-0">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                            <span className="text-[10px] font-bold text-red-300 uppercase tracking-wider">Now Playing</span>
                        </span>
                    </div>
                    <p className="text-sm font-semibold truncate text-white">{currentVideoTitle || currentVideo.title}</p>
                </div>
            )}

            {/* Buttons - Fixed Styling */}
            <div className="relative z-10 flex items-center gap-3 mt-2">
                <button
                    onClick={() => setIsDisconnectModalOpen(true)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-full transition-colors"
                >
                    หยุด
                </button>
                <button
                    onClick={onDisconnect}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-full border border-white/30 transition-colors"
                >
                    ยกเลิกการเชื่อมต่อ
                </button>
            </div>

            <DisconnectModal
                isOpen={isDisconnectModalOpen}
                onClose={() => setIsDisconnectModalOpen(false)}
                onConfirm={() => { setIsDisconnectModalOpen(false); onDisconnect(); }}
            />
        </div>
    );
};
