import Image from "next/image";
import { Fragment, useState } from "react";
import { useQuery } from "react-query";

import { useKaraokeState } from "../hooks/karaoke";
import { getHitSingles, getSkeletonItems } from "../utils/api";
import JooxError from "./JooxError";

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
      <div
        className={`relative grid grid-cols-2 xl:grid-cols-3  pt-2 gap-2 col-span-full`}
      >
        {isLoading && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-base-300 z-10" />
            {getSkeletonItems(16).map((s) => (
              <div
                key={s}
                className="card bg-gray-300 animate-pulse w-full aspect-w-4 aspect-h-3"
              />
            ))}
          </>
        )}
        {topics?.map((topic, key) => {
          return (
            <Fragment key={key}>
              <div
                key={"card" + key}
                className="card rounded-lg overflow-hidden bg-white shadow hover:shadow-md cursor-pointer flex-auto"
                onClick={() => {
                  setSearchTerm(topic.title + " " + topic.artist_name);
                  setActiveIndex(0);
                }}
              >
                <figure className="relative w-full aspect-w-1 aspect-h-1">
                  <Image
                    unoptimized
                    src={topic.coverImageURL}
                    priority
                    alt={topic.title}
                    layout="fill"
                    className="animate-pulse bg-gray-400"
                    onLoad={(ev) =>
                      ev.currentTarget.classList.remove("animate-pulse")
                    }
                    onErrorCapture={(ev) => {
                      ev.currentTarget.src = "/assets/avatar.jpeg";
                    }}
                  />
                </figure>
                <div className="card-body p-2 gap-y-0">
                  <h2 className="font-semibold text-sm 2xl:text-lg line-clamp-2">
                    {topic.title}
                  </h2>
                  <h2 className="text-xs 2xl:text-lg text-gray-400">
                    {topic.artist_name}
                  </h2>
                </div>
              </div>
            </Fragment>
          );
        })}
      </div>
    </>
  );
}
