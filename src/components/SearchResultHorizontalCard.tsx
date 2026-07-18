import Link from "next/link";
import Image from "next/image";
import { Play, ListPlus, Sparkles } from "lucide-react";
import { SearchResult, RecommendedVideo } from "../types/invidious";

interface SearchResultHorizontalCardProps {
  video: SearchResult | RecommendedVideo;
  onClick: () => void;
  onAddToPlaylist?: (e: any) => void;
  onExtractVocals?: (e: any) => void;
}

/**
 * Horizontal card layout for search results - optimized for mobile
 * Compact list view with thumbnail and video info
 */
export default function SearchResultHorizontalCard({
  video,
  onClick,
  onAddToPlaylist,
  onExtractVocals
}: SearchResultHorizontalCardProps) {
  return (
    <div
      className="relative bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 hover:shadow-sm rounded overflow-hidden group cursor-pointer transition-all active:scale-[0.99]"
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
            className="bg-gray-400 dark:bg-zinc-800 object-cover"
            onError={(e) => { e.currentTarget.src = "/icon-cover.png"; }}
          />
          {/* Play Icon Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <Play className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" />
          </div>
        </figure>

        {/* Video Info - Right Side */}
        <div className="col-span-2 flex flex-col py-2 px-3 justify-center overflow-hidden relative">
          <h2 className="font-semibold text-sm leading-tight line-clamp-2 text-gray-900 dark:text-zinc-200 pr-16">
            {video.title}
          </h2>
          {/* Removed author/uploader info */}



          {/* Add to Playlist Button */}
          {onAddToPlaylist && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToPlaylist(e);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full text-gray-400 dark:text-zinc-500 hover:text-primary transition"
            >
              <ListPlus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
