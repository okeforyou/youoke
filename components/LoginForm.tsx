import { useRouter } from "next/router";
import { useRef, useState } from "react";
import Image from "next/image";

import {
  ExclamationCircleIcon,
  EnvelopeIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";

import { useAuth } from "../context/AuthContext";
import { LoginType } from "../types/AuthTypes";
import Alert, { AlertHandler } from "./Alert";
import Input from "./ui/Input";

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
      console.error('❌ Login error:', error);
      console.error('❌ Error code:', error?.code);
      console.error('❌ Error message:', error?.message);
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
    <div className="w-full max-w-md mx-auto">
      <div className="flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full">
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

            <Input
              type="email"
              label="อีเมล"
              name="email"
              id="email"
              placeholder="name@gmail.com"
              value={data.email}
              onChange={(e: any) => {
                setData({
                  ...data,
                  email: e.target.value,
                });
              }}
              leftIcon={<EnvelopeIcon className="w-5 h-5" />}
              autoComplete="off"
              required
              containerClassName="mb-5"
            />
            <Input
              type="password"
              label="รหัสผ่าน"
              name="password"
              id="password"
              placeholder="••••••••"
              value={data.password}
              onChange={(e: any) => {
                setData({
                  ...data,
                  password: e.target.value,
                });
              }}
              leftIcon={<LockClosedIcon className="w-5 h-5" />}
              required
              containerClassName="mb-5"
            />

            <button
              type="submit"
              disabled={!canSubmit}
              className="btn btn-primary mb-8 mt-2 w-full rounded-lg px-5 py-3 text-center text-sm font-medium text-white focus:outline-none focus:ring-4 focus:ring-primary disabled:cursor-not-allowed disabled:bg-gray-100  disabled:text-gray-400 group-invalid:pointer-events-none group-invalid:bg-gray-100 group-invalid:text-gray-400 group-invalid:opacity-70 btn-hover"
            >
              เข้าสู่ระบบ
            </button>
          </form>
          <button
            onClick={() => {
              window.open('https://line.me/R/ti/p/@243lercy', '_blank');
            }}
            className="btn  btn-primary  mb-8 mt-2 w-full rounded-lg px-5 py-3 text-center text-sm font-medium text-white focus:outline-none focus:ring-4    group-invalid:pointer-events-none group-invalid:bg-gray-100 group-invalid:text-gray-400 group-invalid:opacity-70 btn-hover"
          >
            สมัครสมาชิก
          </button>




        </div>
      </div>
    </div>
  );
};

export default LoginForm;
