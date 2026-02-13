
import React, { useState, useEffect, useRef } from 'react';
import { Search, X, RefreshCw, Sparkles, Music, Mic } from 'lucide-react';
import { DebounceInput } from 'react-debounce-input';
import Image from 'next/image';
import { RemoteSearchResultCard } from './RemoteSearchResultCard';
import { useRemoteRecommendations } from '../hooks/useRemoteRecommendations';

interface SearchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (video: any) => void;
    guestName: string;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({
    isOpen,
    onClose,
    onAdd,
    guestName
}) => {
    const [term, setTerm] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchType, setSearchType] = useState<'video' | 'karaoke'>('video');
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<NodeJS.Timeout>();

    // 🌟 Dynamic Recommendations Hook
    const {
        currentTopic,
        playlists,
        isLoading: recsLoading,
        shuffle,
        topics,
        setCurrentTopic
    } = useRemoteRecommendations();

    useEffect(() => {
        if (isOpen) {
            // Auto-focus logic with slight delay for animation
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    const performSearch = async (value: string, type: 'video' | 'karaoke' = searchType) => {
        if (!value.trim()) {
            setResults([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const { getSearchResult } = await import('../../../utils/api');

            const effectiveQuery = type === 'karaoke' ? `${value} karaoke` : value;
            const data = await getSearchResult({ q: effectiveQuery, type: 'video' });

            console.log('Search Results:', data);
            setResults(data);
        } catch (e) {
            console.error('Search Error:', e);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchInput = (value: string) => {
        setTerm(value);

        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (!value.trim()) {
            setResults([]);
            return;
        }

        setLoading(true);
        debounceRef.current = setTimeout(() => performSearch(value, searchType), 600);
    };

    const handleTypeToggle = (type: 'video' | 'karaoke') => {
        setSearchType(type);
        if (term) performSearch(term, type);
    };


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-50 z-[60] flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Header Area */}
            <div className="bg-white shadow-sm z-10">
                {/* Search Bar */}
                <div className="px-4 py-3 flex items-center gap-3">
                    <button onClick={onClose} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full">
                        <X size={24} />
                    </button>
                    <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 relative">
                            <DebounceInput
                                // @ts-ignore
                                inputRef={inputRef}
                                minLength={1}
                                debounceTimeout={500}
                                value={term}
                                onChange={(e) => handleSearchInput(e.target.value)}
                                placeholder="ค้นหาเพลง, ศิลปิน..."
                                className="w-full bg-gray-100 border-none rounded-2xl px-10 py-3 text-base text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-gray-400"
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                <Search size={20} />
                            </div>
                            {loading && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                            {term && !loading && (
                                <button
                                    onClick={() => { setTerm(''); setResults([]); inputRef.current?.focus(); }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 p-1 rounded-full hover:bg-gray-200"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        {/* 🎤 Senior-Friendly Mode Toggle (Always Visible Dual Switch) */}
                        <div className="flex bg-gray-100 p-1 rounded-2xl gap-1 shrink-0">
                            {/* Music Mode Button */}
                            <button
                                onClick={() => searchType !== 'video' && handleTypeToggle('video')}
                                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${searchType === 'video' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:bg-gray-200'}`}
                                title="โหมดเพลงปกติ"
                            >
                                <Music size={20} strokeWidth={searchType === 'video' ? 3 : 2} />
                            </button>

                            {/* Karaoke Mode Button */}
                            <button
                                onClick={() => searchType !== 'karaoke' && handleTypeToggle('karaoke')}
                                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${searchType === 'karaoke' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:bg-gray-200'}`}
                                title="โหมดคาราโอเกะ"
                            >
                                <Mic size={20} strokeWidth={searchType === 'karaoke' ? 3 : 2} />
                            </button>
                        </div>
                    </div>
                </div>


            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {results.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 pb-20">
                        {results.map((video, idx) => (
                            <RemoteSearchResultCard
                                key={`${video.videoId}-${idx}`}
                                video={video}
                                onClick={() => onAdd(video)}
                            />
                        ))}
                    </div>
                ) : (
                    /* 🌟 Enhanced Empty State: Recommendations */
                    !loading && (
                        <div className="flex flex-col h-full animate-in fade-in duration-500">
                            {/* Section Header */}
                            <div className="flex items-center justify-between mb-4 px-1">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                        <Sparkles size={16} className="text-primary" />
                                    </div>
                                    <h3 className="text-lg font-black text-gray-900">แนะนำสำหรับคุณ</h3>
                                </div>
                                <button
                                    onClick={shuffle}
                                    className={`p-2 rounded-full hover:bg-gray-100 text-gray-400 transition-all active:rotate-180 ${recsLoading ? 'animate-spin text-primary' : ''}`}
                                >
                                    <RefreshCw size={20} />
                                </button>
                            </div>


                            {/* Playlists Row (Cards) */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                        จากหัวข้อ: <span className="text-primary">{currentTopic}</span>
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {recsLoading ? (
                                        [...Array(4)].map((_, i) => (
                                            <div key={i} className="aspect-[4/3] bg-gray-100 rounded-2xl animate-pulse" />
                                        ))
                                    ) : (
                                        playlists.slice(0, 6).map((playlist: any) => (
                                            <button
                                                key={playlist.tag_id}
                                                onClick={() => {
                                                    setTerm(playlist.tag_name);
                                                    performSearch(playlist.tag_name);
                                                }}
                                                className="group relative aspect-[4/3] bg-gray-200 rounded-2xl overflow-hidden shadow-sm active:scale-95 transition-all text-left"
                                            >
                                                <Image
                                                    unoptimized
                                                    src={playlist.imageUrl || '/icon-cover.png'}
                                                    fill
                                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                    alt={playlist.tag_name}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3 flex flex-col justify-end">
                                                    <h4 className="text-white font-black text-sm leading-tight line-clamp-2">
                                                        {playlist.tag_name}
                                                    </h4>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Tip at bottom */}
                            <div className="mt-8 p-4 bg-gray-100 rounded-2xl flex items-center gap-3 opacity-60">
                                <Music size={16} className="text-gray-400" />
                                <p className="text-[11px] font-bold text-gray-500 italic">
                                    เคล็ดลับ: กดที่เพลย์ลิสต์เพื่อค้นหาเพลงแนวที่ต้องการได้ทันที
                                </p>
                            </div>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};
