import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { useAIVocalStore } from '../../../stores/useAIVocalStore';
import { usePlayerStore } from '../stores/usePlayerStore';

export const AIVocalJobsIndicator = () => {
    const jobs = useAIVocalStore(state => state.jobs);
    const queue = usePlayerStore(state => state.queue);
    const history = usePlayerStore(state => state.history);
    
    // Filter only processing jobs
    const activeJobs = Object.entries(jobs).filter(([_, job]) => job.status === 'processing');

    if (activeJobs.length === 0) return null;

    return (
        <div className="absolute top-16 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
            {activeJobs.map(([videoId, job]) => {
                // Try to find the title from the queue or history to display a nice name
                const queueItem = queue.find(q => q.videoId === videoId) || history?.find((h: any) => h.videoId === videoId);
                const title = queueItem ? queueItem.title : "ระบบกำลังแยกเสียง...";

                return (
                    <div key={videoId} className="flex flex-col gap-1.5 px-3 py-2 bg-black/80 backdrop-blur-md rounded-xl border border-pink-500/30 shadow-lg shadow-pink-500/20 max-w-[200px] w-48 animate-in slide-in-from-right-4 duration-500">
                        <div className="flex items-center justify-between gap-2 text-pink-500">
                            <div className="flex items-center gap-1.5 overflow-hidden">
                                <Sparkles className="w-3.5 h-3.5 shrink-0 animate-pulse" />
                                <span className="text-[10px] font-bold truncate tracking-wide">{title}</span>
                            </div>
                            <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-pink-600 to-pink-400 transition-all duration-500 ease-out relative"
                                style={{ width: `${job.progress}%` }}
                            >
                                <div className="absolute inset-0 bg-white/20 animate-pulse" />
                            </div>
                        </div>
                        <div className="w-full text-right text-[9px] text-zinc-400 font-bold">
                            {job.progress.toFixed(0)}%
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
