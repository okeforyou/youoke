import React, { useState } from 'react';
import { XMarkIcon, ShieldCheckIcon, CubeIcon, StarIcon, ClipboardIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
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
    loading
}) => {
    // 🛡️ RE-FIX: Use State for Dates to ensure UI Stability
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
    const lineId = isLineUser ? user.uid.split(':')[1] : '';

    const handleSaveDates = async () => {
        setSavingDates(true);
        try {
            console.log('💾 Saving membership dates...', { startedAt, expiresAt });
            await AdminService.updateMembershipDates(
                user.uid, 
                startedAt ? new Date(startedAt) : null, 
                expiresAt ? new Date(expiresAt) : null
            );
            alert('✅ อัปเดตอายุสมาชิกสำเร็จ (Admin v2.1)');
        } catch (e: any) {
            alert('❌ ผิดพลาด: ' + e.message);
        } finally {
            setSavingDates(false);
        }
    };

    const handleUpdateName = async () => {
        try {
            await AdminService.updateUserProfile(user.uid, { displayName: editName });
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
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all max-h-[85vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 bg-red-50 px-6 py-4 shrink-0">
                    <div>
                        <h3 className="text-lg font-extrabold text-red-700 uppercase tracking-tighter italic">จัดการสิทธิ์สมาชิก (YouOke Admin v2.2)</h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest opacity-60">ADMIN CONTROL CENTER • PLATINUM FIX</p>
                    </div>
                    <button onClick={onClose} className="rounded-full p-2 text-gray-400 transition-colors hover:bg-red-100 hover:text-red-700">
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                    {/* Profile */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 border-b border-gray-100 pb-8">
                        <div className="flex flex-col items-center gap-3 p-5 rounded-3xl bg-gray-50 border-2 border-dashed border-gray-200 shadow-inner">
                            <div className="h-24 w-24 rounded-full bg-primary text-white flex items-center justify-center text-4xl font-black border-4 border-white shadow-xl overflow-hidden ring-4 ring-primary/10">
                                {user.photoURL ? <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" /> : user.displayName?.charAt(0) || 'U'}
                            </div>
                            <div className={cn("badge badge-md border-none font-black uppercase tracking-tighter px-3 py-3 rounded-xl", isLineUser ? "bg-[#06C755] text-white" : "bg-blue-600 text-white")}>
                                {isLineUser ? 'LINE Official' : 'Web Portal'}
                            </div>
                        </div>

                        <div className="md:col-span-2 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-primary uppercase mb-1.5 tracking-widest">ชื่อที่แสดงผล (Display Name)</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        className="input input-bordered input-md h-12 w-full font-black text-gray-900 rounded-2xl border-2 border-gray-100 focus:border-primary transition-all shadow-sm" 
                                        value={editName} 
                                        onChange={(e) => setEditName(e.target.value)}
                                        placeholder="ระบุชื่อผู้ใช้งาน..."
                                    />
                                    <button onClick={handleUpdateName} className="btn btn-md btn-primary px-6 rounded-2xl shadow-lg shadow-primary/20 font-black">บันทึก</button>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                    <label className="block text-[9px] font-black text-gray-400 uppercase mb-1 tracking-widest">อีเมลพ่วง (Email)</label>
                                    <p className="text-sm text-gray-700 font-bold break-all leading-tight">{user.email || '(สมัครผ่าน LINE)'}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                    <label className="block text-[9px] font-black text-gray-400 uppercase mb-1 tracking-widest">เลขไอดี (UID/LINE)</label>
                                    <div className="flex items-center gap-2">
                                        <code className="text-[10px] font-black text-gray-400 truncate flex-1">{user.uid}</code>
                                        <button onClick={() => copyToClipboard(user.uid)} className="p-1 hover:text-primary transition-colors">
                                            <ClipboardIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Access Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                        {/* 🛡️ THE ROLE SWITCH (Force Visible) */}
                        <div className="space-y-4 p-5 rounded-3xl bg-red-50/50 border-2 border-red-100/50">
                            <label className="text-[11px] font-black text-red-600 flex items-center gap-2 uppercase tracking-widest">
                                <ShieldCheckIcon className="w-5 h-5" /> ระดับกองอำนวยการ (Role Management)
                            </label>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => onUpdateRole(user.uid, 'user')}
                                    className={cn(
                                        "flex-1 btn btn-md h-12 rounded-2xl border-none shadow-md transition-all font-black text-xs tracking-tighter",
                                        user.role !== 'admin' ? "bg-gray-900 text-white hover:scale-[1.02]" : "bg-white text-gray-300 border border-gray-100"
                                    )}
                                >
                                    USER
                                </button>
                                <button
                                    onClick={() => onUpdateRole(user.uid, 'admin')}
                                    className={cn(
                                        "flex-1 btn btn-md h-12 rounded-2xl border-none shadow-md transition-all font-black text-xs tracking-tighter",
                                        user.role === 'admin' ? "bg-red-600 text-white hover:scale-[1.02] shadow-red-200" : "bg-white text-gray-300 border border-gray-100"
                                    )}
                                >
                                    ADMIN
                                </button>
                            </div>
                        </div>

                        {/* 🛡️ MEMBERSHIP (Force Visible v2.2) */}
                        <div className="space-y-4 p-5 rounded-3xl bg-amber-50/50 border-2 border-amber-100/50">
                            <label className="text-[11px] font-black text-amber-600 flex items-center gap-2 uppercase tracking-widest">
                                <StarIcon className="w-5 h-5" /> ตั้งค่าสมาชิกพรีเมียม (v2.2)
                            </label>
                            <div className="space-y-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-[9px] font-black text-amber-700 opacity-60 uppercase tracking-widest">เริ่มพรีเมียม (Start)</label>
                                    <input 
                                        type="date" 
                                        className="input input-sm input-bordered w-full h-10 font-black text-gray-900 rounded-xl bg-white/80 border-amber-200 focus:border-amber-500 shadow-inner"
                                        value={startedAt}
                                        onChange={(e) => setStartedAt(e.target.value)}
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-[9px] font-black text-amber-700 opacity-60 uppercase tracking-widest">หมดอายุ (Expiry)</label>
                                    <input 
                                        type="date" 
                                        className="input input-sm input-bordered w-full h-10 font-black text-gray-900 rounded-xl bg-white/80 border-amber-200 focus:border-amber-500 shadow-inner"
                                        value={expiresAt}
                                        onChange={(e) => setExpiresAt(e.target.value)}
                                    />
                                </div>
                                <button 
                                    onClick={handleSaveDates}
                                    disabled={savingDates}
                                    className={cn(
                                        "btn btn-sm w-full h-11 rounded-xl font-black tracking-widest shadow-xl border-none transition-all uppercase",
                                        savingDates ? "bg-gray-200 text-gray-400" : "bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 text-white hover:scale-[1.05] active:scale-95 shadow-amber-200"
                                    )}
                                >
                                    {savingDates ? 'LOADING...' : 'ยืนยันวันหมดอายุ'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Packages Selection */}
                    <div className="mt-8">
                        <label className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
                            <ShieldCheckIcon className="w-4 h-4 text-green-500" /> อัปเกรดสถานะพรีเมียม (Manual Assign)
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {packages.map(pkg => (
                                <button
                                    key={pkg.id}
                                    onClick={() => onAssignPackage(pkg.id)}
                                    disabled={loading}
                                    className="btn btn-sm btn-outline border-gray-200 hover:bg-primary hover:border-primary text-xs"
                                >
                                    {pkg.name}
                                </button>
                            ))}
                            <button
                                onClick={() => onAssignPackage('lifetime')}
                                disabled={loading}
                                className="btn btn-sm bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-none text-xs"
                            >
                                Lifetime
                            </button>
                        </div>
                    </div>

                    {/* Modules */}
                    <div className="mt-8">
                        <label className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
                            <CubeIcon className="w-4 h-4 text-blue-500" /> ปลดล็อกโมดูลเสริม
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {availableModules.map(module => {
                                const isInstalled = user.installed_modules?.includes(module.id);
                                return (
                                    <div
                                        key={module.id}
                                        onClick={() => onToggleModule(module.id)}
                                        className={cn(
                                            "cursor-pointer border rounded-xl p-3 flex items-center gap-3 transition-all",
                                            isInstalled ? "bg-blue-50 border-blue-400" : "bg-white border-gray-200 hover:bg-gray-50"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-8 h-8 rounded-lg flex items-center justify-center",
                                            isInstalled ? "bg-blue-500 text-white shadow-sm" : "bg-gray-100 text-gray-400"
                                        )}>
                                            <module.icon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-bold">{module.name}</div>
                                            <div className="text-[10px] text-gray-400">{isInstalled ? 'ติดตั้งแล้ว' : 'ยังไม่ติดตั้ง'}</div>
                                        </div>
                                        <input type="checkbox" className="checkbox checkbox-primary checkbox-sm rounded-md" checked={isInstalled || false} readOnly />
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
