import Image from "next/image";
import { Fragment, useEffect, useRef } from "react";
import { useQuery } from "react-query";

import { useKaraokeState } from "../hooks/karaoke";
import { RecommendedVideo, SearchResult } from "../types/invidious";
import { getSearchResult, getSkeletonItems, getVideoInfo } from "../utils/api";

export default function SearchResultGrid({
  onClick = () => {},
}: {
  onClick?: (video: SearchResult | RecommendedVideo) => void;
}) {
  const { searchTerm, curVideoId, isKaraoke } = useKaraokeState();
  const prefix = isKaraoke ? '"karaoke" ' : "";

  const divRef = useRef(null);

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
              <div
                ref={(ref) => {
                  if (i === 0) {
                    divRef.current = ref;
                  }
                }}
                className="card overflow-hidden bg-white shadow hover:shadow-md cursor-pointer flex-auto"
              >
                <figure className="relative w-full aspect-video">
                  <Image
                    unoptimized
                    src={`${process.env.NEXT_PUBLIC_INVIDIOUS_URL}vi/${rcm.videoId}/mqdefault.jpg`}
                    priority
                    alt={rcm.title}
                    layout="fill"
                    className="bg-gray-400"
                  />
                </figure>
                <div className="card-body p-2">
                  <h2 className="font-semibold text-sm 2xl:text-2xl line-clamp-2 h-[2.7em]">
                    {rcm.title}
                  </h2>
                  <p className="text-xs 2xl:text-xl truncate">{rcm.author}</p>
                </div>
              </div>
            </label>
          </Fragment>
        );
      })}
    </>
  );
}
