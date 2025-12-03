import Image from "next/image";
import { PlayIcon } from "@heroicons/react/24/solid";
import { Single } from "../types";

interface TopicHorizontalCardProps {
  topic: Single;
  onClick: () => void;
}

/**
 * Horizontal card layout for trending songs - optimized for mobile
 * Adapted from VideoHorizontalCard design pattern
 */
export default function TopicHorizontalCard({
  topic,
  onClick
}: TopicHorizontalCardProps) {
  return (
    <div
      className="relative bg-white shadow hover:shadow-md rounded overflow-hidden group cursor-pointer transition-shadow"
      onClick={onClick}
    >
      <div className="grid grid-cols-3 overflow-hidden">
        {/* Album Cover - Left Side */}
        <figure className="relative w-full aspect-square">
          <Image
            src={topic.coverImageURL || "/placeholder-album.png"}
            alt={topic.title}
            fill
            sizes="(max-width: 768px) 33vw, 200px"
            className="object-cover"
          />
          {/* Play Icon Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <PlayIcon className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </figure>

        {/* Song Info - Right Side */}
        <div className="col-span-2 flex flex-col p-3 justify-center gap-1 overflow-hidden">
          <h2 className="font-semibold text-sm line-clamp-2 text-gray-900">
            {topic.title}
          </h2>
          <p className="text-xs text-gray-500 truncate">
            {topic.artist_name}
          </p>
        </div>
      </div>
    </div>
  );
}
