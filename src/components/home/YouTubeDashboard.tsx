import { useQuery, useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
import axios from "axios";
import { Loader2, ArrowLeft, Search, Music } from "lucide-react";
import Image from "next/image";
import { useState, useEffect, Fragment, useRef } from "react";
import { usePlayerStore } from "../../modules/player/stores/usePlayerStore";
import { useUIStore } from "../../stores/useUIStore";
import { useRouter } from "next/router";

// Types matching YouTube API
interface YTItem {
    id: string;
    playlistId?: string;
    videoId?: string;
    title: string;
    subtitle?: string;
    thumbnail?: string;
    type?: string;
}

interface YTShelf {
    title: string;
    items: YTItem[];
}

// API Fetchers
const fetchExplore = async () => {
    const { data } = await axios.get("/api/explore");
    return data;
};

const fetchSearch = async (query: string, searchMode: 'song' | 'ai_karaoke' | 'karaoke' = 'karaoke'): Promise<YTItem[]> => {
    if (!query) return [];
    let finalQuery = query;
    if (searchMode === 'karaoke' && !finalQuery.toLowerCase().includes('karaoke')) {
        finalQuery += " karaoke";
    } else if (searchMode === 'ai_karaoke') {
        if (!finalQuery.toLowerCase().includes('official audio') && !finalQuery.toLowerCase().includes('topic')) {
            finalQuery += " official audio";
        }
    }
    const { data } = await axios.get(`/api/modules/youtube/search?q=${encodeURIComponent(finalQuery)}`);
    return data.data || [];
};

const fetchPlaylist = async (id: string, type: string = 'playlist') => {
    const { data } = await axios.get(`/api/yt/playlist?id=${id}&type=${type}`);
    if (data.status === 'error') throw new Error(data.message);
    return data.data;
};

export default function YouTubeDashboard() {
    const { addToQueue, searchTerm, isKaraoke, searchMode, setSearchTerm, setActiveIndex } = usePlayerStore();
    const [debouncedTerm, setDebouncedTerm] = useState("");
    const [activePlaylist, setActivePlaylist] = useState<YTItem | null>(null);
    const [selectedShelfIndex, setSelectedShelfIndex] = useState(0);

    const router = useRouter();
    const playlistRef = useRef<HTMLDivElement>(null);
    const songlistRef = useRef<HTMLDivElement>(null);

    // URL-Driven State matching SpotifyDashboard
    const genreText = (router.query.genre as string) || "แนะนำ";
    const tagId = (router.query.playlist as string) || "";

    // Sync UI State with URL
    useEffect(() => {
        if (tagId && !activePlaylist) {
            // Find in explore data if possible or set placeholder
            setActivePlaylist({ id: tagId, title: "กำลังโหลด...", type: 'playlist' });
        } else if (!tagId && activePlaylist) {
            setActivePlaylist(null);
        }
    }, [tagId]);

    // Update URL when changing genre/playlist
    const setGenreInUrl = (text: string) => {
        const { search, ...rest } = router.query;
        router.push({
            pathname: router.pathname,
            query: { ...rest, genre: text, playlist: undefined }
        }, undefined, { shallow: true });
        setSearchTerm('');
        setSelectedShelfIndex(0); // Reset shelf index to let effect find matching shelf
    };

    const setPlaylistInUrl = (item: YTItem) => {
        setSearchTerm('');
        router.push({
            pathname: router.pathname,
            query: { ...router.query, playlist: item.id }
        }, undefined, { shallow: true });
        setActivePlaylist(item);
    };

    // Debounce Logic for Search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedTerm(searchTerm);
        }, 600);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const isSearching = !!debouncedTerm;

    // Explore Query
    const exploreQuery = useQuery({
        queryKey: ["youtube-explore"],
        queryFn: fetchExplore,
        staleTime: 1000 * 60 * 5,
        enabled: !isSearching
    });

    const shelves: YTShelf[] = exploreQuery.data?.data || [];

    // Sync selectedShelfIndex with genreText
    useEffect(() => {
        if (shelves.length > 0) {
            if (genreText === "แนะนำ") {
                setSelectedShelfIndex(1); // Usually first curated genre shelf
            } else {
                // Find shelf by title (ignoring icons)
                const index = shelves.findIndex(s => {
                    const cleanTitle = s.title.replace(/👑|📂|🎵/g, '').trim();
                    return cleanTitle.includes(genreText);
                });
                if (index !== -1) setSelectedShelfIndex(index);
                else setSelectedShelfIndex(1);
            }
        }
    }, [genreText, shelves]);

    // Search Query
    const searchQuery = useQuery({
        queryKey: ["youtube-search", debouncedTerm, searchMode],
        queryFn: () => fetchSearch(debouncedTerm, searchMode || 'karaoke'),
        enabled: isSearching,
        placeholderData: keepPreviousData
    });

    // Playlist Query
    const playlistQuery = useQuery({
        queryKey: ["youtube-playlist", activePlaylist?.id],
        queryFn: () => fetchPlaylist(activePlaylist!.id, activePlaylist!.type),
        enabled: !!activePlaylist && !!activePlaylist.id,
        staleTime: 1000 * 60 * 30
    });

    const searchResults: YTItem[] = searchQuery.data || [];
    const playlistItems: YTItem[] = playlistQuery.data?.items || [];

    // Back Button Logic exactly like SpotifyDashboard
    useEffect(() => {
        if (activePlaylist || isSearching) {
            useUIStore.getState().setBackAction(() => {
                if (activePlaylist) {
                    const { playlist, ...rest } = router.query;
                    router.push({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
                    setActivePlaylist(null);
                } else {
                    setSearchTerm("");
                }
            });
        } else {
            useUIStore.getState().setBackAction(null);
        }
    }, [activePlaylist, isSearching, router.query, setSearchTerm]);

    const handleItemClick = (item: YTItem) => {
        console.log("🎯 YouTubeDashboard: handleItemClick:", item);

        // Use ID fields according to what's available
        const targetId = item.playlistId || item.id;

        if (item.type === 'artist') {
            // Artist -> Trigger Search
            setSearchTerm(item.title);
            setActiveIndex(0);
            return;
        }

        if (item.type === 'playlist' || (item.type === 'video' && !item.id && item.playlistId)) {
            // Playlist -> Deep View
            setPlaylistInUrl({ ...item, id: targetId });
        } else {
            // Video -> Play
            const finalVideoId = item.videoId || item.id;
            if (!finalVideoId || finalVideoId.startsWith('artist-')) {
                // Fallback for artist items that might have been misclicked
                setSearchTerm(item.title);
                setActiveIndex(0);
                return;
            }

            addToQueue({
                id: finalVideoId,
                videoId: finalVideoId,
                title: item.title,
                author: item.subtitle || 'YouTube',
                sourceType: 'youtube',
                thumbnail: item.thumbnail,
                aiVocalRequested: searchMode === 'ai_karaoke' ? true : undefined
            } as any);
        }
    };

    // Spotify-style Card Renderer (Squared)
    const renderCard = (item: YTItem, index: number) => (
        <Fragment key={(item.id || item.title) + index}>
            <div
                className="group relative cursor-pointer overflow-hidden rounded-3xl shadow-sm hover:shadow-2xl hover:shadow-red-600/10 hover:-translate-y-1 transition-all duration-300 isolate bg-gray-100 w-full aspect-video"
                onClick={() => handleItemClick(item)}
            >
                <Image
                    src={item.thumbnail?.replace('w120-h120', 'w400-h400') || "/icon-cover.png"}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    alt={item.title}
                    unoptimized
                />
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity pointer-events-none" />

                {/* Play Hint */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-lg transform scale-50 group-hover:scale-100 transition-transform">
                        <svg className="w-5 h-5 text-white fill-current ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                </div>

                <div className="absolute inset-0 p-3 flex flex-col justify-end items-start z-10 pointer-events-none">
                    <h2 className="text-white font-bold text-[11px] sm:text-[12px] leading-tight line-clamp-2 drop-shadow-md transform translate-y-0.5 group-hover:translate-y-0 transition-transform">
                        {item.title}
                    </h2>
                    {item.subtitle && (
                        <p className="text-[9px] text-gray-300 truncate mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.subtitle}
                        </p>
                    )}
                </div>
            </div>
        </Fragment>
    );

    return (
        <>
            {isSearching ? (
                <div className="col-span-full animate-in fade-in duration-300">
                    <div className="bg-white/80 backdrop-blur-md px-4 py-4 border-b border-gray-100 sticky top-0 z-40 flex items-center gap-4 -mx-2">
                        <button onClick={() => setSearchTerm("")} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5 text-black" />
                        </button>
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">ค้นหาใน YouTube</p>
                            <h2 className="text-base font-black text-black line-clamp-1">"{searchTerm}"</h2>
                        </div>
                    </div>

                    <div className="p-2 grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                        {searchQuery.isLoading ? (
                            Array.from({ length: 10 }).map((_, i) => (
                                <div key={i} className="aspect-video rounded-3xl bg-gray-100 animate-pulse" />
                            ))
                        ) : (
                            searchResults.map((item, i) => renderCard(item, i))
                        )}
                    </div>
                </div>
            ) : activePlaylist ? (
                <div className="col-span-full animate-in slide-in-from-right duration-300">
                    <div className="bg-white/80 backdrop-blur-md px-4 py-4 border-b border-gray-100 sticky top-0 z-40 flex items-center gap-4 -mx-2">
                        <button onClick={() => {
                            const { playlist, ...rest } = router.query;
                            router.push({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
                            setActivePlaylist(null);
                        }} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5 text-black" />
                        </button>
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">เพลย์ลิสต์</p>
                            <h2 className="text-base font-black text-black line-clamp-1">{activePlaylist.title}</h2>
                        </div>
                    </div>

                    <div className="p-2 grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                        {playlistQuery.isLoading ? (
                            Array.from({ length: 10 }).map((_, i) => (
                                <div key={i} className="aspect-video rounded-3xl bg-gray-100 animate-pulse" />
                            ))
                        ) : (
                            playlistItems.map((item, i) => renderCard(item, i))
                        )}
                    </div>
                </div>
            ) : (
                <div className="col-span-full contents animate-in fade-in duration-500">
                    {/* 1. Artist Section (Curated from API) */}
                    <div className="col-span-full px-2 pt-2 pb-2 text-[13px] font-black text-black uppercase tracking-wider flex items-center gap-2">
                        ศิลปินยอดนิยม
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 col-span-full pb-6 px-2">
                        {(() => {
                            const artistShelf = shelves.find(s => s.title.includes('ศิลปิน'));
                            const artistItems = artistShelf?.items || [
                                { id: 'a1', title: 'Bodyslam', thumbnail: '/assets/avatar.jpeg', type: 'artist' },
                                { id: 'a2', title: 'Three Man Down', thumbnail: '/assets/avatar.jpeg', type: 'artist' },
                                { id: 'a3', title: 'Tilly Birds', thumbnail: '/assets/avatar.jpeg', type: 'artist' },
                                { id: 'a4', title: 'Paper Planes', thumbnail: '/assets/avatar.jpeg', type: 'artist' },
                                { id: 'a5', title: 'หนุ่ม กะลา', thumbnail: '/assets/avatar.jpeg', type: 'artist' }
                            ];
                            return artistItems.slice(0, 15).map((artist, i) => (
                                <Fragment key={artist.id + i}>
                                    <div
                                        className="group relative cursor-pointer overflow-hidden rounded-2xl shadow-sm hover:shadow-2xl hover:shadow-red-600/10 hover:-translate-y-1 transition-all duration-300 isolate bg-gray-100 w-full aspect-video"
                                        onClick={() => handleItemClick(artist)}
                                    >
                                        <Image
                                            src={artist.thumbnail || "/assets/avatar.jpeg"}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                                            alt={artist.title}
                                            unoptimized
                                        />
                                        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-lg transform scale-50 group-hover:scale-100 transition-transform">
                                                <svg className="w-5 h-5 text-white fill-current ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                            </div>
                                        </div>
                                        <div className="absolute inset-0 p-3 flex flex-col justify-end items-start z-10 pointer-events-none">
                                            <h2 className="text-white font-bold text-[11px] sm:text-[12px] leading-tight line-clamp-1 drop-shadow-md transform translate-y-0.5 group-hover:translate-y-0 transition-transform text-left">
                                                {artist.title}
                                            </h2>
                                        </div>
                                    </div>
                                </Fragment>
                            ));
                        })()}
                    </div>

                    {/* 2. Genre Section (Navigation) */}
                    <div className="col-span-full px-2 pt-4 pb-3 text-[13px] font-black text-black uppercase tracking-wider flex items-center gap-2 border-t border-gray-100 mt-2">
                        แนวเพลงยอดฮิต
                    </div>
                    <div className="col-span-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 px-2 pb-8">
                        {shelves.filter(s => !s.title.includes('ศิลปิน')).slice(0, 15).map((shelf, i) => {
                            const cleanTitle = shelf.title.replace(/👑|📂|🎵/g, '').trim();
                            const isSelected = genreText === cleanTitle || (genreText === "แนะนำ" && i === 0);
                            return (
                                <button
                                    key={shelf.title + i}
                                    onClick={() => setGenreInUrl(cleanTitle)}
                                    className={`w-full py-2 px-4 rounded-xl text-[12px] font-bold transition-all duration-300 border ${isSelected ? "bg-black text-white border-primary transform -translate-y-0.5 shadow-lg" : "bg-gray-100 text-black border-gray-100 hover:bg-white hover:border-red-600/30"}`}
                                >
                                    {cleanTitle}
                                </button>
                            );
                        })}
                    </div>

                    {/* 3. Content Shelf (Spotify Dashboard L303-372) */}
                    {shelves[selectedShelfIndex] && (
                        <div className="col-span-full contents">
                            <div className="col-span-full px-2 pt-4 pb-3 text-[11px] sm:text-[12px] font-black text-black uppercase tracking-wider flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-red-600 rounded-full"></div>
                                    <span>{shelves[selectedShelfIndex].title}</span>
                                </div>
                                <span className="text-[10px] font-normal text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">YouTube Music</span>
                            </div>
                            <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-4 pb-24">
                                {shelves[selectedShelfIndex].items.map((cat, i) => (
                                    <div
                                        key={cat.id + i}
                                        onClick={() => handleItemClick(cat)}
                                        className="relative w-full aspect-video rounded-3xl overflow-hidden cursor-pointer shadow-sm hover:shadow-2xl hover:shadow-red-600/10 transition-all duration-500 hover:-translate-y-1.5 group bg-gray-100"
                                    >
                                        <Image
                                            src={cat.thumbnail?.replace('w120-h120', 'w400-h400') || "/icon-cover.png"}
                                            alt={cat.title}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                                            unoptimized
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90 transition-opacity" />

                                        {/* Content Overlay */}
                                        <div className="absolute inset-0 p-6 flex flex-col justify-between">
                                            <div className="self-end opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-2 group-hover:translate-x-0">
                                                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                                                </div>
                                            </div>
                                            <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                                <span className="text-white font-bold text-[11px] sm:text-[12px] drop-shadow-md line-clamp-2 leading-tight">
                                                    {cat.title}
                                                </span>
                                                <div className="h-1 w-12 bg-red-600 rounded-full mt-2 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100 origin-left scale-x-0 group-hover:scale-x-100" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
