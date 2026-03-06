import Image from "next/image";
import { Fragment, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";

import { OKE_PLAYLIST } from "../../../const/common";
import { usePlayerStore } from "../../../modules/player/stores/usePlayerStore";
import { useListSingerState } from "../../../hooks/listSinger";
import { GetTopArtists, SearchPlaylists } from "../../../types";
import {
  getArtists,
  getSkeletonItems,
  getTopArtists,
  searchPlaylists,
} from "../../../utils/api";
import JooxError from "../../../components/JooxError";
import { useSystemConfig } from "../../../hooks/useSystemConfig";
import { useUIStore } from "../../../stores/useUIStore";

const GENRES = [
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

export default function SpotifyDashboard({ showTab = true }) {
  const router = useRouter();
  const { config } = useSystemConfig();
  const genres = config?.ui?.genres || GENRES;

  // URL-Driven State or Fallback to Default
  const genreText = (router.query.genre as string) || "ลูกทุ่ง";
  const tagId = (router.query.playlist as string) || "";

  console.log("🔍 SpotifyDashboard Render:", {
    isReady: router.isReady,
    query: router.query,
    genreText,
    tagId
  });

  // Helper to update URL without reloading
  const setGenreText = (text: string) => {
    router.push({
      pathname: router.pathname,
      query: { ...router.query, genre: text, playlist: undefined } // clear playlist when genre changes
    }, undefined, { shallow: true });
    setShouldScrollToPlaylist(true);
  };

  const setTagId = (id: string) => {
    if (id) {
      router.push({
        pathname: router.pathname,
        query: { ...router.query, playlist: id }
      }, undefined, { shallow: true });
      setShouldScrollToSongs(true);
    } else {
      // Clear playlist
      const { playlist, ...rest } = router.query;
      router.push({
        pathname: router.pathname,
        query: rest
      }, undefined, { shallow: true });
    }
  };

  const [topArtistsData, setTopArtistsData] = useState<GetTopArtists>({
    artistCategories: [],
    artist: [],
    status: "success",
  } as GetTopArtists);

  const playlistRef = useRef<HTMLDivElement>(null);
  const songlistRef = useRef<HTMLDivElement>(null);

  const { data: tempTopArtistsData, isLoading: isLoadTopArtists } = useQuery({
    queryKey: ["getTopArtists", "v2"], // Force cache refresh for V2 logic
    queryFn: getTopArtists,
    retry: false,
    refetchInterval: 0,
  });

  // When default Top Artists load (Only if no genre selected or Default)
  useEffect(() => {
    if (tempTopArtistsData && genreText === "ลูกทุ่ง") {
      setTopArtistsData(tempTopArtistsData);
    }
  }, [tempTopArtistsData, genreText]);


  const { data: artists, isLoading } = useQuery({
    queryKey: ["getArtists", tagId],
    queryFn: () => getArtists(tagId),
    retry: false,
    refetchInterval: 0,
    enabled: !!tagId,
  });

  const {
    data: playlistData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingGenre,
    refetch
  } = useInfiniteQuery({
    queryKey: ["searchPlaylists", genreText],
    queryFn: ({ pageParam = 1 }) => searchPlaylists(genreText || "เพลงไทย", pageParam),
    getNextPageParam: (lastPage, allPages) => {
      // If last page has 20 items, there's likely more. 
      return (lastPage?.artistCategories?.length === 20) ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: genreText !== "เพลงไทย",
  });

  // Flatten pages for display
  const genrePlaylists = playlistData?.pages?.flatMap(page => page.artistCategories) || [];

  // Initial Load Placeholder
  useEffect(() => {
    if (!topArtistsData.artistCategories.length && tempTopArtistsData) {
      setTopArtistsData(tempTopArtistsData);
    }
  }, []);

  // Trigger search when genre text changes
  useEffect(() => {
    if (genreText !== "เพลงไทย") {
      refetch();
    }
  }, [genreText, refetch]);

  const { setSearchTerm } = usePlayerStore();

  const topArtists = tempTopArtistsData?.artist || [];

  const artistCategories = (genreText === "เพลงไทย")
    ? (topArtistsData?.artistCategories || [])
    : (genrePlaylists.length > 0 ? genrePlaylists : []);

  const { artist } = artists || {};
  const [isError, setIsError] = useState(false);

  // State to track if we should scroll (User Action)
  const [shouldScrollToPlaylist, setShouldScrollToPlaylist] = useState(false);
  const [shouldScrollToSongs, setShouldScrollToSongs] = useState(false);

  // Auto-scroll when Playlists (Categories) update
  useEffect(() => {
    if (artistCategories.length > 0 && genreText && shouldScrollToPlaylist) {
      // Use requestAnimationFrame for smoother and more reliable scroll
      requestAnimationFrame(() => {
        playlistRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        setShouldScrollToPlaylist(false);
      });
    }
  }, [genreText, artistCategories.length, shouldScrollToPlaylist]);

  // Auto-scroll when Songs (Artists) update
  useEffect(() => {
    if (artist && artist.length > 0 && tagId && shouldScrollToSongs) {
      requestAnimationFrame(() => {
        songlistRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        setShouldScrollToSongs(false);
      });
    }
  }, [tagId, artist?.length, shouldScrollToSongs]);

  // Back Button Logic synced with Router
  useEffect(() => {
    if (tagId) {
      useUIStore.getState().setBackAction(() => router.back());
    } else if (genreText !== "เพลงไทย") {
      useUIStore.getState().setBackAction(null);
    } else {
      useUIStore.getState().setBackAction(null);
    }
  }, [tagId, genreText]);

  const handleGenre = (text: string) => {
    setGenreText(text);
  };

  // Legacy support for onClick handlers
  const setUpdatedGenreText = (text: string) => {
    setGenreText(text);
  };

  return isError ? (
    <JooxError />
  ) : (
    <>
      <div className="col-span-full px-2 pt-2 pb-2 text-[13px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
        ศิลปินยอดนิยม
      </div>

      {/* Artist Grid - Horizontal Scroll (Carousel) for Mobile/Desktop */}
      {/* Artist Grid - Vertical Layout (Grid) */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 col-span-full pb-6 px-2">
        {isLoadTopArtists && (
          <>
            {getSkeletonItems(10).map((s, i) => (
              <div
                key={s + i}
                className="card bg-gray-100 animate-pulse w-full aspect-square rounded-2xl"
              ></div>
            ))}
          </>
        )}
        {topArtists?.slice(0, 15).map((artist, i) => {
          return (
            <Fragment key={artist.name + i}>
              <div
                className="group relative cursor-pointer overflow-hidden rounded-2xl shadow-sm hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 isolate bg-gray-100 w-full"
                onClick={() => {
                  setSearchTerm(artist.name);
                }}
              >
                {/* Image Container - Full Card Size */}
                <div className="relative w-full aspect-square">
                  <Image
                    src={artist.imageUrl}
                    priority={i < 5}
                    alt={artist.name}
                    unoptimized
                    layout="fill"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    onLoad={(ev) =>
                      ev.currentTarget.classList.remove("animate-pulse")
                    }
                    onErrorCapture={(ev) => {
                      ev.currentTarget.src = "/assets/avatar.jpeg";
                    }}
                  />

                  {/* Minimal Gradient Overlay for Text Readability - Slightly stronger */}
                  <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity pointer-events-none" />

                  {/* Minimal Play Hint on Hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-lg transform scale-50 group-hover:scale-100 transition-transform">
                      <svg className="w-5 h-5 text-white fill-current ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                  </div>

                  {/* Name Text inside Cover (Bottom Left) */}
                  <div className="absolute inset-0 p-3 flex flex-col justify-end items-start z-10 pointer-events-none">
                    <h2 className="text-white font-bold text-[11px] sm:text-[12px] leading-tight line-clamp-1 drop-shadow-md transform translate-y-0.5 group-hover:translate-y-0 transition-transform text-left">
                      {artist.name}
                    </h2>
                  </div>
                </div>
              </div>
            </Fragment>
          );
        })}
      </div>


      <div className="col-span-full px-2 pt-4 pb-3 text-[13px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2 border-t border-gray-100 mt-2">
        แนวเพลงยอดฮิต
      </div>

      {/* Genres: Premium Pills - Adjusted to max 5 columns */}
      <div className="col-span-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 px-2 pb-8">
        {genres?.map((gen) => (
          <button
            key={gen}
            onClick={() => setGenreText(gen)}
            className={`
                 w-full py-2 px-4 rounded-xl text-[12px] font-bold transition-all duration-300 border
                 ${genreText == gen
                ? "bg-primary text-white shadow-lg shadow-primary/30 border-primary transform -translate-y-0.5"
                : "bg-gray-100 text-black border-gray-100 hover:bg-white hover:border-primary/30 hover:shadow-md hover:text-primary hover:-translate-y-0.5"
              }
              `}
          >
            {gen}
          </button>
        ))}
      </div>
      {
        artistCategories.length > 0 && (
          <div ref={playlistRef} className="scroll-mt-32 col-span-full px-2 pt-4 pb-3 text-[13px] font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between">
            <span>{genreText === "ลูกทุ่ง" ? "เพลย์ลิสต์แนะนำ" : `เพลย์ลิสต์ ${genreText}`}</span>
            <span className="text-xs font-normal text-gray-400 bg-gray-50 px-3 py-1 rounded-full">อัพเดทล่าสุด</span>
          </div>
        )
      }

      {/* Playlists: Premium Cards */}
      {
        !isLoadTopArtists && artistCategories.length > 0 && (
          <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 px-4 pb-10">
            {artistCategories.map((cat) => (
              <div
                key={cat.tag_id}
                onClick={() => {
                  setTagId(cat.tag_id);
                  setShouldScrollToSongs(true);
                  if (typeof window !== 'undefined') {
                    window.history.pushState({ view: 'singer_playlist' }, '');
                  }
                }}
                className={`
                    relative w-full aspect-video rounded-3xl overflow-hidden cursor-pointer shadow-sm hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-1.5 group bg-gray-100
                    ${tagId == cat.tag_id ? "ring-4 ring-offset-2 ring-primary" : ""}
                 `}
              >
                <Image
                  src={cat.imageUrl || "/icon-cover.png"}
                  alt={cat.tag_name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => { e.currentTarget.src = "/icon-cover.png"; }}
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90 transition-opacity" />

                {/* Content Overlay */}
                <div className="absolute inset-0 p-6 flex flex-col justify-between">
                  <div className="self-end opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-2 group-hover:translate-x-0">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                  </div>
                  <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <span className="text-white font-bold text-[14px] drop-shadow-md line-clamp-2 leading-tight">
                      {cat.tag_name}
                    </span>
                    <div className="h-1 w-12 bg-primary rounded-full mt-2 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100 origin-left scale-x-0 group-hover:scale-x-100" />
                  </div>
                </div>
              </div>
            ))}
          </div >
        )
      }

      {/* Load More Button */}
      {
        genreText !== "เพลงไทย" && hasNextPage && (
          <div className="col-span-full flex justify-center pb-8">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="px-8 py-3 bg-white border border-gray-200 hover:border-primary/50 hover:text-primary hover:shadow-lg text-gray-500 rounded-full text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2 transform active:scale-95"
            >
              {isFetchingNextPage ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  กำลังโหลด...
                </>
              ) : "โหลดเพิ่มเติม"}
            </button>
          </div>
        )
      }

      {/* Loading Skeletons */}
      {
        isLoading && (
          <>
            <div className="col-span-full grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 px-2">
              {getSkeletonItems(8).map((s) => (
                <div key={s} className="h-48 bg-gray-100 rounded-3xl animate-pulse" />
              ))}
            </div>
          </>
        )
      }

      {/* Song List Header */}
      {
        artist && artist.length > 0 && (
          <div
            ref={songlistRef}
            className="scroll-mt-32 col-span-full px-2 pt-6 pb-4 text-[13px] font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between border-t border-gray-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-primary rounded-full"></div>
              {(artistCategories || []).find((cat) => cat.tag_id === tagId)?.tag_name || "เพลง"}
            </div>
            <span className="text-xs font-medium text-gray-400 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
              {artist.length} รายการ
            </span>
          </div>
        )
      }

      {/* Song List Grid - Clean Cards */}
      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 col-span-full px-2 pb-24">
        {artist?.map((item, i) => {
          const video = item as any;
          return (
            <Fragment key={video.name + i}>
              <div
                className="group cursor-pointer bg-white rounded-lg border border-gray-100 hover:shadow-sm flex flex-col h-full transition-all active:scale-[0.98] duration-100 relative overflow-hidden"
                onClick={() => {
                  const query = video.title ? `${video.title} ${video.artist_name}` : video.name;
                  router.push({
                    pathname: router.pathname,
                    query: { ...router.query, search: query }
                  }, undefined, { shallow: true });
                }}
              >
                <figure className="relative w-full aspect-[4/3] flex-shrink-0 bg-gray-50 overflow-hidden">
                  <Image
                    src={video.imageUrl}
                    priority
                    alt={video.name}
                    unoptimized
                    layout="fill"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    onLoad={(ev) =>
                      ev.currentTarget.classList.remove("animate-pulse")
                    }
                    onErrorCapture={(ev) => {
                      ev.currentTarget.src = "/assets/avatar.jpeg";
                    }}
                  />
                  {/* Play Overlay matching Search Grid */}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-black text-sm font-bold">▶</span>
                    </div>
                  </div>
                </figure>
                <div className="p-2 gap-y-0.5 flex-1 flex flex-col relative">
                  <h2 className="font-medium text-[11px] sm:text-[12px] line-clamp-2 flex-1 text-gray-800 leading-snug">
                    {video.title || video.name}
                  </h2>
                  <p className="text-[9px] text-gray-500 truncate">
                    {video.artist_name || video.name}
                  </p>
                </div>
              </div>
            </Fragment>
          );
        })}
      </div>
    </>
  );
}
