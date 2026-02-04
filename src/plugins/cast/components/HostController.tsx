import React, { useState } from 'react';
import { useFirebaseCast } from '../../../../context/FirebaseCastContext';
import { DisconnectModal } from './DisconnectModal';
import { XMarkIcon, ComputerDesktopIcon } from '@heroicons/react/24/solid';
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
            {/* BG */}
            {thumbnailUrl && (
                <div className="absolute inset-0 z-0">
                    <Image src={thumbnailUrl} alt="" fill className="object-cover opacity-50" unoptimized priority />
                </div>
            )}
            <div className="absolute inset-0 z-10 bg-black/70 backdrop-blur-3xl" style={{ backdropFilter: 'blur(30px)' }} />

            {/* Content */}
            <div className="relative z-20 flex flex-col items-center w-full max-w-xs px-4">

                {/* Animation Card - COMPACT */}
                <div className="flex items-center gap-4 px-4 py-2 rounded-lg bg-black/30 border border-white/10 mb-3">
                    <div className="flex flex-col items-center">
                        <ComputerDesktopIcon className="w-4 h-4 text-white/80" />
                        <span className="text-[6px] text-white/30 tracking-widest mt-0.5">HOST</span>
                    </div>
                    <div className="relative w-10 h-px bg-white/20 overflow-hidden">
                        <div className="absolute w-6 h-full bg-gradient-to-r from-transparent via-green-400 to-transparent animate-[slide_1.5s_linear_infinite]" />
                    </div>
                    <div className="flex flex-col items-center relative">
                        <ComputerDesktopIcon className="w-4 h-4 text-white" />
                        <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-[6px] text-white/30 tracking-widest mt-0.5">TV</span>
                    </div>
                </div>

                {/* Headline */}
                <h1 className="text-base font-bold text-white mb-1">โหมด DJ 2 หน้าจอ</h1>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 mb-3">
                    <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[8px] text-white/60">ห้อง <b className="text-white">{roomCode}</b></span>
                </div>

                {/* Now Playing */}
                <div className="w-full flex items-center gap-2 p-1.5 rounded-lg bg-black/60 border border-white/10">
                    <div className="relative w-8 h-8 rounded bg-black flex-shrink-0 overflow-hidden border border-white/10">
                        {thumbnailUrl && <Image src={thumbnailUrl} alt="" fill className="object-cover" unoptimized />}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                        <p className="text-[10px] font-bold text-white truncate">{currentVideoTitle || currentVideo?.title || 'รอเพลง...'}</p>
                        <div className="inline-flex items-center gap-1 px-1 py-px rounded border border-red-500/30 bg-red-500/10 mt-0.5">
                            <span className="w-0.5 h-0.5 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-[5px] font-bold text-red-300 tracking-wider">NOW PLAYING</span>
                        </div>
                    </div>
                    <button onClick={() => setIsDisconnectModalOpen(true)} className="p-1 text-white/30 hover:text-white rounded transition-colors">
                        <XMarkIcon className="w-3 h-3" />
                    </button>
                </div>
            </div>

            <style jsx global>{`
                @keyframes slide { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
            `}</style>

            <DisconnectModal isOpen={isDisconnectModalOpen} onClose={() => setIsDisconnectModalOpen(false)} onConfirm={() => { setIsDisconnectModalOpen(false); onDisconnect(); }} />
        </div>
    );
};
