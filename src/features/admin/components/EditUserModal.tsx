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
    const [editName, setEditName] = useState(user.displayName || '');
    const isLineUser = user.uid.startsWith('line:');
    const lineId = isLineUser ? user.uid.split(':')[1] : '';

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
                <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4 shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">จัดการข้อมูลสมาชิก</h3>
                        <p className="text-xs text-gray-500">สมัครผ่านช่องทาง: <span className={cn("font-bold", isLineUser ? "text-green-600" : "text-blue-600")}>{isLineUser ? 'LINE Official Account' : 'Google / Email'}</span></p>
                    </div>
                    <button onClick={onClose} className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-900">
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Profile */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
                            <div className="h-20 w-20 rounded-full bg-primary text-white flex items-center justify-center text-3xl font-bold border-4 border-white shadow-md overflow-hidden">
                                {user.photoURL ? <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" /> : user.displayName?.charAt(0) || 'U'}
                            </div>
                            <div className={cn("badge badge-sm border-none font-bold", isLineUser ? "bg-[#06C755] text-white" : "bg-blue-600 text-white")}>
                                {isLineUser ? 'LINE User' : 'Web User'}
                            </div>
                        </div>

                        <div className="md:col-span-2 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">ชื่อที่แสดงผล (Display Name)</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        className="input input-bordered input-sm w-full font-bold text-gray-900" 
                                        value={editName} 
                                        onChange={(e) => setEditName(e.target.value)}
                                        placeholder="ระบุชื่อผู้ใช้งาน..."
                                    />
                                    <button onClick={handleUpdateName} className="btn btn-sm btn-primary">บันทึก</button>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">อีเมล / ไอดี</label>
                                <p className="text-sm text-gray-700 font-medium break-all">{user.email || 'สมัครผ่าน LINE (ไม่มีอีเมล)'}</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">UID (สำหรับ LINE OA Manager)</label>
                                <div className="flex items-center gap-2">
                                    <code className="bg-gray-100 px-2 py-1 rounded text-[10px] text-gray-600 border border-gray-200 flex-1 truncate">{user.uid}</code>
                                    <button onClick={() => copyToClipboard(user.uid)} className="btn btn-xs btn-ghost btn-square" title="คัดลอก UID">
                                        <ClipboardIcon className="w-4 h-4" />
                                    </button>
                                </div>
                                {isLineUser && (
                                    <p className="text-[10px] text-orange-600 mt-1 font-medium">
                                        * นำ UID ไปค้นหาในหน้า LINE OA Manager เพื่อส่งข้อความหา User ได้ครับ
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-8">
                        {/* Role */}
                        <div className="space-y-4">
                            <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <ShieldCheckIcon className="w-4 h-4 text-primary" /> สิทธิ์การใช้งาน (Role)
                            </label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onUpdateRole(user.uid, 'user')}
                                    className={cn(
                                        "flex-1 btn btn-sm border-none shadow-sm",
                                        user.role !== 'admin' ? "bg-primary text-white" : "bg-gray-100 text-gray-500"
                                    )}
                                >
                                    USER
                                </button>
                                <button
                                    onClick={() => onUpdateRole(user.uid, 'admin')}
                                    className={cn(
                                        "flex-1 btn btn-sm border-none shadow-sm",
                                        user.role === 'admin' ? "bg-red-600 text-white" : "bg-gray-100 text-gray-500"
                                    )}
                                >
                                    ADMIN
                                </button>
                            </div>
                        </div>

                        {/* Status Info */}
                        <div className="space-y-4">
                            <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <StarIcon className="w-4 h-4 text-yellow-500" /> จัดการอายุสมาชิก (Manual)
                            </label>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm">
                                <div className="space-y-3">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] uppercase font-black text-yellow-800">วันเริ่มสิทธิ์ (Started At)</label>
                                        <input 
                                            type="date" 
                                            className="input input-xs input-bordered w-full h-8"
                                            defaultValue={user.membership?.startedAt ? (user.membership.startedAt.toDate ? user.membership.startedAt.toDate().toISOString().split('T')[0] : new Date(user.membership.startedAt).toISOString().split('T')[0]) : ''}
                                            id="membership_started_at"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] uppercase font-black text-yellow-800">วันหมดสิทธิ์ (Expires At)</label>
                                        <input 
                                            type="date" 
                                            className="input input-xs input-bordered w-full h-8"
                                            defaultValue={user.membership?.expiresAt ? (user.membership.expiresAt.toDate ? user.membership.expiresAt.toDate().toISOString().split('T')[0] : new Date(user.membership.expiresAt).toISOString().split('T')[0]) : ''}
                                            id="membership_expires_at"
                                        />
                                    </div>
                                    <button 
                                        onClick={async () => {
                                            const startVal = (document.getElementById('membership_started_at') as HTMLInputElement).value;
                                            const expireVal = (document.getElementById('membership_expires_at') as HTMLInputElement).value;
                                            try {
                                                await AdminService.updateMembershipDates(
                                                    user.uid, 
                                                    startVal ? new Date(startVal) : null, 
                                                    expireVal ? new Date(expireVal) : null
                                                );
                                                alert('✅ อัปเดตอายุสมาชิกสำเร็จ!');
                                            } catch (e: any) {
                                                alert('❌ ผิดพลาด: ' + e.message);
                                            }
                                        }}
                                        className="btn btn-xs btn-warning w-full text-white font-bold"
                                    >
                                        บันทึกการจัดการวันที่
                                    </button>
                                </div>
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
