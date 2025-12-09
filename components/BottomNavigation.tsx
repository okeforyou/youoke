import { useRouter } from 'next/router'

import {
    ArrowLeftOnRectangleIcon,
    ChatBubbleLeftIcon,
    MusicalNoteIcon,
    RectangleStackIcon,
    TrophyIcon,
    UserCircleIcon,
} from '@heroicons/react/24/outline'

import { useAuth } from '../context/AuthContext'
import { useKaraokeState } from '../hooks/karaoke'

export default function BottomNavigation() {
  const { activeIndex, setActiveIndex } = useKaraokeState();
  const { user } = useAuth();
  const router = useRouter();

  return (
    <div className="btm-nav fixed bottom-0 w-full sm:w-1/2 h-1/9 text-sm z-50">
      <button
        className={`text-primary shrink ${activeIndex === 1 ? "active" : ""}`}
        onClick={() => setActiveIndex(1)}
      >
        <MusicalNoteIcon className="w-6 h-6" />
        <span className="btm-nav-label">แนะนำ</span>
      </button>
      <button
        className={`text-primary shrink ${activeIndex === 2 ? "active" : ""}`}
        onClick={() => setActiveIndex(2)}
      >
        <TrophyIcon className="w-6 h-6" />
        <span className="btm-nav-label">มาแรง</span>
      </button>
      <button
        className={`text-primary shrink ${activeIndex === 3 ? "active" : ""}`}
        onClick={() => setActiveIndex(3)}
      >
        <RectangleStackIcon className="w-6 h-6" />
        <span className="btm-nav-label">เพลย์ลิสต์</span>
      </button>
      <button
        className="text-primary shrink"
        title="ติดต่อเรา"
        onClick={() => window.open("https://line.me/R/ti/p/@243lercy", "_blank")}
      >
        <ChatBubbleLeftIcon className="w-6 h-6" />
        <span className="btm-nav-label">ติดต่อ</span>
      </button>
      {!user.uid ? (
        <button
          title="เข้าสู่ระบบ"
          className={`text-primary shrink`}
          onClick={() => router.push("/login")}
        >
          <ArrowLeftOnRectangleIcon className="w-6 h-6" />
          เข้าสู่ระบบ
        </button>
      ) : (
        <button
          className="text-primary shrink"
          title="บัญชีของฉัน"
          onClick={() => router.push("/account")}
        >
          <UserCircleIcon className="w-6 h-6" />
          <span className="btm-nav-label">บัญชี</span>
        </button>
      )}
    </div>
  );
}
