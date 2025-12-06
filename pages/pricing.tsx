import { useRouter } from "next/router";
import { XMarkIcon } from "@heroicons/react/24/solid";
import Head from "next/head";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

const PACKAGES = [
  {
    id: "monthly",
    name: "รายเดือน",
    price: "฿99",
    duration: "/เดือน",
  },
  {
    id: "yearly",
    name: "รายปี",
    price: "฿999",
    duration: "/ปี",
    badge: "คุ้มที่สุด",
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState("yearly");

  function handleClose() {
    if (user?.uid) {
      router.push("/account");
    } else {
      router.push("/");
    }
  }

  function handleContinue() {
    router.push(`/register?plan=${selectedPlan}`);
  }

  return (
    <>
      <Head>
        <title>เลือกแพ็กเกจ - Oke for You</title>
      </Head>

      <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="card bg-base-100 shadow-2xl">
            <div className="card-body p-6 relative">
              {/* Close Button */}
              <button
                onClick={handleClose}
                className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="text-center mb-6 mt-2">
                <h2 className="text-xl font-bold mb-2">เลือกแพ็กเกจของคุณ</h2>
                <p className="text-sm text-base-content/60">
                  ปลดล็อกทุกฟีเจอร์และเริ่มร้องคาราโอเกะแบบไม่มีขีดจำกัด!ใช้งานตั้งแต่
                </p>
              </div>

              {/* Package Options */}
              <div className="space-y-3 mb-6">
                {PACKAGES.map((pkg) => (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPlan(pkg.id)}
                    className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all ${
                      selectedPlan === pkg.id
                        ? "border-error bg-error/5"
                        : "border-base-300 hover:border-error/50"
                    }`}
                  >
                    {/* Badge */}
                    {pkg.badge && (
                      <div className="absolute -top-2 right-4">
                        <div className="badge badge-warning badge-sm px-2 py-1 font-medium">
                          {pkg.badge}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Radio Button */}
                        <input
                          type="radio"
                          name="plan"
                          checked={selectedPlan === pkg.id}
                          onChange={() => setSelectedPlan(pkg.id)}
                          className="radio radio-error"
                        />
                        <div>
                          <div className="font-medium">{pkg.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{pkg.price}</div>
                        <div className="text-xs text-base-content/60">{pkg.duration}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Continue Button */}
              <button
                onClick={handleContinue}
                className="btn btn-error btn-block btn-lg text-white"
              >
                ดำเนินการต่อ
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
