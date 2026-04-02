import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { CHANGELOGS, SYSTEM_VERSION } from '@/core/version';

export default function ChangelogPage() {
    // ดึงข้อมูลหัวข้อการอัปเดตจากระบบ Build (Git Log)
    const latestUpdates = process.env.NEXT_PUBLIC_LATEST_UPDATES?.split('\n').filter(line => line.trim() !== '') || [];

    return (
        <div className="min-h-screen bg-white text-gray-800 font-sans p-6 md:p-12 max-w-3xl mx-auto dark:bg-zinc-950 dark:text-zinc-300">
            <Head>
                <title>Changelog - YouOKE</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>

            <header className="mb-12 border-b border-slate-100 pb-6 flex items-center justify-between dark:border-zinc-900">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-none dark:text-white">Change Log</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <p className="text-sm font-bold text-slate-400 dark:text-zinc-500">ติดตามสถานะความเคลื่อนไหวล่าสุด (v{SYSTEM_VERSION})</p>
                        {process.env.NEXT_PUBLIC_COMMIT_HASH && (
                            <span className="text-[10px] font-mono opacity-40 bg-slate-100 px-1.5 py-0.5 rounded dark:bg-zinc-900 dark:text-zinc-400">
                                #{process.env.NEXT_PUBLIC_COMMIT_HASH.slice(0, 7)}
                            </span>
                        )}
                    </div>
                </div>
                <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-primary transition-colors font-bold text-sm">
                    <ArrowLeftIcon className="w-4 h-4" />
                    Back to Home
                </Link>
            </header>

            <main className="space-y-12">
                {/* 1. Smart Updates (Real-time from Git Commits) */}
                {latestUpdates.length > 0 && (
                    <article className="relative pl-8 border-l-2 border-emerald-500/30">
                         {/* Status Node */}
                         <div className="absolute -left-[7px] top-1.5 w-[13px] h-[13px] rounded-full bg-emerald-500 border-2 border-white shadow-lg shadow-emerald-500/50 z-10 ring-4 ring-emerald-500/10 animate-pulse dark:border-zinc-950"></div>
                         
                         <header className="mb-4">
                            <div className="flex items-baseline gap-3">
                                <h2 className="text-base font-black tracking-tight text-emerald-600 dark:text-emerald-400">Recent System Updates</h2>
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400/70">Auto-Generated</span>
                            </div>
                        </header>

                        <div className="p-5 bg-emerald-50/50 rounded-[28px] border border-emerald-50/50 dark:bg-emerald-500/5 dark:border-emerald-500/10">
                            <ul className="space-y-3">
                                {latestUpdates.map((update, i) => (
                                    <li key={i} className="flex gap-3 text-[13px] leading-relaxed text-emerald-700/80 dark:text-emerald-400/80 font-bold">
                                        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-emerald-400/50 shrink-0" />
                                        <span>{update}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </article>
                )}

                {/* 2. Static Milestone Lists */}
                {CHANGELOGS.map((log, index) => (
                    <article key={index} className="relative pl-8 border-l border-slate-100 last:border-l-0 dark:border-zinc-900">
                        {/* Timeline Node */}
                        <div className={cn(
                            "absolute -left-[5px] top-1.5 w-[9px] h-[9px] rounded-full border-2 border-white shadow-sm transition-all duration-500 dark:border-zinc-950",
                            index === 0 ? 'bg-primary scale-125 z-10 ring-4 ring-primary/10' : 'bg-slate-200 dark:bg-zinc-800'
                        )}></div>

                        <header className="mb-4">
                            <div className="flex items-baseline gap-3">
                                <h2 className={cn(
                                    "text-base font-black tracking-tight",
                                    index === 0 ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-zinc-600"
                                )}>
                                    v{log.version}
                                </h2>
                                <span className={cn(
                                    "text-[10px] font-bold uppercase tracking-widest",
                                    index === 0 ? "text-primary/70" : "text-slate-300 dark:text-zinc-700"
                                )}>
                                    {log.date}
                                </span>
                            </div>
                        </header>

                        <ul className="space-y-2.5">
                            {log.changes.map((change, i) => (
                                <li key={i} className="group flex gap-3 text-[13px] leading-relaxed text-slate-500 hover:text-slate-900 transition-colors dark:hover:text-zinc-300">
                                    <span className="mt-2 w-1 h-1 rounded-full bg-slate-200 shrink-0 group-hover:bg-primary transition-colors dark:bg-zinc-800" />
                                    <span className="font-medium">{change}</span>
                                </li>
                            ))}
                        </ul>
                    </article>
                ))}
            </main>

            <footer className="mt-24 pt-8 border-t border-slate-50 text-center dark:border-zinc-900">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] dark:text-zinc-700">
                    &copy; {new Date().getFullYear()} YOUOKE. PLATFORM IDENTITY SYNC.
                </p>
            </footer>
        </div>
    );
}

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');
