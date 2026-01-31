import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState, useMemo } from "react";
import { DebounceInput } from "react-debounce-input";
import { useDualScreenSender } from "../hooks/useDualScreenSender";
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import YouTube from 'react-youtube';

import {
  BarsArrowUpIcon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  PlayIcon,
  PauseIcon,
  ArrowUturnLeftIcon,
  SpeakerWaveIcon,
  ForwardIcon,
} from "@heroicons/react/20/solid";
import {
  ArrowsPointingOutIcon,
  BookmarkIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ClipboardDocumentIcon,
  MicrophoneIcon,
  MusicalNoteIcon,
  PlusIcon,
  ShareIcon,
  XMarkIcon,
  TvIcon,
  DevicePhoneMobileIcon,
} from "@heroicons/react/24/outline";

import Alert, { AlertHandler } from "../components/Alert";
import BottomNavigation from "../components/BottomNavigation";
import Modal, { ModalHandler } from "../components/Modal";
import { DraggablePlaylistItem } from "../components/DraggablePlaylistItem";
import YoutubePlayer from "../components/YoutubePlayer";
import { CastModeSelector } from "../components/CastModeSelector";
import Sidebar from "../components/layout/Sidebar";
import MiniPlayer from "../components/MiniPlayer";

// ⚡ Lazy load SearchResultGrid (only loaded when user searches)
const SearchResultGrid = dynamic(() => import("../components/SearchResultGrid"), {
  loading: () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-gray-200 rounded-lg animate-pulse h-48" />
      ))}
    </div>
  ),
  ssr: false,
});
import { useAuth } from "../context/AuthContext";
import { useCast } from "../context/CastContext";
import { useFirebaseCast } from "../context/FirebaseCastContext";
import { useYouTubeCast } from "../context/YouTubeCastContext";
import { database } from "../firebase";
import useIsMobile from "../hooks/isMobile";
import { useKaraokeState } from "../hooks/karaoke";
import { useMyPlaylistState } from "../hooks/myPlaylist";
import { useRoomState } from "../hooks/room";
import { RecommendedVideo, SearchResult } from "../types/invidious";
import { generateRandomString } from "../utils/random";

// Dynamic imports for components used in tabs/modals (reduces initial bundle)
const ListSingerGrid = dynamic(() => import("../components/ListSingerGrid"), {
  loading: () => <div>Loading...</div>,
});
const ListTopicsGrid = dynamic(() => import("../components/ListTopicsGrid"), {
  loading: () => <div>Loading...</div>,
});
const ListPlaylistsGrid = dynamic(() => import("../components/ListPlaylistsGrid"), {
  loading: () => <div>Loading...</div>,
});
const QRCodeSVG = dynamic(
  () => import('qrcode.react').then((mod) => mod.QRCodeSVG),
  { ssr: false, loading: () => <div className="w-[180px] h-[180px] bg-gray-200 animate-pulse" /> }
);



function HomePage() {
  const {
    playlist,
    curVideoId,
    currentIndex,
    searchTerm,
    isKaraoke,
    activeIndex,
    setPlaylist,
    setCurVideoId,
    setCurrentIndex,
    setSearchTerm,
    setIsKaraoke,
    setActiveIndex,
  } = useKaraokeState();

  const { user } = useAuth();
  const {
    connect: connectGoogleCast,
    setPlaylist: setGoogleCastPlaylist,
    updatePlaylistOrder: updateGoogleCastPlaylistOrder,
    isAvailable: isCastAvailable,
    isConnected: isGoogleCastConnected,
    playlist: googleCastPlaylist,
    currentIndex: googleCastCurrentIndex,
    addToQueue: googleCastAddToQueue,
    playNow: googleCastPlayNow,
    jumpToIndex: googleCastJumpToIndex,
    removeAt: googleCastRemoveAt,
    updateCurrentIndexSilent: updateGoogleCastCurrentIndex,
    connectedRoomCode: googleCastConnectedRoomCode,
  } = useCast();
  const { myPlaylist, setMyPlaylist } = useMyPlaylistState();
  const { room, setRoom } = useRoomState();
  const {
    isConnected: isCasting,
    isHost: isCastHost,
    addToQueue: addToCastQueue,
    playNow: castPlayNow,
    playlist: castPlaylist,
    currentIndex: castCurrentIndex,
    removeAt: castRemoveAt,
    setPlaylist: setCastPlaylist,
    state: castState, // Get full state including controls
    joinRoom, // <--- Add joinRoom here
  } = useFirebaseCast();

  const {
    setPlaylist: setYouTubeCastPlaylist,
  } = useYouTubeCast();

  const isMobile = useIsMobile();

  const addPlaylistModalRef = useRef<ModalHandler>(null);
  const createPlaylistModalRef = useRef<ModalHandler>(null);
  const alertRef = useRef<AlertHandler>(null);

  const [selectedVideo, setSelectedVideo] = useState<
    SearchResult | RecommendedVideo
  >();
  const [newPlaylistData, setNewPlaylistData] = useState({
    name: "",
    type: "ส่วนตัว",
  });

  // Dual Screen Sender (Global)
  useDualScreenSender();
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [hasSyncedPlaylist, setHasSyncedPlaylist] = useState(false);
  const [showCastModeSelector, setShowCastModeSelector] = useState(false);

  // Share Room states
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [baseUrl, setBaseUrl] = useState<string>('');

  // Video Player Modal for mobile
  const [showVideoPlayerModal, setShowVideoPlayerModal] = useState(false);

  // Track XL breakpoint (1280px) for conditional player rendering
  const [isXlScreen, setIsXlScreen] = useState(false);

  // Ensure Host is Authenticated (Anonymous) for Firebase RDB writes
  useEffect(() => {
    const signIn = async () => {
      try {
        const { auth } = await import('../firebase');
        const { signInAnonymously } = await import('firebase/auth');
        if (auth && !auth.currentUser) {
          await signInAnonymously(auth);
          console.log('✅ Host: Signed in anonymously');
        }
      } catch (e) {
        console.error('❌ Host: Auth failed', e);
      }
    };
    signIn();
  }, []);

  // Auto-Join Room when Cast SDK receives Room Code from TV
  useEffect(() => {
    // Check if we have a room code from Cast but NOT yet connected to Firebase Room
    // Or if the codes mismatch (user switched TVs)
    if (isGoogleCastConnected && googleCastConnectedRoomCode) {
      if (!isCasting || room !== googleCastConnectedRoomCode) { // room is the code string
        console.log('🔗 Auto-Joining Firebase Room from Cast Session:', googleCastConnectedRoomCode);
        joinRoom(googleCastConnectedRoomCode, { guestName: user?.displayName || 'Mobile User' }).then(success => {
          if (success) {
            console.log('✅ Auto-Join Successful');
          }
        });
      }
    }
  }, [isGoogleCastConnected, googleCastConnectedRoomCode, isCasting, room]);

  // useRemoteHost logic removed


  useEffect(() => {
    const checkScreenSize = () => {
      setIsXlScreen(window.innerWidth >= 1024); // Revert to LG (Landscape only)
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);



  // Auto-play first song when playlist has items but nothing is playing
  useEffect(() => {
    if (playlist && playlist.length > 0 && !curVideoId) {
      // Play first song
      const firstVideo = playlist[0];
      setCurVideoId(firstVideo.videoId);
      setCurrentIndex(0);
    }
  }, [playlist, curVideoId]);

  // Sync currentIndex when curVideoId changes (in case changed externally)
  useEffect(() => {
    if (curVideoId && playlist && playlist.length > 0) {
      const index = playlist.findIndex(v => v.videoId === curVideoId);
      if (index !== -1 && index !== currentIndex) {
        // Found video at different index, sync it
        setCurrentIndex(index);
      }
    }
  }, [curVideoId, playlist]);

  // Get current video from playlist using currentIndex
  const currentVideo = playlist && currentIndex >= 0 && currentIndex < playlist.length
    ? playlist[currentIndex]
    : null;

  // Helper function to format time (seconds to MM:SS)
  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Playlist navigation functions
  const playNext = () => {
    if (!playlist || playlist.length === 0) return;

    // Create a copy of playlist
    const newPlaylist = [...playlist];

    // Remove the current song (it finished playing)
    if (currentIndex >= 0 && currentIndex < newPlaylist.length) {
      newPlaylist.splice(currentIndex, 1);
    }

    // Update playlist state
    setPlaylist(newPlaylist);

    // Play the song that shifted into the current index (or stop if empty)
    if (currentIndex < newPlaylist.length) {
      const nextVideo = newPlaylist[currentIndex];
      setCurVideoId(nextVideo.videoId);
      // currentIndex stays the same, as the arrays shifted
    } else {
      // Playlist is now empty or we were at the end
      setCurVideoId("");
      if (newPlaylist.length > 0) {
        // Wrap around or fallback
        setCurrentIndex(0);
        setCurVideoId(newPlaylist[0].videoId);
      } else {
        setCurrentIndex(0);
      }
    }
  };

  const playPrevious = () => {
    if (!playlist || playlist.length === 0) return;
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      const prevVideo = playlist[prevIndex];
      setCurVideoId(prevVideo.videoId);
      setCurrentIndex(prevIndex);
    }
  };

  // Mobile player control functions


  useEffect(() => {
    if (!user?.uid) {
      setRoom("");
      return;
    }
    if (room === "") {
      setRoom(generateRandomString(6));
    }
  }, [user?.uid]);

  // Sync local playlist to Cast when connecting
  useEffect(() => {
    if (isCasting && playlist?.length > 0 && !hasSyncedPlaylist) {
      console.log('🔄 Syncing local playlist to Cast:', playlist.length, 'songs');
      setCastPlaylist(playlist);
      setHasSyncedPlaylist(true);
    }

    // Reset sync flag when disconnected
    if (!isCasting) {
      setHasSyncedPlaylist(false);
    }
  }, [isCasting, playlist, hasSyncedPlaylist]);

  // Sync playlist to YouTube Cast
  useEffect(() => {
    if (playlist?.length > 0) {
      setYouTubeCastPlaylist(playlist);
    }
  }, [playlist]);

  // Detect base URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);

  // Share Room function - using castRoom parameter
  const handleCopyShareLink = () => {
    const shareUrl = `${baseUrl}/?castRoom=${room}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  function addVideoToPlaylist(video: SearchResult | RecommendedVideo) {
    console.log('➕ addVideoToPlaylist called:', video.title);

    if (isGoogleCastConnected) {
      // Google Cast (Chromecast) - add to queue
      console.log('📤 Adding to Google Cast queue:', video.title);
      googleCastAddToQueue(video);
    } else if (isCasting) {
      // Firebase Cast (Web Monitor) - add to queue
      console.log('📤 Adding to Firebase Cast queue:', video.title);
      addToCastQueue(video);
    } else {
      // Local playlist
      console.log('📥 Adding to Local playlist. Current length:', playlist?.length);
      const newVideo = { key: new Date().getTime(), ...video };
      setPlaylist(playlist?.concat([newVideo]));
      console.log('✅ Local playlist update scheduled');
    }
  }

  function priorityVideo(
    video: SearchResult | RecommendedVideo,
    videoIndex?: number
  ) {
    if (isGoogleCastConnected) {
      // Google Cast (Chromecast) - play now
      console.log('▶️ Play now on Google Cast:', video.title);
      googleCastPlayNow(video);
    } else if (isCasting) {
      // Firebase Cast (Web Monitor) - play now
      console.log('▶️ Play now on Firebase Cast:', video.title);
      castPlayNow(video);
    } else {
      // Local play now - add to beginning of playlist
      const videoWithKey = { key: new Date().getTime(), ...video };
      const newPlaylist = videoIndex !== undefined
        ? playlist?.filter((_, index) => index !== videoIndex)
        : playlist;
      setPlaylist([videoWithKey, ...newPlaylist]);
      setCurVideoId(video.videoId);
      setCurrentIndex(0); // Playing first item
    }
  }

  function skipVideoTo(
    video: SearchResult | RecommendedVideo,
    videoIndex?: number
  ) {
    if (isGoogleCastConnected) {
      // Google Cast (Chromecast) - jump to video in queue without adding duplicate
      console.log('⏭️ Skip to on Google Cast:', video.title, 'at index:', videoIndex);
      if (videoIndex !== undefined) {
        googleCastJumpToIndex(videoIndex);
      } else {
        // Fallback to playNow if no index provided
        googleCastPlayNow(video);
      }
    } else if (isCasting) {
      // Firebase Cast (Web Monitor) - skip to video
      console.log('⏭️ Skip to on Firebase Cast:', video.title);
      castPlayNow(video);
    } else {
      // Local mode - jump to index in playlist
      if (videoIndex !== undefined) {
        setCurVideoId(video.videoId);
        setCurrentIndex(videoIndex);
      }
    }
  }

  const getMyPlaylists = async () => {
    try {
      const playlistsRef = collection(database, "playlists");
      const q = query(playlistsRef, where("createdBy", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const data = [];
      querySnapshot.forEach((doc) => {
        data.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      setMyPlaylist(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (searchTerm) setActiveIndex(0);
  }, [searchTerm]);

  const addVideoToMyPlaylist = async (key: string, data: SearchResult | RecommendedVideo) => {
    const docRef = doc(database, "playlists", key);
    try {
      await updateDoc(docRef, {
        playlists: arrayUnion(data),
      });
      addPlaylistModalRef?.current.close();
      alertRef?.current.open();
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateNewPlaylist = async () => {
    if (!newPlaylistData.name.trim()) {
      alert("กรุณากรอกชื่อเพลย์ลิสต์");
      return;
    }

    if (isCreatingPlaylist) return; // Prevent multiple clicks

    setIsCreatingPlaylist(true);

    try {
      const playlistsRef = collection(database, "playlists");
      const playlistDoc = {
        name: newPlaylistData.name,
        createdBy: user.uid,
        playlists: [selectedVideo], // เพิ่มเพลงที่เลือกเข้าไปทันที
        type: ["ส่วนตัว", "private"].includes(newPlaylistData.type) ? "private" : "public",
        createdAt: new Date(),
      };

      console.log('🎵 Creating playlist:', newPlaylistData.name);
      await addDoc(playlistsRef, playlistDoc);
      console.log('✅ Playlist created successfully');

      await getMyPlaylists();
      console.log('📝 Playlist list refreshed');

      // Close modals and show success alert
      createPlaylistModalRef.current?.close();
      addPlaylistModalRef.current?.close();
      alertRef?.current?.open();

      console.log('🔔 Modals closed, alert shown');

      // Reset form
      setNewPlaylistData({ name: "", type: "ส่วนตัว" });
    } catch (error) {
      console.error('❌ Error creating playlist:', error);
      alert("เกิดข้อผิดพลาดในการสร้างเพลย์ลิสต์");
    } finally {
      setIsCreatingPlaylist(false);
    }
  };

  const scrollbarCls =
    "scrollbar scrollbar-w-1 scrollbar-thumb-gray-400 hover:scrollbar-thumb-gray-500 scrollbar-track-base-300 scrollbar-thumb-rounded";

  // Use Cast playlist if casting, otherwise local playlist
  // Priority: Google Cast > Firebase Cast > Local
  // Using useMemo to ensure recalculation on Mobile when dependencies change
  const displayPlaylist = useMemo(() => {
    const result = isGoogleCastConnected
      ? (googleCastPlaylist || [])
      : isCasting
        ? (castPlaylist?.slice(castCurrentIndex) || [])
        : playlist;

    // Log inside useMemo to confirm recalculation
    console.log('🔄 [useMemo] displayPlaylist recalculated:', {
      resultLength: result.length,
      isGoogleCastConnected,
      googleCastPlaylistLength: googleCastPlaylist?.length || 0,
      source: isGoogleCastConnected ? 'GoogleCast' : (isCasting ? 'FirebaseCast' : 'Local'),
    });

    return result;
  }, [isGoogleCastConnected, googleCastPlaylist, isCasting, castPlaylist, castCurrentIndex, playlist]);

  // Debug: Log displayPlaylist length
  useEffect(() => {
    console.log('🔍 displayPlaylist updated:', {
      length: displayPlaylist?.length || 0,
      isGoogleCastConnected,
      googleCastPlaylistLength: googleCastPlaylist?.length || 0,
      isCasting,
      castPlaylistLength: castPlaylist?.length || 0,
      localPlaylistLength: playlist?.length || 0,
    });
  }, [displayPlaylist, isGoogleCastConnected, googleCastPlaylist, isCasting, castPlaylist, playlist]);

  // Calculate new current index after drag & drop reordering
  const calculateNewCurrentIndex = (oldIndex: number, newIndex: number, currentIndex: number) => {
    if (oldIndex === currentIndex) {
      // Currently playing item was moved
      return newIndex;
    } else if (oldIndex < currentIndex && newIndex >= currentIndex) {
      // Item moved from before current to after/at current
      // Current shifts left by 1
      return currentIndex - 1;
    } else if (oldIndex > currentIndex && newIndex <= currentIndex) {
      // Item moved from after current to before/at current
      // Current shifts right by 1
      return currentIndex + 1;
    } else {
      // No effect on current
      return currentIndex;
    }
  };

  // Handle drag end - reorder playlist
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    // Find indices based on Unique IDs (keys)
    // Note: displayPlaylist is the source of truth for the displayed list
    const oldIndex = displayPlaylist?.findIndex(v => (v.key ? v.key.toString() : `video-${displayPlaylist.indexOf(v)}`) === active.id) ?? -1;
    const newIndex = displayPlaylist?.findIndex(v => (v.key ? v.key.toString() : `video-${displayPlaylist.indexOf(v)}`) === over.id) ?? -1;

    if (oldIndex === -1 || newIndex === -1) return;

    if (isGoogleCastConnected) {
      // Google Cast - reorder and update current index
      const newPlaylist = arrayMove(googleCastPlaylist, oldIndex, newIndex);
      const newCurrentIndex = calculateNewCurrentIndex(oldIndex, newIndex, googleCastCurrentIndex);

      // Use updatePlaylistOrder instead of setPlaylist to avoid restarting video
      updateGoogleCastPlaylistOrder(newPlaylist);

      // Update current index silently if it changed
      if (newCurrentIndex !== googleCastCurrentIndex) {
        updateGoogleCastCurrentIndex(newCurrentIndex);
      }
    } else if (isCasting) {
      // Firebase Cast - reorder
      const realOldIndex = oldIndex + castCurrentIndex;
      const realNewIndex = newIndex + castCurrentIndex;
      const newPlaylist = arrayMove(castPlaylist, realOldIndex, realNewIndex);

      // Calculate new current index (relative to full playlist)
      const newCurrentIndex = calculateNewCurrentIndex(realOldIndex, realNewIndex, castCurrentIndex);

      setCastPlaylist(newPlaylist);

      // Note: Firebase Cast context doesn't expose updateCurrentIndexSilent yet
      // The receiver will handle index updates via sync
    } else {
      // Local playlist - reorder and update currentIndex
      const newPlaylist = arrayMove(playlist, oldIndex, newIndex);
      const newCurrentIndex = calculateNewCurrentIndex(oldIndex, newIndex, currentIndex);

      setPlaylist(newPlaylist);

      // Update currentIndex if it changed
      if (newCurrentIndex !== currentIndex) {
        setCurrentIndex(newCurrentIndex);
      }
    }
  };

  const PlaylistScreen = (
    <>
      <div className="flex flex-row font-bold gap-2 items-center">
        {!isMobile && (
          <span className="text-gray-900 text-xs 2xl:text-xl">
            คิวเพลง ( {displayPlaylist?.length || 0} เพลง )
            {(isGoogleCastConnected || isCasting) && <span className="text-xs ml-1">📺</span>}
          </span>
        )}

        {/* Share Room button - only show for Owner when casting to Monitor */}
        {isCasting && !isGoogleCastConnected && isCastHost && (
          <button
            onClick={() => setShowShareModal(true)}
            className="btn btn-xs btn-ghost text-primary gap-1"
            title="แชร์ห้องให้เพื่อน"
          >
            <ShareIcon className="w-4 h-4" />
            <span className="hidden lg:inline">แชร์</span>
          </button>
        )}
      </div>

      <div className={`flex-shrink-0 pt-4 pb-12`}>
        {/* Empty state */}
        {(!displayPlaylist || displayPlaylist.length === 0) ? (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <div className="text-center">
              <p className="text-sm">ยังไม่มีรายการคิวเพลง</p>
              <p className="text-xs mt-1">เพิ่มเพลงเพื่อเริ่มเล่น</p>
            </div>
          </div>
        ) : (
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={displayPlaylist?.map((v, i) => v.key ? v.key.toString() : `video-${i}`) || []}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-1 gap-2">
                {displayPlaylist?.map((video, videoIndex) => {
                  // When casting, calculate real index in full queue (not sliced display)
                  // Google Cast: use videoIndex directly (full array)
                  // Firebase Cast: adjust for sliced array
                  const realIndex = isGoogleCastConnected
                    ? videoIndex
                    : isCasting
                      ? videoIndex + castCurrentIndex
                      : videoIndex;

                  // Construct Unique Key safely
                  const uniqueKey = video.key ? video.key.toString() : `video-${videoIndex}`;

                  return (
                    <DraggablePlaylistItem
                      key={uniqueKey}
                      video={video}
                      videoIndex={videoIndex}
                      onPlayNow={() => skipVideoTo(video, realIndex)}
                      onDelete={() => {
                        if (isGoogleCastConnected) {
                          // Google Cast (Chromecast) - use absolute index
                          googleCastRemoveAt(videoIndex);
                        } else if (isCasting) {
                          // Firebase Cast (Web Monitor) - use real index
                          castRemoveAt(realIndex);
                        } else {
                          // Local playback - update playlist and currentIndex
                          setPlaylist(playlist.filter((_, index) => index !== realIndex));

                          // Update currentIndex based on removed position
                          if (realIndex < currentIndex) {
                            // Removed before current - shift index down
                            setCurrentIndex(currentIndex - 1);
                          } else if (realIndex === currentIndex) {
                            // Removed current song - play next (same index)
                            if (playlist.length > 1) {
                              // Has other songs, play next
                              const nextVideo = playlist[currentIndex + 1] || playlist[0];
                              setCurVideoId(nextVideo.videoId);
                            } else {
                              // Last song removed
                              setCurVideoId("");
                              setCurrentIndex(0);
                            }
                          }
                          // else: removed after current, currentIndex stays same
                        }
                      }}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </>
  );

  // Helper for Status Color


  return (
    <div className="flex h-screen overflow-hidden text-sm 2xl:text-xl">
      {/* Sidebar - Desktop Only */}
      <Sidebar
        className="hidden lg:flex"
        activeTab={activeIndex}
        onTabChange={setActiveIndex}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col lg:flex-row bg-base-100 overflow-hidden">
        {/* Content Section (Search + Grid Results) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-base-100">
          <div className="flex flex-col h-full overflow-hidden relative">

            {/* Sticky Top Header Section: Video + Controls + Search */}
            <div className="sticky top-0 z-40 bg-base-100 shadow-sm shrink-0">

              {/* 1. Video Player (Always Top) */}
              {!isXlScreen && curVideoId && (
                <div className="w-full bg-black">
                  <YoutubePlayer
                    videoId={curVideoId}
                    nextSong={playNext}
                    className="w-full"

                  />
                </div>
              )}



              {/* 3. Search Bar (Below Controls) */}
              <div className="flex flex-row gap-3 px-4 py-3 items-center bg-base-200 md:bg-base-100 shadow-sm sticky top-0 z-30">
                {/* Host Connection Status (Remote) - REMOVED (Duplicate) */}

                {/* Search Input */}
                <div className="flex-1 flex items-center gap-2 px-4 py-2 h-11 bg-base-100 border border-base-300 rounded-full hover:border-base-content/30 hover:shadow-sm transition-all">
                  <MagnifyingGlassIcon className="w-5 h-5 text-base-content/60 flex-shrink-0" />
                  <DebounceInput
                    type="search"
                    placeholder="ค้นหาเพลง"
                    className="input input-ghost w-full p-0 h-full min-h-0 text-base xl:text-lg focus:outline-none bg-transparent"
                    value={searchTerm}
                    debounceTimeout={500}
                    onChange={(ev) => setSearchTerm(ev.target.value)}
                    inputMode="search"
                  />
                </div>

                {/* Karaoke Switch (Sliding Segmented Control) */}
                <div
                  className="relative flex items-center h-11 bg-white md:bg-base-200 rounded-full p-1 cursor-pointer select-none w-[110px] md:w-[150px] flex-shrink-0 border border-base-200"
                  onClick={() => setIsKaraoke(!isKaraoke)}
                >
                  {/* Sliding Pill */}
                  <div
                    className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-error md:bg-white rounded-full shadow-sm transition-all duration-300 ease-out ${isKaraoke ? 'left-1 translate-x-full' : 'left-1'
                      }`}
                  />

                  {/* Options Layer */}
                  <div className="relative z-10 flex w-full h-full">
                    {/* Option 1: Song (Left) */}
                    <div className={`flex-1 flex items-center justify-center transition-colors duration-200 ${!isKaraoke ? 'text-white md:text-base-content font-bold' : 'text-base-content/60'}`}>
                      <MusicalNoteIcon className="w-4 h-4 md:hidden" />
                      <span className="hidden md:inline text-xs">เพลง</span>
                    </div>



                    {/* Option 2: Karaoke (Right) */}
                    <div className={`flex-1 flex items-center justify-center transition-colors duration-200 ${isKaraoke ? 'text-white md:text-base-content font-bold' : 'text-base-content/60'}`}>
                      <MicrophoneIcon className="w-4 h-4 md:hidden" />
                      <span className="hidden md:inline text-xs">คาราโอเกะ</span>
                    </div>
                  </div>
                </div>








                {/* Mobile Queue Button */}
                <label htmlFor="modal-playlist" className="btn btn-circle btn-ghost text-base-content sm:hidden relative">
                  <ListBulletIcon className="h-5 w-5" />
                  <span className="badge badge-sm badge-primary absolute -top-1 -right-1 text-[10px] px-1 min-h-0 h-4">
                    {displayPlaylist?.length || 0}
                  </span>
                </label>
              </div>
            </div>

            {/* Content Area */}
            <div
              className={`relative grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 2xl:grid-cols-4 auto-rows-min gap-3 w-full h-screen px-4 py-2 pb-32 lg:pb-4 ${scrollbarCls}`}
              style={{ overflowY: "scroll" }}
            >
              {/* START Video Row Item */}

              {
                [
                  <SearchResultGrid
                    key={0}
                    onClick={(video) => setSelectedVideo(video)}
                  />,
                  <ListSingerGrid key={1} showTab={false} />,
                  <ListTopicsGrid key={2} showTab={false} />,
                  <ListPlaylistsGrid key={3} />,
                ][activeIndex]
              }

              {/* END Video Row Item */}
            </div>
            {/* Put this part before </body> tag */}

            <input
              type="checkbox"
              id="modal-playlist"
              className="modal-toggle"
            />
            <div className="modal modal-bottom sm:modal-middle">
              <div className="flex flex-col modal-box max-h-[50%] w-full max-w-full overflow-hidden bg-base-200 relative px-2 pt-10 pb-2">
                {/* Close button X */}
                <label
                  htmlFor="modal-playlist"
                  className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 z-50"
                >
                  ✕
                </label>

                <div className="relative h-full overflow-y-auto flex flex-col">
                  {PlaylistScreen}
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              id="modal-video"
              className="modal-toggle"
            />
            <label
              htmlFor="modal-video"
              className="modal modal-bottom sm:modal-middle cursor-pointer"
            >
              <label
                className="modal-box relative px-4 py-4 pb-12 sm:p-4 bg-base-100"
                htmlFor=""
              >
                <div className="card gap-3 min-h-min">
                  <figure className="relative w-full aspect-video rounded-lg overflow-hidden">
                    <Image
                      unoptimized
                      src={
                        selectedVideo?.videoThumbnails?.find((t) => t.quality === "medium")?.url ||
                        selectedVideo?.videoThumbnails?.[0]?.url ||
                        `https://i.ytimg.com/vi/${selectedVideo?.videoId}/mqdefault.jpg`
                      }
                      priority
                      alt={selectedVideo?.title}
                      layout="fill"
                      className="bg-gray-400 object-cover"
                    />
                  </figure>
                  <div className="flex flex-col gap-1">
                    <h2 className="font-semibold text-sm 2xl:text-xl line-clamp-2 text-gray-900">
                      {selectedVideo?.title}
                    </h2>
                    <p className="text-xs 2xl:text-base text-gray-600">
                      {selectedVideo?.author}
                    </p>
                  </div>
                  <div className="card-body p-0">
                    <div className="card-actions">
                      <label
                        htmlFor="modal-video"
                        className="btn btn-primary flex-auto gap-2 btn-sm"
                        onClick={() => addVideoToPlaylist(selectedVideo)}
                      >
                        <PlusIcon className="h-4 w-4" />
                        {playlist?.length || !!curVideoId
                          ? "เพิ่มในคิว"
                          : "เล่นเลย"}
                      </label>
                      <label
                        htmlFor="modal-video"
                        className="btn btn-primary flex-auto gap-2 btn-sm"
                        onClick={() => priorityVideo(selectedVideo)}
                      >
                        <BarsArrowUpIcon className="h-4 w-4" />
                        เล่นเป็นคิวแรก
                      </label>
                      {!!user.uid && (
                        <label
                          htmlFor="modal-video"
                          className="btn btn-primary flex-auto gap-2 btn-sm"
                          onClick={() => {
                            addPlaylistModalRef?.current.open();
                          }}
                        >
                          <BookmarkIcon className="h-4 w-4" />
                          เพลย์ลิสต์
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </label>
            </label>
            <Alert
              ref={alertRef}
              timer={2500}
              headline="สำเร็จ"
              headlineColor="text-green-600"
              bgColor="bg-green-100"
              content={<span className="text-sm">เพิ่มเพลย์ลิสต์สำเร็จ</span>}
              icon={<CheckCircleIcon />}
            />
            <Modal
              ref={addPlaylistModalRef}
              title={<>เลือกเพลย์ลิสต์ที่ต้องการ</>}
              body={
                <div className="relative px-8 flex-auto w-96">
                  <div className="pb-4 text-gray-900">{selectedVideo?.title}</div>

                  {/* Create New Playlist Button */}
                  <button
                    className="w-full btn btn-outline btn-primary btn-sm mb-3 gap-2"
                    onClick={() => {
                      createPlaylistModalRef.current.open();
                    }}
                  >
                    <PlusIcon className="w-4 h-4" />
                    สร้างเพลย์ลิสต์ใหม่
                  </button>

                  <div className="border-t border-gray-300 mb-3"></div>

                  <div className="py-2 overflow-y-auto max-h-64">
                    {myPlaylist.map((p, index) => (
                      <label
                        className="label cursor-pointer hover:bg-gray-300 rounded-lg p-2 transition-all duration-150"
                        key={"pl-" + index}
                        onClick={() =>
                          addVideoToMyPlaylist(p.id, selectedVideo)
                        }
                      >
                        <span className="label-text flex items-center gap-2">
                          <ChevronRightIcon className="w-4 h-4" /> {p.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              }
              footer={
                <button
                  className="font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                  onClick={getMyPlaylists}
                >
                  รีเฟรช
                </button>
              }
            />

            {/* Modal สร้างเพลย์ลิสต์ใหม่ */}
            <Modal
              ref={createPlaylistModalRef}
              title={<>สร้างเพลย์ลิสต์</>}
              body={
                <div className="relative p-6 flex-auto w-96 grid gap-2">
                  <input
                    id="new-playlist-name"
                    className="py-3 px-4 block w-full bg-gray-100 rounded-lg text-sm disabled:opacity-50 border-0 disabled:pointer-events-none"
                    placeholder="ชื่อเพลย์ลิสต์"
                    required
                    value={newPlaylistData.name}
                    onChange={(e) => {
                      setNewPlaylistData({
                        ...newPlaylistData,
                        name: e.target.value,
                      });
                    }}
                  />
                  <select
                    className="py-3 px-4 pe-9 block w-full bg-gray-100 border-transparent rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none"
                    value={newPlaylistData.type}
                    onChange={(e) => {
                      setNewPlaylistData({
                        ...newPlaylistData,
                        type: e.target.value,
                      });
                    }}
                  >
                    <option>ส่วนตัว</option>
                    <option>สาธารณะ</option>
                  </select>
                </div>
              }
              footer={
                <button
                  className="text-white btn-primary font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  type="submit"
                  onClick={handleCreateNewPlaylist}
                  disabled={isCreatingPlaylist}
                >
                  {isCreatingPlaylist ? "กำลังสร้าง..." : "สร้าง"}
                </button>
              }
            />
          </div>
        </div>

        {/* END Recommend Videos List */}

        {/* Video Player + Queue Section - Desktop LG+ (iPad Landscape included) */}
        {
          isXlScreen && !showVideoPlayerModal && (
            <aside className="hidden lg:flex lg:w-80 xl:w-96 2xl:w-[450px] flex-col overflow-hidden border-l border-base-300 bg-base-100">
              {/* Video Player */}
              {/* Video Player */}
              <YoutubePlayer
                videoId={curVideoId}
                nextSong={playNext}
                className="flex-shrink-0"

              />

              {/* Queue/Playlist */}
              <div className={`flex-1 w-full px-3 py-2 overflow-y-scroll flex flex-col ${scrollbarCls}`}>
                {PlaylistScreen}
              </div>
            </aside>
          )
        }
      </main >

      {/* Cast Mode Selector Modal */}
      <CastModeSelector
        isOpen={showCastModeSelector}
        onClose={() => setShowCastModeSelector(false)}
        isCastAvailable={isCastAvailable}
        isMobile={isMobile}
        onSelectWebMonitor={() => {
          setShowCastModeSelector(false);
          // Open YoutubePlayer Cast overlay (handled by YoutubePlayer component)
          const castButton = document.querySelector('[data-cast-button]') as HTMLElement;
          if (castButton) castButton.click();
        }}
        onJoinWebMonitor={(code) => {
          setShowCastModeSelector(false);
          // Redirect to remote with room code (Guest Mode)
          window.location.href = `/remote?session=${code}`;
        }}
        onSelectDual={() => {
          setShowCastModeSelector(false);
          // 1. Force set state immediately to prevent race condition
          if (typeof window !== 'undefined') {
            localStorage.setItem('youoke-dual-active', 'true');
            // Create a proper StorageEvent so the listener in YoutubePlayer receives the data
            const event = new StorageEvent('storage', {
              key: 'youoke-dual-active',
              newValue: 'true',
              storageArea: localStorage,
            });
            window.dispatchEvent(event);
          }
          window.open('/dual', '_blank');
        }}
        onSelectGoogleCast={() => {
          setShowCastModeSelector(false);
          // Set playlist and connect to Chromecast
          setGoogleCastPlaylist(playlist);
          connectGoogleCast();
          console.log('📡 Google Cast: Connecting to Chromecast...');
        }}
        onSelectYouTube={() => {
          setShowCastModeSelector(false);
          // Generate YouTube URL and open it
          const videoIds = playlist.map(v => v.videoId).join(',');
          const youtubeURL = `https://www.youtube.com/watch_videos?video_ids=${videoIds}`;
          console.log('📱 Opening YouTube app:', youtubeURL);
          window.open(youtubeURL, '_blank');
        }}
      />

      {/* Remote QR Modal */}


      {/* Share Room Modal */}
      {
        showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">แชร์ห้องให้เพื่อน</h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 space-y-4">
                <p className="text-sm text-gray-600">
                  แชร์ลิงก์นี้ให้เพื่อนๆ เพื่อให้เข้าร่วมห้องและควบคุม Monitor ด้วยกันได้
                </p>

                {/* QR Code */}
                {baseUrl && room && (
                  <div className="flex justify-center">
                    <div className="bg-white p-4 rounded-lg shadow-md">
                      <QRCodeSVG
                        value={`${baseUrl}/?castRoom=${room}`}
                        size={180}
                        level="M"
                      />
                    </div>
                  </div>
                )}

                {/* Share Link */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${baseUrl}/?castRoom=${room}`}
                      className="input input-sm input-bordered flex-1 text-xs bg-white"
                    />
                    <button
                      onClick={handleCopyShareLink}
                      className="btn btn-sm btn-primary gap-1"
                    >
                      {copiedLink ? (
                        <>
                          <CheckCircleIcon className="w-4 h-4" />
                          คัดลอกแล้ว
                        </>
                      ) : (
                        <>
                          <ClipboardDocumentIcon className="w-4 h-4" />
                          คัดลอก
                        </>
                      )}
                    </button>
                  </div>

                  <div className="text-xs text-gray-500 text-center">
                    รหัสห้อง: <span className="font-mono font-bold text-primary text-lg">{room}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t bg-gray-50 rounded-b-lg">
                <p className="text-xs text-gray-600">
                  ⚠️ ลิงก์นี้จะให้ผู้อื่นควบคุม Monitor ของคุณได้ กรุณาแชร์ให้เฉพาะคนที่ไว้ใจ
                </p>
              </div>
            </div>
          </div>
        )
      }

      {/* Mobile Video Player - Removed (Now handled by Top Sticky Header) */}
      {/* Block removed to prevent double audio/rendering */}

      {/* Mini Player - Disabled for Mobile Top Player Layout */}
      {/* {!isXlScreen && curVideoId && currentVideo && (
        <MiniPlayer
          currentVideo={currentVideo}
          hasNext={currentIndex < playlist.length - 1}
          hasPrevious={currentIndex > 0}
          isPlaying={isPlaying}
          progress={progress}
          currentTime={currentTime}
          duration={duration}
          onPlayPause={handleMobilePlayPause}
          onNext={playNext}
          onPrevious={playPrevious}
          onOpenQueue={() => {
            const modal = document.getElementById('modal-playlist') as HTMLInputElement;
            if (modal) modal.checked = true;
          }}
          onExpand={() => {
            setShowVideoPlayerModal(true);
          }}
        />
      )} */}

      {/* Bottom Navigation - Mobile Only */}
      <BottomNavigation />
    </div >
  );
}

export default HomePage;
