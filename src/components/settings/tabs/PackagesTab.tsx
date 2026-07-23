import React from 'react';
import { PackageStore } from '../../profile/PackageStore';
 
export default function PackagesTab() {
    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h3 className="text-xl font-black text-zinc-900 dark:text-white">แพ็กเกจ VIP (Packages)</h3>
                <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
                    อัปเกรดเป็น VIP เพื่อประสบการณ์ร้องเพลงที่ดีที่สุด ไม่มีโฆษณาคั่น
                </p>
            </div>
 
            <div className="mt-6">
                <PackageStore />
            </div>
        </div>
    );
}
