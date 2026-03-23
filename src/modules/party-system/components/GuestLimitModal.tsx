import { useRouter } from "next/router";
import { XMarkIcon, SparklesIcon, LockClosedIcon } from "@heroicons/react/24/solid";
import { useAuthStore } from "@/modules/auth/useAuthStore";

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
  const { user } = useAuthStore();
  const isLoggedIn = !!user;
  const isExpired = user?.membership?.status === 'expired';

  if (!isOpen) return null;

  function handleRegister() {
    // If guest, go to login (which will trigger 1-day trial via Google)
    // If already logged in but expired, go to pricing
    if (!isLoggedIn) {
      router.push("/login");
    } else {
      router.push("/pricing");
    }
  }

  function handleLogin() {
    router.push("/login");
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] animate-fade-in" />

      {/* Modal */}
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
        <div className="bg-base-100 rounded-3xl shadow-2xl max-w-md w-full p-8 border border-white/10 animate-scale-in relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 blur-3xl rounded-full" />
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 btn btn-ghost btn-sm btn-circle text-base-content/50 hover:text-base-content"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 rotate-3">
              {isLoggedIn ? (
                <SparklesIcon className="w-10 h-10 text-white" />
              ) : (
                <LockClosedIcon className="w-10 h-10 text-white" />
              )}
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center mb-3">
            {isLoggedIn && isExpired 
              ? "สิทธิรักษาการพรีเมียมส่วนตัวหมดอายุแล้ว!" 
              : `คุณฟังครบ ${guestLimit} เพลงแล้ว!`}
          </h2>

          {/* Description */}
          <p className="text-center text-base-content/70 mb-8 leading-relaxed">
            {!isLoggedIn ? (
              <>
                กรุณาใช้บัญชี <span className="text-primary font-bold">YouTube (Gmail)</span> ของคุณ
                <br />
                เพื่อรับสิทธิการเข้าถึงแบบส่วนบุคคลผ่าน YouOke
                <br />
                <span className="text-secondary font-semibold">
                  และเริ่มต้นการเล่นผ่านบัญชีของคุณแบบไร้โฆษณาคั่น 🔐✨
                </span>
              </>
            ) : (
              <>
                สิทธิการใช้งานแบบพรีเมียมส่วนบุคคลของคุณสิ้นสุดแล้ว
                <br />
                กรุณาเลือกแพ็กเกจที่คุณต้องการ
                <br />
                <span className="text-primary font-semibold">เพื่อขยับขยายเวลาความสุขกับ YouOke 🎵⏳</span>
              </>
            )}
          </p>

          {/* Features Highlights */}
          <div className="bg-base-200/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/5">
            <h3 className="font-bold mb-4 text-xs uppercase tracking-wider text-base-content/40">
              สิทธิที่จะได้รับเมื่อเชื่อมต่อ:
            </h3>
            <ul className="grid grid-cols-1 gap-3 text-sm">
              <li className="flex items-center gap-3">
                <div className="flex-none w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-success rounded-full" />
                </div>
                <span className="font-medium">เล่นวิดีโอผ่านบัญชีของคุณเอง (ไร้โฆษณา)</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="flex-none w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-success rounded-full" />
                </div>
                <span className="font-medium">เชื่อมต่อสิทธิ Playlist โดยตรงจากบัญชี YouTube</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="flex-none w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-success rounded-full" />
                </div>
                <span className="font-medium">ระบบแคสต์ (Cast) ขึ้นจอภาพภายนอก</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleRegister}
              className="btn btn-primary btn-block btn-lg gap-2 shadow-xl shadow-primary/20"
            >
              {!isLoggedIn ? (
                <>
                  <SparklesIcon className="w-5 h-5" />
                  เชื่อมต่อบัญชี YouTube (Gmail)
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5" />
                  เลือกแพ็กเกจพรีเมียม
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-block text-base-content/50"
            >
              กลับไปหน้าสำรวจ (แบบจำกัด)
            </button>
          </div>

          {/* Footer */}
          {!isLoggedIn && (
            <p className="text-center text-xs text-base-content/40 mt-6 italic">
              * บัญชี YouTube ของคุณจะถูกใช้เพื่อยืนยันสิทธิการเล่นวิดีโอเท่านั้น
            </p>
          )}
        </div>
      </div>
    </>
  );
}
