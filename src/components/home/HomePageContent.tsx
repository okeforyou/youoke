import dynamic from "next/dynamic";
import { memo } from "react";
import { usePlayerStore } from "../../modules/player/stores/usePlayerStore";
import { useShallow } from 'zustand/react/shallow';

// Dynamic imports moved here
const MusicProviderContainer = dynamic(() => import("../MusicProviderContainer"), {
    loading: () => <div className="grid grid-cols-6 gap-4 p-4">{[...Array(12)].map((_, i) => <div key={i} className="aspect-square bg-gray-100 rounded-2xl animate-pulse" />)}</div>,
    ssr: false,
});
const ListTopicsGrid = dynamic(() => import("../ListTopicsGrid"), {
    loading: () => <div className="h-48 bg-gray-100 rounded-2xl animate-pulse m-4" />,
    ssr: false,
});
const SearchResultGrid = dynamic(() => import("../SearchResultGrid"), {
    loading: () => <div className="h-96 bg-gray-100 rounded-2xl animate-pulse m-4" />,
    ssr: false,
});
const ListPlaylistsGrid = dynamic(() => import("../ListPlaylistsGrid"), {
    loading: () => <div className="grid grid-cols-5 gap-4 p-4">{[...Array(5)].map((_, i) => <div key={i} className="aspect-square bg-gray-100 dark:bg-zinc-900 rounded-2xl animate-pulse" />)}</div>,
    ssr: false,
});
const ListRecommendedPlaylists = dynamic(() => import("../ListRecommendedPlaylists"), {
    loading: () => <div className="grid grid-cols-5 gap-4 p-4">{[...Array(10)].map((_, i) => <div key={i} className="aspect-square bg-gray-100 dark:bg-zinc-900 rounded-2xl animate-pulse" />)}</div>,
    ssr: false,
});
const ListCommunityPlaylists = dynamic(() => import("../ListCommunityPlaylists"), {
    loading: () => <div className="grid grid-cols-5 gap-4 p-4">{[...Array(5)].map((_, i) => <div key={i} className="aspect-square bg-gray-100 dark:bg-zinc-900 rounded-2xl animate-pulse" />)}</div>,
    ssr: false,
});
const ListHitsGrid = dynamic(() => import("../ListHitsGrid"), {
    loading: () => <div className="grid grid-cols-5 gap-4 p-4">{[...Array(10)].map((_, i) => <div key={i} className="aspect-square bg-gray-100 dark:bg-zinc-900 rounded-2xl animate-pulse" />)}</div>,
    ssr: false,
});
const VocalDashboard = dynamic(() => import("../vocal/VocalDashboard").then(mod => mod.VocalDashboard), {
    loading: () => <div className="h-full bg-gray-100 dark:bg-zinc-900 rounded-2xl animate-pulse m-4" />,
    ssr: false,
});

export const HomePageContent = memo(() => {
    // Only subscribe to activeIndex to prevent unnecessary re-renders
    const activeIndex = usePlayerStore(useShallow(state => state.activeIndex));

    switch (activeIndex) {
        case 0: return <SearchResultGrid onClick={(video) => {
            const videoToAdd = {
                id: video.videoId, // map videoId to id for Video type
                sourceType: 'youtube', // default source
                videoId: video.videoId,
                title: video.title,
                author: video.author,
                thumbnail: undefined,
            } as any;
            
            // 🛡️ Global Store will handle the quota check inside addToQueue (v4.9.63)
            usePlayerStore.getState().addToQueue(videoToAdd);
        }} />;
        case 1: return <MusicProviderContainer showTab={false} />; // "หน้าแรก" -> Main Dashboard
        case 2: return <ListHitsGrid onClick={(hit: any) => {
            const artist = (hit.artist_name && hit.artist_name !== "Unknown Artist") ? hit.artist_name : "";
            const query = `${hit.title} ${artist}`.trim();

            // v4.9.63: Direct playback from Chart with Quota Check
            const videoToAdd = {
                id: `search:${query}`,
                sourceType: 'youtube',
                title: hit.title,
                author: hit.artist_name,
                thumbnail: hit.coverImageURL
            } as any;
            
            usePlayerStore.getState().addToQueue(videoToAdd);
        }} />; // "ชาร์ตเพลง" -> Charts
        case 3: return <MusicProviderContainer showTab={false} mode="station" />; // "สถานีเพลง"
        case 4: return <ListPlaylistsGrid />; // "เพลย์ลิสต์" -> My Playlists
        case 5: return <VocalDashboard />; // "AI แยกเสียงร้อง" -> Vocal Dashboard
        default: return <MusicProviderContainer showTab={false} />;
    }
});
