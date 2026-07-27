import React, { useEffect, useState } from 'react';
import { useUIStore } from '../stores/useUIStore';
import { useAIVocalStore } from '../stores/useAIVocalStore';
import { usePlayerStore } from '../modules/player/stores/usePlayerStore';
import { useToast } from '../context/ToastContext';
import { X, RefreshCw, Copy, Check, ExternalLink, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

interface Attempt {
    method: string;
    status: 'success' | 'failed';
    error?: string;
}

interface HistoryEntry {
    timestamp: string;
    video_id: string;
    title: string;
    status: 'success' | 'failed';
    attempts: Attempt[];
}

export const DownloadHistoryModal = () => {
    const { downloadHistoryModal, hideDownloadHistoryModal } = useUIStore();
    const { isOpen } = downloadHistoryModal;
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copiedAll, setCopiedAll] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    // Toast integration
    const toastContext = useToast();
    const addToast = toastContext?.addToast;
    const jobs = useAIVocalStore(state => state.jobs);
    const queue = usePlayerStore(state => state.queue);
    
    // Store local state of jobs we have notified the user about
    const [notifiedJobs, setNotifiedJobs] = useState<Record<string, string>>({});

    // Dynamic background separation state notifier (Toast alerts)
    useEffect(() => {
        Object.entries(jobs).forEach(([videoId, job]) => {
            const previousStatus = notifiedJobs[videoId];

            if (job.status === 'error' && previousStatus !== 'error') {
                const songItem = queue.find(q => (q.videoId || q.id) === videoId);
                const songTitle = songItem ? songItem.title : "เพลง";
                
                if (addToast) {
                    addToast(`แยกเสียงล้มเหลว: "${songTitle}" (${job.message}) ⚠️`, 'error');
                }
                
                setNotifiedJobs(prev => ({ ...prev, [videoId]: 'error' }));
            } 
            else if (job.status === 'ready' && previousStatus !== 'ready' && previousStatus !== undefined) {
                // Only notify success if it transitions from a previous state (like processing), not on initial load
                const songItem = queue.find(q => (q.videoId || q.id) === videoId);
                const songTitle = songItem ? songItem.title : "เพลง";
                
                if (addToast) {
                    addToast(`แยกเสียงร้องสำเร็จ: "${songTitle}" 🎉 พร้อมเล่นแล้ว!`, 'success');
                }
                
                setNotifiedJobs(prev => ({ ...prev, [videoId]: 'ready' }));
            }
            else if ((job.status === 'processing' || job.status === 'idle') && previousStatus !== job.status) {
                // Sync current state to prevent repetitive alerts
                setNotifiedJobs(prev => ({ ...prev, [videoId]: job.status }));
            }
        });
    }, [jobs, queue, notifiedJobs, addToast]);

    const fetchHistory = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('http://127.0.0.1:5050/download/history');
            if (res.status === 404) {
                setError("YouOke Server ที่รันอยู่เป็นเวอร์ชันเก่า (ไม่พบคลังประวัติ) กรุณาปิดโปรแกรมตัวเดิม และเปิด YouOke Server ตัวใหม่ล่าสุด");
                return;
            }
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            const data = await res.json();
            setHistory(data);
        } catch (e: any) {
            console.error("Failed to fetch download history:", e);
            setError("เชื่อมต่อ Local Server ไม่สำเร็จ กรุณาตรวจสอบว่า YouOke Server เปิดทำงานอยู่");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchHistory();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleCopyAll = () => {
        const text = JSON.stringify(history, null, 2);
        navigator.clipboard.writeText(text);
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 2000);
    };

    const handleCopyEntry = (entry: HistoryEntry, index: number) => {
        const text = `--- YouOke AI Separation Log ---
Song: ${entry.title}
Video ID: ${entry.video_id}
Status: ${entry.status.toUpperCase()}
Time: ${new Date(entry.timestamp).toLocaleString('th-TH')}
Attempts:
${entry.attempts.map((att, i) => `  ${i + 1}. [${att.method}] status: ${att.status}${att.error ? `, error: ${att.error}` : ''}`).join('\n')}
--------------------------------`;
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={hideDownloadHistoryModal}
            />
            
            {/* Modal Container */}
            <div className="relative bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-2xl h-[85vh] max-h-[700px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-100 dark:border-zinc-800">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-primary" />
                            Log ประวัติการแยกเสียงร้อง AI
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 font-medium">
                            บันทึกความพยายามในการดาวน์โหลดและดึงไฟล์เสียงจาก YouTube
                        </p>
                    </div>
                    <button 
                        onClick={hideDownloadHistoryModal}
                        className="text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0 bg-gray-50/50 dark:bg-zinc-950/20">
                    {error && (
                        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/50 rounded-2xl flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <div className="text-sm font-semibold text-amber-800 dark:text-amber-300 leading-normal">
                                {error}
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="h-48 flex flex-col items-center justify-center gap-3">
                            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                            <p className="text-xs font-bold text-gray-500 dark:text-zinc-400">กำลังโหลดประวัติ...</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="h-48 flex flex-col items-center justify-center text-center p-6 border border-dashed border-gray-200 dark:border-zinc-800 rounded-3xl">
                            <AlertCircle className="w-8 h-8 text-gray-400 mb-2" />
                            <p className="text-sm font-bold text-gray-500 dark:text-zinc-400">ไม่พบประวัติการแยกเสียง</p>
                            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">ประวัติจะปรากฏที่นี่เมื่อเริ่มดาวน์โหลดเพลงผ่านระบบ AI</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {history.map((entry, index) => {
                                const isSuccess = entry.status === 'success';
                                const formattedTime = new Date(entry.timestamp).toLocaleString('th-TH', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                    day: 'numeric',
                                    month: 'short'
                                });

                                return (
                                    <div 
                                        key={index} 
                                        className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-4 shadow-sm hover:border-gray-200 dark:hover:border-zinc-700 transition-all"
                                    >
                                        {/* Entry Header */}
                                        <div className="flex justify-between items-start gap-4 mb-3">
                                            <div className="min-w-0 flex-1">
                                                <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate" title={entry.title}>
                                                    {entry.title}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-mono font-bold">
                                                        ID: {entry.video_id}
                                                    </span>
                                                    <a 
                                                        href={`https://youtube.com/watch?v=${entry.video_id}`} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-[10px] text-primary hover:underline flex items-center gap-0.5 font-bold"
                                                    >
                                                        ดูบน YouTube <ExternalLink className="w-2.5 h-2.5" />
                                                    </a>
                                                    <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium">
                                                        • {formattedTime}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Status Badge */}
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className={clsx(
                                                    "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide",
                                                    isSuccess 
                                                        ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30" 
                                                        : "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30"
                                                )}>
                                                    {isSuccess ? (
                                                        <>
                                                            <CheckCircle className="w-3 h-3" />
                                                            สำเร็จ
                                                        </>
                                                    ) : (
                                                        <>
                                                            <AlertCircle className="w-3 h-3" />
                                                            ล้มเหลว
                                                        </>
                                                    )}
                                                </span>
                                                <button
                                                    onClick={() => handleCopyEntry(entry, index)}
                                                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-zinc-700"
                                                    title="คัดลอก Log เพลงนี้"
                                                >
                                                    {copiedIndex === index ? (
                                                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                                                    ) : (
                                                        <Copy className="w-3.5 h-3.5" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Attempt Chain Details */}
                                        <div className="space-y-1.5 bg-gray-50 dark:bg-zinc-950/40 p-3 rounded-xl border border-gray-100/50 dark:border-zinc-900/50">
                                            <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                                                Download Steps Attempted ({entry.attempts.length}):
                                            </p>
                                            {entry.attempts.map((att, i) => (
                                                <div key={i} className="text-xs leading-relaxed flex flex-col font-mono">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-gray-400 dark:text-zinc-600 font-bold">{i + 1}.</span>
                                                        <span className="font-semibold text-gray-700 dark:text-zinc-300">{att.method}</span>
                                                        <span className={clsx(
                                                            "text-[9px] font-black px-1 py-0.2 rounded uppercase",
                                                            att.status === 'success' 
                                                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" 
                                                                : "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                                                        )}>
                                                            {att.status}
                                                        </span>
                                                    </div>
                                                    {att.error && (
                                                        <span className="pl-4 text-[10px] text-rose-500 dark:text-rose-400 break-all select-all font-mono leading-tight mt-0.5">
                                                            Error: {att.error}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between items-center shrink-0 gap-3">
                    <button
                        onClick={fetchHistory}
                        disabled={loading}
                        className="px-4 py-2 text-xs font-bold text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl flex items-center gap-1.5 transition-colors border border-gray-200 dark:border-zinc-800 disabled:opacity-50"
                    >
                        <RefreshCw className={clsx("w-3.5 h-3.5", loading && "animate-spin")} />
                        รีเฟรชข้อมูล
                    </button>

                    <button
                        onClick={handleCopyAll}
                        disabled={history.length === 0}
                        className="px-5 py-2.5 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600 disabled:cursor-not-allowed rounded-xl flex items-center gap-2 transition-all shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20"
                    >
                        {copiedAll ? (
                            <>
                                <Check className="w-4 h-4" />
                                คัดลอกสำเร็จ!
                            </>
                        ) : (
                            <>
                                <Copy className="w-4 h-4" />
                                คัดลอกประวัติทั้งหมด (JSON)
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
