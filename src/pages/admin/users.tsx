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
    Package
} from "lucide-react";
import { collection, query, orderBy, limit, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, addDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { cn } from "@/lib/utils";

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
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showGuests, setShowGuests] = useState(true);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [packages, setPackages] = useState<PackageOption[]>([]);
    const [assigningLoading, setAssigningLoading] = useState(false);

    // Notification State
    const [msgTitle, setMsgTitle] = useState("");
    const [msgBody, setMsgBody] = useState("");
    const [sendingMsg, setSendingMsg] = useState(false);
    const [msgType, setMsgType] = useState<'info' | 'warning' | 'success' | 'system'>('system');
    const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
    const [notificationUser, setNotificationUser] = useState<User | null>(null);

    // Fetch Users
    const fetchUsers = async () => {
        setLoading(true);
        try {
            if (!db) return;
            const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map((doc) => ({
                uid: doc.id, // Ensure uid is set from doc.id
                ...doc.data(),
            })) as User[];

            // SORT: Admin first, then others
            data.sort((a, b) => {
                if (a.role === 'admin' && b.role !== 'admin') return -1;
                if (a.role !== 'admin' && b.role === 'admin') return 1;
                return 0; // Keep original order (createdAt desc)
            });

            setUsers(data);
        } catch (error) {
            console.error("Error fetching users:", error);
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
        fetchUsers();
        fetchPackages();
    }, []);

    const handleAssignPackage = async (pkgId: string) => {
        if (!selectedUser || !pkgId) return;

        // 1. Find the selected package to get duration
        const targetPkg = pkgId === 'lifetime'
            ? { id: 'lifetime', name: 'Lifetime', durationDays: 36500 } // 100 years
            : packages.find(p => p.id === pkgId);

        if (!targetPkg) {
            alert("ไม่พบข้อมูลแพ็กเกจ");
            return;
        }

        setAssigningLoading(true);
        try {
            // 2. Calculate Expiry Date
            const now = new Date();
            const expiresAt = new Date(now.getTime() + targetPkg.durationDays * 24 * 60 * 60 * 1000);

            // 3. Update Firestore
            if (!db) return;
            await updateDoc(doc(db, "users", selectedUser.uid), {
                membership: {
                    type: pkgId === 'lifetime' ? 'lifetime' : 'pro',
                    updatedAt: serverTimestamp(),
                    status: 'active',
                    expiresAt: expiresAt, // Save as Firestore Timestamp (JS Date converts automatically)
                    packageId: pkgId
                }
            });

            alert(`✅ มอบแพ็กเกจ "${targetPkg.name}" ให้เรียบร้อยแล้ว`);

            // 4. Optimistic Update
            const updatedUser = {
                ...selectedUser,
                membership: {
                    type: pkgId === 'lifetime' ? 'lifetime' : 'pro',
                    status: 'active',
                    expiresAt: expiresAt,
                    packageId: pkgId
                }
            };
            setSelectedUser(updatedUser as any);
            setUsers(users.map(u => u.uid === selectedUser.uid ? updatedUser as any : u));

        } catch (error: any) {
            console.error(error);
            alert("เกิดข้อผิดพลาด: " + error.message);
        } finally {
            setAssigningLoading(false);
        }
    };

    const handleAssignLifetime = async () => {
        if (!selectedUser) return;
        if (!confirm(`คุณแน่ใจหรือไม่ที่จะมอบสิทธิ์ LIFETIME ให้กับ ${selectedUser.displayName}?`)) return;

        setAssigningLoading(true);
        try {
            if (!db) return;
            const userRef = doc(db, "users", selectedUser.uid);
            await updateDoc(userRef, {
                membership: {
                    type: 'lifetime',
                    status: 'active',
                    updatedAt: serverTimestamp()
                }
            });

            alert(`มอบสิทธิ์ LIFETIME เรียบร้อยแล้ว`);
            setSelectedUser({ ...selectedUser, membership: { type: 'lifetime', status: 'active', expiresAt: null } as any });
            fetchUsers();
        } catch (error: any) {
            console.error(error);
            alert("Failed to assign lifetime: " + error.message);
        } finally {
            setAssigningLoading(false);
        }
    };

    const updateUserRole = async (uid: string, newRole: 'admin' | 'user') => {
        if (!confirm(`ยืนยันเปลี่ยนบทบาทเป็น ${newRole.toUpperCase()}?`)) return;
        try {
            if (!db) return;
            await updateDoc(doc(db, "users", uid), { role: newRole });
            // Update local state to reflect change immediately
            if (selectedUser && selectedUser.uid === uid) {
                setSelectedUser({ ...selectedUser, role: newRole });
            }
            setUsers(users.map(u => u.uid === uid ? { ...u, role: newRole } : u));
            alert("✅ เปลี่ยนบทบาทสำเร็จ!");
        } catch (e: any) {
            console.error("Role update failed:", e);
            alert("❌ เปลี่ยนบทบาทไม่สำเร็จ: " + e.message);
        }
    };

    const handleToggleModule = async (moduleId: string) => {
        if (!selectedUser) return;

        const currentModules = selectedUser.installed_modules || [];
        const hasModule = currentModules.includes(moduleId);

        let newModules;
        if (hasModule) {
            newModules = currentModules.filter(id => id !== moduleId);
            if (!confirm(`ถอนการติดตั้ง module: ${moduleId}?`)) return;
        } else {
            newModules = [...currentModules, moduleId];
        }

        try {
            if (!db) return;
            await updateDoc(doc(db, "users", selectedUser.uid), {
                installed_modules: newModules
            });

            // Optimistic Update
            const updatedUser = { ...selectedUser, installed_modules: newModules };
            setSelectedUser(updatedUser);
            setUsers(users.map(u => u.uid === selectedUser.uid ? updatedUser : u));

        } catch (error: any) {
            console.error("Module update failed:", error);
            alert("Failed to update module: " + error.message);
        }
    };

    const handleSendMessage = async () => {
        if (!notificationUser || !msgTitle.trim() || !msgBody.trim()) return;
        setSendingMsg(true);
        try {
            if (!db) return;
            await addDoc(collection(db, `users/${notificationUser.uid}/notifications`), {
                title: msgTitle,
                message: msgBody,
                type: msgType,
                read: false,
                createdAt: serverTimestamp()
            });

            alert("ส่งข้อความเรียบร้อย!");
            setMsgTitle("");
            setMsgBody("");
            setNotificationDialogOpen(false);
        } catch (error: any) {
            console.error(error);
            alert("Failed to send message: " + error.message);
        } finally {
            setSendingMsg(false);
        }
    };

    const handleBanToggle = async (user: User) => {
        const newBanStatus = !user.banned;
        if (confirm(`คุณต้องการ ${newBanStatus ? 'ระงับการใช้งาน (BAN)' : 'ปลดระงับ (UNBAN)'} ผู้ใช้ ${user.displayName} หรือไม่?`)) {
            try {
                const { AdminService } = await import('@/features/admin/services/adminService');
                await AdminService.updateUserBanStatus(user.uid, newBanStatus);

                const updatedUser = { ...user, banned: newBanStatus };
                setUsers(users.map(u => u.uid === user.uid ? updatedUser : u));
            } catch (error) {
                console.error("Error updating ban status:", error);
            }
        }
    };

    const handleCleanupGuests = async () => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 3);
        if (!confirm(`ลบผู้เยี่ยมชม (Guests) ที่ไม่ได้ใช้งานเกิน 3 วันหรือไม่?`)) return;

        setLoading(true);
        try {
            if (!db) return;
            const q = query(collection(db, "users"));
            const snapshot = await getDocs(q);
            let deleteCount = 0;
            const batchPromises: Promise<void>[] = [];

            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                if (!data.email) {
                    let createdSeconds = 0;
                    if (data.createdAt?.seconds) createdSeconds = data.createdAt.seconds;
                    else if (data.createdAt instanceof Date) createdSeconds = data.createdAt.getTime() / 1000;
                    else if (typeof data.createdAt === 'number') createdSeconds = data.createdAt > 10000000000 ? data.createdAt / 1000 : data.createdAt;

                    if (!createdSeconds || createdSeconds < cutoffDate.getTime() / 1000) {
                        if (db) batchPromises.push(deleteDoc(doc(db, "users", docSnap.id)));
                        deleteCount++;
                    }
                }
            });
            await Promise.all(batchPromises);
            alert(deleteCount > 0 ? `ลบ Guest ไปทั้งหมด ${deleteCount} รายการ` : "ไม่พบ Guest ที่เก่าเกินกำหนด");
            fetchUsers();
        } catch (error) {
            console.error("Cleanup failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchTerm.toLowerCase());
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
        banned: users.filter(u => u.banned).length
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

            {/* Page Header */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">จัดการผู้ใช้งาน (Users)</h1>
                    <p className="mt-1 text-muted-foreground">จัดการรายชื่อสมาชิก สิทธิ์การใช้งาน และสถานะ</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleCleanupGuests}
                        className="btn btn-outline border-border hover:border-destructive text-destructive hover:bg-destructive/10 gap-2 normal-case"
                    >
                        <Trash className="h-4 w-4" />
                        ล้าง Guest เก่า
                    </button>
                    <button className="btn bg-primary text-primary-foreground hover:bg-primary/90 gap-2 normal-case border-none">
                        <UserPlus className="h-4 w-4" />
                        เพิ่มผู้ใช้
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="mb-8 grid gap-4 sm:grid-cols-4">
                <div className="glass-card p-4 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                        <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                        <p className="text-sm text-muted-foreground">ผู้ใช้ทั้งหมด</p>
                    </div>
                </div>
                <div className="glass-card p-4 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/20">
                        <Crown className="h-6 w-6 text-success" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-foreground">
                            {stats.premium}
                        </p>
                        <p className="text-sm text-muted-foreground">พรีเมียม</p>
                    </div>
                </div>
                <div className="glass-card p-4 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/20">
                        <Shield className="h-6 w-6 text-warning" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-foreground">
                            {stats.admins}
                        </p>
                        <p className="text-sm text-muted-foreground">ผู้ดูแล</p>
                    </div>
                </div>
                <div className="glass-card p-4 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/20">
                        <Ban className="h-6 w-6 text-destructive" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-foreground">
                            {stats.banned}
                        </p>
                        <p className="text-sm text-muted-foreground">ถูกระงับ</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="search"
                        placeholder="ค้นหาชื่อ หรืออีเมล..."
                        className="input input-sm w-full pl-9 bg-muted/30 border-border/50 focus:border-primary rounded-md"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            className="toggle toggle-primary toggle-sm"
                            checked={showGuests}
                            onChange={e => setShowGuests(e.target.checked)}
                        />
                        <span className="text-sm text-muted-foreground">แสดง Guest</span>
                    </div>
                    <select className="select select-sm select-bordered w-32 bg-muted/30 border-border/50 rounded-lg text-foreground">
                        <option>ทุกบทบาท</option>
                        <option>Admin</option>
                        <option>User</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className="glass-card overflow-hidden">
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
                                            <div className="dropdown dropdown-end">
                                                <label tabIndex={0} className="btn btn-ghost btn-xs text-muted-foreground hover:text-foreground">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </label>
                                                <ul tabIndex={0} className="dropdown-content menu p-2 shadow-lg bg-card rounded-xl w-56 z-50 border border-border/50">
                                                    <li>
                                                        <a onClick={() => setSelectedUser(user)} className="gap-2">
                                                            <Edit2 className="h-4 w-4" /> แก้ไขสมาชิก
                                                        </a>
                                                    </li>
                                                    <li>
                                                        <a onClick={() => { setNotificationUser(user); setNotificationDialogOpen(true); }} className="gap-2">
                                                            <Bell className="h-4 w-4" /> ส่งข้อความ
                                                        </a>
                                                    </li>
                                                    <div className="divider my-1"></div>
                                                    <li>
                                                        <a onClick={() => handleBanToggle(user)} className={cn("gap-2", user.banned ? "text-success" : "text-destructive")}>
                                                            <Ban className="h-4 w-4" /> {user.banned ? "ยกเลิกการแบน" : "ระงับการใช้งาน"}
                                                        </a>
                                                    </li>
                                                </ul>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {/* Pagination - Added as static for now since logic wasn't fully there but UI was in mockup */}
                <div className="flex items-center justify-between border-t border-border/30 px-6 py-4">
                    <p className="text-sm text-muted-foreground">
                        แสดง {filteredUsers.length} รายการ
                    </p>
                    <div className="flex items-center gap-2">
                        <button className="btn btn-outline btn-xs border-border/50" disabled>Previous</button>
                        <button className="btn btn-xs bg-primary text-primary-foreground border-none">1</button>
                        <button className="btn btn-outline btn-xs border-border/50">Next</button>
                    </div>
                </div>
            </div>

            {/* Edit Membership Modal - Refactored for Clean UI */}
            {selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setSelectedUser(null)}
                    />

                    {/* Modal Content */}
                    <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-card shadow-2xl transition-all max-h-[85vh] flex flex-col">

                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4 shrink-0">
                            <div>
                                <h3 className="text-lg font-bold text-foreground">แก้ไขสมาชิก</h3>
                                <p className="text-xs text-muted-foreground">ปรับเปลี่ยนสถานะสำหรับสมาชิก</p>
                            </div>
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Scrollable Body */}
                        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            <style jsx>{`
                                .scrollbar-hide::-webkit-scrollbar {
                                    display: none;
                                }
                             `}</style>

                            {/* User Profile Card */}
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/40 border border-border/50 mb-6">
                                <div className="avatar placeholder">
                                    <div className="bg-primary text-primary-foreground rounded-full w-14 h-14 text-xl">
                                        <span>{selectedUser.displayName?.charAt(0) || 'U'}</span>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-foreground">
                                        {selectedUser.displayName}
                                        {selectedUser.role === 'admin' && <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Admin</span>}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                                    <p className="text-xs text-muted-foreground mt-1 opacity-70 font-mono select-all">UID: {selectedUser.uid}</p>
                                </div>
                            </div>

                            {/* Role Management */}
                            <div className="mb-6">
                                <label className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                                    <Shield className="w-4 h-4 text-primary" /> บทบาท (Role)
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => updateUserRole(selectedUser.uid, 'user')}
                                        className={cn(
                                            "btn btn-sm border-none shadow-sm",
                                            selectedUser.role !== 'admin'
                                                ? "bg-muted text-foreground ring-2 ring-primary/20"
                                                : "bg-background text-muted-foreground border border-border"
                                        )}
                                    >
                                        USER
                                    </button>
                                    <button
                                        onClick={() => updateUserRole(selectedUser.uid, 'admin')}
                                        className={cn(
                                            "btn btn-sm border-none shadow-sm",
                                            selectedUser.role === 'admin'
                                                ? "bg-red-600 text-white hover:bg-red-700"
                                                : "bg-background text-muted-foreground border border-border"
                                        )}
                                    >
                                        <Shield className="w-3 h-3 mr-1" /> ADMIN
                                    </button>
                                </div>
                            </div>

                            {/* Modules Management */}
                            <div className="mb-6">
                                <label className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                                    <Package className="w-4 h-4 text-primary" /> Installed Modules
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {AVAILABLE_MODULES.map((module) => {
                                        const isInstalled = selectedUser.installed_modules?.includes(module.id);
                                        return (
                                            <div
                                                key={module.id}
                                                onClick={() => handleToggleModule(module.id)}
                                                className={cn(
                                                    "cursor-pointer border rounded-lg p-3 flex items-center gap-3 transition-colors",
                                                    isInstalled
                                                        ? "bg-primary/10 border-primary"
                                                        : "bg-background border-border hover:bg-muted"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-8 h-8 rounded-full flex items-center justify-center",
                                                    isInstalled ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                                )}>
                                                    <module.icon className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-sm font-medium">{module.name}</div>
                                                    <div className="text-xs text-muted-foreground">{isInstalled ? 'Installed' : 'Not Installed'}</div>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    className="toggle toggle-primary toggle-sm"
                                                    checked={isInstalled || false}
                                                    readOnly
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <hr className="border-border/50 mb-6" />

                            {/* Package Selection */}
                            <div className="space-y-4">
                                <label className="text-sm font-semibold text-foreground flex items-center gap-2 text-warning">
                                    <Crown className="w-4 h-4" /> เลือกแพ็กเกจ
                                </label>

                                <button
                                    onClick={() => handleAssignPackage('lifetime')}
                                    disabled={assigningLoading}
                                    className={cn(
                                        "btn w-full gap-2 h-auto py-3 relative overflow-hidden group",
                                        selectedUser.membership?.packageId === 'lifetime'
                                            ? "btn-error ring-2 ring-offset-2 ring-red-500"
                                            : "btn-outline btn-error"
                                    )}
                                >
                                    <div className="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/10 transition-colors" />
                                    <Crown className="w-5 h-5" />
                                    <span>มอบสิทธิ์ LIFETIME (ตลอดชีพ)</span>
                                    {selectedUser.membership?.packageId === 'lifetime' && (
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-white/20 px-2 py-0.5 rounded-full">Selected</span>
                                    )}
                                </button>

                                <div className="text-xs text-muted-foreground mt-4 mb-2">แพ็กเกจมาตรฐาน</div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {packages.map((pkg) => {
                                        const isSelected = selectedUser.membership?.packageId === pkg.id;
                                        return (
                                            <div
                                                key={pkg.id}
                                                onClick={() => handleAssignPackage(pkg.id)}
                                                className={cn(
                                                    "cursor-pointer border rounded-xl p-3 transition-all active:scale-[0.98] relative",
                                                    isSelected
                                                        ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary"
                                                        : "border-border hover:border-primary hover:bg-primary/5"
                                                )}
                                            >
                                                {isSelected && (
                                                    <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary animate-pulse" />
                                                )}
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className={cn("font-semibold", isSelected ? "text-primary" : "text-foreground")}>
                                                        {pkg.name}
                                                    </span>
                                                    <div className={cn("badge badge-sm", isSelected ? "badge-primary" : "badge-ghost")}>
                                                        {pkg.durationDays} วัน
                                                    </div>
                                                </div>
                                                <div className="text-sm text-muted-foreground line-clamp-1">{pkg.id}</div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {packages.length === 0 && (
                                    <div className="text-center py-8 border-2 border-dashed border-border rounded-xl bg-muted/20">
                                        <p className="text-sm text-muted-foreground">ไม่พบแพ็กเกจมาตรฐาน</p>
                                        <a href="/admin/packages" className="btn btn-xs btn-ghost mt-2">
                                            <Package className="w-3 h-3 mr-1" /> ไปสร้างแพ็กเกจ
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end border-t border-border bg-muted/30 px-6 py-4 shrink-0">
                            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedUser(null)}>ปิดหน้าต่าง</button>
                        </div>
                    </div>
                </div>
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

        </AdminLayout>
    );
}
