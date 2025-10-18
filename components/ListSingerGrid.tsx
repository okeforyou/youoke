import Image from "next/image";
import { Fragment, useEffect, useRef, useState } from "react";
import { useQuery } from "react-query";

import { OKE_PLAYLIST } from "../const/common";
import { useKaraokeState } from "../hooks/karaoke";
import { useListSingerState } from "../hooks/listSinger";
import { GetTopArtists, SearchPlaylists } from "../types";
import {
  getArtists,
  getSkeletonItems,
  getTopArtists,
  searchPlaylists,
} from "../utils/api";
import Chip from "./Chips";
import JooxError from "./JooxError";

const GENRES = [
  "เพลงไทย",
  "ลูกทุ่ง",
  "ลูกกรุง",
  "เพื่อชีวิต",
  "คันทรี",
  "หมอลำ",
  "อีสาน",
  "ปักษ์ใต้",
  "ป็อป",
  "ป็อปร็อก",
  "ฮาร์ดร็อก",
  "ร็อกแอนด์โรล",
  "ริทึมแอนด์บลูส์",
];

export default function ListSingerGrid({ showTab = true }) {
  const [topArtistsData, setTopArtistsData] = useState<GetTopArtists>({
    artistCategories: [],
    artist: [],
  } as GetTopArtists);

  const playlistRef = useRef(null);
  const songlistRef = useRef(null);

  const handlePlaylistScroll = () => {
    playlistRef.current.scrollIntoView({ behavior: "smooth" });
  };

  const handleSongScroll = () => {
    songlistRef.current.scrollIntoView({ behavior: "smooth" });
  };

  const { data: tempTopArtistsData, isLoading: isLoadTopArtists } = useQuery(
    ["getTopArtists"],
    getTopArtists,
    {
      retry: false,
      refetchInterval: 0,
      onError: () => {
        setIsError(true);
      },
      onSuccess: async (data) => {
        setTopArtistsData(data);
        if (genreText !== "เพลงไทย") {
          await refetch();
        }
      },
    }
  );

  const { tagId, setTagId, genreText, setGenreText } = useListSingerState();
  const { data: artists, isLoading } = useQuery(
    ["getArtists", tagId],
    () => getArtists(tagId),
    {
      retry: false,
      refetchInterval: 0,
      onError: () => {},
    }
  );

  const { isLoading: isLoadingGenre, refetch } = useQuery<
    SearchPlaylists,
    Error
  >(["searchPlaylists", genreText], () => searchPlaylists(genreText), {
    enabled: false,
    onSuccess: (data) => {
      const _topArtistsData = { ...topArtistsData };
      _topArtistsData.artistCategories = data.artistCategories;
      setTopArtistsData(_topArtistsData);
    },
  });

  useEffect(() => {
    setTopArtistsData(tempTopArtistsData);
  }, []);

  useEffect(() => {
    refetch();
  }, [genreText, refetch]);

  const { setSearchTerm } = useKaraokeState();
  const { artist: topArtists } = !!topArtistsData
    ? topArtistsData
    : {
        artist: [],
      };
  const { artist } = artists || {};
  const { setActiveIndex } = useKaraokeState();
  const [isError, setIsError] = useState(false);

  const handleGenre = (genreText: string) => {
    setGenreText(genreText);
    handlePlaylistScroll();
  };

  return isError ? (
    <JooxError />
  ) : (
    <>
      <div className="col-span-full  bg-transparent pt-2">
        {showTab && (
          <nav className="tabs tabs-boxed flex justify-center  bg-transparent">
            <button type="button" className="tab tab-active">
              ศิลปินยอดฮิต
            </button>
            <button
              type="button"
              className="tab"
              onClick={() => {
                setActiveIndex(2);
              }}
            >
              มาแรง
            </button>
          </nav>
        )}
      </div>
      <div className="col-span-full  bg-transparent  pl-2 text-2xl">
        ศิลปินยอดนิยม
      </div>
      <div
        className={`relative grid grid-cols-4 xl:grid-cols-6 gap-2 col-span-full pt-2 pb-4`}
      >
        {isLoadTopArtists && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-base-300 z-10" />
            {getSkeletonItems(16).map((s, i) => (
              <div
                key={s + i}
                className="card bg-gray-300 animate-pulse w-full aspect-w-1 aspect-h-1"
              ></div>
            ))}
          </>
        )}
        {topArtists?.map((artist, i) => {
          return (
            <Fragment key={artist.name + i}>
              <div
                className="overflow-hidden bg-transparent cursor-pointer flex-auto"
                onClick={() => {
                  setSearchTerm(artist.name);
                }}
              >
                <figure className="relative w-full aspect-square">
                  <Image
                    unoptimized
                    src={artist.imageUrl}
                    priority
                    alt={artist.name}
                    layout="fill"
                    className="animate-pulse bg-gray-400 rounded-lg"
                    onLoad={(ev) =>
                      ev.currentTarget.classList.remove("animate-pulse")
                    }
                    onErrorCapture={(ev) => {
                      ev.currentTarget.src = "/assets/avatar.jpeg";
                    }}
                  />
                </figure>
                <div className="card-body p-1">
                  <h2 className="text-sm 2xl:text-md text-center pt-2 line-clamp-2">
                    {artist.name}
                  </h2>
                </div>
              </div>
            </Fragment>
          );
        })}
      </div>
      <div className="col-span-full  bg-transparent p-2 pl-2 text-2xl">
        แนวเพลง
      </div>

      <div
        className={`tabs tabs-boxed col-span-full justify-center bg-transparent relative grid grid-cols-3 xl:grid-cols-5  gap-2 col-span-full p-0`}
      >
        {GENRES?.map((gen) => {
          // gen list
          return (
            <div
              key={gen}
              className={`text-sm h-10 leading-6 hover:drop-shadow-xl hover:text-slate-200   text-white  tab   ${
                genreText == gen ? "tab-active" : ""
              }   
                `}
              onClick={() => handleGenre(gen)}
              style={{ borderRadius: "9999px" }}
            >
              <div
                className="absolute  top-0 h-full w-full bg-fixed items-center rounded-full  "
                style={{
                  backgroundColor: genreText == gen ? "" : "rgba(0, 0, 0, 0.4)",
                }}
              >
                <div className="flex h-full items-center justify-center">
                  {gen}
                </div>
              </div>
            </div>
          );
        })}

        <Chip
          label={OKE_PLAYLIST}
          onClick={() => handleGenre(OKE_PLAYLIST)}
          className={`cursor-pointer bg-black/50  hover:text-slate-200 ${
            genreText === OKE_PLAYLIST ? "bg-primary" : ""
          }`}
        />
      </div>
      <div
        ref={playlistRef}
        className="col-span-full  bg-transparent p-2 pl-2 text-2xl"
      >
        เพลย์ลิสต์
      </div>
      {!isLoadTopArtists && (
        <div
          className={`tabs tabs-boxed col-span-full justify-center bg-transparent relative grid grid-cols-3 xl:grid-cols-5  gap-2 col-span-full p-0`}
        >
          {topArtistsData?.artistCategories.map((cat) => {
            const names = cat.tag_name;

            // Tag list
            return (
              <div
                key={cat.tag_id}
                className={`text-sm aspect-square rounded-lg  leading-6 hover:drop-shadow-xl hover:text-slate-200 tracking-wide text-white bg-slate-900  bg-cover bg-center bg-no-repeat ${
                  tagId == cat.tag_id ? "" : ""
                }   
                `}
                onClick={() => {
                  setTagId(cat.tag_id);

                  handleSongScroll();
                }}
                style={{ backgroundImage: `url('${cat.imageUrl}')` }}
              >
                <div
                  className="absolute  top-0 h-full w-full bg-fixed items-center rounded-lg"
                  style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
                >
                  <div className="flex h-full items-center justify-center text-center">
                    {names}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {isLoading && (
        <>
          <div className="fixed inset-0 bg-gradient-to-t bottom-0 from-base-300 z-10" />
          {getSkeletonItems(16).map((s) => (
            <div
              key={s}
              className="card bg-gray-300 animate-pulse w-full aspect-w-4 aspect-h-3"
            />
          ))}
        </>
      )}
      <div
        ref={songlistRef}
        className="col-span-full bg-transparent p-4 pb-2 pl-2 text-2xl"
      >
        {(topArtistsData?.artistCategories || []).find(
          (cat) => cat.tag_id === tagId
        )?.tag_name || "เพลง"}
      </div>
      <div
        className={`tabs tabs-boxed col-span-full justify-center bg-transparent relative grid grid-cols-3 xl:grid-cols-5  gap-2 col-span-full p-0`}
      >
        {artist?.map((artist, i) => {
          return (
            <Fragment key={artist.name + i}>
              <div
                className="card overflow-hidden bg-white shadow hover:shadow-md cursor-pointer flex-auto rounded-lg"
                onClick={() => {
                  setSearchTerm(artist.name);
                }}
              >
                <figure className="relative w-full aspect-square">
                  <Image
                    unoptimized
                    src={artist.imageUrl}
                    priority
                    alt={artist.name}
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
                <div className="card-body p-2">
                  <h2 className="font-semibold  text-sm 2xl:text-2xl line-clamp-2 h-[2.7em]">
                    {artist.name}
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
