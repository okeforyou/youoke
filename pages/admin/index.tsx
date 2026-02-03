import { GetServerSideProps } from "next";
import nookies from "nookies";
import React from "react";

// Import the Feature Component
import DashboardPage from "../../src/features/admin/pages/DashboardPage";

// Import Firebase AdminSDK for SSR
import { adminAuth, adminDb, adminFirestore } from "../../firebase-admin";

// ============================================================================
// PAGE COMPONENT (Wrapper)
// ============================================================================
export default function AdminIndexPage(props: any) {
  return <DashboardPage {...props} />;
}


// ============================================================================
// SERVER SIDE PROPS (Data Fetching Layer)
// This stays here in the "Pages" layer as it's specific to Next.js routing
// ============================================================================
export const getServerSideProps: GetServerSideProps = async (context) => {
  // console.log('🚀 [SSR] admin/index getServerSideProps started');

  try {
    // 1. Check authentication
    const cookies = nookies.get(context);
    const token = cookies.token;

    if (!token) {
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
      return {
        redirect: {
          destination: "/",
          permanent: false,
        },
      };
    }

    // 3. Fetch Data Logic 
    // (Ideally this should be moved to a adminService.getDashboardStats() call)
    // For now, retaining the logic block to ensure stability during migration.

    // ... [Logic identical to original] ...
    const usersRef = adminDb.ref('users');
    const usersSnapshot = await usersRef.once('value');
    const usersData = usersSnapshot.val() || {};
    const usersArray = Object.entries(usersData);

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
        recentApprovedPayments.push({ id: doc.id, ...data });
      } else if (data.status === 'rejected') rejectedPayments++;
    });

    recentApprovedPayments.sort((a, b) => (b.approvedAt?.toMillis?.() || 0) - (a.approvedAt?.toMillis?.() || 0));
    const top10Payments = recentApprovedPayments.slice(0, 10);

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

    const activities: any[] = [];
    top10Payments.forEach((p) => activities.push({
      id: p.id, type: "payment", action: "Payment Approved",
      timestamp: p.approvedAt?.toDate?.()?.toISOString() || null,
      details: `${p.amount} THB - Plan: ${p.planId}`,
    }));
    recentUsers.forEach((u) => activities.push({
      id: u.id, type: "user", action: "New User Registered",
      timestamp: u.createdAt ? new Date(u.createdAt).toISOString() : null,
      details: `${u.displayName || u.email} - ${u.tier}`,
    }));

    activities.sort((a, b) => (b.timestamp ? new Date(b.timestamp).getTime() : 0) - (a.timestamp ? new Date(a.timestamp).getTime() : 0));

    return {
      props: {
        stats: {
          totalUsers, adminUsers, freeUsers, premiumUsers,
          monthlySubscribers, yearlySubscribers, lifetimeSubscribers,
          pendingPayments, approvedPayments, rejectedPayments, totalRevenue,
        },
        recentActivities: activities.slice(0, 10),
      },
    };
  } catch (error: any) {
    console.error('SERVER ERROR', error);
    return {
      props: {
        stats: {
          totalUsers: 0, adminUsers: 0, freeUsers: 0, premiumUsers: 0,
          monthlySubscribers: 0, yearlySubscribers: 0, lifetimeSubscribers: 0,
          pendingPayments: 0, approvedPayments: 0, rejectedPayments: 0,
          totalRevenue: 0
        },
        recentActivities: [],
        error: "Server Error",
      },
    };
  }
};
