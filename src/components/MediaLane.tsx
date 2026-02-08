import React, { useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

interface MediaItem {
    id: string;
    title: string;
    subtitle?: string;
    image: string;
    onClick: () => void;
}

interface MediaLaneProps {
    title: string;
    items: MediaItem[];
    type?: 'video' | 'artist' | 'square';
    loading?: boolean;
}

export const MediaLane = ({ title, items, type = 'video', loading = false }: MediaLaneProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = current.clientWidth * 0.8;
            current.scrollBy({
                left: direction === 'right' ? scrollAmount : -scrollAmount,
                behavior: 'smooth',
            });
        }
    };

    if (loading) {
        return (
            <div className="py-8 space-y-4 px-4 md:px-8">
                <div className="h-8 w-48 bg-gray-800 rounded animate-pulse" />
                <div className="flex gap-4 overflow-hidden">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className={`shrink-0 bg-gray-800 animate-pulse rounded-lg ${type === 'artist' ? 'w-32 h-32 rounded-full' : 'w-64 h-36'}`} />
                    ))}
                </div>
            </div>
        )
    }

    if (!items?.length) return null;

    return (
        <div className="py-6 md:py-8 group relative">
            {/* Header */}
            <h2 className="px-4 md:px-12 text-xl md:text-2xl font-bold text-gray-100 mb-4 flex items-center gap-2 group/title cursor-pointer">
                {title}
                <ChevronRightIcon className="w-5 h-5 text-primary opacity-0 group-hover/title:opacity-100 -translate-x-2 group-hover/title:translate-x-0 transition-all" />
            </h2>

            {/* Controls (Desktop Only) */}
            <button
                onClick={() => scroll('left')}
                className="hidden md:flex absolute left-4 top-1/2 z-20 w-12 h-12 bg-black/50 hover:bg-black/80 text-white rounded-full items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm shadow-xl"
            >
                <ChevronLeftIcon className="w-6 h-6" />
            </button>

            <button
                onClick={() => scroll('right')}
                className="hidden md:flex absolute right-4 top-1/2 z-20 w-12 h-12 bg-black/50 hover:bg-black/80 text-white rounded-full items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm shadow-xl"
            >
                <ChevronRightIcon className="w-6 h-6" />
            </button>

            {/* Scroll Container */}
            <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto px-4 md:px-12 pb-8 scrollbar-hide snap-x snap-mandatory"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {items.map((item) => (
                    <div
                        key={item.id}
                        onClick={item.onClick}
                        className={`
                relative shrink-0 cursor-pointer transition-all duration-300 hover:scale-105 hover:z-10 snap-center
                ${type === 'artist' ? 'w-32 md:w-40 flex flex-col items-center gap-2' : ''}
                ${type === 'video' ? 'w-64 md:w-[320px] aspect-video rounded-lg overflow-hidden' : ''}
                ${type === 'square' ? 'w-40 md:w-56 aspect-square rounded-xl overflow-hidden' : ''}
            `}
                    >
                        {/* Image Container */}
                        <div className={`
                relative w-full h-full overflow-hidden shadow-lg group/card
                ${type === 'artist' ? 'aspect-square rounded-full border-2 border-transparent hover:border-primary' : ''}
            `}>
                            <Image
                                src={item.image}
                                alt={item.title}
                                layout="fill"
                                className="object-cover transition-transform duration-500 group-hover/card:scale-110"
                                unoptimized
                            />

                            {/* Overlay (Video Only) */}
                            {type !== 'artist' && (
                                <div className="absolute inset-0 bg-black/20 group-hover/card:bg-black/40 transition-colors flex items-center justify-center">
                                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover/card:opacity-100 scale-50 group-hover/card:scale-100 transition-all border border-white/50">
                                        <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white border-b-[8px] border-b-transparent ml-1" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Title / Subtitle */}
                        <div className="mt-2 text-center md:text-left">
                            <h3 className={`font-medium text-gray-200 truncate ${type === 'artist' ? 'text-center text-sm' : 'text-base'}`}>
                                {item.title}
                            </h3>
                            {type !== 'artist' && item.subtitle && (
                                <p className="text-xs text-gray-400 truncate">{item.subtitle}</p>
                            )}
                        </div>
                    </div>
                ))}

                {/* Padding Right for scroll feeling */}
                <div className="w-8 shrink-0" />
            </div>
        </div>
    );
};
