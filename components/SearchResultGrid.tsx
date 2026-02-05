import Image from "next/image";
import { Fragment, useEffect, useRef } from "react";
import VideoThumbnail from "./ui/VideoThumbnail";
import { useQuery } from "react-query";
import { useLocalStorageValue } from "@react-hookz/web";
import { Squares2X2Icon, ListBulletIcon } from "@heroicons/react/24/outline";

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
          className="col-span-full bg-white/50 backdrop-blur-sm sticky top-0 z-10 px-4 py-3 flex justify-between items-center border-b border-gray-100 mb-2 -mx-2 rounded-t-xl"
        >
          <div className="flex items-center gap-2">
            <h2 className="text-sm md:text-base font-bold text-gray-800">ผลการค้นหา</h2>
            <span className="text-[10px] md:text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {renderList.length} รายการ
            </span>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-lg" role="group" aria-label="View mode toggle">
            <button
              onClick={() => setViewMode("grid")}
              title="Grid View"
              aria-label="Switch to grid view"
              aria-pressed={viewMode === "grid"}
              className={`p-1.5 rounded-md transition-all duration-200 ${viewMode === "grid"
                ? "bg-white text-primary shadow-sm scale-100"
                : "text-gray-400 hover:text-gray-600 scale-95"
                }`}
            >
              <Squares2X2Icon className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              title="List View"
              aria-label="Switch to list view"
              aria-pressed={viewMode === "list"}
              className={`p-1.5 rounded-md transition-all duration-200 ${viewMode === "list"
                ? "bg-white text-primary shadow-sm scale-100"
                : "text-gray-400 hover:text-gray-600 scale-95"
                }`}
            >
              <ListBulletIcon className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="col-span-full flex flex-col gap-3 px-1 md:px-2">
          {isLoading && (
            <>
              {getSkeletonItems(8).map((s) => (
                <div
                  key={s}
                  className="bg-gray-200 animate-pulse w-full h-24 rounded-xl"
                />
              ))}
            </>
          )}
          {renderList?.map((rcm, i) => {
            return !rcm ? null : (
              <Fragment key={rcm.videoId}>
                <label htmlFor="modal-video" className="block">
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
                  <div className="card rounded-lg overflow-hidden bg-white shadow cursor-pointer flex flex-col h-full card-hover">
                    <figure className="relative w-full aspect-video flex-shrink-0">
                      <VideoThumbnail
                        src={
                          rcm.videoThumbnails?.find((t) => t.quality === "medium")?.url ||
                          rcm.videoThumbnails?.[0]?.url ||
                          `https://i.ytimg.com/vi/${rcm.videoId}/mqdefault.jpg`
                        }
                        alt={rcm.title}
                        priority={i < 6}
                        className="object-cover"
                      />
                    </figure>
                    <div className="card-body p-2 gap-y-0 flex-1 flex flex-col">
                      <h2 className="font-semibold text-xs sm:text-sm line-clamp-2 flex-1">
                        {rcm.title}
                      </h2>
                      <h2 className="text-xs text-gray-400 truncate">
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
