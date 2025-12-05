import { useRouter } from "next/router";
import { XMarkIcon, SparklesIcon } from "@heroicons/react/24/solid";

interface GuestLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  playedCount: number;
  guestLimit: number;
}

export default function GuestLimitModal({
  isOpen,
  onClose,
  playedCount,
  guestLimit,
}: GuestLimitModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  function handleRegister() {
    router.push("/pricing");
  }

  function handleLogin() {
    router.push("/login");
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in" />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-base-100 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 btn btn-ghost btn-sm btn-circle"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
              <SparklesIcon className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center mb-2">
            คุณฟังครบ {guestLimit} เพลงแล้ว!
          </h2>

          {/* Description */}
          <p className="text-center text-base-content/70 mb-6">
            สมัครสมาชิกเพื่อฟังเพลงไม่จำกัด
            <br />
            <span className="text-primary font-semibold">
              เริ่มต้นเพียง 99 บาท/เดือน
            </span>
          </p>

          {/* Features */}
          <div className="bg-base-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold mb-3 text-sm text-base-content/80">
              สิทธิพิเศษสำหรับสมาชิก:
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                <span>ฟังเพลงไม่จำกัด</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                <span>ไม่มีโฆษณา</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                <span>คุณภาพวิดีโอสูงสุด 1080p</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                <span>บันทึก Playlist ไม่จำกัด</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleRegister}
              className="btn btn-primary btn-block gap-2"
            >
              <SparklesIcon className="w-5 h-5" />
              สมัครสมาชิก
            </button>
            <button
              onClick={handleLogin}
              className="btn btn-ghost btn-block"
            >
              เข้าสู่ระบบ
            </button>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-base-content/50 mt-4">
            หรือกลับมาฟังใหม่ในอีก 24 ชั่วโมง
          </p>
        </div>
      </div>
    </>
  );
}
