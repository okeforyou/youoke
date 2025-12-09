import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { FiSave, FiRefreshCw } from "react-icons/fi";
import { GetServerSideProps } from "next";
import nookies from "nookies";

import Icon from "../../components/Icon";

import AdminLayout from "../../components/admin/AdminLayout";
import { db } from "../../firebase";
import { adminAuth, adminDb, adminFirestore } from "../../firebase-admin";

interface GeneralSettings {
  siteName: string;
  siteDescription: string;
  maintenanceMode: boolean;
  allowGuestAccess: boolean;
  maxGuestsPerRoom: number;
  defaultLanguage: string;
}

interface FeatureFlags {
  castModeEnabled: boolean;
  queueManagementEnabled: boolean;
  shareRoomEnabled: boolean;
  voiceControlEnabled: boolean;
  lyricsEnabled: boolean;
  midiPlayerEnabled: boolean;
}

interface Props {
  generalSettings: GeneralSettings;
  featureFlags: FeatureFlags;
  error?: string;
}

const SettingsPage: React.FC<Props> = ({ generalSettings: initialGeneral, featureFlags: initialFlags, error }) => {
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>(initialGeneral);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>(initialFlags);
  const [saving, setSaving] = useState(false);

  const handleSaveGeneralSettings = async () => {
    try {
      setSaving(true);
      const generalRef = doc(db, "settings", "general");
      await updateDoc(generalRef, {
        ...generalSettings,
        updatedAt: Timestamp.now(),
      });
      alert("General settings saved successfully!");
      window.location.reload();
    } catch (error) {
      console.error("Error saving general settings:", error);
      alert("Error saving settings");
      setSaving(false);
    }
  };

  const handleSaveFeatureFlags = async () => {
    try {
      setSaving(true);
      const featuresRef = doc(db, "settings", "features");
      await updateDoc(featuresRef, {
        ...featureFlags,
        updatedAt: Timestamp.now(),
      });
      alert("Feature flags saved successfully!");
      window.location.reload();
    } catch (error) {
      console.error("Error saving feature flags:", error);
      alert("Error saving settings");
      setSaving(false);
    }
  };

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
            <p className="text-gray-600 mt-1">จัดการการตั้งค่าระบบ</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <Icon icon={FiRefreshCw} />
            Refresh
          </button>
        </div>

        {/* General Settings */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">General Settings</h2>
            <p className="text-sm text-gray-600 mt-1">
              การตั้งค่าทั่วไปของระบบ
            </p>
          </div>

          <div className="p-6 space-y-4">
            {/* Site Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site Name
              </label>
              <input
                type="text"
                value={generalSettings.siteName}
                onChange={(e) =>
                  setGeneralSettings({
                    ...generalSettings,
                    siteName: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            {/* Site Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site Description
              </label>
              <textarea
                value={generalSettings.siteDescription}
                onChange={(e) =>
                  setGeneralSettings({
                    ...generalSettings,
                    siteDescription: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={3}
              />
            </div>

            {/* Default Language */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Language
              </label>
              <select
                value={generalSettings.defaultLanguage}
                onChange={(e) =>
                  setGeneralSettings({
                    ...generalSettings,
                    defaultLanguage: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="th">ไทย (Thai)</option>
                <option value="en">English</option>
              </select>
            </div>

            {/* Max Guests Per Room */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Guests Per Room
              </label>
              <input
                type="number"
                value={generalSettings.maxGuestsPerRoom}
                onChange={(e) =>
                  setGeneralSettings({
                    ...generalSettings,
                    maxGuestsPerRoom: Number(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                min="1"
              />
            </div>

            {/* Toggles */}
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <div>
                  <span className="font-medium text-gray-900">
                    Maintenance Mode
                  </span>
                  <p className="text-sm text-gray-600">
                    เปิดโหมดปิดปรับปรุง (ผู้ใช้ทั่วไปเข้าไม่ได้)
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={generalSettings.maintenanceMode}
                  onChange={(e) =>
                    setGeneralSettings({
                      ...generalSettings,
                      maintenanceMode: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded border-gray-300 text-red-500 focus:ring-red-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <div>
                  <span className="font-medium text-gray-900">
                    Allow Guest Access
                  </span>
                  <p className="text-sm text-gray-600">
                    อนุญาตให้ผู้เยี่ยมชม (ไม่ล็อกอิน) ใช้งานได้
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={generalSettings.allowGuestAccess}
                  onChange={(e) =>
                    setGeneralSettings({
                      ...generalSettings,
                      allowGuestAccess: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded border-gray-300 text-red-500 focus:ring-red-500"
                />
              </label>
            </div>

            {/* Save Button */}
            <div className="pt-4">
              <button
                onClick={handleSaveGeneralSettings}
                disabled={saving}
                className="w-full bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Icon icon={FiSave} />
                {saving ? "Saving..." : "Save General Settings"}
              </button>
            </div>
          </div>
        </div>

        {/* Feature Flags */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Feature Flags</h2>
            <p className="text-sm text-gray-600 mt-1">
              เปิด/ปิด ฟีเจอร์ต่างๆ ของระบบ
            </p>
          </div>

          <div className="p-6 space-y-3">
            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
              <div>
                <span className="font-medium text-gray-900">Cast Mode</span>
                <p className="text-sm text-gray-600">
                  ระบบ Cast ไปยัง TV / Monitor
                </p>
              </div>
              <input
                type="checkbox"
                checked={featureFlags.castModeEnabled}
                onChange={(e) =>
                  setFeatureFlags({
                    ...featureFlags,
                    castModeEnabled: e.target.checked,
                  })
                }
                className="w-5 h-5 rounded border-gray-300 text-red-500 focus:ring-red-500"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
              <div>
                <span className="font-medium text-gray-900">
                  Queue Management
                </span>
                <p className="text-sm text-gray-600">
                  ระบบจัดการคิวเพลง (drag & drop, reorder)
                </p>
              </div>
              <input
                type="checkbox"
                checked={featureFlags.queueManagementEnabled}
                onChange={(e) =>
                  setFeatureFlags({
                    ...featureFlags,
                    queueManagementEnabled: e.target.checked,
                  })
                }
                className="w-5 h-5 rounded border-gray-300 text-red-500 focus:ring-red-500"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
              <div>
                <span className="font-medium text-gray-900">Share Room</span>
                <p className="text-sm text-gray-600">
                  ระบบแชร์ห้องให้เพื่อน (Share Link)
                </p>
              </div>
              <input
                type="checkbox"
                checked={featureFlags.shareRoomEnabled}
                onChange={(e) =>
                  setFeatureFlags({
                    ...featureFlags,
                    shareRoomEnabled: e.target.checked,
                  })
                }
                className="w-5 h-5 rounded border-gray-300 text-red-500 focus:ring-red-500"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
              <div>
                <span className="font-medium text-gray-900">
                  Voice Control
                </span>
                <p className="text-sm text-gray-600">
                  ควบคุมด้วยเสียง (Coming Soon)
                </p>
              </div>
              <input
                type="checkbox"
                checked={featureFlags.voiceControlEnabled}
                onChange={(e) =>
                  setFeatureFlags({
                    ...featureFlags,
                    voiceControlEnabled: e.target.checked,
                  })
                }
                className="w-5 h-5 rounded border-gray-300 text-red-500 focus:ring-red-500"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
              <div>
                <span className="font-medium text-gray-900">Lyrics Display</span>
                <p className="text-sm text-gray-600">
                  แสดงเนื้อเพลง (Coming Soon)
                </p>
              </div>
              <input
                type="checkbox"
                checked={featureFlags.lyricsEnabled}
                onChange={(e) =>
                  setFeatureFlags({
                    ...featureFlags,
                    lyricsEnabled: e.target.checked,
                  })
                }
                className="w-5 h-5 rounded border-gray-300 text-red-500 focus:ring-red-500"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
              <div>
                <span className="font-medium text-gray-900">MIDI Player</span>
                <p className="text-sm text-gray-600">
                  เล่นไฟล์ MIDI (Coming Soon - Commercial Version)
                </p>
              </div>
              <input
                type="checkbox"
                checked={featureFlags.midiPlayerEnabled}
                onChange={(e) =>
                  setFeatureFlags({
                    ...featureFlags,
                    midiPlayerEnabled: e.target.checked,
                  })
                }
                className="w-5 h-5 rounded border-gray-300 text-red-500 focus:ring-red-500"
              />
            </label>

            {/* Save Button */}
            <div className="pt-4">
              <button
                onClick={handleSaveFeatureFlags}
                disabled={saving}
                className="w-full bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Icon icon={FiSave} />
                {saving ? "Saving..." : "Save Feature Flags"}
              </button>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-2">
            💡 เกี่ยวกับ Feature Flags
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• เปิด/ปิด ฟีเจอร์ต่างๆ แบบ real-time ไม่ต้อง deploy ใหม่</li>
            <li>• ฟีเจอร์ที่ยังไม่เสร็จสมบูรณ์ควรปิดไว้ก่อน</li>
            <li>
              • ใช้ในการทดสอบฟีเจอร์ใหม่กับผู้ใช้กลุ่มเล็กก่อนเปิดให้ทุกคน
            </li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
};

// Server-Side Props
export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  console.log('🚀 [SSR] admin/settings getServerSideProps started');

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

    // 3. Fetch settings from Firestore (both in parallel)
    const [generalDoc, featuresDoc] = await Promise.all([
      adminFirestore.collection('settings').doc('general').get(),
      adminFirestore.collection('settings').doc('features').get(),
    ]);

    // Default values in case documents don't exist
    const defaultGeneral: GeneralSettings = {
      siteName: "YouOke",
      siteDescription: "คาราโอเกะออนไลน์",
      maintenanceMode: false,
      allowGuestAccess: true,
      maxGuestsPerRoom: 10,
      defaultLanguage: "th",
    };

    const defaultFeatures: FeatureFlags = {
      castModeEnabled: true,
      queueManagementEnabled: true,
      shareRoomEnabled: true,
      voiceControlEnabled: false,
      lyricsEnabled: false,
      midiPlayerEnabled: false,
    };

    const generalSettings = generalDoc.exists
      ? (generalDoc.data() as GeneralSettings)
      : defaultGeneral;

    const featureFlags = featuresDoc.exists
      ? (featuresDoc.data() as FeatureFlags)
      : defaultFeatures;

    console.log(`✅ [SSR] Fetched settings successfully`);

    return {
      props: {
        generalSettings,
        featureFlags,
      },
    };
  } catch (error: any) {
    console.error('❌ [SSR] Error in getServerSideProps:', error);
    return {
      props: {
        generalSettings: {
          siteName: "YouOke",
          siteDescription: "คาราโอเกะออนไลน์",
          maintenanceMode: false,
          allowGuestAccess: true,
          maxGuestsPerRoom: 10,
          defaultLanguage: "th",
        },
        featureFlags: {
          castModeEnabled: true,
          queueManagementEnabled: true,
          shareRoomEnabled: true,
          voiceControlEnabled: false,
          lyricsEnabled: false,
          midiPlayerEnabled: false,
        },
        error: "เกิดข้อผิดพลาดในการโหลดข้อมูล",
      },
    };
  }
};

export default SettingsPage;
