import React, { useState } from 'react';
import { useFirebaseCast } from '../../../../context/FirebaseCastContext';
import { DisconnectModal } from './DisconnectModal';
import { TvIcon, ComputerDesktopIcon, XMarkIcon } from '@heroicons/react/24/solid';
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
        <div className="relative w-full aspect-video bg-[#111111] flex items-center justify-center text-white">

            {/* Minimal Dark Layout (Reference 2 Style) */}
            <div className="flex flex-col items-center justify-center text-center space-y-6 w-full max-w-sm px-6">

                {/* 1. Device Icon & Status */}
                <div className="relative group cursor-default">
                    {/* Outer Glow */}
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-50 group-hover:opacity-80 transition-opacity duration-700"></div>

                    <div className="relative w-24 h-24 bg-[#1a1a1a] rounded-full border border-white/10 flex items-center justify-center shadow-2xl">
                        {isCasting ? (
                            <TvIcon className="w-10 h-10 text-primary mb-1" />
                        ) : (
                            <ComputerDesktopIcon className="w-10 h-10 text-primary mb-1" />
                        )}
                        {/* Live Dot */}
                        <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#1a1a1a] rounded-full animate-pulse"></span>
                    </div>

                    <div className="mt-4 space-y-1">
                        <p className="text-white/40 text-xs uppercase tracking-widest font-medium">
                            {isCasting ? 'Connected to TV' : 'Dual Screen Active'}
                        </p>
                        <h2 className="text-3xl font-bold tracking-tight text-white">
                            {roomCode}
                        </h2>
                    </div>
                </div>

                {/* 2. Now Playing (Clean & Minimal) */}
                {currentVideo && (
                    <div className="w-full bg-white/5 border border-white/5 rounded-xl p-3 flex items-center gap-3 hover:bg-white/10 transition-colors">
                        {thumbnailUrl ? (
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-black/50">
                                <Image
                                    src={thumbnailUrl}
                                    alt="Thumbnail"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            </div>
                        ) : (
                            <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                                <span className="text-xs">🎵</span>
                            </div>
                        )}
                        <div className="text-left flex-1 min-w-0">
                            <p className="text-[10px] text-primary mb-0.5 uppercase tracking-wide font-bold">Now Playing</p>
                            <p className="text-sm text-white/90 font-light truncate leading-tight">
                                {currentVideoTitle || currentVideo.title}
                            </p>
                        </div>
                    </div>
                )}

                {/* 3. Disconnect Text Link (Less intrusive than a button) */}
                <button
                    onClick={() => setIsDisconnectModalOpen(true)}
                    className="text-xs text-white/30 hover:text-error transition-colors flex items-center gap-2 py-2"
                >
                    <XMarkIcon className="w-4 h-4" />
                    <span>Disconnect</span>
                </button>
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
