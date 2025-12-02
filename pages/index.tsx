import {
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
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import {
  BarsArrowUpIcon,
  ListBulletIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/20/solid";
import {
  BookmarkIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ClipboardDocumentIcon,
  PlusIcon,
  ShareIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import Alert, { AlertHandler } from "../components/Alert";
import BottomNavigation from "../components/BottomNavigation";
import ListPlaylistsGrid from "../components/ListPlaylistsGrid";
import Modal, { ModalHandler } from "../components/Modal";
import SearchResultGrid from "../components/SearchResultGrid";
import VideoHorizontalCard from "../components/VideoHorizontalCard";
import { DraggablePlaylistItem } from "../components/DraggablePlaylistItem";
import YoutubePlayer from "../components/YoutubePlayer";
import { CastModeSelector } from "../components/CastModeSelector";
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

const ListSingerGrid = dynamic(() => import("../components/ListSingerGrid"), {
  loading: () => <div>Loading...</div>,
});
const ListTopicsGrid = dynamic(() => import("../components/ListTopicsGrid"), {
  loading: () => <div>Loading...</div>,
});

function HomePage() {
  const {
    playlist,
    curVideoId,
    searchTerm,
    isKaraoke,
    activeIndex,
    setPlaylist,
    setCurVideoId,
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
  } = useCast();
  const { myPlaylist, setMyPlaylist } = useMyPlaylistState();
  const { room, setRoom } = useRoomState();
  const {
    isConnected: isCasting,
    addToQueue: addToCastQueue,
    playNow: castPlayNow,
    playlist: castPlaylist,
    currentIndex: castCurrentIndex,
    removeAt: castRemoveAt,
    setPlaylist: setCastPlaylist,
  } = useFirebaseCast();

  const {
    setPlaylist: setYouTubeCastPlaylist,
  } = useYouTubeCast();

  const isMobile = useIsMobile();

  const addPlaylistModalRef = useRef<ModalHandler>(null);
  const alertRef = useRef<AlertHandler>(null);

  const [selectedVideo, setSelectedVideo] = useState<
    SearchResult | RecommendedVideo
  >();
  const [hasSyncedPlaylist, setHasSyncedPlaylist] = useState(false);
  const [showCastModeSelector, setShowCastModeSelector] = useState(false);

  // Share Room states
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [baseUrl, setBaseUrl] = useState<string>('');

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
      setPlaylist(playlist?.concat([{ key: new Date().getTime(), ...video }]));
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
      // Local play now
      if (!curVideoId) setCurVideoId(video.videoId);
      const newPlaylist = playlist?.filter((_, index) => index !== videoIndex);
      setPlaylist([{ key: new Date().getTime(), ...video }, ...newPlaylist]);
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
      // Local mode
      setCurVideoId(video.videoId);
      setPlaylist(playlist?.slice(videoIndex + 1));
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

  const addVideoToMyPlaylist = async (key, data) => {
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

    const oldIndex = parseInt(active.id.toString());
    const newIndex = parseInt(over.id.toString());

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
      // Local playlist - reorder
      // For local mode, curVideoId is used (not index-based), so no index update needed
      const newPlaylist = arrayMove(playlist, oldIndex, newIndex);
      setPlaylist(newPlaylist);
    }
  };

  const PlaylistScreen = (
    <>
      <div className="flex flex-row font-bold gap-2 items-center">
        {!isMobile && (
          <span className="text-primary text-xs 2xl:text-xl">
            คิวเพลง ( {displayPlaylist?.length || 0} เพลง )
            {(isGoogleCastConnected || isCasting) && <span className="text-xs ml-1">📺</span>}
          </span>
        )}

        {/* Share Room button - only show when casting to Monitor */}
        {isCasting && !isGoogleCastConnected && (
          <button
            onClick={() => setShowShareModal(true)}
            className="btn btn-xs btn-ghost text-primary gap-1"
            title="แชร์ห้องให้เพื่อน"
          >
            <ShareIcon className="w-4 h-4" />
            <span className="hidden lg:inline">แชร์</span>
          </button>
        )}

        {!displayPlaylist?.length ? null : (
          <div className="dropdown dropdown-end ml-auto">
            <label
              tabIndex={0}
              className="btn btn-xs btn-ghost text-error 2xl:text-xl p-0"
            >
              ลบทั้งหมด
            </label>
            <div
              tabIndex={0}
              className="card compact dropdown-content shadow bg-white ring-1 ring-primary rounded-box w-60"
            >
              <div className="card-body">
                <h2 className="card-title text-sm 2xl:text-xl">
                  แน่ใจว่าต้องการลบเพลงทั้งหมด ?
                </h2>
                <div className="card-actions justify-end">
                  <button
                    className="btn btn-xs btn-ghost text-primary 2xl:text-xl"
                    onClick={() => {
                      if (isCasting) {
                        setCastPlaylist([]);
                      } else {
                        setPlaylist([]);
                      }
                    }}
                  >
                    ลบเลย
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={`flex-shrink-0  pt-2 pb-12  `}>
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={displayPlaylist?.map((_, index) => index.toString()) || []}
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

                return (
                  <DraggablePlaylistItem
                    key={videoIndex}
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
                        // Local playback - use real index
                        setPlaylist(playlist.filter((_, index) => index !== realIndex));
                      }
                    }}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </>
  );

  return (
    <div className="text-sm 2xl:text-xl w-full max-h-screen overflow-hidden">
      <main className="bg-base-300 h-full">
        <div className="relative flex flex-col sm:flex-row h-screen overflow-hidden">
          {/* START Recommend Videos List */}
          <div className="order-2 sm:order-1 flex flex-col h-full w-full overflow-hidden border-gray-300 sm:border-solid border-r border-none">
            <div className="flex flex-col h-full overflow-hidden relative">
              {/* START Search Bar */}
              <div className="flex flex-row gap-2 p-1 justify-between items-center bg-primary">
                {/* START Search Input */}
                <div className="form-control flex-1">
                  <div className="input-group">
                    <span className="px-2 sm:px-4">
                      <MagnifyingGlassIcon className="w-6 h-6" />
                    </span>
                    <DebounceInput
                      type="search"
                      placeholder="ค้นหาเพลง"
                      className="input w-full appearance-none rounded-l xl:text-xl"
                      value={searchTerm}
                      debounceTimeout={5000}
                      onChange={(ev) => setSearchTerm(ev.target.value)}
                      inputMode="search"
                    />
                  </div>
                </div>
                {/* END Search Input */}
                {/* START Karaoke Switch */}
                <div className="form-control w-26 lg:w-32 2xl:w-32">
                  <label className="cursor-pointer label flex-col lg:flex-row gap-1 justify-start">
                    <input
                      type="checkbox"
                      className="toggle toggle-primary toggle-sm"
                      checked={isKaraoke}
                      onChange={(e) => setIsKaraoke(e.target.checked)}
                    />
                    <span className="label-text text-primary-content ml-2 text-xs 2xl:text-base ">
                      {isKaraoke ? "คาราโอเกะ" : "เพลง"}
                    </span>
                  </label>
                </div>
                {/* END Karaoke Switch */}
                <label
                  htmlFor="modal-playlist"
                  className="btn btn-ghost text-primary-content flex-col gap-1 w-20 p-0 sm:hidden"
                >
                  <div className="relative">
                    <ListBulletIcon className="h-6 w-6" />
                    <span className="badge absolute -top-2 -right-2 text-xs p-1">
                      {displayPlaylist?.length || 0}
                    </span>
                  </div>
                  <span className="text-[10px] leading-none">คิวเพลง</span>
                </label>
              </div>
              {/* END Search Bar */}
              {/* Recommend Videos List */}
              <div
                className={`relative grid grid-cols-2 xl:grid-cols-3 auto-rows-min gap-2 w-full h-screen p-2 pb-20   ${scrollbarCls}`}
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
              <label
                htmlFor="modal-playlist"
                className="modal modal-bottom sm:modal-middle cursor-pointer"
              >
                <label
                  className="flex flex-col modal-box max-h-[50%] overflow-hidden bg-base-300 p-2"
                  htmlFor=""
                >
                  <div className="relative h-full overflow-y-auto flex flex-col">
                    {PlaylistScreen}
                  </div>
                </label>
              </label>
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
                  className="modal-box relative px-2 py-4 pb-12 sm:p-4"
                  htmlFor=""
                >
                  <div className="card gap-2 min-h-min">
                    <h2 className="card-title text-sm 2xl:text-2xl">
                      {selectedVideo?.title}
                    </h2>
                    <figure className="relative w-full aspect-video">
                      <Image
                        unoptimized
                        src={`${process.env.NEXT_PUBLIC_INVIDIOUS_URL}vi/${selectedVideo?.videoId}/mqdefault.jpg`}
                        priority
                        alt={selectedVideo?.title}
                        layout="fill"
                        className="bg-gray-400"
                      />
                    </figure>
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
                            onClick={(e) => {
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
                    <div className="pb-4">{selectedVideo?.title}</div>
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
            </div>

            <BottomNavigation />
          </div>

          {/* END Recommend Videos List */}
          {/* Video Player */}
          <div className="relative order-1 sm:order-2 w-full flex flex-row sm:flex-col flex-grow flex-shrink-0 sm:max-w-[50vw] lg:max-w-[50vw] 2xl:max-w-[50vw] sm:min-w-[400px] sm:h-screen overflow-hidden">
            {/* Always show YoutubePlayer - it handles both local and cast modes */}
            <YoutubePlayer
              videoId={curVideoId}
              nextSong={() => setCurVideoId("")}
              className="flex flex-col flex-1 sm:flex-grow-0"
            />
            <div
              className={`max-h-full w-full p-2 overflow-y-scroll hidden sm:flex flex-col ${scrollbarCls}`}
            >
              {PlaylistScreen}
            </div>
          </div>
        </div>
      </main>

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
        onSelectDual={() => {
          setShowCastModeSelector(false);
          // Open dual screen in new tab
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

      {/* Share Room Modal */}
      {showShareModal && (
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
      )}
    </div>
  );
}

export default HomePage;
