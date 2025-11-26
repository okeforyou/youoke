import {
  collection,
  getDocs,
  doc,
  updateDoc,
  Timestamp,
  query,
  orderBy,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { FiEdit2, FiCheck, FiX, FiEye, FiEyeOff } from "react-icons/fi";

import AdminLayout from "../../components/admin/AdminLayout";
import { db } from "../../firebase";

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

const SubscriptionsPage: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, "plans"));
      const plansData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Plan[];
      setPlans(plansData);
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setLoading(false);
    }
  };

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

      // Update local state
      setPlans((prev) =>
        prev.map((p) => (p.id === editingPlan.id ? editingPlan : p))
      );
      setEditingPlan(null);
      alert("Plan updated successfully!");
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

      // Update local state
      setPlans((prev) =>
        prev.map((p) => (p.id === plan.id ? { ...p, [field]: newValue } : p))
      );
    } catch (error) {
      console.error("Error updating plan:", error);
      alert("Error updating plan");
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Subscription Plans
            </h1>
            <p className="text-gray-600 mt-1">
              จัดการแพ็คเกจสมาชิก ({plans.length} plans)
            </p>
          </div>
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
                      <FiCheck className="text-green-500 mt-1 flex-shrink-0" />
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
                    {plan.isVisible ? <FiEye /> : <FiEyeOff />}
                  </button>
                </div>

                {/* Edit Button */}
                <button
                  onClick={() => handleEditPlan(plan)}
                  className="w-full mt-4 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                >
                  <FiEdit2 />
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
                        <FiX />
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
            <div className="flex gap-3 mt-6">
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
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default SubscriptionsPage;
