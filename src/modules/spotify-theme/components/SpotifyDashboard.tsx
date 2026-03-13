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
import { Headphones, Library, ChevronRight, Grid as GridIcon } from "lucide-react";
import { ARTIST_CATEGORIES, ArtistCategory } from "../../../data/artist-categories";

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

export default function SpotifyDashboard({ showTab = true, mode = 'default' }: { showTab?: boolean, mode?: 'default' | 'listening' | 'genres' }) {
  const router = useRouter();
  const { config } = useSystemConfig();
  const rawGenres = (config?.ui?.genres || GENRES).filter(g => g !== "เพลงไทย" && g !== "ทั้งหมด" && g !== "แนะนำ");
  const genres = [...rawGenres];

  const genreText = (router.query.genre as string) || "";
  const tagId = (router.query.playlist as string) || "";

  const setGenreText = (text: string) => {
    const { search, ...rest } = router.query;
    router.push({
      pathname: router.pathname,
      query: { ...rest, genre: text, playlist: undefined }
    }, undefined, { shallow: true });
    setSearchTerm('');
    setShouldScrollToPlaylist(true);
  };

  const setTagId = (id: string) => {
    if (id) {
      setSearchTerm('');
      router.push({
        pathname: router.pathname,
        query: { ...router.query, playlist: id }
      }, undefined, { shallow: true });
      setShouldScrollToSongs(true);
    } else {
      const { playlist, ...rest } = router.query;
      router.push({
        pathname: router.pathname,
        query: rest
      }, undefined, { shallow: true });
    }
  };

  const selectedCategoryId = (router.query.category as string) || "";
  const selectedCategory = ARTIST_CATEGORIES.find(c => c.id === selectedCategoryId);

  const setCategoryId = (id: string) => {
    if (id) {
        router.push({
            pathname: router.pathname,
            query: { ...router.query, category: id, playlist: undefined }
        }, undefined, { shallow: true });
    } else {
        const { category, ...rest } = router.query;
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
    queryKey: ["getTopArtists", "v2", mode],
    queryFn: () => getTopArtists(mode),
    retry: false,
    refetchInterval: 0,
  });

  useEffect(() => {
    if (tempTopArtistsData && (genreText === "แนะนำ" || genreText === "ลูกทุ่ง" || topArtistsData.artistCategories.length === 0)) {
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
    queryKey: ["searchPlaylists", genreText, mode],
    queryFn: ({ pageParam = 1 }) => searchPlaylists(genreText || "เพลงไทย", pageParam, mode),
    getNextPageParam: (lastPage, allPages) => {
      return (lastPage?.artistCategories?.length === 20) ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: (mode === 'genres' || mode === 'listening') && genreText !== "เพลงไทย" && genreText !== "แนะนำ",
  });

  const genrePlaylists = playlistData?.pages?.flatMap(page => page.artistCategories) || [];

  useEffect(() => {
    if (genreText !== "เพลงไทย" && (mode === 'genres' || mode === 'listening')) {
      refetch();
    }
  }, [genreText, refetch, mode]);

  const { setSearchTerm } = usePlayerStore();
  const topArtists = tempTopArtistsData?.artist || [];
  const isGenreDefault = genreText === "เพลงไทย" || !genreText;
  const artistCategories = isGenreDefault ? (topArtistsData?.artistCategories || []) : genrePlaylists;

  const { artist, playlist: playlistInfo } = (artists as any) || {};
  const [isError, setIsError] = useState(false);
  const [shouldScrollToPlaylist, setShouldScrollToPlaylist] = useState(false);
  const [shouldScrollToSongs, setShouldScrollToSongs] = useState(false);

  useEffect(() => {
    if (artistCategories.length > 0 && genreText && shouldScrollToPlaylist) {
      requestAnimationFrame(() => {
        playlistRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        setShouldScrollToPlaylist(false);
      });
    }
  }, [genreText, artistCategories.length, shouldScrollToPlaylist]);

  useEffect(() => {
    if (artist && artist.length > 0 && tagId && shouldScrollToSongs) {
      requestAnimationFrame(() => {
        songlistRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        setShouldScrollToSongs(false);
      });
    }
  }, [tagId, artist?.length, shouldScrollToSongs]);

  useEffect(() => {
    if (tagId) {
      useUIStore.getState().setBackAction(() => router.back());
    } else if (selectedCategoryId) {
      useUIStore.getState().setBackAction(() => setCategoryId(""));
    } else {
      useUIStore.getState().setBackAction(null);
    }
  }, [tagId, selectedCategoryId]);

  return isError ? (
    <JooxError />
  ) : (
    <div className="flex flex-col w-full pb-20">
      {/* 1. PLAYLIST DETAIL VIEW */}
      {tagId && artist ? (
        <div className="col-span-full animate-in fade-in slide-in-from-top-6 duration-700 ease-out">
          <div className="relative w-full h-[180px] sm:h-[240px] mb-8 group overflow-hidden rounded-[3rem] mx-2 shadow-2xl">
             <Image 
                src={playlistInfo?.imageUrl || artist[0]?.imageUrl || "/icon-cover.png"} 
                alt={playlistInfo?.name || "Playlist"}
                fill 
                className="object-cover scale-110 blur-3xl opacity-40 brightness-75 group-hover:scale-125 transition-transform duration-[3000ms]"
                unoptimized
             />
             <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-white/10" />
             
             <div className="absolute inset-0 p-6 sm:p-10 flex items-center gap-6 sm:gap-10">
                <div className="relative w-28 h-28 sm:w-44 sm:h-44 flex-shrink-0 rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] ring-4 ring-white/20 bg-white group-hover:rotate-1 transition-all duration-700">
                   <Image 
                      src={playlistInfo?.imageUrl || artist[0]?.imageUrl || "/icon-cover.png"} 
                      alt={playlistInfo?.name}
                      fill 
                      className="object-cover"
                      unoptimized
                   />
                </div>
                
                <div className="flex-1 space-y-2 sm:space-y-4">
                   <div className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Music Collection</p>
                   </div>
                   <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-tight drop-shadow-lg line-clamp-2">
                      {playlistInfo?.name || "รายการเพลง"}
                   </h1>
                   <div className="flex items-center gap-4 text-xs sm:text-sm text-white/70 font-bold">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] text-white">OK</div>
                        <span className="text-white">{playlistInfo?.owner || "YouOke"}</span>
                      </div>
                      <span className="opacity-40">•</span>
                      <span>{artist.length} บทเพลงคุณภาพ</span>
                   </div>
                </div>

                <div className="absolute top-6 right-8">
                    <button
                        onClick={() => setTagId("")}
                        className="bg-white/10 hover:bg-white text-white hover:text-black px-6 py-3 rounded-2xl text-xs font-black shadow-2xl flex items-center justify-center gap-3 transition-all duration-500 hover:scale-105 backdrop-blur-2xl border border-white/20 group/btn"
                    >
                        <svg className="w-4 h-4 transition-transform group-hover/btn:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>ย้อนกลับ</span>
                    </button>
                </div>
             </div>
          </div>

          <div className="px-6 mb-6 flex items-center justify-between">
             <h2 className="text-xl font-black text-black">รายการเพลงทั้งหมด</h2>
             <div className="h-[1px] flex-1 bg-gray-100 mx-6 opacity-50" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-6 pb-20">
            {artist.map((item: any, i: number) => {
                const video = item as any;
                return (
                <div
                    key={video.id || video.name + i}
                    className="group cursor-pointer bg-white rounded-[2rem] border border-gray-50 hover:border-primary/10 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(244,63,94,0.08)] flex items-center gap-4 p-3 transition-all active:scale-[0.97] duration-500 relative overflow-hidden"
                    onClick={() => {
                        const artistName = (video.artist_name && video.artist_name !== "Unknown Artist") ? video.artist_name : "";
                        const query = `${video.title} ${artistName}`.trim();
                        setSearchTerm(query);
                    }}
                >
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0 shadow-sm">
                        <Image
                            src={video.coverImageURL || "/icon-cover.png"}
                            alt={video.title}
                            fill
                            unoptimized
                            className="object-cover transition-transform duration-700 group-hover:scale-115"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all duration-300">
                             <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all duration-300">
                                <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                             </div>
                        </div>
                    </div>
                    <div className="flex-1 min-w-0 pr-4">
                        <h3 className="font-black text-[14px] line-clamp-1 text-black leading-tight group-hover:text-primary transition-colors">{video.title || video.name}</h3>
                        <p className="text-[11px] text-gray-400 mt-1 font-bold tracking-tight line-clamp-1">{(video.artist_name && video.artist_name !== "Unknown Artist") ? video.artist_name : "YouTube Music"}</p>
                    </div>
                    
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-l-full opacity-0 group-hover:opacity-100 transition-all duration-300" />
                </div>
                );
            })}
          </div>
        </div>
      ) : (
        <div className="col-span-full">
          {/* 2. ARTIST DIRECTORY (MODE: DEFAULT) */}
          {mode === 'default' && (
            <>
              {/* TIER 1: CATEGORY GRID */}
              {!selectedCategory && (
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000">
                  <div className="px-6 pt-8 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-8 bg-primary rounded-full" />
                        <div>
                            <h1 className="text-3xl font-black text-black tracking-tight">สารบัญศิลปิน</h1>
                            <p className="text-[13px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">ค้นหาเพลงคาราโอเกะตามสไตล์ที่คุณชอบ</p>
                        </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-6 py-6 pb-20">
                    {ARTIST_CATEGORIES.map((cat, idx) => (
                      <div 
                        key={cat.id} 
                        onClick={() => setCategoryId(cat.id)}
                        className={`group relative overflow-hidden rounded-[2.5rem] aspect-[1.8/1] cursor-pointer shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-700 hover:-translate-y-3 bg-gradient-to-br ${cat.gradient} p-[1px]`}
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                         <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                         
                         {/* Abstract Mesh Pattern */}
                         <div className="absolute top-0 right-0 w-48 h-48 bg-white/20 rounded-full blur-[60px] -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-1000 ease-out" />
                         <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-[40px] -ml-16 -mb-16 group-hover:translate-x-10 transition-transform duration-1000" />
                         
                         <div className="absolute inset-0 p-8 flex flex-col justify-end z-10">
                            <h3 className="text-2xl lg:text-3xl font-black text-white leading-tight drop-shadow-sm">{cat.title}</h3>
                            <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500 delay-100">
                                <span className="text-xs font-bold text-white/90 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                                    {cat.artists.length} ศิลปิน
                                </span>
                                <div className="text-[11px] font-bold text-white/70 uppercase tracking-widest leading-none mt-1">
                                    Browse Collection
                                </div>
                            </div>
                         </div>

                         <div className="absolute top-6 right-8 z-10">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/30 shadow-2xl group-hover:rotate-[360deg] transition-all duration-1000 group-hover:scale-110">
                                <ChevronRight className="w-6 h-6 text-white" />
                            </div>
                         </div>

                         {/* Background Tint */}
                         <div className="absolute inset-0 bg-black/5" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TIER 2: ARTIST LIST */}
              {selectedCategory && (
                <div className="animate-in fade-in slide-in-from-right-8 duration-700 ease-out">
                  <div className="px-6 pt-8 pb-8 flex items-end justify-between">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => setCategoryId("")} 
                            className="w-14 h-14 bg-gray-50 border border-gray-100 rounded-[1.5rem] flex items-center justify-center hover:bg-white hover:shadow-xl hover:scale-110 transition-all duration-300 group shadow-sm active:scale-90"
                        >
                            <svg className="w-6 h-6 text-black transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div>
                            <h2 className="text-3xl font-black text-black leading-none">{selectedCategory.title}</h2>
                            <p className="text-[13px] text-gray-400 font-bold mt-2 uppercase tracking-widest">{selectedCategory.artists.length} Professional Artists</p>
                        </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-10 px-6 pb-20">
                    {selectedCategory.artists.map((artist, i) => (
                      <div 
                        key={artist.name + i} 
                        onClick={() => setSearchTerm(cleanSearchQuery(artist.name))} 
                        className="group cursor-pointer flex flex-col items-center"
                        style={{ animationDelay: `${i * 30}ms` }}
                      >
                        <div className="relative w-full aspect-square rounded-[2.5rem] overflow-hidden bg-gray-50 shadow-[0_10px_40px_rgba(0,0,0,0.03)] group-hover:shadow-[0_25px_60px_rgba(0,0,0,0.12)] transition-all duration-700 group-hover:-translate-y-4 group-hover:rotate-2">
                           <Image 
                               src={artist.imageUrl || `/api/spotify/artists/image?name=${encodeURIComponent(artist.name)}`} 
                               alt={artist.name} fill className="object-cover transition-transform duration-1000 group-hover:scale-115 brightness-[0.98] group-hover:brightness-100 grayscale-[0.2] group-hover:grayscale-0" 
                               unoptimized
                            />
                            {/* Subtle Glass Overlay on Hover */}
                            <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        </div>
                        <div className="mt-5 text-center px-2">
                            <p className="text-[15px] font-black text-black group-hover:text-primary transition-colors duration-300 leading-snug line-clamp-1">{artist.name}</p>
                            <div className="w-0 group-hover:w-full h-1 bg-primary rounded-full mx-auto mt-1 transition-all duration-500 ease-out opacity-0 group-hover:opacity-100" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* 3. GENRES / PLAYLISTS (MODE: GENRES) */}
          {mode === 'genres' && (
            <div className="animate-in fade-in duration-500">
               <div className="px-4 pt-4 pb-6">
                    <div className="bg-gray-900 p-8 rounded-[2.5rem] relative overflow-hidden min-h-[160px] flex flex-col justify-center">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -mr-32 -mt-32" />
                        <h2 className="text-3xl font-black text-white leading-tight">ตู้เพลง / แนวเพลง</h2>
                        <p className="text-gray-400 mt-2 font-medium">รวมลิสต์เพลงเด็ดแยกตามแนวดนตรีที่จัดไว้ให้คุณ</p>
                        <div className="absolute bottom-6 right-8 opacity-10">
                            <GridIcon className="w-20 h-20 text-white" />
                        </div>
                    </div>
               </div>

               <div className="px-4 flex flex-wrap gap-2 mb-8">
                  {genres.map(gen => (
                    <button 
                        key={gen} 
                        onClick={() => handleGenre(gen)}
                        className={`px-6 py-2.5 rounded-2xl text-xs font-bold transition-all ${genreText === gen ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        {gen}
                    </button>
                  ))}
               </div>

               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 px-4 pb-20">
                  {(isLoadingGenre && artistCategories.length === 0) ? (
                    getSkeletonItems(10).map(s => <div key={s} className="aspect-square bg-gray-100 rounded-3xl animate-pulse" />)
                  ) : (
                    artistCategories.map(cat => (
                        <div key={cat.tag_id} onClick={() => setTagId(cat.tag_id)} className="group cursor-pointer">
                            <div className="relative aspect-square rounded-[2rem] overflow-hidden bg-gray-100 shadow-sm group-hover:shadow-2xl transition-all duration-300 group-hover:-translate-y-2">
                                <Image src={cat.imageUrl || "/icon-cover.png"} alt={cat.tag_name} fill className="object-cover" unoptimized />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                <div className="absolute inset-0 p-5 flex flex-col justify-end">
                                    <p className="text-white font-bold text-sm leading-tight line-clamp-2">{cat.tag_name}</p>
                                </div>
                            </div>
                        </div>
                    ))
                  )}
               </div>
            </div>
          )}

          {/* 4. LISTENING MODE (MODE: LISTENING) */}
          {mode === 'listening' && (
            <div className="animate-in fade-in duration-500">
               <div className="px-4 pt-4 pb-6">
                    <div className="bg-gradient-to-br from-primary via-primary/80 to-pink-600 p-8 rounded-[2.5rem] relative overflow-hidden min-h-[160px] flex flex-col justify-center shadow-xl shadow-primary/10">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-[80px] -mr-32 -mt-32" />
                        <h2 className="text-3xl font-black text-white leading-tight">โหมดฟังยาวๆ</h2>
                        <p className="text-white/80 mt-2 font-medium">รวมเพลย์ลิสต์เพลงยาว เมดเล่ย์ และ Non-stop</p>
                        <div className="absolute bottom-6 right-8 opacity-20">
                            <Headphones className="w-20 h-20 text-white" />
                        </div>
                    </div>
               </div>
               
               <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 px-4 pb-20">
                  {artistCategories.map(cat => (
                    <div key={cat.tag_id} onClick={() => setTagId(cat.tag_id)} className="group cursor-pointer">
                        <div className="relative aspect-video rounded-3xl overflow-hidden bg-gray-100 shadow-sm group-hover:shadow-xl transition-all">
                            <Image src={cat.imageUrl || "/icon-cover.png"} alt={cat.tag_name} fill className="object-cover" unoptimized />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0" />
                        </div>
                        <p className="mt-3 px-2 text-sm font-bold text-black line-clamp-1">{cat.tag_name}</p>
                    </div>
                  ))}
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
