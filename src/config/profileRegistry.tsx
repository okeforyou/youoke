import { LucideIcon, User, Bell, Shield, HelpCircle, LogOut } from 'lucide-react';
import { EditProfileForm } from '@/components/profile/pages/EditProfileForm';

// --- TYPE DEFINITIONS ---
// This ensures type safety when adding new pages in the future.
export type ProfilePageId = 'edit_profile' | 'notifications' | 'security' | 'help' | string;

export interface ProfilePageConfig {
    id: ProfilePageId;
    title: string;
    icon?: LucideIcon;
    section: 'account' | 'support' | 'custom'; // Expandable for CMS 'custom' sections
    component?: React.ComponentType<any>;     // Component to render
    action?: 'logout' | 'modal';              // Special actions instead of navigation
    modalId?: string;                         // If action is modal
}

// --- CMS-LIKE REGISTRY ---
// In the future, this array can be fetched from an API or mixed with API data.
export const PROFILE_PAGES: ProfilePageConfig[] = [
    // Section: Account
    {
        id: 'edit_profile',
        title: 'แก้ไขข้อมูลส่วนตัว',
        icon: User,
        section: 'account',
        component: EditProfileForm
    },
    // --- PLACEHOLDERS (Commented out to allow CMS replacement) ---
    /*
    {
        id: 'notifications',
        title: 'การแจ้งเตือน',
        icon: Bell,
        section: 'account',
        component: () => <div className="p-4 text-center text-muted-foreground">Notification Settings Component</div>
    },
    {
        id: 'security',
        title: 'ความปลอดภัย',
        icon: Shield,
        section: 'account',
        component: () => <div className="p-4 text-center text-muted-foreground">Security Settings Component</div>
    },
    {
        id: 'help',
        title: 'ศูนย์ช่วยเหลือ',
        icon: HelpCircle,
        section: 'support',
        component: () => <div className="p-4 text-center text-muted-foreground">Help Center Component</div>
    },
    */
    {
        id: 'logout',
        title: 'ออกจากระบบ',
        icon: LogOut,
        section: 'support',
        action: 'logout' // Handled specifically by the drawer
    }
];

// Helper to get grouped menu items for rendering
export const getProfileMenuGroups = () => {
    const groups: Record<string, ProfilePageConfig[]> = {
        account: [],
        support: [],
        custom: []
    };

    PROFILE_PAGES.forEach(page => {
        if (groups[page.section]) {
            groups[page.section].push(page);
        }
    });

    return groups;
};

// --- HELPER HOOK FOR DYNAMIC MENU ---
import { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';

export const useProfileMenu = () => {
    const [cmsPages, setCmsPages] = useState<ProfilePageConfig[]>([]);

    useEffect(() => {
        // We will fetch all and filter/sort client-side for robustness
        if (!db) return;
        const q = query(collection(db, 'cms_pages'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedPages = snapshot.docs
                .map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        title: data.title,
                        icon: null,
                        section: data.section,
                        type: data.type,
                        content: data.content,
                        url: data.url,
                        isActive: data.isActive,
                        order: data.order || 0
                    } as any; // Temporary any to access raw fields
                })
                .filter(p => p.isActive === true) // Client-side filter
                .sort((a, b) => a.order - b.order); // Client-side sort

            console.log("CMS: Fetched Pages:", fetchedPages); // Debug log
            setCmsPages(fetchedPages);
        }, (error) => {
            console.error("CMS: Error fetching pages:", error);
        });

        return () => unsubscribe();
    }, []);

    // Merge System + CMS
    const allPages = [...PROFILE_PAGES, ...cmsPages];

    const menuGroups: Record<string, ProfilePageConfig[]> = {
        account: allPages.filter(p => p.section === 'account'),
        support: allPages.filter(p => p.section === 'support'),
        custom: allPages.filter(p => p.section === 'custom')
    };

    return { menuGroups, allPages };
};

