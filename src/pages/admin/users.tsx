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
    BellRing,
    Star,
    Zap,
    UserCheck
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
    const [broadcastType, setBroadcastType] = useState<'all' | 'lifetime' | 'yearly' | 'monthly' | 'pro' | 'free'>('all');
    const [broadcastTitle, setBroadcastTitle] = useState("");
    const [broadcastBody, setBroadcastBody] = useState("");
    const [sendingBroadcast, setSendingBroadcast] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [roleFilter, setRoleFilter] = useState('all');
    const [packageFilter, setPackageFilter] = useState('all');

    // 🛡️ HYDRATION CONTROL
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        console.log("Admin Users Page v1.0.4 Loaded (Auth Verified)");
        setMounted(true);
    }, []);

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

    // 🛡️ HELPER FUNCTIONS (Moved up to fix ReferenceError)
    const getMembershipType = (user: User) => {
        const membership = user.membership;
        if (!membership) return 'free';

        // SMART CHECK: Expiration Detection
        if (membership.type !== 'lifetime' && membership.expiresAt) {
            const expiry = membership.expiresAt.toDate ? membership.expiresAt.toDate() : new Date(membership.expiresAt);
            if (new Date() > expiry) return 'free';
        }

        if (membership.type === 'lifetime') return 'lifetime';
        if (membership.type === 'day_pass') return 'pro';
        if (membership.type === 'monthly') return 'monthly';
        if (membership.type === 'yearly') return 'yearly';
        
        return 'free';
    };

    const getStatus = (user: User) => {
        if (user.banned) return 'banned';
        if (!user.email) return 'guest';
        return 'active';
    };

    // Helper for safe date formatting (Match hydration check)
    const formatDate = (date: any) => {
        if (!mounted || !date) return "-";
        try {
            if (date.seconds) return new Date(date.seconds * 1000).toLocaleDateString('th-TH');
            return new Date(date).toLocaleDateString('th-TH');
        } catch (e) {
            return "-";
        }
    };


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
            // 🛡️ v3.7.8 Unified: Admin NO longer writes to Firestore from client.
            // Let the API handle both Firestore entry AND Push for atomicity.
            const response = await fetch('/api/admin/send-broadcast', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    targetUids: [notificationUser.uid],
                    title: msgTitle,
                    body: msgBody
                })
            });

            const result = await response.json();

            if (!result.success) throw new Error(result.error || 'API Error');

            setConfirmModal({
                isOpen: true,
                title: "ส่งข้อความสำเร็จ",
                message: `ส่งการแจ้งเตือนไปยังคุณ ${notificationUser.displayName} เรียบร้อยแล้ว (OneSignal: ${result.pushResult?.success ? 'Success' : 'Fail'})`,
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
            if (broadcastType !== 'all') {
                targetUids = users.filter(u => {
                    const mType = getMembershipType(u);
                    // 🛡️ HUMAN-ONLY CHECK: Skip Guests (No Email) for all targeted types
                    if (!u.email) return false;
                    // Match type logic using SMART detection
                    return mType === broadcastType;
                }).map(u => u.uid);
            } else {
                // 🛡️ HUMAN-ONLY CHECK for 'ALL'
                targetUids = users.filter(u => u.email).map(u => u.uid);
            }

            if (!db) return;

            // 1. Direct Firestore Write (Reliable Client-side Persistence)
            if (broadcastType === 'all') {
                await addDoc(collection(db, "notifications"), {
                    userId: 'all',
                    title: broadcastTitle,
                    body: broadcastBody,
                    read: false,
                    createdAt: serverTimestamp(),
                    type: 'global_broadcast'
                });
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




    // Calculate Stats (Business Focussed)
    const stats = {
        total: users.length,
        registered: users.filter(u => u.email).length,
        lifetime: users.filter(u => getMembershipType(u) === 'lifetime').length,
        yearly: users.filter(u => getMembershipType(u) === 'yearly').length,
        monthly: users.filter(u => getMembershipType(u) === 'monthly').length,
        free: users.filter(u => getMembershipType(u) === 'free' && u.email).length
    };

    // Filter Logic
    const filteredUsers = users.filter(u => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
            u.displayName?.toLowerCase().includes(searchLower) ||
            u.email?.toLowerCase().includes(searchLower) ||
            u.uid?.toLowerCase().includes(searchLower);
        
        const isGuest = !u.email;
        if (!showGuests && isGuest) return false;

        const matchesRole = roleFilter === 'all' || u.role === roleFilter;
        const matchesPackage = packageFilter === 'all' || getMembershipType(u) === packageFilter;

        return matchesSearch && matchesRole && matchesPackage;
    });








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
            <div className="mb-6 p-4 bg-white rounded-[20px] border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-8 bg-primary rounded-full"></div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-tight">จัดการผู้ใช้งาน</h1>
                        <p className="text-[11px] text-gray-400 font-medium">จัดการสมาชิกและสิทธิ์การใช้งาน</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button onClick={fetchUsers} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-[11px] text-gray-600 hover:bg-white hover:border-indigo-200 transition-all">
                        <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                        รีเฟรช
                    </button>
                    <button 
                        onClick={handleSyncAll}
                        disabled={syncing}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all",
                            syncing ? "bg-gray-100 text-gray-400" : "bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                        )}
                    >
                        <ArrowDownUp className={cn("w-3.5 h-3.5", syncing && "animate-spin")} />
                        ซิงค์สมาชิก
                    </button>
                    <button 
                        onClick={() => setBroadcastDialogOpen(true)}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 border border-indigo-500 rounded-xl font-black text-[11px] text-white hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Megaphone className="w-3.5 h-3.5 fill-white/20" />
                        ประกาศกลุ่มเป้าหมาย
                    </button>
                    <button 
                        onClick={handleCleanupGuests} 
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-100 rounded-xl font-bold text-[11px] text-red-500 hover:bg-red-50 transition-all"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        ล้างขยะ
                    </button>
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 rounded-xl font-bold text-[11px] text-white hover:bg-indigo-700 transition-all ml-1"
                    >
                        <UserPlus className="w-3.5 h-3.5" />
                        เพิ่มผู้ใช้
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
                <StatCard 
                    title="ยอดผู้ใช้รวม"
                    value={stats.total}
                    icon={Users}
                    iconColor="primary"
                    className="border-primary/10 bg-gradient-to-br from-white to-primary/5"
                />
                <StatCard 
                    title="ลงทะเบียนจริง"
                    value={stats.registered}
                    icon={Mail}
                    iconColor="accent"
                    className="ring-1 ring-indigo-500/10 bg-indigo-50/10"
                />
                <StatCard 
                    title="สมาชิกตลอดชีพ"
                    value={stats.lifetime}
                    icon={Crown}
                    iconColor="warning"
                />
                <StatCard 
                    title="สมาชิกรายปี"
                    value={stats.yearly}
                    icon={Star}
                    iconColor="info"
                />
                <StatCard 
                    title="สมาชิกรายเดือน"
                    value={stats.monthly}
                    icon={Zap}
                    iconColor="success"
                />
                <StatCard 
                    title="สมาชิกทั่วไป"
                    value={stats.free}
                    icon={UserCheck}
                    iconColor="secondary"
                />
            </div>

            {/* Main Table Card */}
            <div className="bg-white border border-gray-100 rounded-[40px] overflow-hidden">
                {/* Table Filters Header */}
                <div className="p-4 flex flex-col lg:flex-row justify-between items-center gap-3 border-b border-gray-50">
                    <div className="relative w-full lg:w-[320px]">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="ค้นหาชื่อ, อีเมล..." 
                            className="w-full pl-11 pr-6 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-medium text-xs text-gray-900"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        <div className="flex items-center gap-3 mr-2">
                            <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                                <input
                                    type="checkbox"
                                    className="toggle toggle-primary toggle-xs"
                                    checked={showGuests}
                                    onChange={e => setShowGuests(e.target.checked)}
                                />
                                <span className="text-[10px] font-bold text-gray-500 uppercase">แขก</span>
                            </label>
                        </div>
                        
                        {/* Role Filter */}
                        <div className="flex items-center gap-2">
                            <select 
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl font-bold text-[11px] outline-none focus:ring-2 focus:ring-indigo-100 min-w-[120px] text-gray-500 uppercase"
                            >
                                <option value="all">บทบาททั้งหมด</option>
                                <option value="admin">ADMIN ONLY</option>
                                <option value="user">USER ONLY</option>
                            </select>
                        </div>

                        {/* Package Filter */}
                        <div className="flex items-center gap-2">
                            <select 
                                value={packageFilter}
                                onChange={(e) => setPackageFilter(e.target.value)}
                                className="px-3 py-2 bg-indigo-50/50 border border-indigo-100 rounded-xl font-bold text-[11px] outline-none focus:ring-2 focus:ring-indigo-100 min-w-[140px] text-indigo-600 uppercase"
                            >
                                <option value="all">แพ็กเกจทั้งหมด</option>
                                <option value="lifetime">LIFETIME (ถาวร)</option>
                                <option value="yearly">YEARLY (รายปี)</option>
                                <option value="monthly">MONTHLY (รายเดือน)</option>
                                <option value="pro">DAY PASS (รายวัน)</option>
                                <option value="free">FREE (ทั่วไป)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border/50 bg-muted/30">
                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">ผู้ใช้</th>
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
                                    <tr key={user.uid} className="hover:bg-indigo-50/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div 
                                                className="flex items-center gap-3 cursor-pointer"
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setIsAddModalOpen(false); // Trigger Edit Modal
                                                }}
                                            >
                                                <div className="relative group/avatar">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-white text-indigo-600 font-bold border border-indigo-100 overflow-hidden group-hover/avatar:ring-2 group-hover/avatar:ring-indigo-200 transition-all">
                                                        {user.photoURL ? <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" /> : user.displayName?.charAt(0)}
                                                    </div>
                                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center border border-gray-50 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Edit2 className="w-2.5 h-2.5 text-indigo-500" />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-900 text-sm group-hover:text-indigo-600 transition-colors">
                                                        {user.displayName || 'Unknown'}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 font-medium">{user.email || 'GUEST USER'}</span>
                                                </div>
                                            </div>
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
                        <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-gray-900 disabled:opacity-50 transition-all font-black" disabled>&lt;</button>
                        <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white font-black">1</button>
                        <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-gray-900 transition-all font-black">&gt;</button>
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
                    <div className="relative w-full max-w-sm bg-white rounded-3xl border border-white p-6 animate-in zoom-in-95 fade-in duration-300">
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

                    <div className="relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-card transition-all flex flex-col">
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
                    <div className="relative w-full max-w-lg bg-white rounded-[32px] overflow-hidden animate-in zoom-in-95 fade-in duration-300">
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
                            <div className="grid grid-cols-3 bg-slate-50 p-1.5 rounded-2xl gap-1">
                                {[
                                    { id: 'all', label: 'ทุกคน', icon: Users },
                                    { id: 'lifetime', label: 'ตลอดชีพ', icon: Crown },
                                    { id: 'yearly', label: 'รายปี', icon: Star },
                                    { id: 'monthly', label: 'รายเดือน', icon: Zap },
                                    { id: 'pro', label: 'รายวัน', icon: Zap },
                                    { id: 'free', label: 'ทั่วไป', icon: UserCog }
                                ].map((g) => (
                                    <button
                                        key={g.id}
                                        onClick={() => setBroadcastType(g.id as any)}
                                        className={cn(
                                            "flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-[10px] transition-all",
                                            broadcastType === g.id 
                                                ? "bg-white text-indigo-600 ring-1 ring-indigo-50" 
                                                : "text-slate-400 hover:text-slate-600"
                                        )}
                                    >
                                        <g.icon className="w-3 h-3" />
                                        {g.label}
                                    </button>
                                ))}
                            </div>

                            {/* Target Summary Badge */}
                            <div className="flex justify-center -mt-2">
                                <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                                    เป้าหมาย: {
                                        broadcastType === 'all' 
                                            ? users.filter(u => u.email).length 
                                            : users.filter(u => u.email && getMembershipType(u) === broadcastType).length
                                    } รายการ
                                </span>
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
                                className="flex-1 bg-indigo-600 py-3.5 rounded-2xl font-black text-sm text-white hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
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



