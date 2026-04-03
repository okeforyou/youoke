import Head from "next/head";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from '@/features/admin/layouts/AdminLayout';
import {
    Users,
    Edit2,
    Mail,
    Filter,
    Crown,
    Activity,
    Users2,
    Search,
    RefreshCw,
    UserPlus,
    BellRing
} from "lucide-react";
import { StatCard } from "@/features/admin/components/StatCard";
import { EditUserModal } from "@/features/admin/components/EditUserModal";
import { collection, query, getDocs, orderBy, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase";
import { useAuthStore } from "@/modules/auth/useAuthStore";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";
import axios from "axios";

// LINE Icon Component
const LineIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M24 10.304c0-4.36-4.608-7.904-10.276-7.904C8.057 2.4 3.448 5.944 3.448 10.304c0 3.907 3.656 7.18 8.6 7.82.335.072.788.22.904.502.103.253.067.65.033.91l-.143.864s-.044.258.188.112c.231-.143 1.25-.79 1.75-1.127.42-.284.884-.881 1.295-1.536C19.824 16.29 24 13.564 24 10.304zm-14.73 2.115c0 .114-.092.207-.207.207h-1.63a.207.207 0 0 1-.207-.207V8.583c0-.114.092-.207.207-.207h1.63c.115 0 .207.093.207.207v3.836zm.012-4.148c0 .114-.093.207-.207.207H7.447a.207.207 0 0 1-.207-.207V8.125c0-.114.093-.207.207-.207h1.628c.115 0 .207.093.207.207v.296zm4.568 4.148c0 .114-.093.207-.207.207h-1.89c-.114 0-.207-.093-.207-.207v-3.836c0-.114.093-.207.207-.207h.334c.114 0 .207.093.207.207v3.295h1.349c.114 0 .207.093.207.207v.334zm2.148 0c0 .114-.092.207-.207.207h-1.63a.207.207 0 0 1-.207-.207V8.583c0-.114.092-.207.207-.207h1.63c.115 0 .207.093.207.207v3.836zm.012-4.148c0 .114-.093.207-.207.207h-1.628a.207.207 0 0 1-.207-.207V8.125c0-.114.093-.207.207-.207h1.628c.115 0 .207.093.207.207v.296zm4.331 4.148c0 .114-.093.207-.207.207h-1.89c-.114 0-.207-.093-.207-.207v-3.836c0-.114.093-.207.207-.207h.334c.114 0 .207.093.207.207v3.295h1.349c.114 0 .207.093.207.207v.334zm0-1.464c0 .114-.093.207-.207.207h-1.349a.207.207 0 0 1-.207-.207v-.334c0-.115.093-.208.207-.208h1.349c.114 0 .207.093.207.208v.334zm0-1.463c0 .114-.093.207-.207.207h-1.349a.207.207 0 0 1-.207-.207v-.334c0-.115.093-.207.207-.207h1.349c.114 0 .207.093.207.207v.334z" />
    </svg>
);

interface PackageOption {
    id: string;
    name: string;
    price: number;
    durationDays: number;
}

interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    role: "admin" | "user" | "owner";
    lineUserId?: string;
    membership?: {
        type: "free" | "day_pass" | "monthly" | "yearly" | "lifetime";
        status: "active" | "expired" | "pending";
        expiresAt?: any;
    };
    banned?: boolean;
    createdAt?: any;
}

export default function AdminUsersPage() {
    const { user: currentUser } = useAuthStore();
    const router = useRouter();
    const toastContext = useToast();
    const addToast = toastContext?.addToast;
    
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showGuests, setShowGuests] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [packages, setPackages] = useState<PackageOption[]>([]);
    const [roleFilter, setRoleFilter] = useState('all');
    const [packageFilter, setPackageFilter] = useState('all');

    // 🛡️ v4.9.13 SAFETY HYDRATION
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    // ⏳ FETCH USERS
    const fetchUsers = async () => {
        setLoading(true);
        try {
            if (!db) return;
            const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map((doc) => ({
                uid: doc.id,
                ...doc.data(),
            })) as User[];
            setUsers(data);
        } catch (error) {
            console.error("Error fetching users:", error);
            if (addToast) addToast("❌ ไม่สามารถดึงข้อมูลสมาชิกได้", "error");
        } finally {
            setLoading(false);
        }
    };

    // 📦 FETCH PACKAGES
    const fetchPackages = async () => {
        try {
            if (!db) return;
            const q = query(collection(db, "packages"), orderBy("price", "asc"));
            const snapshot = await getDocs(q);
            const pkgList: PackageOption[] = snapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name,
                price: doc.data().price,
                durationDays: doc.data().durationDays
            }));
            setPackages(pkgList);
        } catch (error) {
            console.error("Error fetching packages:", error);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchPackages();
    }, []);

    // 🚀 v4.9.13: MAGIC ROUTING LOGIC
    useEffect(() => {
        const { uid } = router.query;
        if (uid && users.length > 0) {
            const targetUser = users.find(u => u.uid === uid);
            if (targetUser) {
                console.log(`🚀 [Admin] Magic Link Triggered: Selecting User ${uid}`);
                setSelectedUser(targetUser);
            }
        }
    }, [router.query, users]);

    // 🛡️ HELPER FUNCTIONS
    const getMembershipType = (user: User) => {
        const membership = user.membership;
        if (!membership) return 'free';
        if (membership.type !== 'lifetime' && membership.expiresAt) {
            const expiry = membership.expiresAt.toDate ? membership.expiresAt.toDate() : new Date(membership.expiresAt);
            if (new Date() > expiry) return 'free';
        }
        return membership.type || 'free';
    };

    const getStatus = (user: User) => {
        if (user.banned) return 'banned';
        if (!user.email) return 'guest';
        return 'active';
    };

    const formatDate = (date: any) => {
        if (!mounted || !date) return "-";
        try {
            if (date.seconds) return new Date(date.seconds * 1000).toLocaleDateString('th-TH');
            return new Date(date).toLocaleDateString('th-TH');
        } catch (e) {
            return "-";
        }
    };

    const handleUpdateRole = async (uid: string, newRole: 'admin' | 'user') => {
        if (!db) return;
        try {
            await updateDoc(doc(db, "users", uid), { role: newRole, updatedAt: serverTimestamp() });
            setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole } : u));
            if (addToast) addToast("🚀 อัปเดตบทบาทสำเร็จ", "success");
        } catch (e) {
            if (addToast) addToast("❌ ไม่สามารถอัปเดตได้", "error");
        }
    };

    const handleAssignPackage = async (pkgId: string) => {
        if (!selectedUser || !db) return;
        const pkg = packages.find(p => p.id === pkgId);
        if (!pkg && pkgId !== 'lifetime') return;

        try {
            const duration = pkgId === 'lifetime' ? 9999 : pkg!.durationDays;
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + duration);

            const mData = {
                type: pkgId === 'lifetime' ? "lifetime" : (duration >= 365 ? "yearly" : (duration >= 30 ? "monthly" : "day_pass")),
                status: "active",
                startedAt: serverTimestamp(),
                expiresAt: expiresAt
            };

            await updateDoc(doc(db, "users", selectedUser.uid), {
                membership: mData,
                updatedAt: serverTimestamp()
            });

            await fetchUsers();
            if (addToast) addToast("✨ มอบสิทธิ์สมาชิกสำเร็จ", "success");
            setSelectedUser(null);
        } catch (e) {
            if (addToast) addToast("❌ ไม่สามารถมอบสิทธิ์ได้", "error");
        }
    };

    const filteredUsers = users.filter((u) => {
        const matchesSearch = 
            (u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.uid.toLowerCase().includes(searchTerm.toLowerCase()));
        
        if (!showGuests && !u.email) return false;
        if (roleFilter !== 'all' && u.role !== roleFilter) return false;
        if (packageFilter !== 'all' && getMembershipType(u) !== packageFilter) return false;

        return matchesSearch;
    });

    if (!currentUser?.isAdmin) {
        return <div className="p-8 text-center bg-white dark:bg-zinc-900 rounded-2xl shadow-xl max-w-sm mx-auto mt-20 font-black">Admin Only</div>;
    }

    return (
        <AdminLayout>
            <div className="p-4 md:p-8 space-y-8 min-h-screen pb-20">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">จัดการสมาชิก</h1>
                        <p className="text-slate-500 text-sm font-bold">YouOKE v4.9.13 Intelligence Panel</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={fetchUsers} className="p-3 bg-white dark:bg-zinc-900 border rounded-2xl hover:bg-slate-50 transition-all active:scale-95 text-slate-500">
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <StatCard title="สมาชิกทั้งหมด" value={users.length} icon={Users} iconColor="primary" />
                    <StatCard title="Premium" value={users.filter(u => getMembershipType(u) !== 'free').length} icon={Crown} iconColor="warning" />
                    <StatCard title="Active" value={users.filter(u => getStatus(u) === 'active').length} icon={Activity} iconColor="success" />
                    <StatCard title="Guests" value={users.filter(u => !u.email).length} icon={Users2} iconColor="info" />
                </div>

                {/* Main Table Container */}
                <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-[2rem] p-4 md:p-6 shadow-xl shadow-slate-100/50">
                    <div className="flex flex-col lg:flex-row gap-4 items-center mb-6">
                        <div className="relative flex-1 group w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500" />
                            <input 
                                type="text" 
                                placeholder="ค้นหาชื่อ, อีเมล หรือ UID..." 
                                className="w-full pl-11 pr-6 py-3.5 bg-slate-50 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-4 py-3 bg-slate-50 dark:bg-zinc-800 rounded-2xl font-black text-xs outline-none">
                                <option value="all">ทุกบทบาท</option>
                                <option value="owner">Owner</option>
                                <option value="admin">Admin</option>
                                <option value="user">User</option>
                            </select>
                            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-zinc-800 px-4 py-3 rounded-2xl border transition-all">
                                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600" checked={showGuests} onChange={e => setShowGuests(e.target.checked)} />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">แสดงแขก</span>
                            </label>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-50 dark:border-zinc-800">
                                    <th className="px-4 py-4 text-left text-[10px] font-black uppercase text-slate-400">ผู้ใช้</th>
                                    <th className="px-4 py-4 text-left text-[10px] font-black uppercase text-slate-400">ระดับ</th>
                                    <th className="px-4 py-4 text-left text-[10px] font-black uppercase text-slate-400">สถานะ</th>
                                    <th className="px-4 py-4 text-left text-[10px] font-black uppercase text-slate-400">แพ็กเกจ</th>
                                    <th className="px-4 py-4 text-right text-[10px] font-black uppercase text-slate-400">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-zinc-800">
                                {filteredUsers.map((u) => (
                                    <tr key={u.uid} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-all">
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedUser(u)}>
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden border">
                                                    {u.photoURL ? <img src={u.photoURL} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-black text-slate-400">?</div>}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-sm text-slate-900 dark:text-white truncate max-w-[150px]">{u.displayName || 'Guest'}</span>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[9px] text-slate-400 font-bold truncate max-w-[100px]">{u.email || 'LINE/SESSION'}</span>
                                                        {u.lineUserId && <div className="flex items-center gap-0.5 px-1 bg-emerald-50 text-[#06C755] rounded text-[8px] font-black uppercase"><LineIcon className="w-2 h-2" /> Linked</div>}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={cn("px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider", u.role === 'admin' ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500")}>{u.role}</span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={cn("text-[10px] font-black uppercase", statusColors[getStatus(u)])}>{getStatus(u)}</span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase">{getMembershipType(u)}</span>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <button onClick={() => setSelectedUser(u)} className="p-2.5 bg-slate-100 dark:bg-zinc-800 text-slate-500 rounded-xl hover:text-indigo-600 transition-colors">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Edit Modal */}
                {selectedUser && (
                    <EditUserModal 
                        user={selectedUser as any} 
                        onClose={() => setSelectedUser(null)}
                        onUpdateRole={handleUpdateRole}
                        onAssignPackage={handleAssignPackage}
                        onToggleModule={() => {}}
                        availableModules={[]}
                        packages={packages}
                        onRefresh={fetchUsers}
                        loading={loading}
                    />
                )}
            </div>
        </AdminLayout>
    );
}

const statusColors: any = {
    active: 'text-emerald-500',
    banned: 'text-rose-500',
    guest: 'text-slate-400'
};
