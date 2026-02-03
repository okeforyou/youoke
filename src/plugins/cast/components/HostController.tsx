import React, { useState, useEffect } from 'react';
import { useFirebaseCast } from '../../../../context/FirebaseCastContext';
import { DisconnectModal } from './DisconnectModal';
import {
    PlayIcon,
    PauseIcon,
    ForwardIcon,
    BackwardIcon,
    SpeakerWaveIcon,
    SpeakerXMarkIcon,
    XMarkIcon,
    TvIcon
} from '@heroicons/react/24/solid';

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
    const {
        play, pause, next, previous,
        toggleMute, setVolume,
        state
    } = useFirebaseCast();

    const [localVolume, setLocalVolume] = useState(state.controls.volume ?? 100);
    const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);

    const videoId = state.currentVideo?.videoId || '';
    const thumbnailUrl = videoId
        ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
        : '';

    useEffect(() => {
        if (state.controls.volume !== undefined) {
            setLocalVolume(state.controls.volume);
        }
    }, [state.controls.volume]);

    return (
        <div className="flex flex-col h-full bg-base-100 text-base-content relative">

            {/* 1. Header: Room Info & Disconnect */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-base-200">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <TvIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <div className="text-xs opacity-60">ห้องหมายเลข</div>
                        <div className="font-bold text-lg leading-none">{roomCode}</div>
                    </div>
                </div>
                <button
                    onClick={() => setIsDisconnectModalOpen(true)}
                    className="btn btn-ghost btn-sm text-error gap-1"
                >
                    <XMarkIcon className="w-4 h-4" />
                    <span className="text-xs">ออก</span>
                </button>
            </div>

            {/* 2. Main Content: Thumbnail & Title */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">

                {/* Thumbnail Image */}
                <div className="relative w-full aspect-video max-w-xs bg-base-200 rounded-xl overflow-hidden shadow-lg">
                    {thumbnailUrl ? (
                        <img
                            src={thumbnailUrl}
                            alt="Video Thumbnail"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-base-content/20">
                            <PlayIcon className="w-16 h-16" />
                        </div>
                    )}
                </div>

                {/* Song Info */}
                <div>
                    <h3 className="font-bold text-lg line-clamp-2 px-2">
                        {currentVideoTitle || 'พร้อมเล่นเพลง'}
                    </h3>
                    <p className="text-sm opacity-60 mt-1">
                        {state.controls.isPlaying ? 'กำลังเล่นบน TV' : 'หยุดชั่วคราว'}
                    </p>
                </div>
            </div>

            {/* 3. Footer: Controls */}
            <div className="border-t border-base-200 bg-base-50 p-4">

                {/* Playback Controls */}
                <div className="flex items-center justify-center gap-6 mb-4">
                    <button onClick={previous} className="btn btn-circle btn-ghost">
                        <BackwardIcon className="w-6 h-6" />
                    </button>

                    <button
                        onClick={state.controls.isPlaying ? pause : play}
                        className="btn btn-circle btn-primary btn-lg shadow-md"
                    >
                        {state.controls.isPlaying ? (
                            <PauseIcon className="w-8 h-8" />
                        ) : (
                            <PlayIcon className="w-8 h-8 ml-1" />
                        )}
                    </button>

                    <button onClick={next} className="btn btn-circle btn-ghost">
                        <ForwardIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Volume Control */}
                <div className="flex items-center gap-3 px-4 max-w-xs mx-auto">
                    <button onClick={toggleMute} className="btn btn-circle btn-ghost btn-sm">
                        {state.controls.isMuted ? (
                            <SpeakerXMarkIcon className="w-5 h-5 text-error" />
                        ) : (
                            <SpeakerWaveIcon className="w-5 h-5 opacity-60" />
                        )}
                    </button>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={localVolume}
                        className="range range-primary range-xs flex-1"
                        onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setLocalVolume(val);
                            setVolume(val);
                        }}
                    />
                </div>
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
