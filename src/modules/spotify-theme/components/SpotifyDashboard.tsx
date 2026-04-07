// Deploy trigger: updated-line-api-credentials-v2
import Image from "next/image";
import { Fragment, useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/router";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";

import { OKE_PLAYLIST } from "../../../const/common";
import { usePlayerStore } from "../../../modules/player/stores/usePlayerStore";
import { useListSingerState } from "../../../hooks/listSinger";
import { GetTopArtists, SearchPlaylists } from "../../../types";
import { useSystem } from "../../../core/container/SystemContext";
import {
  getArtists,
  getSkeletonItems,
  getTopArtists,
  searchPlaylists,
  getSearchResult,
  cleanSearchQuery,
  getJooxCharts,
} from "../../../utils/api";
import JooxError from "../../../components/JooxError";
import { useSystemConfig } from "../../../hooks/useSystemConfig";
import { useUIStore } from "../../../stores/useUIStore";
import { Headphones, Library, ChevronRight, Grid as GridIcon, Headphones as HeadphonesIcon, Music, Guitar, Disc, Mic2, Star, Globe, Heart, Mic, Coffee, Radio, PlayCircle } from "lucide-react";
import { clsx } from "clsx";
import { ARTIST_CATEGORIES, ArtistCategory } from "../../../data/artist-categories";
import { PackageStore } from "../../../components/profile/PackageStore";

import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebase";

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
  "ยอมรับ",
];

export default function SpotifyDashboard({ showTab = true, mode = 'default' }: { showTab?: boolean, mode?: 'default' | 'listening' | 'genres' | 'station' }) {
  const router = useRouter();
  const { user } = useSystem().auth();
  const { config } = useSystemConfig();
  const { showConfirm } = useUIStore();
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

  const [artistOverrides, setArtistOverrides] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchOverrides = async () => {
      if (!db) return;
      try {
        const snapshot = await getDocs(collection(db, "artist_images"));
        const data: Record<string, string> = {};
        snapshot.forEach(doc => {
          data[doc.id] = doc.data().imageUrl;
        });
        setArtistOverrides(data);
      } catch (err) {
        console.warn("Failed to fetch artist overrides:", err);
      }
    };
    fetchOverrides();
  }, []);

  const playlistRef = useRef<HTMLDivElement>(null);
  const songlistRef = useRef<HTMLDivElement>(null);
  const stationContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode === 'station' && genreText) {
      requestAnimationFrame(() => {
        if (stationContentRef.current) {
          stationContentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
  }, [genreText, mode]);

  useEffect(() => {
    if (mode === 'default' && selectedCategoryId) {
      requestAnimationFrame(() => {
        if (songlistRef.current) {
          songlistRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
  }, [selectedCategoryId, mode]);

  const { data: tempTopArtistsData, isLoading: isLoadTopArtists } = useQuery({
    queryKey: ["getTopArtists", "v2", mode],
    queryFn: () => getTopArtists(mode === 'station' ? 'listening' : (mode as any)),
    retry: false,
    refetchInterval: 0,
  });

  useEffect(() => {
    if (tempTopArtistsData && (genreText === "แนะนำ" || genreText === "ลูกทุ่ง" || topArtistsData.artistCategories.length === 0)) {
      setTopArtistsData(tempTopArtistsData);
    }
  }, [tempTopArtistsData, genreText, topArtistsData.artistCategories.length]);

  const { data: hitsData, isLoading } = useQuery({
    queryKey: ["jooxCharts"],
    queryFn: getJooxCharts,
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 48,
  });

  const { data: artists, isLoading: isLoadArtists } = useQuery({
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
    queryFn: ({ pageParam = 1 }) => searchPlaylists(genreText || "เพลงไทย", pageParam, mode === 'station' ? 'listening' : (mode as any)),
    getNextPageParam: (lastPage, allPages) => {
      return (lastPage?.artistCategories?.length === 20) ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: (mode === 'genres' || mode === 'listening' || mode === 'station') && genreText !== "เพลงไทย" && genreText !== "แนะนำ",
  });

  const genrePlaylists = playlistData?.pages?.flatMap(page => page.artistCategories) || [];

  useEffect(() => {
    if (genreText !== "เพลงไทย" && (mode === 'genres' || mode === 'listening' || mode === 'station')) {
      refetch();
    }
  }, [genreText, refetch, mode]);

  const { searchTerm, setSearchTerm, addToQueue } = usePlayerStore();

  const { 
    data: stationData, 
    isLoading: isLoadStation,
    fetchNextPage: fetchNextStationPage,
    hasNextPage: hasNextStationPage,
    isFetchingNextPage: isFetchingNextStationPage
  } = useInfiniteQuery({
    queryKey: ["stationSearch", genreText || searchTerm, mode],
    queryFn: ({ pageParam = 0 }) => getSearchResult({ 
        q: (genreText || searchTerm) + " รวมเพลง", 
        long: true,
        page: pageParam as number
    }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
        return lastPage && lastPage.length > 0 ? allPages.length : undefined;
    },
    enabled: mode === 'station' && !!(genreText || searchTerm),
    retry: false,
  });

  const stationResults = useMemo(() => {
    const rawResults = stationData?.pages?.flatMap(page => page) || [];
    const uniqueMap = new Map();
    return rawResults.filter(video => {
        if (!video.videoId) return false;
        if (uniqueMap.has(video.videoId)) return false;
        uniqueMap.set(video.videoId, true);
        return true;
    });
  }, [stationData?.pages]);

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
    <div className="flex flex-col w-full pb-20 bg-white dark:bg-zinc-950 transition-colors">
      {tagId && artist ? (
        <div className="col-span-full animate-in fade-in duration-500">
          <div className="relative w-full h-[140px] sm:h-[180px] mb-6 group overflow-hidden rounded-2xl mx-2 shadow-sm border border-gray-100 dark:border-zinc-900 bg-gray-50 dark:bg-zinc-950">
             <Image 
                src={playlistInfo?.imageUrl || artist[0]?.imageUrl || "/icon-cover.png"} 
                alt={playlistInfo?.name || "Playlist"}
                fill 
                className="object-cover scale-105 blur-2xl opacity-20 brightness-50"
                unoptimized
             />
             
             <div className="absolute inset-0 p-4 sm:p-6 flex items-center gap-4 sm:gap-6">
                <div className="relative w-20 h-20 sm:w-32 sm:h-32 flex-shrink-0 rounded-xl overflow-hidden shadow-md bg-white dark:bg-zinc-900">
                   <Image 
                      src={playlistInfo?.imageUrl || artist[0]?.imageUrl || "/icon-cover.png"} 
                      alt={playlistInfo?.name}
                      fill 
                      className="object-cover"
                      unoptimized
                   />
                </div>
                
                <div className="flex-1 space-y-1">
                   <p className="text-[10px] font-bold uppercase text-primary">เพลย์ลิสต์</p>
                   <h1 className="text-xl sm:text-2xl font-bold text-black dark:text-white leading-tight line-clamp-1">
                      {playlistInfo?.name || "รายการเพลง"}
                   </h1>
                   <div className="flex items-center gap-2 text-[11px] text-black dark:text-zinc-400 font-black">
                      <span className="text-black dark:text-zinc-300 font-black">{playlistInfo?.owner || "YouOke"}</span>
                      <span>•</span>
                      <span>{artist.length} เพลง</span>
                   </div>
                </div>

                <div className="absolute top-4 right-4">
                    <button
                        onClick={() => setTagId("")}
                        className="bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800 text-black dark:text-white px-4 py-2 rounded-xl text-[11px] font-bold shadow-sm border border-gray-100 dark:border-zinc-800 flex items-center gap-2 transition-all"
                    >
                        ย้อนกลับ
                    </button>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-3 px-4 pb-20">
            {artist.map((item: any, i: number) => {
                const video = item as any;
                return (
                <div
                    key={video.id || video.name + i}
                    className="group cursor-pointer bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 hover:border-primary/20 hover:shadow-md flex flex-col h-full transition-all active:scale-[0.98] duration-300 relative overflow-hidden"
                    onClick={() => {
                        const artistName = (video.artist_name && video.artist_name !== "Unknown Artist") ? video.artist_name : "";
                        const query = `${video.title} ${artistName}`.trim();
                        setSearchTerm(query);
                    }}
                >
                    <div className="relative aspect-video overflow-hidden bg-gray-50 dark:bg-zinc-950 flex-shrink-0">
                    <Image
                        src={video.coverImageURL || "/icon-cover.png"}
                        alt={video.title}
                        fill
                        unoptimized
                        className="object-cover"
                    />
                    </div>
                    <div className="p-2 sm:p-2.5 flex-1">
                      <h3 className="font-bold text-[12px] line-clamp-2 text-black dark:text-white leading-tight group-hover:text-primary transition-colors text-left">{video.title || video.name}</h3>
                      <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1 line-clamp-1 text-left">{(video.artist_name && video.artist_name !== "Unknown Artist") ? video.artist_name : "YouTube Music"}</p>
                    </div>
                </div>
                );
            })}
          </div>
        </div>
      ) : (
        <div className="col-span-full">
          {mode === 'default' && (
            <div className="animate-in fade-in duration-700 pb-20">
              {!selectedCategoryId && (
                <div className="animate-in fade-in duration-500">
                  <div className="px-4 pt-6 pb-2">
                    <h1 className="text-xl font-bold text-black dark:text-white">ศิลปินยอดฮิต</h1>
                    <p className="text-[12px] text-black dark:text-zinc-500 font-black">ชื่อที่คุณคุ้นเคยและชื่นชอบ</p>
                  </div>

                  <div className="grid grid-cols-2 min-[500px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4 gap-3 md:gap-4 px-3 md:px-4 py-3">
                    {ARTIST_CATEGORIES.find(c => c.id === 'popular')?.artists.slice(0, 12).map((artist, i) => {
                      const cleanName = artist.name.split(' (')[0].trim();
                      const overrideUrl = artistOverrides[cleanName];
                      
                      return (
                        <div key={artist.name + i} onClick={() => setSearchTerm(cleanSearchQuery(cleanName))} className="group cursor-pointer">
                          <div className="relative aspect-square rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm group-hover:shadow-md transition-all duration-300">
                            <Image 
                               src={overrideUrl || `/api/spotify/artists/image?name=${encodeURIComponent(artist.name)}`}
                               alt={artist.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                          </div>
                          <p className="mt-2.5 text-[10px] sm:text-[11px] font-bold text-black dark:text-zinc-400 text-center truncate italic-sm w-full group-hover:text-primary dark:group-hover:text-primary transition-colors">{cleanName}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="px-4 pt-6 pb-3">
                <h1 className="text-lg font-black text-black dark:text-white">สารบัญศิลปิน</h1>
                <p className="text-[11px] text-black dark:text-zinc-500 font-black">แยกตามหมวดหมู่และแนวเพลง</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 md:gap-4 px-3 md:px-4 mb-4">
                {ARTIST_CATEGORIES.filter(c => c.id !== 'popular').map((cat) => {
                  const Icon = 
                    cat.id === 'luk-thung' ? Mic2 :
                    cat.id === 'mor-lam' ? Music :
                    cat.id === 'thai-pop' ? Disc :
                    cat.id === 'rock-thai' ? Guitar :
                    cat.id === 'retro-hits' ? Star :
                    cat.id === 'teen-pop' ? Heart :
                    cat.id === 'rnb-soul-th' ? Mic :
                    cat.id === 'indie-th' ? Coffee :
                    cat.id === 'luk-grung' ? Radio :
                    Globe;
                  
                  const isActive = selectedCategoryId === cat.id;

                  return (
                    <div 
                      key={cat.id} 
                      onClick={() => setCategoryId(cat.id === selectedCategoryId ? "" : cat.id)}
                      className={clsx(
                        "group relative overflow-hidden rounded-xl aspect-[1.7/1] min-h-[72px] sm:min-h-[80px] cursor-pointer shadow-sm transition-all border-2",
                        isActive ? "border-primary scale-[1.02] shadow-md ring-2 ring-primary/20" : "border-transparent bg-white dark:bg-zinc-900 shadow-sm"
                      )}
                    >
                       <div className={clsx(
                          "absolute inset-0 bg-gradient-to-br transition-opacity duration-300", 
                          cat.gradient,
                          isActive ? "opacity-100" : "opacity-90 group-hover:opacity-100"
                       )} />

                 <div className="absolute -bottom-4 -right-4 opacity-20 transform -rotate-12 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500">
                   <Icon className="w-24 h-24 text-white" />
                 </div>
                 
                 <div className="absolute inset-0 p-3 sm:p-4 flex flex-col justify-end">
                  <h3 className="text-sm sm:text-base font-bold text-white leading-tight drop-shadow-sm line-clamp-2 mb-1">{cat.title}</h3>
                  <p className="text-[10px] text-white font-black line-clamp-1">{cat.description}</p>
                 </div>

                       {isActive && (
                         <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-md p-1 rounded-full border border-white/30 animate-in zoom-in-50 duration-300">
                            <PlayCircle className="w-3.5 h-3.5 text-white" />
                         </div>
                       )}
                    </div>
                  );
                })}
              </div>

              {/* TIER 3: INTEGRATED RESULT LIST */}
              {selectedCategory && (
                <div ref={songlistRef} className="animate-in slide-in-from-bottom-8 duration-500 scroll-mt-20">
                  <div className="px-4 pt-4 pb-4 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-base sm:text-xl font-bold text-black dark:text-white">{selectedCategory.title}</h2>
                        <p className="text-[10px] sm:text-[11px] text-black dark:text-zinc-500 font-black">รายชื่อศิลปินทั้งหมดในหมวดหมู่นี้</p>
                    </div>
                    <button onClick={() => setCategoryId("")} className="text-xs font-bold text-primary hover:underline">ปิดรายการ</button>
                  </div>
                  
                  <div className="grid grid-cols-2 min-[500px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4 gap-3 md:gap-4 px-3 md:px-4 pb-20">
                    {selectedCategory.artists.map((artist, i) => {
                      const cleanName = artist.name.split(' (')[0].trim();
                      const overrideUrl = artistOverrides[cleanName];

                      return (
                        <div key={artist.name + i} onClick={() => setSearchTerm(cleanSearchQuery(cleanName))} className="group cursor-pointer">
                          <div className="relative aspect-square rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm group-hover:shadow-md transition-all">
                            <Image 
                               src={overrideUrl || `/api/spotify/artists/image?name=${encodeURIComponent(artist.name)}`} 
                               alt={artist.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" unoptimized
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                          </div>
                          <p className="mt-2 text-[10px] sm:text-[11px] font-bold text-black dark:text-zinc-400 text-center group-hover:text-primary transition-colors italic-sm">{cleanName}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. GENRES / PLAYLISTS (MODE: GENRES) */}
          {mode === 'genres' && (
            <div className="animate-in fade-in duration-500">
               <div className="px-4 pt-4 pb-6">
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-800 p-5 sm:p-8 rounded-2xl relative overflow-hidden min-h-[130px] flex flex-col justify-center border border-gray-200/50 dark:border-zinc-800 shadow-sm">
                        <h2 className="text-2xl sm:text-3xl font-black text-black dark:text-white leading-tight">ตู้เพลง / แนวเพลง</h2>
                        <p className="text-[13px] sm:text-base !text-black dark:!text-zinc-400 mt-2 font-black">บทเพลงที่คัดสรรมาเพื่อคุณโดยเฉพาะ</p>
                        <div className="absolute bottom-6 right-8 opacity-20">
                            <GridIcon className="w-20 h-20 text-white" />
                        </div>
                    </div>
               </div>

               <div className="px-4 flex flex-wrap gap-2 mb-8">
                  {genres.map(gen => (
                    <button 
                        key={gen} 
                        onClick={() => setGenreText(gen)}
                        className={`px-6 py-2.5 rounded-2xl text-xs font-bold transition-all ${genreText === gen ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-gray-100 dark:bg-zinc-900 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-800'}`}
                    >
                        {gen}
                    </button>
                  ))}
               </div>

               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4 px-4 pb-20">
                  {(isLoadingGenre && artistCategories.length === 0) ? (
                    getSkeletonItems(10).map(s => <div key={s} className="aspect-video bg-gray-100 dark:bg-zinc-900 rounded-3xl animate-pulse" />)
                  ) : (
                    artistCategories.map(cat => (
                        <div key={cat.tag_id} onClick={() => setTagId(cat.tag_id)} className="group cursor-pointer">
                            <div className="relative aspect-video rounded-3xl overflow-hidden bg-gray-100 dark:bg-zinc-900 shadow-sm group-hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
                                <Image src={cat.imageUrl || "/icon-cover.png"} alt={cat.tag_name} fill className="object-cover" unoptimized />
                                    <div className="absolute inset-0 p-3 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent">
                                    <p className="text-white font-bold text-sm leading-tight line-clamp-2">{cat.tag_name}</p>
                                    </div>
                            </div>
                        </div>
                    ))
                  )}
               </div>
            </div>
          )}

          {/* 4. STATION MODE (MODE: STATION) - MASTER PLAN UI */}
          {mode === 'station' && (
            <div className="animate-in fade-in duration-700 pb-32">
               {!tagId && (
                 <>
                   <div className="px-4 pt-4 pb-6">
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-800 p-5 sm:p-8 rounded-2xl relative overflow-hidden min-h-[130px] flex flex-col justify-center border border-gray-200/50 dark:border-zinc-800 shadow-sm">
                            <h2 className="text-2xl sm:text-3xl font-black text-black dark:text-white leading-tight">สถานีเพลง</h2>
                            <p className="text-[13px] sm:text-base !text-black dark:!text-zinc-400 mt-2 font-black">รวมชุดเพลงยาว ฟังต่อเนื่อง สำหรับเปิดทิ้งไว้</p>
                            <div className="absolute bottom-6 right-8 opacity-5">
                                <Headphones className="w-20 h-20 text-black dark:text-white" />
                            </div>
                        </div>
                   </div>

                   <div className="px-4 mb-6">
                      <h3 className="text-base sm:text-lg font-black text-black dark:text-white mb-1">เลือกสถานีเพลง</h3>
                      <p className="text-[10px] sm:text-xs !text-black dark:!text-zinc-500 font-black">กดเลือกแนวเพลงที่ต้องการฟังได้เลยครับ</p>
                   </div>

                   <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-3 md:gap-4 px-3 md:px-4 mb-4">
                      {ARTIST_CATEGORIES.filter(c => c.id !== 'popular').map((cat) => {
                        const Icon = 
                          cat.id === 'luk-thung' ? Mic2 :
                          cat.id === 'mor-lam' ? Music :
                          cat.id === 'thai-pop' ? Disc :
                          cat.id === 'rock-thai' ? Guitar :
                          cat.id === 'retro-hits' ? Star :
                          cat.id === 'teen-pop' ? Heart :
                          cat.id === 'rnb-soul-th' ? Mic :
                          cat.id === 'indie-th' ? Coffee :
                          cat.id === 'luk-grung' ? Radio :
                          Globe;
                        
                        const isActive = genreText === cat.title;

                        return (
                          <div 
                            key={cat.id} 
                            onClick={() => setGenreText(cat.title === genreText ? "" : cat.title)}
                            className={clsx(
                              "group relative overflow-hidden rounded-xl aspect-[1.7/1] min-h-[72px] sm:min-h-[80px] cursor-pointer shadow-sm transition-all border-2",
                              isActive ? "border-primary scale-[1.02] shadow-md ring-2 ring-primary/20" : "border-transparent bg-white dark:bg-zinc-900 shadow-sm"
                            )}
                          >
                             <div className={clsx(
                                "absolute inset-0 bg-gradient-to-br transition-opacity duration-300", 
                                cat.gradient,
                                isActive ? "opacity-100" : "opacity-90 group-hover:opacity-100"
                             )} />

                             <div className="absolute -bottom-2 -right-2 opacity-20 transform -rotate-12 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500">
                               <Icon className="w-16 h-16 sm:w-20 sm:h-20 text-white" />
                             </div>
                             <div className="absolute inset-0 p-2 flex flex-col justify-end sm:p-2.5">
                                <h3 className="text-[10px] min-[320px]:text-[11px] sm:text-[13px] md:text-[14px] font-black leading-[1.1] sm:leading-tight drop-shadow-md text-white line-clamp-2 text-left">{cat.title}</h3>
                             </div>

                             {isActive && (
                               <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-md p-1 rounded-full border border-white/30 animate-in zoom-in-50 duration-300">
                                  <PlayCircle className="w-3.5 h-3.5 text-white" />
                               </div>
                             )}
                          </div>
                        );
                      })}
                   </div>

                   {/* Station Result Content (Master Plan UI) */}
                   {(genreText || searchTerm) && (
                     <div ref={stationContentRef} className="animate-in slide-in-from-bottom-8 duration-500 scroll-mt-20 px-4">
                        <div className="flex items-center justify-between mb-6 pt-4 border-t border-gray-100 dark:border-zinc-800">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{genreText || searchTerm}</h2>
                                <p className="text-[11px] text-black dark:text-zinc-500 font-black">รวมเพลงยาว ({stationResults?.length || 0} รายการ)</p>
                            </div>
                            <button onClick={() => setGenreText("")} className="text-xs font-bold text-primary hover:underline">ปิดรายการ</button>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-3 md:gap-4 pb-20 overflow-hidden">
                          {isLoadStation ? (
                            getSkeletonItems(8).map(s => <div key={s} className="aspect-video bg-gray-100 dark:bg-zinc-900 rounded-2xl animate-pulse" />)
                          ) : (
                            stationResults?.map((video: any, idx: number) => (
                                <div key={video.videoId + idx} onClick={() => {
                                    const videoToAdd = {
                                        id: video.videoId,
                                        sourceType: 'youtube',
                                        videoId: video.videoId,
                                        title: video.title,
                                        author: video.author,
                                        thumbnail: undefined,
                                    } as any;
                                    
                                    // 🛡️ v4.9.74: Simple Login Check - If not logged in, block station access.
                                    if (!user) {
                                      showConfirm({
                                          title: "👑 เข้าสู่ระบบเพื่อฟังเพลง",
                                          message: "สถานีเพลง (Music Station) นี้สำหรับสมาชิกเท่านั้น กรุณาเข้าสู่ระบบเพื่อรับฟังเพลงต่อเนื่องแบบไม่มีโฆษณาครับ",
                                          confirmText: "เข้าสู่ระบบ",
                                          cancelText: "เอาไว้ก่อน",
                                          onConfirm: () => useUIStore.getState().setProfileOpen(true)
                                      });
                                      return;
                                    }

                                    addToQueue(videoToAdd);
                                }} className="group cursor-pointer overflow-hidden max-w-full">
                                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm group-hover:shadow-md transition-all">
                                        <Image src={`https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`} alt={video.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" unoptimized />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                          <PlayCircle className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-300 drop-shadow-lg" />
                                        </div>
                                    </div>
                                    <p className="mt-2.5 px-0.5 text-[10px] sm:text-[11px] font-bold text-black dark:text-zinc-400 text-center group-hover:text-primary transition-colors block truncate w-full italic-sm">
                                        {video.title}
                                    </p>
                                </div>
                            ))
                          )}

                          {/* v4.9.41: Load More Station Results */}
                          {hasNextStationPage && (
                            <div className="col-span-full py-8 flex justify-center">
                              <button
                                onClick={() => fetchNextStationPage()}
                                disabled={isFetchingNextStationPage}
                                className={clsx(
                                  "px-8 py-3 rounded-2xl font-black text-sm transition-all flex items-center gap-2",
                                  isFetchingNextStationPage 
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                                    : "bg-white dark:bg-zinc-900 text-primary border border-primary/20 hover:bg-primary/5 hover:shadow-lg active:scale-95"
                                )}
                              >
                                {isFetchingNextStationPage ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                    <span>กำลังค้นหาเพิ่ม...</span>
                                  </>
                                ) : (
                                  <>
                                    <Radio className="w-4 h-4" />
                                    <span>ค้นหาชุดเพลงยาวเพิ่มเติม (+)</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                     </div>
                   )}
                 </>
               )}
            </div>
          )}

          {/* 5. LISTENING MODE (MODE: LISTENING) - DEPRECATED / REDIRECTED */}
          {mode === 'listening' && (
            <div className="p-20 text-center">
               <button onClick={() => router.push({ pathname: '/', query: { tab: 'station' } })} className="bg-primary text-white px-8 py-3 rounded-2xl font-bold">
                  ไปที่สถานีเพลง
               </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
