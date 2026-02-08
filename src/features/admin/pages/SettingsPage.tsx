import { useEffect } from "react";
import { useRouter } from "next/router";

const SettingsPage = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/config");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500 animate-pulse">Redirecting to System Config...</p>
    </div>
  );
};

export default SettingsPage;
