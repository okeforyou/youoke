import { create } from 'zustand';
import { LRCLIBLine, alignLyrics, DeepgramWord } from '../engines/deepgramAlignEngine';
import { useAIVocalStore, getActiveBridgeBaseUrl } from '../../../stores/useAIVocalStore';

interface DeepgramLyricsState {
  alignedLyrics: LRCLIBLine[];
  isAligning: boolean;
  alignmentStatus: 'idle' | 'aligning' | 'success' | 'error';
  errorMessage: string | null;
  hybridModeEnabled: boolean;
  
  setHybridModeEnabled: (enabled: boolean) => void;
  alignHybridLyrics: (videoId: string, originalLyrics: LRCLIBLine[]) => Promise<void>;
  reset: () => void;
}

export const useDeepgramLyricsStore = create<DeepgramLyricsState>((set, get) => ({
  alignedLyrics: [],
  isAligning: false,
  alignmentStatus: 'idle',
  errorMessage: null,
  hybridModeEnabled: false,

  setHybridModeEnabled: (enabled) => set({ hybridModeEnabled: enabled }),

  alignHybridLyrics: async (videoId, originalLyrics) => {
    if (!videoId || !originalLyrics || originalLyrics.length === 0) return;
    
    set({ isAligning: true, alignmentStatus: 'aligning', errorMessage: null });
    
    try {
      let deepgramWords: DeepgramWord[] = [];
      const cached = localStorage.getItem(`ai_lyrics_${videoId}`);

      if (cached) {
          // Use cached Deepgram result
          deepgramWords = JSON.parse(cached);
      } else {
          // Verify we have the API key
          const { deepgramKey } = useAIVocalStore.getState();
          if (!deepgramKey) {
              throw new Error("ยังไม่ได้ตั้งค่า Deepgram API Key กรุณาตั้งค่าในหน้า AI Settings");
          }

          // Fetch vocals from local bridge
          const baseUrl = await getActiveBridgeBaseUrl();
          if (!baseUrl) {
              throw new Error("Local Bridge ออฟไลน์ หรือยังไม่ได้เปิดโปรแกรม");
          }

          const audioRes = await fetch(`${baseUrl}/files/${videoId}/vocals.m4a`);
          if (!audioRes.ok) {
              throw new Error("ไม่พบไฟล์เสียงร้อง (vocals.m4a) สำหรับเพลงนี้ กรุณาให้ระบบประมวลผลเสียงร้องก่อน");
          }
          const audioBlob = await audioRes.blob();

          // Transcribe via Deepgram API
          const res = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&language=th&smart_format=true', {
              method: 'POST',
              headers: {
                  'Authorization': `Token ${deepgramKey}`,
                  'Content-Type': 'audio/m4a'
              },
              body: audioBlob
          });

          if (!res.ok) {
              throw new Error("เกิดข้อผิดพลาดในการดึงข้อมูลจาก Deepgram API");
          }

          const dgData = await res.json();
          deepgramWords = dgData.results?.channels?.[0]?.alternatives?.[0]?.words || [];

          if (deepgramWords.length === 0) {
              throw new Error("AI ไม่สามารถแกะเนื้อเพลงจากไฟล์เสียงร้องได้");
          }

          // Cache the result
          localStorage.setItem(`ai_lyrics_${videoId}`, JSON.stringify(deepgramWords));
      }
      
      // Pass to the Alignment Engine
      const alignedLines = alignLyrics(deepgramWords, originalLyrics);
      
      set({ 
        alignedLyrics: alignedLines, 
        isAligning: false, 
        alignmentStatus: 'success',
        // Automatically enable hybrid mode if alignment succeeds
        hybridModeEnabled: true 
      });
    } catch (err: any) {
      console.error("Deepgram Alignment failed:", err);
      set({ 
        isAligning: false, 
        alignmentStatus: 'error', 
        errorMessage: err.message || 'Unknown error occurred'
      });
    }
  },
  
  reset: () => set({
    alignedLyrics: [],
    isAligning: false,
    alignmentStatus: 'idle',
    errorMessage: null,
    hybridModeEnabled: false
  })
}));

