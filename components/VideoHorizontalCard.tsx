import Image from "next/image";

import {
  BarsArrowUpIcon,
  PlayIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

import { PlaylistItem } from "../types";

interface VideoHorizontalCardProps {
  video: PlaylistItem;
  onPlayNow?: (video: PlaylistItem) => void;
  onSelect?: (video: PlaylistItem) => void;
  onDelete?: (video: PlaylistItem) => void;
}
export default function VideoHorizontalCard({
  video,
  onPlayNow = () => {},
  onSelect = () => {},
  onDelete = () => {},
}: VideoHorizontalCardProps) {
  return (
    <div
      tabIndex={0}
      className="collapse bg-white shadow hover:shadow-md rounded cursor-pointer"
    >
      <div className="collapse-title p-0 flex-1 grid grid-cols-3 overflow-hidden">
        <figure className="relative w-full aspect-video">
          <Image
            unoptimized
            src={`${process.env.NEXT_PUBLIC_INVIDIOUS_URL}vi/${video?.videoId}/mqdefault.jpg`}
            priority
            alt={video?.title}
            layout="fill"
            className="bg-gray-400 col-span-1"
          />
        </figure>

        <div className="col-span-2 flex flex-col p-[1vw] overflow-hidden gap-2">
          <h2 className="font-semibold text-xs 2xl:text-xl line-clamp-2">
            {video?.title}
          </h2>
          <p className="text-xs 2xl:text-xl truncate">{video?.author}</p>
        </div>
      </div>

      <div className="collapse-content p-0">
        <div className="flex flex-row gap-1 px-2 pt-4 pb-0 border-t text-xs">
          <div
            className="btn  btn-primary flex-auto 2xl:text-2xl gap-2 text-xs"
            onClick={() => onPlayNow(video)}
          >
            <PlayIcon className="w-5 h-5" />
            เล่นเลย
          </div>

          <div
            className="btn  btn-primary flex-auto  2xl:text-2xl gap-2 text-xs"
            onClick={() => onSelect(video)}
          >
            <BarsArrowUpIcon className="w-5 h-5" />
            เล่นเป็นคิวแรก
          </div>
          <div
            className="btn  btn-ghost text-error flex-auto 2xl:text-2xl gap-2 text-xs"
            onClick={() => onDelete(video)}
          >
            <TrashIcon className="w-5 h-5" />
            ลบออกจากคิว
          </div>
        </div>
      </div>
    </div>
  );
}
