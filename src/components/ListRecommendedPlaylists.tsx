import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeftIcon, PlayIcon, ArrowPathIcon, FolderPlusIcon, MicrophoneIcon, MusicalNoteIcon } from "@heroicons/react/24/solid";
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
        const artist = (song.artist_name && song.artist_name !== "Unknown Artist") ? song.artist_name : "";
        const query = `${cleanTitle} ${artist}`.trim();
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-5 pb-32">
                    {isLoadTracks ? (
                        getSkeletonItems(10).map(i => (
                            <div key={i} className="aspect-video bg-gray-50 rounded-2xl animate-pulse" />
                        ))
                    ) : (
                        tracksData?.artist?.map((song: any, i: number) => (
                            <div 
                                key={i} 
                                onClick={() => handlePlaySong(song)} 
                                className="group cursor-pointer bg-white rounded-2xl border border-gray-100 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 flex flex-col h-full transition-all duration-300 active:scale-[0.98] overflow-hidden"
                            >
                                <div className="relative aspect-video flex-shrink-0 bg-gray-50">
                                    <Image 
                                        src={song.coverImageURL || "/icon-cover.png"} 
                                        fill 
                                        className="object-cover transition-transform duration-500 group-hover:scale-110" 
                                        unoptimized 
                                        alt={song.title || "Song Cover"} 
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                            <PlayIcon className="w-5 h-5 text-white ml-0.5" />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-3 flex-1 flex flex-col justify-center">
                                    <h3 className="font-bold text-[12px] sm:text-[13px] line-clamp-2 text-black leading-snug group-hover:text-primary transition-colors text-center">
                                        {song.title}
                                    </h3>
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
                <div className="space-y-12 p-6">
                    {[1, 2].map(i => (
                        <div key={i} className="space-y-4">
                            <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
                            <div className="flex gap-4 overflow-hidden">
                                {[1, 2, 3, 4, 5].map(j => (
                                    <div key={j} className="flex-shrink-0 w-[140px] sm:w-[180px] aspect-video bg-gray-50 rounded-2xl animate-pulse" />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-10 mt-4">
                    {genreShelves.map((shelf: any, i: number) => (
                        <div key={i} className="space-y-4">
                            <div className="px-5">
                                <h3 className="text-[14px] font-black text-black uppercase tracking-wider">{shelf.title}</h3>
                            </div>

                            <div className="flex overflow-x-auto gap-4 px-5 pb-4 no-scrollbar snap-x touch-pan-x w-full">
                                {shelf.items.map((item: any, j: number) => (
                                    <div 
                                        key={j} 
                                        onClick={() => {
                                            setSelectedPlaylist({ 
                                                tag_id: item.playlistId, 
                                                tag_name: item.title, 
                                                imageUrl: item.thumbnail 
                                            } as any);
                                            router.push({ pathname: router.pathname, query: { ...router.query, view: 'rec_playlist', id: item.playlistId || item.id } }, undefined, { shallow: true });
                                        }}
                                        className="flex-shrink-0 w-[140px] sm:w-[180px] group cursor-pointer snap-start"
                                    >
                                        <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-100 shadow-sm border border-gray-100 group-hover:shadow-xl transition-all duration-300">
                                            <Image 
                                                src={item.thumbnail?.replace('w120-h120', 'w400-h400') || "/icon-cover.png"} 
                                                fill 
                                                className="object-cover transition-transform duration-500 group-hover:scale-110" 
                                                unoptimized 
                                                alt={item.title || "Playlist Cover"} 
                                            />
                                            <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors" />
                                        </div>
                                        <div className="mt-2.5 px-1 text-center">
                                            <p className="text-[12px] font-bold text-black line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                                                {item.title}
                                            </p>
                                        </div>
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
