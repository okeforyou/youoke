import { useState, useEffect } from "react";
import { PlaylistService, CommunityPlaylist } from "../services/playlistService";
import PlaylistCard from "./CardV2";
import { getSkeletonItems } from "../utils/api";
import { useToast } from "@/context/ToastContext";
import { useAuthStore } from "@/modules/auth/useAuthStore";
import { TrophyIcon, FireIcon } from "@heroicons/react/24/solid";

interface ListCommunityPlaylistsProps {
    onPlay?: (playlist: any) => void;
}

export default function ListCommunityPlaylists({ onPlay }: ListCommunityPlaylistsProps) {
    const [playlists, setPlaylists] = useState<CommunityPlaylist[]>([]);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast() || { addToast: console.log };
    const { user } = useAuthStore();

    useEffect(() => {
        loadTopPlaylists();
    }, []);

    const loadTopPlaylists = async () => {
        setLoading(true);
        try {
            const data = await PlaylistService.getTopPlaylists(20);
            setPlaylists(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async (playlist: CommunityPlaylist) => {
        if (!user) {
            addToast("กรุณาเข้าสู่ระบบเพื่อกดถูกใจ", "error");
            return;
        }

        // Optimistic Update
        setPlaylists(prev => prev.map(p =>
            p.id === playlist.id ? { ...p, likes: (p.likes || 0) + 1 } : p
        ));

        try {
            await PlaylistService.likePlaylist({
                id: playlist.id,
                title: playlist.title,
                thumbnail: playlist.thumbnail,
                source: playlist.source,
                tracksCount: playlist.tracksCount
            }, user.uid || '');

            // No toast needed for like action, visual feedback is enough
            // addToast("Liked!");
        } catch (error) {
            console.error("Like failed", error);
            // Revert if failed
            setPlaylists(prev => prev.map(p =>
                p.id === playlist.id ? { ...p, likes: (p.likes || 1) - 1 } : p
            ));
        }
    };

    if (!loading && playlists.length === 0) return null;

    return (
        <div className="pb-10">
            <div className="px-6 pt-2 pb-6">
                <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    <FireIcon className="w-8 h-8 text-orange-500" />
                    ฮิตติดชาร์ต (Community Hits)
                </h2>
                <p className="text-gray-500 text-sm mt-1 ml-10">เพลย์ลิสต์ยอดนิยมจากเพื่อนๆ ในชุมชน YouOke</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10 px-6">
                {loading ? (
                    getSkeletonItems(5).map((i) => (
                        <div key={i} className="flex flex-col gap-3">
                            <div className="aspect-square w-full bg-gray-100 rounded-2xl animate-pulse"></div>
                            <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse"></div>
                        </div>
                    ))
                ) : (
                    playlists.map((pl, idx) => (
                        <div key={pl.id} className="relative group">
                            {/* Ranking Badge */}
                            {idx < 3 && (
                                <div className="absolute -top-3 -left-3 z-20 w-8 h-8 rounded-full flex items-center justify-center font-black text-white shadow-lg border-2 border-white scale-110"
                                    style={{ backgroundColor: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : '#CD7F32' }}>
                                    {idx + 1}
                                </div>
                            )}

                            <PlaylistCard
                                id={pl.id}
                                name={pl.title}
                                count={typeof pl.tracksCount === 'number' ? pl.tracksCount : 0}
                                thumbnail={pl.thumbnail}
                                videoId={''} // No direct video ID 
                                activeIndex={0} // Public Mode
                                isRecommended={false} // Enables buttons
                                onClick={() => onPlay && onPlay(pl)} // TODO: Handle Play
                                onLike={() => handleLike(pl)}
                            />

                            {/* Visual Like Count Overlay */}
                            <div className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <span className="text-pink-400">♥</span> {pl.likes}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
