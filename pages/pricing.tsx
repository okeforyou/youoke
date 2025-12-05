import { useRouter } from "next/router";
import { CheckCircleIcon, ArrowLeftIcon } from "@heroicons/react/24/solid";
import Head from "next/head";
import { useAuth } from "../context/AuthContext";

const SIMPLE_PACKAGES = [
  {
    id: "monthly",
    name: "รายเดือน",
    price: 99,
    duration: 30,
    pricePerMonth: 99,
    features: [
      "ฟังเพลงไม่จำกัด",
      "ไม่มีโฆษณา",
      "คุณภาพ HD 1080p",
    ],
    popular: false,
  },
  {
    id: "yearly",
    name: "รายปี",
    price: 990,
    duration: 365,
    pricePerMonth: 83, // 990 / 12 = 82.5
    discount: 17,
    saveAmount: 198, // (99 * 12) - 990
    features: [
      "ทุกฟีเจอร์แบบรายเดือน",
      "ประหยัดกว่า 17%",
      "ใช้ได้ 3 อุปกรณ์",
    ],
    popular: true,
  },
];

export default function PricingSimplePage() {
  const router = useRouter();
  const { user } = useAuth();

  function handleSelectPackage(packageId: string) {
    router.push(`/register?plan=${packageId}`);
  }

  function formatPrice(price: number): string {
    return price.toLocaleString("th-TH");
  }

  function handleBack() {
    // If logged in, go back to account menu. Otherwise, go to home.
    if (user?.uid) {
      router.push("/account");
    } else {
      router.push("/");
    }
  }

  return (
    <>
      <Head>
        <title>เลือกแพ็กเกจ - Oke for You คาราโอเกะออนไลน์</title>
        <meta
          property="og:description"
          content="สมัครสมาชิก ฟังเพลงไม่จำกัด ไม่มีโฆษณา เริ่มต้นเพียง 99 บาท/เดือน"
        />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-base-200 via-base-100 to-base-200">
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="btn btn-ghost btn-sm gap-2 mb-8"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            {user?.uid ? "กลับ" : "กลับหน้าหลัก"}
          </button>

          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              เลือกแพ็กเกจที่เหมาะกับคุณ
            </h1>
            <p className="text-base text-base-content/60">
              ฟังเพลงไม่จำกัด ไม่มีโฆษณา
            </p>
          </div>

          {/* Pricing Cards - 2 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
            {SIMPLE_PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className={`card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 ${
                  pkg.popular ? "ring-4 ring-primary md:scale-105" : ""
                }`}
              >
                {/* Popular Badge */}
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="badge badge-warning badge-md px-3 py-2 font-semibold">
                      คุ้มที่สุด
                    </div>
                  </div>
                )}

                <div className="card-body p-6">
                  {/* Package Name */}
                  <h2 className="text-2xl font-bold text-center mb-4">
                    {pkg.name}
                  </h2>

                  {/* Price */}
                  <div className="text-center mb-6">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold text-primary">
                        {formatPrice(pkg.price)}
                      </span>
                      <span className="text-xl text-base-content/60">฿</span>
                    </div>
                    {pkg.id === "yearly" && (
                      <div className="text-sm text-base-content/50 mt-1">
                        {formatPrice(pkg.pricePerMonth)}฿/เดือน
                      </div>
                    )}
                  </div>

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
                  <button
                    onClick={() => handleSelectPackage(pkg.id)}
                    className={`btn btn-block ${
                      pkg.popular ? "btn-primary" : "btn-neutral"
                    }`}
                  >
                    เลือกแพ็กเกจนี้
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Payment Info */}
          <div className="max-w-3xl mx-auto">
            <div className="card bg-base-200/50">
              <div className="card-body p-6 text-center">
                <p className="text-sm text-base-content/70">
                  หลังเลือกแพ็กเกจ คุณจะได้รับรายละเอียดการชำระเงิน
                  <br />
                  <span className="text-base-content/60">อนุมัติภายใน 24 ชั่วโมง</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
