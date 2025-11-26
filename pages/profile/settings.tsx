import { updateProfile, updatePassword } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import React, { useState } from "react";
import { FiSave, FiLock, FiUser } from "react-icons/fi";

import Icon from "../../components/Icon";
import ProfileLayout from "../../components/profile/ProfileLayout";
import { useAuth } from "../../context/AuthContext";
import { auth, db } from "../../firebase";

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleUpdateDisplayName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || !auth.currentUser) return;

    try {
      setSavingName(true);

      // Update in Firebase Auth
      await updateProfile(auth.currentUser, {
        displayName: displayName,
      });

      // Update in Firestore
      await updateDoc(doc(db, "users", user.uid), {
        displayName: displayName,
      });

      alert("อัปเดตชื่อผู้ใช้สำเร็จ!");
    } catch (error: any) {
      console.error("Error updating display name:", error);
      alert("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      setSavingName(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    // Validate passwords
    if (newPassword.length < 6) {
      alert("รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("รหัสผ่านใหม่ไม่ตรงกัน");
      return;
    }

    try {
      setSavingPassword(true);

      // Update password
      await updatePassword(auth.currentUser, newPassword);

      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      alert("เปลี่ยนรหัสผ่านสำเร็จ!");
    } catch (error: any) {
      console.error("Error updating password:", error);

      if (error.code === "auth/requires-recent-login") {
        alert(
          "กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่อีกครั้ง เพื่อเปลี่ยนรหัสผ่าน"
        );
      } else {
        alert("เกิดข้อผิดพลาด: " + error.message);
      }
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <ProfileLayout>
      <div className="space-y-6">
        {/* Update Display Name */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Icon icon={FiUser} size={24} className="text-gray-700" />
              <h2 className="text-xl font-bold text-gray-900">
                เปลี่ยนชื่อผู้ใช้
              </h2>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              อัปเดตชื่อที่แสดงในระบบ
            </p>
          </div>

          <form onSubmit={handleUpdateDisplayName} className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อผู้ใช้
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="กรอกชื่อผู้ใช้"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={savingName || !displayName}
                className="w-full bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Icon icon={FiSave} />
                {savingName ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
              </button>
            </div>
          </form>
        </div>

        {/* Update Password */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Icon icon={FiLock} size={24} className="text-gray-700" />
              <h2 className="text-xl font-bold text-gray-900">
                เปลี่ยนรหัสผ่าน
              </h2>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              อัปเดตรหัสผ่านของคุณ
            </p>
          </div>

          <form onSubmit={handleUpdatePassword} className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  รหัสผ่านใหม่
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="กรอกรหัสผ่านใหม่"
                  required
                  minLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">
                  รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ยืนยันรหัสผ่านใหม่
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                  required
                  minLength={6}
                />
              </div>

              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-sm text-red-600">
                  รหัสผ่านไม่ตรงกัน
                </p>
              )}

              <button
                type="submit"
                disabled={
                  savingPassword ||
                  !newPassword ||
                  !confirmPassword ||
                  newPassword !== confirmPassword
                }
                className="w-full bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Icon icon={FiLock} />
                {savingPassword ? "กำลังเปลี่ยน..." : "เปลี่ยนรหัสผ่าน"}
              </button>
            </div>
          </form>
        </div>

        {/* Account Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-2">
            💡 เกี่ยวกับบัญชีของคุณ
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• อีเมล: {user?.email}</li>
            <li>• สมาชิก: {user?.tier || "free"}</li>
            <li>
              • หากต้องการเปลี่ยนรหัสผ่าน แนะนำให้ออกจากระบบแล้วเข้าสู่ระบบใหม่ก่อน
            </li>
          </ul>
        </div>
      </div>
    </ProfileLayout>
  );
};

export default SettingsPage;
