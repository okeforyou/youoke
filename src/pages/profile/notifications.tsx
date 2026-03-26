import React from 'react';
import Head from 'next/head';
import MainLayout from '@/layouts/MainLayout';
import { NotificationList } from '@/components/profile/NotificationList';
import { Bell, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

const NotificationsPage = () => {
  return (
    <MainLayout>
      <Head>
        <title>การแจ้งเตือน | YouOke</title>
      </Head>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            href="/"
            className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-all border border-transparent hover:border-slate-100"
          >
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">การแจ้งเตือน</h1>
            <p className="text-sm text-slate-500 font-medium">รวมประกาศและสถานะกิจกรรมของคุณทั้งหมด</p>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 min-h-[400px]">
          <div className="flex items-center gap-3 mb-6 p-1">
            <div className="bg-primary/10 p-2.5 rounded-2xl text-primary">
              <Bell className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">แจ้งเตือนย้อนหลัง</h2>
          </div>

          <NotificationList />
        </div>

        {/* Support Section */}
        <div className="mt-8 p-6 bg-slate-900 rounded-3xl text-white relative overflow-hidden group">
          <div className="relative z-10">
            <h3 className="text-lg font-bold mb-1">มีปัญหาในการแจ้งเตือน?</h3>
            <p className="text-slate-400 text-xs mb-4 max-w-[240px]">หากคุณไม่ได้รับแจ้งเตือนแบบ Push หรือมีข้อสงสัยเพิ่มเติม สามารถสอบถามแอดมินได้ตลอด 24 ชม.</p>
            <a 
              href="https://line.me/R/ti/p/@243lercy" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-slate-900 px-4 py-2 rounded-xl text-xs font-black hover:bg-white/90 transition-all active:scale-95"
            >
              ติดต่อแอดมินทาง LINE
            </a>
          </div>
          
          {/* Decorative element */}
          <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-all duration-700" />
        </div>
      </div>
    </MainLayout>
  );
};

export default NotificationsPage;
