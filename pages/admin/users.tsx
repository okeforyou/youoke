import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
  query,
  orderBy,
  limit,
  startAfter,
  getCountFromServer,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { FiSearch, FiEdit2, FiCheck, FiX, FiDownload, FiTrash2, FiChevronLeft, FiChevronRight } from "react-icons/fi";

import Icon from "../../components/Icon";

import AdminLayout from "../../components/admin/AdminLayout";
import { db } from "../../firebase";
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

const USERS_PER_PAGE = 20;

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterTier, setFilterTier] = useState("all");
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [firstDoc, setFirstDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterRole, filterTier]);

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);

      console.time('fetchUsers');

      // Get total count (fast!)
      const countSnapshot = await getCountFromServer(collection(db, "users"));
      const total = countSnapshot.data().count;
      setTotalUsers(total);

      // Build query with pagination
      let usersQuery = query(
        collection(db, "users"),
        orderBy("createdAt", "desc"),
        limit(USERS_PER_PAGE)
      );

      // Fetch page data
      const snapshot = await getDocs(usersQuery);

      if (snapshot.empty) {
        setUsers([]);
        setLoading(false);
        return;
      }

      // Store cursors for pagination
      setFirstDoc(snapshot.docs[0]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);

      const usersData = snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      })) as User[];

      setUsers(usersData);
      setCurrentPage(page);

      console.timeEnd('fetchUsers');
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNextPage = async () => {
    if (!lastDoc || users.length < USERS_PER_PAGE) return;

    try {
      setLoading(true);
      const usersQuery = query(
        collection(db, "users"),
        orderBy("createdAt", "desc"),
        startAfter(lastDoc),
        limit(USERS_PER_PAGE)
      );

      const snapshot = await getDocs(usersQuery);
      if (snapshot.empty) {
        setLoading(false);
        return;
      }

      setFirstDoc(snapshot.docs[0]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);

      const usersData = snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      })) as User[];

      setUsers(usersData);
      setCurrentPage((prev) => prev + 1);
    } catch (error) {
      console.error("Error fetching next page:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPreviousPage = async () => {
    if (!firstDoc || currentPage <= 1) return;

    try {
      setLoading(true);

      // For going back, we need to query in reverse
      // This is complex in Firestore, so let's just refetch from the beginning
      // For a better solution, you'd need to maintain a stack of cursors

      const targetPage = currentPage - 1;
      const skip = (targetPage - 1) * USERS_PER_PAGE;

      const usersQuery = query(
        collection(db, "users"),
        orderBy("createdAt", "desc"),
        limit(USERS_PER_PAGE)
      );

      const snapshot = await getDocs(usersQuery);

      // Skip to the target page
      let currentSnapshot = snapshot;
      for (let i = 1; i < targetPage; i++) {
        const lastDocOfPage = currentSnapshot.docs[currentSnapshot.docs.length - 1];
        const nextQuery = query(
          collection(db, "users"),
          orderBy("createdAt", "desc"),
          startAfter(lastDocOfPage),
          limit(USERS_PER_PAGE)
        );
        currentSnapshot = await getDocs(nextQuery);
      }

      setFirstDoc(currentSnapshot.docs[0]);
      setLastDoc(currentSnapshot.docs[currentSnapshot.docs.length - 1]);

      const usersData = currentSnapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      })) as User[];

      setUsers(usersData);
      setCurrentPage(targetPage);
    } catch (error) {
      console.error("Error fetching previous page:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

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
  };

  const handleEditUser = (user: User) => {
    setEditingUser({ ...user });
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      const userRef = doc(db, "users", editingUser.uid);
      await updateDoc(userRef, {
        role: editingUser.role,
        tier: editingUser.tier,
        isPremium: editingUser.isPremium,
        isActive: editingUser.isActive,
        updatedAt: Timestamp.now(),
      });

      // Update local state
      setUsers((prev) =>
        prev.map((u) => (u.uid === editingUser.uid ? editingUser : u))
      );

      // Clear cache to force refresh on next load
      localStorage.removeItem("admin_users");

      setEditingUser(null);
      alert("User updated successfully!");
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
      const userRef = doc(db, "users", user.uid);
      await deleteDoc(userRef);

      // Update local state
      setUsers((prev) => prev.filter((u) => u.uid !== user.uid));

      // Clear cache to force refresh on next load
      localStorage.removeItem("admin_users");

      alert("ลบผู้ใช้เรียบร้อยแล้ว");
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

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
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
              จัดการผู้ใช้ทั้งหมด (แสดง {users.length} จาก {totalUsers} users, หน้า {currentPage} / {Math.ceil(totalUsers / USERS_PER_PAGE)})
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
                {filteredUsers.map((user) => (
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
              <span className="font-medium">{Math.min(currentPage * USERS_PER_PAGE, totalUsers)}</span> จาก{" "}
              <span className="font-medium">{totalUsers}</span> users
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchPreviousPage}
                disabled={currentPage <= 1 || loading}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Icon icon={FiChevronLeft} />
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-700">
                หน้า {currentPage} / {Math.ceil(totalUsers / USERS_PER_PAGE)}
              </span>
              <button
                onClick={fetchNextPage}
                disabled={users.length < USERS_PER_PAGE || loading}
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

export default UsersPage;
