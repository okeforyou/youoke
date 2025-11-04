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
import { useEffect, useRef, useState } from "react";
import { DebounceInput } from "react-debounce-input";

import {
  BarsArrowUpIcon,
  ListBulletIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/20/solid";
import {
  BookmarkIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  PlusIcon,
  RssIcon,
} from "@heroicons/react/24/outline";

import Alert, { AlertHandler } from "../components/Alert";
import BottomNavigation from "../components/BottomNavigation";
import ListPlaylistsGrid from "../components/ListPlaylistsGrid";
import Modal, { ModalHandler } from "../components/Modal";
import SearchResultGrid from "../components/SearchResultGrid";
import VideoHorizontalCard from "../components/VideoHorizontalCard";
import YoutubePlayer from "../components/YoutubePlayer";
import { CastModeSelector } from "../components/CastModeSelector";
import { useAuth } from "../context/AuthContext";
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
  const { myPlaylist, setMyPlaylist } = useMyPlaylistState();
  const { room, setRoom } = useRoomState();
  const {
    isConnected: isCasting,
    addToQueue: addToCastQueue,
    playNow: castPlayNow,
    playlist: castPlaylist,
    currentIndex: castCurrentIndex,
    removeAt: castRemoveAt,
    moveUp: castMoveUp,
    moveDown: castMoveDown,
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

  function addVideoToPlaylist(video: SearchResult | RecommendedVideo) {
    if (isCasting) {
      // Send to Firebase Cast queue
      console.log('📤 Adding to Cast queue:', video.title);
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
    if (isCasting) {
      // Play now on Cast
      console.log('▶️ Play now on Cast:', video.title);
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
    if (isCasting) {
      // Cast mode: play now
      console.log('⏭️ Skip to on Cast:', video.title);
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
  // When casting, show only upcoming songs (exclude played songs)
  const displayPlaylist = isCasting
    ? (castPlaylist?.slice(castCurrentIndex) || [])
    : playlist;

  const PlaylistScreen = (
    <>
      <div className="flex flex-row font-bold gap-2 items-center">
        {!isMobile && (
          <span className="text-primary text-xs 2xl:text-xl">
            คิวเพลง ( {displayPlaylist?.length || 0} เพลง )
            {isCasting && <span className="text-xs ml-1">📺</span>}
          </span>
        )}

        {/* Cast to TV Button */}
        {!!user.uid && !isCasting && playlist.length > 0 && (
          <div className="ml-2">
            <button
              onClick={() => setShowCastModeSelector(true)}
              className="btn btn-sm btn-primary gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 3H3c-1.1 0-2 .9-2 2v3h2V5h18v14h-7v2h7c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM1 18v3h3c0-1.66-1.34-3-3-3zm0-4v2c2.76 0 5 2.24 5 5h2c0-3.87-3.13-7-7-7zm0-4v2c4.97 0 9 4.03 9 9h2c0-6.08-4.93-11-11-11z" />
              </svg>
              Cast to TV
            </button>
          </div>
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
        <div className="grid grid-cols-1 gap-2">
          {displayPlaylist?.map((video, videoIndex) => {
            // When casting, calculate real index in full queue (not sliced display)
            const realIndex = isCasting ? videoIndex + castCurrentIndex : videoIndex;

            return (
            <VideoHorizontalCard
              key={videoIndex}
              video={video}
              onPlayNow={() => skipVideoTo(video, realIndex)}
              onSelect={() => priorityVideo(video, realIndex)}
              onDelete={() => {
                if (isCasting) {
                  castRemoveAt(realIndex);
                } else {
                  setPlaylist(playlist.filter((_, index) => index !== realIndex));
                }
              }}
              onMoveUp={() => {
                if (isCasting) {
                  castMoveUp(realIndex);
                } else if (videoIndex > 0) {
                  const newPlaylist = [...playlist];
                  [newPlaylist[videoIndex - 1], newPlaylist[videoIndex]] = [
                    newPlaylist[videoIndex],
                    newPlaylist[videoIndex - 1],
                  ];
                  setPlaylist(newPlaylist);
                }
              }}
              onMoveDown={() => {
                if (isCasting) {
                  castMoveDown(realIndex);
                } else if (videoIndex < playlist.length - 1) {
                  const newPlaylist = [...playlist];
                  [newPlaylist[videoIndex], newPlaylist[videoIndex + 1]] = [
                    newPlaylist[videoIndex + 1],
                    newPlaylist[videoIndex],
                  ];
                  setPlaylist(newPlaylist);
                }
              }}
              canMoveUp={videoIndex > 0}
              canMoveDown={videoIndex < displayPlaylist.length - 1}
            />
            );
          })}
        </div>
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
                      {playlist?.length || 0}
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
            {isCasting ? (
              // Show remote control UI when casting
              <>
                {/* Mobile: Just show Cast status card (don't block UI) */}
                <div className="flex sm:hidden flex-col flex-1 bg-primary/10 p-4 items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📺</div>
                    <h2 className="text-2xl font-bold mb-2">กำลัง Cast ไปทีวี</h2>
                    <p className="text-sm text-gray-600 mb-4">
                      เพลงกำลังเล่นบนทีวี
                    </p>
                    <label
                      htmlFor="modal-playlist"
                      className="btn btn-primary btn-sm"
                    >
                      ดูคิวเพลง ({displayPlaylist?.length || 0})
                    </label>
                  </div>
                </div>

                {/* Desktop: Show full playlist */}
                <div className="hidden sm:flex flex-col flex-1 bg-primary/10 p-4">
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-2">📺</div>
                    <h2 className="text-xl font-bold">กำลัง Cast ไปทีวี</h2>
                    <p className="text-sm text-gray-600 mt-2">
                      เพลงกำลังเล่นบนทีวี
                    </p>
                  </div>
                  <div className="flex-1 overflow-y-scroll">
                    {PlaylistScreen}
                  </div>
                </div>
              </>
            ) : (
              // Show regular player when not casting
              <>
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
              </>
            )}
          </div>
        </div>
      </main>

      {/* Cast Mode Selector Modal */}
      <CastModeSelector
        isOpen={showCastModeSelector}
        onClose={() => setShowCastModeSelector(false)}
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
        onSelectYouTube={() => {
          setShowCastModeSelector(false);
          // Generate YouTube URL and open it
          const videoIds = playlist.map(v => v.videoId).join(',');
          const youtubeURL = `https://www.youtube.com/watch_videos?video_ids=${videoIds}`;
          console.log('📱 Opening YouTube app:', youtubeURL);
          window.open(youtubeURL, '_blank');
        }}
      />
    </div>
  );
}

export default HomePage;
