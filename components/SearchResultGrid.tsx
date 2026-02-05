import Image from "next/image";
import { Fragment, useEffect, useRef } from "react";
import VideoThumbnail from "./ui/VideoThumbnail";
import { useQuery } from "react-query";
import { useLocalStorageValue } from "@react-hookz/web";
import { Squares2X2Icon, ListBulletIcon } from "@heroicons/react/24/outline";
import { PlayIcon } from "@heroicons/react/24/solid";

import { useKaraokeState } from "../hooks/karaoke";
import { RecommendedVideo, SearchResult } from "../types/invidious";
import { getSearchResult, getSkeletonItems, getVideoInfo } from "../utils/api";
import SearchResultHorizontalCard from "./SearchResultHorizontalCard";

export default function SearchResultGrid({
  onClick = () => { },
}: {
  onClick?: (video: SearchResult | RecommendedVideo) => void;
}) {
  const { searchTerm, curVideoId, isKaraoke } = useKaraokeState();
  const prefix = isKaraoke ? '"karaoke" ' : "";

  const divRef = useRef(null);

  // View mode: 'list' or 'grid'
  const { value: viewMode, set: setViewMode } = useLocalStorageValue<"list" | "grid">(
    "search-view-mode",
    { defaultValue: "grid" }
  );

  const handleDivScroll = () => {
    divRef.current?.scrollIntoView();
  };

  const titleIncludesKaraoke = ({ title }) => {
    const lcTitle = title.toLowerCase();
    return (
      lcTitle.includes("karaoke") ||
      lcTitle.includes("beat") ||
      lcTitle.includes("คาราโอเกะ")
    );
  };

  const isValidResult = (video: any) => {
    // Filter out Unknown authors
    if (!video.author || video.author.toLowerCase().includes('unknown')) {
      return false;
    }
    // Filter for Karaoke mode
    if (isKaraoke) {
      return titleIncludesKaraoke(video);
    }
    return true;
  };

  const { data: recommendedVideos, isLoading: infoLoading } = useQuery(
    ["videoInfo", curVideoId],
    () => getVideoInfo(curVideoId),
    {
      enabled: !searchTerm.length && !!curVideoId,
      select: ({ recommendedVideos }) => {
        return recommendedVideos?.filter(isValidResult) || [];
      },
    }
  );

  const { data: searchResults, isFetching: searchLoading } = useQuery(
    ["searchResult", prefix + searchTerm],
    () => getSearchResult({ q: prefix + searchTerm }),
    {
      select: (results) => {
        return results?.filter(isValidResult) || [];
      },
    }
  );

  const isLoading = searchLoading || infoLoading;
  const renderList =
    searchTerm || !recommendedVideos?.length
      ? searchResults
      : recommendedVideos;

  useEffect(() => {
    handleDivScroll();
  }, [renderList]);

  return (
    <>
      {/* Header with Grid/List Toggle */}
      {renderList && renderList.length > 0 && (
        <div
          ref={divRef}
          className="col-span-full bg-transparent px-2 pt-2 pb-2 flex justify-between items-center"
        >
          <h2 className="text-lg font-bold text-white/90 tracking-tight">ผลการค้นหา</h2>
          <div className="flex gap-1" role="group" aria-label="View mode toggle">
            <button
              onClick={() => setViewMode("grid")}
              title="Grid View"
              aria-label="Switch to grid view"
              aria-pressed={viewMode === "grid"}
              className={`p-2 rounded-lg transition-all ${viewMode === "grid"
                ? "text-[#FF0000] bg-white/10 shadow-[0_0_15px_rgba(255,0,0,0.1)]"
                : "text-white/40 hover:text-white/60 hover:bg-white/5"
                }`}
            >
              <Squares2X2Icon className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              title="List View"
              aria-label="Switch to list view"
              aria-pressed={viewMode === "list"}
              className={`p-2 rounded-lg transition-all ${viewMode === "list"
                ? "text-[#FF0000] bg-white/10 shadow-[0_0_15px_rgba(255,0,0,0.1)]"
                : "text-white/40 hover:text-white/60 hover:bg-white/5"
                }`}
            >
              <ListBulletIcon className="w-5 h-5" aria-hidden="true" />
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
                  className="bg-gray-300 animate-pulse w-full h-16 rounded"
                />
              ))}
            </>
          )}
          {renderList?.map((rcm, i) => {
            return !rcm ? null : (
              <Fragment key={rcm.videoId}>
                <label htmlFor="modal-video">
                  <SearchResultHorizontalCard
                    video={rcm}
                    onClick={() => onClick(rcm)}
                  />
                </label>
              </Fragment>
            );
          })}
        </div>
      )}

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="relative grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 gap-2 col-span-full auto-rows-fr">
          {isLoading && (
            <>
              {getSkeletonItems(16).map((s) => (
                <div
                  key={s}
                  className="card bg-gray-300 animate-pulse w-full aspect-video"
                />
              ))}
            </>
          )}
          {renderList?.map((rcm, i) => {
            return !rcm ? null : (
              <Fragment key={rcm.videoId}>
                {/* The button to open modal */}
                <label htmlFor="modal-video" onClick={() => onClick(rcm)}>
                  <div className="group card rounded-xl overflow-hidden bg-white/5 backdrop-blur-md border border-white/5 cursor-pointer flex flex-col h-full transition-all duration-500 hover:bg-white/10 hover:border-[#FF0000]/30 hover:shadow-[0_10px_30px_rgba(255,0,0,0.1)] hover:-translate-y-1">
                    <figure className="relative w-full aspect-video flex-shrink-0 overflow-hidden">
                      <VideoThumbnail
                        src={
                          rcm.videoThumbnails?.find((t) => t.quality === "medium")?.url ||
                          rcm.videoThumbnails?.[0]?.url ||
                          `https://i.ytimg.com/vi/${rcm.videoId}/mqdefault.jpg`
                        }
                        alt={rcm.title}
                        priority={i < 6}
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-[#FF0000] flex items-center justify-center shadow-lg shadow-[#FF0000]/40 scale-0 group-hover:scale-100 transition-transform duration-500 delay-100">
                          <PlayIcon className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </figure>
                    <div className="card-body p-3 gap-y-0.5 flex-1 flex flex-col bg-transparent">
                      <h2 className="font-bold text-xs sm:text-sm line-clamp-2 flex-1 text-white/90 group-hover:text-[#FF0000] transition-colors duration-300">
                        {rcm.title}
                      </h2>
                      <h2 className="text-[10px] sm:text-xs text-white/40 truncate font-semibold">
                        {rcm.author}
                      </h2>
                    </div>
                  </div>
                </label>
              </Fragment>
            );
          })}
        </div>
      )}
    </>
  );
}
