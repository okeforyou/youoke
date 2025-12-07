import { doc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { GetServerSideProps } from "next";
import React, { useEffect, useState } from "react";
import { FiSearch, FiEdit2, FiCheck, FiX, FiDownload, FiTrash2, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import nookies from "nookies";

import Icon from "../../components/Icon";

import AdminLayout from "../../components/admin/AdminLayout";
import { db } from "../../firebase";
import { adminAuth, adminDb } from "../../firebase-admin";
import { exportToCSV, flattenForCSV } from "../../utils/exportCSV";

interface User {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  tier: string;
  isPremium: boolean;
  isActive: boolean;
  isLegacy: boolean;
  createdAt: any;
  subscriptionExpiry?: any;
}

// Serialized version for SSR
interface SerializedUser {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  tier?: string;
  isPremium?: boolean;
  isActive?: boolean;
  isLegacy?: boolean;
  createdAt: string | null;
  subscriptionExpiry?: string | null;
}

interface Props {
  users: SerializedUser[];
  totalUsers: number;
  error?: string;
}

const USERS_PER_PAGE = 20;

const UsersPage: React.FC<Props> = ({ users: initialUsers, totalUsers: initialTotal, error }) => {
  // Convert serialized users back to User objects
  const convertedUsers: User[] = initialUsers.map(u => ({
    ...u,
    tier: u.tier || 'free',
    isPremium: u.isPremium || false,
    isActive: u.isActive !== false, // default true
    isLegacy: u.isLegacy || false,
    createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
    subscriptionExpiry: u.subscriptionExpiry ? new Date(u.subscriptionExpiry) : undefined,
  }));

  const [allUsers] = useState<User[]>(convertedUsers);
  const [filteredUsers, setFilteredUsers] = useState<User[]>(convertedUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterTier, setFilterTier] = useState("all");
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Client-side pagination
  const [currentPage, setCurrentPage] = useState(1);
  const totalUsers = initialTotal;

  useEffect(() => {
    filterUsers();
  }, [searchTerm, filterRole, filterTier, allUsers]);

  const filterUsers = () => {
    let filtered = [...allUsers];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (u) =>
          u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (filterRole !== "all") {
      filtered = filtered.filter((u) => u.role === filterRole);
    }

    // Tier filter
    if (filterTier !== "all") {
      filtered = filtered.filter((u) => u.tier === filterTier);
    }

    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to page 1 when filtering
  };

  // Client-side pagination
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * USERS_PER_PAGE,
    currentPage * USERS_PER_PAGE
  );

  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser({ ...user });
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      // Note: User data is in Realtime Database, not Firestore
      // This will need to use adminDb instead
      alert("ฟังก์ชันนี้ต้องแก้ไขให้ใช้ Realtime Database API endpoint");
      setEditingUser(null);

      // TODO: Create API route to update user in Realtime Database
      // For now, just close the modal
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Error updating user");
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (user.role === "admin") {
      alert("ไม่สามารถลบ Admin ได้");
      return;
    }

    if (!confirm(`ยืนยันการลบผู้ใช้ "${user.displayName || user.email}"?\n\nการดำเนินการนี้ไม่สามารถยกเลิกได้`)) {
      return;
    }

    try {
      // Note: User data is in Realtime Database, not Firestore
      alert("ฟังก์ชันนี้ต้องแก้ไขให้ใช้ Realtime Database API endpoint");

      // TODO: Create API route to delete user in Realtime Database
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("เกิดข้อผิดพลาดในการลบผู้ใช้");
    }
  };

  const handleExportCSV = () => {
    // Use filtered users for export
    const dataToExport = filteredUsers.map((user) => flattenForCSV(user));
    exportToCSV(dataToExport, "users");
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-xl text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary"
            >
              Reload
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">
              จัดการผู้ใช้ทั้งหมด ({filteredUsers.length} users แสดง, หน้า {currentPage} / {totalPages})
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <Icon icon={FiDownload} />
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Icon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            {/* Role Filter */}
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>

            {/* Tier Filter */}
            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">All Tiers</option>
              <option value="free">Free</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="lifetime">Lifetime</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedUsers.map((user) => (
                  <tr key={user.uid} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.displayName || "No name"}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.tier === "lifetime"
                            ? "bg-yellow-100 text-yellow-800"
                            : user.tier === "yearly"
                            ? "bg-green-100 text-green-800"
                            : user.tier === "monthly"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {user.tier}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {user.isPremium && (
                          <span className="text-xs text-green-600 font-medium">
                            Premium
                          </span>
                        )}
                        {user.isActive ? (
                          <Icon icon={FiCheck} className="text-green-500" />
                        ) : (
                          <Icon icon={FiX} className="text-red-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit user"
                        >
                          <Icon icon={FiEdit2} size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete user"
                          disabled={user.role === "admin"}
                        >
                          <Icon icon={FiTrash2} size={18} className={user.role === "admin" ? "opacity-30" : ""} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <div className="text-sm text-gray-700">
              แสดง <span className="font-medium">{(currentPage - 1) * USERS_PER_PAGE + 1}</span> ถึง{" "}
              <span className="font-medium">{Math.min(currentPage * USERS_PER_PAGE, filteredUsers.length)}</span> จาก{" "}
              <span className="font-medium">{filteredUsers.length}</span> users (ทั้งหมด {totalUsers} users)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={goToPreviousPage}
                disabled={currentPage <= 1}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Icon icon={FiChevronLeft} />
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-700">
                หน้า {currentPage} / {totalPages}
              </span>
              <button
                onClick={goToNextPage}
                disabled={currentPage >= totalPages}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Next
                <Icon icon={FiChevronRight} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Edit User</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="text"
                  value={editingUser.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={editingUser.role}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, role: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tier
                </label>
                <select
                  value={editingUser.tier}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, tier: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="free">Free</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="lifetime">Lifetime</option>
                </select>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingUser.isPremium}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        isPremium: e.target.checked,
                      })
                    }
                    className="rounded border-gray-300 text-red-500 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">Premium</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingUser.isActive}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        isActive: e.target.checked,
                      })
                    }
                    className="rounded border-gray-300 text-red-500 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveUser}
                className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  console.log('🚀 [SSR] admin/users getServerSideProps started');

  try {
    // 1. Check authentication
    const cookies = nookies.get(context);
    const token = cookies.token;

    if (!token) {
      console.log('❌ [SSR] No token found -> redirect to login');
      return {
        redirect: {
          destination: "/login",
          permanent: false,
        },
      };
    }

    if (!adminDb || !adminAuth) {
      console.error('❌ [SSR] Firebase Admin not initialized!');
      return {
        props: {
          users: [],
          totalUsers: 0,
          error: "Firebase Admin not initialized",
        },
      };
    }

    // 2. Verify token and check if user is admin
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
      console.log(`✅ [SSR] Token verified! UID: ${decodedToken.uid}`);
    } catch (verifyError: any) {
      console.error('❌ [SSR] Token verification failed:', verifyError.message);
      return {
        redirect: {
          destination: "/login",
          permanent: false,
        },
      };
    }

    // 3. Check if user is admin
    const userRef = adminDb.ref(`users/${decodedToken.uid}`);
    const userSnapshot = await userRef.once('value');

    if (!userSnapshot.exists()) {
      console.log('❌ [SSR] User profile not found');
      return {
        redirect: {
          destination: "/login",
          permanent: false,
        },
      };
    }

    const userData = userSnapshot.val();
    if (userData.role !== 'admin') {
      console.log('❌ [SSR] User is not admin');
      return {
        redirect: {
          destination: "/",
          permanent: false,
        },
      };
    }

    console.log('✅ [SSR] User is admin, fetching all users...');

    // 4. Fetch all users from Realtime Database
    const usersRef = adminDb.ref('users');
    const snapshot = await usersRef.once('value');

    if (!snapshot.exists()) {
      console.log('⚠️ [SSR] No users found in database');
      return {
        props: {
          users: [],
          totalUsers: 0,
        },
      };
    }

    const usersData = snapshot.val();
    const usersArray: SerializedUser[] = Object.keys(usersData).map(uid => {
      const user = usersData[uid];
      return {
        uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'Unknown',
        role: user.role || 'user',
        tier: user.subscription?.plan || 'free',
        isPremium: user.subscription?.status === 'active' && user.subscription?.plan !== 'free',
        isActive: user.subscription?.status === 'active',
        isLegacy: user.isLegacy || false,
        createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
        subscriptionExpiry: user.subscription?.endDate
          ? new Date(user.subscription.endDate).toISOString()
          : null,
      };
    });

    // Sort by createdAt descending (newest first)
    usersArray.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    console.log(`✅ [SSR] Fetched ${usersArray.length} users successfully`);

    return {
      props: {
        users: usersArray,
        totalUsers: usersArray.length,
      },
    };
  } catch (error: any) {
    console.error('❌ [SSR] Unexpected error:', error.message);
    return {
      props: {
        users: [],
        totalUsers: 0,
        error: "เกิดข้อผิดพลาดในการโหลดข้อมูล",
      },
    };
  }
};

export default UsersPage;
