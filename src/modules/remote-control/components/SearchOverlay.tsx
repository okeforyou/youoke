
import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { DebounceInput } from 'react-debounce-input';
import SearchResultHorizontalCard from '../../../components/SearchResultHorizontalCard';
import { CATEGORIES } from '../../../data/categories';
import { CategoryChips } from '../../../components/CategoryChips';

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
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchType, setSearchType] = useState<'video' | 'karaoke'>('video');
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<NodeJS.Timeout>();

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
        setActiveCategory('All'); // Reset category on manual type

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

    const handleCategorySelect = (catName: string) => {
        setActiveCategory(catName);
        const category = CATEGORIES.find(c => c.name === catName);
        if (category) {
            setTerm(category.query);
            performSearch(category.query);
        }
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
                </div>

                {/* Type Toggle Switch */}
                <div className="px-4 pb-2 flex justify-center">
                    <div className="bg-gray-100 p-1 rounded-xl flex w-full max-w-[200px] relative">
                        {/* Sliding Background */}
                        <div
                            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-all duration-300 ease-out ${searchType === 'karaoke' ? 'left-[calc(50%+2px)]' : 'left-1'}`}
                        />
                        <button
                            onClick={() => handleTypeToggle('video')}
                            className={`flex-1 relative z-10 text-xs font-bold py-1.5 text-center transition-colors ${searchType === 'video' ? 'text-primary' : 'text-gray-500'}`}
                        >
                            เพลง
                        </button>
                        <button
                            onClick={() => handleTypeToggle('karaoke')}
                            className={`flex-1 relative z-10 text-xs font-bold py-1.5 text-center transition-colors ${searchType === 'karaoke' ? 'text-primary' : 'text-gray-500'}`}
                        >
                            คาราโอเกะ
                        </button>
                    </div>
                </div>

                {/* Category Chips */}
                <div className="pb-2">
                    <CategoryChips
                        categories={CATEGORIES.map(c => c.name)}
                        activeCategory={activeCategory}
                        onSelect={handleCategorySelect}
                    />
                </div>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {results.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 pb-20">
                        {results.map((video, idx) => (
                            <SearchResultHorizontalCard
                                key={`${video.videoId}-${idx}`}
                                video={video}
                                onClick={() => onAdd(video)}
                            />
                        ))}
                    </div>
                ) : (
                    /* Empty State */
                    !loading && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 pb-20">
                            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4 opacity-50">
                                <Search className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-lg font-medium text-gray-500">พิมพ์ชื่อเพลงเพื่อค้นหา</p>
                            <p className="text-sm text-gray-400 mt-1">หรือเลือกหมวดหมู่ด้านบน</p>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};
