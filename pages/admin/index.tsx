import React from "react";
import { FiUsers, FiDollarSign, FiCheckCircle, FiTrendingUp, FiClock, FiX, FiActivity } from "react-icons/fi";
import { GetServerSideProps } from "next";
import nookies from "nookies";

import Icon from "../../components/Icon";
import AdminLayout from "../../components/admin/AdminLayout";
import { adminAuth, adminDb, adminFirestore } from "../../firebase-admin";

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

// Serialized version for SSR
interface SerializedActivity {
  id: string;
  type: "user" | "payment";
  action: string;
  timestamp: string | null;
  details: string;
}

interface Props {
  stats: Stats;
  recentActivities: SerializedActivity[];
  error?: string;
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

const AdminDashboard: React.FC<Props> = ({ stats, recentActivities: serializedActivities, error }) => {
  // Convert serialized activities back to objects with proper dates
  const recentActivities = serializedActivities.map(a => ({
    ...a,
    timestamp: a.timestamp ? new Date(a.timestamp) : null,
  }));

  // Show error if any
  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 text-lg font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              รีโหลดหน้า
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
                      {activity.timestamp
                        ? activity.timestamp.toLocaleString("th-TH", {
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

// Server-Side Props
export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  console.log('🚀 [SSR] admin/index getServerSideProps started');

  try {
    // 1. Check authentication
    const cookies = nookies.get(context);
    const token = cookies.token;

    if (!token) {
      console.log('❌ [SSR] No token found, redirecting to login');
      return {
        redirect: {
          destination: "/login",
          permanent: false,
        },
      };
    }

    // 2. Verify token and check if user is admin
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    const userRef = adminDb.ref(`users/${uid}`);
    const userSnapshot = await userRef.once('value');
    const userData = userSnapshot.val();

    if (!userData || userData.role !== 'admin') {
      console.log('❌ [SSR] User is not admin, redirecting to home');
      return {
        redirect: {
          destination: "/",
          permanent: false,
        },
      };
    }

    console.log('✅ [SSR] Admin authenticated:', uid);

    // 3. Fetch all stats in parallel
    const startTime = Date.now();

    // Fetch all users from Realtime Database
    const usersRef = adminDb.ref('users');
    const usersSnapshot = await usersRef.once('value');
    const usersData = usersSnapshot.val() || {};
    const usersArray = Object.entries(usersData);

    // Calculate user stats
    let totalUsers = 0;
    let adminUsers = 0;
    let freeUsers = 0;
    let premiumUsers = 0;
    let monthlySubscribers = 0;
    let yearlySubscribers = 0;
    let lifetimeSubscribers = 0;

    usersArray.forEach(([uid, user]: [string, any]) => {
      totalUsers++;
      if (user.role === 'admin') adminUsers++;

      const tier = user.subscription?.plan || user.tier || 'free';
      const isActive = user.subscription?.status === 'active' || user.isPremium;

      if (tier === 'free') freeUsers++;
      if (isActive && tier !== 'free') {
        premiumUsers++;
        if (tier === 'monthly') monthlySubscribers++;
        else if (tier === 'yearly') yearlySubscribers++;
        else if (tier === 'lifetime') lifetimeSubscribers++;
      }
    });

    // Fetch payments from Firestore
    const paymentsSnapshot = await adminFirestore.collection('payments').get();

    let pendingPayments = 0;
    let approvedPayments = 0;
    let rejectedPayments = 0;
    let totalRevenue = 0;

    const recentApprovedPayments: any[] = [];

    paymentsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.status === 'pending') pendingPayments++;
      else if (data.status === 'approved') {
        approvedPayments++;
        totalRevenue += data.amount || 0;
        recentApprovedPayments.push({
          id: doc.id,
          ...data,
        });
      }
      else if (data.status === 'rejected') rejectedPayments++;
    });

    // Sort recent payments by approvedAt
    recentApprovedPayments.sort((a, b) => {
      const aTime = a.approvedAt?.toMillis?.() || 0;
      const bTime = b.approvedAt?.toMillis?.() || 0;
      return bTime - aTime;
    });

    // Get top 10 recent approved payments
    const top10Payments = recentApprovedPayments.slice(0, 10);

    // Get recent users (sort by createdAt)
    const recentUsers = usersArray
      .map(([uid, user]: [string, any]) => ({
        id: uid,
        displayName: user.displayName,
        email: user.email,
        tier: user.subscription?.plan || user.tier || 'free',
        createdAt: user.createdAt,
      }))
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 10);

    // Build activities
    const activities: SerializedActivity[] = [];

    // Add recent payments
    top10Payments.forEach((payment) => {
      activities.push({
        id: payment.id,
        type: "payment",
        action: "Payment Approved",
        timestamp: payment.approvedAt?.toDate?.()?.toISOString() || null,
        details: `${payment.amount} THB - Plan: ${payment.planId}`,
      });
    });

    // Add recent users
    recentUsers.forEach((user) => {
      activities.push({
        id: user.id,
        type: "user",
        action: "New User Registered",
        timestamp: user.createdAt ? new Date(user.createdAt).toISOString() : null,
        details: `${user.displayName || user.email} - ${user.tier}`,
      });
    });

    // Sort activities by timestamp
    activities.sort((a, b) => {
      const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return bTime - aTime;
    });

    const finalActivities = activities.slice(0, 10);

    const endTime = Date.now();
    console.log(`✅ [SSR] admin/index getServerSideProps completed in ${endTime - startTime}ms`);

    return {
      props: {
        stats: {
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
        },
        recentActivities: finalActivities,
      },
    };
  } catch (error: any) {
    console.error('❌ [SSR] Error in getServerSideProps:', error);
    return {
      props: {
        stats: {
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
        },
        recentActivities: [],
        error: "เกิดข้อผิดพลาดในการโหลดข้อมูล",
      },
    };
  }
};

export default AdminDashboard;
