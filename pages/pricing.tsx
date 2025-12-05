import { useRouter } from "next/router";
import { CheckCircleIcon, SparklesIcon, ArrowLeftIcon } from "@heroicons/react/24/solid";
import Head from "next/head";

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
      "คุณภาพวิดีโอสูงสุด 1080p",
      "บันทึก Playlist ไม่จำกัด",
      "รองรับ Cast ข้ามอุปกรณ์",
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
      "ประหยัดกว่า 17% (198 บาท/ปี)",
      "รองรับ 3 อุปกรณ์พร้อมกัน",
      "ดาวน์โหลดเพลงฟังออฟไลน์",
      "ไม่ต้องกังวลเรื่องต่ออายุทุกเดือน",
    ],
    popular: true,
  },
];

export default function PricingSimplePage() {
  const router = useRouter();

  function handleSelectPackage(packageId: string) {
    router.push(`/register?plan=${packageId}`);
  }

  function formatPrice(price: number): string {
    return price.toLocaleString("th-TH");
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
            onClick={() => router.push("/")}
            className="btn btn-ghost btn-sm gap-2 mb-8"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            กลับหน้าหลัก
          </button>

          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              เลือกแพ็กเกจที่เหมาะกับคุณ
            </h1>
            <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
              ร้องเพลงไม่จำกัด คุณภาพสูง ไม่มีโฆษณา
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
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="badge badge-primary badge-lg gap-1 px-4 py-3">
                      <SparklesIcon className="w-4 h-4" />
                      คุ้มที่สุด
                    </div>
                  </div>
                )}

                <div className="card-body p-8">
                  {/* Package Name */}
                  <h2 className="card-title text-3xl justify-center mb-4">
                    {pkg.name}
                  </h2>

                  {/* Price */}
                  <div className="text-center mb-6">
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-5xl font-bold text-primary">
                        {formatPrice(pkg.price)}
                      </span>
                      <span className="text-2xl text-base-content/60">฿</span>
                    </div>
                    <div className="text-sm text-base-content/60 mt-2">
                      ({formatPrice(pkg.pricePerMonth)}฿/เดือน)
                    </div>

                    {/* Discount Badge */}
                    {pkg.discount && (
                      <div className="mt-3">
                        <div className="badge badge-secondary gap-1">
                          ประหยัด {formatPrice(pkg.saveAmount)}฿
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="divider my-4"></div>

                  {/* Features */}
                  <ul className="space-y-4 mb-8 flex-grow">
                    {pkg.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircleIcon className="w-6 h-6 text-success flex-shrink-0 mt-0.5" />
                        <span className="text-base">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSelectPackage(pkg.id)}
                    className={`btn btn-block btn-lg ${
                      pkg.popular ? "btn-primary" : "btn-secondary"
                    }`}
                  >
                    เลือกแพ็กเกจนี้
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Payment Info */}
          <div className="max-w-4xl mx-auto">
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

          {/* Simple FAQ */}
          <div className="mt-12 max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold">คำถามที่พบบ่อย</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="card bg-base-100">
                <div className="card-body">
                  <h4 className="font-semibold">
                    ใช้เวลานานแค่ไหนในการอนุมัติ?
                  </h4>
                  <p className="text-sm text-base-content/70">
                    ปกติภายใน 24 ชั่วโมง (วันทำการ)
                  </p>
                </div>
              </div>
              <div className="card bg-base-100">
                <div className="card-body">
                  <h4 className="font-semibold">
                    ยกเลิกหรือคืนเงินได้หรือไม่?
                  </h4>
                  <p className="text-sm text-base-content/70">
                    สามารถยกเลิกได้ตลอดเวลา แต่ไม่คืนเงิน
                  </p>
                </div>
              </div>
              <div className="card bg-base-100">
                <div className="card-body">
                  <h4 className="font-semibold">ต่ออายุอย่างไร?</h4>
                  <p className="text-sm text-base-content/70">
                    เมื่อหมดอายุ เลือกแพ็กเกจใหม่และชำระเงินอีกครั้ง
                  </p>
                </div>
              </div>
              <div className="card bg-base-100">
                <div className="card-body">
                  <h4 className="font-semibold">ลองใช้ฟรีได้ไหม?</h4>
                  <p className="text-sm text-base-content/70">
                    Guest ฟังได้ 3 เพลง/วัน ไม่ต้องสมัคร
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
