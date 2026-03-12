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
  cleanSearchQuery,
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
  const rawGenres = (config?.ui?.genres || GENRES).filter(g => g !== "เพลงไทย" && g !== "ทั้งหมด" && g !== "แนะนำ");
  const genres = [...rawGenres];

  // URL-Driven State or Fallback to Default (Empty or search)
  const genreText = (router.query.genre as string) || "";
  const tagId = (router.query.playlist as string) || "";

  console.log("🔍 SpotifyDashboard Render:", {
    isReady: router.isReady,
    query: router.query,
    genreText,
    tagId
  });

  // Helper to update URL without reloading
  const setGenreText = (text: string) => {
    const { search, ...rest } = router.query;
    router.push({
      pathname: router.pathname,
      query: { ...rest, genre: text, playlist: undefined } // clear playlist and search
    }, undefined, { shallow: true });
    setSearchTerm(''); // Clear store search to prevent index.tsx from forcing search view
    setShouldScrollToPlaylist(true);
  };

  const setTagId = (id: string) => {
    console.log("🎯 SpotifyDashboard: setTagId:", id);
    if (id) {
      setSearchTerm(''); // Clear search store to ensure we stay on Dashboard tab
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

  // When default Top Artists load
  useEffect(() => {
    if (tempTopArtistsData && (genreText === "แนะนำ" || genreText === "ลูกทุ่ง" || topArtistsData.artistCategories.length === 0)) {
      console.log("📦 SpotifyDashboard: Populating topArtistsData", tempTopArtistsData.artistCategories.length);
      setTopArtistsData(tempTopArtistsData);
    }
  }, [tempTopArtistsData, genreText, topArtistsData.artistCategories.length]);


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
    enabled: genreText !== "เพลงไทย" && genreText !== "แนะนำ",
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

  // Fallback: If genrePlaylists is empty AND we are loading, don't fall back to default.
  // Special Handling for Default Genres
  const isGenreDefault = genreText === "เพลงไทย" || !genreText;
  const artistCategories = isGenreDefault
    ? (topArtistsData?.artistCategories || [])
    : genrePlaylists; // Show only genre-specific results (empty = empty, loading = skeleton)

  const { artist, playlist: playlistInfo } = (artists as any) || {};
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
      {/* Conditionally render Playlist Detail OR Home Content */}
      {tagId && artist ? (
        <div className="col-span-full animate-in fade-in slide-in-from-top-4 duration-500">
          {/* Playlist Header (Premium Banner) */}
          <div className="relative w-full h-[250px] sm:h-[320px] mb-8 group overflow-hidden rounded-3xl mx-2">
             <Image 
                src={playlistInfo?.imageUrl || artist[0]?.imageUrl || "/icon-cover.png"} 
                alt={playlistInfo?.name || "Playlist"}
                fill 
                className="object-cover scale-105 blur-2xl opacity-40 brightness-50"
                unoptimized
             />
             <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-gray-50/80 to-transparent" />
             
             <div className="absolute inset-0 p-6 sm:p-10 flex flex-col sm:flex-row items-end gap-6">
                {/* Square Cover */}
                <div className="relative w-32 h-32 sm:w-48 sm:h-48 flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/20">
                   <Image 
                      src={playlistInfo?.imageUrl || artist[0]?.imageUrl || "/icon-cover.png"} 
                      alt={playlistInfo?.name}
                      fill 
                      className="object-cover"
                      unoptimized
                   />
                </div>
                
                {/* Header Text */}
                <div className="flex-1 space-y-2 pb-2">
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">เพลย์ลิสต์</p>
                   <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-black leading-none line-clamp-2">
                      {playlistInfo?.name || "รายการเพลง"}
                   </h1>
                   <div className="flex items-center gap-2 text-[12px] text-gray-400 font-medium">
                      <span className="text-black font-bold">{playlistInfo?.owner || "YouOke"}</span>
                      <span>•</span>
                      <span>{artist.length} เพลง</span>
                   </div>
                </div>

                {/* Return Button */}
                <div className="absolute top-6 right-6">
                   <button 
                      onClick={() => setTagId("")}
                      className="bg-white/80 backdrop-blur-md hover:bg-white text-black px-4 py-2 rounded-full text-xs font-bold shadow-sm flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                   >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                      </svg>
                      กลับไปยังหนัาแรก
                   </button>
                </div>
             </div>
          </div>
        </div>
      ) : (
        <>
          <div className="col-span-full px-2 pt-2 pb-2 text-[13px] font-black text-black uppercase tracking-wider flex items-center gap-2">
            ศิลปินยอดนิยม
          </div>

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
            {topArtists?.slice(0, 15).map((artist, i) => (
                <Fragment key={artist.name + i}>
                  <div
                    className="group relative cursor-pointer overflow-hidden rounded-2xl shadow-sm hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 isolate bg-gray-100 w-full"
                    onClick={() => {
                      const cleanedName = cleanSearchQuery(artist.name);
                      setSearchTerm(cleanedName);
                    }}
                  >
                    <div className="relative w-full aspect-square">
                      <Image
                        src={artist.imageUrl || "/assets/avatar.jpeg"}
                        priority={i < 5}
                        alt={artist.name}
                        unoptimized
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        onLoad={(ev) =>
                          ev.currentTarget.classList.remove("animate-pulse")
                        }
                        onErrorCapture={(ev) => {
                          ev.currentTarget.src = "/assets/avatar.jpeg";
                        }}
                      />
                      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-lg transform scale-50 group-hover:scale-100 transition-transform">
                          <svg className="w-5 h-5 text-white fill-current ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                        </div>
                      </div>
                      <div className="absolute inset-0 p-3 flex flex-col justify-end items-start z-10 pointer-events-none">
                        <h2 className="text-white font-bold text-[11px] sm:text-[12px] leading-tight line-clamp-1 drop-shadow-md transform translate-y-0.5 group-hover:translate-y-0 transition-transform text-left">
                          {artist.name}
                        </h2>
                      </div>
                    </div>
                  </div>
                </Fragment>
            ))}
          </div>

          <div className="col-span-full px-2 pt-4 pb-3 text-[13px] font-black text-black uppercase tracking-wider flex items-center gap-2 border-t border-gray-100 mt-2">
            แนวเพลงยอดฮิต
          </div>

          <div className="col-span-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 px-2 pb-8">
            {genres?.map((gen) => (
              <button
                key={gen}
                onClick={() => setGenreText(gen)}
                className={`
                     w-full py-2 px-4 rounded-xl text-[12px] font-bold transition-all duration-300 border
                     ${genreText == gen
                    ? "bg-primary text-white border-primary transform -translate-y-0.5"
                    : "bg-gray-100 text-black border-gray-100 hover:bg-white hover:border-primary/30 hover:text-primary hover:-translate-y-0.5"
                  }
                  `}
              >
                {gen}
              </button>
            ))}
          </div>
        </>
      )}
      {
        (artistCategories.length > 0 || (!isGenreDefault && isLoadingGenre)) && (
          <div ref={playlistRef} className="scroll-mt-32 col-span-full px-2 pt-4 pb-3 text-[11px] sm:text-[12px] font-black text-black uppercase tracking-wider flex items-center justify-between">
            <span>{isGenreDefault ? "เพลย์ลิสต์แนะนำ" : `เพลย์ลิสต์ ${genreText}`}</span>
            <span className="text-[10px] font-normal text-gray-400 bg-gray-50 px-3 py-1 rounded-full">อัพเดทล่าสุด</span>
          </div>
        )
      }

      {/* Genre Loading Skeleton */}
      {!isGenreDefault && isLoadingGenre && artistCategories.length === 0 && (
        <div className="col-span-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 px-4 pb-8">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-3xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      )}

      {/* Genre Empty State */}
      {!isGenreDefault && !isLoadingGenre && artistCategories.length === 0 && (
        <div className="col-span-full px-4 pb-8 text-center">
          <p className="text-gray-400 text-sm">ไม่พบเพลย์ลิสต์สำหรับ "{genreText}" กรุณาลองใหม่อีกครั้ง</p>
        </div>
      )}

      {/* Recommended Rows (Shelves) - Disabled as per user request to keep home clean */}
      {!tagId && genreText === "แนะนำ" && !isLoadTopArtists && (tempTopArtistsData as any)?.genres && (
        <div className="col-span-full space-y-8 pb-10">
          {Object.entries((tempTopArtistsData as any).genres).map(([genre, playlists]: [string, any]) => (
            <div key={genre} className="space-y-4">
              <div className="px-2 flex items-center justify-between">
                <h3 className="text-[14px] font-black text-black uppercase tracking-wider">{genre}</h3>
                <button 
                  onClick={() => setGenreText(genre)}
                  className="text-[10px] font-bold text-primary hover:underline"
                >
                  ดูทั้งหมด
                </button>
              </div>
              
              {/* Horizontal Scroll Row */}
              <div className="flex overflow-x-auto gap-4 px-2 pb-4 no-scrollbar snap-x touch-pan-x">
                {playlists.map((cat: any) => (
                  <div
                    key={cat.id || cat.playlistId}
                    onClick={() => {
                      setTagId(cat.playlistId || cat.id);
                    }}
                    className="flex-shrink-0 w-[140px] sm:w-[180px] snap-start group cursor-pointer"
                  >
                    <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-sm group-hover:shadow-xl transition-all duration-300">
                      <Image
                        src={cat.thumbnail || cat.imageUrl || "/icon-cover.png"}
                        alt={cat.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
                            <svg className="w-5 h-5 text-white fill-current ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                         </div>
                      </div>
                    </div>
                    <div className="mt-2 px-1">
                      <p className="text-[12px] font-bold text-black line-clamp-2 leading-tight group-hover:text-primary transition-colors text-left">
                        {cat.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Playlists: Premium Cards (Grid View for secondary levels or fallback) - Only on Home/Genre */}
      {
        !tagId && !isGenreDefault && !isLoadTopArtists && artistCategories.length > 0 && (
          <div className="col-span-full grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-5 gap-6 px-4 pb-10">
            {artistCategories.map((cat) => (
              <div
                key={cat.tag_id}
                onClick={() => {
                  setTagId(cat.tag_id);
                }}
                className={`
                    relative w-full aspect-square rounded-3xl overflow-hidden cursor-pointer shadow-sm hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-1.5 group bg-gray-100
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
                    <span className="text-white font-bold text-[11px] sm:text-[12px] drop-shadow-md line-clamp-2 leading-tight">
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
        tagId && artist && artist.length > 0 && (
          <div
            ref={songlistRef}
            className="scroll-mt-32 col-span-full px-4 pt-4 pb-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <button 
                className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-transform"
                onClick={() => {
                   // Play first song logic if needed
                   if (artist[0]) {
                      const baseQuery = artist[0].title ? `${artist[0].title} ${artist[0].artist_name}` : artist[0].name;
                      const cleanedQuery = cleanSearchQuery(baseQuery);
                      setSearchTerm(cleanedQuery);
                   }
                }}
              >
                <svg className="w-6 h-6 text-white ml-1" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              </button>
              <h2 className="text-[16px] font-black text-black">รายการเพลงทั้งหมด</h2>
            </div>
            <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full uppercase tracking-wider">
              {artist.length} tracks
            </span>
          </div>
        )
      }

      {/* Song List Grid - Premium Clean Cards */}
      {tagId && artist && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4 col-span-full px-4 pb-32">
          {artist.map((item: any, i: number) => {
            const video = item as any;
            return (
              <Fragment key={video.id || video.name + i}>
                <div
                  className="group cursor-pointer flex flex-col h-full transition-all active:scale-[0.97] duration-300 relative overflow-hidden"
                  onClick={() => {
                    const artistName = (video.artist_name && video.artist_name !== "Unknown Artist") ? video.artist_name : "";
                    const query = `${video.title} ${artistName}`.trim();
                    setSearchTerm(query);
                    setShouldScrollToSongs(false);
                    router.push({
                      pathname: router.pathname,
                      query: { ...router.query, search: query }
                    });
                  }}
                >
                  <div className="relative aspect-[1.6/1] rounded-xl overflow-hidden bg-gray-50 mb-3 shadow-sm group-hover:shadow-md transition-shadow">
                    <Image
                      src={video.coverImageURL || "/icon-cover.png"}
                      priority={i < 10}
                      alt={video.title}
                      fill
                      unoptimized
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      onErrorCapture={(ev) => {
                        ev.currentTarget.src = "/icon-cover.png";
                      }}
                    />
                    <div className="absolute inset-x-0 bottom-0 p-2 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-4 h-4 text-white fill-current ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      </div>
                    </div>
                  </div>
                  <div className="px-1 flex-1">
                    <h3 className="font-bold text-[12px] sm:text-[13px] line-clamp-2 text-black leading-snug group-hover:text-primary transition-colors text-left">
                      {video.title || video.name}
                    </h3>
                    <p className="text-[10px] text-gray-400 mt-1 line-clamp-1 text-left">
                      {(video.artist_name && video.artist_name !== "Unknown Artist") ? video.artist_name : "YouTube Music"}
                    </p>
                  </div>
                </div>
              </Fragment>
            );
          })}
        </div>
      )}
    </>
  );
}
