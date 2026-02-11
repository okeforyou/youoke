import React from "react";
import { ListMusic, Trash2 } from "lucide-react";
import { usePlayerStore } from "../stores/usePlayerStore";
import Image from 'next/image';

export function QueueList() {
    const { queue, removeFromQueue, currentIndex, setCurrentIndex } = usePlayerStore();

    // Skip first item (currently playing)
    const queueItems = queue.slice(currentIndex + 1);

    if (queueItems.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 text-gray-400">
                <ListMusic className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm font-medium">ยังไม่มีคิวเพลง</p>
                <p className="text-xs text-gray-400 mt-1">เพิ่มเพลงเข้าคิวเพื่อเล่นต่อ</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-white h-full">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10 bg-white">
                <div className="flex items-center gap-2">
                    <ListMusic className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">
                        คิวเพลง ({queueItems.length})
                    </span>
                </div>
                {queueItems.length > 0 && (
                    <button
                        onClick={() => {
                            if (confirm('ลบคิวทั้งหมด?')) {
                                usePlayerStore.getState().clearQueue();
                            }
                        }}
                        className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
                    >
                        ล้างทั้งหมด
                    </button>
                )}
            </div>

            {/* Queue Items */}
            <div className="flex-1 overflow-y-auto">
                {queueItems.map((video, index) => {
                    const actualIndex = currentIndex + 1 + index; // Real queue index
                    return (
                        <div
                            key={video.uuid || index}
                            className="group flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 cursor-pointer"
                            onClick={() => setCurrentIndex(actualIndex)}
                        >
                            {/* Thumbnail */}
                            <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 shadow-sm">
                                <Image
                                    src={`https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`}
                                    alt={video.title}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = '/icon-cover.png';
                                    }}
                                />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug mb-1">
                                    {video.title}
                                </h4>
                                <p className="text-xs text-gray-500 truncate">
                                    {video.author}
                                </p>
                            </div>

                            {/* Remove Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeFromQueue(video.uuid);
                                }}
                                className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                                aria-label="ลบออกจากคิว"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
