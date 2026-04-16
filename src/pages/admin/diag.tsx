import Head from "next/head";
import { useState, useEffect } from "react";
import AdminLayout from '@/features/admin/layouts/AdminLayout';
import { ShieldCheck, ShieldAlert, Activity, Server, Database, Key } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminDiagPage() {
    const [diagData, setDiagData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const runCheck = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/debug-env');
            const data = await res.json();
            setDiagData(data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        runCheck();
    }, []);

    const StatusCard = ({ title, status, description, icon: Icon, color }: any) => (
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
                <div className={cn("p-3 rounded-2xl", color)}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h3 className="text-lg font-black text-gray-900">{title}</h3>
                    <div className={cn("text-[10px] font-black uppercase tracking-widest", status === 'OK' ? 'text-emerald-500' : 'text-rose-500')}>
                        Status: {status}
                    </div>
                </div>
            </div>
            <p className="text-sm text-gray-500 font-medium leading-relaxed">{description}</p>
        </div>
    );

    return (
        <AdminLayout headerTitle="วินิจฉัยระบบ (Diagnostics)">
            <Head>
                <title>ระบบวินิจฉัย - YouOke Admin</title>
            </Head>

            <div className="max-w-4xl mx-auto">
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900">ตัวเช็คสุขภาพระบบ (Plesk vs Vercel)</h1>
                        <p className="text-sm text-gray-500 font-medium">ใช้ตรวจสอบว่าทำไมระบบบางอย่างถึงทำงานไม่ได้บน Server นี้</p>
                    </div>
                    <button 
                        onClick={runCheck}
                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                    >
                        ตรวจสอบอีกครั้ง
                    </button>
                </div>

                {loading ? (
                    <div className="p-20 text-center">
                        <span className="loading loading-spinner text-indigo-600"></span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Admin SDK Status */}
                        <StatusCard 
                            title="Firebase Admin SDK"
                            status={diagData?.adminConfigured ? 'OK' : 'FAIL'}
                            color={diagData?.adminConfigured ? 'bg-emerald-500' : 'bg-rose-500'}
                            icon={ShieldCheck}
                            description={diagData?.adminConfigured 
                                ? "ระบบหลังบ้านเชื่อมต่อ Firebase สำเร็จ (สามารถ เพิ่ม/ลบ สมาชิกได้)" 
                                : "ระบบหลังบ้านเชื่อมต่อไม่ได้! ส่วนมากเกิดจากขาด FIREBASE_PRIVATE_KEY"}
                        />

                        {/* Firestore Connection */}
                        <StatusCard 
                            title="การเชื่อมต่อฐานข้อมูล"
                            status={diagData?.adminTestResult?.startsWith('Success') ? 'OK' : 'FAIL'}
                            color={diagData?.adminTestResult?.startsWith('Success') ? 'bg-indigo-500' : 'bg-amber-500'}
                            icon={Database}
                            description={`ผลการทดสอบ: ${diagData?.adminTestResult}`}
                        />

                        {/* Project ID Check */}
                        <div className="md:col-span-2 bg-slate-900 p-8 rounded-[40px] text-white shadow-2xl">
                            <div className="flex items-center gap-3 mb-6">
                                <Server className="text-indigo-400" />
                                <h3 className="text-xl font-black">Environment Details</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-1">Active Admin Project</label>
                                        <code className="text-indigo-300 font-mono text-lg">{diagData?.adminProjectId}</code>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-1">Auth Credentials Source</label>
                                        <div className="text-[10px] text-slate-400 font-mono break-all">{diagData?.adminClientEmail}</div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-1">Has Private Key?</label>
                                        <span className={cn("inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase", diagData?.env?.HAS_PRIVATE_KEY ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400')}>
                                            {diagData?.env?.HAS_PRIVATE_KEY ? 'YES' : 'NO / MISSING'}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-1">ENV Project ID</label>
                                        <code className="text-slate-400 font-mono text-xs">{diagData?.env?.PROJECT_ID}</code>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-1">Server Info</label>
                                        <div className="text-[10px] text-slate-500 font-medium">Node: {diagData?.env?.NODE_ENV}</div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-1">Private Key Preview (Safety)</label>
                                        <code className="text-slate-600 font-mono text-[10px]">{diagData?.env?.PRIVATE_KEY_START}</code>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t border-slate-800">
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                    <span className="text-amber-400 font-bold">⚠️ วิธีแก้ไข:</span> หากพบว่า Private Key เป็น NO หรือ Project ID ไม่ถูกต้อง ให้ทำการเพิ่มตัวแปรลงในไฟล์ <code className="text-white">.env</code> ในโฟลเดอร์หลักของ Plesk หรือตั้งค่าผ่านหน้าจัดการ Application ของ Plesk ครับ
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
