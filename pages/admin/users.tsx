import { GetServerSideProps } from "next";
import nookies from "nookies";
import React from "react";

// Feature Component
import UsersPage from "../../src/features/admin/pages/UsersPage";

// Services (SSR Logic)
import { adminAuth, adminDb } from "../../firebase-admin";

export default function UsersRoute(props: any) {
  return <UsersPage {...props} />;
}

// ============================================================================
// SERVER SIDE PROPS
// ============================================================================
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = nookies.get(context);
    const token = cookies.token;
    if (!token) return { redirect: { destination: "/login", permanent: false } };

    if (!adminDb || !adminAuth) return { props: { users: [], totalUsers: 0, error: "Firebase Admin Error" } };

    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      const userRef = adminDb.ref(`users/${decodedToken.uid}`);
      const userSnapshot = await userRef.once("value");

      if (!userSnapshot.exists() || userSnapshot.val().role !== "admin") {
        return { redirect: { destination: "/", permanent: false } };
      }

      // Fetch Users
      const usersRef = adminDb.ref("users");
      const snapshot = await usersRef.once("value");

      const usersArray = !snapshot.exists() ? [] : Object.keys(snapshot.val()).map(uid => {
        const user = snapshot.val()[uid];
        return {
          uid,
          email: user.email || "",
          displayName: user.displayName || user.email?.split("@")[0] || "Unknown",
          role: user.role || "user",
          tier: user.subscription?.plan || "free",
          isPremium: user.subscription?.status === "active" && user.subscription?.plan !== "free",
          isActive: user.subscription?.status === "active",
          isLegacy: user.isLegacy || false,
          createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
          subscriptionExpiry: user.subscription?.endDate ? new Date(user.subscription.endDate).toISOString() : null,
        };
      });

      usersArray.sort((a, b) => (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0));

      return {
        props: {
          users: usersArray,
          totalUsers: usersArray.length,
        },
      };
    } catch (error) {
      return { redirect: { destination: "/login", permanent: false } };
    }
  } catch (error) {
    return { props: { users: [], totalUsers: 0, error: "Load Error" } };
  }
};
