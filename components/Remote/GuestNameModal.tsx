import { useState, useEffect } from 'react';
import { UserCircleIcon, MusicalNoteIcon, ArrowRightIcon, SparklesIcon } from '@heroicons/react/24/outline'; // Importing icons

interface GuestNameModalProps {
    isOpen: boolean;
    onSave: (name: string) => void;
}

export default function GuestNameModal({ isOpen, onSave }: GuestNameModalProps) {
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('กรุณาใส่ชื่อเล่นหน่อยนะครับ');
            return;
        }
        onSave(name.trim());
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            {/* Modal Card */}
            <div className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-3xl p-8 shadow-2xl scale-100 animate-in zoom-in-95 duration-300 relative overflow-hidden">

                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-primary/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

                <div className="relative text-center mb-8">
                    {/* Hero Icon */}
                    <div className="w-20 h-20 bg-gray-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100 dark:border-white/5 relative group">
                        <MusicalNoteIcon className="w-8 h-8 text-primary absolute -top-1 -right-1 animate-bounce delay-100" />
                        <UserCircleIcon className="w-10 h-10 text-gray-400 dark:text-gray-300 group-hover:scale-110 transition-transform duration-300" />
                    </div>

                    {/* Headline */}
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                        ยินดีต้อนรับครับ <span className="text-primary">!</span>
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                        ขอทราบชื่อเล่นของคุณหน่อยครับ <br />
                        เพื่อนๆ จะได้รู้ว่าเป็นคิวใครร้อง
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 relative">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest pl-1">ชื่อเล่น</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    setError('');
                                }}
                                placeholder="เช่น น้องจอย, พี่ต้น..."
                                className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-4 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-lg font-medium shadow-sm"
                                autoFocus
                            />
                            {/* Error Message */}
                            {error && (
                                <div className="absolute -bottom-6 left-0 right-0 text-center animate-in slide-in-from-top-1 fade-in">
                                    <p className="text-red-500 text-xs font-medium bg-red-50 dark:bg-red-900/20 inline-block px-2 py-0.5 rounded-md">{error}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={!name.trim()}
                        className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-4 px-6 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 shadow-lg flex items-center justify-center gap-2 group"
                    >
                        <span>เข้าสู่ระบบ</span>
                        <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>
            </div>
        </div>
    );
}
