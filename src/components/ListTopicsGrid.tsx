import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { PlayIcon, ChevronLeftIcon } from "@heroicons/react/24/solid";
import { usePlayerStore } from "../modules/player/stores/usePlayerStore";
import { useUIStore } from "../stores/useUIStore";
import { YOUTUBE_GENRES } from "../data/genres"; // Keep as fallback

interface ExploreSection {
  title: string;
  items: {
    playlistId: string;
    title: string;
    thumbnail: string;
    videoCount: string;
    isSong?: boolean;
    videoId?: string;
    author?: string;
  }[];
}

export default function ListTopicsGrid({ showTab = true }) {
  const { setActiveIndex, setSearchTerm } = usePlayerStore();
  const [isLoading, setIsLoading] = useState(false);
  const [exploreSections, setExploreSections] = useState<ExploreSection[]>([]);
  const [useFallback, setUseFallback] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null); // Ref for auto-scrolling

  // Detail View State (Drill Down)
  const [detailSections, setDetailSections] = useState<ExploreSection[] | null>(null);

  // Handle Browser Back & UI Back Integration
  useEffect(() => {
    const handlePopState = () => {
      // If user presses browser back, close details
      if (detailSections) {
        setDetailSections(null);
      }
    };

    window.addEventListener('popstate', handlePopState);

    if (detailSections) {
      // If details are open, UI Back Button should trigger history.back()
      // to keep history stack in sync (since we pushState on open)
      useUIStore.getState().setBackAction(() => window.history.back());
    } else {
      useUIStore.getState().setBackAction(null);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
      useUIStore.getState().setBackAction(null);
    };
  }, [detailSections]);

  // Scroll to top when results are loaded
  useEffect(() => {
    if (!useFallback && exploreSections.length > 0) {
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [exploreSections, useFallback]);

  // Fetch Dynamic Explore Data
  useEffect(() => {
    const fetchExplore = async () => {
      try {
        const res = await axios.get('/api/explore');
        const sections = res.data.sections || res.data.data;
        if (sections && sections.length > 0) {
          setExploreSections(sections);
        } else {
          setUseFallback(true);
        }
      } catch (error) {
        console.error("Failed to fetch explore feed, using fallback", error);
        setUseFallback(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExplore();
  }, []);

  const handlePlaylistClick = async (playlistId: string, title: string) => {
    setIsLoading(true);
    try {
      console.log(`▶️ Fetching playlist: ${title} (${playlistId})`);
      const playlistRes = await axios.get(`/api/playlist/${playlistId}`);
      const videos = playlistRes.data.videos;

      if (videos && videos.length > 0) {
        // Show as Detail View
        setDetailSections([
          {
            title: `Playlist: ${title}`,
            items: videos.map((v: any) => ({
              playlistId: v.videoId,
              title: v.title,
              thumbnail: v.videoThumbnails?.[0]?.url || `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`,
              videoCount: v.author,
              isSong: true,
              videoId: v.videoId,
              author: v.author
            }))
          }
        ]);

        // Push state for history navigation support
        if (typeof window !== 'undefined') {
          window.history.pushState({ view: 'playlist' }, '');
        }
      }
    } catch (e) {
      console.error("Failed to load playlist", e);
      alert("ไม่สามารถโหลดรายชื่อเพลงได้ครับ");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuerySearch = async (query: string) => {
    setIsLoading(true);
    try {
      const searchRes = await axios.get(`/api/search/playlists`, { params: { q: query } });
      if (searchRes.data && searchRes.data.length > 0) {
        // Show results as Detail View
        setDetailSections([
          {
            title: `ผลการค้นหา: "${query}"`,
            items: searchRes.data
          }
        ]);
      } else {
        throw new Error("No results");
      }
    } catch (e) {
      console.error(e);
      alert("ค้นหาไม่เจอครับ - กรุณาลองใหมีกครั้ง");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="col-span-full pt-4 px-2 pb-20">
      <div ref={scrollRef} className="scroll-mt-32" />

      {isLoading && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <span className="text-white font-medium">กำลังโหลดรายการเพลง...</span>
          </div>
        </div>
      )}

      {/* Dynamic Sections or Detail View */}
      {(detailSections || (!useFallback ? exploreSections : [])).map((section, idx) => (
        <div key={idx} className="mb-8">
          <div className="flex items-center gap-2 mb-4 px-2">
            {detailSections && (
              <button onClick={() => setDetailSections(null)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                <ChevronLeftIcon className="w-5 h-5 text-black" />
              </button>
            )}
            <h2 className="text-xl font-bold text-black">{section.title}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {section.items.map((item) => (
              <div
                key={item.playlistId || item.videoId}
                onClick={() => {
                  if (item.isSong && item.videoId) {
                    usePlayerStore.getState().addToQueue({
                      videoId: item.videoId,
                      title: item.title,
                      author: item.author || "Unknown",
                      thumbnail: item.thumbnail,
                      id: item.videoId,
                      sourceType: 'youtube'
                    });
                    usePlayerStore.getState().playNext();
                    import('../stores/useUIStore').then(({ useUIStore }) => {
                      useUIStore.getState().setQueueOpen(true);
                    });
                  } else {
                    handlePlaylistClick(item.playlistId, item.title)
                  }
                }}
                className="relative aspect-square rounded-xl cursor-pointer overflow-hidden shadow-lg hover:shadow-xl transition-all hover:scale-105 group bg-gray-900"
              >
                <img
                  src={item.thumbnail?.replace('mqdefault', 'hqdefault') || `https://i.ytimg.com/vi/mqdefault.jpg`}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-white font-thin text-[10px] line-clamp-2">{item.title}</h3>
                  <p className="text-white/70 text-[9px] mt-1 font-thin opacity-80">{item.videoCount || "Playlist"}</p>
                </div>
                <PlayIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-all drop-shadow-lg" />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Fallback View (Static Genres) */}
      {useFallback && !detailSections && (
        <div>
          <h2 className="text-xl font-bold text-black mb-4 px-2 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-primary">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19.5v-6h6v6" />
            </svg>
            หมวดหมู่เพลงฮิต
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {YOUTUBE_GENRES.map((genre: any) => (
              <div
                key={genre.query}
                onClick={() => handleQuerySearch(genre.query)}
                className="relative h-28 rounded-2xl cursor-pointer overflow-hidden bg-gray-100 border border-gray-100 hover:border-primary transition-all duration-300 group"
              >
                <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors" />
                <div className="absolute top-4 left-4">
                  <h3 className="text-black font-black text-lg group-hover:text-primary transition-colors">{genre.title}</h3>
                  <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">{genre.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
