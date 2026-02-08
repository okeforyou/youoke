import React from 'react';
import { PartyPopper, X, Info } from 'lucide-react';
import { useUIStore } from '@/stores/useUIStore';
import { useToast } from '@/context/ToastContext';

export const ReceiverInfoModal = () => {
    const { isReceiverModalOpen, setReceiverModalOpen } = useUIStore();
    const { addToast } = useToast() || { addToast: () => { } };

    if (!isReceiverModalOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setReceiverModalOpen(false)}>
            <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200 border border-white/20" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl text-primary"><PartyPopper className="w-6 h-6" /></div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">ตั้งค่าปาร์ตี้รูม (Party Room Setup)</h3>
                            <p className="text-xs text-gray-500">Party Mode & Mobile Control</p>
                        </div>
                    </div>
                    <button onClick={() => setReceiverModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
                </div>

                <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex gap-3 items-start">
                        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm text-gray-900 font-semibold mb-1">ห้องปาร์ตี้ (Party Room)</p>
                            <p className="text-xs text-gray-600 leading-relaxed">
                                เปลี่ยนหน้าจอนี้ (หรือทีวี) ให้เป็น<strong>เครื่องเล่นกลางสำหรับปาร์ตี้</strong> ที่เพื่อนๆ สามารถสแกน QR Code เข้ามาช่วยกันเลือกเพลงได้ทันที
                            </p>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">ลิงก์สำหรับเปิดบนทีวี (TV Browser)</label>
                        <div className="flex items-center gap-2">
                            <code className="flex-1 bg-gray-100 p-3 rounded-lg text-sm font-mono text-gray-800 border border-gray-200 truncate select-all" onClick={(e) => (e.target as HTMLElement).click()}>
                                {typeof window !== 'undefined' ? `${window.location.origin}/monitor` : '...'}
                            </code>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/monitor`);
                                    addToast('คัดลอกลิงก์แล้ว');
                                }}
                                className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors font-medium text-sm"
                                title="คัดลอก"
                            >
                                Copy
                            </button>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-3">
                        <button onClick={() => window.open('/monitor', '_blank')} className="btn btn-ghost bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 font-medium w-full border-transparent">
                            เปิดในเครื่องนี้
                        </button>
                        <button onClick={() => setReceiverModalOpen(false)} className="btn btn-primary text-white w-full">
                            เข้าใจแล้ว
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
