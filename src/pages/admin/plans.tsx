import SubscriptionsPage from "@/features/admin/pages/SubscriptionsPage";
import Head from "next/head";

export default function AdminPlansPage() {
    return (
        <>
            <Head>
                <title>จัดการแผนสมาชิก (Plans) - YouOke Admin</title>
            </Head>
            <SubscriptionsPage />
        </>
    );
}
