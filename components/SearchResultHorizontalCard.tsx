import Image from "next/image";
import VideoThumbnail from "./ui/VideoThumbnail";
import { PlayIcon } from "@heroicons/react/24/solid";
import { SearchResult, RecommendedVideo } from "../types/invidious";

interface SearchResultHorizontalCardProps {
  video: SearchResult | RecommendedVideo;
  onClick: () => void;
}

/**
 * Horizontal card layout for search results - optimized for mobile
 * Compact list view with thumbnail and video info
 */
export default function SearchResultHorizontalCard({
  video,
  onClick
}: SearchResultHorizontalCardProps) {
  return (
    <div
      className="relative bg-white/5 backdrop-blur-md border border-white/5 rounded-lg overflow-hidden group cursor-pointer transition-all duration-300 hover:bg-white/10 hover:border-[#FF0000]/30 hover:shadow-[0_0_20px_rgba(255,0,0,0.1)]"
      onClick={onClick}
    >
      <div className="grid grid-cols-3 overflow-hidden">
        {/* Thumbnail - Left Side */}
        <figure className="relative w-full aspect-video overflow-hidden">
          <VideoThumbnail
            src={
              video.videoThumbnails?.find((t) => t.quality === "medium")?.url ||
              video.videoThumbnails?.[0]?.url ||
              `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`
            }
            alt={video.title}
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {/* Play Icon Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
            <PlayIcon className="w-6 h-6 text-[#FF0000] opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all duration-300" />
          </div>
        </figure>

        {/* Video Info - Right Side */}
        <div className="col-span-2 flex flex-col py-2 pl-4 pr-3 justify-center overflow-hidden">
          <h2 className="font-bold text-[13px] leading-snug line-clamp-2 text-white/90 group-hover:text-[#FF0000] transition-colors duration-300">
            {video.title}
          </h2>
          <p className="text-[11px] text-white/40 truncate mt-1 font-semibold">
            {video.author}
          </p>
        </div>
      </div>
    </div>
  );
}
