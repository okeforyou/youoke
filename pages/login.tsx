import Head from "next/head";

import LoginForm from "../components/LoginForm";

export default function Home() {
  return (
    <>
      <Head>
        <title>Login - Oke for You - คาราโอเกะออนไลน์บน YouTube</title>
        <meta
          property="og:description"
          content="คาราโอเกะออนไลน์ฟรี ไม่ต้องติดตั้ง ทำงานโดยตรงในเบราว์เซอร์ ใช้ได้กับอุปกรณ์หลากหลาย ฐานข้อมูลเพลงจาก Youtube ครบถ้วนและมีคุณภาพสูง 
          "
        />
      </Head>
      <main className="m-0 bg-gradient-to-br from-primary-color to-blue-400 px-4">
        <LoginForm />
      </main>
    </>
  );
}
