import { Fragment, useState } from "react";
import { useQuery } from "react-query";

import { useKaraokeState } from "../hooks/karaoke";
import { getHitSingles, getSkeletonItems } from "../utils/api";
import JooxError from "./JooxError";
import TopicHorizontalCard from "./TopicHorizontalCard";
import TopicGridCard from "./TopicGridCard";

export default function ListTopicsGrid({ showTab = true }) {
  const { data, isLoading } = useQuery(["getHitSingles"], getHitSingles, {
    retry: false,
    refetchInterval: 0,
    onError: () => {
      setIsError(true);
    },
    onSuccess: (data) => {
      setIsError(data.singles.length === 0);
    },
  });
  const { setActiveIndex, setSearchTerm } = useKaraokeState();
  const { singles: topics } = data || {};
  const [isError, setIsError] = useState(false || topics?.length === 0);

  return isError ? (
    <JooxError />
  ) : (
    <>
      <div className="col-span-full  bg-transparent pt-2">
        {showTab && (
          <nav className="tabs tabs-boxed flex justify-center  bg-transparent">
            <button
              type="button"
              className="tab"
              onClick={() => {
                setActiveIndex(1);
              }}
            >
              ศิลปินยอดฮิต
            </button>
            <button type="button" className="tab tab-active">
              มาแรง
            </button>
          </nav>
        )}
      </div>
      <div className="col-span-full  bg-transparent  pl-2 text-2xl">
        เพลงใหม่มาแรง
      </div>
      {/* Mobile: List View */}
      <div className="relative flex flex-col gap-2 col-span-full pt-2 md:hidden">
        {isLoading && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-base-300 z-10" />
            {getSkeletonItems(8).map((s) => (
              <div
                key={s}
                className="bg-gray-300 animate-pulse w-full h-24 rounded"
              />
            ))}
          </>
        )}
        {topics?.map((topic, key) => (
          <Fragment key={key}>
            <TopicHorizontalCard
              topic={topic}
              onClick={() => {
                setSearchTerm(topic.title + " " + topic.artist_name);
                setActiveIndex(0);
              }}
            />
          </Fragment>
        ))}
      </div>

      {/* Desktop: Grid View */}
      <div className="relative hidden md:grid md:grid-cols-2 xl:grid-cols-3 pt-2 gap-2 col-span-full">
        {isLoading && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-base-300 z-10" />
            {getSkeletonItems(16).map((s) => (
              <div
                key={s}
                className="card bg-gray-300 animate-pulse w-full aspect-square"
              />
            ))}
          </>
        )}
        {topics?.map((topic, key) => (
          <Fragment key={key}>
            <TopicGridCard
              topic={topic}
              onClick={() => {
                setSearchTerm(topic.title + " " + topic.artist_name);
                setActiveIndex(0);
              }}
            />
          </Fragment>
        ))}
      </div>
    </>
  );
}
