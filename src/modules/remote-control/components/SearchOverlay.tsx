
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
    theme?: 'light' | 'dark';
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({
    isOpen,
    onClose,
    onAdd,
    guestName,
    theme = 'dark'
}) => {
    const [term, setTerm] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchType, setSearchType] = useState<'video' | 'karaoke'>('video');
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        if (isOpen) {
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
        <div className={`fixed inset-0 z-[60] flex flex-col animate-in slide-in-from-bottom duration-300 ${theme === 'dark' ? 'bg-stone-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
            {/* V1 Style Header */}
            <div className={`shadow-xl z-10 transition-colors ${theme === 'dark' ? 'bg-stone-900 border-b border-white/5' : 'bg-white border-b border-gray-200'}`}>
                <div className="px-4 py-4 flex items-center gap-3">
                    <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'text-gray-400 hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'}`}>
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
                                className={`w-full border-none rounded-lg px-10 py-3.5 text-base font-bold outline-none transition-all placeholder:font-medium tracking-tight ${theme === 'dark'
                                        ? 'bg-black text-white focus:ring-1 focus:ring-primary/50 placeholder:text-gray-600'
                                        : 'bg-gray-100 text-gray-900 focus:ring-1 focus:ring-primary/20 placeholder:text-gray-400'
                                    }`}
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <Search size={20} strokeWidth={3} />
                            </div>
                            {loading && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className={`w-5 h-5 border-2 rounded-full animate-spin border-t-transparent ${theme === 'dark' ? 'border-primary' : 'border-primary'}`} />
                                </div>
                            )}
                        </div>

                        {/* V1 Dual-Mode Toggle */}
                        <div className={`flex p-1 rounded-xl gap-1 shrink-0 ${theme === 'dark' ? 'bg-black' : 'bg-gray-100'}`}>
                            <button
                                onClick={() => searchType !== 'video' && handleTypeToggle('video')}
                                className={`w-11 h-11 rounded-lg flex items-center justify-center transition-all ${searchType === 'video' ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:opacity-70'}`}
                            >
                                <Music size={20} strokeWidth={3} />
                            </button>
                            <button
                                onClick={() => searchType !== 'karaoke' && handleTypeToggle('karaoke')}
                                className={`w-11 h-11 rounded-lg flex items-center justify-center transition-all ${searchType === 'karaoke' ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:opacity-70'}`}
                            >
                                <Mic size={20} strokeWidth={3} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area - No Recommendations for clean V1 feel */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {results.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 pb-24">
                        {results.map((video, idx) => (
                            <RemoteSearchResultCard
                                key={`${video.videoId}-${idx}`}
                                video={video}
                                onClick={() => onAdd(video)}
                            />
                        ))}
                    </div>
                ) : (
                    !loading && (
                        <div className="flex flex-col items-center justify-center h-full opacity-40 select-none">
                            <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 border-4 border-dashed ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
                                <Search size={40} className={theme === 'dark' ? 'text-gray-600' : 'text-gray-300'} />
                            </div>
                            <h3 className={`text-lg font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                                {term ? 'NO RESULTS FOUND' : 'SEARCH TRACKS'}
                            </h3>
                            <p className="text-xs font-bold mt-2 tracking-wide">Enter song title or artist name</p>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};
