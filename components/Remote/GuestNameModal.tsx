import { useState, useEffect } from 'react';
import { UserCircleIcon } from '@heroicons/react/24/outline';

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-[#1e1e2d] border border-white/10 rounded-2xl p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserCircleIcon className="w-10 h-10 text-pink-500" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">ยินดีต้อนรับครับ! 🎤</h2>
                    <p className="text-gray-400 text-sm">ขอทราบชื่อเล่นหน่อยครับ เพื่อนๆ จะได้รู้ว่าเป็นคิวใครร้อง</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setError('');
                            }}
                            placeholder="ชื่อเล่นของคุณ..."
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all text-center text-lg"
                            autoFocus
                        />
                        {error && <p className="text-red-400 text-xs mt-2 text-center">{error}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={!name.trim()}
                        className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-3 px-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        เริ่มร้องเพลงเลย! 🚀
                    </button>
                </form>
            </div>
        </div>
    );
}
