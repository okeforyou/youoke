import React from 'react';
import { 
    ExclamationCircleIcon, 
    SparklesIcon, 
    MusicalNoteIcon,
    DevicePhoneMobileIcon,
    ShieldCheckIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function GuideTab() {
    return (
        <div className="space-y-6 animate-in fade-in duration-300 pb-8">
            
            <p className="text-sm font-medium text-zinc-500 mb-6">
                ทำความรู้จักกับระบบ YouOke แพลตฟอร์มคาราโอเกะที่ออกแบบมาเพื่อคนรักการร้องเพลงโดยเฉพาะ
            </p>

            {/* Pain Point */}
            <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                    <ExclamationCircleIcon className="w-5 h-5 text-rose-500" />
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white">ทำไมต้อง YouOke? (The Pain Point)</h3>
                </div>
                <p className="text-xs text-zinc-500 font-medium leading-relaxed ml-8">
                    การหาเพลงคาราโอเกะที่ไม่มีเสียงร้องมักจะยาก หรือเพลงใหม่ๆ ก็ยังไม่มีเวอร์ชันคาราโอเกะ ยิ่งไปกว่านั้นการต้องเดินไปต่อคิวพิมพ์ชื่อเพลงหน้าคอมพิวเตอร์ก็ทำให้หมดสนุก และขัดจังหวะปาร์ตี้ของคุณ
                </p>
            </div>

            {/* Solution */}
            <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                    <SparklesIcon className="w-5 h-5 text-indigo-500" />
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white">YouOke ช่วยคุณได้อย่างไร?</h3>
                </div>
                <p className="text-xs text-zinc-500 font-medium leading-relaxed ml-8">
                    YouOke (ยูโอเกะ) คือระบบคาราโอเกะอัจฉริยะที่ดึงเพลงจาก YouTube มาเล่นได้ทันที พร้อมเทคโนโลยี AI ที่ช่วยลดหรือตัดเสียงร้องต้นฉบับออกได้แบบเรียลไทม์ และระบบคิวเพลงที่ทุกคนในงานสามารถสแกน QR Code แล้วเลือกเพลงผ่านมือถือของตัวเองได้เลย!
                </p>
            </div>

            {/* Core Features */}
            <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <SparklesIcon className="w-5 h-5 text-zinc-400" />
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white">2 ฟีเจอร์เด่นที่ห้ามพลาด</h3>
                </div>
                
                <div className="space-y-3 ml-8">
                    {/* Feature 1 */}
                    <div className="bg-zinc-50 dark:bg-zinc-800/30 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800 flex items-start gap-3">
                        <div className="bg-white dark:bg-zinc-800 p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 mt-0.5">
                            <MusicalNoteIcon className="w-4 h-4 text-zinc-500" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-zinc-900 dark:text-white mb-1">1. ระบบตัดเสียงร้องด้วย AI (Vocal Removal)</h4>
                            <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
                                สามารถใช้ AI แยกเสียงนักร้องออกจากดนตรีได้สดๆ ระหว่างเล่นเพลง (ต้องใช้แพ็กเกจ VIP)
                            </p>
                        </div>
                    </div>

                    {/* Feature 2 */}
                    <div className="bg-zinc-50 dark:bg-zinc-800/30 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800 flex items-start gap-3">
                        <div className="bg-white dark:bg-zinc-800 p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 mt-0.5">
                            <DevicePhoneMobileIcon className="w-4 h-4 text-zinc-500" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-zinc-900 dark:text-white mb-1">2. สแกนคิวเพลงผ่านมือถือ (Remote Queue)</h4>
                            <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
                                สแกน QR Code บนหน้าจอหลัก เพื่อใช้มือถือของคุณค้นหาและเพิ่มเพลงเข้าคิวได้อย่างอิสระ
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* How it works */}
            <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-6">ขั้นตอนการทำงาน</h3>
                
                <div className="space-y-6">
                    <div className="flex gap-4">
                        <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center text-[10px] font-black shrink-0">1</div>
                        <div>
                            <h4 className="text-xs font-bold text-zinc-900 dark:text-white mb-1">ค้นหาเพลง</h4>
                            <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">พิมพ์ชื่อเพลง หรือชื่อศิลปินที่ต้องการร้องในช่องค้นหา</p>
                        </div>
                    </div>
                    
                    <div className="flex gap-4">
                        <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center text-[10px] font-black shrink-0">2</div>
                        <div>
                            <h4 className="text-xs font-bold text-zinc-900 dark:text-white mb-1">เพิ่มเข้าคิว</h4>
                            <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">กดปุ่ม + เพื่อนำเพลงไปต่อคิว หากเล่นอยู่เพลงจะไปอยู่ท้ายคิวโดยอัตโนมัติ</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center text-[10px] font-black shrink-0">3</div>
                        <div>
                            <h4 className="text-xs font-bold text-zinc-900 dark:text-white mb-1">เปิดไมค์ร้องให้สุดเสียง</h4>
                            <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">รอคิวของคุณ แล้วโชว์พลังเสียงให้เต็มที่!</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer blocks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-2">
                        <ExclamationCircleIcon className="w-5 h-5 text-amber-500" />
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-white">ข้อจำกัดความรับผิดชอบ</h4>
                    </div>
                    <p className="text-[10px] text-zinc-500 font-medium leading-relaxed ml-7">
                        ระบบทำหน้าที่ค้นหา จัดการคิวเพลง และมี AI ช่วยตัดเสียงร้องเท่านั้น เราไม่ได้เป็นผู้อัปโหลดเนื้อหา โดยระบบดึงข้อมูลผ่านบัญชีของคุณเอง ผู้ใช้ต้องรับผิดชอบหากนำไปใช้เชิงพาณิชย์ตามกฎของ YouTube
                    </p>
                </div>
                
                <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-2">
                        <ShieldCheckIcon className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-white">ปลอดภัย ไม่มีโฆษณาแฝง</h4>
                    </div>
                    <p className="text-[10px] text-zinc-500 font-medium leading-relaxed ml-7">
                        เราจะไม่รบกวนปาร์ตี้ของคุณด้วยโฆษณาที่น่ารำคาญ (โฆษณาจาก YouTube ต้นฉบับจะถูกกรองออกอัตโนมัติเมื่อเป็น VIP)
                    </p>
                </div>
            </div>

        </div>
    );
}
