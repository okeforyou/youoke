import {
  collection,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  deleteDoc,
  Timestamp,
  query,
  orderBy,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { FiEdit2, FiCheck, FiX, FiEye, FiEyeOff, FiPlus, FiTrash2 } from "react-icons/fi";
import { GetServerSideProps } from "next";
import nookies from "nookies";

import Icon from "../../components/Icon";

import AdminLayout from "../../components/admin/AdminLayout";
import { db } from "../../firebase";
import { adminAuth, adminDb, adminFirestore } from "../../firebase-admin";

interface Plan {
  id: string;
  name: string;
  displayName: string;
  price: number;
  currency: string;
  duration: number | null;
  features: string[];
  maxRooms: number;
  maxSongsInQueue: number;
  isActive: boolean;
  isVisible: boolean;
}

interface Props {
  plans: Plan[];
  error?: string;
}

const SubscriptionsPage: React.FC<Props> = ({ plans: initialPlans, error }) => {
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [newPlan, setNewPlan] = useState<Omit<Plan, "id">>({
    name: "",
    displayName: "",
    price: 0,
    currency: "THB",
    duration: 30,
    features: [],
    maxRooms: 1,
    maxSongsInQueue: 10,
    isActive: true,
    isVisible: true,
  });


  const handleEditPlan = (plan: Plan) => {
    setEditingPlan({ ...plan });
  };

  const handleSavePlan = async () => {
    if (!editingPlan) return;

    try {
      const planRef = doc(db, "plans", editingPlan.id);
      await updateDoc(planRef, {
        displayName: editingPlan.displayName,
        price: editingPlan.price,
        duration: editingPlan.duration,
        features: editingPlan.features,
        maxRooms: editingPlan.maxRooms,
        maxSongsInQueue: editingPlan.maxSongsInQueue,
        isActive: editingPlan.isActive,
        isVisible: editingPlan.isVisible,
        updatedAt: Timestamp.now(),
      });

      alert("Plan updated successfully!");
      window.location.reload();
    } catch (error) {
      console.error("Error updating plan:", error);
      alert("Error updating plan");
    }
  };

  const togglePlanStatus = async (plan: Plan, field: "isActive" | "isVisible") => {
    try {
      const planRef = doc(db, "plans", plan.id);
      const newValue = !plan[field];
      await updateDoc(planRef, {
        [field]: newValue,
        updatedAt: Timestamp.now(),
      });

      window.location.reload();
    } catch (error) {
      console.error("Error updating plan:", error);
      alert("Error updating plan");
    }
  };

  const handleDeletePlan = async (plan: Plan) => {
    // Prevent deletion of core plans
    const corePlans = ["free", "monthly", "yearly", "lifetime"];
    if (corePlans.includes(plan.id)) {
      alert(`ไม่สามารถลบ Plan "${plan.displayName}" ได้\n\nนี่คือ Plan หลักของระบบ`);
      return;
    }

    if (!confirm(`ยืนยันการลบ Plan "${plan.displayName}"?\n\nการดำเนินการนี้ไม่สามารถยกเลิกได้`)) {
      return;
    }

    try {
      const planRef = doc(db, "plans", plan.id);
      await deleteDoc(planRef);

      alert("ลบ Plan เรียบร้อยแล้ว");
      window.location.reload();
    } catch (error) {
      console.error("Error deleting plan:", error);
      alert("เกิดข้อผิดพลาดในการลบ Plan");
    }
  };

  const handleCreatePlan = async () => {
    if (!newPlan.name || !newPlan.displayName) {
      alert("กรุณากรอก Plan ID และ Display Name");
      return;
    }

    try {
      const planRef = doc(db, "plans", newPlan.name);
      await setDoc(planRef, {
        ...newPlan,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      alert("Plan created successfully!");
      window.location.reload();
    } catch (error) {
      console.error("Error creating plan:", error);
      alert("Error creating plan");
    }
  };

  const addFeature = () => {
    if (!editingPlan) return;
    setEditingPlan({
      ...editingPlan,
      features: [...editingPlan.features, ""],
    });
  };

  const updateFeature = (index: number, value: string) => {
    if (!editingPlan) return;
    const newFeatures = [...editingPlan.features];
    newFeatures[index] = value;
    setEditingPlan({
      ...editingPlan,
      features: newFeatures,
    });
  };

  const removeFeature = (index: number) => {
    if (!editingPlan) return;
    setEditingPlan({
      ...editingPlan,
      features: editingPlan.features.filter((_, i) => i !== index),
    });
  };

  const addNewPlanFeature = () => {
    setNewPlan({
      ...newPlan,
      features: [...newPlan.features, ""],
    });
  };

  const updateNewPlanFeature = (index: number, value: string) => {
    const newFeatures = [...newPlan.features];
    newFeatures[index] = value;
    setNewPlan({
      ...newPlan,
      features: newFeatures,
    });
  };

  const removeNewPlanFeature = (index: number) => {
    setNewPlan({
      ...newPlan,
      features: newPlan.features.filter((_, i) => i !== index),
    });
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
            <h1 className="text-3xl font-bold text-gray-900">
              Subscription Plans
            </h1>
            <p className="text-gray-600 mt-1">
              จัดการแพ็คเกจสมาชิก ({plans.length} plans)
            </p>
          </div>
          <button
            onClick={() => setCreatingPlan(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <Icon icon={FiPlus} />
            Create New Plan
          </button>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-lg shadow-lg overflow-hidden border-2 ${
                plan.id === "yearly"
                  ? "border-green-500"
                  : plan.id === "lifetime"
                  ? "border-purple-500"
                  : "border-gray-200"
              }`}
            >
              {/* Plan Header */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
                <h3 className="text-2xl font-bold">{plan.displayName}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-lg ml-2">{plan.currency}</span>
                </div>
                {plan.duration && (
                  <p className="text-sm mt-1 opacity-90">
                    / {plan.duration} {plan.duration === 30 ? "วัน" : "วัน"}
                  </p>
                )}
                {!plan.duration && plan.id === "lifetime" && (
                  <p className="text-sm mt-1 opacity-90">ตลอดชีพ</p>
                )}
              </div>

              {/* Plan Features */}
              <div className="p-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Icon icon={FiCheck} className="text-green-500 mt-1 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Max Rooms:</span>
                    <span className="font-bold">{plan.maxRooms}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Max Songs:</span>
                    <span className="font-bold">{plan.maxSongsInQueue}</span>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="mt-6 flex gap-2">
                  <button
                    onClick={() => togglePlanStatus(plan, "isActive")}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      plan.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {plan.isActive ? "Active" : "Inactive"}
                  </button>
                  <button
                    onClick={() => togglePlanStatus(plan, "isVisible")}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      plan.isVisible
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {plan.isVisible ? <Icon icon={FiEye} /> : <Icon icon={FiEyeOff} />}
                  </button>
                </div>

                {/* Edit Button */}
                <button
                  onClick={() => handleEditPlan(plan)}
                  className="w-full mt-4 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Icon icon={FiEdit2} />
                  Edit Plan
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {editingPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Edit Plan: {editingPlan.displayName}
            </h2>

            <div className="space-y-4">
              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name (Thai)
                </label>
                <input
                  type="text"
                  value={editingPlan.displayName}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, displayName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Price & Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (THB)
                  </label>
                  <input
                    type="number"
                    value={editingPlan.price}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        price: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (days)
                  </label>
                  <input
                    type="number"
                    value={editingPlan.duration || ""}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        duration: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    placeholder="null = lifetime"
                  />
                </div>
              </div>

              {/* Max Rooms & Songs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Rooms
                  </label>
                  <input
                    type="number"
                    value={editingPlan.maxRooms}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        maxRooms: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Songs in Queue
                  </label>
                  <input
                    type="number"
                    value={editingPlan.maxSongsInQueue}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        maxSongsInQueue: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Features
                </label>
                <div className="space-y-2">
                  {editingPlan.features.map((feature, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => updateFeature(idx, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                      <button
                        onClick={() => removeFeature(idx)}
                        className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                      >
                        <Icon icon={FiX} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addFeature}
                    className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-red-500 hover:text-red-500 transition-colors"
                  >
                    + Add Feature
                  </button>
                </div>
              </div>

              {/* Status Toggles */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingPlan.isActive}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        isActive: e.target.checked,
                      })
                    }
                    className="rounded border-gray-300 text-red-500 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingPlan.isVisible}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        isVisible: e.target.checked,
                      })
                    }
                    className="rounded border-gray-300 text-red-500 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">Visible</span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              <div className="flex gap-3">
                <button
                  onClick={handleSavePlan}
                  className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingPlan(null)}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
              {!["free", "monthly", "yearly", "lifetime"].includes(editingPlan.id) && (
                <button
                  onClick={() => handleDeletePlan(editingPlan)}
                  className="w-full px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Icon icon={FiTrash2} />
                  Delete Plan
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Plan Modal */}
      {creatingPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Create New Plan
            </h2>

            <div className="space-y-4">
              {/* Plan ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plan ID (English, lowercase, no spaces)
                </label>
                <input
                  type="text"
                  value={newPlan.name}
                  onChange={(e) =>
                    setNewPlan({ ...newPlan, name: e.target.value.toLowerCase().replace(/\s/g, "_") })
                  }
                  placeholder="e.g., weekly, premium, vip"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will be used as the document ID in Firestore
                </p>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name (Thai)
                </label>
                <input
                  type="text"
                  value={newPlan.displayName}
                  onChange={(e) =>
                    setNewPlan({ ...newPlan, displayName: e.target.value })
                  }
                  placeholder="e.g., แพ็คเกจสัปดาห์"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Price & Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (THB)
                  </label>
                  <input
                    type="number"
                    value={newPlan.price}
                    onChange={(e) =>
                      setNewPlan({
                        ...newPlan,
                        price: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (days)
                  </label>
                  <input
                    type="number"
                    value={newPlan.duration || ""}
                    onChange={(e) =>
                      setNewPlan({
                        ...newPlan,
                        duration: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    placeholder="null = lifetime"
                  />
                </div>
              </div>

              {/* Max Rooms & Songs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Rooms
                  </label>
                  <input
                    type="number"
                    value={newPlan.maxRooms}
                    onChange={(e) =>
                      setNewPlan({
                        ...newPlan,
                        maxRooms: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Songs in Queue
                  </label>
                  <input
                    type="number"
                    value={newPlan.maxSongsInQueue}
                    onChange={(e) =>
                      setNewPlan({
                        ...newPlan,
                        maxSongsInQueue: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Features
                </label>
                <div className="space-y-2">
                  {newPlan.features.map((feature, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => updateNewPlanFeature(idx, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                      <button
                        onClick={() => removeNewPlanFeature(idx)}
                        className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                      >
                        <Icon icon={FiX} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addNewPlanFeature}
                    className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-red-500 hover:text-red-500 transition-colors"
                  >
                    + Add Feature
                  </button>
                </div>
              </div>

              {/* Status Toggles */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newPlan.isActive}
                    onChange={(e) =>
                      setNewPlan({
                        ...newPlan,
                        isActive: e.target.checked,
                      })
                    }
                    className="rounded border-gray-300 text-red-500 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newPlan.isVisible}
                    onChange={(e) =>
                      setNewPlan({
                        ...newPlan,
                        isVisible: e.target.checked,
                      })
                    }
                    className="rounded border-gray-300 text-red-500 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">Visible</span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreatePlan}
                className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Create Plan
              </button>
              <button
                onClick={() => setCreatingPlan(false)}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

// Server-Side Props
export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  console.log('🚀 [SSR] admin/subscriptions getServerSideProps started');

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

    // 3. Fetch plans from Firestore
    const plansSnapshot = await adminFirestore.collection('plans').get();
    const plansData: Plan[] = plansSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Plan[];

    console.log(`✅ [SSR] Fetched ${plansData.length} plans successfully`);

    return {
      props: {
        plans: plansData,
      },
    };
  } catch (error: any) {
    console.error('❌ [SSR] Error in getServerSideProps:', error);
    return {
      props: {
        plans: [],
        error: "เกิดข้อผิดพลาดในการโหลดข้อมูล",
      },
    };
  }
};

export default SubscriptionsPage;
