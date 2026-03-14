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
  XMarkIcon
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
  const [suggestPlaylists, setSuggestPlaylists] = useState<PlaylistItem[]>([]);
  const [latestPlaylists, setLatestPlaylists] = useState<PlaylistItem[]>([]);

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
    }
  }, [activeIndex, isLoadPlaylist, user]);

  // Update playlists when data changes OR when switching tabs
  useEffect(() => {
    if (!isLoading) {
      if (activeIndex === 1) {
        setPlaylists(myPlaylist);
      } else {
        setPlaylists(latestPlaylists);
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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pb-24">

      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-8 sm:py-10">
        <div className="text-center md:text-left">
          <h1 className="text-[20px] font-black text-black tracking-tight leading-none mb-2">คลังเพลย์ลิสต์</h1>
          <p className="text-gray-500 text-[12px] font-medium">แหล่งรวมความบันเทิงที่คุณสร้างสรรค์เองได้</p>
        </div>

        {/* Tabs */}
        {/* Tabs - Animated Switch */}
        {user?.uid ? (
          <div className="relative flex items-center bg-gray-100 rounded-2xl p-1 h-12 w-[240px]">
            {/* Sliding Active Background */}
            <div
              className={clsx(
                "absolute top-1.5 bottom-1.5 w-[calc(50%-8px)] bg-white rounded-xl shadow-sm transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                activeIndex === 1 ? "left-[calc(50%+2px)]" : "left-1.5"
              )}
            />

            <button
              onClick={() => setActiveIndex(0)}
              className={clsx(
                "relative flex-1 flex items-center justify-center gap-2 h-full rounded-xl text-[13px] font-bold transition-colors z-10",
                activeIndex === 0 ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <GlobeAltIcon className="w-4 h-4" />
              <span>ชุมชน</span>
            </button>

            <button
              onClick={() => setActiveIndex(1)}
              className={clsx(
                "relative flex-1 flex items-center justify-center gap-2 h-full rounded-xl text-[13px] font-bold transition-colors z-10",
                activeIndex === 1 ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <RectangleStackIcon className="w-4 h-4" />
              <span>ของฉัน</span>
            </button>
          </div>
        ) : (
          /* Guest Mode: Single Static Pill */
          <div className="bg-gray-100 rounded-2xl p-1 h-12 inline-flex items-center">
            <div className="bg-white rounded-xl shadow-sm h-full px-6 flex items-center gap-2 text-[13px] font-bold text-gray-900">
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
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6 gap-y-10">
            {getSkeletonItems(10).map((i) => (
              <div key={i} className="flex flex-col gap-3">
                <div className="aspect-video w-full bg-gray-100 rounded-2xl animate-pulse"></div>
                <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse"></div>
                <div className="h-3 w-1/2 bg-gray-100 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {playlists?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/50">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
                  <RectangleStackIcon className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-black">ยังไม่มีเพลย์ลิสต์</h3>
                <p className="text-gray-500 mt-2 mb-8 max-w-sm text-sm">เริ่มสร้างคอลเลกชันเพลงโปรดของคุณได้ง่ายๆ แค่กดปุ่มสร้างด้านล่าง</p>
                {activeIndex === 1 && (
                  <button onClick={openCreateModal} className="btn btn-primary rounded-full px-8 text-white shadow-lg shadow-primary/20">
                    <PlusIcon className="w-5 h-5 mr-2" /> สร้างเพลย์ลิสต์แรก
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-x-6 gap-y-10">
                {playlists.map((item, index) => (
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
                ))}
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
      <Modal ref={createModalRef} title={<span className="text-xl font-bold">{mode === MODE.CREATE ? "สร้างเพลย์ลิสต์ใหม่" : "แก้ไขเพลย์ลิสต์"}</span>} body={
        <div className="p-6 space-y-6 w-full sm:w-[500px]">
          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-700 block">ชื่อเพลย์ลิสต์</label>
            <input
              autoFocus
              className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl text-lg font-medium focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none placeholder:text-gray-300"
              placeholder="ตั้งชื่อให้โดนใจ..."
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all shadow-sm" onClick={() => setFormData({ ...formData, isPrivate: !formData.isPrivate })}>
            <div className="flex items-center gap-4">
              <div className={clsx("w-12 h-12 rounded-full flex items-center justify-center transition-colors", formData.isPrivate ? "bg-gray-100 text-gray-600" : "bg-green-100 text-green-600")}>
                {formData.isPrivate ? <LockClosedIcon className="w-6 h-6" /> : <GlobeAltIcon className="w-6 h-6" />}
              </div>
              <div>
                <div className="font-bold text-black">{formData.isPrivate ? "ส่วนตัว (Private)" : "สาธารณะ (Public)"}</div>
                <div className="text-xs text-gray-500 font-medium mt-0.5">{formData.isPrivate ? "เห็นเฉพาะคุณเท่านั้น" : "ทุกคนสามารถค้นหาเจอ"}</div>
              </div>
            </div>
            <input type="checkbox" className="toggle toggle-success" checked={!formData.isPrivate} readOnly />
          </div>
        </div>
      } footer={
        <div className="flex justify-end gap-3 w-full">
          <button onClick={() => createModalRef.current?.close()} className="px-6 py-3 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors">ยกเลิก</button>
          <button onClick={handleSavePlaylist} disabled={!formData.name.trim()} className="px-8 py-3 rounded-xl text-sm font-bold bg-gray-900 text-white hover:bg-black shadow-lg shadow-gray-900/20 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all">
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
            <div className="w-16 h-16 bg-gray-100 rounded-lg shadow-md overflow-hidden relative group shrink-0 border border-gray-100">
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
              <h2 className="text-[15px] font-black text-black leading-tight mb-1 truncate">{selectedItem?.name}</h2>
              <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium font-mono">
                <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">{selectedItem?.playlists?.length || 0} เพลง</span>
                <span>•</span>
                <span className="truncate max-w-[120px]">{user?.displayName || 'ผู้สร้าง'}</span>
              </div>
            </div>
          </div>
        }
        body={
          /* Body: Just the List */
          <div className="w-full bg-white">
            {selectedItem?.playlists?.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-10 text-gray-400">
                <RectangleStackIcon className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">ไม่มีเพลงในรายการนี้</p>
              </div>
            ) : (
              <div className="px-6 py-2 space-y-1">
                {selectedItem && selectedItem.playlists?.map((v, i) => (
                  <div key={i + (v.videoId || v.title)} className="group flex items-center gap-3 p-3 pr-4 rounded-2xl hover:bg-gray-50 cursor-pointer transition-all border border-transparent hover:border-gray-100 hover:shadow-sm">
                    <div className="w-6 text-center text-xs font-bold text-gray-300 group-hover:text-primary font-mono transition-colors">
                      <span className="group-hover:hidden">{i + 1}</span>
                      <PlayIcon className="w-3 h-3 hidden group-hover:block mx-auto" />
                    </div>

                    <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden relative shrink-0 shadow-sm ring-1 ring-black/5">
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
                      <p className="text-[13px] font-bold text-black truncate group-hover:text-primary transition-colors leading-tight mb-0.5">{v.title}</p>
                      <p className="text-[10px] text-gray-500 truncate">{v.author}</p>
                    </div>

                    {activeIndex === 1 ? (
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteSong(selectedItem.id, v); }} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all mr-1"><TrashIcon className="w-4 h-4" /></button>
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
          <div className="flex gap-2 w-full">
            <button
              onClick={() => { if (selectedItem) { setVideoPlaylist(selectedItem.playlists); playlistModalRef.current?.close(); } }}
              className="flex-1 btn btn-primary h-11 min-h-0 rounded-xl text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-sm font-bold border-none"
            >
              <PlayIcon className="w-5 h-5 mr-1" /> เล่นทั้งหมด
            </button>

            {activeIndex === 1 && (
              <>
                <button onClick={() => { playlistModalRef.current?.close(); openEditModal(selectedItem!); }} className="btn btn-square btn-ghost h-11 w-11 min-h-0 border border-gray-100 bg-gray-50 hover:bg-white hover:border-gray-200 rounded-xl"><PencilIcon className="w-5 h-5 text-gray-500" /></button>
                <button onClick={() => { if (confirm("ยืนยันการลบ?")) { deletePlaylist(selectedItem!.id); playlistModalRef.current?.close(); } }} className="btn btn-square btn-ghost h-11 w-11 min-h-0 border border-gray-100 bg-gray-50 hover:bg-red-50 hover:border-red-100 hover:text-red-500 rounded-xl"><TrashIcon className="w-5 h-5" /></button>
              </>
            )}
          </div>
        }
      />

      <Alert ref={alertRef} timer={2500} headline="เรียบร้อย" headlineColor="text-green-600" bgColor="bg-green-50" content="บันทึกข้อมูลแล้ว" icon={<HandThumbUpIcon />} />

    </div>
  );
}
