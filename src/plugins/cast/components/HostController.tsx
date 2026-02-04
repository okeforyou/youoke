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
        <div className="w-full h-full relative group bg-black flex flex-col items-center justify-center text-center p-6 space-y-6 overflow-hidden">
            {/* Background Art (Blurred) */}
            {thumbnailUrl && (
                <div className="absolute inset-0 opacity-20 blur-xl pointer-events-none">
                    <Image src={thumbnailUrl} alt="" fill className="object-cover" unoptimized />
                </div>
            )}

            {/* TV Icon */}
            <div className="relative z-10 w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-primary/20 animate-pulse shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-primary">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
                </svg>
            </div>

            {/* Title */}
            <div className="relative z-10 w-full px-4">
                <h3 className="text-xl font-bold text-white tracking-tight">โหมด DJ 2 หน้าจอ ทำงานอยู่</h3>
                <p className="text-white/50 text-xs mt-2">วิดีโอกำลังเล่นบนจอแยก (Clean Feed)</p>
            </div>

            {/* Now Playing Card */}
            {currentVideo && (
                <div className="relative z-10 bg-white/5 backdrop-blur-md rounded-xl p-4 w-full border border-white/10 shrink-0">
                    <p className="text-sm font-bold truncate text-white mb-1">{currentVideoTitle || currentVideo.title}</p>
                    <p className="text-xs text-white/40 truncate">ห้อง {roomCode}</p>
                </div>
            )}

            {/* Stop Button */}
            <button
                onClick={() => setIsDisconnectModalOpen(true)}
                className="relative z-10 btn btn-error btn-sm rounded-full"
            >
                หยุด
            </button>

            <DisconnectModal
                isOpen={isDisconnectModalOpen}
                onClose={() => setIsDisconnectModalOpen(false)}
                onConfirm={() => { setIsDisconnectModalOpen(false); onDisconnect(); }}
            />
        </div>
    );
};
