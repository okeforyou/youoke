import React, { useState } from 'react';
import { XMarkIcon, ShieldCheckIcon, StarIcon, ClipboardIcon, UserIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { cn } from "../../../utils/cn";
import { AdminService } from '../services/adminService';
import { ConfirmModal } from './ConfirmModal';
import { db } from '../../../firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { VERSION_LABEL } from '@/core/version';
import { approvePayment } from '../../../modules/billing/services/paymentService';

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
    tier?: string;
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
    onAssignPackage: parentOnAssignPackage,
    onToggleModule,
    availableModules,
    packages,
    onRefresh,
    loading: parentLoading
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
    const [messageText, setMessageText] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const [localLoading, setLocalLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [pendingOrder, setPendingOrder] = useState<any>(null);
    const [approvingOrder, setApprovingOrder] = useState(false);
    
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type: 'danger' | 'warning' | 'info';
        confirmText?: string;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        type: 'warning'
    });

    // ⚡ v5.5.45: Fetch Pending Payment for shortcut approval
    React.useEffect(() => {
        const checkPendingOrder = async () => {
            if (!user.uid || !db) return;
            try {
                const q = query(
                    collection(db, "payment_proofs"),
                    where("userId", "==", user.uid),
                    where("status", "==", "pending"),
                    orderBy("createdAt", "desc"),
                    limit(1)
                );
                const snap = await getDocs(q);
                if (!snap.empty) {
                    setPendingOrder({ id: snap.docs[0].id, ...snap.docs[0].data() });
                }
            } catch (e) {
                console.error("Error fetching pending order:", e);
            }
        };
        checkPendingOrder();
    }, [user.uid]);

    const isLineUser = user.uid.startsWith('line:');

    const handleSaveDates = async () => {
        setConfirmModal({
            isOpen: true,
            title: "ยืนยันการบันทึกวันที่",
            message: "ระบบจะทำการอัปเดตวันเริ่มต้นและวันหมดอายุสมาชิกพรีเมียมใหม่ คุณต้องการดำเนินการต่อหรือไม่?",
            type: 'warning',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                setSavingDates(true);
                try {
                    await AdminService.updateMembershipDates(
                        user.uid, 
                        startedAt ? new Date(startedAt) : null, 
                        expiresAt ? new Date(expiresAt) : null
                    );
                    if (onRefresh) onRefresh();
                    setConfirmModal({
                        isOpen: true,
                        title: "บันทึกสำเร็จ",
                        message: "อัปเดตข้อมูลระยะเวลาสมาชิกเรียบร้อยแล้ว",
                        type: 'info',
                        confirmText: "ตกลง",
                        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                    });
                } catch (e: any) {
                    setConfirmModal({
                        isOpen: true,
                        title: "ผิดพลาด",
                        message: e.message,
                        type: 'danger',
                        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                    });
                } finally {
                    setSavingDates(false);
                }
            }
        });
    };

    const handleAssignPackage = async (packageId: string) => {
        try {
            setLocalLoading(true);
            await AdminService.assignPackage(user.uid, packageId);
            
            // 🛡️ v4.9.98: Auto-Segmentation Logic
            let segmentType = 'free';
            if (packageId.includes('month')) segmentType = 'monthly';
            if (packageId.includes('year')) segmentType = 'yearly';
            if (packageId === 'lifetime') segmentType = 'lifetime';
            
            await AdminService.updateMembershipType(user.uid, segmentType);

            if (onRefresh) onRefresh();
            setConfirmModal({
                isOpen: true,
                title: "อัปเดตสำเร็จ",
                message: `มอบสิทธิ์แพ็กเกจ และจัดเข้ากลุ่ม "${segmentType.toUpperCase()}" เรียบร้อยแล้ว`,
                type: 'info',
                onConfirm: () => {
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    onClose();
                }
            });
        } catch (e: any) {
            setConfirmModal({
                isOpen: true,
                title: "เกิดข้อผิดพลาด",
                message: e.message,
                type: 'danger',
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
            });
        } finally {
            setLocalLoading(false);
        }
    };

    const QUICK_MESSAGES = [
        { label: 'ทักทาย', text: 'สวัสดีครับ มีอะไรให้แอดมินช่วยดูแลไหมครับ?' },
        { label: 'แจ้งยอด', text: 'ได้รับยอดโอนเรียบร้อยครับ ระบบกำลังเปิดสิทธิ์ให้สักครู่นะครับ' },
        { label: 'แก้ไขเสร็จ', text: 'แอดมินแก้ไขระบบให้เรียบร้อยแล้วครับ ลองเข้าใช้งานอีกครั้งนะครับ' },
        { label: 'ขอบคุณ', text: 'ขอบคุณที่สนับสนุน YouOKE นะครับ ขอให้สนุกกับการร้องเพลงครับ!' },
        { label: 'เช็ค LINE', text: 'รบกวนตรวจสอบข้อความใน LINE เพื่อยืนยันการตั้งค่าด้วยนะครับ' },
    ];

    const handleUpdateName = async () => {
        try {
            await AdminService.updateUserProfile(user.uid, { displayName: editName });
            if (onRefresh) onRefresh();
            setConfirmModal({
                isOpen: true,
                title: "อัปเดตสำเร็จ",
                message: "เปลี่ยนชื่อผู้ใช้งานเรียบร้อยแล้ว",
                type: 'info',
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
            });
        } catch (err: any) {
            setConfirmModal({
                isOpen: true,
                title: "ผิดพลาด",
                message: err.message,
                type: 'danger',
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
            });
        }
    };

    const handleDeleteUser = () => {
        setConfirmModal({
            isOpen: true,
            title: "ยืนยันการลบข้อมูล (อันตราย)",
            message: "คุณกำลังจะลบข้อมูลลูกค้ารายนี้ออกจากฐานข้อมูล การกระทำนี้ไม่สามารถย้อนกลับได้ คุณต้องการดำเนินการต่อหรือไม่?",
            type: 'danger',
            confirmText: 'ยืนยันการลบ',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                setLocalLoading(true);
                try {
                    await AdminService.deleteUser(user.uid);
                    if (onRefresh) onRefresh();
                    onClose();
                } catch (e: any) {
                    setConfirmModal({
                        isOpen: true,
                        title: "เกิดข้อผิดพลาด",
                        message: e.message,
                        type: 'danger',
                        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                    });
                } finally {
                    setLocalLoading(false);
                }
            }
        });
    };

    const handleSendLineMessage = async () => {
        if (!messageText.trim() || !(user as any).lineUserId) return;

        setSendingMessage(true);
        try {
            const response = await fetch('/api/notify/line-push', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: (user as any).lineUserId,
                    message: messageText
                })
            });

            if (!response.ok) throw new Error('ส่งข้อความไม่สำเร็จ');

            setMessageText('');
            setConfirmModal({
                isOpen: true,
                title: "ส่งข้อความสำเร็จ",
                message: "ข้อความถูกส่งไปยัง LINE ของผู้ใช้งานเรียบร้อยแล้ว",
                type: 'info',
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
            });
        } catch (err: any) {
            console.error('LINE Message Error:', err);
            setConfirmModal({
                isOpen: true,
                title: "ส่งไม่สำเร็จ",
                message: err.message || "เกิดข้อผิดพลาดในการส่งข้อความ",
                type: 'danger',
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
            });
        } finally {
            setSendingMessage(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isLoading = parentLoading || localLoading || approvingOrder;

    const handleQuickApprove = async () => {
        if (!pendingOrder) return;
        
        setConfirmModal({
            isOpen: true,
            title: "ยืนยันการอนุมัติ (ทางลัด)",
            message: `แอดมินยืนยันที่จะอนุมัติรายการ "${pendingOrder.packageName}" มูลค่า ฿${pendingOrder.amount} หรือไม่? ระบบจะส่ง LINE แจ้งเตือนลูกค้าและเปิดสิทธิ์ให้อัตโนมัติ`,
            type: 'warning',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                setApprovingOrder(true);
                try {
                    // Get current admin UID
                    const { useAuthStore } = await import('../../../modules/auth/useAuthStore');
                    const adminUid = useAuthStore.getState().user?.uid || 'admin';
                    
                    await approvePayment(
                        pendingOrder.id,
                        user.uid,
                        pendingOrder.packageId || 'free',
                        adminUid
                    );
                    
                    if (onRefresh) onRefresh();
                    setPendingOrder(null); // Clear once approved

                    setConfirmModal({
                        isOpen: true,
                        title: "อนุมัติสำเร็จ!",
                        message: "แอดมินอนุมัติรายการเรียบร้อยแล้ว และระบบได้ส่งข้อความ LINE แจ้งลูกค้าให้แล้วครับ",
                        type: 'info',
                        confirmText: "ตกลง",
                        onConfirm: () => {
                            setConfirmModal(prev => ({ ...prev, isOpen: false }));
                            onClose();
                        }
                    });
                } catch (e: any) {
                    setConfirmModal({
                        isOpen: true,
                        title: "เกิดข้อผิดพลาด",
                        message: e.message,
                        type: 'danger',
                        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                    });
                } finally {
                    setApprovingOrder(false);
                }
            }
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center sm:p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg h-full sm:h-auto max-h-[95vh] bg-slate-50 overflow-hidden flex flex-col sm:rounded-2xl border border-slate-200/50">
                
                <div className="bg-white px-5 py-4 flex items-center justify-between border-b border-slate-100 flex-shrink-0">
                    <h3 className="text-base font-bold text-slate-900 uppercase">จัดการสมาชิก</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                    
                    {/* ⚡ v5.5.45: One-Step Payment Approval Quick Widget */}
                    {pendingOrder && (
                        <div className="bg-amber-50 rounded-xl border-2 border-amber-200 p-4 animate-in fade-in slide-in-from-top duration-500">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                    <span className="text-[11px] font-black text-amber-700 uppercase tracking-wider">ตรวจพบการแจ้งโอนค้างอยู่</span>
                                </div>
                                <div className="text-[10px] font-bold text-amber-500">฿{pendingOrder.amount}</div>
                            </div>
                            <div className="text-xs font-bold text-slate-700 mb-3">
                                บัญชีนี้มีรายการ <span className="text-indigo-600 underline underline-offset-2">{pendingOrder.packageName}</span> รออนุมัติ
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={handleQuickApprove}
                                    disabled={approvingOrder}
                                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-black shadow-lg shadow-amber-200 transition-all active:scale-95 disabled:bg-slate-300 disabled:shadow-none"
                                >
                                    {approvingOrder ? 'กำลังดำเนินการ...' : '✅ อนุมัติทันที & ส่ง LINE'}
                                </button>
                                <Link 
                                    href={`/admin/payments?u=${user.uid}`}
                                    className="px-3 py-2.5 bg-white border border-amber-200 text-amber-600 rounded-lg text-xs font-bold hover:bg-amber-50 transition-all flex items-center justify-center"
                                    title="ดูรายละเอียดในหน้ารายการสั่งซื้อ"
                                >
                                    <ClipboardIcon className="w-4 h-4" />
                                </Link>
                            </div>
                            <p className="text-[9px] text-amber-600/70 mt-2 text-center font-medium italic">
                                * กดปุ่มทองเพื่อจบงานในคลิกเดียว (ระบบจะแจ้ง LINE และปิดบิลให้ทันที)
                            </p>
                        </div>
                    )}
                    
                    <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon className="w-6 h-6 text-slate-400" />
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <label className="text-[11px] font-bold text-slate-400 uppercase leading-none block mb-1">ชื่อผู้ใช้งาน</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-900 w-full focus:ring-1 focus:ring-indigo-500 outline-none"
                                    />
                                    <button onClick={handleUpdateName} className="bg-indigo-600 text-white rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap active:scale-95 transition-transform">บันทึก</button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 pt-2">
                            <div>
                                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">อีเมลติดต่อ / บัญชี {isLineUser && '(LINE)'}</label>
                                <p className="text-sm font-semibold text-slate-900 truncate">{user.email || 'LINE Account User'}</p>
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">รหัสสมาชิก (UID)</label>
                                <div className="flex items-center gap-2">
                                    <code className="bg-slate-50 px-2 py-1 rounded text-[10px] text-slate-500 font-mono flex-1 truncate">{user.uid}</code>
                                    <div className="flex items-center gap-1.5 ml-auto">
                                        <button onClick={() => copyToClipboard(user.uid)} className="relative text-slate-400 hover:text-indigo-600 transition-colors">
                                            {copied && (
                                                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-xl whitespace-nowrap animate-in fade-in zoom-in-50 duration-200">
                                                    คัดลอกแล้ว!
                                                </span>
                                            )}
                                            <ClipboardIcon className="w-4 h-4" />
                                        </button>
                                        <Link 
                                            href={`/admin/payments?u=${user.uid}`}
                                            className="flex items-center gap-1 px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded text-[9px] font-black uppercase tracking-wider transition-all"
                                            title="ดูประวัติการสั่งซื้อ"
                                        >
                                            <ChartBarIcon className="w-3 h-3" />
                                            <span>บิล</span>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-100 p-4">
                        <label className="text-[11px] font-bold text-slate-400 uppercase mb-3 block px-1">ระดับบทบาทผู้ใช้งาน</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => onUpdateRole(user.uid, 'user')}
                                className={cn(
                                    "flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold border transition-all active:scale-95",
                                    user.role === 'user' ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-inner" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                                )}
                            >
                                <UserIcon className="w-4 h-4" /> ทั่วไป (USER)
                            </button>
                            <button
                                onClick={() => onUpdateRole(user.uid, 'admin')}
                                className={cn(
                                    "flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold border transition-all active:scale-95",
                                    user.role === 'admin' ? "bg-red-50 border-red-200 text-red-700 shadow-inner" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                                )}
                            >
                                <ShieldCheckIcon className="w-4 h-4" /> ผู้ดูแล (ADMIN)
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-4">
                        <label className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-2 px-1">
                            <StarIcon className="w-4 h-4 text-amber-500 fill-amber-500" /> ระยะเวลาสมาชิกพรีเมียม
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 pl-1">วันที่เริ่มต้น</label>
                                <input 
                                    type="date" 
                                    value={startedAt}
                                    onChange={(e) => setStartedAt(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 pl-1">วันที่สิ้นสุด</label>
                                <input 
                                    type="date" 
                                    value={expiresAt}
                                    onChange={(e) => setExpiresAt(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                        <button 
                            onClick={handleSaveDates}
                            disabled={savingDates}
                            className={cn(
                                "w-full py-3 rounded-xl font-bold text-sm tracking-wide transition-all active:scale-[0.98]",
                                savingDates ? "bg-slate-100 text-slate-400" : "bg-indigo-600 text-white hover:bg-indigo-700"
                            )}
                        >
                            {savingDates ? 'กำลังบันทึก...' : 'บันทึกข้อมูลสมาชิก'}
                        </button>
                    </div>

                    {/* 📦 มอบสิทธิ์ใช้งาน (The Real Access Creator) */}
                    <div className="bg-white rounded-xl border border-slate-100 p-4">
                        <label className="text-[11px] font-bold text-slate-400 uppercase mb-1 block px-1 flex items-center gap-2">
                             📦 มอบสิทธิ์ใช้งาน (ให้ลูกค้าเล่นเพลงได้)
                        </label>
                        <p className="text-[9px] text-slate-400 mb-3 px-1 leading-tight">
                            * ระบบจะใส่วันหมดอายุให้อัตโนมัติ และย้ายกลุ่มส่ง LINE ให้ในคลิกเดียว
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {packages?.filter(pkg => !pkg.id.includes('day')).map(pkg => {
                                let dispName = pkg.name;
                                if (pkg.id.includes('month')) dispName = 'รายเดือน';
                                if (pkg.id.includes('year')) dispName = 'รายปี';

                                return (
                                    <button
                                        key={pkg.id}
                                        onClick={() => handleAssignPackage(pkg.id)}
                                        disabled={isLoading}
                                        className="py-3 px-3 rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-colors active:scale-95 disabled:bg-slate-50"
                                    >
                                        มอบสิทธิ์: {dispName}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => handleAssignPackage('lifetime')}
                                disabled={isLoading}
                                className="col-span-2 py-4 rounded-lg bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest active:scale-95 transition-transform disabled:bg-slate-800"
                            >
                                🌟 ยืนยันมอบสิทธิ์ : ถาวร (PERMANENT)
                            </button>
                        </div>
                    </div>

                    {/* 📌 จัดกลุ่มลูกค้า (Manual Group Overide) */}
                    <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block px-1 flex items-center gap-2">
                             📌 จัดกลุ่มลูกค้า (สำหรับส่งข้อความ LINE)
                        </label>
                        <p className="text-[9px] text-slate-400 mb-3 px-1 leading-tight">
                            * ใช้สำหรับเปลี่ยนกลุ่มด้วยมือ โดยไม่มีผลกับวันหมดอายุสมาชิก
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { id: 'legacy', label: 'สมาชิกเดิม' },
                                { id: 'lifetime', label: 'ถาวร' },
                                { id: 'monthly', label: 'รายเดือน' },
                                { id: 'yearly', label: 'รายปี' }
                            ].map(item => (
                                <button
                                    key={item.id}
                                    onClick={async () => {
                                        try {
                                            await AdminService.updateMembershipType(user.uid, item.id);
                                            if (onRefresh) onRefresh();
                                            setConfirmModal({
                                                isOpen: true,
                                                title: "สลับกลุ่มสำเร็จ",
                                                message: `ย้ายลูกค้าเข้ากลุ่ม "${item.label}" เรียบร้อยแล้ว`,
                                                type: 'info',
                                                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                                            });
                                        } catch (e: any) {
                                            alert(e.message);
                                        }
                                    }}
                                    className={cn(
                                        "py-2.5 rounded-lg border text-[10px] font-bold transition-all active:scale-95",
                                        (user.membership?.type === item.id || user.tier === item.id)
                                            ? "bg-slate-500 border-slate-500 text-white shadow-sm" 
                                            : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                                    )}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <label className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-2">
                                <svg className="w-4 h-4 fill-[#06C755]" viewBox="0 0 24 24"><path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.121.303.079.778.039 1.085l-.171 1.047c-.052.312-.252 1.226 1.088.668 1.341-.558 7.237-4.263 9.87-7.296 1.83-1.926 2.091-3.328 2.091-5.71z"/></svg> 
                                LINE Messaging Support
                            </label>
                            {(user as any).lineUserId ? (
                                <span className="flex items-center gap-1 text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200 uppercase tracking-tighter">
                                    Connected
                                </span>
                            ) : (
                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Not Linked</span>
                            )}
                        </div>

                        {(user as any).lineUserId ? (
                            <div className="space-y-3 pt-1">
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Linked Profile</div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-xs">
                                            {(user as any).lineDisplayName?.charAt(0) || 'L'}
                                        </div>
                                        <div className="text-sm font-bold text-slate-700">{(user as any).lineDisplayName || 'LINE Member'}</div>
                                    </div>
                                </div>
                                    {/* ⚡ Quick Response Chips (Moved Above Input) */}
                                    <div className="flex flex-wrap gap-1.5 py-1">
                                        {QUICK_MESSAGES.map((msg, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setMessageText(msg.text)}
                                                className="px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-[9px] font-bold text-slate-500 hover:border-[#06C755] hover:text-[#06C755] transition-all active:scale-95"
                                            >
                                                {msg.label}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={messageText}
                                            onChange={(e) => setMessageText(e.target.value)}
                                            disabled={sendingMessage}
                                            placeholder="พิมพ์ข้อความส่งหา User รายบุคคล..."
                                            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 w-full focus:ring-1 focus:ring-[#06C755] outline-none disabled:bg-slate-50"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSendLineMessage();
                                            }}
                                        />
                                    <button 
                                        onClick={handleSendLineMessage}
                                        disabled={sendingMessage || !messageText.trim()}
                                        className={cn(
                                            "text-white rounded-lg px-4 py-2 text-xs font-bold active:scale-95 transition-transform whitespace-nowrap",
                                            sendingMessage ? "bg-slate-400" : "bg-[#06C755] hover:bg-[#05b34c]"
                                        )}
                                    >
                                        {sendingMessage ? '...' : 'ส่ง'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200 text-center">
                                <p className="text-[11px] text-slate-500 font-medium">ยังไม่มีการเชื่อมต่อบัญชี LINE กับ Gmail นี้</p>
                            </div>
                        )}
                    </div>

                    {/* 🗑️ v5.5.65: Danger Zone - Manual Cleanup for Duplicates */}
                    <div className="bg-red-50 rounded-xl border border-red-100 p-4 mt-2">
                        <label className="text-[10px] font-bold text-red-600 uppercase mb-1 block px-1 flex items-center gap-2">
                             ⚠️ โซนอันตราย (ลบข้อมูล)
                        </label>
                        <p className="text-[9px] text-red-500/70 mb-3 px-1 leading-tight">
                            * ใช้สำหรับลบข้อมูลที่ซ้ำซ้อน (Ghost Records) การกระทำนี้ไม่สามารถกู้คืนได้
                        </p>
                        <button
                            onClick={handleDeleteUser}
                            disabled={isLoading}
                            className="w-full py-3 rounded-lg bg-red-100 text-red-600 text-[11px] font-bold hover:bg-red-200 transition-colors active:scale-95 disabled:opacity-50"
                        >
                            ลบข้อมูลลูกค้ารายนี้
                        </button>
                    </div>

                </div>

                <div className="bg-white px-5 py-4 border-t border-slate-100 flex justify-between items-center flex-shrink-0">
                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
                        {VERSION_LABEL} Admin Intelligence
                    </span>
                    <button 
                        className="px-6 py-2 rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors" 
                        onClick={onClose}
                    >
                        ปิดหน้าต่าง
                    </button>
                </div>

            </div>
            
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                confirmText={confirmModal.confirmText}
            />
        </div>
    );
};
