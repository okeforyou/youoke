import Link from 'next/link';
import { ExternalLink, ArrowRight } from 'lucide-react';

interface CMSPageViewProps {
    page: any; // Using any for flexibility with merged types
}

export const CMSPageView = ({ page }: CMSPageViewProps) => {
    if (page.type === 'link') {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 h-full">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <ExternalLink className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold">กำลังนำคุณไปยังลิงก์ภายนอก...</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    {page.url}
                </p>
                <Link href={page.url || '#'} target="_blank">
                    <button className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-full hover:bg-primary/90 transition-transform hover:scale-105 shadow-md">
                        เปิดลิงก์ <ArrowRight className="w-4 h-4" />
                    </button>
                </Link>
            </div>
        );
    }

    return (
        <div className="prose prose-sm dark:prose-invert max-w-none p-1">
            {/* Safe HTML Rendering */}
            <div dangerouslySetInnerHTML={{ __html: page.content || '' }} />

            {!page.content && (
                <div className="p-8 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                    [ ส่วนนี้ยังไม่มีเนื้อหา ]
                </div>
            )}
        </div>
    );
};
