import React, { useState } from 'react';
import { AdminHeader } from '@/features/admin/components/AdminHeader';
import { AdminSidebar } from '@/features/admin/layouts/AdminSidebar';
import { MegaphoneIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

const BroadcastPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus(null);

    try {
      const res = await fetch('/api/admin/send-broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, link: link.trim() || undefined }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus({ type: 'success', msg: `✅ เผยแพร่ประกาศสำเร็จ!` });
        setTitle('');
        setBody('');
        setLink('');
      } else {
        throw new Error(data.error || 'Failed to send');
      }
    } catch (err: any) {
      console.error('Broadcast Error:', err);
      setStatus({ type: 'error', msg: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} />
        
        <main className="flex-1 p-4 lg:p-8">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-primary/10 rounded-xl text-primary">
                <MegaphoneIcon className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">ประกาศข่าวสารระบบ</h1>
                <p className="text-slate-500 text-sm">เขียนข่าวประกาศเพื่อให้แสดงผลในกระดิ่งของทุกคน (Public News)</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100">
              <form onSubmit={handleSend} className="p-6 space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">หัวข้อประกาศ</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="เช่น: แจ้งวันหยุดสงกรานต์ 🎤"
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">เนื้อหาข่าว</label>
                  <textarea
                    required
                    rows={6}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="ใส่รายละเอียดที่ต้องการแจ้งให้สมาชิกทราบ..."
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 text-sm leading-relaxed resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">ลิงก์ (ไม่บังคับ)</label>
                  <input
                    type="url"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="https://..."
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 text-sm"
                  />
                </div>

                {status && (
                  <div className={`p-4 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2 ${
                    status.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
                  }`}>
                    {status.msg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-all disabled:opacity-50 active:scale-[0.98] shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <PaperAirplaneIcon className="w-5 h-5 -rotate-45" />
                  )}
                  ส่งประกาศสาธารณะ
                </button>
              </form>
            </div>

            <div className="mt-8 p-6 bg-blue-50/30 rounded-2xl border border-dashed border-blue-100">
              <h4 className="text-[10px] font-bold text-blue-500 uppercase mb-3 tracking-widest">การทำงานของระบบ</h4>
              <ul className="text-xs text-blue-600/70 space-y-2 list-disc pl-4 font-medium">
                <li>เมื่อกดส่ง ข้อความจะขึ้นที่กระดิ่งของ **สมาชิกทุกคน** ทันที</li>
                <li>User ไม่จำเป็นต้องอนุญาต Notification ก็สามารถเห็นจุดสีแดงที่กะดิ่งได้</li>
                <li>ระบบจะบันทึกประวัติไว้ในหน้า "ข่าวสารและประกาศ" เพื่อให้อ่านย้อนหลังได้</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default BroadcastPage;
