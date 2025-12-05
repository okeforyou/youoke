/**
 * Hook สำหรับจัดการจำนวนเพลงที่ Guest สามารถฟังได้
 * - Guest ฟังได้ 3 เพลง
 * - เก็บข้อมูลใน LocalStorage
 * - Reset ทุก 24 ชั่วโมง
 */

import { useEffect, useState } from "react";

const GUEST_LIMIT = 3;
const STORAGE_KEY = "guest_play_count";
const TIMESTAMP_KEY = "guest_play_timestamp";

interface GuestLimitData {
  count: number;
  timestamp: number;
}

export function useGuestLimit() {
  const [playedCount, setPlayedCount] = useState(0);
  const [remainingPlays, setRemainingPlays] = useState(GUEST_LIMIT);
  const [isLimitReached, setIsLimitReached] = useState(false);

  useEffect(() => {
    loadGuestData();
  }, []);

  function loadGuestData() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const timestamp = localStorage.getItem(TIMESTAMP_KEY);

      if (!stored || !timestamp) {
        // ไม่มีข้อมูล - เริ่มใหม่
        resetGuestData();
        return;
      }

      const now = Date.now();
      const lastPlayed = parseInt(timestamp);
      const hoursPassed = (now - lastPlayed) / (1000 * 60 * 60);

      // Reset ถ้าเกิน 24 ชั่วโมง
      if (hoursPassed >= 24) {
        resetGuestData();
        return;
      }

      // โหลดข้อมูลเดิม
      const count = parseInt(stored);
      setPlayedCount(count);
      setRemainingPlays(Math.max(0, GUEST_LIMIT - count));
      setIsLimitReached(count >= GUEST_LIMIT);
    } catch (error) {
      console.error("Error loading guest data:", error);
      resetGuestData();
    }
  }

  function resetGuestData() {
    setPlayedCount(0);
    setRemainingPlays(GUEST_LIMIT);
    setIsLimitReached(false);
    localStorage.setItem(STORAGE_KEY, "0");
    localStorage.setItem(TIMESTAMP_KEY, Date.now().toString());
  }

  function incrementPlayCount() {
    const newCount = playedCount + 1;
    setPlayedCount(newCount);
    setRemainingPlays(Math.max(0, GUEST_LIMIT - newCount));
    setIsLimitReached(newCount >= GUEST_LIMIT);

    localStorage.setItem(STORAGE_KEY, newCount.toString());
    localStorage.setItem(TIMESTAMP_KEY, Date.now().toString());
  }

  function canPlayNext(): boolean {
    return playedCount < GUEST_LIMIT;
  }

  return {
    playedCount,
    remainingPlays,
    isLimitReached,
    guestLimit: GUEST_LIMIT,
    canPlayNext,
    incrementPlayCount,
    resetGuestData,
  };
}
