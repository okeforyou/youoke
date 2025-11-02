# YouOke Cast System Design

## 🎯 เป้าหมาย
ให้ผู้ใช้สามารถ Cast เพลง Karaoke ไปยังทีวีได้ง่ายที่สุด โดยรองรับ:
1. **Browser Cast** (Socket.io) - มีอยู่แล้ว ✅
2. **Chromecast** (Google Cast API) - เพิ่มใหม่ 🆕

---

## 📺 วิธีที่ 1: Browser Cast (Socket.io) ✅

### การทำงาน
```
1. เปิด /monitor บนทีวี (Smart TV/PC)
2. ได้เลขห้อง เช่น "ABC123"
3. กรอกเลขห้องบนมือถือ
4. Queue sync ผ่าน Socket.io real-time
5. เพลงเล่นอัตโนมัติตามคิว
```

### ข้อดี
- ✅ มีอยู่แล้ว ทำงานได้
- ✅ รองรับทุก device ที่เปิด browser ได้
- ✅ ไม่ต้องซื้อ Chromecast

### ข้อจำกัด
- ⚠️ ต้องกรอกเลขห้อง
- ⚠️ ต้องเปิด browser บนทีวี

---

## 📺 วิธีที่ 2: Chromecast (Google Cast API) 🆕

### การทำงาน
```
1. กดปุ่ม "Cast" บนมือถือ
2. เลือก Chromecast device
3. Chromecast เปิด Receiver App (YouOke TV) อัตโนมัติ
4. Queue sync ผ่าน Chromecast Channel
5. เพลงเล่นอัตโนมัติตามคิว
```

### ข้อดี
- ✅ ง่ายกว่า ไม่ต้องกรอกเลขห้อง
- ✅ UX ดีกว่า (กดปุ่มเดียว)
- ✅ Standard (เหมือน YouTube, Netflix)

### ข้อจำกัด
- ⚠️ ต้องมี Chromecast device (1,000-2,000 บาท)
- ⚠️ ต้อง register Google Cast Developer Console

---

## 🛠️ Implementation (Chromecast)

### Phase 1: Setup (1-2 วัน)

#### 1.1 Register Cast Application
```
1. ไปที่ Google Cast SDK Developer Console
2. Register new application
3. ได้ Application ID (เช่น "4F8B3483")
4. ใส่ Receiver URL: https://youoke.vercel.app/cast-receiver
```

#### 1.2 Install Google Cast SDK
```bash
npm install @types/chromecast-caf-sender
```

```html
<!-- pages/_document.tsx -->
<script src="https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1"></script>
```

---

### Phase 2: Sender App (มือถือ/PC) (2-3 วัน)

#### 2.1 Cast Button Component
```typescript
// components/CastButton.tsx
import { useEffect, useState } from 'react';

export default function CastButton() {
  const [castSession, setCastSession] = useState(null);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    // Initialize Cast API
    window['__onGCastApiAvailable'] = (isAvailable) => {
      if (isAvailable) {
        const cast = window.chrome.cast;
        cast.framework.CastContext.getInstance().setOptions({
          receiverApplicationId: '4F8B3483', // Your App ID
          autoJoinPolicy: cast.framework.AutoJoinPolicy.ORIGIN_SCOPED
        });

        setIsAvailable(true);

        // Listen for session changes
        const context = cast.framework.CastContext.getInstance();
        context.addEventListener(
          cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
          (event) => {
            if (event.sessionState === 'SESSION_STARTED') {
              setCastSession(context.getCurrentSession());
            } else if (event.sessionState === 'SESSION_ENDED') {
              setCastSession(null);
            }
          }
        );
      }
    };
  }, []);

  const handleCast = () => {
    const context = window.chrome.cast.framework.CastContext.getInstance();
    context.requestSession();
  };

  if (!isAvailable) return null;

  return (
    <button
      onClick={handleCast}
      className="btn btn-primary"
    >
      📺 Cast to TV
    </button>
  );
}
```

#### 2.2 Send Queue to Chromecast
```typescript
// services/castService.ts
export class CastService {
  private session: any = null;

  setSession(session: any) {
    this.session = session;
  }

  sendQueue(queue: Video[]) {
    if (!this.session) return;

    // Send queue data to receiver
    this.session.sendMessage(
      'urn:x-cast:com.youoke.karaoke',
      {
        type: 'QUEUE_UPDATE',
        queue: queue
      }
    );
  }

  playVideo(videoId: string) {
    if (!this.session) return;

    this.session.sendMessage(
      'urn:x-cast:com.youoke.karaoke',
      {
        type: 'PLAY_VIDEO',
        videoId: videoId
      }
    );
  }

  nextSong() {
    if (!this.session) return;

    this.session.sendMessage(
      'urn:x-cast:com.youoke.karaoke',
      {
        type: 'NEXT_SONG'
      }
    );
  }
}
```

---

### Phase 3: Receiver App (Chromecast) (2-3 วัน)

#### 3.1 Create Cast Receiver Page
```typescript
// pages/cast-receiver.tsx
import { useEffect, useState } from 'react';
import YoutubePlayer from '../components/YoutubePlayer';

export default function CastReceiver() {
  const [queue, setQueue] = useState([]);
  const [currentVideo, setCurrentVideo] = useState('');

  useEffect(() => {
    // Initialize Cast Receiver API
    const context = cast.framework.CastReceiverContext.getInstance();

    // Listen for custom messages
    context.addCustomMessageListener(
      'urn:x-cast:com.youoke.karaoke',
      (event) => {
        const message = event.data;

        switch (message.type) {
          case 'QUEUE_UPDATE':
            setQueue(message.queue);
            break;

          case 'PLAY_VIDEO':
            setCurrentVideo(message.videoId);
            break;

          case 'NEXT_SONG':
            playNextSong();
            break;
        }
      }
    );

    // Start receiver
    context.start();
  }, []);

  const playNextSong = () => {
    if (queue.length > 0) {
      const nextVideo = queue[0];
      setCurrentVideo(nextVideo.videoId);
      setQueue(prev => prev.slice(1));
    }
  };

  return (
    <div className="h-screen bg-black">
      <YoutubePlayer
        videoId={currentVideo}
        nextSong={playNextSong}
        isMoniter
      />

      {/* Queue Display */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white p-4">
        <h3 className="text-2xl mb-2">คิวถัดไป:</h3>
        <ul>
          {queue.slice(0, 3).map((video, index) => (
            <li key={video.videoId} className="text-xl">
              {index + 1}. {video.title}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

---

## 🎯 Unified Architecture (ใช้ทั้ง 2 วิธี)

```typescript
// context/CastContext.tsx
import { createContext, useContext, useState } from 'react';

type CastMethod = 'socket' | 'chromecast' | null;

interface CastContextValue {
  method: CastMethod;
  isConnected: boolean;

  // Unified methods
  connect: (method: CastMethod) => void;
  disconnect: () => void;
  sendQueue: (queue: Video[]) => void;
  playVideo: (videoId: string) => void;
  nextSong: () => void;
}

export function CastProvider({ children }) {
  const [method, setMethod] = useState<CastMethod>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = (newMethod: CastMethod) => {
    setMethod(newMethod);
    setIsConnected(true);
  };

  const disconnect = () => {
    if (method === 'socket') {
      // Disconnect Socket.io
      socket.emit('leave-room');
    } else if (method === 'chromecast') {
      // End Chromecast session
      cast.framework.CastContext.getInstance().endCurrentSession();
    }

    setMethod(null);
    setIsConnected(false);
  };

  const sendQueue = (queue: Video[]) => {
    if (method === 'socket') {
      socket.emit('queue-update', { queue });
    } else if (method === 'chromecast') {
      castService.sendQueue(queue);
    }
  };

  const playVideo = (videoId: string) => {
    if (method === 'socket') {
      socket.emit('play-video', { videoId });
    } else if (method === 'chromecast') {
      castService.playVideo(videoId);
    }
  };

  const nextSong = () => {
    if (method === 'socket') {
      socket.emit('next-song');
    } else if (method === 'chromecast') {
      castService.nextSong();
    }
  };

  return (
    <CastContext.Provider value={{
      method,
      isConnected,
      connect,
      disconnect,
      sendQueue,
      playVideo,
      nextSong
    }}>
      {children}
    </CastContext.Provider>
  );
}
```

---

## 🎨 UI/UX Design

### Cast Options Screen
```
┌────────────────────────────────────┐
│  🎤 Cast to TV                     │
├────────────────────────────────────┤
│                                    │
│  📱 เลือกวิธี Cast:                │
│                                    │
│  ┌──────────────────────────────┐ │
│  │ 📺 Chromecast                │ │
│  │ ง่ายที่สุด - กดปุ่มเดียว     │ │
│  │ [Cast Button]                │ │
│  └──────────────────────────────┘ │
│                                    │
│  ┌──────────────────────────────┐ │
│  │ 🌐 Browser Cast              │ │
│  │ เปิด browser บนทีวี          │ │
│  │ Room: ABC123  [Join]         │ │
│  └──────────────────────────────┘ │
│                                    │
└────────────────────────────────────┘
```

---

## 📋 Timeline

| Phase | ระยะเวลา | งาน |
|-------|----------|-----|
| Phase 1 | 1-2 วัน | Setup Google Cast, Register App |
| Phase 2 | 2-3 วัน | Sender App (Cast Button + Queue sync) |
| Phase 3 | 2-3 วัน | Receiver App (Chromecast player) |
| Phase 4 | 1 วัน | Testing + Bug fixes |
| **รวม** | **6-9 วัน** | **พร้อมใช้งาน** |

---

## 💰 ต้นทุน

- ✅ **Google Cast SDK:** ฟรี
- ✅ **Development:** ไม่มีค่าใช้จ่าย
- 💰 **Chromecast Device:** 1,000-2,000 บาท (ผู้ใช้ซื้อเอง)

---

## ✅ คำแนะนำ

### ควรทำ (Recommended)
1. **รักษา Socket.io Cast ไว้** - มีประโยชน์สำหรับ Smart TV
2. **เพิ่ม Chromecast** - UX ดีกว่า สำหรับคนมี Chromecast
3. **Auto-detect** - ตรวจจับ Chromecast อัตโนมัติ แล้วแสดงปุ่ม Cast
4. **Fallback** - ถ้าไม่มี Chromecast ให้ใช้ Socket.io แทน

### ไม่แนะนำ
- ❌ ลบ Socket.io Cast - ยังมีคนใช้งาน Smart TV
- ❌ บังคับให้ซื้อ Chromecast - ให้เป็น optional

---

## 🎯 สรุป

**ทำได้ครับ!** และควรรองรับทั้ง 2 วิธี:

1. **Socket.io Cast** (มีอยู่แล้ว) → ใช้ต่อ
2. **Chromecast** (เพิ่มใหม่) → ง่ายกว่า UX ดีกว่า

**Architecture ง่ายมาก:**
- Sender (มือถือ) → กดปุ่ม Cast
- Receiver (ทีวี) → เล่นตามคิว
- Queue sync → ผ่าน Cast Channel

**Timeline:** 1 สัปดาห์เสร็จแน่นอน! 🚀
