import { useState } from "react";
import { useRouter } from "next/router";
import { EnvelopeIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import SimpleLayout from "../../components/SimpleLayout";
import { useAuth } from "../../context/AuthContext";
import { createUserProfile } from "../../services/userService";

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, signInWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const userCredential = await signUp(email, password);
      const user = userCredential.user;

      // Create user profile
      await createUserProfile({
        uid: user.uid,
        email: email,
        fullName: email.split("@")[0],
        phone: "",
        plan: "free",
      });

      router.push("/");
    } catch (error: any) {
      console.error("Register error:", error);
      if (error.code === "auth/email-already-in-use") {
        setError("อีเมลนี้ถูกใช้งานแล้ว");
      } else {
        setError("ไม่สามารถสมัครสมาชิกได้ กรุณาลองใหม่อีกครั้ง");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    setError("");

    try {
      const userCredential = await signInWithGoogle();
      const user = userCredential.user;

      // Check if user profile exists
      const { getUserProfile } = await import("../../services/userService");
      const existingProfile = await getUserProfile(user.uid);

      if (!existingProfile) {
        await createUserProfile({
          uid: user.uid,
          email: user.email || "",
          fullName: user.displayName || "ผู้ใช้ Google",
          phone: "",
          plan: "free",
        });
      }

      router.push("/");
    } catch (error: any) {
      console.error("Google register error:", error);
      setError("ไม่สามารถสมัครสมาชิกด้วย Google ได้");
    } finally {
      setGoogleLoading(false);
    }
  };

  const passwordsMatch = !confirmPassword || password === confirmPassword;

  return (
    <SimpleLayout>
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Header with Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary mb-4">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">สมัครสมาชิก</h1>
        </div>

        {/* Register Form */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          {error && (
            <div className="alert alert-error shadow-sm">
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleEmailRegister} className="space-y-4">
            {/* Email */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">
                  <EnvelopeIcon className="w-4 h-4 inline mr-1" />
                  อีเมล
                </span>
              </label>
              <input
                type="email"
                placeholder="name@gmail.com"
                className="input input-bordered w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">
                  <LockClosedIcon className="w-4 h-4 inline mr-1" />
                  รหัสผ่าน
                </span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="input input-bordered w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <label className="label">
                <span className="label-text-alt text-gray-500">
                  อย่างน้อย 6 ตัวอักษร
                </span>
              </label>
            </div>

            {/* Confirm Password */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">
                  <LockClosedIcon className="w-4 h-4 inline mr-1" />
                  ยืนยันรหัสผ่าน
                </span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className={`input input-bordered w-full ${
                  !passwordsMatch ? "input-error" : ""
                }`}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {!passwordsMatch && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    รหัสผ่านไม่ตรงกัน
                  </span>
                </label>
              )}
            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={loading || !email || !password || !passwordsMatch}
              className="btn btn-primary w-full"
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner"></span>
                  กำลังสมัครสมาชิก...
                </>
              ) : (
                "สมัครสมาชิก"
              )}
            </button>
          </form>

          <div className="divider text-sm">หรือ</div>

          {/* Google Register Button */}
          <button
            type="button"
            onClick={handleGoogleRegister}
            disabled={googleLoading}
            className="btn btn-outline w-full gap-2"
          >
            {googleLoading ? (
              <>
                <span className="loading loading-spinner"></span>
                กำลังสมัครสมาชิก...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>สมัครด้วย Google</span>
              </>
            )}
          </button>

          {/* Login Link */}
          <div className="text-center text-sm pt-2">
            <span className="text-gray-600">มีบัญชีอยู่แล้ว? </span>
            <button
              type="button"
              onClick={() => router.push("/profile/login")}
              className="link link-primary"
            >
              เข้าสู่ระบบ
            </button>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800 text-center">
            ✨ สมัครเสร็จแล้วใช้งานได้เลย!
          </p>
        </div>
      </div>
    </SimpleLayout>
  );
}
