import Image from "next/image";
import { Fragment, useEffect, useRef } from "react";
import { useQuery } from "react-query";
import { useLocalStorageValue } from "@react-hookz/web";
import { Squares2X2Icon, ListBulletIcon } from "@heroicons/react/24/outline";

import { useKaraokeState } from "../hooks/karaoke";
import { RecommendedVideo, SearchResult } from "../types/invidious";
import { getSearchResult, getSkeletonItems, getVideoInfo } from "../utils/api";
import SearchResultHorizontalCard from "./SearchResultHorizontalCard";

export default function SearchResultGrid({
  onClick = () => {},
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

  const { data: recommendedVideos, isLoading: infoLoading } = useQuery(
    ["videoInfo", curVideoId],
    () => getVideoInfo(curVideoId),
    {
      enabled: !searchTerm.length && !!curVideoId,
      select: ({ recommendedVideos }) => {
        if (isKaraoke) {
          return recommendedVideos.filter(titleIncludesKaraoke);
        }

        return recommendedVideos;
      },
    }
  );

  const { data: searchResults, isFetching: searchLoading } = useQuery(
    ["searchResult", prefix + searchTerm],
    () => getSearchResult({ q: prefix + searchTerm }),
    {
      select: (results) => {
        if (isKaraoke) {
          return results.filter(titleIncludesKaraoke);
        }

        return results;
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
          className="col-span-full bg-transparent px-2 pt-2 pb-2 flex justify-end items-center"
        >
          <div className="flex gap-1">
            <button
              onClick={() => setViewMode("grid")}
              title="Grid View"
              className={`p-2 rounded transition-all ${
                viewMode === "grid"
                  ? "text-gray-900 opacity-100"
                  : "text-gray-500 opacity-75 hover:opacity-90"
              }`}
            >
              <Squares2X2Icon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              title="List View"
              className={`p-2 rounded transition-all ${
                viewMode === "list"
                  ? "text-gray-900 opacity-100"
                  : "text-gray-500 opacity-75 hover:opacity-90"
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
        <div className="relative grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 col-span-full">
          {isLoading && (
            <>
              {getSkeletonItems(16).map((s) => (
                <div
                  key={s}
                  className="card bg-gray-300 animate-pulse w-full aspect-w-4 aspect-h-3"
                />
              ))}
            </>
          )}
          {renderList?.map((rcm, i) => {
            return !rcm ? null : (
              <Fragment key={rcm.videoId}>
                {/* The button to open modal */}
                <label htmlFor="modal-video" onClick={() => onClick(rcm)}>
                  <div className="card rounded-lg overflow-hidden bg-white shadow hover:shadow-md cursor-pointer flex-auto transition-shadow">
                    <figure className="relative w-full aspect-square">
                      <Image
                        unoptimized
                        src={
                          rcm.videoThumbnails?.find((t) => t.quality === "medium")?.url ||
                          rcm.videoThumbnails?.[0]?.url ||
                          `https://i.ytimg.com/vi/${rcm.videoId}/mqdefault.jpg`
                        }
                        priority
                        alt={rcm.title}
                        layout="fill"
                        className="animate-pulse bg-gray-400"
                        onLoad={(ev) => ev.currentTarget.classList.remove("animate-pulse")}
                      />
                    </figure>
                    <div className="card-body p-2 gap-y-0">
                      <h2 className="font-semibold text-sm 2xl:text-lg line-clamp-2">
                        {rcm.title}
                      </h2>
                      <h2 className="text-xs 2xl:text-lg text-gray-400">
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
