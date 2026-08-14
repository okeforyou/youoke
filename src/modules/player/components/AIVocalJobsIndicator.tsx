import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { useAIVocalStore } from '../../../stores/useAIVocalStore';
import { usePlayerStore } from '../stores/usePlayerStore';

export const AIVocalJobsIndicator = () => {
    const jobs = useAIVocalStore(state => state.jobs);
    const queue = usePlayerStore(state => state.queue);
    
    // Filter processing and queued jobs
    const activeJobs = Object.entries(jobs).filter(([_, job]) => ['processing', 'starting', 'queued', 'downloading', 'separating'].includes(job.status));

    if (activeJobs.length === 0) return null;

    return (
        <div className="absolute top-16 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
            {activeJobs.map(([videoId, job]) => {
                // Try to find the title from the queue to display a nice name
                const queueItem = queue.find(q => (q.videoId || q.id) === videoId);
                const title = queueItem ? queueItem.title : (job.message || "ระบบกำลังแยกเสียง...");
                const isQueued = job.status === 'queued';

                return (
                    <div key={videoId} className="flex flex-col gap-1.5 px-3 py-2 bg-black/80 backdrop-blur-md rounded-xl border border-pink-500/30 shadow-lg shadow-pink-500/20 max-w-[220px] w-52 animate-in slide-in-from-right-4 duration-500">
                        <div className="flex items-center justify-between gap-2 text-pink-500">
                            <div className="flex items-center gap-1.5 overflow-hidden">
                                <Sparkles className="w-3.5 h-3.5 shrink-0 animate-pulse" />
                                <span className="text-[10px] font-bold truncate tracking-wide">{title}</span>
                            </div>
                            {!isQueued && <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />}
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-pink-600 to-pink-400 transition-all duration-500 ease-out relative"
                                style={{ width: `${isQueued ? 5 : Math.max(job.progress, 5)}%` }}
                            >
                                <div className="absolute inset-0 bg-white/20 animate-pulse" />
                            </div>
                        </div>
                        <div className="w-full flex justify-between items-center text-[9px] text-zinc-400 font-bold">
                            <span className="truncate max-w-[140px] text-zinc-300">{job.message || (isQueued ? 'รอคิว...' : 'กำลังประมวลผล')}</span>
                            <span>{isQueued ? 'คิว' : `${job.progress.toFixed(0)}%`}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
