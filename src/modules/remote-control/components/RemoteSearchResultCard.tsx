
import React from 'react';
import Image from 'next/image';
import { Plus, ListPlus } from 'lucide-react';

interface RemoteSearchResultCardProps {
    video: any;
    onClick: () => void;
    onSaveClick?: (e: React.MouseEvent) => void;
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
    onSaveClick,
    theme = 'dark'
}) => {
    return (
        <div
            className={`group flex items-center gap-3.5 p-1.5 rounded-2xl border transition-all active:scale-[0.98] ${theme === 'dark'
                    ? 'bg-black border-white/5 hover:border-primary/50 text-white shadow-black/40'
                    : 'bg-white border-gray-50 hover:border-primary/30 text-gray-900 shadow-md shadow-black/[0.03]'
                }`}
            onClick={onClick}
        >
            {/* Thumbnail - Left Side (Balanced Rounded) */}
            <div className={`relative w-24 h-14 flex-shrink-0 rounded-xl overflow-hidden ${theme === 'dark' ? 'bg-stone-900 border border-white/5' : 'bg-gray-100 border border-gray-200'}`}>
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
                <h4 className={`text-[13px] font-black line-clamp-2 leading-tight mb-1 uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                    {video.title}
                </h4>
                <p className={`text-[10px] font-bold truncate tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                    {video.author}
                </p>
            </div>

            {/* Action Buttons - Right Side */}
            <div className="flex items-center gap-1 pr-1.5">
                {/* Save Button (Playlist) */}
                {onSaveClick && (
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onSaveClick(e);
                        }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${theme === 'dark'
                            ? 'bg-white/5 text-gray-400 hover:bg-zinc-800 hover:text-white'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-black'
                        }`}
                        title="บันทึกเพลง"
                    >
                        <ListPlus size={20} strokeWidth={3} />
                    </button>
                )}

                {/* Add Button (Queue) */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${theme === 'dark'
                        ? 'bg-white/5 text-gray-500 group-hover:bg-primary group-hover:text-white group-hover:shadow-[0_4px_12px_rgba(229,9,20,0.4)]'
                        : 'bg-gray-100 text-gray-400 group-hover:bg-primary group-hover:text-white group-hover:shadow-[0_4px_12px_rgba(229,9,20,0.3)]'
                    }`}>
                    <Plus size={22} strokeWidth={3} />
                </div>
            </div>
        </div>
    );
};
