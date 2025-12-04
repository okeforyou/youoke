import Image from "next/image";
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
      className="relative bg-white shadow hover:shadow-md rounded overflow-hidden group cursor-pointer transition-shadow"
      onClick={onClick}
    >
      <div className="grid grid-cols-3 overflow-hidden">
        {/* Thumbnail - Left Side */}
        <figure className="relative w-full aspect-video">
          <Image
            unoptimized
            src={
              video.videoThumbnails?.find((t) => t.quality === "medium")?.url ||
              video.videoThumbnails?.[0]?.url ||
              `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`
            }
            priority
            alt={video.title}
            layout="fill"
            className="bg-gray-400 object-cover"
          />
          {/* Play Icon Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <PlayIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </figure>

        {/* Video Info - Right Side */}
        <div className="col-span-2 flex flex-col py-2 pl-3 pr-2 justify-center overflow-hidden">
          <h2 className="font-semibold text-xs leading-tight line-clamp-2 text-gray-900">
            {video.title}
          </h2>
          <p className="text-xs text-gray-500 truncate mt-0.5">
            {video.author}
          </p>
        </div>
      </div>
    </div>
  );
}
