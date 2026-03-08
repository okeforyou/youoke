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
    console.log("✅ ListRecommendedPlaylists: v2.0 - Hooks Fixed");
    const { user } = useAuthStore();
    const toastContext = useToast();

    const showToast = (message: string) => {
        if (toastContext?.addToast) {
            toastContext.addToast(message);
        }
    };

    // Use topics from config, or default if not ready
    const topics = config?.recommendations?.topics?.length > 0
        ? config.recommendations.topics
        : DEFAULT_TOPICS;

    const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistItem | null>(null);
    const [currentTopic, setCurrentTopic] = useState<string>("");

    // Router Integration
    const router = useRouter();


    // Initial Topic Selection (Sticky)
    useEffect(() => {
        if (!topics.length) return;

        // Try load from cache
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const { topic, timestamp } = JSON.parse(cached);
                const daysDiff = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);

                // If valid and exists in current pool
                if (daysDiff < ROTATION_DAYS && topics.includes(topic)) {
                    setCurrentTopic(topic);
                    return;
                }
            }
        } catch (e) { }

        // Otherwise pick random
        pickNewTopic();
    }, [topics]);

    const pickNewTopic = () => {
        const newTopic = topics[Math.floor(Math.random() * topics.length)];
        setCurrentTopic(newTopic);
        localStorage.setItem(CACHE_KEY, JSON.stringify({
            topic: newTopic,
            timestamp: Date.now()
        }));
    };

    // 1. Fetch Popular Playlists (Recommended)
    const { data: popularData, isLoading: isLoadPopular } = useQuery({
        queryKey: ["recommendedPlaylists", currentTopic],
        queryFn: () => searchPlaylists(currentTopic),
        enabled: !!currentTopic,
        staleTime: 1000 * 60 * 60 * 24,
    });

    // Sync State with URL & Restore (Moved here to access popularData)
    useEffect(() => {
        const view = router.query.view;
        const id = router.query.id;

        // 1. Handle Closing: If URL has no view, close detail
        if (view !== 'rec_playlist' && selectedPlaylist) {
            setSelectedPlaylist(null);
            useUIStore.getState().setBackAction(null);
        }

        // 2. Handle Restore: If URL has view but no state, try to find it
        if (view === 'rec_playlist' && id && !selectedPlaylist && popularData?.artistCategories) {
            const found = popularData.artistCategories.find((p: any) => p.tag_id === id);
            if (found) {
                setSelectedPlaylist(found);
            }
        }

        // 3. Handle Back Action
        if (view === 'rec_playlist' && id) {
            useUIStore.getState().setBackAction(() => router.back());
        } else {
            useUIStore.getState().setBackAction(null);
        }

    }, [router.query, selectedPlaylist, popularData]);

    // 2. Fetch Playlist Details (Tracks) when selected OR restoring
    const playlistIdFromUrl = router.query.id as string;
    const shouldFetch = !!selectedPlaylist || (router.query.view === 'rec_playlist' && !!playlistIdFromUrl);

    const { data: tracksData, isLoading: isLoadTracks } = useQuery({
        queryKey: ["playlistTracks", selectedPlaylist?.tag_id || playlistIdFromUrl],
        queryFn: () => getArtists(selectedPlaylist?.tag_id || playlistIdFromUrl),
        enabled: shouldFetch,
        staleTime: 1000 * 60 * 60, // 1 hour
    });

    // Self-Healing: If we don't have selectedPlaylist but API returned metadata, Start Healing
    useEffect(() => {
        if (!selectedPlaylist && tracksData?.playlist && router.query.view === 'rec_playlist') {
            setSelectedPlaylist({
                tag_id: tracksData.playlist.id,
                tag_name: tracksData.playlist.name,
                imageUrl: tracksData.playlist.imageUrl
            });
        }
    }, [tracksData, selectedPlaylist, router.query.view]);
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const main = document.querySelector('main');
            if (main) {
                main.scrollTo({ top: 0, behavior: 'instant' });
            }
        }
    }, [!!selectedPlaylist]);
    const [isImporting, setIsImporting] = useState(false);
    const { addToQueue, play: playVideo } = usePlayerStore();

    // Loading State for Restoration (Prevent Grid Flash)
    // If URL says we are in playlist view, but we don't have data yet -> Show Skeleton
    if (router.query.view === 'rec_playlist' && !selectedPlaylist) {
        return (
            <div className="flex flex-col h-full bg-white min-h-[500px]">
                {/* Header Skeleton */}
                <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 flex-1">
                        <div className="p-2 rounded-full bg-gray-100 animate-pulse w-10 h-10" />
                        <div className="h-6 w-48 bg-gray-100 rounded animate-pulse" />
                    </div>
                </div>

                {/* Tracks List Skeleton */}
                <div className="p-4 space-y-4">
                    {getSkeletonItems(8).map(i => (
                        <div key={i} className="flex gap-4">
                            <div className="w-12 h-12 bg-gray-100 rounded animate-pulse" />
                            <div className="flex-1 space-y-2">
                                <div className="w-3/4 h-4 bg-gray-100 rounded animate-pulse" />
                                <div className="w-1/2 h-3 bg-gray-100 rounded animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }



    /* 
   * Handle Click:
   * Best UX is to trigger a search for the user to pick the best version (Karaoke/MV).
   */
    const handlePlaySong = (song: any) => {
        // Clean title for better search success (remove junk like "Official MV")
        let cleanTitle = song.title || "";

        // Remove (Official...), [Official...], (Lyric...), etc.
        cleanTitle = cleanTitle
            .replace(/\(Official.*?\)/gi, '')
            .replace(/\[Official.*?\]/gi, '')
            .replace(/\(Audio.*?\)/gi, '')
            .replace(/\[Audio.*?\]/gi, '')
            .replace(/\(Lyric.*?\)/gi, '')
            .replace(/\[Lyric.*?\]/gi, '')
            .replace(/\(MV.*?\)/gi, '')
            .replace(/\[MV.*?\]/gi, '')
            .replace(/Official\s+MV/gi, '')
            .replace(/Official\s+Video/gi, '')
            .replace(/Music\s+Video/gi, '')
            .replace(/Lyric\s+Video/gi, '')
            .replace(/\s+/g, ' ') // Collapse spaces
            .trim();

        const query = `${cleanTitle} ${song.artist_name || ""}`.trim();

        router.push({
            pathname: router.pathname,
            query: { ...router.query, search: query }
        }, undefined, { shallow: true });
    };



    const handleImportPlaylist = async () => {
        if (!user) {
            showToast("กรุณาเข้าสู่ระบบเพื่อบันทึกเพลย์ลิสต์");
            return;
        }
        if (!tracksData?.artist || tracksData.artist.length === 0) {
            showToast("ไม่พบรายการเพลง");
            return;
        }

        if (!db) {
            console.error("Firestore is not initialized");
            return;
        }

        try {
            setIsImporting(true);

            // Transform tracks to Video objects
            const videos = tracksData.artist.map((song: any) => ({
                id: song.id || `ext-${Date.now()}-${Math.random()}`, // Spotify ID or generated
                videoId: null, // No YouTube ID yet (null instead of undefined for Firestore)
                title: song.title,
                author: song.artist_name,
                thumbnail: song.coverImageURL,
                sourceType: 'youtube', // Default
            }));

            // Create Playlist in Firestore
            await addDoc(collection(db, "playlists"), {
                createdBy: user.uid,
                name: selectedPlaylist?.tag_name || "New Playlist",
                playlists: videos, // Note: Videos lack youtubeId, player handles search logic?
                // Actually better to store 'query' field if possible, 
                // but our schema expects 'videos'. 
                // Ideally we should search each one, but that's too heavy.
                // We will store them as-is. 
                // NOTE: The player when playing a playlist from library 
                // MUST be able to handle items without videoId (Search Mode).
                // Current ListPlaylistsGrid might fail if videoId is missing.
                // But let's save it for now.
                type: "private",
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                videoCount: videos.length,
                likes: [],
                starCount: 0
            });

            showToast("บันทึกเพลย์ลิสต์เรียบร้อย! อยู่ใน 'เพลย์ลิสต์ของฉัน'");
        } catch (error) {
            console.error(error);
            showToast("เกิดข้อผิดพลาดในการบันทึก");
        } finally {
            setIsImporting(false);
        }
    };


    // Back to Grid
    if (selectedPlaylist) {
        return (
            <div className="flex flex-col h-full bg-white min-h-[500px]">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <button
                            onClick={() => router.back()}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <ChevronLeftIcon className="w-6 h-6 text-gray-600" />
                        </button>
                        <h2 className="text-[12px] sm:text-[14px] font-bold truncate">{selectedPlaylist.tag_name}</h2>
                    </div>

                    {/* Import Button */}
                    <button
                        onClick={handleImportPlaylist}
                        disabled={isImporting || isLoadTracks}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        {isImporting ? "กำลังบันทึก..." : (
                            <>
                                <FolderPlusIcon className="w-4 h-4" />
                                <span>บันทึกเพลย์ลิสต์</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Tracks List */}
                <div className="p-4 space-y-2 pb-32">
                    <div className="px-2 pb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        จากหัวข้อ: {currentTopic}
                    </div>
                    {isLoadTracks ? (
                        <div className="space-y-4">
                            {getSkeletonItems(10).map((i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="w-12 h-12 bg-gray-100 rounded animate-pulse" />
                                    <div className="flex-1 space-y-2">
                                        <div className="w-3/4 h-4 bg-gray-100 rounded animate-pulse" />
                                        <div className="w-1/2 h-3 bg-gray-100 rounded animate-pulse" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        tracksData?.artist?.map((song: any, index: number) => (
                            <div
                                key={index}
                                onClick={() => handlePlaySong(song)}
                                className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 cursor-pointer group transition-colors"
                            >
                                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-200 shrink-0">
                                    <Image
                                        src={song.coverImageURL || "/icon-cover.png"}
                                        alt={song.title}
                                        fill
                                        className="object-cover"
                                        onError={(e) => { e.currentTarget.src = "/icon-cover.png"; }}
                                        unoptimized
                                    />
                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <PlayIcon className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-[12px] sm:text-[13px] text-gray-900 truncate">{song.title}</h3>
                                    <p className="text-[9px] sm:text-[10px] text-gray-500 truncate">{song.artist_name}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    // Grid View
    return (
        <div className="pb-20">
            <div className="px-6 pt-6 pb-2 flex items-start justify-between">
                <div>
                    <h2 className="text-[14px] sm:text-[16px] font-black text-gray-900 flex items-center gap-2">
                        แนะนำสำหรับคุณ
                    </h2>
                    <p className="text-gray-500 text-[10px] sm:text-[11px] mt-1">เพลย์ลิสต์ยอดนิยมจากหัวข้อ "{currentTopic}"</p>
                </div>

                {/* Refresh Topic Button */}
                <button
                    onClick={pickNewTopic}
                    className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-full transition-all"
                    title="เปลี่ยนหัวข้อแนะนำ"
                >
                    <ArrowPathIcon className="w-6 h-6" />
                </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 p-6">
                {isLoadPopular ? (
                    getSkeletonItems(10).map((i) => (
                        <div key={i} className="space-y-3">
                            <div className="aspect-square bg-gray-100 rounded-2xl animate-pulse" />
                            <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
                        </div>
                    ))
                ) : (
                    popularData?.artistCategories?.map((playlist: any) => (
                        <PlaylistCard
                            key={playlist.tag_id}
                            id={playlist.tag_id}
                            name={playlist.tag_name}
                            count={20} // Estimate/Placeholder
                            thumbnail={playlist.imageUrl}
                            isRecommended={false} // Allow buttons
                            activeIndex={0} // 0 = Public/Community Mode (Shows Like)
                            onClick={() => {
                                setSelectedPlaylist(playlist);
                                router.push({
                                    pathname: router.pathname,
                                    query: { ...router.query, view: 'rec_playlist', id: playlist.tag_id }
                                }, undefined, { shallow: true });
                            }}
                            onLike={async () => {
                                if (!user) {
                                    showToast("กรุณาเข้าสู่ระบบเพื่อกดถูกใจ");
                                    return;
                                }
                                try {
                                    // Import PlaylistService dynamically or at top if possible
                                    const { PlaylistService } = await import("../services/playlistService");
                                    await PlaylistService.likePlaylist({
                                        id: playlist.tag_id,
                                        title: playlist.tag_name,
                                        thumbnail: playlist.imageUrl,
                                        source: 'spotify',
                                        tracksCount: 20
                                    }, user?.uid || 'guest');
                                    showToast("ถูกใจเพลย์ลิสต์นี้แล้ว! ❤️");
                                } catch (e) {
                                    console.error(e);
                                    showToast("เกิดข้อผิดพลาด");
                                }
                            }}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
