import Head from "next/head";
import { useState, useEffect } from "react";
import AdminLayout from '@/features/admin/layouts/AdminLayout';
import {
    Users,
    MoreHorizontal,
    Edit2,
    Trash2,
    Mail,
    Shield,
    Search,
    Filter,
    Download,
    UserPlus,
    Ban,
    Bell,
    Crown,
    Calendar,
    Trash,
    UserCog,
    X,
    Lock,
    Package,
    ArrowRight,
    RefreshCw,
    Activity,
    TrendingUp,
    TrendingDown,
    Minus,
    Megaphone,
    Users2,
    MessageSquare,
    BellRing
} from "lucide-react";
import { StatCard } from "@/features/admin/components/StatCard";
import { EditUserModal } from "@/features/admin/components/EditUserModal";
import { ConfirmModal } from "@/features/admin/components/ConfirmModal";
import { AddUserModal } from "@/features/admin/components/AddUserModal";
import { ShieldCheck, ShieldAlert, ArrowDownUp } from "lucide-react";
import { AdminService } from "@/features/admin/services/adminService";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";


// LINE Icon Component
const LineIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M19.365 9.863c.064.433.1.882.1 1.34 0 3.125-2.562 5.674-5.712 5.674-1.223 0-2.359-.383-3.297-1.036l-2.651.883c-.37.123-.663-.223-.52-.54l.582-1.33c-1.328-1.01-2.181-2.577-2.181-4.347 0-3.125 2.562-5.674 5.712-5.674 3.15 0 5.712 2.549 5.712 5.674h.256zm-10.138 4.53c.06.02.12.03.17.03.16 0 .3-.09.37-.24l.58-1.33.04-.08.08-.03c1.2-.45 2.04-1.58 2.04-2.88 0-1.72-1.41-3.12-3.13-3.12s-3.13 1.4-3.13 3.12c0 1.07.54 2.02 1.36 2.59l.07.05-.02.09-.58 1.33c-.07.16-.03.35.11.45.1.07.21.1.32.1h.11z"/>
    </svg>
);
import { collection, query, orderBy, limit, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, addDoc } from "firebase/firestore";
import { db } from "@/firebase";

interface User {
    uid: string;
    displayName: string;
    email: string;
    photoURL: string;
    role: 'admin' | 'user';
    membership?: {
        type: 'free' | 'day_pass' | 'monthly' | 'yearly' | 'lifetime';
        status: 'active' | 'expired' | 'cancelled';
        expiresAt: any;
        packageId?: string;
    };
    installed_modules?: string[];
    createdAt: any;
    banned?: boolean;
    provider?: 'line' | 'google' | 'password' | string;
}

interface PackageOption {
    id: string;
    name: string;
    durationDays: number;
}

const roleStyles = {
    admin: { bg: "bg-destructive/15", text: "text-destructive", label: "Admin" },
    user: { bg: "bg-info/15", text: "text-info", label: "User" },
};

const statusStyles = {
    active: { bg: "bg-success/15", text: "text-success", dot: "bg-success" },
    banned: { bg: "bg-destructive/15", text: "text-destructive", dot: "bg-destructive" },
    guest: { bg: "bg-muted", text: "text-muted-foreground", dot: "bg-muted-foreground" },
};

const membershipStyles = {
    free: { bg: "bg-muted", text: "text-muted-foreground", label: "Free" },
    pro: { bg: "bg-primary/15", text: "text-primary", label: "Pro" },
    vip: { bg: "bg-accent/15", text: "text-accent", label: "VIP" },
    lifetime: { bg: "bg-success/15", text: "text-success", label: "Lifetime" },
};

import { MODULES } from "@/config/modules";
import { Grid } from "lucide-react";
import { useAuthStore } from "@/modules/auth/useAuthStore";

const AVAILABLE_MODULES = MODULES.map(m => ({
    id: m.id,
    name: m.name,
    icon: m.icon || Grid
}));

// Global style to force hide scrollbar in WebKit
const GlobalScrollbarStyle = () => (
    <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
    `}</style>
);

export default function AdminUsersPage() {
    const { user } = useAuthStore();
    const toastContext = useToast();
    const addToast = toastContext?.addToast;
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showGuests, setShowGuests] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [packages, setPackages] = useState<PackageOption[]>([]);
    const [assigningLoading, setAssigningLoading] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Notification State
    const [msgTitle, setMsgTitle] = useState("");
    const [msgBody, setMsgBody] = useState("");
    const [sendingMsg, setSendingMsg] = useState(false);
    const [msgType, setMsgType] = useState<'info' | 'warning' | 'success' | 'system'>('system');
    const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
    const [notificationUser, setNotificationUser] = useState<User | null>(null);
    
    // Broadcast State (New)
    const [broadcastDialogOpen, setBroadcastDialogOpen] = useState(false);
    const [broadcastType, setBroadcastType] = useState<'all' | 'premium' | 'free'>('all');
    const [broadcastTitle, setBroadcastTitle] = useState("");
    const [broadcastBody, setBroadcastBody] = useState("");
    const [sendingBroadcast, setSendingBroadcast] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // New Confirm Modal State
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

    const [actionUser, setActionUser] = useState<User | null>(null);


    // Fetch Users (Optimized)
    const fetchUsers = async () => {
        if (addToast) addToast("⏳ กำลังรีเฟรชรายชื่อสมาชิก...", "info");
        setLoading(true);
        try {
            if (!db) return;
            // Fetch all users for Management (but we should ideally paginate if > 1000)
            const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map((doc) => ({
                uid: doc.id,
                ...doc.data(),
            })) as User[];

            // Sort: Admin first, then by date
            data.sort((a, b) => {
                if (a.role === 'admin' && b.role !== 'admin') return -1;
                if (a.role !== 'admin' && b.role === 'admin') return 1;
                return 0;
            });

            setUsers(data);
            console.log(`✅ Loaded ${data.length} users successfully.`);
            if (addToast) addToast("✅ รีเฟรชข้อมูลสมาชิกเรียบร้อยแล้ว", "success");
        } catch (error) {
            console.error("Error fetching users:", error);
            if (addToast) addToast("❌ ไม่สามารถรีเฟรชข้อมูลได้", "error");
        } finally {
            setLoading(false);
        }
    };

    // Fetch Packages
    const fetchPackages = async () => {
        try {
            if (!db) return;
            const q = query(collection(db, "packages"), orderBy("price", "asc"));
            const snapshot = await getDocs(q);
            const pkgList: PackageOption[] = [];
            snapshot.forEach(doc => {
                pkgList.push({ id: doc.id, name: doc.data().name, durationDays: doc.data().durationDays });
            });
            setPackages(pkgList);
        } catch (error) {
            console.error("Error fetching packages:", error);
        }
    };

    useEffect(() => {
        if (!db) return;
        fetchUsers();
        fetchPackages();
    }, [db]);

    const handleAssignPackage = async (pkgId: string) => {
        if (!selectedUser || !pkgId) return;

        // 1. Find the selected package to get duration
        const targetPkg = pkgId === 'lifetime'
            ? { id: 'lifetime', name: 'Lifetime', durationDays: 36500 } // 100 years
            : packages.find(p => p.id === pkgId);

        if (!targetPkg) {
            setConfirmModal({
                isOpen: true,
                title: "ไม่พบข้อมูล",
                message: "ไม่พบข้อมูลแพ็กเกจที่คุณเลือก",
                type: 'danger',
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
            });
            return;
        }

        setAssigningLoading(true);
        try {
            // 2. Use AdminService for Package Assignment (Firestore + RealtimeDB Sync)
            const { AdminService } = await import('@/features/admin/services/adminService');
            await AdminService.assignPackage(selectedUser.uid, pkgId, user?.uid || 'admin');

            setConfirmModal({
                isOpen: true,
                title: "มอบแพ็กเกจสำเร็จ",
                message: `ดำเนินการมอบสถานะให้แก่คุณ ${selectedUser.displayName} เรียบร้อยแล้ว (ระบบซิงค์ข้อมูลลงจอ TV/Monitor ทันที)`,
                type: 'info',
                onConfirm: () => {
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    fetchUsers(); // Refresh the list to show new status
                }
            });

        } catch (error: any) {
            console.error(error);
            setConfirmModal({
                isOpen: true,
                title: "ผิดพลาด",
                message: `ไม่สามารถมอบแพ็กเกจได้: ${error.message}`,
                type: 'danger',
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
            });
        } finally {
            setAssigningLoading(false);
        }
    };

    const handleAssignLifetime = async () => {
        if (!selectedUser) return;
        setConfirmModal({
            isOpen: true,
            title: "ยืนยันการปลดล็อกตลอดชีพ",
            message: `คุณแน่ใจหรือไม่ที่จะมอบสถานะสมาชิกตลอดชีพ (Lifetime) ให้กับคุณ ${selectedUser.displayName}?`,
            type: 'warning',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                setAssigningLoading(true);
                try {
                    const { AdminService } = await import('@/features/admin/services/adminService');
                    await AdminService.assignLifetime(selectedUser.uid, user?.uid || 'admin');

                    setConfirmModal({
                        isOpen: true,
                        title: "มอบสิทธิ์สำเร็จ",
                        message: `มอบสิทธิ์สมาชิกตลอดชีพ (LIFETIME) ให้แก่คุณ ${selectedUser.displayName} เรียบร้อยแล้ว (ระบบซิงค์ข้อมูลลงจอ TV/Monitor ทันที)`,
                        type: 'info',
                        onConfirm: () => {
                            setConfirmModal(prev => ({ ...prev, isOpen: false }));
                            fetchUsers();
                        }
                    });
                } catch (error: any) {
                    console.error(error);
                    alert("Failed to assign lifetime: " + error.message);
                } finally {
                    setAssigningLoading(false);
                }
            }
        });
    };

    const updateUserRole = async (uid: string, newRole: 'admin' | 'user') => {
        setConfirmModal({
            isOpen: true,
            title: `ยืนยันการตั้งค่าเป็น ${newRole.toUpperCase()}`,
            message: `คุณแน่ใจหรือไม่ที่จะส่งมอบสิทธิ์ระดับ ${newRole === 'admin' ? 'แอดมิน' : 'สมาชิกทั่วไป'} ให้แก่บัญชีนี้?`,
            type: 'warning',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    if (!db) return;
                    await updateDoc(doc(db, "users", uid), { role: newRole });
                    // Update local state to reflect change immediately
                    if (selectedUser && selectedUser.uid === uid) {
                        setSelectedUser({ ...selectedUser, role: newRole });
                    }
                    setUsers(users.map(u => u.uid === uid ? { ...u, role: newRole } : u));
                 } catch (e: any) {
                    console.error("Role update failed:", e);
                    setConfirmModal({
                        isOpen: true,
                        title: "ผิดพลาด",
                        message: `เปลี่ยนบทบาทไม่สำเร็จ: ${e.message}`,
                        type: 'danger',
                        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                    });
                }
            }
        });
    };


    const handleToggleModule = async (moduleId: string) => {
        if (!selectedUser) return;

        const currentModules = selectedUser.installed_modules || [];
        const hasModule = currentModules.includes(moduleId);

        let newModules: string[];
        if (hasModule) {
            newModules = currentModules.filter(id => id !== moduleId);
            setConfirmModal({
                isOpen: true,
                title: "ยืนยันการถอนการติดตั้ง",
                message: `ระบบจะทำการถอนการติดตั้ง module: ${moduleId} ออกจากบัญชีนี้ คุณต้องการดำเนินการต่อหรือไม่?`,
                type: 'danger',
                onConfirm: async () => {
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    await executeToggleModule(newModules);
                }
            });
        } else {
            newModules = [...currentModules, moduleId];
            await executeToggleModule(newModules);
        }
    };

    const executeToggleModule = async (newModules: string[]) => {
        if (!selectedUser) return;
        try {
            if (!db) return;
            await updateDoc(doc(db, "users", selectedUser.uid), {
                installed_modules: newModules
            });

            // Optimistic Update
            const updatedUser = { ...selectedUser, installed_modules: newModules };
            setSelectedUser(updatedUser);
            setUsers(users.map(u => u.uid === selectedUser.uid ? updatedUser : u));
        } catch (e: any) {
            console.error("Module update failed:", e);
            setConfirmModal({
                isOpen: true,
                title: "ผิดพลาด",
                message: "ปรับปรุง Module ให้ผู้ใช้งานไม่สำเร็จ",
                type: 'danger',
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
            });
        }
    };

    const handleSendMessage = async () => {
        if (!notificationUser || !msgTitle.trim() || !msgBody.trim()) return;
        setSendingMsg(true);
        try {
            if (!db) return;
            // Central Hub Pattern (Match NotificationList.tsx)
            await addDoc(collection(db, "notifications"), {
                userId: notificationUser.uid,
                title: msgTitle,
                body: msgBody,
                type: msgType,
                read: false,
                createdAt: serverTimestamp()
            });


            // Also trigger REAL Push Notification via API
            try {
                await fetch('/api/admin/send-broadcast', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: msgTitle,
                        body: msgBody,
                        targetUids: [notificationUser.uid]
                    })
                });
            } catch (pErr) {
                console.warn("⚠️ Push Notification failed (FCM), but in-app saved:", pErr);
            }

            setConfirmModal({
                isOpen: true,
                title: "ส่งข้อความสำเร็จ",
                message: `ส่งการแจ้งเตือนไปยังคุณ ${notificationUser.displayName} เรียบร้อยแล้ว (ระบบส่งรหัสซิงค์ลงมือถือและหน้าจอ TV ให้ด้วย)`,
                type: 'info',
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
            });
            setMsgTitle("");
            setMsgBody("");
            setNotificationDialogOpen(false);
        } catch (error: any) {
            console.error(error);
            setConfirmModal({
                isOpen: true,
                title: "ผิดพลาด",
                message: `ไม่สามารถส่งข้อความได้: ${error.message}`,
                type: 'danger',
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
            });
        } finally {
            setSendingMsg(false);
        }
    };

    const handleSendBroadcast = async () => {
        if (!broadcastTitle.trim() || !broadcastBody.trim()) return;
        setSendingBroadcast(true);
        if (addToast) addToast(`🌪️ กำลังเตรียมประกาศกลุ่มเป้าหมาย (${broadcastType})...`, "info");
        
        try {
            // Target specific UIDs for groups
            let targetUids: string[] | undefined = undefined;
            if (broadcastType === 'premium') {
                targetUids = users.filter(u => getMembershipType(u) !== 'free').map(u => u.uid);
            } else if (broadcastType === 'free') {
                targetUids = users.filter(u => getMembershipType(u) === 'free' && u.email).map(u => u.uid);
            }

            const response = await fetch('/api/admin/send-broadcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: broadcastTitle,
                    body: broadcastBody,
                    targetUids: targetUids
                })
            });

            if (!response.ok) throw new Error("API call failed");

            setConfirmModal({
                isOpen: true,
                title: "ประกาศข้อความสำเร็จ",
                message: targetUids 
                    ? `ส่งประกาศหาผู้ใช้กลุ่มเป้าหมายจำนวน ${targetUids.length} รายการเรียบร้อยแล้ว`
                    : "ส่งประกาศข่าวสารเข้าสู่ระบบ Broadcast หลักสำหรับทุกคนเรียบร้อยแล้วครับ",
                type: 'info',
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
            });

            setBroadcastTitle("");
            setBroadcastBody("");
            setBroadcastDialogOpen(false);
            if (addToast) addToast("✅ ส่งประกาศข่าวสารเรียบร้อยแล้ว", "success");
        } catch (error: any) {
            console.error("Broadcast failed:", error);
            if (addToast) addToast("❌ ไม่สามารถส่งประกาศได้", "error");
        } finally {
            setSendingBroadcast(false);
        }
    };

    const handleBanToggle = async (user: User) => {
        const newBanStatus = !user.banned;
        setConfirmModal({
            isOpen: true,
            title: newBanStatus ? "ระงับการใช้งานบัญชี" : "ยกเลิกการระงับการใช้งาน",
            message: `คุณแน่ใจหรือไม่ที่จะทำการ ${newBanStatus ? 'BAN' : 'UNBAN'} ผู้ใช้ท่านนี้? ${newBanStatus ? 'ผู้ใช้จะไม่สามารถเข้าสู่ระบบเพื่อใช้งานเพลงได้' : 'สิทธิ์การเข้าใช้งานจะกลับมาเป็นปกติ'}`,
            type: newBanStatus ? 'danger' : 'warning',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    await AdminService.updateUserBanStatus(user.uid, newBanStatus);

                    const updatedUser = { ...user, banned: newBanStatus };
                    setUsers(users.map(u => u.uid === user.uid ? updatedUser : u));
                } catch (error) {
                    console.error("Error updating ban status:", error);
                    setConfirmModal({
                        isOpen: true,
                        title: "ผิดพลาด",
                        message: "ไม่สามารถปรับปรุงสถานะระงับการใช้งานได้",
                        type: 'danger',
                        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                    });
                }
            }
        });
    };

    const handleSyncAll = async () => {
        setConfirmModal({
            isOpen: true,
            title: "ยืนยันการซิงค์ข้อมูล (Restore All Users)",
            message: "ระบบจะทำการกวาดรายชื่อสมาชิกทุกคนจาก Firebase Auth มาสร้างไฟล์ในระบบจัดการ (Firestore) ใหม่ที่ตกหล่นอยู่ เหมาะสำหรับเคสค้นหาไม่เจอหรือคนหาย คุณต้องการดำเนินการต่อหรือไม่?",
            type: 'warning',
            confirmText: 'เริ่มซิงค์ข้อมูล',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                setSyncing(true);
                if (addToast) addToast("🌪️ กำลังซิงค์สมาชิกจากระบบ... กรุณารอสักครู่", "info");
                try {
                    const result = await AdminService.syncAllUsers();
                    setConfirmModal({
                        isOpen: true,
                        title: "ซิงค์ข้อมูลสำเร็จ",
                        message: result.message,
                        type: 'info',
                        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                    });
                    if (addToast) addToast("✅ ซิงค์สมาชิกเรียบร้อยแล้ว", "success");
                    fetchUsers();
                } catch (error: any) {
                    console.error("Sync failed:", error);
                    if (addToast) addToast("❌ การซิงค์สมาชิกล้มเหลว", "error");
                } finally {
                    setSyncing(false);
                }
            }
        });
    };

    const handleToggleAuth = async (targetUser: User) => {
        // Safe check for disabled property (might be missing in Firestore but exists in Auth)
        const currentDisabled = (targetUser as any).disabled || false;
        const newStatus = !currentDisabled;
        const actionLabel = newStatus ? "ระงับการเข้าสู่ระบบ" : "เปิดสิทธิ์การเข้าสู่ระบบ";
        
        setConfirmModal({
            isOpen: true,
            title: `ยืนยันการ ${actionLabel}`,
            message: `คุณต้องการ ${actionLabel} ของคุณ ${(targetUser as any).displayName || targetUser.email} ใช่หรือไม่? สมาชิกจะ${newStatus ? 'ไม่สามารถ' : 'กลับมา'} Login ได้ตามปกติ`,
            type: newStatus ? 'danger' : 'warning',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    await AdminService.toggleAuthStatus(targetUser.uid, newStatus);
                    fetchUsers();
                } catch (e: any) {
                    alert("Auth Status Error: " + e.message);
                }
            }
        });
    };

    const handleCleanupGuests = async () => {
        setConfirmModal({
            isOpen: true,
            title: "ยืนยันปฏิบัติการกวาดล้างขยะ (Anonymous)",
            message: "ระบบจะทำการล้างรายการผู้ใช้นิรนามที่ไม่มีการใช้งานเกิน 1 วันออกทันที ข้อมูลผู้ใช้งานจริงและสมาชิกจะไม่ได้รับผลกระทบแน่นอน คุณต้องการดำเนินการต่อหรือไม่?",
            type: 'danger',
            confirmText: 'เริ่มกวาดล้างขยะ',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                setLoading(true);
                if (addToast) addToast("🧹 กำลังปฏิบัติการกวาดล้างขยะ...", "info");
                try {
                    const res = await fetch('/api/admin/bulk-cleanup');
                    const result = await res.json();
                    
                    if (result.success) {
                        setConfirmModal({
                            isOpen: true,
                            title: "กวาดล้างขยะสำเร็จ",
                            message: `ดำเนินการล้างบัญชี Anonymous เรียบร้อยแล้ว\n\n- ลบจาก Auth: ${result.deletedAuth}\n- ลบจาก Firestore: ${result.deletedFirestore}\n- ตรวจสอบรวม: ${result.totalProcessed}`,
                            type: 'info',
                            onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                        });
                        if (addToast) addToast(`🧹 กวาดล้างขยะเรียบร้อย (ลบไป ${result.deletedFirestore} รายการ)`, "success");
                        // Wait 1s for Firestore to propogate deletions before fetch
                        setTimeout(fetchUsers, 1000);
                    } else {
                        throw new Error(result.error || "Unknown server error");
                    }
                } catch (error: any) {
                    console.error("Cleanup failed:", error);
                    setConfirmModal({
                        isOpen: true,
                        title: "ผิดพลาด",
                        message: error.message,
                        type: 'danger',
                        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                    });
                } finally {
                    setLoading(false);
                }
            }
        });
    };




    const filteredUsers = users.filter(u => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
            u.displayName?.toLowerCase().includes(searchLower) ||
            u.email?.toLowerCase().includes(searchLower) ||
            u.uid?.toLowerCase().includes(searchLower);
        const isGuest = !u.email;
        if (!showGuests && isGuest) return false;
        return matchesSearch;
    });

    const getMembershipType = (user: User) => {
        if (user.membership?.type === 'lifetime') return 'lifetime';
        if (user.membership?.type === 'day_pass') return 'pro';
        if (user.membership?.type === 'monthly' || user.membership?.type === 'yearly') return 'vip';
        return 'free';
    };

    const getStatus = (user: User) => {
        if (user.banned) return 'banned';
        if (!user.email) return 'guest';
        return 'active';
    };

    // Calculate Stats
    const stats = {
        total: users.length,
        premium: users.filter(u => getMembershipType(u) !== 'free').length,
        admins: users.filter(u => u.role === 'admin').length,
        banned: users.filter(u => u.banned).length,
        line: users.filter(u => u.uid.startsWith('line:') || u.provider === 'line').length,
        google: users.filter(u => u.provider === 'google' || (u.email && !u.uid.startsWith('line:') && u.email.endsWith('@gmail.com'))).length
    };



    // Ensure hydration consistency
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        console.log("Admin Users Page v1.0.4 Loaded (Auth Verified)");
        setMounted(true);
    }, []);



    // Helper for safe date formatting
    const formatDate = (date: any) => {
        if (!mounted || !date) return "-";
        try {
            // Firestore Timestamp
            if (date.seconds) return new Date(date.seconds * 1000).toLocaleDateString('th-TH');
            // JS Date or String
            return new Date(date).toLocaleDateString('th-TH');
        } catch (e) {
            return "-";
        }
    };

    const getRoleStyle = (role: string) => {
        const s = roleStyles[role as keyof typeof roleStyles];
        return s || { bg: "bg-info/15", text: "text-info", label: "User" };
    };

    const getStatusStyle = (status: string) => {
        const s = statusStyles[status as keyof typeof statusStyles];
        return s || { bg: "bg-muted", text: "text-muted-foreground", dot: "bg-muted-foreground" };
    };

    const getMembershipStyle = (type: string) => {
        const s = membershipStyles[type as keyof typeof membershipStyles];
        return s || { bg: "bg-muted", text: "text-muted-foreground", label: "Free" };
    };

    return (
        <AdminLayout headerTitle="User Manager">
            <Head>
                <title>Users - YouOke Admin</title>
            </Head>
            <GlobalScrollbarStyle />

            {/* Dashboard Header */}
            <div className="mb-10 p-6 bg-white rounded-[24px] border border-gray-100 shadow-sm shadow-gray-200/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-1.5 h-10 bg-primary rounded-full shadow-[0_0_15px_rgba(239,68,68,0.3)]"></div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">จัดการผู้ใช้งาน</h1>
                        <p className="text-sm text-gray-500 mt-1 font-medium">จัดการรายชื่อสมาชิก สิทธิ์การใช้งาน และสถานะของระบบ</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchUsers} className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-sm text-gray-600 hover:bg-white hover:border-indigo-200 transition-all shadow-sm">
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                        รีเฟรชข้อมูล
                    </button>
                    <button 
                        onClick={handleSyncAll}
                        disabled={syncing}
                        className={cn(
                            "flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all shadow-sm",
                            syncing ? "bg-gray-100 text-gray-400" : "bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                        )}
                    >
                        <ArrowDownUp className={cn("w-4 h-4", syncing && "animate-spin")} />
                        {syncing ? 'กำลังซิงค์...' : 'Sync สมาชิก'}
                    </button>
                    <button 
                        onClick={() => setBroadcastDialogOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-50/50 border border-indigo-100 rounded-2xl font-bold text-sm text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                    >
                        <Megaphone className="w-4 h-4" />
                        ประกาศกลุ่ม
                    </button>
                    <button 
                        onClick={handleCleanupGuests} 
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-red-200 rounded-2xl font-bold text-sm text-red-600 hover:bg-red-50 transition-all shadow-sm"
                    >
                        <Trash2 className="w-4 h-4" />
                        ล้าง Guest
                    </button>
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 rounded-2xl font-bold text-sm text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                    >
                        <UserPlus className="w-4 h-4" />
                        เพิ่มผู้ใช้ใหม่
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard 
                    title="สมาชิกทั้งหมด"
                    value={stats.total}
                    icon={Users}
                    iconColor="primary"
                    change={{ value: 12, type: "increase" }}
                    className="border-primary/20 bg-gradient-to-br from-white to-primary/5 shadow-indigo-100"
                />
                
                <StatCard 
                    title="ผู้ใช้ผ่าน LINE"
                    value={stats.line}
                    icon={LineIcon}
                    iconColor="success"
                />

                <StatCard 
                    title="ผู้ใช้ผ่าน Google"
                    value={stats.google}
                    icon={Mail}
                    iconColor="info"
                />

                <StatCard 
                    title="สมาชิกพรีเมียม"
                    value={stats.premium}
                    icon={Crown}
                    iconColor="warning"
                />
            </div>

            {/* Main Table Card */}
            <div className="bg-white border border-gray-100 rounded-[40px] shadow-2xl shadow-gray-200/50 overflow-hidden">
                {/* Table Filters Header */}
                <div className="p-8 flex flex-col md:flex-row justify-between items-center gap-6 border-b border-gray-50">
                    <div className="relative w-full md:w-[450px]">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="ค้นหาชื่อ, อีเมล หรือ UID ของผู้ใช้..." 
                            className="w-full pl-14 pr-6 py-4 bg-gray-50/50 border border-gray-100 rounded-[22px] focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-medium text-gray-900"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="flex items-center gap-4 mr-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="toggle toggle-primary toggle-sm"
                                    checked={showGuests}
                                    onChange={e => setShowGuests(e.target.checked)}
                                />
                                <span className="text-xs font-bold text-gray-500">แสดง Guest</span>
                            </label>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
                            <Filter className="w-4 h-4 text-gray-400" />
                            <span className="text-xs font-bold text-gray-500">บทบาท</span>
                        </div>
                        <select className="px-4 py-3 bg-white border border-gray-200 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-100 min-w-[150px]">
                            <option>ทั้งหมด (All)</option>
                            <option>Admin Only</option>
                            <option>User Only</option>
                        </select>
                    </div>
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border/50 bg-muted/30">
                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">ผู้ใช้</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">ช่องทาง</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">บทบาท</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">สถานะ</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">ระดับสมาชิก</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">วันหมดอายุ</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {filteredUsers.map((user) => {
                                const mType = getMembershipType(user);
                                const status = getStatus(user);
                                const roleStyle = getRoleStyle(user.role);
                                const statusStyle = getStatusStyle(status);
                                const membershipStyle = getMembershipStyle(mType);
                                return (
                                    <tr key={user.uid} className="hover:bg-muted/20 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 text-foreground font-semibold border border-border/30 overflow-hidden">
                                                    {user.photoURL ? <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" /> : user.displayName?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-foreground">{user.displayName || 'Unknown'}</p>
                                                    <p className="text-sm text-muted-foreground">{user.email || 'Guest User'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {(() => {
                                                const provider = user.provider || (user.uid.startsWith('line:') ? 'line' : user.email?.includes('@') ? 'google' : 'guest');
                                                if (provider === 'line') return (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#06C755]/10 text-[#06C755] text-[10px] font-bold border border-[#06C755]/20">
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M24 10.3c0-4.6-4.6-8.3-10.4-8.3C7.8 2 3.1 5.7 3.1 10.3c0 4.1 3.7 7.5 8.7 8.2.3.1.8.2 1 .5.1.1.2.4.1.6l-.3 1.9c-.1.4-.4 1.5-.4 1.5l3.2-1.9s1.4-.8 2-.7l.1-.1c4.5-1.1 6.5-4.5 6.5-10z"/></svg>
                                                        LINE
                                                    </span>
                                                );
                                                if (provider === 'google') return (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-500/10 text-blue-600 text-[10px] font-bold border border-blue-500/20">
                                                        <svg width="12" height="12" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/><path d="M3.964 10.706c-.18-.54-.282-1.117-.282-1.706 0-.589.102-1.166.282-1.706V4.962H.957C.347 6.177 0 7.549 0 9s.347 2.823.957 4.038l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
                                                        GOOGLE
                                                    </span>
                                                );
                                                return (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-bold border border-slate-200">
                                                        <Mail size={10} />
                                                        EMAIL
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border border-transparent", roleStyle.bg, roleStyle.text)}>
                                                <Shield className="h-3 w-3 mr-1" />
                                                {roleStyle.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", statusStyle.bg, statusStyle.text)}>
                                                <span className={cn("mr-1.5 h-1.5 w-1.5 rounded-full", statusStyle.dot)} />
                                                {status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border border-transparent", membershipStyle.bg, membershipStyle.text)}>
                                                {membershipStyle.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">
                                            {mType === "lifetime" ? (
                                                <span className="text-success font-medium">✨ ตลอดชีพ</span>
                                            ) : (
                                                (() => {
                                                    if (!user.membership?.expiresAt) return "-";

                                                    // Calculate Remaining Days
                                                    const now = new Date();
                                                    const expiry = user.membership.expiresAt.seconds
                                                        ? new Date(user.membership.expiresAt.seconds * 1000)
                                                        : new Date(user.membership.expiresAt);

                                                    const diffTime = expiry.getTime() - now.getTime();
                                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                                    const isExpired = diffDays < 0;
                                                    const isNearExpiry = diffDays > 0 && diffDays <= 3;

                                                    return (
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className={cn(
                                                                    "font-medium",
                                                                    isExpired ? "text-destructive" : isNearExpiry ? "text-warning" : "text-foreground"
                                                                )}>
                                                                    {isExpired ? "หมดอายุแล้ว" : `${diffDays} วัน`}
                                                                </span>
                                                                {isNearExpiry && (
                                                                    <div className="tooltip tooltip-top" data-tip="ใกล้หมดอายุ">
                                                                        <Bell className="h-4 w-4 text-warning animate-pulse" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span className="text-xs opacity-70">
                                                                {formatDate(user.membership?.expiresAt)}
                                                            </span>
                                                        </div>
                                                    );
                                                })()
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => setActionUser(user)}
                                                className="btn btn-ghost btn-xs text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all group"
                                                title="จัดการสมาชิก"
                                            >
                                                <MoreHorizontal className="h-5 w-5 group-hover:scale-110" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between border-t border-gray-50 px-8 py-6 bg-gray-50/30">
                    <p className="text-sm text-gray-400 font-bold">
                        แสดง <span className="text-gray-900">{filteredUsers.length}</span> รายการ
                    </p>
                    <div className="flex items-center gap-3">
                        <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-gray-900 shadow-sm disabled:opacity-50 transition-all font-black" disabled>&lt;</button>
                        <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20 font-black">1</button>
                        <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-gray-900 shadow-sm transition-all font-black">&gt;</button>
                    </div>
                </div>
            </div>

            {/* User Action Modal - NEW Premium Modal for Actions */}
            {actionUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" 
                        onClick={() => setActionUser(null)}
                    />
                    <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-white p-6 animate-in zoom-in-95 fade-in duration-300">
                        <div className="flex flex-col items-center mb-6 text-center">
                            <div className="h-16 w-16 rounded-full bg-primary/5 border-2 border-primary/20 flex items-center justify-center overflow-hidden mb-3">
                                {actionUser.photoURL ? (
                                    <img src={actionUser.photoURL} alt={actionUser.displayName} className="h-full w-full object-cover" />
                                ) : (
                                    <span className="text-xl font-bold text-primary">{actionUser.displayName?.charAt(0) || 'U'}</span>
                                )}
                            </div>
                            <h3 className="text-lg font-black text-slate-900 leading-none">{actionUser.displayName || "Unknown User"}</h3>
                            <p className="text-xs text-slate-400 font-medium mt-1 truncate max-w-full italic">{actionUser.email || actionUser.uid}</p>
                        </div>

                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-1">คำสั่งจัดการข้อมูล</p>
                            
                            <button 
                                onClick={() => { setSelectedUser(actionUser); setActionUser(null); }}
                                className="w-full flex items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-100 hover:border-primary/20 hover:bg-primary/5 hover:text-primary transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <Edit2 className="h-5 w-5 text-slate-400 group-hover:text-primary" />
                                    <span className="text-sm font-bold">จัดการสมาชิก (Membership)</span>
                                </div>
                                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                            </button>

                            <button 
                                onClick={() => { setNotificationUser(actionUser); setNotificationDialogOpen(true); setActionUser(null); }}
                                className="w-full flex items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50 hover:text-indigo-600 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <Bell className="h-5 w-5 text-slate-400 group-hover:text-indigo-600" />
                                    <span className="text-sm font-bold">ส่งข้อความแจ้งเตือน</span>
                                </div>
                                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                            </button>

                            <div className="h-px bg-slate-50 my-2" />

                            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest px-2 mb-1">ความปลอดภัย (Moderation)</p>
                            
                            <button 
                                onClick={() => { handleBanToggle(actionUser); setActionUser(null); }}
                                className={cn(
                                    "w-full flex items-center gap-3 p-4 rounded-2xl border transition-all group font-bold text-sm",
                                    actionUser.banned 
                                        ? "bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100" 
                                        : "bg-orange-50 border-orange-100 text-orange-600 hover:bg-orange-100"
                                )}
                            >
                                <Ban className="h-5 w-5" />
                                <span>{actionUser.banned ? "ปลดระงับใช้งาน (Unban)" : "ระงับใช้งาน (Ban User)"}</span>
                            </button>

                            <button 
                                onClick={() => { handleToggleAuth(actionUser); setActionUser(null); }}
                                className={cn(
                                    "w-full flex items-center gap-3 p-4 rounded-2xl border transition-all group font-bold text-sm",
                                    (actionUser as any).disabled 
                                        ? "bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100" 
                                        : "bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100"
                                )}
                            >
                                {(actionUser as any).disabled ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
                                <span>{(actionUser as any).disabled ? "เปิดสิทธิ์ Auth (Enable)" : "ระงับสิทธิ์ Auth (Disable)"}</span>
                            </button>
                        </div>
                        
                        <button 
                            onClick={() => setActionUser(null)}
                            className="w-full mt-6 py-3 text-sm font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest"
                        >
                            ยกเลิก
                        </button>
                    </div>
                </div>
            )}

            {/* Edit Membership Modal - Platinum v2.3 Integrated */}
            {selectedUser && (
                <EditUserModal
                    user={selectedUser as any}
                    packages={packages}
                    availableModules={AVAILABLE_MODULES} // 🛡️ ADDED: Missing prop fixed
                    loading={assigningLoading}

                    onClose={() => setSelectedUser(null)}
                    onUpdateRole={updateUserRole}
                    onAssignPackage={handleAssignPackage}
                    onToggleModule={handleToggleModule}
                    onRefresh={fetchUsers}
                />
            )}


            {/* Notification Modal - Refactored */}
            {notificationDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setNotificationDialogOpen(false)}
                    />

                    <div className="relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-card shadow-2xl transition-all flex flex-col">
                        <div className="bg-muted/30 p-6 border-b border-border flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-lg text-foreground">ส่งข้อความแจ้งเตือน</h3>
                                <p className="text-xs text-muted-foreground">ส่งข้อความถึง {notificationUser?.displayName}</p>
                            </div>
                            <button
                                onClick={() => setNotificationDialogOpen(false)}
                                className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="form-control">
                                <label className="label pt-0"><span className="label-text font-medium text-foreground">หัวข้อ (Title)</span></label>
                                <input
                                    className="input input-bordered input-sm bg-muted/30 border-border/50 focus:border-primary text-foreground"
                                    value={msgTitle}
                                    onChange={e => setMsgTitle(e.target.value)}
                                    placeholder="หัวข้อแจ้งเตือน"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label"><span className="label-text font-medium text-foreground">ข้อความ (Message)</span></label>
                                <textarea
                                    className="textarea textarea-bordered bg-muted/30 border-border/50 focus:border-primary h-24 text-foreground resize-none"
                                    value={msgBody}
                                    onChange={e => setMsgBody(e.target.value)}
                                    placeholder="รายละเอียด..."
                                ></textarea>
                            </div>
                            <div className="flex gap-2">
                                {['info', 'success', 'warning', 'system'].map(t => (
                                    <button
                                        key={t}
                                        className={cn(
                                            "btn btn-xs normal-case transition-all",
                                            msgType === t
                                                ? `bg-${t === 'info' ? 'blue' : t === 'success' ? 'green' : t === 'warning' ? 'yellow' : 'gray'}-500 text-white border-none`
                                                : "btn-ghost text-muted-foreground border border-border/50"
                                        )}
                                        onClick={() => setMsgType(t as any)}
                                    >
                                        {t.charAt(0).toUpperCase() + t.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-muted/30 p-4 border-t border-border flex justify-end gap-3">
                            <button className="btn btn-ghost btn-sm" onClick={() => setNotificationDialogOpen(false)}>ยกเลิก</button>
                            <button
                                className="btn btn-primary btn-sm text-primary-foreground hover:bg-primary/90 border-none gap-2 min-w-[120px]"
                                onClick={handleSendMessage}
                                disabled={sendingMsg}
                            >
                                {sendingMsg ? <span className="loading loading-spinner loading-xs"></span> : <Bell className="h-4 w-4" />}
                                ส่งข้อความ
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Modal */}
            <ConfirmModal 
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                confirmText={confirmModal.confirmText}
            />

            {isAddModalOpen && (
                <AddUserModal
                    onClose={() => setIsAddModalOpen(false)}
                    onRefresh={fetchUsers}
                />
            )}
            {/* Broadcast Modal - NEW Platinum v2.29 */}
            {broadcastDialogOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setBroadcastDialogOpen(false)} />
                    <div className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
                        <div className="bg-indigo-600 p-8 text-white relative">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Megaphone className="w-24 h-24" />
                            </div>
                            <div className="flex items-center gap-4 mb-2">
                                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                                    <Megaphone className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black tracking-tight">ประกาศข่าวสารกลุ่ม</h3>
                                    <p className="text-sm text-indigo-100 opacity-80 font-medium">ส่งแจ้งเตือน Push ถึงสมาชิกในระบบ</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="flex bg-slate-50 p-1.5 rounded-2xl gap-1">
                                {[
                                    { id: 'all', label: 'ทุกคน', icon: Users },
                                    { id: 'premium', label: 'พรีเมียม', icon: Crown },
                                    { id: 'free', label: 'ทั่วไป', icon: UserCog }
                                ].map((g) => (
                                    <button
                                        key={g.id}
                                        onClick={() => setBroadcastType(g.id as any)}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition-all",
                                            broadcastType === g.id 
                                                ? "bg-white text-indigo-600 shadow-sm" 
                                                : "text-slate-400 hover:text-slate-600"
                                        )}
                                    >
                                        <g.icon className="w-3.5 h-3.5" />
                                        {g.label}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-4">
                                <div className="form-control">
                                    <label className="label text-[11px] font-black text-slate-400 uppercase tracking-widest">หัวข้อประกาศ</label>
                                    <input
                                        className="input input-bordered bg-slate-50 border-slate-100 rounded-2xl font-bold focus:ring-4 focus:ring-indigo-100"
                                        value={broadcastTitle}
                                        onChange={e => setBroadcastTitle(e.target.value)}
                                        placeholder="เช่น: อัปเดตเพลงใหม่วันนี้..."
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label text-[11px] font-black text-slate-400 uppercase tracking-widest">เนื้อหา</label>
                                    <textarea
                                        className="textarea textarea-bordered bg-slate-50 border-slate-100 rounded-2xl h-32 font-medium focus:ring-4 focus:ring-indigo-100 resize-none"
                                        value={broadcastBody}
                                        onChange={e => setBroadcastBody(e.target.value)}
                                        placeholder="ระบุข้อความประกาศ..."
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-4">
                             <button 
                                onClick={() => setBroadcastDialogOpen(false)}
                                className="px-6 py-3 font-bold text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button
                                className="flex-1 bg-indigo-600 py-3.5 rounded-2xl font-black text-sm text-white hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                onClick={handleSendBroadcast}
                                disabled={sendingBroadcast}
                            >
                                {sendingBroadcast ? (
                                    <span className="loading loading-spinner loading-sm"></span>
                                ) : (
                                    <>
                                        <BellRing className="w-5 h-5" />
                                        <span>ส่งประกาศทันที</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}



