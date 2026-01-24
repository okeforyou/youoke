import Image from "next/image";
import { useState, Fragment } from "react";
import {
    PencilIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";
import {
    EllipsisVerticalIcon,
    HandThumbUpIcon,
    LockClosedIcon,
    PlayIcon,
} from "@heroicons/react/24/solid";

interface PlaylistCardItemProps {
    item: any; // Type as 'any' to match existing loose typing, or define Playlist interface if possible
    index: number;
    isOwner: boolean;
    userId: string | undefined;
    onPlay: (playlists: any[]) => void;
    onClick: (item: any) => void;
    onLike: (id: string) => void;
    onEdit: (item: any) => void;
    onDelete: (id: string) => void;
}

export default function PlaylistCardItem({
    item,
    index,
    isOwner,
    userId,
    onPlay,
    onClick,
    onLike,
    onEdit,
    onDelete,
}: PlaylistCardItemProps) {
    // Safe initial image derivation
    const initialImage = item?.playlists?.length && item.playlists[0]?.videoId
        ? `https://i.ytimg.com/vi/${item.playlists[0]?.videoId}/mqdefault.jpg`
        : "/icon-cover.png";

    const [imgSrc, setImgSrc] = useState(initialImage);

    return (
        <div
            className="card rounded-lg bg-white shadow hover:shadow-md flex-auto"
        >
            <figure
                className="relative w-full cursor-pointer aspect-video group"
                onClick={(e) => {
                    e.stopPropagation();
                    onPlay(item.playlists);
                }}
            >
                <Image
                    src={imgSrc}
                    alt={item.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                    className="object-cover"
                    loading="lazy"
                    onError={() => {
                        // Robust fallback: if YouTube thumb fails, use local cover
                        if (imgSrc !== "/icon-cover.png") {
                            setImgSrc("/icon-cover.png");
                        }
                    }}
                />
                <div className="absolute top-0 left-0 w-full h-0 flex flex-col justify-center items-center bg-stone-900 opacity-0 group-hover:h-full group-hover:opacity-50 duration-500">
                    <PlayIcon className="w-8 h-8 text-white opacity-100" />
                </div>
            </figure>
            <div
                className="card-body p-3 gap-y-0 relative cursor-pointer"
                onClick={() => onClick(item)}
            >
                <h2 className="font-semibold text-sm 2xl:text-lg line-clamp-2 items-center">
                    <span className="flex items-center gap-x-1 ">
                        {item.name}{" "}
                        {item.type === "private" && (
                            <LockClosedIcon className="w-3 h-3 text-gray-500" />
                        )}
                    </span>
                    <div className="font-light text-xs text-gray-500 flex flex-row justify-between items-center">
                        {item.playlists?.length || 0} รายการ
                        <HandThumbUpIcon
                            title="ถูกใจ"
                            className={`w-5 h-5 text-gray-300 hover:text-primary cursor-pointer ${(isOwner || !userId) && "hidden"
                                }`}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onLike(item.id);
                            }}
                        />
                    </div>
                </h2>
                {isOwner && (
                    <div
                        className="dropdown dropdown-end absolute right-2 top-4"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                    >
                        <div tabIndex={index} role="button" className="float-right ">
                            <EllipsisVerticalIcon className="w-4 h-4 text-gray-500" />
                        </div>
                        <ul
                            tabIndex={index}
                            className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-32 text-xs"
                        >
                            <li
                                onClick={() => {
                                    onEdit(item);
                                }}
                            >
                                <a>
                                    <PencilIcon className="w-4 h-4 text-gray-500" />
                                    แก้ไข
                                </a>
                            </li>
                            <li className="text-red-600">
                                <a onClick={() => onDelete(item.id)}>
                                    <TrashIcon className="w-4 h-4" />
                                    ลบ
                                </a>
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
