import React from "react";
import Image from "next/image";
import { PlayIcon, LockClosedIcon, RectangleStackIcon, FolderPlusIcon, TrashIcon, PencilIcon, EllipsisVerticalIcon, HandThumbUpIcon } from "@heroicons/react/24/solid";
import { Video } from "../modules/player/types";

export interface PlaylistCardProps {
    id: string;
    name: string;
    count: number;
    thumbnail?: string;
    videoId?: string; // Fallback if thumbnail missing
    type?: string; // "public" | "private" | "ส่วนตัว"
    onClick?: () => void;
    // Actions
    onPlay?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onLike?: () => void;
    // State
    activeIndex?: number; // 0 = Community, 1 = My Playlist
    isRecommended?: boolean; // If true, simpler layout (for ListRecommendedPlaylists)
}

export default function PlaylistCard({
    id,
    name,
    count,
    thumbnail,
    videoId,
    type,
    onClick,
    onPlay,
    onEdit,
    onDelete,
    onLike,
    activeIndex = 0,
    isRecommended = false,
}: PlaylistCardProps) {

    // Resolve Image Source
    const imageSrc = thumbnail || (videoId ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` : "");

    const isPrivate = type === "private" || type === "ส่วนตัว";

    return (
        <div
            onClick={onClick}
            className="group relative flex flex-col gap-3 cursor-pointer select-none"
        >
            {/* Cover Image - Unified Premium Card Style */}
            {/* Fixed: White Background + Border to prevent "Gray Circle" visual glitch */}
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-white shadow-sm group-hover:shadow-xl transition-all duration-500 ease-out group-hover:-translate-y-1.5 isolation-isolate border-2 border-gray-100 group-hover:border-primary/20">

                {/* Fallback Background (Visible if image missing/error) */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-gray-400">
                    {isRecommended ? <FolderPlusIcon className="w-12 h-12" /> : <RectangleStackIcon className="w-12 h-12" />}
                    <span className="text-[10px] font-bold mt-1 uppercase tracking-wider opacity-50">Empty</span>
                </div>

                {/* Actual Image */}
                {imageSrc ? (
                    <Image
                        src={imageSrc}
                        alt={name}
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-700 group-hover:scale-110 relative z-10"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                ) : null}

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20" />

                {/* Privacy Badge */}
                {isPrivate && (
                    <div className="absolute top-2.5 left-2.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center gap-1.5 shadow-sm z-30">
                        <LockClosedIcon className="w-3 h-3 text-white" />
                        <span className="text-[10px] text-white font-bold tracking-wide">ส่วนตัว</span>
                    </div>
                )}

                {/* Play Overlay (Recommended Mode) */}
                {isRecommended && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {/* No circle, just click to open */}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex justify-between items-start px-1 mt-1">
                <div className="min-w-0 flex-1 pr-2">
                    <h3 className="font-bold text-[13px] sm:text-[14px] text-gray-800 truncate group-hover:text-primary transition-colors leading-tight">
                        {name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                        {isRecommended ? (
                            <p className="text-xs text-gray-500">Playlist</p>
                        ) : (
                            <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                                {count} เพลง
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions (My Playlist Mode) */}
                {!isRecommended && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200" onClick={(e) => e.stopPropagation()}>
                        {activeIndex === 1 ? (
                            <div className="dropdown dropdown-end dropdown-top">
                                <button tabIndex={0} className="btn btn-sm btn-ghost h-8 w-8 min-h-0 rounded-lg hover:bg-base-200 p-0">
                                    <EllipsisVerticalIcon className="w-5 h-5 text-gray-400" />
                                </button>
                                <ul tabIndex={0} className="dropdown-content z-[20] menu p-1.5 shadow-xl bg-white rounded-xl w-36 text-xs border border-gray-100">
                                    <li><button onClick={onEdit} className="py-2.5 font-medium"><PencilIcon className="w-4 h-4" /> แก้ไข</button></li>
                                    <li><button onClick={onDelete} className="py-2.5 text-error font-medium hover:bg-error/5"><TrashIcon className="w-4 h-4" /> ลบ</button></li>
                                </ul>
                            </div>
                        ) : (
                            <button onClick={(e) => { e.preventDefault(); onLike && onLike(); }} className="btn btn-sm btn-ghost h-8 w-8 min-h-0 rounded-lg p-0 text-gray-400 hover:text-primary hover:bg-primary/5">
                                <HandThumbUpIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
