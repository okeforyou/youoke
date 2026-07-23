import React from 'react';
import { NotificationList } from '../../profile/NotificationList';
 
export default function AnnouncementsTab() {
    return (
        <div className="animate-in fade-in duration-300 max-w-3xl">
            <div className="rounded-3xl border border-zinc-200 bg-white dark:bg-zinc-950 dark:border-zinc-800 overflow-hidden shadow-sm p-2 sm:p-4">
                <NotificationList />
            </div>
        </div>
    );
}
