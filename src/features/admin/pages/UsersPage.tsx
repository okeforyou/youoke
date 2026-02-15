import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import {
  UsersIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  UserPlusIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  NoSymbolIcon,
  EllipsisHorizontalIcon,
  BellIcon,
  PencilSquareIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';
import AdminLayout from '../layouts/AdminLayout';
import { AdminService } from '../services/adminService';
import { EditUserModal } from '../components/EditUserModal';
import { collection, query, orderBy, getDocs, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { cn } from '../../../utils/cn';
import { DatabaseHealth } from '../components/DatabaseHealth';

// Mock Modules Config (since we don't have the file physically yet or it's in config)
const AVAILABLE_MODULES = [
  { id: 'midi_lab', name: 'Midi Lab', icon: Squares2X2Icon },
  { id: 'cast_sender', name: 'Cast Sender', icon: Squares2X2Icon },
];

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showGuests, setShowGuests] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [packages, setPackages] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  // Hybrid Fetch: Users from RTDB, Packages from Firestore
  const fetchUsers = async () => {
    setLoading(true);
    try {
      // 1. Fetch Users from Firestore
      if (!db) return;
      const usersQuery = query(collection(db, "users"));
      const snapshot = await getDocs(usersQuery);

      if (!snapshot.empty) {
        const usersList: any[] = [];
        snapshot.forEach(doc => {
          usersList.push({ uid: doc.id, ...doc.data() });
        });

        // Sort: Admin first, then newest
        usersList.sort((a, b) => {
          if (a.role === 'admin' && b.role !== 'admin') return -1;
          if (a.role !== 'admin' && b.role === 'admin') return 1;
          // createdAt might be Firestore Timestamp or Date or string
          const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
          const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
          return timeB - timeA;
        });
        setUsers(usersList);
      } else {
        setUsers([]);
      }

      // 2. Fetch Packages (Firestore)
      if (db) {
        const q = query(collection(db, "packages"), orderBy("price", "asc"));
        const pkgSnap = await getDocs(q);
        const pkgList: any[] = [];
        pkgSnap.forEach(doc => pkgList.push({ id: doc.id, ...doc.data() }));
        // Default packages if empty
        if (pkgList.length === 0) {
          setPackages([
            { id: 'monthly', name: 'Monthly Plan', durationDays: 30 },
            { id: 'yearly', name: 'Yearly Plan', durationDays: 365 },
            { id: 'day_pass', name: 'Day Pass', durationDays: 1 },
          ]);
        } else {
          setPackages(pkgList);
        }
      }

    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignPackage = async (pkgId: string) => {
    if (!selectedUser) return;
    try {
      await AdminService.assignPackage(selectedUser.uid, pkgId, 'admin');
      alert("✅ เพิ่มแพ็กเกจเรียบร้อย!");
      setSelectedUser(null);
      fetchUsers(); // Refresh
    } catch (error: any) {
      alert("เกิดข้อผิดพลาด: " + error.message);
    }
  };

  const handleUpdateRole = async (uid: string, newRole: 'admin' | 'user') => {
    if (!confirm(`ยืนยันการเปลี่ยนสิทธิ์เป็น ${newRole}?`)) return;
    try {
      if (!db) return;
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, { role: newRole });
      alert("✅ อัพเดทสิทธิ์เรียบร้อย!");
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      alert("เกิดข้อผิดพลาด: " + error.message);
    }
  };

  const handleToggleModule = async (moduleId: string) => {
    if (!selectedUser) return;
    const currentModules = selectedUser.installed_modules || [];
    const hasModule = currentModules.includes(moduleId);
    const newModules = hasModule
      ? currentModules.filter((id: string) => id !== moduleId)
      : [...currentModules, moduleId];

    try {
      if (!db) return;
      const userRef = doc(db, "users", selectedUser.uid);
      await updateDoc(userRef, { installed_modules: newModules });
      // Optimistic update for modal
      setSelectedUser({ ...selectedUser, installed_modules: newModules });
      const updatedUsers = users.map(u => u.uid === selectedUser.uid ? { ...u, installed_modules: newModules } : u);
      setUsers(updatedUsers);
    } catch (error: any) {
      alert("เกิดข้อผิดพลาด: " + error.message);
    }
  };

  const handleBanToggle = async (user: any) => {
    const newBanStatus = !user.banned;
    if (confirm(`ยืนยันการ ${newBanStatus ? 'ระงับ' : 'ปลดระงับ'} ผู้ใช้ ${user.displayName}?`)) {
      await AdminService.updateUserBanStatus(user.uid, newBanStatus);
      fetchUsers();
    }
  };

  // Filter Logic
  const filteredUsers = users.filter((u: any) => {
    const matchesSearch = (u.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const isGuest = !u.email;
    if (!showGuests && isGuest) return false;
    return matchesSearch;
  });

  const getMembershipStyle = (user: any) => {
    const status = user.membership?.status || 'active';
    const type = user.membership?.type || 'free';

    if (status === 'pending') return 'bg-orange-50 text-orange-600 border-orange-200';
    if (status === 'expired') return 'bg-red-50 text-red-600 border-red-200';
    if (type === 'lifetime') return 'bg-purple-100 text-purple-700 border-purple-200';
    if (type === 'monthly' || type === 'yearly') return 'bg-green-100 text-green-700 border-green-200';
    return 'bg-gray-100 text-gray-600 border-gray-200';
  };

  return (
    <AdminLayout>
      <Head>
        <title>จัดการผู้ใช้ - Admin</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">จัดการผู้ใช้ (User Management)</h1>
            <p className="text-sm text-gray-500">จัดการสมาชิก บทบาท และสถานะการใช้งาน</p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-sm bg-primary text-white border-none gap-2 hover:bg-primary/90">
              <UserPlusIcon className="w-4 h-4" /> เพิ่มผู้ใช้ใหม่
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ หรือ อีเมล..."
              className="input input-sm w-full pl-9 bg-gray-50 border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="label cursor-pointer gap-2">
              <span className="label-text text-xs text-gray-600">แสดงผู้เยี่ยมชม (Guests)</span>
              <input type="checkbox" className="toggle toggle-primary toggle-sm" checked={showGuests} onChange={(e) => setShowGuests(e.target.checked)} />
            </label>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="font-semibold py-3 pl-6">ผู้ใช้งาน</th>
                  <th className="font-semibold">บทบาท</th>
                  <th className="font-semibold">สถานะสมาชิก</th>
                  <th className="font-semibold text-right pr-6">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="text-center py-12 text-gray-400">กำลังโหลดข้อมูล...</td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-12 text-gray-400">ไม่พบข้อมูลผู้ใช้</td></tr>
                ) : (
                  filteredUsers.map((user: any) => (
                    <tr key={user.uid} className="hover:bg-gray-50 transition-colors group border-b last:border-none border-gray-100">
                      <td className="pl-6">
                        <div className="flex items-center gap-3">
                          <div className="avatar placeholder">
                            <div className="bg-primary/10 text-primary rounded-full w-10 h-10 border border-primary/10 flex items-center justify-center">
                              <span className="text-sm font-bold">{user.displayName?.charAt(0).toUpperCase() || 'U'}</span>
                            </div>
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 flex items-center gap-2">
                              {user.displayName || 'ผู้เยี่ยมชม (Guest)'}
                              {user.banned && <span className="badge badge-error badge-xs font-medium text-white">ถูกระงับ</span>}
                            </div>
                            <div className="text-xs text-gray-500 font-mono">{user.email || 'ไม่มีอีเมล'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className={cn("badge badge-sm border-0 gap-1 font-medium", user.role === 'admin' ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600")}>
                          {user.role === 'admin' && <ShieldCheckIcon className="w-3 h-3" />}
                          {user.role === 'admin' ? 'ผู้ดูแลระบบ' : 'สมาชิกทั่วไป'}
                        </div>
                      </td>
                      <td>
                        <div className={cn("badge badge-sm border font-medium", getMembershipStyle(user))}>
                          {user.membership?.status === 'pending' ? 'รอการอนุมัติ' :
                            user.membership?.status === 'expired' ? 'หมดอายุ' :
                              user.membership?.type === 'monthly' ? 'รายเดือน' :
                                user.membership?.type === 'yearly' ? 'รายปี' :
                                  user.membership?.type === 'lifetime' ? 'ตลอดชีพ' : 'ฟรี'}
                        </div>
                        {user.membership?.expiresAt && (
                          <div className="text-[10px] text-gray-400 mt-1">
                            หมดอายุ: {new Date(user.membership.expiresAt).toLocaleDateString('th-TH')}
                          </div>
                        )}
                      </td>
                      <td className="text-right pr-6">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {user.membership?.status === 'pending' && (
                            <div className="flex gap-1">
                              <button onClick={() => AdminService.approveUserWithTier(user.uid, 'monthly', 'admin').then(fetchUsers)} className="btn btn-xs btn-outline btn-success" title="อนุมัติรายเดือน">Approve Mo</button>
                              <button onClick={() => AdminService.approveUserWithTier(user.uid, 'yearly', 'admin').then(fetchUsers)} className="btn btn-xs btn-outline btn-success" title="อนุมัติรายปี">Approve Yr</button>
                            </div>
                          )}
                          <button onClick={() => setSelectedUser(user)} className="btn btn-ghost btn-xs btn-square hover:bg-blue-50 hover:text-blue-600" title="แก้ไข">
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleBanToggle(user)} className="btn btn-ghost btn-xs btn-square hover:bg-red-50 hover:text-red-600" title={user.banned ? "ปลดระงับ" : "ระงับการใช้งาน"}>
                            {user.banned ? <CheckCircleIcon className="w-4 h-4 text-green-500" /> : <NoSymbolIcon className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="mt-8 mb-8">
        <DatabaseHealth />
      </div>

      {selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdateRole={handleUpdateRole}
          onAssignPackage={handleAssignPackage}
          onToggleModule={handleToggleModule}
          availableModules={AVAILABLE_MODULES}
          packages={packages}
        />
      )}
    </AdminLayout>
  );
}
