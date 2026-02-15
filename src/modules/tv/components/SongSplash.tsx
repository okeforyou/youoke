import React from 'react';
import Image from 'next/image';
import { MusicalNoteIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { VideoItem } from '../types';

interface SongSplashProps {
    video: VideoItem;
    isVisible: boolean;
}

export const SongSplash: React.FC<SongSplashProps> = ({ video, isVisible }) => {
    return (
        <div className={clsx(
            "fixed inset-0 z-50 flex items-center justify-center transition-all duration-1000",
            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-110 pointer-events-none"
        )}>
            {/* Background Artwork (Blurred) */}
            <div className="absolute inset-0 bg-black">
                {video.videoId && (
                    <div className="absolute inset-0 opacity-40 blur-[80px] scale-125">
                        <Image unoptimized src={`https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`} fill className="object-cover" alt="BG" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black" />
            </div>

            <div className="relative text-center max-w-4xl px-12 animate-in zoom-in-95 fade-in duration-1000">
                <div className="w-64 h-64 mx-auto mb-12 rounded-[3.5rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] border-4 border-white/10 relative transform -rotate-3 hover:rotate-0 transition-transform duration-700">
                    <Image
                        unoptimized
                        src={`https://i.ytimg.com/vi/${video.videoId}/maxresdefault.jpg`}
                        fill
                        className="object-cover"
                        alt="Splash"
                        onError={(e) => { e.currentTarget.src = `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>

                <div className="space-y-6">
                    <div className="inline-flex items-center gap-3 bg-primary px-6 py-2 rounded-full shadow-2xl shadow-primary/40 animate-pulse">
                        <MusicalNoteIcon className="w-5 h-5 text-white" />
                        <span className="text-sm font-black uppercase tracking-[0.3em] text-white">กำลังเตรียมพร้อม</span>
                    </div>
                    <h1 className="text-5xl font-black text-white leading-tight tracking-tighter drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">{video.title}</h1>
                    <div className="flex items-center justify-center gap-4 text-xl text-white/60 font-medium">
                        <p>{video.author}</p>
                        <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                        <p className="flex items-center gap-2">
                            <span className="text-white/30 text-base">โดย</span>
                            <span className="text-primary font-bold italic">{video.addedBy?.displayName || 'แขก'}</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
