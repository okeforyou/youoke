import { useRouter } from 'next/router';
import { LogIn, Music, Shield, Infinity as InfinityIcon, User } from 'lucide-react';
import { useGuestLimit } from '../../modules/party-system/hooks/useGuestLimit';
import { SparklesIcon as HeroSparkles } from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';

export const GuestCard = () => {
    const router = useRouter();
    const { playedCount, guestLimit, remainingPlays } = useGuestLimit();
    const progress = Math.min((playedCount / guestLimit) * 100, 100);
    const isLimitReached = remainingPlays <= 0;

    const onLogin = () => router.push('/login');
    const onSignup = () => router.push('/signup');

    const benefits = [
        { icon: Music, text: 'ฟังเพลงไม่จำกัด' },
        { icon: Shield, text: 'ไม่มีโฆษณา' },
        { icon: InfinityIcon, text: 'บันทึก Playlist ได้' },
    ];

    return (
        <div className="mx-1">
            {/* Main Guest Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-5 shadow-xl">
                {/* Background decoration */}
                <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-primary/20 blur-2xl" />
                <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-blue-500/10 blur-2xl" />

                <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-11 h-11 rounded-2xl bg-gray-700/80 flex items-center justify-center border border-gray-600/50">
                            <User size={20} className="text-gray-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                                <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">โหมดทดลองใช้</p>
                            </div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white truncate">ยินดีต้อนรับสู่ YouOke</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">สมัครสมาชิกเพื่อรับสิทธิ์ทดลองใช้ฟรี 1 วัน!</p>
                        </div>
                    </div>

                    {/* Progress Section */}
                    <div className="bg-white/50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50">
                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-0.5">โควต้าเพลงฟรีวันนี้</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-black text-slate-900 dark:text-white">{playedCount}</span>
                                    <span className="text-sm font-bold text-slate-400">/ {guestLimit} เพลง</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-0.5">เหลืออีก</p>
                                <span className="text-sm font-black text-blue-600 dark:text-blue-400">{remainingPlays} เพลง</span>
                            </div>
                        </div>

                        <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-600/50">
                            <div
                                className={cn(
                                    "h-full rounded-full transition-all duration-1000 ease-out shadow-sm",
                                    isLimitReached ? "bg-red-500" : "bg-gradient-to-r from-blue-500 to-indigo-500"
                                )}
                                style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                        </div>
                    </div>

                    {/* Info Text */}
                    <div className="px-1 py-1">
                        <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 italic">
                            * ปลดล็อกฟีเจอร์ <span className="text-blue-600 dark:text-blue-400 font-bold">Cast (ขึ้นจอ)</span> และ <span className="text-blue-600 dark:text-blue-400 font-bold">เล่นเพลงยาวไม่จำกัด</span> เพียงสมัครสมาชิกวันนี้
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                        <button
                            onClick={onLogin}
                            className="h-11 rounded-xl font-bold text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
                        >
                            เข้าสู่ระบบ
                        </button>
                        <button
                            onClick={onSignup}
                            className="h-11 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            <HeroSparkles className="w-3.5 h-3.5" />
                            สมัครสมาชิกฟรี
                        </button>
                    </div>
                </div>
            </div>

            {/* Mini Benefit List */}
            <div className="mt-3 grid grid-cols-3 gap-2">
                {benefits.map((b, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 bg-gray-50 rounded-2xl p-3 border border-gray-100">
                        <b.icon size={16} className="text-primary" />
                        <p className="text-[9px] font-bold text-gray-500 text-center leading-tight">{b.text}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
