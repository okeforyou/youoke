import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { CheckCircleIcon, SparklesIcon } from "@heroicons/react/24/solid";
import { PricingPackage } from "../types/subscription";
import { getPricingPackages } from "../services/pricingService";
import { useAuth } from "../context/AuthContext";

export default function PricingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [packages, setPackages] = useState<PricingPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPricing();
  }, []);

  async function loadPricing() {
    try {
      const data = await getPricingPackages();
      setPackages(data);
    } catch (error) {
      console.error("Error loading pricing:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleSelectPackage(pkg: PricingPackage) {
    if (pkg.id === "free") {
      // FREE plan - redirect to registration
      router.push("/register");
    } else {
      // Paid plans - redirect to registration with selected plan
      router.push(`/register?plan=${pkg.id}`);
    }
  }

  function formatPrice(price: number): string {
    return price.toLocaleString("th-TH");
  }

  function getPricePerMonth(pkg: PricingPackage): string {
    if (pkg.id === "free") return "ฟรี";
    if (pkg.id === "lifetime") return "ครั้งเดียว";
    if (pkg.id === "yearly") {
      const perMonth = Math.round(pkg.price / 12);
      return `${formatPrice(perMonth)}฿/เดือน`;
    }
    return `${formatPrice(pkg.price)}฿/เดือน`;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 via-base-100 to-base-200">
      {/* Header */}
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            เลือกแพ็กเกจที่เหมาะกับคุณ
          </h1>
          <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
            ร้องเพลงไม่จำกัด คุณภาพสูง ไม่มีโฆษณา
            <br />
            เลือกแพ็กเกจที่เหมาะกับการใช้งานของคุณ
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 ${
                pkg.popular ? "ring-4 ring-primary scale-105" : ""
              }`}
            >
              {/* Popular Badge */}
              {pkg.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="badge badge-primary badge-lg gap-1 px-4 py-3">
                    <SparklesIcon className="w-4 h-4" />
                    แนะนำ
                  </div>
                </div>
              )}

              <div className="card-body">
                {/* Package Name */}
                <h2 className="card-title text-2xl justify-center mb-2">
                  {pkg.name}
                </h2>

                {/* Price */}
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold text-primary">
                    {pkg.price === 0 ? (
                      "ฟรี"
                    ) : (
                      <>
                        {formatPrice(pkg.price)}
                        <span className="text-lg">฿</span>
                      </>
                    )}
                  </div>
                  <div className="text-sm text-base-content/60 mt-1">
                    {getPricePerMonth(pkg)}
                  </div>

                  {/* Discount Badge */}
                  {pkg.discount && (
                    <div className="badge badge-secondary badge-sm mt-2">
                      ประหยัด {pkg.discount.percentage}%
                    </div>
                  )}
                </div>

                {/* Duration */}
                <div className="text-center text-sm text-base-content/70 mb-4">
                  {pkg.duration === 0
                    ? "ตลอดชีพ"
                    : pkg.duration === 30
                    ? "30 วัน"
                    : pkg.duration === 365
                    ? "1 ปี"
                    : `${pkg.duration} วัน`}
                </div>

                <div className="divider my-2"></div>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircleIcon className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <div className="card-actions">
                  <button
                    onClick={() => handleSelectPackage(pkg)}
                    className={`btn w-full ${
                      pkg.popular
                        ? "btn-primary"
                        : pkg.id === "free"
                        ? "btn-outline"
                        : "btn-secondary"
                    }`}
                  >
                    {pkg.id === "free" ? "เริ่มใช้งานฟรี" : "เลือกแพ็กเกจนี้"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Payment Info */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h3 className="card-title text-xl mb-4">
                ข้อมูลการชำระเงิน
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">ธนาคารกสิกรไทย</h4>
                  <p className="text-sm text-base-content/70">
                    เลขที่บัญชี: 123-4-56789-0
                    <br />
                    ชื่อบัญชี: บริษัท โอเคฟอร์ยู จำกัด
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">ธนาคารไทยพาณิชย์</h4>
                  <p className="text-sm text-base-content/70">
                    เลขที่บัญชี: 987-6-54321-0
                    <br />
                    ชื่อบัญชี: บริษัท โอเคฟอร์ยู จำกัด
                  </p>
                </div>
              </div>
              <div className="alert alert-info mt-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="stroke-current shrink-0 w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <span className="text-sm">
                  หลังโอนเงินแล้ว กรุณาอัปโหลดหลักฐานการโอนเงินเพื่อรอการอนุมัติ
                  (ภายใน 24 ชั่วโมง)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-8">
            คำถามที่พบบ่อย
          </h3>
          <div className="join join-vertical w-full">
            <div className="collapse collapse-arrow join-item border border-base-300">
              <input type="radio" name="faq-accordion" defaultChecked />
              <div className="collapse-title text-lg font-medium">
                สามารถยกเลิกการสมัครได้หรือไม่?
              </div>
              <div className="collapse-content">
                <p className="text-base-content/70">
                  แพ็กเกจ MONTHLY และ YEARLY สามารถยกเลิกได้ตลอดเวลา
                  แต่จะไม่คืนเงิน แพ็กเกจ LIFETIME ไม่สามารถยกเลิกหรือคืนเงินได้
                </p>
              </div>
            </div>

            <div className="collapse collapse-arrow join-item border border-base-300">
              <input type="radio" name="faq-accordion" />
              <div className="collapse-title text-lg font-medium">
                ใช้เวลานานแค่ไหนในการอนุมัติการชำระเงิน?
              </div>
              <div className="collapse-content">
                <p className="text-base-content/70">
                  ปกติจะใช้เวลาภายใน 24 ชั่วโมง (วันทำการ)
                  หากเร็วกว่านั้นจะได้รับการอนุมัติทันที
                </p>
              </div>
            </div>

            <div className="collapse collapse-arrow join-item border border-base-300">
              <input type="radio" name="faq-accordion" />
              <div className="collapse-title text-lg font-medium">
                แพ็กเกจ LIFETIME ใช้ได้ตลอดจริงหรือ?
              </div>
              <div className="collapse-content">
                <p className="text-base-content/70">
                  ใช่ครับ! แพ็กเกจ LIFETIME ชำระเพียงครั้งเดียว
                  ใช้งานได้ตลอดชีพโดยไม่มีค่าใช้จ่ายเพิ่มเติม (คุ้มที่สุด!)
                </p>
              </div>
            </div>

            <div className="collapse collapse-arrow join-item border border-base-300">
              <input type="radio" name="faq-accordion" />
              <div className="collapse-title text-lg font-medium">
                ต่ออายุแพ็กเกจอย่างไร?
              </div>
              <div className="collapse-content">
                <p className="text-base-content/70">
                  เมื่อแพ็กเกจหมดอายุ คุณสามารถต่ออายุได้โดยเลือกแพ็กเกจใหม่และชำระเงินอีกครั้ง
                  ระบบจะแจ้งเตือนล่วงหน้าก่อนหมดอายุ 7 วัน
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-12">
          <button
            onClick={() => router.push("/")}
            className="btn btn-ghost btn-sm"
          >
            ← กลับหน้าหลัก
          </button>
        </div>
      </div>
    </div>
  );
}
