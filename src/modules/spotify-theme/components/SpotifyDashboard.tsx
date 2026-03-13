// Deploy trigger: revert-to-stable
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
];

export default function SpotifyDashboard({ showTab = true, mode = 'default' }: { showTab?: boolean, mode?: 'default' | 'listening' | 'genres' | 'station' }) {
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
        <div className="col-span-full animate-in fade-in duration-500">
          <div className="relative w-full h-[140px] sm:h-[180px] mb-6 group overflow-hidden rounded-2xl mx-2 shadow-sm border border-gray-100 bg-gray-50">
             <Image 
                src={playlistInfo?.imageUrl || artist[0]?.imageUrl || "/icon-cover.png"} 
                alt={playlistInfo?.name || "Playlist"}
                fill 
                className="object-cover scale-105 blur-2xl opacity-20 brightness-50"
                unoptimized
             />
             
             <div className="absolute inset-0 p-4 sm:p-6 flex items-center gap-4 sm:gap-6">
                <div className="relative w-20 h-20 sm:w-32 sm:h-32 flex-shrink-0 rounded-xl overflow-hidden shadow-md bg-white">
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
                   <h1 className="text-xl sm:text-2xl font-bold text-black leading-tight line-clamp-1">
                      {playlistInfo?.name || "รายการเพลง"}
                   </h1>
                   <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium">
                      <span className="text-black font-bold">{playlistInfo?.owner || "YouOke"}</span>
                      <span>•</span>
                      <span>{artist.length} เพลง</span>
                   </div>
                </div>

                <div className="absolute top-4 right-4">
                    <button
                        onClick={() => setTagId("")}
                        className="bg-white hover:bg-gray-50 text-black px-4 py-2 rounded-xl text-[11px] font-bold shadow-sm border border-gray-100 flex items-center gap-2 transition-all"
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
                    className="group cursor-pointer bg-white rounded-xl border border-gray-100 hover:border-primary/20 hover:shadow-md flex flex-col h-full transition-all active:scale-[0.98] duration-300 relative overflow-hidden"
                    onClick={() => {
                        const artistName = (video.artist_name && video.artist_name !== "Unknown Artist") ? video.artist_name : "";
                        const query = `${video.title} ${artistName}`.trim();
                        setSearchTerm(query);
                    }}
                >
                    <div className="relative aspect-video overflow-hidden bg-gray-50 flex-shrink-0">
                    <Image
                        src={video.coverImageURL || "/icon-cover.png"}
                        alt={video.title}
                        fill
                        unoptimized
                        className="object-cover"
                    />
                    </div>
                    <div className="p-2 sm:p-2.5 flex-1">
                    <h3 className="font-bold text-[12px] line-clamp-2 text-black leading-tight group-hover:text-primary transition-colors text-left">{video.title || video.name}</h3>
                    <p className="text-[10px] text-gray-400 mt-1 line-clamp-1 text-left">{(video.artist_name && video.artist_name !== "Unknown Artist") ? video.artist_name : "YouTube Music"}</p>
                    </div>
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
                <div className="animate-in fade-in duration-500">
                  <div className="px-4 pt-6 pb-2">
                    <h1 className="text-xl font-bold text-black">ศิลปินยอดฮิต</h1>
                    <p className="text-[12px] text-gray-400">ชื่อที่คุณคุ้นเคยและชื่นชอบ</p>
                  </div>

                  {/* Top Popular Grid (Fixed 4 columns like core system) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-3 md:gap-4 px-3 md:px-4 py-3 pb-6">
                    {ARTIST_CATEGORIES.find(c => c.id === 'popular')?.artists.slice(0, 12).map((artist, i) => {
                      const cleanName = artist.name.split(' (')[0].trim();
                      const overrideUrl = artistOverrides[cleanName];
                      
                      return (
                        <div 
                          key={artist.name + i}
                          onClick={() => setSearchTerm(cleanSearchQuery(cleanName))}
                          className="group cursor-pointer flex flex-col items-center"
                        >
                          <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm group-hover:shadow-md transition-all duration-300">
                            <Image 
                               src={overrideUrl || `/api/spotify/artists/image?name=${encodeURIComponent(artist.name)}`}
                               alt={artist.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized
                            />
                          </div>
                          <p className="mt-2 text-[10px] sm:text-[11px] font-bold text-black truncate italic-sm text-center w-full">{cleanName}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="px-4 pt-4 pb-2 border-t border-gray-50 mt-2">
                    <h1 className="text-xl font-bold text-black">สารบัญศิลปิน</h1>
                    <p className="text-[12px] text-gray-400">เลือกแนวเพลงเพื่อดูรายชื่อศิลปิน</p>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-3 md:gap-4 px-3 md:px-4 py-4 pb-24">
                    {ARTIST_CATEGORIES.filter(c => c.id !== 'popular').map((cat) => (
                      <div 
                        key={cat.id} 
                        onClick={() => setCategoryId(cat.id)}
                        className={`group relative overflow-hidden rounded-xl aspect-[1.8/1] min-h-[72px] sm:min-h-[80px] cursor-pointer shadow-sm hover:shadow-md transition-all bg-gradient-to-br ${cat.gradient}`}
                      >
                         <div className="absolute inset-0 p-2 flex flex-col justify-end sm:p-2.5">
                            <h3 className="text-[10px] min-[320px]:text-[11px] sm:text-[13px] md:text-[14px] font-bold text-white leading-[1.0] sm:leading-tight drop-shadow-sm line-clamp-2 break-words text-left">{cat.title}</h3>
                            <p className="text-[8px] sm:text-[9px] font-medium text-white/80 mt-0.5 drop-shadow-sm text-left">{cat.artists.length} ศิลปิน</p>
                         </div>
                         <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all">
                            <ChevronRight className="w-3.5 h-3.5 text-white" />
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TIER 2: ARTIST LIST */}
              {selectedCategory && (
                <div className="animate-in fade-in duration-500">
                  <div className="px-4 pt-6 pb-4 flex items-center gap-3">
                    <button 
                        onClick={() => setCategoryId("")} 
                        className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                        <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h2 className="text-base sm:text-lg font-bold text-black">{selectedCategory.title}</h2>
                        <p className="text-[10px] sm:text-[11px] text-gray-400 font-medium">{selectedCategory.artists.length} ศิลปิน</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-3 md:gap-4 px-3 md:px-4 pb-10">
                    {selectedCategory.artists.map((artist, i) => {
                      const cleanName = artist.name.split(' (')[0].trim();
                      const overrideUrl = artistOverrides[cleanName];

                      return (
                        <div 
                          key={artist.name + i} 
                          onClick={() => setSearchTerm(cleanSearchQuery(cleanName))} 
                          className="group cursor-pointer"
                        >
                          <div className="relative aspect-square rounded-2xl overflow-hidden bg-white flex items-center justify-center shadow-sm border border-gray-100 group-hover:shadow-md group-hover:border-primary/20 transition-all">
                            <Image 
                               src={artist.imageUrl || overrideUrl || `/api/spotify/artists/image?name=${encodeURIComponent(artist.name)}`} 
                               alt={artist.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" 
                               unoptimized
                            />
                          </div>
                          <p className="mt-2.5 px-0.5 text-[10px] sm:text-[11px] font-bold text-black text-center group-hover:text-primary transition-colors line-clamp-2 leading-tight h-[24px] sm:h-[32px] flex items-start justify-center italic-sm">{cleanName}</p>
                        </div>
                      );
                    })}
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

               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4 px-4 pb-20">
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

          {/* 4. STATION MODE (MODE: STATION) - NEW THEME GRID */}
          {mode === 'station' && (
            <div className="animate-in fade-in duration-500">
               {!genreText && !tagId ? (
                 <>
                   <div className="px-4 pt-4 pb-6">
                        <div className="bg-gradient-to-br from-indigo-900 via-primary to-rose-900 p-8 rounded-[2.5rem] relative overflow-hidden min-h-[200px] flex flex-col justify-center shadow-2xl shadow-primary/20">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[100px] -mr-40 -mt-40 animate-pulse" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -ml-32 -mb-32" />
                            
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl">
                                        <Headphones className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="text-white/80 font-black uppercase tracking-[0.2em] text-[10px]">On Air Now</span>
                                </div>
                                <h2 className="text-4xl font-black text-white leading-tight mb-2">สถานีเพลง (Non-Stop)</h2>
                                <p className="text-white/70 max-w-lg font-medium text-sm leading-relaxed">
                                    เลือกชุดรวมเพลงในธีมที่คุณชอบ ฟังต่อเนื่องยาวๆ ไฟล์เดียวจบ
                                </p>
                            </div>
                        </div>
                   </div>

                   <div className="px-4 mb-6">
                      <h3 className="text-lg font-black text-black mb-1">เลือกธีมสถานี</h3>
                      <p className="text-xs text-gray-400 font-medium">กดเลือกแนวเพลงที่ต้องการฟังได้เลยครับ</p>
                   </div>

                   <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 px-4 pb-32">
                      {[
                        { id: 'lukthung', title: 'ลูกทุ่งฟังยาว', color: 'from-orange-500 to-red-600', icon: '👒' },
                        { id: 'pueachiwit', title: 'เพื่อชีวิตชุดใหญ่', color: 'from-amber-600 to-yellow-800', icon: '🎸' },
                        { id: 'string90s', title: 'สตริงยุค 90', color: 'from-indigo-500 to-purple-600', icon: '📀' },
                        { id: 'morlam', title: 'หมอลำจัดเต็ม', color: 'from-pink-500 to-rose-600', icon: '🥁' },
                        { id: 'hits90s', title: 'รวมเพลงฮิตอมตะ', color: 'from-blue-500 to-cyan-600', icon: '🌟' },
                        { id: 'international', title: 'สากลฟังเพลิน', color: 'from-emerald-500 to-teal-700', icon: '🌎' },
                      ].map((theme) => (
                        <div 
                          key={theme.id}
                          onClick={() => setGenreText(theme.title)}
                          className={`cursor-pointer p-8 rounded-[2.5rem] bg-gradient-to-br ${theme.color} transition-all hover:scale-[1.03] active:scale-95 shadow-lg relative overflow-hidden group min-h-[140px] flex items-center`}
                        >
                           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                              <span className="text-6xl grayscale group-hover:grayscale-0 transition-all">{theme.icon}</span>
                           </div>
                           <h4 className="text-2xl font-black text-white drop-shadow-md relative z-10">{theme.title}</h4>
                        </div>
                      ))}
                   </div>
                 </>
               ) : (
                 <div className="animate-in slide-in-from-right duration-500 px-4">
                    <div className="flex items-center gap-4 mb-8 pt-4">
                        <button 
                          onClick={() => setGenreText("")}
                          className="w-10 h-10 bg-white border border-gray-100 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-all"
                        >
                           <ChevronRight className="w-5 h-5 text-black rotate-180" />
                        </button>
                        <div>
                           <h2 className="text-2xl font-black text-black">{genreText}</h2>
                           <p className="text-xs text-gray-400 font-medium">พบ {artistCategories.length} รายการเพลงยาว</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-20">
                      {artistCategories.map(cat => (
                        <div key={cat.tag_id} onClick={() => setTagId(cat.tag_id)} className="group cursor-pointer">
                            <div className="relative aspect-video rounded-3xl overflow-hidden bg-gray-100 shadow-sm group-hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
                                <Image src={cat.imageUrl || "/icon-cover.png"} alt={cat.tag_name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" unoptimized />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute inset-0 p-5 flex flex-col justify-end">
                                    <p className="text-white font-black text-sm leading-tight line-clamp-2 drop-shadow-md">{cat.tag_name}</p>
                                </div>
                            </div>
                        </div>
                      ))}
                    </div>
                 </div>
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
