import { GetServerSideProps } from "next";
import nookies from "nookies";
import React from "react";

// Feature Component
import SettingsPage from "../../src/features/admin/pages/SettingsPage";

// Services (SSR Logic)
import { adminAuth, adminDb, adminFirestore } from "../../firebase-admin";

export default function SettingsRoute(props: any) {
  return <SettingsPage {...props} />;
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
    const userRef = adminDb.ref(`users/${decodedToken.uid}`);
    const userSnapshot = await userRef.once("value");

    if (!userSnapshot.exists() || userSnapshot.val().role !== "admin") {
      return { redirect: { destination: "/", permanent: false } };
    }

    const [generalDoc, featuresDoc] = await Promise.all([
      adminFirestore.collection("settings").doc("general").get(),
      adminFirestore.collection("settings").doc("features").get(),
    ]);

    const defaultGeneral = {
      siteName: "YouOke",
      siteDescription: "คาราโอเกะออนไลน์",
      maintenanceMode: false,
      allowGuestAccess: true,
      maxGuestsPerRoom: 10,
      defaultLanguage: "th",
    };

    const defaultFeatures = {
      castModeEnabled: true,
      queueManagementEnabled: true,
      shareRoomEnabled: true,
      voiceControlEnabled: false,
      lyricsEnabled: false,
      midiPlayerEnabled: false,
    };

    return {
      props: {
        generalSettings: generalDoc.exists ? { ...defaultGeneral, ...generalDoc.data() } : defaultGeneral,
        featureFlags: featuresDoc.exists ? { ...defaultFeatures, ...featuresDoc.data() } : defaultFeatures,
      },
    };
  } catch (error) {
    return {
      props: {
        generalSettings: {}, featureFlags: {}, error: "Load Error"
      },
    };
  }
};
