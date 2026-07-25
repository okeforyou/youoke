import {
  addDoc,
  arrayRemove,
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import Image from "next/image";
import { Fragment, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useUIStore } from "../stores/useUIStore";
import clsx from "clsx";

import {
  PencilIcon,
  PlusIcon,
  RectangleStackIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import {
  EllipsisVerticalIcon,
  HandThumbUpIcon,
  LockClosedIcon,
  PlayIcon,
  GlobeAltIcon,
  XMarkIcon,
  CpuChipIcon
} from "@heroicons/react/24/solid";

import { useAuthStore } from "@/modules/auth/useAuthStore";
import { database } from "../firebase";

import { useMyPlaylistState } from "../hooks/myPlaylist";
import { getSkeletonItems } from "../utils/api";
import Alert, { AlertHandler } from "./Alert";
import Modal, { ModalHandler } from "./Modal";
import { usePlayerStore } from "../modules/player/stores/usePlayerStore"; // Import Player Store
import { Video } from "../modules/player/types";
import PlaylistCard from "./CardV2";
import ListCommunityPlaylists from "./ListCommunityPlaylists";

// Helper function to get playlists reference
const getPlaylistsRef = () => {
  if (!database) {
    throw new Error('Firebase not configured');
  }
  return collection(database, "playlists");
};

enum MODE {
  CREATE = 1,
  EDIT,
}

// Helper for UUID generation
const generateUUID = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};


interface PlaylistItem {
  id: string;
  name: string;
  createdBy: string;
  type: string;
  starCount?: number;
  createdAt?: any;
  playlists: Video[]; // Or specific Video type if available
}

interface ListPlaylistsGridProps {
  defaultTab?: number;
}

export default function ListPlaylistsGrid({ defaultTab = 0 }: ListPlaylistsGridProps) {
  const { user } = useAuthStore();
  // The original `database` import is used directly, not via a hook.
  // If `useFirebase` is intended, it needs to be imported and `database` removed.
  // For now, keeping `database` as it is imported globally.
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(defaultTab); // 0: Community, 1: My Playlists
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
  const [youtubePlaylists, setYoutubePlaylists] = useState<any[]>([]);
  const [suggestPlaylists, setSuggestPlaylists] = useState<PlaylistItem[]>([]);
  const [latestPlaylists, setLatestPlaylists] = useState<PlaylistItem[]>([]);
  const [aiCacheList, setAiCacheList] = useState<any[]>([]);
  const [bridgeStatus, setBridgeStatus] = useState<'checking' | 'running' | 'outdated' | 'offline'>('checking');

  // Use Player Store Actions
  const { clearQueue, reorderQueue, setCurrentIndex } = usePlayerStore();

  const { myPlaylist, setMyPlaylist } = useMyPlaylistState();
  const [mode, setMode] = useState(MODE.CREATE);
  const [selectedItem, setSelectedItem] = useState<PlaylistItem | null>(null);

  const createModalRef = useRef<ModalHandler>(null);
  const playlistModalRef = useRef<ModalHandler>(null);
  const alertRef = useRef<AlertHandler>(null);

  // Status to track if we've loaded data yet
  const [isLoadPlaylist, setIsLoadPlaylist] = useState({
    suggest: 0,
    myPlaylist: 0,
  });

  const [formData, setFormData] = useState({
    name: "",
    isPrivate: true,
  });

  // Reset to Community tab if user logs out
  useEffect(() => {
    if (!user?.uid && activeIndex === 1) {
      setActiveIndex(0);
    }
  }, [user, activeIndex]);

  // Fetch data only on first load or tab change
  useEffect(() => {
    if (activeIndex === 1 && isLoadPlaylist.myPlaylist === 0 && user?.uid) {
      getMyPlaylists();
    } else if (activeIndex === 0 && isLoadPlaylist.suggest === 0) {
      getSuggestPlaylists();
    } else if (activeIndex === 2 && youtubePlaylists.length === 0 && user?.googleAccessToken) {
      getYoutubePlaylists();
    } else if (activeIndex === 3 && aiCacheList.length === 0) {
      getAiCacheList();
    }
  }, [activeIndex, isLoadPlaylist, user, youtubePlaylists.length, aiCacheList.length]);

  // Update playlists when data changes OR when switching tabs
  useEffect(() => {
    if (!isLoading) {
      if (activeIndex === 1) {
        // Filter out empty playlists for My Playlists
        setPlaylists(myPlaylist.filter(p => p.playlists && p.playlists.length > 0));
      } else {
        // Filter out empty playlists for Community/Latest
        setPlaylists(latestPlaylists.filter(p => p.playlists && p.playlists.length > 0));
      }
    }
  }, [activeIndex, myPlaylist, latestPlaylists, isLoading]);

  // --- Router & Navigation Logic ---
  const router = useRouter();

  // Sync Modal with URL
  useEffect(() => {
    // 1. Check if we should show details
    const view = router.query.view;
    const playlistId = router.query.id;

    if (view === 'playlist_detail' && playlistId) {
      // Try to find the item in loaded playlists
      const allItems = [...playlists, ...latestPlaylists, ...suggestPlaylists];
      const item = allItems.find(p => p.id === playlistId);

      if (item) {
        setSelectedItem(item);
        if (!playlistModalRef.current?.showModal) {
          playlistModalRef.current?.open();
        }
      } else {
        // If item not found (e.g. data not loaded yet), we wait? 
        // Or maybe we should allow fetching individual playlist?
        // For now, if not found, maybe just do nothing (modal won't open).
      }

      // Override Back Button
      useUIStore.getState().setBackAction(() => router.back());

    } else {
      // Close Modal if URL doesn't match
      if (playlistModalRef.current?.showModal) {
        playlistModalRef.current?.close();
        setSelectedItem(null);
      }
      useUIStore.getState().setBackAction(null);
    }
  }, [router.query, playlists, latestPlaylists, suggestPlaylists]);

  // Handle Modal Manual Close (X button or Backdrop)
  const handleModalClose = () => {
    // If URL has state, go back. Otherwise just close (fallback)
    if (router.query.view === 'playlist_detail') {
      router.back();
    } else {
      playlistModalRef.current?.close();
    }
  };

  const openPlaylistDetail = (item: PlaylistItem) => {
    setSelectedItem(item);
    router.push({
      pathname: router.pathname,
      query: { ...router.query, view: 'playlist_detail', id: item.id }
    }, undefined, { shallow: true });
  };

  const getMyPlaylists = async () => {
    if (!database || !user?.uid) return [];
    setIsLoading(true);
    try {
      const q = query(getPlaylistsRef(), where("createdBy", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setMyPlaylist(data);
      setIsLoading(false);
      setIsLoadPlaylist(prev => ({ ...prev, myPlaylist: 1 }));
      return data;
    } catch (error) {
      setIsLoading(false);
      console.error(error);
    }
  };

  const getYoutubePlaylists = async () => {
    if (!user?.googleAccessToken) {
      console.warn("[YouTube Shell] 🚫 Missing Google Access Token. Re-login required.");
      alert("❌ ไม่พบบัญชี YouTube ที่เชื่อมต่อ! กรุณาลองเข้าสู่ระบบด้วย Google ใหม่อีกครั้งครับ (และอย่าลืมกดยอมรับสิทธิ YouTube นะครับ)");
      return;
    }
    
    console.log("[YouTube Shell] 📡 Fetching your YouTube playlists...");
    setIsLoading(true);
    try {
      const resp = await fetch(`https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&mine=true&maxResults=50`, {
        headers: {
          'Authorization': `Bearer ${user.googleAccessToken}`,
          'Accept': 'application/json'
        }
      });
      
      console.log("[YouTube Shell] 🌐 API Status:", resp.status);
      
      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        console.error("[YouTube Shell] ❌ API Error Details:", errorData);
        alert(`❌ YouTube API Error: ${resp.status}\n${JSON.stringify(errorData)}`);
        
        if (resp.status === 401) {
          console.error("🔒 Token might be expired or invalid scope.");
        }
        throw new Error(`Failed to fetch playlists: ${resp.status}`);
      }
      
      const data = await resp.json();
      console.log(`[YouTube Shell] ✅ Success! Found ${data.items?.length || 0} playlists.`);
      
      if (!data.items || data.items.length === 0) {
        alert("ℹ️ พบ 0 เพลย์ลิสต์: บัญชี YouTube นี้อาจจะยังไม่มีเพลย์ลิสต์ที่บันทึกไว้ครับ");
      }
      
      const mapped = (data.items || []).map((item: any) => ({
        id: item.id,
        name: item.snippet.title,
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
        count: item.contentDetails?.itemCount || 0,
        type: 'youtube_personal',
        sourceType: 'youtube'
      }));
      setYoutubePlaylists(mapped);
    } catch (error) {
      console.error("[YouTube Shell] 💥 Fetch Crash:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAiCacheList = async () => {
    setIsLoading(true);
    setBridgeStatus('checking');
    try {
      // 1. Check version first
      let isOutdated = false;
      try {
        const verRes = await fetch("http://127.0.0.1:5050/version", { signal: AbortSignal.timeout(2000) });
        if (verRes.ok) {
          const verData = await verRes.json();
          if (verData.version !== "1.1.0") {
            isOutdated = true;
          }
        } else {
          isOutdated = true; // /version doesn't exist in older versions
        }
      } catch (err) {
        setBridgeStatus('offline');
        setIsLoading(false);
        return;
      }

      if (isOutdated) {
        setBridgeStatus('outdated');
        setIsLoading(false);
        return;
      }

      setBridgeStatus('running');

      // 2. Fetch cache list
      const res = await fetch("http://127.0.0.1:5050/cache/list");
      const data = await res.json();
      if (data.status === "success" && data.results) {
        const enrichedPromises = data.results.map(async (r: any) => {
          try {
            const ytRes = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${r.video_id}`);
            const ytData = await ytRes.json();
            return {
              ...r,
              title: ytData.title || r.video_id,
              author: ytData.author_name || "Unknown",
              thumbnail: `https://img.youtube.com/vi/${r.video_id}/mqdefault.jpg`
            };
          } catch (err) {
            return {
              ...r,
              title: r.video_id,
              author: "Unknown",
              thumbnail: `https://img.youtube.com/vi/${r.video_id}/mqdefault.jpg`
            };
          }
        });
        const enriched = await Promise.all(enrichedPromises);
        setAiCacheList(enriched);
      }
    } catch (e) {
      console.error("Failed to fetch AI Cache", e);
      setBridgeStatus('offline');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAiCache = async (videoId: string) => {
    if (!confirm("ลบไฟล์เพลงที่แยกเสียงไว้นี้ออกจากเครื่องใช่หรือไม่?")) return;
    try {
      const res = await fetch(`http://127.0.0.1:5050/cache/${videoId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.status === "success") {
        setAiCacheList(prev => prev.filter(item => item.video_id !== videoId));
        alertRef.current?.open();
      } else {
        alert(`Failed to delete: ${data.message}`);
      }
    } catch (e) {
      alert("Error deleting file.");
    }
  };

  const getSuggestPlaylists = async () => {
    if (!database) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const q = query(
        getPlaylistsRef(),
        where("type", "==", "public"),
        orderBy("createdAt", "desc"),
        limit(30)
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PlaylistItem));
      setLatestPlaylists(data);

      const qSuggest = query(
        getPlaylistsRef(),
        where("type", "==", "public"),
        orderBy("starCount", "desc"),
        limit(24)
      );
      const querySuggestSnapshot = await getDocs(qSuggest);
      const dataSuggest = querySuggestSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PlaylistItem));

      setSuggestPlaylists(
        dataSuggest
          .map((value) => ({ value, sort: Math.random() }))
          .sort((a, b) => a.sort - b.sort)
          .map(({ value }) => value)
          .slice(0, 12)
      );

      setIsLoading(false);
      setIsLoadPlaylist(prev => ({ ...prev, suggest: 1 }));
    } catch (error) {
      setIsLoading(false);
      console.error(error);
    }
  };

  const setVideoPlaylist = async (playlists: Video[]) => {
    try {
      if (playlists && playlists.length > 0) {
        // Clear existing queue
        clearQueue();

        // Transform to Queue Items
        const queueItems = playlists.map((item) => {
          // Robust check for missing videoId (common in imported playlists)
          const hasVideoId = item.videoId && item.videoId.length > 5;

          if (!hasVideoId) {
            // AUTO-SEARCH MODE
            const query = `${item.title} ${item.author}`;
            return {
              ...item,
              id: `search:${query}`, // Magic prefix for resolver
              videoId: undefined,
              sourceType: 'search' as const, // New Source Type
              title: item.title,
              author: item.author || "Unknown",
              thumbnail: item.thumbnail || "", // Keep original thumb if any
              uuid: generateUUID()
            };
          }

          return {
            ...item,
            id: item.videoId!, // Ensure id matches videoId for setCurrentIndex source resolution
            videoId: item.videoId,
            sourceType: 'youtube' as const, // CRITICAL: Must be set for UniversalPlayer to mount YouTube iframe
            title: item.title,
            author: item.author || "Unknown",
            thumbnail: `https://i.ytimg.com/vi/${item.videoId}/mqdefault.jpg`,
            uuid: generateUUID()
          };
        });

        // Set the new queue
        reorderQueue(queueItems);

        // Play the first video immediately using index to preserve queue
        setCurrentIndex(0);

        console.log("▶️ Queue updated & playing:", queueItems[0].title);
      }
    } catch (error) {
      console.error("Failed to set playlist:", error);
    }
  };

  const deletePlaylist = async (id: string) => {
    if (!database) return;
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบเพลย์ลิสต์นี้?")) return;
    try {
      const docRef = doc(database, "playlists", id);
      await deleteDoc(docRef);
      await getMyPlaylists();
    } catch (error) {
      console.error(error);
    }
  };

  const handleSavePlaylist = async () => {
    const { name, isPrivate } = formData;
    if (!name.trim()) return;

    try {
      const type = isPrivate ? "private" : "public";

      if (!database || !user?.uid) return;

      if (mode === MODE.CREATE) {
        const playlistDoc = {
          name,
          createdBy: user.uid,
          type,
          starCount: 0,
          createdAt: new Date(),
          playlists: [],
        };
        await addDoc(getPlaylistsRef(), playlistDoc);
      } else {
        if (!database || !selectedItem?.id) return;
        const docRef = doc(database, "playlists", selectedItem.id);
        await updateDoc(docRef, { name, type });
      }

      await getMyPlaylists();
      createModalRef.current?.close();
    } catch (error) {
      console.error(error);
    }
  };

  const openCreateModal = () => {
    setMode(MODE.CREATE);
    setFormData({ name: "", isPrivate: true });
    createModalRef.current?.open();
  };

  const openEditModal = (item: PlaylistItem) => {
    const isPrivate = item.type === "private" || item.type === "ส่วนตัว";
    setMode(MODE.EDIT);
    setFormData({ name: item.name, isPrivate });
    setSelectedItem(item);
    createModalRef.current?.open();
  };

  const handleDeleteSong = async (id: string, video: Video) => {
    if (!database) return;
    const docRef = doc(database, "playlists", id);
    await updateDoc(docRef, {
      playlists: arrayRemove(video),
    });
    const data = await getMyPlaylists();
    if (data) {
      setSelectedItem((data.find((p: any) => p.id === id) as PlaylistItem) || null);
    }
  };

  const handlePlaySong = (video: Video) => {
    try {
      // Robust mapping for individual song selection
      const videoToAdd = {
        ...video,
        id: video.videoId || video.id,
        videoId: video.videoId || (video as any).id,
        sourceType: 'youtube' as const,
        thumbnail: video.thumbnail || `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`,
        uuid: generateUUID()
      };
      
      // Add to Global Queue (v4.9.63 standard)
      usePlayerStore.getState().addToQueue(videoToAdd as any);
    } catch (error) {
      console.error("Failed to play individual song:", error);
    }
  };

  const handleTogglePrivacy = async (item: PlaylistItem) => {
    const newType = (item.type === "private" || item.type === "ส่วนตัว") ? "public" : "private";
    try {
      if (!database) return;
      const docRef = doc(database, "playlists", item.id);
      await updateDoc(docRef, { type: newType });

      // Update local state
      const updatedItem = { ...item, type: newType };
      setSelectedItem(updatedItem);

      // Refresh Lists
      await getMyPlaylists();
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddLike = async (id: string) => {
    if (!database) return;
    const docRef = doc(database, "playlists", id);
    await updateDoc(docRef, {
      starCount: increment(1),
    });
    alertRef.current?.open();
  };


  return (
    <div className="w-full pb-24">

      {/* Header */}
      {/* Banner Header */}
      <div className="px-4 pt-4 pb-6">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-800 p-5 sm:p-8 rounded-2xl relative overflow-hidden min-h-[130px] flex flex-col justify-center border border-gray-200/50 dark:border-zinc-800 shadow-sm">
           <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white leading-tight">คลังเพลย์ลิสต์</h2>
           <p className="text-[13px] sm:text-base !text-black dark:!text-zinc-400 mt-2 font-black">แหล่งรวมความบันเทิงที่คุณสร้างสรรค์เองได้</p>
           <div className="absolute bottom-6 right-8 opacity-10">
              <RectangleStackIcon className="w-20 h-20 text-black dark:text-white" />
           </div>
        </div>
      </div>

      {/* Controls: Tabs & Actions */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4 py-4 mb-6">
        {/* Tabs - Animated Switch */}
        {user?.uid ? (
          <div className="relative flex items-center bg-gray-100 dark:bg-zinc-900 rounded-2xl p-1 h-12 w-full max-w-[500px]">
            {/* Sliding Active Background - Updated for 3 Tabs */}
            <div
              className="absolute top-1.5 bottom-1.5 w-[calc(33.33%-4px)] bg-white dark:bg-zinc-800 rounded-xl shadow-sm transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
              style={{
                left: `calc(${(activeIndex === 3 ? 2 : activeIndex) * 33.33}% + ${activeIndex === 0 ? '4px' : '2px'})`
              }}
            />

            <button
              onClick={() => setActiveIndex(0)}
              className={clsx(
                "relative flex-1 flex items-center justify-center gap-2 h-full rounded-xl text-[12px] sm:text-[13px] font-bold transition-colors z-10",
                activeIndex === 0 ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-zinc-600 hover:text-gray-600 dark:hover:text-zinc-400"
              )}
            >
              <GlobeAltIcon className="w-4 h-4" />
              <span>ชุมชน</span>
            </button>

            <button
              onClick={() => setActiveIndex(1)}
              className={clsx(
                "relative flex-1 flex items-center justify-center gap-2 h-full rounded-xl text-[12px] sm:text-[13px] font-bold transition-colors z-10",
                activeIndex === 1 ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-zinc-600 hover:text-gray-600 dark:hover:text-zinc-400"
              )}
            >
              <RectangleStackIcon className="w-4 h-4" />
              <span>ของฉัน</span>
            </button>

            <button
              onClick={() => setActiveIndex(3)}
              className={clsx(
                "relative flex-1 flex items-center justify-center gap-2 h-full rounded-xl text-[12px] sm:text-[13px] font-bold transition-colors z-10",
                activeIndex === 3 ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-zinc-600 hover:text-gray-600 dark:hover:text-zinc-400"
              )}
            >
              <CpuChipIcon className="w-4 h-4" />
              <span>ไฟล์ AI</span>
            </button>
          </div>
        ) : (
          /* Guest Mode: Single Static Pill */
          <div className="bg-gray-100 dark:bg-zinc-900 rounded-2xl p-1 h-12 inline-flex items-center">
            <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm h-full px-6 flex items-center gap-2 text-[13px] font-bold text-gray-900 dark:text-white">
              <GlobeAltIcon className="w-4 h-4" />
              <span>ชุมชน</span>
            </div>
          </div>
        )}

        {/* Add Button (Desktop) - Always visible if user exists */}
        {user?.uid && (
          <button onClick={openCreateModal} className="hidden md:flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-black text-white rounded-full text-[13px] font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 active:scale-95">
            <PlusIcon className="w-5 h-5" />
            <span>สร้างใหม่</span>
          </button>
        )}
      </div>

      {/* Community Top Charts Section */}
      {activeIndex === 0 && (
        <div className="mb-8">
          <ListCommunityPlaylists onPlay={(pl) => {
            const playerStore = usePlayerStore.getState();
            playerStore.setSearchTerm(pl.title);
            playerStore.setActiveIndex(0); // Switch to Search Tab
          }} />
        </div>
      )}

      {/* Grid Content */}
      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6 gap-y-10 px-4">
            {getSkeletonItems(10).map((i) => (
              <div key={i} className="flex flex-col gap-3">
                <div className="aspect-video w-full bg-gray-100 rounded-2xl animate-pulse"></div>
                <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse"></div>
                <div className="h-3 w-1/2 bg-gray-100 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : activeIndex === 3 && bridgeStatus === 'offline' ? (
          <div className="mx-4 flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-red-100 dark:border-red-900/30 rounded-3xl bg-red-50/50 dark:bg-red-900/10 transition-colors">
            <div className="w-20 h-20 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center mb-6 shadow-sm">
              <XMarkIcon className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-black text-red-600 dark:text-red-400 leading-tight">
              ไม่สามารถเชื่อมต่อโปรแกรมเบื้องหลังได้
            </h3>
            <p className="text-gray-500 dark:text-zinc-500 mt-2 mb-8 max-w-sm text-sm font-medium">
              คุณจำเป็นต้องเปิดโปรแกรม YouOke Server (หรือ server.py) ในเครื่องของคุณ เพื่อดึงข้อมูลไฟล์ AI ที่แยกเสียงไว้
            </p>
          </div>
        ) : activeIndex === 3 && bridgeStatus === 'outdated' ? (
          <div className="mx-4 flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-orange-100 dark:border-orange-900/30 rounded-3xl bg-orange-50/50 dark:bg-orange-900/10 transition-colors">
            <div className="w-20 h-20 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center mb-6 shadow-sm">
              <CpuChipIcon className="w-8 h-8 text-orange-500" />
            </div>
            <h3 className="text-xl font-black text-orange-600 dark:text-orange-400 leading-tight">
              โปรแกรมเบื้องหลังเป็นเวอร์ชันเก่า
            </h3>
            <p className="text-gray-500 dark:text-zinc-500 mt-2 mb-8 max-w-sm text-sm font-medium">
              ฟีเจอร์คลังเพลง AI ต้องการ YouOke Server เวอร์ชันล่าสุด กรุณาดาวน์โหลดหรืออัปเดตโปรแกรมในเครื่องของคุณใหม่ครับ
            </p>
          </div>
        ) : (
          <>
            {(activeIndex === 3 ? aiCacheList?.length === 0 : (activeIndex === 2 ? youtubePlaylists?.length === 0 : playlists?.length === 0)) ? (
              <div className="mx-4 flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-gray-100 dark:border-zinc-800 rounded-3xl bg-gray-50/50 dark:bg-zinc-900/20 transition-colors">
                <div className="w-20 h-20 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center mb-6 shadow-sm">
                  <RectangleStackIcon className="w-8 h-8 text-gray-300 dark:text-zinc-700" />
                </div>
                <h3 className="text-xl font-black text-black dark:text-white leading-tight">
                  {activeIndex === 3 ? "ยังไม่มีไฟล์ AI ในเครื่อง" : "ยังไม่มีเพลย์ลิสต์"}
                </h3>
                <p className="text-gray-500 dark:text-zinc-500 mt-2 mb-8 max-w-sm text-sm font-medium">
                  {activeIndex === 3
                    ? "คุณยังไม่มีไฟล์เพลงที่แยกเสียงเก็บไว้ในเครื่อง ลองค้นหาเพลงแล้วกดแยกเสียงดูนะครับ"
                    : activeIndex === 2 
                    ? "เราไม่พบเพลย์ลิสต์ในบัญชี YouTube ของคุณ ลองสร้างเพลย์ลิสต์ใน YouTube ก่อนนะครับ"
                    : "เริ่มสร้างคอลเลกชันเพลงโปรดของคุณได้ง่ายๆ แค่กดปุ่มสร้างด้านล่าง"}
                </p>
                {activeIndex === 1 && (
                  <button onClick={openCreateModal} className="btn btn-primary rounded-full px-8 text-white shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                    <PlusIcon className="w-5 h-5 mr-2" /> สร้างเพลย์ลิสต์แรก
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-x-6 gap-y-10 px-4">
                {activeIndex === 3 ? (
                  aiCacheList.map((item) => (
                    <PlaylistCard
                      key={item.video_id}
                      id={item.video_id}
                      name={item.title}
                      count={1}
                      thumbnail={item.thumbnail}
                      videoId={item.video_id}
                      type="ai_cache"
                      activeIndex={activeIndex}
                      badgeText={item.mode === 'pro' ? '4CH' : '2CH'}
                      badgeColor={item.mode === 'pro' ? 'bg-gradient-to-r from-purple-500 to-indigo-500' : 'bg-primary'}
                      onClick={() => {
                        const playerStore = usePlayerStore.getState();
                        playerStore.setSearchTerm(item.video_id);
                        playerStore.setActiveIndex(0); 
                      }}
                      onDelete={() => deleteAiCache(item.video_id)}
                    />
                  ))
                ) : activeIndex === 2 ? (
                  youtubePlaylists.map((item) => (
                    <PlaylistCard
                      key={item.id}
                      id={item.id}
                      name={item.name}
                      count={item.count}
                      thumbnail={item.thumbnail}
                      videoId={item.id} // Standard id for playlists here
                      type="youtube_personal"
                      activeIndex={activeIndex}
                      onClick={() => {
                        // Open YouTube Playlist logic
                        console.log("Open YT Playlist:", item.id);
                        const playerStore = usePlayerStore.getState();
                        playerStore.setSearchTerm(`https://www.youtube.com/playlist?list=${item.id}`);
                        playerStore.setActiveIndex(0); // For now, switch to Search to resolve
                      }}
                    />
                  ))
                ) : (
                  playlists.map((item, index) => (
                    <PlaylistCard
                      key={item.id + index + "-v3-force-refresh"}
                      id={item.id}
                      name={item.name}
                      count={item.playlists?.length || 0}
                      thumbnail={item.playlists?.[0]?.thumbnail}
                      videoId={item.playlists?.[0]?.videoId}
                      type={item.type}
                      activeIndex={activeIndex}
                      onClick={() => openPlaylistDetail(item)}
                      onEdit={() => openEditModal(item)}
                      onDelete={() => deletePlaylist(item.id)}
                      onLike={() => handleAddLike(item.id)}
                    />
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Button (Mobile) */}
      {activeIndex === 1 && (
        <button onClick={openCreateModal} className="md:hidden fixed bottom-24 right-6 w-14 h-14 bg-gray-900 text-white rounded-full shadow-2xl flex items-center justify-center z-50 hover:scale-110 active:scale-95 transition-all">
          <PlusIcon className="w-6 h-6" />
        </button>
      )}

      {/* Create / Edit Modal */}
      <Modal ref={createModalRef} title={<span className="text-xl font-bold text-gray-900 dark:text-white">{mode === MODE.CREATE ? "สร้างเพลย์ลิสต์ใหม่" : "แก้ไขเพลย์ลิสต์"}</span>} body={
        <div className="p-6 space-y-6 w-full sm:w-[500px] bg-white dark:bg-zinc-950">
          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-700 dark:text-zinc-400 block">ชื่อเพลย์ลิสต์</label>
            <input
              autoFocus
              className="w-full px-5 py-4 bg-gray-50 dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-2xl text-lg font-medium focus:bg-white dark:focus:bg-zinc-800 focus:border-primary dark:focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none placeholder:text-gray-300 dark:placeholder:text-zinc-700 text-gray-900 dark:text-white"
              placeholder="ตั้งชื่อให้โดนใจ..."
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
 
          <div className="p-4 bg-white dark:bg-zinc-900/50 border border-gray-100 dark:border-zinc-800 rounded-2xl flex items-center justify-between cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 hover:shadow-sm transition-all shadow-sm" onClick={() => setFormData({ ...formData, isPrivate: !formData.isPrivate })}>
            <div className="flex items-center gap-4">
              <div className={clsx("w-12 h-12 rounded-full flex items-center justify-center transition-colors", formData.isPrivate ? "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400" : "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-500")}>
                {formData.isPrivate ? <LockClosedIcon className="w-6 h-6" /> : <GlobeAltIcon className="w-6 h-6" />}
              </div>
              <div>
                <div className="font-bold text-black dark:text-white">{formData.isPrivate ? "ส่วนตัว (Private)" : "สาธารณะ (Public)"}</div>
                <div className="text-xs text-gray-500 dark:text-zinc-500 font-medium mt-0.5">{formData.isPrivate ? "เห็นเฉพาะคุณเท่านั้น" : "ทุกคนสามารถค้นหาเจอ"}</div>
              </div>
            </div>
            <input type="checkbox" className="toggle toggle-success" checked={!formData.isPrivate} readOnly />
          </div>
        </div>
      } footer={
        <div className="flex justify-end gap-3 w-full bg-white dark:bg-zinc-950 p-2 sm:p-0">
          <button onClick={() => createModalRef.current?.close()} className="px-6 py-3 rounded-xl text-sm font-bold text-gray-500 dark:text-zinc-500 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors">ยกเลิก</button>
          <button onClick={handleSavePlaylist} disabled={!formData.name.trim()} className="px-8 py-3 rounded-xl text-sm font-bold bg-gray-900 dark:bg-primary text-white dark:text-white hover:bg-black dark:hover:bg-primary/90 shadow-lg shadow-gray-900/20 dark:shadow-primary/20 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all">
            {mode === MODE.CREATE ? "สร้างเลย" : "บันทึก"}
          </button>
        </div>
      } />

      {/* Playlist Detail Modal */}
      <Modal
        ref={playlistModalRef}
        disableScroll={false}
        transparent={false}
        onClose={handleModalClose}
        title={
          /* Header Section Passed to Master Modal Title */
          <div className="flex gap-4 items-center">
            {/* Cover */}
            <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-lg shadow-md overflow-hidden relative group shrink-0 border border-gray-100 dark:border-zinc-900">
              <Image
                src={selectedItem?.playlists?.length ? (selectedItem.playlists[0]?.thumbnail || `https://i.ytimg.com/vi/${selectedItem.playlists[0]?.videoId}/mqdefault.jpg`) : "/icon-cover.png"}
                alt=""
                fill
                unoptimized
                className="object-cover"
                onError={(e) => { e.currentTarget.src = "/icon-cover.png"; }}
              />
            </div>
            {/* Title & Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-[15px] font-black text-black dark:text-white leading-tight mb-1 truncate">{selectedItem?.name}</h2>
              <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-zinc-500 font-medium font-mono">
                <span className="bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-gray-600 dark:text-zinc-400">{selectedItem?.playlists?.length || 0} เพลง</span>
                <span>•</span>
                <span className="truncate max-w-[120px]">{user?.displayName || 'ผู้สร้าง'}</span>
              </div>
            </div>
          </div>
        }
        body={
          /* Body: Just the List */
          <div className="w-full bg-white dark:bg-zinc-950">
            {selectedItem?.playlists?.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-10 text-gray-400 dark:text-zinc-700 transition-colors">
                <RectangleStackIcon className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">ไม่มีเพลงในรายการนี้</p>
              </div>
            ) : (
              <div className="px-3 sm:px-6 py-2 space-y-1">
                {selectedItem && selectedItem.playlists?.map((v, i) => (
                  <div 
                    key={i + (v.videoId || v.title)} 
                    onClick={() => handlePlaySong(v)}
                    className="group flex items-center gap-3 p-3 pr-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-900 cursor-pointer transition-all border border-transparent hover:border-gray-100 dark:hover:border-zinc-800 hover:shadow-sm active:scale-[0.98]"
                  >
                    <div className="w-6 text-center text-xs font-bold text-gray-300 dark:text-zinc-700 group-hover:text-primary font-mono transition-colors">
                      <span className="group-hover:hidden">{i + 1}</span>
                      <PlayIcon className="w-3 h-3 hidden group-hover:block mx-auto" />
                    </div>

                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-zinc-800 overflow-hidden relative shrink-0 shadow-sm ring-1 ring-black/5 dark:ring-white/5">
                      <Image
                        src={v.thumbnail || `https://i.ytimg.com/vi/${v.videoId}/default.jpg`}
                        fill
                        alt={v.title}
                        className="object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                        unoptimized
                        onError={(e) => { e.currentTarget.src = "/icon-cover.png"; }}
                      />
                    </div>

                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-[13px] font-bold text-black dark:text-white truncate group-hover:text-primary transition-colors leading-tight mb-0.5">{v.title}</p>
                      <p className="text-[10px] text-gray-500 dark:text-zinc-500 truncate">{v.author}</p>
                    </div>

                    {activeIndex === 1 ? (
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteSong(selectedItem.id, v); }} className="p-2 text-gray-300 dark:text-zinc-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-all mr-1"><TrashIcon className="w-4 h-4" /></button>
                    ) : (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity px-3">
                        <PlayIcon className="w-5 h-5 text-primary" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        }
        footer={
          /* Footer: Actions */
          <div className="flex gap-2 w-full bg-white dark:bg-zinc-950 p-2 sm:p-0">
            <button
              onClick={() => { if (selectedItem) { setVideoPlaylist(selectedItem.playlists); playlistModalRef.current?.close(); } }}
              className="flex-1 btn btn-primary h-11 min-h-0 rounded-xl text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-sm font-bold border-none"
            >
              <PlayIcon className="w-5 h-5 mr-1" /> เล่นทั้งหมด
            </button>

            {activeIndex === 1 && (
              <>
                <button onClick={() => { playlistModalRef.current?.close(); openEditModal(selectedItem!); }} className="btn btn-square btn-ghost h-11 w-11 min-h-0 border border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 hover:bg-white dark:hover:bg-zinc-800 hover:border-gray-200 dark:hover:border-zinc-700 rounded-xl transition-all"><PencilIcon className="w-5 h-5 text-gray-500 dark:text-zinc-400" /></button>
                <button onClick={() => { if (confirm("ยืนยันการลบ?")) { deletePlaylist(selectedItem!.id); playlistModalRef.current?.close(); } }} className="btn btn-square btn-ghost h-11 w-11 min-h-0 border border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-100 dark:hover:border-red-500/20 hover:text-red-500 rounded-xl transition-all"><TrashIcon className="w-5 h-5 text-gray-500 dark:text-zinc-400" /></button>
              </>
            )}
          </div>
        }
      />

      <Alert ref={alertRef} timer={2500} headline="เรียบร้อย" headlineColor="text-green-600" bgColor="bg-green-50" content="บันทึกข้อมูลแล้ว" icon={<HandThumbUpIcon />} />

    </div>
  );
}
