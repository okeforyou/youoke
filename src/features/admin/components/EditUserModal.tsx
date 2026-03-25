import React, { useState } from 'react';
import { XMarkIcon, ShieldCheckIcon, StarIcon, ClipboardIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { cn } from "../../../utils/cn";
import { AdminService } from '../services/adminService';

interface User {
    uid: string;
    displayName: string;
    email: string;
    photoURL?: string;
    provider?: string;
    role: 'admin' | 'user';
    membership?: {
        type: string;
        status: string;
        startedAt?: any;
        expiresAt: any;
    };
    installed_modules?: string[];
}

interface EditUserModalProps {
    user: User;
    onClose: () => void;
    onUpdateRole: (uid: string, newRole: 'admin' | 'user') => void;
    onAssignPackage: (pkgId: string) => void;
    onToggleModule: (moduleId: string) => void;
    availableModules: { id: string; name: string; icon: any }[];
    packages: { id: string; name: string; durationDays: number }[];
    onRefresh?: () => void;
    loading?: boolean;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
    user,
    onClose,
    onUpdateRole,
    onAssignPackage,
    onToggleModule,
    availableModules,
    packages,
    onRefresh,
    loading
}) => {
    const [editName, setEditName] = useState(user.displayName || '');
    const [startedAt, setStartedAt] = useState<string>(
        user.membership?.startedAt 
            ? (user.membership.startedAt.toDate ? user.membership.startedAt.toDate().toISOString().split('T')[0] : new Date(user.membership.startedAt).toISOString().split('T')[0]) 
            : ''
    );
    const [expiresAt, setExpiresAt] = useState<string>(
        user.membership?.expiresAt 
            ? (user.membership.expiresAt.toDate ? user.membership.expiresAt.toDate().toISOString().split('T')[0] : new Date(user.membership.expiresAt).toISOString().split('T')[0]) 
            : ''
    );
    const [savingDates, setSavingDates] = useState(false);

    const isLineUser = user.uid.startsWith('line:');

    const handleSaveDates = async () => {
        setSavingDates(true);
        try {
            await AdminService.updateMembershipDates(
                user.uid, 
                startedAt ? new Date(startedAt) : null, 
                expiresAt ? new Date(expiresAt) : null
            );
            if (onRefresh) onRefresh();
            alert('✅ อัปเดตอายุสมาชิกสำเร็จ');
        } catch (e: any) {
            alert('❌ ผิดพลาด: ' + e.message);
        } finally {
            setSavingDates(false);
        }
    };

    const handleUpdateName = async () => {
        try {
            await AdminService.updateUserProfile(user.uid, { displayName: editName });
            if (onRefresh) onRefresh();
            alert("✅ อัปเดตชื่อสำเร็จ!");
        } catch (err: any) {
            alert("ผิดพลาด: " + err.message);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("📋 คัดลอกแล้ว: " + text);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white shadow-2xl transition-all max-h-[90vh] flex flex-col border border-gray-100">
                
                {/* Header: Clean & Sophisticated */}
                <div className="flex items-center justify-between border-b border-gray-100 bg-white px-8 py-6 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-1.5 h-10 bg-indigo-600 rounded-full" />
                        <div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">จัดการสมาชิก</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                                Platinum Control Center
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="rounded-full p-2 text-gray-300 transition-all hover:bg-gray-50 hover:text-gray-900"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Body: Simplified & Focused */}
                <div className="flex-1 overflow-y-auto p-8 space-y-10 scroll-smooth no-scrollbar">
                    
                    {/* Compact Profile Card */}
                    <div className="flex flex-col sm:flex-row items-center gap-8 p-8 rounded-[2rem] bg-gray-50/50 border border-gray-100">
                        <div className="relative">
                            <div className="h-24 w-24 rounded-3xl bg-indigo-600 text-white flex items-center justify-center text-4xl font-black border-4 border-white shadow-xl overflow-hidden ring-4 ring-indigo-50">
                                {user.photoURL ? <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" /> : user.displayName?.charAt(0) || 'U'}
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-2xl shadow-lg border border-gray-50">
                                {isLineUser ? (
                                    <div className="w-6 h-6 text-[#06C755]"><ChatBubbleLeftRightIcon /></div>
                                ) : (
                                    <div className="w-6 h-6 text-indigo-600"><ShieldCheckIcon /></div>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex-1 text-center sm:text-left space-y-1">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">{user.displayName || 'ไม่มีชื่อ'}</h3>
                                <div className={cn(
                                    "px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider w-fit mx-auto sm:mx-0 shadow-sm",
                                    user.role === 'admin' ? "bg-red-50 text-red-600 border border-red-100" : "bg-indigo-50 text-indigo-600 border border-indigo-100"
                                )}>
                                    {user.role}
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 font-medium">{user.email || '(สมัครผ่าน LINE)'}</p>
                            <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                                <code className="text-[10px] text-gray-300 font-mono tracking-tighter select-all">UID: {user.uid}</code>
                                <button onClick={() => copyToClipboard(user.uid)} className="p-1 hover:text-indigo-600 transition-colors">
                                    <ClipboardIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="flex flex-col gap-2">
                                <input 
                                    type="text" 
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-100 outline-none w-40"
                                    placeholder="เปลี่ยนชื่อ..."
                                />
                                <button onClick={handleUpdateName} className="btn btn-sm btn-primary rounded-xl font-black shadow-lg shadow-indigo-100">บันทึกชื่อ</button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* 1. Account Roles */}
                        <div className="space-y-4">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 px-2">
                                <ShieldCheckIcon className="w-4 h-4" /> บทบาทการใช้งาน
                            </label>
                            <div className="grid grid-cols-2 gap-3 p-1.5 bg-gray-50 rounded-2xl border border-gray-100">
                                <button
                                    onClick={() => onUpdateRole(user.uid, 'user')}
                                    className={cn(
                                        "py-3.5 rounded-xl font-black text-xs transition-all",
                                        user.role !== 'admin' ? "bg-white text-indigo-600 shadow-sm border border-gray-100" : "text-gray-400 hover:bg-gray-100"
                                    )}
                                >
                                    ผู้ทั่วไป (USER)
                                </button>
                                <button
                                    onClick={() => onUpdateRole(user.uid, 'admin')}
                                    className={cn(
                                        "py-3.5 rounded-xl font-black text-xs transition-all",
                                        user.role === 'admin' ? "bg-red-600 text-white shadow-lg shadow-red-100" : "text-gray-400 hover:bg-gray-100"
                                    )}
                                >
                                    ผู้ดูแล (ADMIN)
                                </button>
                            </div>
                        </div>

                        {/* 2. Membership Dates */}
                        <div className="space-y-4">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 px-2">
                                <StarIcon className="w-4 h-4 text-amber-500" /> ระยะเวลาสมาชิก (ไทย)
                            </label>
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <span className="text-[10px] font-black text-gray-400 ml-1 uppercase">เริ่มวันที่</span>
                                        <input 
                                            type="date" 
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-xs text-gray-900 focus:ring-2 focus:ring-indigo-100 outline-none transition-all shadow-inner"
                                            value={startedAt}
                                            onChange={(e) => setStartedAt(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <span className="text-[10px] font-black text-gray-400 ml-1 uppercase">หมดอายุวันที่</span>
                                        <input 
                                            type="date" 
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-xs text-gray-900 focus:ring-2 focus:ring-indigo-100 outline-none transition-all shadow-inner"
                                            value={expiresAt}
                                            onChange={(e) => setExpiresAt(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <button 
                                    onClick={handleSaveDates}
                                    disabled={savingDates}
                                    className={cn(
                                        "w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all",
                                        savingDates 
                                            ? "bg-gray-100 text-gray-300" 
                                            : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100 active:scale-95"
                                    )}
                                >
                                    {savingDates ? 'กำลังบันทึก...' : 'บันทึกวันหมดอายุ'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 3. Manual Upgrade Section */}
                    <div className="pt-10 border-t border-gray-50">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-6 block px-2">ปรับระดับพรีเมียม (Assign Package)</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {packages?.map(pkg => (
                                <button
                                    key={pkg.id}
                                    onClick={() => onAssignPackage(pkg.id)}
                                    disabled={loading}
                                    className="py-3 px-4 rounded-xl border border-gray-100 font-bold text-[11px] text-gray-600 hover:border-indigo-600 hover:text-indigo-600 transition-all bg-white shadow-sm"
                                >
                                    {pkg.name}
                                </button>
                            ))}
                            <button
                                onClick={() => onAssignPackage('lifetime')}
                                disabled={loading}
                                className="py-3 px-4 rounded-xl bg-gradient-to-tr from-amber-400 via-orange-500 to-amber-600 text-white font-black text-[11px] uppercase shadow-lg shadow-amber-100 border-none hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                ตลอดชีพ (Lifetime)
                            </button>
                        </div>
                    </div>

                    {/* 🚀 Modules section hidden as requested by user - can be re-enabled if needed later */}
                    {/* <div className="pt-4 border-t border-gray-50"> ... </div> */}

                </div>

                {/* Footer: Light & Simple */}
                <div className="px-8 py-5 bg-gray-50/50 border-t border-gray-100 flex justify-end shrink-0">
                    <button 
                        className="px-8 py-3 rounded-2xl font-bold text-sm text-gray-500 hover:bg-gray-100 transition-all active:scale-95" 
                        onClick={onClose}
                    >
                        ปิดหน้าต่าง
                    </button>
                </div>

            </div>
        </div>
    );
};
