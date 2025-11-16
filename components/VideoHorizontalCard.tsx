import Image from "next/image";
import { PlayIcon, TrashIcon } from "@heroicons/react/24/solid";
import { PlaylistItem } from "../types";

interface VideoHorizontalCardProps {
  video: PlaylistItem;
  onPlayNow?: (video: PlaylistItem) => void;
  onDelete?: (video: PlaylistItem) => void;
}

export default function VideoHorizontalCard({
  video,
  onPlayNow = () => {},
  onDelete = () => {},
}: VideoHorizontalCardProps) {
  return (
    <div className="relative bg-white shadow hover:shadow-md rounded overflow-hidden group">
      {/* Main content */}
      <div className="grid grid-cols-3 overflow-hidden">
        {/* Thumbnail with Play overlay */}
        <figure
          className="relative w-full aspect-video cursor-pointer group/thumbnail"
          onClick={() => onPlayNow(video)}
        >
          <Image
            unoptimized
            src={
              video?.videoThumbnails?.find((t) => t.quality === "medium")?.url ||
              video?.videoThumbnails?.[0]?.url ||
              `https://i.ytimg.com/vi/${video?.videoId}/mqdefault.jpg`
            }
            priority
            alt={video?.title}
            layout="fill"
            className="bg-gray-400 col-span-1"
          />
          {/* Play icon overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover/thumbnail:bg-black/30 transition-all flex items-center justify-center">
            <PlayIcon className="w-12 h-12 text-white opacity-0 group-hover/thumbnail:opacity-100 transition-opacity drop-shadow-lg" />
          </div>
        </figure>

        {/* Song info */}
        <div className="col-span-2 flex flex-col p-[1vw] overflow-hidden gap-2 justify-center">
          <h2 className="font-semibold text-xs 2xl:text-xl line-clamp-2">
            {video?.title}
          </h2>
          <div className="flex items-center gap-2">
            <p className="text-xs 2xl:text-xl truncate text-gray-500 flex-1">
              {video?.author}
            </p>
            {/* Delete button - Next to artist name */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(video);
              }}
              className="flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
              title="ลบออกจากคิว"
            >
              <TrashIcon className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
