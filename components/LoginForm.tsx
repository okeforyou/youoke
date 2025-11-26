import { useRouter } from "next/router";
import { useRef, useState } from "react";

import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

import { useAuth } from "../context/AuthContext";
import { LoginType } from "../types/AuthTypes";
import Alert, { AlertHandler } from "./Alert";

const LoginForm = () => {
  const [data, setData] = useState<LoginType>({
    email: "",
    password: "",
  });

  // Use the signIn method from the AuthContext
  const { logIn, signInWithGoogle } = useAuth();
  const router = useRouter();
  const errRef = useRef<AlertHandler>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleLogin = async (e: any) => {
    e.preventDefault();
    try {
      await logIn(data.email, data.password);
      router.push("/");
    } catch (error: any) {
      errRef.current.open();
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      router.push("/");
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      errRef.current.open();
      setGoogleLoading(false);
    }
  };

  // Destructure data from the data object
  const { ...allData } = data;

  // Disable submit button until all fields are filled in
  const canSubmit = [...Object.values(allData)].every(Boolean);

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
        <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-4 py-8 shadow-md dark:border-gray-700 dark:bg-gray-800 sm:p-6 sm:py-10 md:p-8 md:py-14">
          <Alert
            ref={errRef}
            timer={2500}
            headline="Error"
            headlineColor="text-red-600"
            bgColor="bg-red-100"
            content={<span className="text-sm">เข้าสู่ระบบไม่สำเร็จ</span>}
            icon={<ExclamationCircleIcon />}
          />

          <form action="" onSubmit={handleLogin} className="group">
            <div className="flex justify-center items-center">
              <img src="icon-512.png" alt="icon" width={120} height={120} />
            </div>
            <div className="mb-5">
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
              >
                อีเมล
              </label>
              <input
                type="email"
                name="email"
                id="email"
                className="valid:[&:not(:placeholder-shown)]:border-gray-300 [&:not(:placeholder-shown):not(:focus):invalid~span]:block invalid:[&:not(:placeholder-shown):not(:focus)]:border-red-400 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 placeholder-gray-300 focus:border-gray-300 focus:outline-none dark:border-gray-500 dark:bg-gray-600 dark:text-white dark:placeholder-gray-400"
                autoComplete="off"
                required
                pattern="[a-z0-9._+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                placeholder="name@gmail.com"
                onChange={(e: any) => {
                  setData({
                    ...data,
                    email: e.target.value,
                  });
                }}
              />
              <span className="mt-1 hidden text-sm text-red-400">
                โปรดใส่อีเมล
              </span>
            </div>
            <div className="mb-5">
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
              >
                รหัสผ่าน
              </label>
              <input
                type="password"
                name="password"
                id="password"
                placeholder="••••••••"
                className="valid:[&:not(:placeholder-shown)]:border-gray-300 [&:not(:placeholder-shown):not(:focus):invalid~span]:block invalid:[&:not(:placeholder-shown):not(:focus)]:border-red-400 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 placeholder-gray-300 focus:border-gray-300 focus:outline-none focus:ring-primary dark:border-gray-500 dark:bg-gray-600 dark:text-white dark:placeholder-gray-400"
                required
                onChange={(e: any) => {
                  setData({
                    ...data,
                    password: e.target.value,
                  });
                }}
              />
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="btn btn-primary mb-8 mt-2 w-full rounded-lg px-5 py-3 text-center text-sm font-medium text-white focus:outline-none focus:ring-4 focus:ring-primary disabled:cursor-not-allowed disabled:bg-gray-100  disabled:text-gray-400 group-invalid:pointer-events-none group-invalid:bg-gray-100 group-invalid:text-gray-400 group-invalid:opacity-70"
            >
              เข้าสู่ระบบ
            </button>
          </form>
          <button
            onClick={() => {
              router.push("/register");
            }}
            className="btn  btn-primary  mb-8 mt-2 w-full rounded-lg px-5 py-3 text-center text-sm font-medium text-white focus:outline-none focus:ring-4    group-invalid:pointer-events-none group-invalid:bg-gray-100 group-invalid:text-gray-400 group-invalid:opacity-70"
          >
            สมัครสมาชิก
          </button>

          <div className="flex items-center my-4">
            <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
            <span className="px-4 text-sm text-gray-500 dark:text-gray-400">หรือ</span>
            <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="flex items-center justify-center gap-3 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-5 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-4 focus:ring-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {googleLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700 dark:border-gray-200"></div>
                <span>กำลังเข้าสู่ระบบ...</span>
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
                <span>เข้าสู่ระบบด้วย Google</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
