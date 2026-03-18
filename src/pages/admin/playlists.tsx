import Head from "next/head";
import { useEffect, useState, useCallback } from "react";
import AdminLayout from '@/features/admin/layouts/AdminLayout';
import { PlaylistService, CommunityPlaylist } from "../../services/playlistService";
import { 
    Trash2, RefreshCw, BadgeCheck, Music, Search, 
    ExternalLink, CheckCircle2, AlertCircle, PlayCircle,
    Info, LayoutGrid, List, Heart, Plus, Loader2, Users
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import axios from "axios";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface SpotifyAccount {
    status: 'connected' | 'disconnected' | 'error';
    user?: {
        display_name: string;
        id: string;
        images?: { url: string }[];
        product: string;
    };
    error?: string;
}

export default function AdminPlaylists() {
    const [activeTab, setActiveTab] = useState<'community' | 'spotify' | 'search' | 'members'>('community');
    const [playlists, setPlaylists] = useState<CommunityPlaylist[]>([]);
    const [memberPlaylists, setMemberPlaylists] = useState<CommunityPlaylist[]>([]);
    const [spotifyPlaylists, setSpotifyPlaylists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [spotifyAccount, setSpotifyAccount] = useState<SpotifyAccount | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    
    // View Tracks Modal
    const [viewingPlaylist, setViewingPlaylist] = useState<any | null>(null);
    const [tracks, setTracks] = useState<any[]>([]);
    const [tracksLoading, setTracksLoading] = useState(false);

    const { addToast } = useToast() || { addToast: console.log };

    const fetchCommunityPlaylists = async () => {
        setLoading(true);
        try {
            const data = await PlaylistService.getAllPlaylists();
            setPlaylists(data);
        } catch (error) {
            console.error(error);
            addToast("Failed to fetch community playlists", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchMemberPlaylists = async () => {
        setLoading(true);
        try {
            const data = await PlaylistService.getUserPlaylists();
            setMemberPlaylists(data);
        } catch (error) {
            console.error(error);
            addToast("Failed to fetch member playlists", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchSpotifyStatus = async () => {
        try {
            const res = await axios.get("/api/spotify/account");
            setSpotifyAccount(res.data);
        } catch (error) {
            setSpotifyAccount({ status: 'error', error: 'Failed to reach API' });
        }
    };

    const fetchMySpotifyPlaylists = async () => {
        if (!spotifyAccount || spotifyAccount.status !== 'connected') return;
        setLoading(true);
        try {
            const res = await axios.get("/api/spotify/user-playlists");
            setSpotifyPlaylists(res.data.items || []);
        } catch (error) {
            addToast("Failed to fetch your Spotify playlists", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCommunityPlaylists();
        fetchSpotifyStatus();
        fetchMemberPlaylists();
    }, []);

    useEffect(() => {
        if (activeTab === 'community') fetchCommunityPlaylists();
        if (activeTab === 'spotify') fetchMySpotifyPlaylists();
        if (activeTab === 'members') fetchMemberPlaylists();
    }, [activeTab]);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!searchTerm.trim()) return;
        setSearching(true);
        try {
            const res = await axios.get(`/api/spotify/search-playlist?query=${encodeURIComponent(searchTerm)}`);
            // Format from search-playlist API is { status, artistCategories: [{ tag_id, tag_name, imageUrl }] }
            setSearchResults(res.data.artistCategories || []);
        } catch (error) {
            addToast("Search failed", "error");
        } finally {
            setSearching(false);
        }
    };

    const handleDelete = async (id: string, isMember = false) => {
        if (!confirm(`Are you sure you want to delete this ${isMember ? 'member' : 'community'} playlist?`)) return;
        try {
            if (isMember) {
                await PlaylistService.deleteUserPlaylist(id);
                setMemberPlaylists(prev => prev.filter(p => p.id !== id));
            } else {
                await PlaylistService.deletePlaylist(id);
                setPlaylists(prev => prev.filter(p => p.id !== id));
            }
            addToast("Playlist removed", "success");
        } catch (error) {
            addToast("Failed to delete", "error");
        }
    };

    const handleToggleOfficial = async (p: any, current: boolean) => {
        try {
            // Check if it's already in community playlists or needs to be added (Import)
            const isExisting = playlists.some(cp => cp.id === (p.id || p.tag_id));
            
            if (!isExisting) {
                // Import first
                await PlaylistService.likePlaylist({
                    id: p.id || p.tag_id,
                    title: p.name || p.tag_name,
                    thumbnail: p.images?.[0]?.url || p.imageUrl || "",
                    source: 'spotify',
                    tracksCount: p.tracks?.total || 0
                }, "admin");
            }

            await PlaylistService.toggleOfficial(p.id || p.tag_id, !current);
            addToast(current ? "Unmarked as Official" : "Marked as Official Account", "success");
            
            // Refresh
            fetchCommunityPlaylists();
        } catch (error) {
            addToast("Failed to update status", "error");
        }
    };

    const viewTracks = async (p: any) => {
        const id = p.id || p.tag_id;
        const formattedId = id.startsWith('sp-') ? id : `sp-${id}`;
        setViewingPlaylist(p);
        setTracks([]);
        setTracksLoading(true);
        try {
            const res = await axios.get(`/api/playlist/${formattedId}`);
            setTracks(res.data.videos || []);
        } catch (error) {
            addToast("Failed to load tracks", "error");
        } finally {
            setTracksLoading(false);
        }
    };

    return (
        <AdminLayout>
            <Head>
                <title>YouOke Admin | Playlists</title>
            </Head>

            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3.5 bg-indigo-600 rounded-[20px] shadow-lg shadow-indigo-200">
                            <PlayCircle className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">จัดการเพลย์ลิสต์</h1>
                            <p className="text-gray-500 font-medium">จัดการรายการเพลงและคอนเทนต์ Official ของระบบ</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                         <button 
                            onClick={activeTab === 'community' ? fetchCommunityPlaylists : activeTab === 'members' ? fetchMemberPlaylists : fetchMySpotifyPlaylists}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-2xl font-bold text-sm text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
                         >
                            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                            รีเฟรชข้อมูล
                        </button>
                    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all ${
                        spotifyAccount?.status === 'connected' 
                            ? "bg-emerald-50 border-emerald-100 text-emerald-700" 
                            : "bg-amber-50 border-amber-100 text-amber-700"
                    }`}>
                        {spotifyAccount?.status === 'connected' ? (
                            <>
                                <div className="relative w-7 h-7 rounded-full overflow-hidden border-2 border-emerald-200">
                                    <img src={spotifyAccount.user?.images?.[0]?.url || "https://placehold.co/100?text=S"} alt="" className="object-cover" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold leading-tight">{spotifyAccount.user?.display_name}</span>
                                    <span className="text-[10px] font-medium opacity-70 uppercase tracking-widest">Connected</span>
                                </div>
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-1" />
                            </>
                        ) : (
                            <>
                                <AlertCircle className="w-5 h-5" />
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold leading-tight">Spotify Disconnected</span>
                                    <span className="text-[10px] font-medium opacity-70">Check Integration Settings</span>
                                </div>
                                <RefreshCw className="w-4 h-4 cursor-pointer hover:rotate-180 transition-transform" onClick={fetchSpotifyStatus} />
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs & Search */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 p-1.5 bg-gray-100/80 rounded-[24px] backdrop-blur-sm border border-gray-200/50">
                    <div className="flex gap-1 w-full md:w-auto">
                        {[
                            { id: 'community', label: 'Community', icon: Heart },
                            { id: 'members', label: 'Members', icon: Users },
                            { id: 'spotify', label: 'My Spotify', icon: Music },
                            { id: 'search', label: 'Search All', icon: Search }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300 ${
                                    activeTab === tab.id 
                                        ? "bg-white text-indigo-600 shadow-md translate-y-[-1px]" 
                                        : "text-gray-500 hover:bg-white/50 hover:text-gray-900"
                                }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'search' && (
                        <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-[400px] mr-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search Spotify Playlists..." 
                                    className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm font-medium"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button 
                                type="submit"
                                disabled={searching}
                                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "ค้นหา"}
                            </button>
                        </form>
                    )}

                    {activeTab === 'community' && (
                        <button 
                            onClick={fetchCommunityPlaylists}
                            className="mr-3 p-2.5 text-gray-400 hover:text-indigo-600 transition-colors"
                            title="Refresh Data"
                        >
                            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
                        </button>
                    )}
                </div>

                {/* Content Area */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {activeTab === 'community' && (
                        loading ? (
                            Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="bg-white rounded-[32px] p-4 h-[300px] animate-pulse border border-gray-100" />
                            ))
                        ) : playlists.length === 0 ? (
                            <div className="col-span-full py-20 text-center">
                                <div className="inline-flex p-6 bg-gray-50 rounded-full mb-4">
                                    <Music className="w-12 h-12 text-gray-300" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-400">ยังไม่มีเพลย์ลิสต์ในระบบ (Community)</h3>
                                <p className="text-gray-400 mt-2">เริ่มเพิ่มโดยการค้นหาจาก Spotify หรือเช็คในหน้า My Spotify</p>
                            </div>
                        ) : (
                            playlists.map((playlist) => (
                                <PlaylistCard 
                                    key={playlist.id} 
                                    playlist={playlist} 
                                    onDelete={() => handleDelete(playlist.id)}
                                    onToggleOfficial={() => handleToggleOfficial(playlist, !!playlist.isOfficial)}
                                    onViewTracks={() => viewTracks(playlist)}
                                />
                            ))
                        )
                    )}

                    {activeTab === 'members' && (
                        loading ? (
                            Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="bg-white rounded-[32px] p-4 h-[300px] animate-pulse border border-gray-100" />
                            ))
                        ) : memberPlaylists.length === 0 ? (
                            <div className="col-span-full py-20 text-center">
                                <div className="inline-flex p-6 bg-gray-50 rounded-full mb-4">
                                    <Users className="w-12 h-12 text-gray-300" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-400">ยังไม่มีเพลย์ลิสต์จากสมาชิก</h3>
                                <p className="text-gray-400 mt-2">เพลย์ลิสต์ที่สมาชิกสร้างขึ้นเองจะมาแสดงที่นี่</p>
                            </div>
                        ) : (
                            memberPlaylists.map((playlist) => (
                                <PlaylistCard 
                                    key={playlist.id} 
                                    playlist={playlist} 
                                    isMember={true}
                                    onDelete={() => handleDelete(playlist.id, true)}
                                    onToggleOfficial={() => handleToggleOfficial(playlist, !!playlist.isOfficial)}
                                    onViewTracks={() => viewTracks(playlist)}
                                />
                            ))
                        )
                    )}

                    {activeTab === 'spotify' && (
                        loading ? (
                            Array.from({ length: 8 }).map((_, i) => <div key={i} className="bg-white rounded-[32px] p-4 h-[300px] animate-pulse border border-gray-100" />)
                        ) : spotifyAccount?.status !== 'connected' ? (
                            <div className="col-span-full py-20 text-center">
                                <AlertCircle className="w-16 h-16 text-amber-300 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-400">Spotify ยังไม่ได้เชื่อมต่อ</h3>
                                <p className="text-gray-400 mt-2">กรุณาตั้งค่า Client ID และ Secret ในหน้าการตั้งค่าระบบ</p>
                            </div>
                        ) : spotifyPlaylists.length === 0 ? (
                            <div className="col-span-full py-20 text-center">
                                <Music className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-400">ไม่พบเพลย์ลิสต์ในบัญชีคุณ</h3>
                            </div>
                        ) : (
                            spotifyPlaylists.map((p) => (
                                <SpotifyItemCard 
                                    key={p.id} 
                                    p={p} 
                                    isImported={playlists.some(cp => cp.id === p.id)}
                                    onToggleOfficial={() => handleToggleOfficial(p, playlists.find(cp => cp.id === p.id)?.isOfficial || false)}
                                    onViewTracks={() => viewTracks(p)}
                                />
                            ))
                        )
                    )}

                    {activeTab === 'search' && (
                        searching ? (
                            Array.from({ length: 8 }).map((_, i) => <div key={i} className="bg-white rounded-[32px] p-4 h-[300px] animate-pulse border border-gray-100" />)
                        ) : searchResults.length === 0 ? (
                            <div className="col-span-full py-20 text-center">
                                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-400">ค้นหาเพลงและเพลย์ลิสต์จาก Spotify</h3>
                            </div>
                        ) : (
                            searchResults.map((p) => (
                                <SpotifyItemCard 
                                    key={p.tag_id} 
                                    p={p} 
                                    isImported={playlists.some(cp => cp.id === p.tag_id)}
                                    onToggleOfficial={() => handleToggleOfficial(p, playlists.find(cp => cp.id === p.tag_id)?.isOfficial || false)}
                                    onViewTracks={() => viewTracks(p)}
                                />
                            ))
                        )
                    )}
                </div>
            </div>

            {/* View Tracks Modal */}
            {viewingPlaylist && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setViewingPlaylist(null)} />
                    <div className="relative w-full max-w-3xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col h-[85vh] animate-in zoom-in duration-300">
                        {/* Modal Header */}
                        <div className="relative h-48 flex-shrink-0">
                            <img src={viewingPlaylist.thumbnail || viewingPlaylist.images?.[0]?.url || viewingPlaylist.imageUrl} alt="" className="w-full h-full object-cover blur-2xl opacity-20 scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white" />
                            <div className="absolute inset-0 p-8 flex items-end gap-6">
                                <div className="w-32 h-32 rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                                    <img src={viewingPlaylist.thumbnail || viewingPlaylist.images?.[0]?.url || viewingPlaylist.imageUrl} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 pb-2">
                                    <span className="text-[10px] font-black uppercase tracking-[3px] text-indigo-500 mb-1 block">Playlist Preview</span>
                                    <h2 className="text-3xl font-black text-gray-900 leading-tight line-clamp-2">{viewingPlaylist.title || viewingPlaylist.name || viewingPlaylist.tag_name}</h2>
                                    <p className="text-gray-500 font-bold text-sm mt-1">{tracks.length} Tracks Resolved • Spotify Source</p>
                                </div>
                                <button onClick={() => setViewingPlaylist(null)} className="absolute top-6 right-6 p-2 bg-white/50 backdrop-blur-xl rounded-full hover:bg-white transition-all">
                                    <Trash2 className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6 pt-2">
                            {tracksLoading ? (
                                <div className="flex flex-col items-center justify-center h-full gap-4">
                                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                                    <p className="text-gray-400 font-bold">กำลังดึงข้อมูลเพลงล่าสุด...</p>
                                </div>
                            ) : tracks.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full py-10 opacity-40">
                                    <Music className="w-16 h-16 mb-4" />
                                    <p className="font-bold">ไม่พบเพลงในเพลย์ลิสต์นี้</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {tracks.map((track, idx) => (
                                        <div key={idx} className="group flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100">
                                            <div className="w-10 text-xs font-black text-gray-300 text-center">{idx + 1}</div>
                                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                                                <img src={track.videoThumbnails?.[0]?.url || "https://placehold.co/100"} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-gray-900 truncate">{track.title}</h4>
                                                <p className="text-xs font-bold text-gray-400 truncate">{track.author}</p>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <a href={`https://youtube.com/watch?v=${track.videoId}`} target="_blank" rel="noreferrer" className="p-2 text-gray-400 hover:text-indigo-600">
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

const PlaylistCard = ({ playlist, isMember, onDelete, onToggleOfficial, onViewTracks }: { playlist: CommunityPlaylist, isMember?: boolean, onDelete: any, onToggleOfficial: any, onViewTracks: any }) => (
    <div className="group relative bg-white border border-gray-100 rounded-[32px] p-5 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-500 overflow-hidden">
        {/* Background Accent */}
        <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl opacity-10 transition-opacity ${playlist.isOfficial ? "bg-amber-400" : isMember ? "bg-rose-400" : "bg-indigo-400"}`} />
        
        {/* Top Badges */}
        <div className="flex justify-between items-start mb-4">
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                isMember ? "bg-rose-50 text-rose-600 border border-rose-100" :
                playlist.source === 'spotify' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"
            }`}>
                {isMember ? 'MEMBER' : playlist.source}
            </div>
            {playlist.isOfficial && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-100 text-amber-600 rounded-full text-[10px] font-black tracking-widest uppercase">
                    <BadgeCheck className="w-3.5 h-3.5" />
                    Official
                </div>
            )}
        </div>

        {/* Thumbnail */}
        <div className="relative w-full aspect-square rounded-[24px] overflow-hidden mb-5 group-hover:shadow-2xl transition-all duration-500">
            <img 
                src={playlist.thumbnail || ''} 
                alt="" 
                className="w-full h-full object-cover scale-[1.01] group-hover:scale-110 transition-transform duration-700"
                onError={(e) => (e.currentTarget.src = "https://placehold.co/400?text=No+Cover")}
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500" />
            <button 
                onClick={onViewTracks}
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-y-4 group-hover:translate-y-0"
            >
                <div className="bg-white text-gray-900 px-5 py-2.5 rounded-2xl font-black text-sm shadow-xl flex items-center gap-2">
                    <List className="w-4 h-4" /> ดูรายชื่อเพลง
                </div>
            </button>
        </div>

        {/* Content */}
        <div className="space-y-1 px-1">
            <h3 className="font-black text-gray-900 text-lg leading-tight truncate" title={playlist.title}>{playlist.title}</h3>
            <div className="flex items-center gap-4 pt-1">
                <div className="flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                    <span className="text-xs font-black text-gray-700">{playlist.likes} <span className="text-gray-400 font-bold">Likes</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Music className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-black text-gray-700">{playlist.tracksCount} <span className="text-gray-400 font-bold">Tracks</span></span>
                </div>
            </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex gap-2 pt-2 border-t border-gray-50">
            <button 
                onClick={onToggleOfficial}
                className={`flex-1 py-2.5 rounded-[14px] text-xs font-black transition-all flex items-center justify-center gap-2 ${
                    playlist.isOfficial 
                        ? "bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100" 
                        : "bg-gray-50 text-gray-500 border border-gray-100 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100"
                }`}
            >
                {playlist.isOfficial ? <BadgeCheck className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                {playlist.isOfficial ? "Unmark Official" : "Set Official"}
            </button>
            <button 
                onClick={onDelete}
                className="p-2.5 bg-gray-50 border border-gray-100 text-gray-400 rounded-[14px] hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    </div>
);

const SpotifyItemCard = ({ p, isImported, onToggleOfficial, onViewTracks }: any) => {
    const id = p.id || p.tag_id;
    const title = p.name || p.tag_name;
    const thumb = p.images?.[0]?.url || p.imageUrl;
    
    return (
        <div className="group relative bg-white border border-gray-100 rounded-[32px] p-5 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-500">
            {isImported && (
                <div className="absolute -top-1 -right-1 z-10 p-1.5 bg-indigo-600 rounded-full shadow-lg border-[3px] border-white animate-in zoom-in duration-500">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
            )}
            
            <div className="relative w-full aspect-square rounded-[24px] overflow-hidden mb-5 shadow-inner">
                <img 
                    src={thumb} 
                    alt="" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    onError={(e) => (e.currentTarget.src = "https://placehold.co/400?text=Spotify+Playlist")}
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors" />
                <button 
                    onClick={onViewTracks}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity translate-y-4 group-hover:translate-y-0"
                >
                    <div className="bg-white/90 backdrop-blur text-gray-900 px-5 py-2.5 rounded-2xl font-black text-sm shadow-xl flex items-center gap-2">
                        <Info className="w-4 h-4" /> รายละเอียด
                    </div>
                </button>
            </div>

            <h3 className="font-black text-gray-900 text-lg leading-tight truncate mb-1" title={title}>{title}</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{isImported ? "Already in System" : "On Spotify account"}</p>

            <div className="mt-5 flex gap-2">
                <button 
                    onClick={onToggleOfficial}
                    className={`flex-1 py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-sm transition-all ${
                        isImported 
                            ? "bg-amber-600 text-white hover:bg-amber-700 hover:shadow-amber-200" 
                            : "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-200"
                    }`}
                >
                    {isImported ? <BadgeCheck className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {isImported ? "Set Official Account" : "Add to Official List"}
                </button>
            </div>
        </div>
    );
};
