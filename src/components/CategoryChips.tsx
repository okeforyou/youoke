import React, { useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface CategoryChipsProps {
    categories: string[];
    activeCategory: string;
    onSelect: (category: string) => void;
}

export const CategoryChips = ({ categories, activeCategory, onSelect }: CategoryChipsProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = 200;
            current.scrollBy({
                left: direction === 'right' ? scrollAmount : -scrollAmount,
                behavior: 'smooth',
            });
        }
    };

    return (
        <div className="relative group flex items-center w-full max-w-full overflow-hidden py-3 bg-base-100/95 backdrop-blur-sm sticky top-0 z-30 border-b border-white/5">

            {/* Scroll Left Button */}
            <button
                onClick={() => scroll('left')}
                className="hidden md:flex absolute left-0 z-10 h-full w-12 bg-gradient-to-r from-base-100 to-transparent items-center justify-start pl-2 text-gray-400 hover:text-white transition-colors"
            >
                <ChevronLeftIcon className="w-5 h-5 bg-base-200 rounded-full p-1" />
            </button>

            {/* Chips Container */}
            <div
                ref={scrollRef}
                className="flex gap-2 overflow-x-auto px-4 md:px-12 scrollbar-hide w-full"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => onSelect(cat)}
                        className={`
              whitespace-nowrap px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
              ${activeCategory === cat
                                ? 'bg-white text-black font-bold'
                                : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                            }
            `}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Scroll Right Button */}
            <button
                onClick={() => scroll('right')}
                className="hidden md:flex absolute right-0 z-10 h-full w-12 bg-gradient-to-l from-base-100 to-transparent items-center justify-end pr-2 text-gray-400 hover:text-white transition-colors"
            >
                <ChevronRightIcon className="w-5 h-5 bg-base-200 rounded-full p-1" />
            </button>
        </div>
    );
};
