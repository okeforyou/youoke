import { useState, useMemo } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { BarChart2, ChevronRight, Flame, Sparkles, Star, Trophy, ArrowLeft } from "lucide-react";
import { getHitSingles } from "../utils/api";
import { Single } from "../types";

const CHART_CATEGORIES = [
  {
    id: "top100",
    title: "ฮิตติดชาร์ต อันดับ 1",
    description: "รวมเพลงฮิตที่สุดในตารางตอนนี้",
    gradient: "from-amber-500 to-orange-600",
    Icon: Trophy
  },
  {
    id: "new_releases",
    title: "เพลงใหม่มาแรง",
    description: "อัปเดตเพลงใหม่ที่กำลังเป็นกระแส",
    gradient: "from-emerald-500 to-teal-700",
    Icon: Sparkles
  },
  {
    id: "trending",
    title: "อัปเดตเพลงฮิต",
    description: "เพลงฮิตติดหูที่ใครก็ฟังกัน",
    gradient: "from-rose-500 to-red-700",
    Icon: Flame
  },
  {
    id: "best2024",
    title: "ที่สุดแห่งปี 2024",
    description: "รวบรวมเพลงยอดเยี่ยมแห่งปี",
    gradient: "from-violet-500 to-purple-700",
    Icon: Star
  }
];

export default function ListHitsGrid() {
  const router = useRouter();
  const [selectedChart, setSelectedChart] = useState<string | null>(null);

  const { data: hitsData, isLoading } = useQuery({
    queryKey: ["hitSingles"],
    queryFn: getHitSingles,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  const allHits = hitsData?.singles || [];

  // Temporary mock data mapping until the actual JOOX scraper backend is built
  const chartItems = useMemo(() => {
    switch (selectedChart) {
      case "top100":
        return allHits.slice(0, 50);
      case "new_releases":
        return [...allHits].reverse().slice(0, 30);
      case "trending":
        return [...allHits].sort(() => Math.random() - 0.5).slice(0, 40);
      case "best2024":
        return [...allHits].filter((_, i) => i % 2 === 0).slice(0, 30);
      default:
        return [];
    }
  }, [allHits, selectedChart]);

  const activeChart = CHART_CATEGORIES.find(c => c.id === selectedChart);

  const handleClick = (hit: Single) => {
    const artist = (hit.artist_name && hit.artist_name !== "Unknown Artist") ? hit.artist_name : "";
    const query = `${hit.title} ${artist}`.trim();
    router.push({
      pathname: router.pathname,
      query: { ...router.query, search: query }
    }, undefined, { shallow: true });
  };

  if (!selectedChart) {
    return (
      <div className="animate-in fade-in duration-500">
        <div className="px-4 pt-4 pb-6">
          <div className="bg-gradient-to-br from-gray-900 to-black p-8 rounded-[2.5rem] relative overflow-hidden min-h-[140px] flex flex-col justify-center shadow-lg">
             <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -mr-32 -mt-32" />
             <h2 className="text-3xl font-black text-white leading-tight">ชาร์ตเพลง</h2>
             <p className="text-gray-400 mt-2 font-medium">เกาะติดกระแสเพลงฮิต อัปเดตใหม่ล่าสุดตลอดเวลา</p>
             <div className="absolute bottom-6 right-8 opacity-10">
                <BarChart2 className="w-20 h-20 text-white" />
             </div>
          </div>
        </div>

        <div className="px-4 mb-4">
          <h3 className="text-lg font-black text-black mb-1">เลือกหมวดหมู่ชาร์ต</h3>
          <p className="text-xs text-gray-400 font-medium">กดเลือกชาร์ตจัดอันดับที่คุณสนใจ</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 px-3 md:px-4 pb-32">
          {CHART_CATEGORIES.map((cat) => {
            const Icon = cat.Icon;
            return (
              <div 
                key={cat.id}
                onClick={() => setSelectedChart(cat.id)}
                className={`group relative overflow-hidden rounded-xl aspect-[1.6/1] cursor-pointer shadow-sm hover:shadow-lg transition-all duration-300 bg-gradient-to-br ${cat.gradient}`}
              >
                 <div className="absolute -bottom-4 -right-4 opacity-20 transform -rotate-12 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500">
                   <Icon className="w-24 h-24 text-white" />
                 </div>
                 <div className="absolute inset-0 p-4 flex flex-col justify-end">
                    <h3 className="text-sm sm:text-base font-bold text-white leading-tight drop-shadow-sm line-clamp-2 mb-1">{cat.title}</h3>
                    <p className="text-[10px] text-white/80 font-medium line-clamp-1">{cat.description}</p>
                 </div>
                 <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                    <ChevronRight className="w-5 h-5 text-white" />
                 </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in slide-in-from-right-4 duration-500 pb-24">
      <div className="px-4">
        <div className="flex items-center gap-4 mb-6 pt-4">
            <button 
              onClick={() => setSelectedChart(null)}
              className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-all"
            >
               <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
               <h2 className="text-xl font-bold text-gray-900">{activeChart?.title}</h2>
               <p className="text-[11px] text-gray-500 font-medium">{activeChart?.description} ({chartItems.length} รายการ)</p>
            </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-3 md:gap-4 px-1">
             {[...Array(12)].map((_, i) => (
                <div key={i} className="aspect-video bg-gray-100 rounded-2xl animate-pulse" />
             ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-3 md:gap-4 px-1">
            {chartItems.map((hit, index) => (
              <div 
                key={`${hit.title}-${index}`} 
                onClick={() => handleClick(hit)} 
                className="group cursor-pointer overflow-hidden max-w-full relative"
              >
                 {/* Ranking Badge */}
                 <div className="absolute top-2 left-2 z-10 w-6 h-6 bg-black/70 backdrop-blur-md rounded-lg flex items-center justify-center text-white text-[10px] font-bold border border-white/20 shadow-sm">
                   {index + 1}
                 </div>

                 <div className="relative aspect-video rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm group-hover:shadow-md transition-all">
                    {/* The image component requires domains configured in next.config.js, so using standard img to be safe, or unoptimized Image */}
                    <img 
                       src={hit.coverImageURL}
                       alt={hit.title} 
                       className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                       loading="lazy"
                    />
                 </div>
                 <p className="mt-2.5 px-0.5 text-[10px] sm:text-[11px] font-bold text-black group-hover:text-primary transition-colors block truncate w-full italic-sm text-center">
                    {hit.title}
                 </p>
                 <p className="text-[9px] text-gray-400 font-medium block truncate w-full text-center mt-0.5">
                    {(hit.artist_name && hit.artist_name !== "Unknown Artist") ? hit.artist_name : "YouTube Music"}
                 </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
