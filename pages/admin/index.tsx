import { collection, getDocs, query, where, orderBy, limit, getCountFromServer, getAggregateFromServer, sum } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { FiUsers, FiDollarSign, FiCheckCircle, FiTrendingUp, FiClock, FiX, FiActivity } from "react-icons/fi";

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
  approvedPayments: number;
  rejectedPayments: number;
  totalRevenue: number;
}

interface RecentActivity {
  id: string;
  type: "user" | "payment";
  action: string;
  timestamp: any;
  details: string;
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
    approvedPayments: 0,
    rejectedPayments: 0,
    totalRevenue: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load from cache immediately
    const cached = localStorage.getItem('admin_stats_cache');
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        // Use cache if less than 30 minutes old (increased from 5)
        if (age < 30 * 60 * 1000) {
          setStats(data.stats);
          setRecentActivities(data.activities);
          setLoading(false);
          // Still fetch in background to update if cache is older than 5 minutes
          if (age > 5 * 60 * 1000) {
            fetchStats(true);
          }
          return;
        }
      } catch (e) {
        console.error('Cache parse error:', e);
      }
    }
    fetchStats();
  }, []);

  const fetchStats = async (background = false) => {
    try {
      if (!background) {
        setLoading(true);
      }

      console.time('fetchStats');

      // Use parallel queries for better performance
      const [
        totalUsersCount,
        adminCount,
        freeCount,
        premiumCount,
        monthlyCount,
        yearlyCount,
        lifetimeCount,
        pendingCount,
        approvedCount,
        rejectedCount,
        revenueData,
        recentUsers,
        recentPayments,
      ] = await Promise.all([
        // User counts using getCountFromServer (much faster!)
        getCountFromServer(collection(db, "users")),
        getCountFromServer(query(collection(db, "users"), where("role", "==", "admin"))),
        getCountFromServer(query(collection(db, "users"), where("tier", "==", "free"))),
        getCountFromServer(query(collection(db, "users"), where("isPremium", "==", true))),
        getCountFromServer(query(collection(db, "users"), where("tier", "==", "monthly"))),
        getCountFromServer(query(collection(db, "users"), where("tier", "==", "yearly"))),
        getCountFromServer(query(collection(db, "users"), where("tier", "==", "lifetime"))),

        // Payment counts
        getCountFromServer(query(collection(db, "payments"), where("status", "==", "pending"))),
        getCountFromServer(query(collection(db, "payments"), where("status", "==", "approved"))),
        getCountFromServer(query(collection(db, "payments"), where("status", "==", "rejected"))),

        // Total revenue using aggregation
        getAggregateFromServer(
          query(collection(db, "payments"), where("status", "==", "approved")),
          { totalRevenue: sum("amount") }
        ).catch(() => ({ data: () => ({ totalRevenue: 0 }) })),

        // Recent users (only fetch 10)
        getDocs(query(collection(db, "users"), orderBy("createdAt", "desc"), limit(10))).catch(() => ({ docs: [] })),

        // Recent approved payments (only fetch 10)
        getDocs(query(collection(db, "payments"), where("status", "==", "approved"), orderBy("approvedAt", "desc"), limit(10))).catch(() => ({ docs: [] })),
      ]);

      console.timeEnd('fetchStats');

      // Extract counts
      const totalUsers = totalUsersCount.data().count;
      const adminUsers = adminCount.data().count;
      const freeUsers = freeCount.data().count;
      const premiumUsers = premiumCount.data().count;
      const monthlySubscribers = monthlyCount.data().count;
      const yearlySubscribers = yearlyCount.data().count;
      const lifetimeSubscribers = lifetimeCount.data().count;
      const pendingPayments = pendingCount.data().count;
      const approvedPayments = approvedCount.data().count;
      const rejectedPayments = rejectedCount.data().count;
      const totalRevenue = revenueData.data().totalRevenue || 0;

      // Build recent activities
      const activities: RecentActivity[] = [];

      // Add recent payments
      recentPayments.docs.forEach((doc) => {
        const data = doc.data();
        activities.push({
          id: doc.id,
          type: "payment",
          action: "Payment Approved",
          timestamp: data.approvedAt,
          details: `${data.amount} THB - Plan: ${data.planId}`,
        });
      });

      // Add recent users
      recentUsers.docs.forEach((doc) => {
        const data = doc.data();
        activities.push({
          id: doc.id,
          type: "user",
          action: "New User Registered",
          timestamp: data.createdAt,
          details: `${data.displayName || data.email} - ${data.tier}`,
        });
      });

      // Sort activities by timestamp
      activities.sort((a, b) => {
        const aTime = a.timestamp?.toMillis?.() || 0;
        const bTime = b.timestamp?.toMillis?.() || 0;
        return bTime - aTime;
      });

      const sortedActivities = activities.slice(0, 10);
      setRecentActivities(sortedActivities);

      const newStats = {
        totalUsers,
        adminUsers,
        freeUsers,
        premiumUsers,
        monthlySubscribers,
        yearlySubscribers,
        lifetimeSubscribers,
        pendingPayments,
        approvedPayments,
        rejectedPayments,
        totalRevenue,
      };

      setStats(newStats);

      // Save to cache with activities
      localStorage.setItem('admin_stats_cache', JSON.stringify({
        data: {
          stats: newStats,
          activities: sortedActivities,
        },
        timestamp: Date.now(),
      }));
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
            subtitle={`${stats.adminUsers} admins, ${stats.freeUsers} free`}
          />
          <StatCard
            title="Premium Users"
            value={stats.premiumUsers}
            icon={<Icon icon={FiTrendingUp} size={24} className="text-white" />}
            color="bg-green-500"
            subtitle={`${stats.monthlySubscribers}M + ${stats.yearlySubscribers}Y + ${stats.lifetimeSubscribers}L`}
          />
          <StatCard
            title="Total Revenue"
            value={`${stats.totalRevenue.toLocaleString()} ฿`}
            icon={<Icon icon={FiDollarSign} size={24} className="text-white" />}
            color="bg-purple-500"
            subtitle={`${stats.approvedPayments} approved payments`}
          />
          <StatCard
            title="Pending Payments"
            value={stats.pendingPayments}
            icon={<Icon icon={FiClock} size={24} className="text-white" />}
            color="bg-orange-500"
            subtitle={`${stats.rejectedPayments} rejected`}
          />
        </div>

        {/* Payment Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-green-50 rounded-lg shadow p-6 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Approved</p>
                <p className="text-3xl font-bold text-green-900">{stats.approvedPayments}</p>
              </div>
              <Icon icon={FiCheckCircle} size={32} className="text-green-500" />
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg shadow p-6 border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Pending</p>
                <p className="text-3xl font-bold text-orange-900">{stats.pendingPayments}</p>
              </div>
              <Icon icon={FiClock} size={32} className="text-orange-500" />
            </div>
          </div>

          <div className="bg-red-50 rounded-lg shadow p-6 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Rejected</p>
                <p className="text-3xl font-bold text-red-900">{stats.rejectedPayments}</p>
              </div>
              <Icon icon={FiX} size={32} className="text-red-500" />
            </div>
          </div>
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

        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Icon icon={FiActivity} size={20} className="text-gray-700" />
            <h2 className="text-xl font-bold text-gray-900">Recent Activities</h2>
          </div>
          {recentActivities.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent activities</p>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div
                    className={`p-2 rounded-full ${
                      activity.type === "payment"
                        ? "bg-green-100"
                        : "bg-blue-100"
                    }`}
                  >
                    <Icon
                      icon={activity.type === "payment" ? FiDollarSign : FiUsers}
                      size={16}
                      className={
                        activity.type === "payment"
                          ? "text-green-600"
                          : "text-blue-600"
                      }
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.action}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {activity.details}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {activity.timestamp?.toDate
                        ? activity.timestamp.toDate().toLocaleString("th-TH", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "N/A"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
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
