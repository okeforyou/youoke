import React from 'react';
import Image from 'next/image';
import clsx from 'clsx';
import { MusicalNoteIcon, UserIcon } from '@heroicons/react/24/outline';
import { VideoItem } from '../types';
import { QRCodeSVG } from 'qrcode.react';

interface QueueListProps {
    queue: VideoItem[];
    isVisible: boolean;
    onPlay?: (index: number) => void;
    isPassive?: boolean;
    roomCode?: string;
}

/**
 * YouOKE TV Queue List (v5.5.23 - Zero Effect) 
 * Strategy: Absolute Minimum CPU Load for Smart TV.
 */
export const QueueList: React.FC<QueueListProps> = ({ queue, isVisible, onPlay, isPassive = false, roomCode = '' }) => {
    return (
        <div className={clsx(
            "absolute top-0 right-0 bottom-0 w-[450px] bg-stone-950 border-l border-white/5 p-10 z-40 flex flex-col shadow-2xl transition-transform duration-500",
            isVisible ? "translate-x-0" : "translate-x-full"
        )}>
            <div className="flex items-center gap-3 mb-8">
                <div className="w-1.5 h-6 bg-primary rounded-full"></div>
                <h2 className="text-2xl font-black uppercase tracking-[0.2em] text-white">คิวเพลง</h2>
                <div className="ml-auto bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                    <span className="text-[9px] font-black tracking-widest text-white/40 uppercase">Total: </span>
                    <span className="text-[11px] font-black text-primary">{queue.length > 0 ? queue.length - 1 : 0}</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar -mr-4">
                {queue.slice(1).map((video, idx) => (
                    <div
                        key={idx}
                        onClick={() => !isPassive && onPlay?.(idx + 1)}
                        className={clsx(
                            "flex gap-6 items-center group",
                            !isPassive ? "cursor-pointer" : "cursor-default"
                        )}
                    >
                        <div className="relative">
                            <span className="absolute -left-6 top-1/2 -translate-y-1/2 text-3xl font-black text-white/5 italic">{idx + 1}</span>
                            <div className="w-16 h-16 rounded-xl bg-zinc-900 relative overflow-hidden shrink-0 border border-white/10 shadow-xl">
                                {video.videoId ? (
                                    <Image
                                        unoptimized
                                        src={`https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`}
                                        fill
                                        className="object-cover opacity-60"
                                        alt="Thumbnail"
                                        onError={(e) => { e.currentTarget.src = "https://placehold.co/200x200/101010/FFF?text=Queue"; }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center"><MusicalNoteIcon className="w-8 h-8 text-white/10" /></div>
                                )}
                            </div>
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-white font-black text-base truncate leading-tight tracking-tight">{video.title}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                                <div className="w-4 h-4 rounded-full bg-white/5 flex items-center justify-center">
                                    <UserIcon className="w-2.5 h-2.5 text-white/30" />
                                </div>
                                <p className="text-white/30 text-[10px] font-bold truncate tracking-wide">{video.addedBy?.name || video.addedBy?.displayName || 'แขก'}</p>
                            </div>
                        </div>
                    </div>
                ))}
                {queue.length <= 1 && (
                    <div className="text-center py-24 bg-white/[0.02] rounded-[3rem] border border-white/5">
                        <MusicalNoteIcon className="w-16 h-16 mx-auto mb-6 text-white/10" />
                        <p className="text-lg font-black text-white/20 uppercase tracking-[0.2em]">ไม่มีเพลงในคิว</p>
                    </div>
                )}
            </div>

            {/* QR Code Section at the Bottom */}
            {roomCode && (
                <div className="mt-8 pt-8 border-t border-white/5 flex flex-col items-center">
                    <div className="bg-white p-3 rounded-2xl shadow-xl">
                        <QRCodeSVG value={`${window.location.origin}/remote?room=${roomCode}`} size={160} level="M" />
                    </div>
                    <div className="mt-4 text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-1">สแกนเพื่อสั่งเพลง</p>
                        <p className="text-2xl font-black text-primary tracking-tighter">{roomCode}</p>
                    </div>
                </div>
            )}
        </div>
    );
};
