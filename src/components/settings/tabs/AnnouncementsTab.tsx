import React from 'react';
import { NotificationList } from '../../profile/NotificationList';
 
export default function AnnouncementsTab() {
    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h3 className="text-xl font-black text-zinc-900 dark:text-white">ประกาศข่าวและการแจ้งเตือน</h3>
                <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
                    อัปเดตข่าวสาร โปรโมชั่น และกิจกรรมใหม่ๆ จาก YouOke
                </p>
            </div>
 
            <div className="mt-6 rounded-2xl border-2 border-zinc-100 bg-zinc-50/50 dark:bg-zinc-900/30 dark:border-zinc-800 p-2 overflow-hidden">
                <NotificationList />
            </div>
        </div>
    );
}
