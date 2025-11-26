import { collection, getDocs, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { FiUsers, FiDollarSign, FiCheckCircle, FiTrendingUp } from "react-icons/fi";

import Icon from "../../components/Icon";

import AdminLayout from "../../components/admin/AdminLayout";
import { db } from "../../firebase";

interface Stats {
  totalUsers: number;
  adminUsers: number;
  freeUsers: number;
  premiumUsers: number;
  monthlySubscribers: number;
  yearlySubscribers: number;
  lifetimeSubscribers: number;
  pendingPayments: number;
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-full ${color}`}>{icon}</div>
    </div>
  </div>
);

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    adminUsers: 0,
    freeUsers: 0,
    premiumUsers: 0,
    monthlySubscribers: 0,
    yearlySubscribers: 0,
    lifetimeSubscribers: 0,
    pendingPayments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Fetch all users
      const usersSnapshot = await getDocs(collection(db, "users"));
      const users = usersSnapshot.docs.map((doc) => doc.data());

      // Calculate stats
      const totalUsers = users.length;
      const adminUsers = users.filter((u) => u.role === "admin").length;
      const freeUsers = users.filter((u) => u.tier === "free").length;
      const premiumUsers = users.filter((u) => u.isPremium === true).length;
      const monthlySubscribers = users.filter((u) => u.tier === "monthly").length;
      const yearlySubscribers = users.filter((u) => u.tier === "yearly").length;
      const lifetimeSubscribers = users.filter((u) => u.tier === "lifetime").length;

      // Fetch pending payments (if payments collection exists)
      let pendingPayments = 0;
      try {
        const paymentsQuery = query(
          collection(db, "payments"),
          where("status", "==", "pending")
        );
        const paymentsSnapshot = await getDocs(paymentsQuery);
        pendingPayments = paymentsSnapshot.size;
      } catch (error) {
        console.log("No payments collection yet");
      }

      setStats({
        totalUsers,
        adminUsers,
        freeUsers,
        premiumUsers,
        monthlySubscribers,
        yearlySubscribers,
        lifetimeSubscribers,
        pendingPayments,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">ภาพรวมระบบ YouOke</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="ผู้ใช้ทั้งหมด"
            value={stats.totalUsers}
            icon={<Icon icon={FiUsers} size={24} className="text-white" />}
            color="bg-blue-500"
            subtitle={`${stats.adminUsers} admins`}
          />
          <StatCard
            title="Free Users"
            value={stats.freeUsers}
            icon={<Icon icon={FiUsers} size={24} className="text-white" />}
            color="bg-gray-500"
          />
          <StatCard
            title="Premium Users"
            value={stats.premiumUsers}
            icon={<Icon icon={FiTrendingUp} size={24} className="text-white" />}
            color="bg-green-500"
            subtitle={`${stats.monthlySubscribers}M + ${stats.yearlySubscribers}Y + ${stats.lifetimeSubscribers}L`}
          />
          <StatCard
            title="Pending Payments"
            value={stats.pendingPayments}
            icon={<Icon icon={FiCheckCircle} size={24} className="text-white" />}
            color="bg-orange-500"
          />
        </div>

        {/* Subscription Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Subscription Breakdown
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-700">Monthly Subscribers</span>
              <span className="font-bold text-blue-600">{stats.monthlySubscribers}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-700">Yearly Subscribers</span>
              <span className="font-bold text-green-600">{stats.yearlySubscribers}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-700">Lifetime Members</span>
              <span className="font-bold text-purple-600">{stats.lifetimeSubscribers}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-700 font-bold">Total Premium</span>
              <span className="font-bold text-red-600">{stats.premiumUsers}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/admin/users"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <Icon icon={FiUsers} size={20} className="text-blue-500" />
              <span className="font-medium text-gray-700">Manage Users</span>
            </a>
            <a
              href="/admin/payments"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
            >
              <Icon icon={FiCheckCircle} size={20} className="text-orange-500" />
              <span className="font-medium text-gray-700">Verify Payments</span>
            </a>
            <a
              href="/admin/subscriptions"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
            >
              <Icon icon={FiDollarSign} size={20} className="text-green-500" />
              <span className="font-medium text-gray-700">Manage Plans</span>
            </a>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
