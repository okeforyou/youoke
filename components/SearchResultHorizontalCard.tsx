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
      className="relative bg-white border border-gray-100/50 shadow-sm hover:shadow-md rounded-xl overflow-hidden group cursor-pointer transition-all duration-300 h-24 md:h-28"
      onClick={onClick}
    >
      <div className="flex h-full flex-row overflow-hidden">
        {/* Thumbnail - Left Side */}
        <figure className="relative h-full aspect-video w-[120px] sm:w-40 md:w-48 flex-shrink-0 overflow-hidden">
          <VideoThumbnail
            src={
              video.videoThumbnails?.find((t) => t.quality === "medium")?.url ||
              video.videoThumbnails?.[0]?.url ||
              `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`
            }
            alt={video.title}
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
          />
          {/* Play Icon Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-primary/90 flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300 shadow-lg translate-y-2 group-hover:translate-y-0">
              <PlayIcon className="w-4 h-4 text-white ml-0.5" />
            </div>
          </div>
        </figure>

        {/* Video Info - Right Side */}
        <div className="flex-1 flex flex-col pt-2 pb-1.5 px-3 md:px-4 justify-between overflow-hidden">
          <h2 className="font-bold text-xs md:text-sm lg:text-base leading-snug line-clamp-2 text-gray-800 transition-colors group-hover:text-primary">
            {video.title}
          </h2>
          <div className="flex items-center gap-2">
            <p className="text-[10px] md:text-xs font-medium text-gray-400 truncate bg-gray-50/50 px-2 py-0.5 rounded border border-gray-50">
              {video.author}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
