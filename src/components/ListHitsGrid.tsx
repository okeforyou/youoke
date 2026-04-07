import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { BarChart2, ChevronRight, Flame, Sparkles, Star, Trophy, ArrowLeft, PlayCircle } from "lucide-react";
import { getJooxCharts } from "../utils/api";
import { Single } from "../types";
import { clsx } from "clsx";

const CHART_CATEGORIES = [
  {
    id: "top100",
    jooxId: 42,
    title: "ฮิตติดชาร์ต อันดับ 1",
    gradient: "from-amber-500 to-orange-600",
    Icon: Trophy
  },
  {
    id: "new_releases",
    jooxId: 128,
    title: "เพลงใหม่มาแรง",
    gradient: "from-emerald-500 to-teal-700",
    Icon: Sparkles
  },
  {
    id: "trending",
    jooxId: 133,
    title: "อัปเดตเพลงฮิต",
    gradient: "from-rose-500 to-red-700",
    Icon: Flame
  },
  {
    id: "all_time_hits",
    jooxId: 57,
    title: "ฮิตตลอดกาล",
    gradient: "from-violet-500 to-purple-700",
    Icon: Star
  }
];

export default function ListHitsGrid({ onClick: onPlay }: { onClick?: (hit: Single) => void }) {
  const router = useRouter();
  const [selectedChart, setSelectedChart] = useState<string | null>(null);
  const songListRef = useRef<HTMLDivElement>(null);

  const { data: hitsData, isLoading } = useQuery({
    queryKey: ["jooxCharts"],
    queryFn: getJooxCharts,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const chartItems = useMemo(() => {
    if (!hitsData?.charts || !selectedChart) return [];
    
    const category = CHART_CATEGORIES.find(c => c.id === selectedChart);
    if (!category) return [];

    const jooxChart = hitsData.charts.find((c: any) => c.id === category.jooxId);
    return jooxChart?.singles || [];
  }, [hitsData, selectedChart]);

  const activeChart = CHART_CATEGORIES.find(c => c.id === selectedChart);

  useEffect(() => {
    if (selectedChart && songListRef.current) {
        songListRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedChart]);

  const handleClick = (hit: Single) => {
    if (onPlay) {
      onPlay(hit);
      return;
    }
    const artist = (hit.artist_name && hit.artist_name !== "Unknown Artist") ? hit.artist_name : "";
    const query = `${hit.title} ${artist}`.trim();
    router.push({
      pathname: router.pathname,
      query: { ...router.query, search: query }
    }, undefined, { shallow: true });
  };

  return (
    <div className="animate-in fade-in duration-700 pb-32">
      {/* Header Section */}
      <div className="px-4 pt-4 pb-6">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-800 p-5 sm:p-8 rounded-2xl relative overflow-hidden min-h-[100px] sm:min-h-[130px] flex flex-col justify-center border border-gray-200/50 dark:border-zinc-800 shadow-sm">
           <h2 className="text-2xl sm:text-3xl font-black text-black dark:text-white leading-tight">ชาร์ตเพลง</h2>
           <p className="hidden sm:block text-[13px] sm:text-base !text-black dark:!text-zinc-400 mt-2 font-black">เกาะติดกระแสเพลงฮิต อัปเดตใหม่ล่าสุดตลอดเวลา</p>
           <div className="absolute bottom-6 right-8 opacity-10">
              <BarChart2 className="w-16 h-16 sm:w-20 sm:h-20 text-black dark:text-white" />
           </div>
        </div>
      </div>

      {/* Category Selection Grid - Optimized for Mobile Overlapping */}
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 px-3 md:px-4 mb-8">
        {CHART_CATEGORIES.map((cat) => {
          const Icon = cat.Icon;
          const isActive = selectedChart === cat.id;
          return (
            <div 
              key={cat.id}
              onClick={() => setSelectedChart(cat.id === selectedChart ? null : cat.id)}
              className={clsx(
                "group relative overflow-hidden rounded-2xl aspect-[3.2/1] min-[480px]:aspect-[1.6/1] cursor-pointer transition-all duration-300 shadow-sm border-2",
                isActive ? "border-primary scale-[1.02] shadow-md ring-4 ring-primary/10" : "border-transparent hover:shadow-lg bg-white dark:bg-zinc-900"
              )}
            >
               <div className={clsx(
                 "absolute inset-0 bg-gradient-to-br transition-opacity duration-300",
                 cat.gradient,
                 isActive ? "opacity-100" : "opacity-90 group-hover:opacity-100"
               )} />
                <div className={clsx(
                  "absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300", 
                  isActive ? "opacity-100" : "opacity-80 group-hover:opacity-100"
                )} />
                
                <div className="absolute -bottom-4 -right-4 opacity-20 transform -rotate-12 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500">
                  <Icon className="w-20 h-20 sm:w-24 sm:h-24 text-white" />
                </div>
                
                <div className="absolute inset-0 p-3 flex flex-col justify-end">
                  <h3 className="text-[11px] sm:text-base font-black text-white leading-tight uppercase tracking-tighter drop-shadow-md line-clamp-2 text-left">
                    {cat.title}
                  </h3>
                </div>
               
               {isActive && (
                 <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-md p-1.5 rounded-full border border-white/30">
                    <PlayCircle className="w-4 h-4 text-white" />
                 </div>
               )}
            </div>
          );
        })}
      </div>

      {/* Song List Section */}
      {selectedChart && (
        <div ref={songListRef} className="animate-in slide-in-from-bottom-8 duration-500 scroll-mt-20 px-4">
           <div className="flex items-center justify-between mb-6 pt-8 border-t border-gray-100 dark:border-zinc-800">
              <div>
                 <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {activeChart?.title}
                    <span className="text-xs bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 px-2 py-0.5 rounded-full font-medium">#{activeChart?.jooxId}</span>
                 </h2>
                  <p className="text-[11px] text-black dark:text-zinc-500 font-black">รายการเพลงที่คัดสรรมาเพื่อความสุขของคุณ ({chartItems.length} รายการ)</p>
              </div>
              <button 
                onClick={() => setSelectedChart(null)}
                className="text-xs font-bold text-primary hover:underline"
              >
                ปิดรายการ
              </button>
           </div>

           {isLoading ? (
             <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4 gap-3 md:gap-4">
                {[...Array(12)].map((_, i) => (
                   <div key={i} className="aspect-square bg-gray-100 rounded-2xl animate-pulse" />
                ))}
             </div>
           ) : chartItems.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-zinc-600">
                <BarChart2 className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm font-medium">ไม่พบรายการเพลงในขณะนี้ กรุณาลองใหม่ภายหลัง</p>
             </div>
           ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4 gap-3 md:gap-4">
               {chartItems.map((hit: any, index: number) => (
                 <div 
                   key={`${hit.jooxId || index}-${index}`} 
                   onClick={() => handleClick(hit)} 
                   className="group cursor-pointer overflow-hidden max-w-full relative"
                 >
                    {/* Ranking Badge */}
                    <div className="absolute top-2 left-2 z-10 w-5 h-5 bg-black/70 backdrop-blur-md rounded-lg flex items-center justify-center text-white text-[9px] font-bold border border-white/20 shadow-sm">
                      {index + 1}
                    </div>

                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 shadow-sm group-hover:shadow-md transition-all">
                       <Image 
                          src={hit.coverImageURL || "/icon-cover.png"}
                          alt={hit.title} 
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105" 
                          unoptimized
                       />
                       <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <PlayCircle className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-300 drop-shadow-lg" />
                       </div>
                    </div>
                    <p className="mt-2 px-0.5 text-[10px] sm:text-[11px] font-bold text-black dark:text-zinc-400 group-hover:text-primary transition-colors block truncate w-full italic-sm text-center">
                       {hit.title}
                    </p>
                    <p className="text-[9px] text-gray-400 dark:text-zinc-500 font-medium block truncate w-full text-center mt-0.5 mb-2">
                       {(hit.artist_name && hit.artist_name !== "Unknown Artist") ? hit.artist_name : "YouTube Music"}
                    </p>
                 </div>
               ))}
             </div>
           )}
        </div>
      )}
    </div>
  );
}
