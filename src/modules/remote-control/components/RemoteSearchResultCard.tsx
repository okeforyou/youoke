
import React from 'react';
import Image from 'next/image';
import { Plus } from 'lucide-react';

interface RemoteSearchResultCardProps {
    video: any;
    onClick: () => void;
}

/**
 * V1-Inspired Search Result Card for Remote Control
 * Focuses on high-contrast text, clear borders, and a prominent Add button.
 */
export const RemoteSearchResultCard: React.FC<RemoteSearchResultCardProps> = ({
    video,
    onClick
}) => {
    return (
        <div
            className="group flex items-center gap-3 p-1 bg-white rounded-xl border border-gray-200 transition-all hover:border-primary hover:shadow-sm active:scale-[0.98]"
            onClick={onClick}
        >
            {/* Thumbnail - Left Side */}
            <div className="relative w-24 h-14 flex-shrink-0 bg-black rounded-lg overflow-hidden">
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
                <h4 className="text-[14px] font-black text-black line-clamp-2 leading-tight mb-0.5">
                    {video.title}
                </h4>
                <p className="text-[11px] text-gray-500 truncate font-medium">
                    {video.author}
                </p>
            </div>

            {/* Add Button - Right Side (V1 Signature) */}
            <div className="pr-3">
                <div className="w-8 h-8 rounded-full bg-gray-50 text-gray-400 group-hover:bg-primary/10 group-hover:text-primary flex items-center justify-center transition-all">
                    <Plus size={20} strokeWidth={3} />
                </div>
            </div>
        </div>
    );
};
