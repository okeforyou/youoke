import Image from "next/image";
import { Single } from "../types";

interface TopicGridCardProps {
  topic: Single;
  onClick: () => void;
}

/**
 * Grid card layout for trending songs - optimized for desktop
 * Vertical card with square album cover
 */
export default function TopicGridCard({
  topic,
  onClick
}: TopicGridCardProps) {
  return (
    <div
      className="card rounded-lg overflow-hidden bg-white shadow hover:shadow-md cursor-pointer flex-auto transition-shadow"
      onClick={onClick}
    >
      {/* Album Cover - Top */}
      <figure className="relative w-full aspect-square">
        <Image
          unoptimized
          src={topic.coverImageURL || "/assets/avatar.jpeg"}
          priority
          alt={topic.title}
          layout="fill"
          className="animate-pulse bg-gray-400 object-cover"
          onLoad={(ev) => ev.currentTarget.classList.remove("animate-pulse")}
          onErrorCapture={(ev) => {
            ev.currentTarget.src = "/assets/avatar.jpeg";
          }}
        />
      </figure>

      {/* Song Info - Bottom */}
      <div className="card-body p-2 gap-y-0">
        <h2 className="font-semibold text-sm 2xl:text-lg line-clamp-2">
          {topic.title}
        </h2>
        <h2 className="text-xs 2xl:text-lg text-gray-400">
          {topic.artist_name}
        </h2>
      </div>
    </div>
  );
}
