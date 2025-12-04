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
    <div className="relative bg-white hover:bg-base-100 rounded-lg border border-base-300 hover:border-primary overflow-hidden group transition-all shadow-sm">
      {/* Main content */}
      <div className="grid grid-cols-3 overflow-hidden">
        {/* Thumbnail with Play overlay */}
        <figure
          className="relative w-full aspect-video cursor-pointer group/thumbnail bg-gray-200"
          onClick={(e) => {
            e.stopPropagation();
            onPlayNow(video);
          }}
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
            className="object-contain"
          />
          {/* Play icon overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover/thumbnail:bg-black/30 transition-all flex items-center justify-center">
            <PlayIcon className="w-8 h-8 text-white opacity-0 group-hover/thumbnail:opacity-100 transition-opacity drop-shadow-lg" />
          </div>
        </figure>

        {/* Song info */}
        <div
          className="col-span-2 flex flex-row items-center px-3 py-2 overflow-hidden gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="font-semibold text-xs 2xl:text-lg line-clamp-2 text-gray-900 flex-1">
            {video?.title}
          </h2>
          {/* Delete button - Icon style like Cast Modal */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(video);
            }}
            className="flex-shrink-0 w-8 h-8 rounded-lg bg-error/10 hover:bg-error/20 flex items-center justify-center transition-colors"
            title="ลบออกจากคิว"
          >
            <TrashIcon className="w-4 h-4 text-error" />
          </button>
        </div>
      </div>
    </div>
  );
}
