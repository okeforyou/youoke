import React from 'react';
import Image from 'next/image';
import clsx from 'clsx';
import { MusicalNoteIcon, UserIcon } from '@heroicons/react/24/outline';
import { VideoItem } from '../types';

interface QueueListProps {
    queue: VideoItem[];
    isVisible: boolean;
}

export const QueueList: React.FC<QueueListProps> = ({ queue, isVisible }) => {
    return (
        <div className={clsx(
            "absolute top-0 right-0 bottom-0 w-[450px] bg-black/80 backdrop-blur-[40px] border-l border-white/5 p-10 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] z-40 flex flex-col shadow-[-40px_0_80px_rgba(0,0,0,0.5)]",
            isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
        )}>
            <div className="flex items-center gap-4 mb-10">
                <div className="w-2 h-8 bg-primary rounded-full shadow-[0_0_20px_rgba(229,9,20,0.8)]"></div>
                <h2 className="text-3xl font-black uppercase tracking-[0.2em] text-white">คิวเพลง</h2>
                <div className="ml-auto bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
                    <span className="text-[10px] font-black tracking-widest text-white/40 uppercase">Total: </span>
                    <span className="text-xs font-black text-primary">{queue.length > 0 ? queue.length - 1 : 0}</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar -mr-4">
                {queue.slice(1).map((video, idx) => (
                    <div key={idx} className="flex gap-6 items-center group animate-in slide-in-from-right-10 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                        <div className="relative">
                            <span className="absolute -left-6 top-1/2 -translate-y-1/2 text-4xl font-black text-white/5 italic">{idx + 1}</span>
                            <div className="w-20 h-20 rounded-2xl bg-zinc-900 relative overflow-hidden shrink-0 border border-white/10 group-hover:border-primary/50 transition-all duration-300 group-hover:scale-105 shadow-xl">
                                {video.videoId ? (
                                    <Image
                                        unoptimized
                                        src={`https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`}
                                        fill
                                        className="object-cover opacity-60 group-hover:opacity-100 transition-all duration-500"
                                        alt="Thumbnail"
                                        onError={(e) => { e.currentTarget.src = "https://placehold.co/200x200/101010/FFF?text=Queue"; }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center"><MusicalNoteIcon className="w-8 h-8 text-white/10" /></div>
                                )}
                            </div>
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-white font-black text-lg truncate leading-tight group-hover:text-primary transition-colors tracking-tight">{video.title}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                                <div className="w-4 h-4 rounded-full bg-white/5 flex items-center justify-center">
                                    <UserIcon className="w-2.5 h-2.5 text-white/30" />
                                </div>
                                <p className="text-white/30 text-[10px] font-bold truncate tracking-wide">{video.addedBy?.displayName || 'แขก'}</p>
                            </div>
                        </div>
                    </div>
                ))}
                {queue.length <= 1 && (
                    <div className="text-center py-24 bg-white/[0.02] rounded-[3rem] border border-white/5">
                        <MusicalNoteIcon className="w-16 h-16 mx-auto mb-6 text-white/10 animate-bounce" />
                        <p className="text-lg font-black text-white/20 uppercase tracking-[0.2em]">ไม่มีเพลงในคิว</p>
                    </div>
                )}
            </div>
        </div>
    );
};
