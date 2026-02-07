import { GetServerSideProps } from "next";
import nookies from "nookies";
import React from "react";

// Feature Component
import SubscriptionsPage from "../../src/features/admin/pages/SubscriptionsPage";

// Services (SSR Logic)
import { adminAuth, adminDb, adminFirestore } from "../../firebase-admin";
import { adminAuth, adminFirestore } from "../../firebase-admin";

export default function AdminSubscriptionsRoute(props: any) {
  return <SubscriptionPage />;
}

// ============================================================================
// SERVER SIDE PROPS
// ============================================================================
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = nookies.get(context);
    const token = cookies.token;
    if (!token) return { redirect: { destination: "/login", permanent: false } };

    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Check Firestore (Hybrid Mode Support)
    const userDoc = await adminFirestore.collection('users').doc(uid).get();
    const userData = userDoc.data();

    if (!userDoc.exists || userData?.role !== 'admin') {
      return { redirect: { destination: "/", permanent: false } };
    }

    const plansSnapshot = await adminFirestore.collection("plans").get();
    const plans = plansSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort: Core plans first
    const corePlans = ["free", "monthly", "yearly", "lifetime"];
    plans.sort((a: any, b: any) => {
      const indexA = corePlans.indexOf(a.id);
      const indexB = corePlans.indexOf(b.id);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return 0;
    });

    return {
      props: {
        plans,
      },
    };
  } catch (error) {
    return {
      props: {
        plans: [],
        error: "Load Error",
      },
    };
  }
};
