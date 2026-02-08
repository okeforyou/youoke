import React from 'react';
import { FireIcon, MusicalNoteIcon, StarIcon, GlobeAsiaAustraliaIcon, GlobeAmericasIcon, SparklesIcon, HeartIcon, BoltIcon } from '@heroicons/react/24/solid';

export interface Category {
    id: string;
    name: string;
    color: string;
    icon: React.ReactNode;
    query: string; // The search term used to fetch songs
    playlistId?: string; // Optional: if we want to fetch specific YT playlist
}

export const CATEGORIES: Category[] = [
    {
        id: 'thai_hits',
        name: 'ฮิตติดชาร์ต',
        color: 'from-orange-500 to-red-600',
        icon: <FireIcon className="w-8 h-8 text-white/90 drop-shadow-md" />,
        query: 'เพลงไทยฮิตล่าสุด 2024'
    },
    {
        id: 'party_dance',
        name: 'สายย่อ/แดนซ์',
        color: 'from-purple-500 to-pink-600',
        icon: <BoltIcon className="w-8 h-8 text-white/90 drop-shadow-md" />,
        query: 'รวมเพลงแดนซ์ สายย่อ มันส์ๆ'
    },
    {
        id: 'thai_country',
        name: 'ลูกทุ่ง/เพื่อชีวิต',
        color: 'from-emerald-500 to-teal-700',
        icon: <MusicalNoteIcon className="w-8 h-8 text-white/90 drop-shadow-md" />,
        query: 'รวมเพลงลูกทุ่งฮิต เพื่อชีวิต'
    },
    {
        id: 'kpop',
        name: 'เคป็อปยอดฮิต',
        color: 'from-rose-400 to-red-500',
        icon: <StarIcon className="w-8 h-8 text-white/90 drop-shadow-md" />,
        query: 'K-Pop hits karaoke'
    },
    {
        id: 'inter_hits',
        name: 'เพลงสากลฮิต',
        color: 'from-blue-500 to-indigo-600',
        icon: <GlobeAmericasIcon className="w-8 h-8 text-white/90 drop-shadow-md" />,
        query: 'International karaoke hits 2024'
    },
    {
        id: 'pub_vibes',
        name: 'เพลงร้านเหล้า',
        color: 'from-amber-600 to-orange-700',
        icon: <SparklesIcon className="w-8 h-8 text-white/90 drop-shadow-md" />,
        query: 'รวมเพลงร้านเหล้า ร้องตามได้'
    },
    {
        id: '90s_thai',
        name: 'เพลงไทย 90s',
        color: 'from-cyan-500 to-blue-600',
        icon: <HeartIcon className="w-8 h-8 text-white/90 drop-shadow-md" />,
        query: 'เพลงไทย 90s คาราโอเกะ'
    },
    {
        id: 'rock',
        name: 'ร็อคไทยมันส์ๆ',
        color: 'from-stone-600 to-stone-900',
        icon: <GlobeAsiaAustraliaIcon className="w-8 h-8 text-white/90 drop-shadow-md" />,
        query: 'รวมเพลงร็อคไทย มันส์ๆ'
    }
];
