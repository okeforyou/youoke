import { useRouter } from "next/router";
import { ChevronLeft, Play, Search, Music, Mic2, Tv, Smartphone } from "lucide-react";
import { useUIStore } from "@/stores/useUIStore";

export default function TutorialPage() {
    const router = useRouter();
    const setProfileOpen = useUIStore(state => state.setProfileOpen);

    const handleBack = () => {
        setProfileOpen(true);
        router.back();
    };

    const guides = [
        {
            icon: Search,
            title: "ค้นหาเพลง",
            desc: "ใช้แถบค้นหาด้านบนเพื่อค้นหาเพลงโปรดตามชื่อเพลงหรือชื่อศิลปินที่คุณต้องการ",
            color: "bg-blue-500"
        },
        {
            icon: Play,
            title: "เพิ่มเข้าคิว",
            desc: "กดที่ชื่อเพลงเพื่อเพิ่มเข้าคิวเล่นเพลง ระบบจะรันเพลงไปเรื่อยๆ ตามลำดับ",
            color: "bg-green-500"
        },
        {
            icon: Mic2,
            title: "ระบบคัดร้อง",
            desc: "สามารถเลือกปิดเสียงร้อง หรือปรับระดับเสียงดนตรีได้ที่แผงควบคุมด้านล่าง",
            color: "bg-rose-500"
        },
        {
            icon: Tv,
            title: "ส่งออกหน้าจอ",
            desc: "ใช้ปุ่มต่อหน้าจอแยก (Dual Screen) เพื่อแสดงวิดีโอเนื้อร้องบนทีวีหรือโปรเจคเตอร์",
            color: "bg-purple-500"
        },
        {
            icon: Smartphone,
            title: "ควบคุมผ่านมือถือ",
            desc: "ล็อกอินด้วยบัญชีเดียวกันบนมือถือเพื่อใช้เป็นรีโมทคอนโทรลสำหรับเลือกเพลง",
            color: "bg-amber-500"
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <button onClick={handleBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ChevronLeft className="w-6 h-6 text-gray-600" />
                </button>
                <h1 className="text-lg font-bold text-gray-900">วิธีการใช้งาน</h1>
                <div className="w-10"></div>
            </header>

            <main className="flex-1 p-6 space-y-6 max-w-2xl mx-auto w-full pb-20">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
                        <Music className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-xl font-black text-gray-900">เริ่มต้นกับ YouOke</h2>
                    <p className="text-sm text-gray-500 mt-2">รวมเทคนิคการใช้งานเบื้องต้นเพื่อให้คุณสนุกกับคาราโอเกะได้เต็มที่</p>
                </div>

                <div className="grid gap-4">
                    {guides.map((guide, idx) => (
                        <div key={idx} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4">
                            <div className={`${guide.color} p-3 rounded-2xl text-white shadow-lg shrink-0`}>
                                <guide.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 mb-1">{guide.title}</h3>
                                <p className="text-xs text-gray-500 leading-relaxed">{guide.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10 mt-8">
                    <h4 className="font-bold text-primary mb-2 flex items-center gap-2">
                        <Smartphone className="w-4 h-4" /> เคล็ดลับเพิ่มเติม
                    </h4>
                    <p className="text-[11px] text-primary/80 leading-relaxed">
                        คุณสามารถสแกน QR Code ที่หน้าจอหลักเพื่อเชื่อมต่อมือถือหลายเครื่องพร้อมกัน เพื่อนๆ ทุกคนสามารถเลือกเพลงที่อยากร้องเข้าคิวได้ทันที!
                    </p>
                </div>
            </main>
        </div>
    );
}
