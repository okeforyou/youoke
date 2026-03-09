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
            title: "ค้นหาเพลงอัจฉริยะ",
            desc: "ค้นหาคลังเพลง YouTube ได้ทั่วโลก เลือกแยกได้ระหว่าง 'เพลงปกติ' หรือ 'คาราโอเกะ' เพื่อความแม่นยำ",
            color: "bg-blue-500"
        },
        {
            icon: Mic2,
            title: "สั่งงานด้วยเสียง",
            desc: "สะดวกและรวดเร็ว ไม่ต้องพิมพ์ให้เหนื่อย แค่กดไอคอนไมค์แล้วพูดชื่อเพลงหรือศิลปินที่ต้องการ",
            color: "bg-rose-500"
        },
        {
            icon: Smartphone,
            title: "มือถือคือรีโมท",
            desc: "เครื่องไหนก็คุมได้! จัดการคิวเพลง เล่น/หยุด หรือข้ามเพลงได้ทันทีจากมือถือของคุณ",
            color: "bg-amber-500"
        },
        {
            icon: Tv,
            title: "ส่งขึ้นจอใหญ่ / Cast",
            desc: "ดูเนื้อร้องเต็มตา! ส่งภาพขึ้น Smart TV หรือต่อจอแยก (Dual Screen) เหมือนอยู่ในร้านคาราโอเกะ",
            color: "bg-purple-500"
        },
        {
            icon: Music,
            title: "คลังเพลงส่วนตัว",
            desc: "บันทึกเพลงที่ร้องบ่อยไว้ในเพลย์ลิสต์ส่วนตัว หรือเลือกจากเพลงแนะนำที่ระบบคัดมาให้",
            color: "bg-green-500"
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
