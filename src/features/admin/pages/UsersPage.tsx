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
import { db } from '../../../../firebase';
import { cn } from '../../../utils/cn';

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
      alert("✅ Package assigned successfully!");
      setSelectedUser(null);
      fetchUsers(); // Refresh
    } catch (error: any) {
      alert("Error: " + error.message);
    }
  };

  const handleUpdateRole = async (uid: string, newRole: 'admin' | 'user') => {
    if (!confirm(`Confirm role change to ${newRole}?`)) return;
    try {
      if (!db) return;
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, { role: newRole });
      alert("✅ Role updated!");
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      alert("Error: " + error.message);
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
      alert("Error: " + error.message);
    }
  };

  const handleBanToggle = async (user: any) => {
    const newBanStatus = !user.banned;
    if (confirm(`${newBanStatus ? 'Ban' : 'Unban'} user ${user.displayName}?`)) {
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
    const type = user.membership?.type || 'free';
    if (type === 'lifetime') return 'bg-purple-100 text-purple-700 border-purple-200';
    if (type === 'monthly' || type === 'yearly') return 'bg-green-100 text-green-700 border-green-200';
    return 'bg-gray-100 text-gray-600 border-gray-200';
  };

  return (
    <AdminLayout>
      <Head>
        <title>User Management - Admin</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-sm text-gray-500">Manage users, roles and memberships</p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-sm bg-primary text-white border-none gap-2">
              <UserPlusIcon className="w-4 h-4" /> Add User
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              className="input input-sm w-full pl-9 bg-gray-50 border-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="label cursor-pointer gap-2">
              <span className="label-text text-xs">Show Guests</span>
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
                  <th className="font-semibold">User</th>
                  <th className="font-semibold">Role</th>
                  <th className="font-semibold">Membership</th>
                  <th className="font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="text-center py-8">Loading users...</td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-8">No users found.</td></tr>
                ) : (
                  filteredUsers.map((user: any) => (
                    <tr key={user.uid} className="hover:bg-gray-50 transition-colors group">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="avatar placeholder">
                            <div className="bg-gray-100 text-gray-600 rounded-full w-10 h-10 border border-gray-200">
                              <span>{user.displayName?.charAt(0) || 'U'}</span>
                            </div>
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 flex items-center gap-2">
                              {user.displayName || 'Guest User'}
                              {user.banned && <span className="badge badge-error badge-xs">BANNED</span>}
                            </div>
                            <div className="text-xs text-gray-500">{user.email || 'No Email'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className={cn("badge badge-sm border-0 gap-1", user.role === 'admin' ? "bg-red-100 text-red-700" : "bg-blue-50 text-blue-700")}>
                          {user.role === 'admin' && <ShieldCheckIcon className="w-3 h-3" />}
                          {user.role || 'user'}
                        </div>
                      </td>
                      <td>
                        <div className={cn("badge badge-sm border", getMembershipStyle(user))}>
                          {user.membership?.type || 'free'}
                        </div>
                        {user.membership?.expiresAt && (
                          <div className="text-[10px] text-gray-400 mt-1">
                            Exp: {new Date(user.membership.expiresAt).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setSelectedUser(user)} className="btn btn-ghost btn-xs btn-square" title="Edit">
                            <PencilSquareIcon className="w-4 h-4 text-blue-500" />
                          </button>
                          <button onClick={() => handleBanToggle(user)} className="btn btn-ghost btn-xs btn-square" title={user.banned ? "Unban" : "Ban"}>
                            {user.banned ? <CheckCircleIcon className="w-4 h-4 text-green-500" /> : <NoSymbolIcon className="w-4 h-4 text-red-500" />}
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
