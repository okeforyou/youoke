import { useRouter } from 'next/router';
import { LogIn, Music, Shield, Infinity as InfinityIcon, User } from 'lucide-react';
import { useGuestLimit } from '../../modules/party-system/hooks/useGuestLimit';
import { SparklesIcon as HeroSparkles } from '@heroicons/react/24/solid';

export const GuestCard = () => {
    const router = useRouter();
    const { playedCount, guestLimit, remainingPlays } = useGuestLimit();
    const progress = Math.min((playedCount / guestLimit) * 100, 100);

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
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">โหมดทดลองใช้</p>
                            <h3 className="text-base font-black text-white">Guest Access</h3>
                        </div>
                        <div className="ml-auto">
                            <span className="text-[10px] font-bold bg-gray-700/80 text-gray-300 px-2 py-1 rounded-full border border-gray-600/50">
                                ฟรี
                            </span>
                        </div>
                    </div>

                    {/* Usage Progress */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-1.5">
                            <p className="text-[11px] text-gray-400 font-medium">เพลงที่เล่นแล้ว</p>
                            <p className="text-[11px] font-bold text-white">
                                {playedCount} <span className="text-gray-500">/ {guestLimit}</span>
                            </p>
                        </div>
                        <div className="w-full h-2 bg-gray-700/80 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${progress}%`,
                                    background: progress >= 80
                                        ? 'linear-gradient(90deg, #f97316, #ef4444)'
                                        : 'linear-gradient(90deg, #3b82f6, #6366f1)'
                                }}
                            />
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">
                            {remainingPlays > 0
                                ? `เหลืออีก ${remainingPlays} เพลง จากนั้นรอ 24 ชม. หรือสมัครสมาชิก`
                                : '⚠️ ใช้งานครบแล้ว — สมัครสมาชิกเพื่อใช้ต่อ'}
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => router.push('/login')}
                            className="flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-2.5 rounded-xl border border-white/10 transition-all"
                        >
                            <LogIn size={14} />
                            เข้าสู่ระบบ
                        </button>
                        <button
                            onClick={() => router.push('/pricing')}
                            className="flex items-center justify-center gap-1.5 bg-primary hover:bg-primary/90 text-white text-xs font-bold py-2.5 rounded-xl shadow-lg shadow-primary/20 transition-all"
                        >
                            <HeroSparkles className="w-3.5 h-3.5" />
                            สมัครฟรี
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
