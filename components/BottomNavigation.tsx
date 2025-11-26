import { useRouter } from 'next/router'

import {
    ArrowLeftOnRectangleIcon,
    ChatBubbleLeftIcon,
    MusicalNoteIcon,
    RectangleStackIcon,
    SparklesIcon,
    TrophyIcon,
    UserCircleIcon,
} from '@heroicons/react/24/outline'

import { useAuth } from '../context/AuthContext'
import { useKaraokeState } from '../hooks/karaoke'

export default function BottomNavigation() {
  const { activeIndex, setActiveIndex } = useKaraokeState();
  const { logOut, user } = useAuth();
  const router = useRouter();

  return (
    <div className="btm-nav absolute bottom-0 w-full sm:w-1/2 h-1/9 text-sm z-20">
      <button
        className={`text-primary  shrink ${activeIndex === 1 ? "active" : ""}`}
        onClick={() => setActiveIndex(1)}
      >
        <MusicalNoteIcon className="w-6 h-6" />
        <span className="btm-nav-label">แนะนำ</span>
      </button>
      <button
        className={`text-primary  shrink ${activeIndex === 2 ? "active" : ""}`}
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
        <span className="btm-nav-label ">เพลย์ลิสต์</span>
      </button>
      {/* TODO: Uncomment when subscription system is ready */}
      {/* <button
        className="text-warning shrink"
        onClick={() => router.push("/pricing")}
        title="สมัครสมาชิก"
      >
        <SparklesIcon className="w-6 h-6" />
        <span className="btm-nav-label">สมาชิก</span>
      </button> */}
      <a
        className={`text-primary shrink`}
        href="https://okeforyou.com/contact/"
        target="_blank"
        rel="noopener"
      >
        <ChatBubbleLeftIcon className="w-6 h-6" />
        ติดต่อ
      </a>
      {!user.uid ? (
        <button
          title="เข้าสู่ระบบ"
          className={`text-primary shrink`}
          onClick={() => {
            router.push("/login");
          }}
        >
          <ArrowLeftOnRectangleIcon className="w-6 h-6" />
          เข้าสู่ระบบ
        </button>
      ) : (
        <button
          className={`text-primary shrink ${activeIndex === 5 ? "active" : ""}`}
          onClick={() => setActiveIndex(5)}
          title="บัญชีของฉัน"
        >
          <UserCircleIcon className="w-6 h-6" />
          <span className="btm-nav-label">บัญชี</span>
        </button>
      )}
    </div>
  );
}
