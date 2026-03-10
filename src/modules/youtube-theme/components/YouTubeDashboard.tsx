import { useQuery, keepPreviousData } from "@tanstack/react-query";
import axios from "axios";
import { Loader2, Music, Search, X, Mic, ArrowLeft, Play, ListMusic, PlusCircle, PlayCircle } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePlayerStore } from "../../../modules/player/stores/usePlayerStore";
import { useUIStore } from "../../../stores/useUIStore";
import { useRouter } from "next/router";

// Types
interface YTItem {
    id: string;
    title: string;
    subtitle?: string;
    thumbnail?: string;
    type?: string;
}

interface YTShelf {
    title: string;
    items: YTItem[];
}

const fetchExplore = async () => {
    const { data } = await axios.get("/api/explore");
    return data;
};

const fetchSearch = async (query: string, filter: string = 'SONG', isKaraokeMode: boolean = false): Promise<YTItem[]> => {
    if (!query) return [];

    // TRANSPARENT KARAOKE LOGIC:
    // If Global Karaoke Mode is ON, we append "karaoke" effectively here,
    // keeping the UI "searchTerm" clean (just the song title).
    let finalQuery = query;
    if (isKaraokeMode && !finalQuery.toLowerCase().includes('karaoke')) {
        finalQuery += " karaoke";
    }

    // MODULE: YouTube Theme Dedicated API
    const { data } = await axios.get(`/api/modules/youtube/search?q=${encodeURIComponent(finalQuery)}`);
    return data.data || [];
};

const fetchPlaylist = async (id: string, type: string = 'playlist') => {
    const { data } = await axios.get(`/api/yt/playlist?id=${id}&type=${type}`);
    if (data.status === 'error') throw new Error(data.message);
    return data.data;
};

export default function YouTubeDashboard() {
    const { addToQueue, searchTerm, isKaraoke } = usePlayerStore(); // Global Search State
    const [debouncedTerm, setDebouncedTerm] = useState("");
    const [activePlaylist, setActivePlaylist] = useState<YTItem | null>(null);
    const [searchFilter, setSearchFilter] = useState("SONG");

    // Debounce Logic
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedTerm(searchTerm);
        }, 600); // 600ms debounce
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const isSearching = !!debouncedTerm;

    // Scroll to top when search results appear or change
    useEffect(() => {
        if (isSearching) {
            const mainContent = document.getElementById("main-content");
            if (mainContent) {
                mainContent.scrollTo({ top: 0, behavior: 'instant' });
            }
        }
    }, [debouncedTerm, searchFilter, isSearching]);

    // --- History & Back Navigation Logic ---
    const router = useRouter();

    // --- History & Back Navigation Logic (Router Based) ---
    useEffect(() => {
        // 1. Sync State with URL
        if (router.query.view !== 'playlist' && activePlaylist) {
            setActivePlaylist(null);
        }

        // 2. Clear Search if URL param is empty? 
        // Or simpler: If we are 'home' (no search, no playlist), we are good.
        // We will just use router.back() for everything.

        // Handle In-App Back Button
        if (activePlaylist) {
            useUIStore.getState().setBackAction(() => router.back());
        } else if (searchTerm) {
            useUIStore.getState().setBackAction(() => {
                usePlayerStore.setState({ searchTerm: '' });
                // Also clear query param if we implemented it, but for now just clear state.
            });
        } else {
            useUIStore.getState().setBackAction(null);
        }

    }, [router.query, activePlaylist, searchTerm]);

    // Push State when opening Playlist
    const openPlaylist = (item: YTItem) => {
        setActivePlaylist(item);
        // Use shallow routing to update URL without full reload
        router.push(
            {
                pathname: router.pathname,
                query: { ...router.query, view: 'playlist', id: item.id }
            },
            undefined,
            { shallow: true }
        );
    };


    // Explore Query (Pause when searching)
    const exploreQuery = useQuery({
        queryKey: ["youtube-explore"],
        queryFn: fetchExplore,
        staleTime: 1000 * 60 * 5,
        retry: 1,
        // Don't fully disable, just don't refetch if searching to keep cache
        enabled: !isSearching && !activePlaylist
    });

    // Search Query
    const searchQuery = useQuery({
        queryKey: ["youtube-search", debouncedTerm, searchFilter, isKaraoke],
        queryFn: () => fetchSearch(debouncedTerm, searchFilter, isKaraoke),
        enabled: isSearching,
        retry: 1,
        placeholderData: keepPreviousData
    });

    // Playlist Query
    const playlistQuery = useQuery({
        queryKey: ["youtube-playlist", activePlaylist?.id],
        queryFn: () => fetchPlaylist(activePlaylist!.id, activePlaylist!.type),
        enabled: !!activePlaylist,
        staleTime: 1000 * 60 * 30 // Cache for 30 mins
    });

    // Determine Logic State
    const isLoading = isSearching ? searchQuery.isLoading : exploreQuery.isLoading;
    const isError = isSearching ? searchQuery.isError : exploreQuery.isError;
    const error = isSearching ? searchQuery.error : exploreQuery.error;

    // Data Handling
    const shelves: YTShelf[] = exploreQuery.data?.data || [];
    const searchResults: YTItem[] = searchQuery.data || [];

    // Helper to clean title for better search
    const cleanTitle = (title: string) => {
        return title
            .replace(/[\(\[\{].*?[\)\]\}]/g, '') // Remove brackets (...) [...] {...}
            // Remove everything after pipe | or dash - (often separates title from garbage, BUT careful with Artist - Title)
            // Let's be safer: just remove specific keywords and pipes at the end
            .replace(/\|.*$/g, '')
            .replace(/Official\s+MV/gi, '')
            .replace(/Official\s+Video/gi, '')
            .replace(/Music\s+Video/gi, '')
            .replace(/Lyric\s+Video/gi, '')
            .replace(/\s+/g, ' ') // Collapse spaces
            .trim();
    };

    // Helper to detect collections/compilations
    const isCompilation = (title: string) => {
        const keywords = ['รวมเพลง', 'full album', 'อัลบั้มเต็ม', 'compilation', 'playlist', 'รวมฮิต', 'nonstop', 'non-stop', 'medley', 'long play', 'mix', 'ชั่วโมง', 'hour', 'collection'];
        const lower = title.toLowerCase();
        return keywords.some(k => lower.includes(k));
    };

    const handleItemClick = async (item: YTItem) => {
        if (item.type === 'playlist' || item.type === 'album') {
            openPlaylist(item);
        } else {
            // KARAOKE LOGIC
            console.log(`🎵 Item Clicked: "${item.title}" | isKaraoke: ${isKaraoke}`);

            if (isKaraoke) {
                // Skip if it looks like a compilation
                const isComp = isCompilation(item.title);

                if (isComp) {
                    console.log(`🎤 Karaoke Skipped: "${item.title}" looks like a compilation. Playing original.`);
                } else {
                    // INSTANT SEARCH REDIRECT (Spotify Style)
                    const cleanedTitle = cleanTitle(item.title);

                    // We set the UI to the CLEAN Title (e.g. "Song Name")
                    // The API hook (fetchSearch) will detect `isKaraoke` and append "karaoke" transparently.
                    // This keeps the UI clean and matches User Experience from Spotify Theme.

                    console.log(`🚀 Karaoke Instant Redirect (Clean): "${cleanedTitle}"`);

                    setSearchFilter('VIDEO');
                    usePlayerStore.setState({ searchTerm: cleanedTitle });
                    return; // Stop here.
                }
            }

            addToQueue({
                id: item.id,
                videoId: item.id,
                title: item.title,
                author: item.subtitle || 'Unknown',
                sourceType: 'youtube',
                thumbnail: item.thumbnail
            } as any);
        }
    };

    const handleBack = () => {
        router.back();
    };

    const handleClearSearch = () => {
        usePlayerStore.setState({ searchTerm: '' });
    };

    const handlePlayPlaylist = (items: YTItem[]) => {
        const videos = items.map(item => ({
            id: item.id,
            videoId: item.id,
            title: item.title,
            author: item.subtitle,
            sourceType: 'youtube',
            thumbnail: item.thumbnail
        }));
        addToQueue(videos as any);
    };

    // PLAYLIST VIEW
    if (activePlaylist) {
        const pItems = playlistQuery.data?.items || [];
        const pLoading = playlistQuery.isLoading;
        const pError = playlistQuery.error;

        return (
            <div className="pb-24 animate-in fade-in slide-in-from-right duration-300 min-h-screen bg-white">
                {/* Header with Back Button */}
                <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md p-4 border-b border-gray-100 flex items-center gap-4 shadow-sm">
                    <button onClick={handleBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-gray-700" />
                    </button>
                    <h2 className="text-lg font-bold truncate flex-1 text-black">{activePlaylist.title}</h2>
                </div>


                {/* Hero Section */}
                <div className="p-4 md:p-6 flex flex-col md:flex-row gap-4 items-center md:items-start border-b border-gray-50">
                    <div className="relative w-40 h-40 md:w-56 md:h-56 rounded-xl overflow-hidden shadow-xl shrink-0 group">
                        <Image
                            src={activePlaylist.thumbnail?.replace('w120-h120', 'w400-h400') || '/assets/cover-placeholder.png'}
                            fill
                            className="object-cover"
                            alt={activePlaylist.title}
                            unoptimized
                        />
                        {/* Play All Overlay Button */}
                        {!pLoading && pItems.length > 0 && (
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => handlePlayPlaylist(pItems)}>
                                <PlayCircle className="w-14 h-14 text-white drop-shadow-lg transform scale-90 group-hover:scale-100 transition-transform" />
                            </div>
                        )}
                    </div>
                    <div className="text-center md:text-left flex-1 space-y-3">
                        <div>
                            <span className="px-2.5 py-0.5 bg-red-50 text-red-600 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 inline-block">
                                {activePlaylist.type === 'album' ? 'Album' : 'Playlist'}
                            </span>
                            <h1 className="text-sm md:text-lg font-bold text-black leading-tight">{activePlaylist.title}</h1>
                        </div>
                        <p className="text-gray-500 text-sm font-medium">{activePlaylist.subtitle}</p>

                        {!pLoading && pItems.length > 0 && (
                            <button
                                onClick={() => handlePlayPlaylist(pItems)}
                                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-red-200 transition-all transform active:scale-95"
                            >
                                <Play className="w-5 h-5" fill="currentColor" />
                                เล่นทั้งหมด ({pItems.length} เพลง)
                            </button>
                        )}
                    </div>
                </div>

                {/* Song List */}
                <div className="p-4 md:p-8 max-w-5xl mx-auto">
                    {pLoading && (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex gap-4 p-4 rounded-xl bg-gray-50 animate-pulse">
                                    <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                                    <div className="flex-1 space-y-2 py-1">
                                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {pError && (
                        <div className="p-8 text-center text-red-500 bg-red-50 rounded-2xl">
                            <p>ไม่สามารถโหลดข้อมูลเพลย์ลิสต์ได้</p>
                            <p className="text-xs mt-2 opacity-70">{(pError as any).message}</p>
                        </div>
                    )}

                    {!pLoading && !pError && (
                        <div className="space-y-1">
                            {pItems.map((item: any, index: number) => {
                                const isComp = isCompilation(item.title);
                                const isKaraokeItem = isKaraoke && !isComp;

                                return (
                                    <div
                                        key={item.id + index}
                                        onClick={() => handleItemClick(item)}
                                        className={`group flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors border border-transparent hover:border-gray-100 ${isKaraokeItem ? 'hover:bg-red-50' : ''}`}
                                    >
                                        <span className="w-6 text-center text-gray-400 font-mono text-sm group-hover:hidden">{index + 1}</span>
                                        <span className={`w-6 text-center hidden group-hover:block ${isKaraokeItem ? 'text-red-600' : 'text-red-600'}`}>
                                            {isKaraokeItem ? <Mic className="w-4 h-4 ml-1" /> : <Play className="w-4 h-4 ml-1" fill="currentColor" />}
                                        </span>

                                        <div className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-gray-200">
                                            <Image src={item.thumbnail?.replace('w120-h120', 'w400-h400') || '/assets/cover-placeholder.png'} fill className="object-cover" alt="" unoptimized />
                                            {isKaraokeItem && (
                                                <div className="absolute inset-0 bg-red-900/10 flex items-center justify-center">
                                                    <Mic className="w-6 h-6 text-white drop-shadow-md" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h4 className={`font-bold text-black truncate transition-colors ${isKaraokeItem ? 'group-hover:text-red-600' : 'group-hover:text-red-600'}`}>
                                                {item.title}
                                            </h4>
                                            <p className={`text-sm truncate flex items-center gap-1 ${isKaraokeItem ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                                                {isKaraokeItem ? (
                                                    <>
                                                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                                                        พร้อมค้นหาคาราโอเกะ
                                                    </>
                                                ) : item.subtitle}
                                            </p>
                                        </div>

                                        {isKaraokeItem && (
                                            <span className="px-2 py-1 bg-red-100 text-red-600 text-[10px] font-bold rounded-md whitespace-nowrap hidden md:inline-block">
                                                KARAOKE MODE
                                            </span>
                                        )}

                                        {!isKaraokeItem && (
                                            <div className="text-xs text-gray-400 font-mono mr-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        addToQueue({
                                                            id: item.id,
                                                            videoId: item.id,
                                                            title: item.title,
                                                            author: item.subtitle,
                                                            sourceType: 'youtube',
                                                            thumbnail: item.thumbnail
                                                        } as any);
                                                    }}
                                                    className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-900"
                                                >
                                                    <PlusCircle className="w-5 h-5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- RENDER HELPERS (Spotify Theme Style) ---
    const renderArtistShelf = (shelf: YTShelf) => (
        <div key={shelf.title} className="space-y-4">
            <div className="px-2 pt-2 text-[13px] font-black text-black uppercase tracking-wider flex items-center gap-2">
                {shelf.title}
            </div>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pb-6 px-2">
                {shelf.items.map((artist, i) => (
                    <div
                        key={artist.id + i}
                        className="group relative cursor-pointer overflow-hidden rounded-2xl shadow-sm hover:shadow-2xl hover:shadow-red-600/10 hover:-translate-y-1 transition-all duration-300 isolate bg-gray-100 w-full aspect-square"
                        onClick={() => usePlayerStore.setState({ searchTerm: artist.title })}
                    >
                        <Image
                            src={artist.thumbnail?.replace('w120-h120', 'w400-h400') || '/assets/avatar.jpeg'}
                            fill
                            alt={artist.title}
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                            unoptimized
                        />
                        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-lg transform scale-50 group-hover:scale-100 transition-transform">
                                <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                            </div>
                        </div>
                        <div className="absolute inset-0 p-3 flex flex-col justify-end items-start z-10 pointer-events-none">
                            <h2 className="text-white font-bold text-[11px] sm:text-[12px] leading-tight line-clamp-1 drop-shadow-md transform translate-y-0.5 group-hover:translate-y-0 transition-transform text-left">
                                {artist.title}
                            </h2>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderPlaylistShelf = (shelf: YTShelf) => (
        <div key={shelf.title} className="space-y-4">
            <div className="px-2 pt-4 pb-3 text-[13px] font-black text-black uppercase tracking-wider flex items-center justify-between border-t border-gray-100 mt-2">
                <span>{shelf.title}</span>
                <span className="text-[10px] font-normal text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">YouTube Music</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4 px-2 pb-10">
                {shelf.items.map((cat, i) => (
                    <div
                        key={cat.id + i}
                        onClick={() => handleItemClick(cat)}
                        className="relative w-full aspect-square rounded-3xl overflow-hidden cursor-pointer shadow-sm hover:shadow-2xl hover:shadow-red-600/10 transition-all duration-500 hover:-translate-y-1.5 group bg-gray-100"
                    >
                        <Image
                            src={cat.thumbnail?.replace('w120-h120', 'w400-h400') || "/icon-cover.png"}
                            alt={cat.title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                            unoptimized
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90 transition-opacity" />
                        <div className="absolute inset-0 p-4 flex flex-col justify-between">
                            <div className="self-end opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-2 group-hover:translate-x-0">
                                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg">
                                    {cat.type === 'video' ? <Play className="w-4 h-4 text-white fill-current" /> : <ListMusic className="w-5 h-5 text-white" />}
                                </div>
                            </div>
                            <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                <span className="text-white font-bold text-[11px] sm:text-[13px] drop-shadow-md line-clamp-2 leading-tight">
                                    {cat.title}
                                </span>
                                <div className="h-1 w-12 bg-red-600 rounded-full mt-2 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100 origin-left scale-x-0 group-hover:scale-x-100" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="pb-24 animate-in fade-in duration-500 min-h-screen bg-white">
            {/* Search Header */}
            {isSearching && (
                <div className="w-full bg-white px-4 py-3 border-b border-gray-100 flex items-center gap-3 shadow-sm mb-4 sticky top-0 z-40">
                    <button onClick={handleClearSearch} className="p-2 hover:bg-gray-100 rounded-full transition-colors group">
                        <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-red-600" />
                    </button>
                    <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">ค้นพบใน YouTube</p>
                        <h2 className="text-base font-bold text-black line-clamp-1">"{searchTerm}"</h2>
                    </div>
                </div>
            )}

            {/* Filter Chips */}
            {isSearching && (
                <div className="px-4 pb-4 flex gap-2 overflow-x-auto scrollbar-hide">
                    {['SONG', 'VIDEO', 'ALBUM', 'PLAYLIST'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setSearchFilter(type)}
                            className={`px-5 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap transition-all border ${searchFilter === type
                                    ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-100'
                                    : 'bg-gray-100 text-gray-600 border-gray-100 hover:bg-white hover:border-red-200'
                                }`}
                        >
                            {type === 'SONG' ? 'เพลง' : type === 'VIDEO' ? 'วิดีโอ' : type === 'ALBUM' ? 'อัลบั้ม' : 'เพลย์ลิสต์'}
                        </button>
                    ))}
                </div>
            )}

            <div className="px-2">
                {isLoading && (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
                    </div>
                )}

                {isError && (
                    <div className="text-center py-20 bg-red-50 rounded-3xl mx-2">
                        <X className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-black mb-1">ไม่สามารถเข้าถึงข้อมูลได้</h3>
                        <p className="text-sm text-gray-500">{(error as any).message}</p>
                    </div>
                )}

                {/* Search Results in Legacy Card Style */}
                {isSearching && !isLoading && !isError && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3 pb-24">
                        {searchResults.length > 0 ? (
                            searchResults.map((item, index) => (
                                <div
                                    key={item.id + index}
                                    onClick={() => handleItemClick(item)}
                                    className="group cursor-pointer bg-white rounded-xl border border-gray-100 hover:shadow-xl hover:shadow-red-600/5 transition-all active:scale-[0.98] duration-300 relative overflow-hidden"
                                >
                                    <div className="relative aspect-square w-full aspect-square overflow-hidden bg-gray-50">
                                        <Image
                                            src={item.thumbnail?.replace('w120-h120', 'w400-h400') || '/assets/avatar.jpeg'}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                                            alt={item.title}
                                            unoptimized
                                        />
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                            <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity scale-90 group-hover:scale-100">
                                                <Play className="w-5 h-5 text-red-600 fill-red-600 ml-0.5" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-2.5 gap-y-0.5 flex flex-col">
                                        <h2 className="font-bold text-[12px] line-clamp-2 text-black leading-tight group-hover:text-red-600 transition-colors">
                                            {item.title}
                                        </h2>
                                        <p className="text-[10px] text-gray-400 truncate font-medium">
                                            {item.subtitle}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-20 text-gray-400">
                                <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p className="text-sm font-bold">ไม่พบผลลัพธ์ที่ต้องการ</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Explore Sections (Legacy Layout) */}
                {!isSearching && !isLoading && !isError && (
                    <div className="space-y-2">
                        {shelves.map((shelf) => {
                            if (shelf.title.includes('ศิลปิน') || shelf.items.some(i => i.type === 'artist')) {
                                return renderArtistShelf(shelf);
                            }
                            return renderPlaylistShelf(shelf);
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
