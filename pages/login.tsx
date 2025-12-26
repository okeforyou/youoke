import Head from "next/head";
import MainLayout from "../components/layout/MainLayout";
import LoginForm from "../components/LoginForm";

export default function Home() {
  return (
    <>
      <Head>
        <title>เข้าสู่ระบบ - YouOke Karaoke Online</title>
        <meta
          property="og:description"
          content="คาราโอเกะออนไลน์ฟรี ไม่ต้องติดตั้ง ทำงานโดยตรงในเบราว์เซอร์ ใช้ได้กับอุปกรณ์หลากหลาย ฐานข้อมูลเพลงจาก Youtube ครบถ้วนและมีคุณภาพสูง"
        />
      </Head>

      <MainLayout centered maxWidth="md" activeTab={undefined}>
        <LoginForm />
      </MainLayout>
    </>
  );
}
