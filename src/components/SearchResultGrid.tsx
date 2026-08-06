import Image from "next/image";
import { useRouter } from "next/router";
import { Fragment, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocalStorageValue } from "@react-hookz/web";
import { Squares2X2Icon, ListBulletIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { PlusIcon } from "@heroicons/react/24/solid";
import { ListPlus } from "lucide-react";

import { useShallow } from 'zustand/react/shallow';
import { usePlayerStore } from "../modules/player/stores/usePlayerStore";
import { RecommendedVideo, SearchResult } from "../types/invidious";
import { getSearchResult, getSkeletonItems, getVideoInfo } from "../utils/api";
import SearchResultHorizontalCard from "./SearchResultHorizontalCard";
import AddToPlaylistModal from "./AddToPlaylistModal";
import { Sparkles } from "lucide-react";
import { useUIStore } from "../stores/useUIStore";
import { useAIVocalStore } from "../stores/useAIVocalStore";

export default function SearchResultGrid({
  onClick = () => { },
}: {
  onClick?: (video: SearchResult | RecommendedVideo) => void;
}) {
  const { searchTerm, curVideoId, isKaraoke, searchMode } = usePlayerStore(
    useShallow(state => ({
      searchTerm: state.searchTerm,
      curVideoId: state.currentSource,
      isKaraoke: state.isKaraoke,
      searchMode: state.searchMode || 'karaoke'
    }))
  );
  const prefix = searchMode === 'karaoke' ? '"karaoke" ' : (searchMode === 'ai_karaoke' ? 'official audio ' : "");


  const router = useRouter();
  const [selectedVideoForPlaylist, setSelectedVideoForPlaylist] = useState<SearchResult | RecommendedVideo | null>(null);

  const divRef = useRef(null);

  // View mode: 'list' or 'grid'
  const { value: viewMode, set: setViewMode } = useLocalStorageValue<"list" | "grid">(
    "search-view-mode",
    { defaultValue: "grid" }
  );

  const handleDivScroll = () => {
    // Scroll to top of the main content container reliably
    const mainContent = document.getElementById("main-content");
    if (mainContent) {
      mainContent.scrollTo({ top: 0, behavior: 'instant' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const titleIncludesKaraoke = ({ title }: { title: string }) => {
    const lcTitle = title.toLowerCase();
    return (
      lcTitle.includes("karaoke") ||
      lcTitle.includes("beat") ||
      lcTitle.includes("คาราโอเกะ")
    );
  };

  const { data: recommendedVideos, isLoading: infoLoading } = useQuery({
    queryKey: ["videoInfo", curVideoId],
    queryFn: () => getVideoInfo(curVideoId || ""),
    enabled: !searchTerm.length && !!curVideoId,
    select: ({ recommendedVideos }) => {
      return recommendedVideos;
    },
  });

  const { data: searchResults, isFetching: searchLoading } = useQuery({
    queryKey: ["searchResult", prefix + searchTerm],
    queryFn: () => getSearchResult({ q: prefix + searchTerm }),
    select: (results) => {
      return results;
    },
  });

  const isLoading = searchLoading || infoLoading;
  const renderList =
    searchTerm || !recommendedVideos?.length
      ? searchResults
      : recommendedVideos;

  const checkCachedStatus = useAIVocalStore(state => state.checkCachedStatus);

  useEffect(() => {
    handleDivScroll();
    
    if (renderList && renderList.length > 0) {
      checkCachedStatus(renderList.map(v => v.videoId));
    }
  }, [renderList, checkCachedStatus]);

  const handleAddToPlaylist = (e: React.MouseEvent, video: SearchResult | RecommendedVideo) => {
    e.stopPropagation();
    setSelectedVideoForPlaylist(video);
  };

  const handleExtractVocals = (e: React.MouseEvent, video: SearchResult | RecommendedVideo) => {
    e.stopPropagation();
    const newUuid = crypto.randomUUID();
    usePlayerStore.getState().addToQueue({
      uuid: newUuid,
      id: video.videoId,
      videoId: video.videoId,
      title: video.title,
      author: video.author || 'Unknown',
      thumbnail: video.videoThumbnails?.[0]?.url,
      sourceType: 'youtube'
    });
    
    useUIStore.getState().showVocalModeModal(newUuid, video.videoId);
  };

  return (
    <>
      {/* Header with Grid/List Toggle */}
      {renderList && renderList.length > 0 && (
        <div
          ref={divRef}
          className="scroll-mt-24 col-span-full bg-transparent px-2 pt-2 pb-2 flex justify-between items-center"
        >
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (router.query.search) {
                  router.back();
                } else {
                  usePlayerStore.setState({ searchTerm: '' });
                }
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
              title="ย้อนกลับ"
            >
              <ArrowLeftIcon className="w-5 h-5 text-gray-700 dark:text-zinc-400" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">ผลการค้นหา</h2>
          </div>

          <div className="flex gap-1">
            <button
              onClick={() => setViewMode("grid")}
              title="Grid View"
              className={`p-2 rounded transition-all ${viewMode === "grid"
                ? "text-gray-900 dark:text-white opacity-100"
                : "text-gray-500 dark:text-zinc-600 opacity-75 hover:opacity-90"
                }`}
            >
              <Squares2X2Icon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              title="List View"
              className={`p-2 rounded transition-all ${viewMode === "list"
                ? "text-gray-900 dark:text-white opacity-100"
                : "text-gray-500 dark:text-zinc-600 opacity-75 hover:opacity-90"
                }`}
            >
              <ListBulletIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="col-span-full flex flex-col gap-2">
          {isLoading && (
            <>
              {getSkeletonItems(8).map((s) => (
                <div
                  key={s}
                  className="bg-gray-300 dark:bg-zinc-800 animate-pulse w-full h-16 rounded"
                />
              ))}
            </>
          )}
          {renderList?.map((rcm, i) => {
            return !rcm ? null : (
              <Fragment key={rcm.videoId}>
                <div onClick={() => onClick(rcm)} className="cursor-pointer active:scale-[0.98] transition-transform">
                  <SearchResultHorizontalCard
                    video={rcm}
                    onClick={() => { }} // Handle click on wrapper
                    onAddToPlaylist={(e) => handleAddToPlaylist(e, rcm)}
                    onExtractVocals={!isKaraoke ? (e) => handleExtractVocals(e, rcm) : undefined}
                  />
                </div>
              </Fragment>
            );
          })}
        </div>
      )}

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="relative grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 col-span-full auto-rows-fr">
          {isLoading && (
            <>
              {getSkeletonItems(16).map((s) => (
                <div
                  key={s}
                  className="card bg-gray-300 dark:bg-zinc-800 animate-pulse w-full aspect-video"
                />
              ))}
            </>
          )}
          {renderList?.map((rcm, i) => {
            return !rcm ? null : (
              <Fragment key={rcm.videoId}>
                {/* The button to open modal */}
                 <div className="group h-full" onClick={() => onClick(rcm)}>
                  <div className="card rounded-lg overflow-hidden bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 hover:border-primary/20 hover:shadow-sm cursor-pointer flex flex-col h-full transition-transform active:scale-[0.98] duration-100 relative">
                    <figure className="relative w-full aspect-video flex-shrink-0">
                      <Image
                        src={
                          rcm.videoThumbnails?.find((t) => t.quality === "medium")?.url ||
                          rcm.videoThumbnails?.[0]?.url ||
                          `https://i.ytimg.com/vi/${rcm.videoId}/mqdefault.jpg`
                        }
                        priority
                        alt={rcm.title}
                        unoptimized
                         layout="fill"
                        className="animate-pulse bg-gray-400 dark:bg-zinc-800 object-cover"
                        onLoad={(ev) => ev.currentTarget.classList.remove("animate-pulse")}
                      />
                      {/* Play Overlay (Visible on Touch/Hover) */}
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-white/90 dark:bg-zinc-800/90 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-black dark:text-white font-bold">▶</span>
                        </div>
                      </div>
                    </figure>
                     <div className="card-body p-2 gap-y-0.5 flex-1 flex flex-col relative pr-8">
                      <h2 className="font-medium text-xs sm:text-[13px] line-clamp-2 flex-1 text-gray-800 dark:text-zinc-200 leading-snug">
                        {rcm.title}
                      </h2>
                      {/* Removed author/uploader info */}

                      {/* Add to Playlist Button for Grid */}
                       <button
                        onClick={(e) => handleAddToPlaylist(e, rcm)}
                        className="absolute right-1 top-2 w-7 h-7 flex items-center justify-center rounded-full bg-gray-50 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 hover:bg-primary hover:text-white transition-colors hover:shadow-md z-10"
                        title="เพิ่มลงเพลย์ลิสต์"
                      >
                        <ListPlus className="w-4 h-4" />
                      </button>


                    </div>
                  </div>
                </div>
              </Fragment>
            );
          })}
        </div>
      )}

      {/* Add To Playlist Modal */}
      {selectedVideoForPlaylist && (
        <AddToPlaylistModal
          video={selectedVideoForPlaylist}
          onClose={() => setSelectedVideoForPlaylist(null)}
        />
      )}
    </>
  );
}
