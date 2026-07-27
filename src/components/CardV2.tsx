import React from "react";
import Image from "next/image";
import {
    PlayIcon,
    LockClosedIcon,
    RectangleStackIcon,
    FolderPlusIcon,
    TrashIcon,
    PencilIcon,
    EllipsisVerticalIcon,
    HandThumbUpIcon,
    MusicalNoteIcon
} from "@heroicons/react/24/solid";
import { MicVocal, Drum, Guitar, Piano, Music } from "lucide-react";

interface CardV2Props {
    id: string;
    name: string;
    count: number;
    thumbnail?: string;
    videoId?: string;
    type?: string;
    onClick?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onLike?: () => void;
    activeIndex?: number;
    isRecommended?: boolean;
    aiBadgeText?: string;
    badgeColor?: string;
}

export default function CardV2({
    name,
    count,
    thumbnail,
    videoId,
    type,
    onClick,
    onEdit,
    onDelete,
    onLike,
    activeIndex = 0,
    isRecommended = false,
    aiBadgeText,
    badgeColor = "bg-primary",
}: CardV2Props) {

    // Logic: Image source or fallback - Use sddefault (640x480) for better quality than hq (480x360)
    const imageSrc = thumbnail || (videoId ? `https://i.ytimg.com/vi/${videoId}/sddefault.jpg` : "");
    const isPrivate = type === "private" || type === "ส่วนตัว";

    return (
        <div
            onClick={onClick}
            className="group relative flex flex-col gap-3 cursor-pointer select-none"
        >
            {/* 1. Card Container: Explicitly 16:9, White Bg, Rounded */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-white dark:bg-zinc-950 shadow-sm border-2 border-gray-100 dark:border-zinc-900 group-hover:border-primary/50 group-hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">

                {/* 2. FALLBACK Layer (Bottom) */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100/50 dark:bg-zinc-900/50 text-gray-300 dark:text-zinc-600 z-0">
                    <MusicalNoteIcon className="w-16 h-16 opacity-20" />
                    <span className="text-[10px] font-black uppercase tracking-widest mt-2 opacity-40">ไม่มีปก</span>
                </div>

                {/* 3. Image Layer (Middle) - NATIVE IMG TAG (No Next.js Blur) */}
                {imageSrc && (
                    <img
                        src={imageSrc}
                        alt={name}
                        className="absolute inset-0 w-full h-full object-cover z-10 transition-transform duration-700 group-hover:scale-110"
                        style={{ filter: 'none' }} // Explicitly disable filters
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                )}

                {/* 4. Overlay Layer - Removed based on user request "no black transparent" */}
                { /* <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" /> */}

                {/* 5. Privacy Badge (Top Left) - Styled as Badge with Safe Area Spacing */}
                {isPrivate && (
                    <div className="absolute top-4 left-4 z-30 m-2">
                        <div className="badge badge-neutral shadow-md font-bold border-none text-white gap-1 h-6 px-3">
                            <LockClosedIcon className="w-3 h-3" />
                            ส่วนตัว
                        </div>
                    </div>
                )}

                {type === 'youtube_personal' && (
                    <div className="absolute top-4 left-4 z-30 m-2">
                        <div className="badge bg-red-600 shadow-md font-bold border-none text-white gap-1 h-6 px-3">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                            YouTube
                        </div>
                    </div>
                )}

                {aiBadgeText && (
                    <div style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 30 }}>
                        <span style={{ 
                            display: 'inline-block', 
                            padding: '4px 8px', 
                            borderRadius: '6px', 
                            backgroundColor: 'rgba(0,0,0,0.85)', 
                            color: 'white', 
                            fontSize: '11px', 
                            fontWeight: 'bold',
                            border: '1px solid rgba(255,255,255,0.2)',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
                        }}>
                            {aiBadgeText}
                        </span>
                    </div>
                )}

                {/* 6. Action Button Overlay (Center) */}
                {activeIndex === 3 && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/10">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onClick) onClick();
                            }}
                            className="flex items-center justify-center w-12 h-12 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-md transition-all shadow-lg hover:scale-110 active:scale-95 border border-white/30"
                        >
                            <PlayIcon className="w-6 h-6 ml-1" />
                        </button>
                    </div>
                )}
            </div>

            {/* 7. Info Section */}
            <div className="flex justify-between items-start px-1">
                <div className="flex-1 min-w-0 pr-2">
                    <h3 className="font-bold text-gray-900 dark:text-zinc-200 truncate group-hover:text-primary transition-colors text-[14px] leading-tight">
                        {name}
                    </h3>
                    {activeIndex !== 3 && (
                        <p className="text-[11px] font-medium text-gray-500 dark:text-zinc-500 mt-1 flex items-center gap-2">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
                                {count} เพลง
                            </span>
                        </p>
                    )}
                </div>

                {/* 8. Action Buttons (Right) - SQUARES ONLY */}
                {!isRecommended && (
                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                        {activeIndex === 1 || activeIndex === 3 ? (
                            <div className="dropdown dropdown-end dropdown-top">
                                <button tabIndex={0} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg text-gray-400 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                                    <EllipsisVerticalIcon className="w-5 h-5" />
                                </button>
                                <ul tabIndex={0} className="dropdown-content z-[50] menu p-1 shadow-xl bg-white dark:bg-zinc-900 rounded-xl w-32 border border-gray-100 dark:border-zinc-800 text-xs font-bold">
                                    {activeIndex === 1 && (
                                        <li><a onClick={onEdit} className="dark:text-zinc-300 dark:hover:bg-zinc-800"><PencilIcon className="w-4 h-4" /> แก้ไข</a></li>
                                    )}
                                    <li><a onClick={onDelete} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"><TrashIcon className="w-4 h-4" /> ลบ</a></li>
                                </ul>
                            </div>
                        ) : (
                            <button onClick={(e) => { e.preventDefault(); onLike && onLike(); }} className="p-2 hover:bg-pink-50 rounded-lg text-gray-300 hover:text-pink-500 transition-colors">
                                <HandThumbUpIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
