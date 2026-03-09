import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { ChevronLeft, Save, User, Mail, Camera } from "lucide-react";
import { useAuthStore } from "@/modules/auth/useAuthStore";
import { db } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { auth } from "@/firebase";

export default function EditProfilePage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [displayName, setDisplayName] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (user) {
            setDisplayName(user.displayName || "");
        }
    }, [user]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.uid || !displayName.trim()) return;

        setLoading(true);
        setMessage("");

        try {
            // Update Auth Profile
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, {
                    displayName: displayName.trim()
                });
            }

            // Update Firestore Profile
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                displayName: displayName.trim(),
                updatedAt: new Date()
            });

            setMessage("บันทึกข้อมูลเรียบร้อยแล้ว");
            setTimeout(() => {
                router.back();
            }, 1500);
        } catch (error) {
            console.error("Error updating profile:", error);
            setMessage("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ChevronLeft className="w-6 h-6 text-gray-600" />
                </button>
                <h1 className="text-lg font-bold text-gray-900">แก้ไขข้อมูลส่วนตัว</h1>
                <div className="w-10"></div> {/* Spacer */}
            </header>

            <main className="flex-1 p-6 max-w-md mx-auto w-full">
                <form onSubmit={handleSave} className="space-y-8">
                    {/* Avatar Selection (Placeholder for now) */}
                    <div className="flex flex-col items-center">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center ring-4 ring-white shadow-lg overflow-hidden">
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-10 h-10 text-primary" />
                                )}
                            </div>
                            <button type="button" className="absolute -bottom-2 -right-2 bg-primary text-white p-2 rounded-xl shadow-lg border-2 border-white hover:scale-105 transition-transform">
                                <Camera className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-4">แตะเพื่อเปลี่ยนรูป</p>
                    </div>

                    <div className="space-y-4">
                        {/* Name Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">ชื่อที่แสดงผล</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                    <User className="w-4 h-4" />
                                </div>
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="ใส่ชื่อของคุณที่นี่"
                                    className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                                    required
                                />
                            </div>
                        </div>

                        {/* Email Info (Read-only) */}
                        <div className="space-y-2 opacity-60">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">อีเมลผู้ใช้งาน (ไม่สามารถเปลี่ยนได้)</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <input
                                    type="email"
                                    value={user.email || ""}
                                    readOnly
                                    className="w-full bg-gray-100 border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </div>

                    {message && (
                        <div className={`p-4 rounded-xl text-xs font-bold text-center ${message.includes('สำเร็จ') || message.includes('เรียบร้อย') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-white rounded-2xl py-4 font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <span className="loading loading-spinner loading-sm"></span>
                        ) : (
                            <>
                                <Save className="w-5 h-5" /> บันทึกข้อมูล
                            </>
                        )}
                    </button>
                </form>
            </main>
        </div>
    );
}
