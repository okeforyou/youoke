# Workflow: YouOKE Cast Stability Standard (v1.0)

แนวทางปฏิบัติมาตรฐานเพื่อให้ระบบ Casting (Chromecast, Smart TV, Dual Screen) มีความเสถียรสูงสุดและทำงานเหมือนแอป Streaming ระดับโลก

## 1. Queue Count Synchronization (มาตรฐานตัวเลขคิว)
เพื่อให้ตัวเลข Badge ตรงกับรายการเพลงที่รอคิวจริงในทุกหน้าจอ:
- **สูตรคำนวณ:** `Math.max(0, queue.length - (currentIndex + 1))`
- **ห้ามใช้:** `queue.length` ตรงๆ เพราะจะรวมเพลงที่กำลังเล่นอยู่ด้วยทำให้ผู้ใช้วิ่งไปดูรายการแล้วเลขไม่ตรง

## 2. Persistent Connection Logic (การคงสถานะการเชื่อมต่อ)
เพื่อรองรับการที่มือถือเข้าสู่หมวดประหยัดพลังงานหรือหน้าจอดับ (Deep Sleep):
- **Storage:** ต้องบันทึกสถานะลง `localStorage` เสมอ (`youoke_is_casting_google`, `youoke_cast_mode`, `youoke_party_pin`)
- **UI Persistence:** เมื่อแอปโหลดใหม่หรือตื่นขึ้น หากมีค่าใน Storage ให้แสดง UI สถานะ "เชื่อมต่ออยู่" ค้างไว้ทันที (Don't wait for SDK scan).
- **Auto-Recovery:** ใช้ระบบ Polling ทุก 2 วินาที เป็นเวลา 20 นาที เพื่อรอให้ SDK กลับมาเกาะสัญญาณกับทีวีเครื่องเดิมแบบเงียบๆ

## 3. Deep Wake-up Pulse (การปลุกระบบเชิงรุก)
เมื่อตรวจพบการเปลี่ยนสถานะเป็น `visible` (เปิดหน้าจอ):
- **SDK Nudge:** ต้องเรียก `castContext.setOptions()` หรือส่งข้อความ `PING` เพื่อบังคับให้ Google Cast SDK ทำการ Network Scan ทันที (ไม่ต้องรอรอบสแกนอัตโนมัติของเบราว์เซอร์)

## 4. Disconnect Protocol (มาตรฐานการตัดสาย)
ป้องกันอาการ "Ghost State" หรือ UI ค้างหลังจากสัญญาณหลุด:
- **Force Cleanup:** ฟังก์ชัน Disconnect ต้องสั่ง `clearInterval` ของตัวกู้คืนสถานะ และล้าง `localStorage` ทันที
- **State Reset:** ต้องปรับ `isConnected` เป็น `false` และ `castMode` เป็น `none` ทันทีเพื่อให้มือถือกลับมาเล่นเพลงในตัวเครื่องได้โดยไม่ติดขัด

## 5. Cast Navigation Flow (ขั้นตอนการกด)
- **Sidebar/Player Button:** ต้องทำหน้าที่ **"เปิด Modal"** เสมอ ไม่ว่าจะเชื่อมต่ออยู่หรือไม่
- **No Instant Disconnect:** ห้ามสั่งตัดการเชื่อมต่อทันทีที่ปุ่มหน้าหลัก เพื่อป้องกันการหลุดโดยไม่ตั้งใจ
- **Explicit Cancellation:** การยกเลิกต้องเกิดขึ้นภายในหน้า Modal ที่ผู้ใช้เป็นคนกดยืนยันเท่านั้น

---
*บันทึกไว้เมื่อ: 11 เมษายน 2569 (เพื่อความเสถียรของ YouOKE v5.5.1+)*
