import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeftIcon, PlayIcon, ArrowPathIcon, FolderPlusIcon } from "@heroicons/react/24/solid";
import { searchPlaylists, getArtists, getSkeletonItems } from "../utils/api";
import { usePlayerStore } from "../modules/player/stores/usePlayerStore";
import { Video } from "../modules/player/types";
import { useSystemConfig } from "../hooks/useSystemConfig";
import { useAuthStore } from "@/modules/auth/useAuthStore";
import { db } from "../firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { apiClient } from "../lib/api-client";
import { useToast } from "@/context/ToastContext";
import PlaylistCard from "./StandardPlaylistCard";
import { useUIStore } from "../stores/useUIStore";

// Types for Playlist Item
interface PlaylistItem {
    tag_id: string; // Used as ID
    tag_name: string;
    imageUrl: string;
}

const CACHE_KEY = 'youoke_rec_topic';
const ROTATION_DAYS = 3;

// Default topics fallback (in case config is loading)
const DEFAULT_TOPICS = [
    "Thailand Top 50",
    "เพลงฮิต TikTok",
    "ลูกทุ่งมาแรง"
];

export default function ListRecommendedPlaylists() {
    const { config } = useSystemConfig();
    const router = useRouter();
    const { user } = useAuthStore();
    const toastContext = useToast();
    const { searchTerm, setSearchTerm } = usePlayerStore();

    const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistItem | null>(null);
    const [isImporting, setIsImporting] = useState(false);

    // 1. Fetch Curated Data from Explore API (Cached YouTube Music Data)
    const { data: exploreData, isLoading: isLoadExplore } = useQuery({
        queryKey: ["explore-rec"],
        queryFn: async () => {
            const { data } = await apiClient.get("/api/explore");
            return data;
        },
        staleTime: 1000 * 60 * 30, // 30 minutes
    });

    const shelves = exploreData?.data || [];
    const genreShelves = shelves.filter((s: any) => !s.title.includes('ศิลปิน'));

    // 2. Existing Detail View Logic (Restoration & URL Sync)
    useEffect(() => {
        const view = router.query.view;
        const id = router.query.id;

        if (view !== 'rec_playlist' && selectedPlaylist) {
            setSelectedPlaylist(null);
            useUIStore.getState().setBackAction(null);
        }

        if (view === 'rec_playlist' && id && !selectedPlaylist) {
            // Try to find in any shelf
            for (const shelf of shelves) {
                const found = shelf.items.find((p: any) => p.playlistId === id || p.id === id);
                if (found) {
                    setSelectedPlaylist({
                        tag_id: found.playlistId || found.id,
                        tag_name: found.title,
                        imageUrl: found.thumbnail
                    });
                    break;
                }
            }
        }

        if (view === 'rec_playlist' && id) {
            useUIStore.getState().setBackAction(() => router.back());
        } else {
            useUIStore.getState().setBackAction(null);
        }
    }, [router.query, selectedPlaylist, shelves]);

    // 3. Fetch Playlist Detail
    const playlistIdFromUrl = router.query.id as string;
    const shouldFetch = !!selectedPlaylist || (router.query.view === 'rec_playlist' && !!playlistIdFromUrl);

    const { data: tracksData, isLoading: isLoadTracks } = useQuery({
        queryKey: ["playlistTracks", selectedPlaylist?.tag_id || playlistIdFromUrl],
        queryFn: () => getArtists(selectedPlaylist?.tag_id || playlistIdFromUrl),
        enabled: shouldFetch,
        staleTime: 1000 * 60 * 60,
    });

    // Helper functions
    const showToast = (message: string) => toastContext?.addToast && toastContext.addToast(message);
    
    const handlePlaySong = (song: any) => {
        let cleanTitle = song.title || "";
        cleanTitle = cleanTitle.replace(/\(Official.*?\)/gi, '').replace(/\[Official.*?\]/gi, '').trim();
        const query = `${cleanTitle} ${song.artist_name || ""}`.trim();
        setSearchTerm(query);
        router.push({ pathname: '/', query: { search: query } });
    };

    const handleImportPlaylist = async () => {
        if (!user) return showToast("กรุณาเข้าสู่ระบบเพื่อบันทึกเพลย์ลิสต์");
        if (!tracksData?.artist?.length) return showToast("ไม่พบรายการเพลง");
        try {
            if (!db) return showToast("ระบบฐานข้อมูลไม่พร้อมใช้งาน");
            setIsImporting(true);
            const videos = tracksData.artist.map((song: any) => ({
                id: song.id || `ext-${Date.now()}`,
                videoId: null, title: song.title, author: song.artist_name,
                thumbnail: song.coverImageURL, sourceType: 'youtube',
            }));
            await addDoc(collection(db, "playlists"), {
                createdBy: user.uid, name: selectedPlaylist?.tag_name || "New Playlist",
                playlists: videos, type: "private", createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(), videoCount: videos.length, starCount: 0, likes: []
            });
            showToast("บันทึกเพลย์ลิสต์เรียบร้อย!");
        } catch (e) { showToast("เกิดข้อผิดพลาด"); } finally { setIsImporting(false); }
    };

    // --- RENDER LOGIC ---

    // A. Detail View
    if (selectedPlaylist) {
        return (
            <div className="flex flex-col h-full bg-white min-h-[500px] animate-in slide-in-from-right duration-300">
                <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-100"><ChevronLeftIcon className="w-6 h-6 text-gray-600" /></button>
                        <h2 className="text-[14px] font-bold text-black truncate">{selectedPlaylist.tag_name}</h2>
                    </div>
                    <button onClick={handleImportPlaylist} disabled={isImporting} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full text-sm font-medium disabled:opacity-50">
                        <FolderPlusIcon className="w-4 h-4" /> <span>{isImporting ? "กำลังบันทึก..." : "บันทึกลิสต์"}</span>
                    </button>
                </div>
                <div className="p-4 space-y-2 pb-32">
                    {isLoadTracks ? (
                        getSkeletonItems(8).map(i => <div key={i} className="flex gap-4 h-12 bg-gray-50 rounded-xl animate-pulse" />)
                    ) : (
                        tracksData?.artist?.map((song: any, i: number) => (
                            <div key={i} onClick={() => handlePlaySong(song)} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 cursor-pointer group">
                                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                    <Image src={song.coverImageURL || "/icon-cover.png"} fill className="object-cover" unoptimized alt={song.title || "Song Cover"} />
                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100"><PlayIcon className="w-6 h-6 text-white" /></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-[13px] text-gray-900 truncate">{song.title}</h3>
                                    <p className="text-[10px] text-gray-500 truncate">{song.artist_name}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    // B. Discovery View (Main Recommended Hub)
    return (
        <div className="pb-24 animate-in fade-in duration-500">
            <div className="px-6 pt-6 pb-2">
                <h2 className="text-[18px] font-black text-black tracking-tight">เมนูแนะนำสำหรับคุณ</h2>
                <p className="text-gray-500 text-[11px] mt-1">เพลย์ลิสต์ที่จัดสรรมาเพื่อคุณโดยเฉพาะ อัพเดทรายสัปดาห์</p>
            </div>

            {isLoadExplore ? (
                <div className="space-y-8 p-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="space-y-4">
                            <div className="h-6 w-32 bg-gray-100 rounded animate-pulse" />
                            <div className="flex gap-4 overflow-hidden"><div className="w-48 h-48 bg-gray-100 rounded-2xl animate-pulse" /></div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-10 mt-4">
                    {genreShelves.map((shelf: any, i: number) => (
                        <div key={i} className="space-y-4">
                            <div className="px-6 flex items-center justify-between">
                                <h3 className="text-[14px] font-black text-black uppercase tracking-wider flex items-center gap-2">
                                    <span className={`w-1.5 h-5 rounded-full ${shelf.mode === 'listening' ? 'bg-blue-500' : 'bg-primary'}`} />
                                    {shelf.title}
                                </h3>
                                {shelf.mode === 'listening' && (
                                    <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                                        โหมดฟังนิ่งๆ
                                    </span>
                                )}
                            </div>

                            <div className="flex overflow-x-auto gap-4 px-6 pb-4 no-scrollbar snap-x scroll-smooth">
                                {shelf.items.map((item: any, j: number) => (
                                    <div 
                                        key={j} 
                                        onClick={() => {
                                            setSelectedPlaylist({ 
                                                tag_id: item.playlistId, 
                                                tag_name: item.title, 
                                                imageUrl: item.thumbnail,
                                                isLongPlay: item.isLongPlay 
                                            } as any);
                                            router.push({ pathname: router.pathname, query: { ...router.query, view: 'rec_playlist', id: item.playlistId || item.id } }, undefined, { shallow: true });
                                        }}
                                        className="flex-shrink-0 w-[160px] sm:w-[200px] group cursor-pointer snap-start"
                                    >
                                        <div className={`relative aspect-square rounded-3xl overflow-hidden bg-gray-100 shadow-sm border border-gray-100 group-hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-1 ${item.isLongPlay ? 'group-hover:shadow-blue-500/10' : 'group-hover:shadow-primary/10'}`}>
                                            <Image src={item.thumbnail?.replace('w120-h120', 'w400-h400') || "/icon-cover.png"} fill className="object-cover transition-transform duration-700 group-hover:scale-105" unoptimized alt={item.title || "Playlist Cover"} />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-60" />
                                            
                                            {/* Badge Overlay */}
                                            <div className="absolute top-3 left-3 flex gap-1">
                                                {item.isLongPlay ? (
                                                    <div className="bg-blue-600/90 backdrop-blur-md text-white p-1.5 rounded-xl shadow-lg">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                                                    </div>
                                                ) : (
                                                    <div className="bg-primary/90 backdrop-blur-md text-white p-1.5 rounded-xl shadow-lg">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-xl scale-75 group-hover:scale-100 transition-transform">
                                                    <PlayIcon className="w-6 h-6 text-white" />
                                                </div>
                                            </div>
                                            <div className="absolute inset-x-0 bottom-0 p-4">
                                                <p className="text-white font-bold text-[12px] line-clamp-2 drop-shadow-lg leading-tight">{item.title}</p>
                                            </div>
                                        </div>
                                        <p className="mt-2 text-[10px] text-gray-400 font-medium px-1 truncate">{item.subtitle}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
