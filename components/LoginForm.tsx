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
  const { logIn } = useAuth();
  const router = useRouter();
  const errRef = useRef<AlertHandler>(null);

  const handleLogin = async (e: any) => {
    e.preventDefault();
    try {
      await logIn(data.email, data.password);
      router.push("/");
    } catch (error: any) {
      errRef.current.open();
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
              window.open("https://okeforyou.com/contact", "_blank");
            }}
            className="btn  btn-primary  mb-8 mt-2 w-full rounded-lg px-5 py-3 text-center text-sm font-medium text-white focus:outline-none focus:ring-4    group-invalid:pointer-events-none group-invalid:bg-gray-100 group-invalid:text-gray-400 group-invalid:opacity-70"
          >
            สมัครสมาชิก
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
