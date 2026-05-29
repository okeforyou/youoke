#!/bin/bash

# ====================================================================
# YouOKE Business Boilerplate Setup Script (1-Click Kickstart)
# Created by AI Antigravity for open.okeforyou.com
# ====================================================================

SOURCE_DIR="/Users/boonyanone/Documents/GitHub/play.okeforyou.com"
TARGET_DIR="/Users/boonyanone/Documents/GitHub/open.okeforyou.com"

echo "🎙️ เริ่มต้นการจัดทำโครงสร้าง YouOKE Business..."

# 1. Check if the target repo has been cloned
if [ ! -d "$TARGET_DIR" ]; then
    echo "❌ ไม่พบโฟลเดอร์ปลายทางที่: $TARGET_DIR"
    echo "กรุณาโคลน GitHub ด้วยคำสั่ง: git clone https://github.com/okeforyou/open.git $TARGET_DIR ก่อนรันสคริปต์นี้นะครับ!"
    exit 1
fi

echo "✅ ตรวจพบโฟลเดอร์ปลายทางเรียบร้อยแล้ว!"

# 2. Create Directory Structures in the new repo
echo "📂 กำลังสร้างโครงสร้างโฟลเดอร์ระบบ..."
mkdir -p "$TARGET_DIR/src/pages/api"
mkdir -p "$TARGET_DIR/src/components"
mkdir -p "$TARGET_DIR/src/modules"
mkdir -p "$TARGET_DIR/src/styles"
mkdir -p "$TARGET_DIR/src/utils"
mkdir -p "$TARGET_DIR/src/core"
mkdir -p "$TARGET_DIR/src/lib"
mkdir -p "$TARGET_DIR/public"

# 3. Copy base configs
echo "⚙️ กำลังคัดลอกไฟล์คอนฟิกพรีเมียม..."
cp "$SOURCE_DIR/package.json" "$TARGET_DIR/package.json"
cp "$SOURCE_DIR/tsconfig.json" "$TARGET_DIR/tsconfig.json"
cp "$SOURCE_DIR/tailwind.config.js" "$TARGET_DIR/tailwind.config.js"
cp "$SOURCE_DIR/postcss.config.js" "$TARGET_DIR/postcss.config.js"
cp "$SOURCE_DIR/.eslintrc.json" "$TARGET_DIR/.eslintrc.json"
cp "$SOURCE_DIR/next.config.js" "$TARGET_DIR/next.config.js"
cp "$SOURCE_DIR/jsconfig.json" "$TARGET_DIR/jsconfig.json"

# Copy Firebase environment variables safely
if [ -f "$SOURCE_DIR/.env.local" ]; then
    cp "$SOURCE_DIR/.env.local" "$TARGET_DIR/.env.local"
fi
if [ -f "$SOURCE_DIR/.env" ]; then
    cp "$SOURCE_DIR/.env" "$TARGET_DIR/.env"
fi

# 4. Copy Premium Core Styles, Libraries, and Firebase Modules
echo "🎨 คัดลอก Global Styles และ Core Libraries..."
if [ -d "$SOURCE_DIR/src/lib" ]; then
    cp -R "$SOURCE_DIR/src/lib/" "$TARGET_DIR/src/lib/"
fi
if [ -d "$SOURCE_DIR/src/styles" ]; then
    cp -R "$SOURCE_DIR/src/styles/" "$TARGET_DIR/src/styles/"
fi
if [ -f "$SOURCE_DIR/src/firebase.ts" ]; then
    cp "$SOURCE_DIR/src/firebase.ts" "$TARGET_DIR/src/firebase.ts"
fi
if [ -f "$SOURCE_DIR/src/firebase-admin.ts" ]; then
    cp "$SOURCE_DIR/src/firebase-admin.ts" "$TARGET_DIR/src/firebase-admin.ts"
fi
if [ -f "$SOURCE_DIR/src/core/version.ts" ]; then
    cp "$SOURCE_DIR/src/core/version.ts" "$TARGET_DIR/src/core/version.ts"
fi
if [ -d "$SOURCE_DIR/public" ]; then
    echo "🖼️ คัดลอก Assets..."
    cp -R "$SOURCE_DIR/public/" "$TARGET_DIR/public/"
fi

# 5. Create Clean _app.tsx & _document.tsx
echo "📄 สร้างระบบ Root Container..."
cat << 'EOF' > "$TARGET_DIR/src/pages/_app.tsx"
import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>YouOKE Business - open.okeforyou.com</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
EOF

cat << 'EOF' > "$TARGET_DIR/src/pages/_document.tsx"
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="th">
      <Head />
      <body className="bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
EOF

# 6. Create Pristine Boilerplate Pages for Karaoke Shop
echo "💻 กำลังเขียนโค้ดหน้าจอหลักทั้ง 4 ของระบบร้านค้า..."

# A. Index Landing
cat << 'EOF' > "$TARGET_DIR/src/pages/index.tsx"
import React from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-zinc-950 text-white font-sans">
      <div className="max-w-xl space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600/10 text-emerald-400 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-500/20">
          🎙️ YouOKE Business MVP
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none">
          ระบบควบคุมหน้าร้าน <br/>
          <span className="text-emerald-500">Karaoke Commercial</span>
        </h1>
        <p className="text-zinc-400 font-bold text-sm md:text-base leading-relaxed">
          ยินดีต้อนรับสู่โปรเจกต์ open.okeforyou.com! ระบบนี้ได้รับการโคลนและจัดทำ Boilerplate จาก play.okeforyou.com เรียบร้อยแล้ว พร้อมลุยพัฒนาต่อได้ทันทีครับ
        </p>

        <div className="grid grid-cols-2 gap-4 pt-6 text-left">
          <div onClick={() => router.push('/tv')} className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 cursor-pointer transition-all">
            <h3 className="font-black text-sm text-white">🖥️ จอทีวีในห้อง (/tv)</h3>
            <p className="text-[10px] text-zinc-500 font-bold mt-1">จอแสดงผลหลักและการสแกนรีโมท</p>
          </div>
          <div onClick={() => router.push('/remote')} className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 cursor-pointer transition-all">
            <h3 className="font-black text-sm text-white">📱 หน้ารีโมทมือถือ (/remote)</h3>
            <p className="text-[10px] text-zinc-500 font-bold mt-1">ค้นหาเพลงและสั่งอาหารหน้าร้าน</p>
          </div>
          <div onClick={() => router.push('/kitchen')} className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 cursor-pointer transition-all">
            <h3 className="font-black text-sm text-white">🍳 หน้าจอห้องครัว (/kitchen)</h3>
            <p className="text-[10px] text-zinc-500 font-bold mt-1">คิวออเดอร์ F&B แบบ Real-time</p>
          </div>
          <div onClick={() => router.push('/cashier')} className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 cursor-pointer transition-all">
            <h3 className="font-black text-sm text-white">💳 แดชบอร์ดแคชเชียร์ (/cashier)</h3>
            <p className="text-[10px] text-zinc-500 font-bold mt-1">เปิด/ปิดห้อง ต่อเวลา คุมเวลา</p>
          </div>
        </div>
      </div>
    </div>
  );
}
EOF

# B. /tv
cat << 'EOF' > "$TARGET_DIR/src/pages/tv.tsx"
import React from 'react';

export default function TVScreen() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 font-sans">
      <div className="space-y-4 text-center">
        <div className="w-16 h-16 bg-zinc-900 rounded-2xl border border-zinc-800 flex items-center justify-center mx-auto text-2xl">🖥️</div>
        <h1 className="text-3xl font-black tracking-tight">หน้าจอใหญ่ประจำห้องทีวี (/tv)</h1>
        <p className="text-zinc-500 text-xs font-bold max-w-sm">
          หน้านี้จะเป็นเครื่องเล่นวิดีโอ (YouTube + Local Video) พร้อมโชว์คิวเพลงและ QR Code ให้ลูกค้าสแกนจับคู่อัตโนมัติ
        </p>
      </div>
    </div>
  );
}
EOF

# C. /remote
cat << 'EOF' > "$TARGET_DIR/src/pages/remote.tsx"
import React from 'react';

export default function RemotePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-8 font-sans">
      <div className="space-y-4 text-center">
        <div className="w-16 h-16 bg-zinc-900 rounded-2xl border border-zinc-800 flex items-center justify-center mx-auto text-2xl">📱</div>
        <h1 className="text-3xl font-black tracking-tight">หน้ารีโมทมือถือลูกค้า (/remote)</h1>
        <p className="text-zinc-500 text-xs font-bold max-w-sm">
          ลูกค้าร้านคาราโอเกะสแกน QR Code เข้ามาหน้านี้เพื่อสั่งเพลง คุมเสียง เลือกคิวเพลง สั่งอาหาร/น้ำ และเรียกพนักงานแบบไม่มีล็อกอิน
        </p>
      </div>
    </div>
  );
}
EOF

# D. /kitchen
cat << 'EOF' > "$TARGET_DIR/src/pages/kitchen.tsx"
import React from 'react';

export default function KitchenPage() {
  return (
    <div className="min-h-screen bg-zinc-900 text-white flex flex-col items-center justify-center p-8 font-sans">
      <div className="space-y-4 text-center">
        <div className="w-16 h-16 bg-zinc-800 rounded-2xl border border-zinc-700 flex items-center justify-center mx-auto text-2xl">🍳</div>
        <h1 className="text-3xl font-black tracking-tight">หน้าจอระบบห้องครัว (/kitchen)</h1>
        <p className="text-zinc-500 text-xs font-bold max-w-sm">
          หน้าจอคิวงานออเดอร์ Real-time สำหรับเชฟและบาร์น้ำ เมื่ออาหารคิวไหนพร้อมเสิร์ฟ พนักงานในครัวสามารถกดยืนยันออเดอร์ได้ที่หน้านี้
        </p>
      </div>
    </div>
  );
}
EOF

# E. /cashier
cat << 'EOF' > "$TARGET_DIR/src/pages/cashier.tsx"
import React from 'react';

export default function CashierPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-8 font-sans">
      <div className="space-y-4 text-center">
        <div className="w-16 h-16 bg-zinc-900 rounded-2xl border border-zinc-800 flex items-center justify-center mx-auto text-2xl">💳</div>
        <h1 className="text-3xl font-black tracking-tight">แผงควบคุมเคาน์เตอร์แคชเชียร์ (/cashier)</h1>
        <p className="text-zinc-500 text-xs font-bold max-w-sm">
          แผงควบคุมส่วนกลางสำหรับพนักงานสั่งเปิด-ปิดห้อง ตั้งเวลานับถอยหลัง ต่อเวลา และสรุปราคาสรุปบิลยอดรวมอาหาร+ค่าชั่วโมง
        </p>
      </div>
    </div>
  );
}
EOF

echo "🎉 คัดลอกและตั้งต้น Boilerplate โครงสร้าง YouOKE Business สำเร็จเสร็จสิ้นแล้ว!"
echo "กรุณาเปิดหน้าแชตใหม่ และใช้ Prompt ในไฟล์ YOUOKE_BUSINESS_KICKOFF.md เพื่อลุยงานต่อในระบบใหม่ได้เลยครับ!"
EOF
