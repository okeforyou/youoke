
import React from 'react';
import Image from 'next/image';
import { Plus } from 'lucide-react';

interface RemoteSearchResultCardProps {
    video: any;
    onClick: () => void;
    theme?: 'light' | 'dark';
}

/**
 * V1-Inspired Search Result Card for Remote Control
 * Focuses on high-contrast text, clear borders, and a prominent Add button.
 * Updated for Rounded V1 (2xl corners).
 */
export const RemoteSearchResultCard: React.FC<RemoteSearchResultCardProps> = ({
    video,
    onClick,
    theme = 'dark'
}) => {
    return (
        <div
            className={`group flex items-center gap-3 p-1 rounded-2xl border transition-all active:scale-[0.98] ${theme === 'dark'
                    ? 'bg-black border-white/5 hover:border-primary/50 text-white'
                    : 'bg-white border-gray-100 hover:border-primary/30 text-gray-900 shadow-sm'
                }`}
            onClick={onClick}
        >
            {/* Thumbnail - Left Side */}
            <div className={`relative w-24 h-14 flex-shrink-0 rounded-xl overflow-hidden ${theme === 'dark' ? 'bg-stone-900' : 'bg-gray-100'}`}>
                <Image
                    unoptimized
                    src={
                        video.videoThumbnails?.find((t: any) => t.quality === "medium")?.url ||
                        video.videoThumbnails?.[0]?.url ||
                        `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`
                    }
                    fill
                    className="object-cover"
                    alt={video.title}
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/icon-cover.png';
                    }}
                />
            </div>

            {/* Info - Middle */}
            <div className="flex-1 min-w-0 pr-2">
                <h4 className={`text-[13px] font-black line-clamp-2 leading-tight mb-0.5 uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                    {video.title}
                </h4>
                <p className={`text-[10px] font-bold truncate tracking-wide ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                    {video.author}
                </p>
            </div>

            {/* Add Button - Right Side (V1 Signature) */}
            <div className="pr-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${theme === 'dark'
                        ? 'bg-white/5 text-gray-500 group-hover:bg-primary group-hover:text-white'
                        : 'bg-gray-100 text-gray-400 group-hover:bg-primary group-hover:text-white'
                    }`}>
                    <Plus size={22} strokeWidth={3} />
                </div>
            </div>
        </div>
    );
};
