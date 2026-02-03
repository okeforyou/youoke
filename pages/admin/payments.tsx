import { GetServerSideProps } from "next";
import nookies from "nookies"; // Ensure nookies is imported for the wrapper
import React, { useEffect, useState } from "react";

// Feature Component
import PaymentsPage from "../../src/features/admin/pages/PaymentsPage";

// Services (SSR Logic)
import { adminAuth, adminDb, adminFirestore } from "../../firebase-admin";

export default function PaymentsRoute(props: any) {
  return <PaymentsPage {...props} />;
}

// ============================================================================
// SERVER SIDE PROPS
// ============================================================================
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
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

    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;
    const userRef = adminDb.ref(`users/${uid}`);
    const userSnapshot = await userRef.once("value");
    const userData = userSnapshot.val();

    if (!userData || userData.role !== "admin") {
      return {
        redirect: {
          destination: "/",
          permanent: false,
        },
      };
    }

    // SSR Logic for Payments
    const paymentsSnapshot = await adminFirestore.collection("payments").orderBy("createdAt", "desc").get();

    const payments = paymentsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        approvedAt: data.approvedAt?.toDate?.()?.toISOString() || null,
        rejectedAt: data.rejectedAt?.toDate?.()?.toISOString() || null,
      };
    });

    return {
      props: {
        payments,
        totalPayments: payments.length,
      },
    };
  } catch (error) {
    console.error("Error fetching payments:", error);
    return {
      props: {
        payments: [],
        totalPayments: 0,
        error: "เกิดข้อผิดพลาดในการโหลดข้อมูล",
      },
    };
  }
};
