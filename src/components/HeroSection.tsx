import React from 'react';
import Image from 'next/image';
import { PlayIcon, InformationCircleIcon } from '@heroicons/react/24/solid';
import { usePlayerStore } from '../modules/player/stores/usePlayerStore';

export interface HeroProps {
    title: string;
    description: string;
    imageUrl: string;
    videoId?: string;
}

export const HeroSection = ({ title, description, imageUrl, videoId }: HeroProps) => {
    const { playVideo, addToQueue } = usePlayerStore();

    const handlePlay = () => {
        if (videoId) {
            playVideo(videoId);
        }
    };

    return (
        <div className="relative w-full h-[60vh] md:h-[70vh] flex items-end pb-12 overflow-hidden group">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <Image
                    src={imageUrl}
                    alt={title}
                    fill
                    priority
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-[10s] ease-out"
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-base-100 via-base-100/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-base-100 via-base-100/30 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10 px-4 md:px-12 w-full max-w-4xl space-y-4 animate-in fade-in slide-in-from-bottom-10 duration-700">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/10 text-white text-xs font-bold uppercase tracking-wider mb-2">
                    🔥 Trending Now
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight drop-shadow-xl">
                    {title}
                </h1>
                <p className="text-gray-200 text-sm md:text-lg line-clamp-2 max-w-xl drop-shadow-md">
                    {description}
                </p>

                <div className="flex items-center gap-3 pt-4">
                    <button
                        onClick={handlePlay}
                        className="btn btn-primary btn-lg border-none shadow-xl hover:scale-105 transition-transform gap-2 px-8 rounded-full"
                    >
                        <PlayIcon className="w-6 h-6" />
                        <span className="font-bold">Play Now</span>
                    </button>

                    <button className="btn btn-ghost btn-lg text-white gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full px-6">
                        <InformationCircleIcon className="w-6 h-6" />
                        <span className="hidden sm:inline">More Info</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
