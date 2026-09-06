import { create } from 'zustand';
import { LRCLIBLine, alignLyrics, DeepgramWord, AlignedWord, groupDeepgramWordsIntoLines } from '../engines/deepgramAlignEngine';
import { useAIVocalStore, getActiveBridgeBaseUrl, resolveDeepgramApiKey } from '../../../stores/useAIVocalStore';

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
    if (!videoId) return;
    
    set({ isAligning: true, alignmentStatus: 'aligning', errorMessage: null });
    
    try {
      let deepgramWords: DeepgramWord[] = [];
      const cached = localStorage.getItem(`ai_lyrics_${videoId}`);

      if (cached) {
          // Use cached Deepgram result
          deepgramWords = JSON.parse(cached);
      } else {
          // Verify we have the API key (multi-source resilient resolution)
          const deepgramKey = await resolveDeepgramApiKey();
          if (!deepgramKey) {
              throw new Error("ยังไม่ได้ตั้งค่า Deepgram API Key กรุณาตั้งค่าในหน้า AI Settings");
          }

          // Fetch vocals from local bridge
          const baseUrl = await getActiveBridgeBaseUrl();
          if (!baseUrl) {
              throw new Error("Local Bridge ออฟไลน์ หรือยังไม่ได้เปิดโปรแกรม");
          }

          // Call the local bridge /transcribe endpoint to handle file reading and transcription securely without browser CORS/mixed-content blocks
          let res;
          try {
              res = await fetch(`${baseUrl}/transcribe`, {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                      video_id: videoId,
                      api_key: deepgramKey,
                      provider: 'deepgram'
                  })
              });
          } catch (e: any) {
              throw new Error(`เชื่อมต่อ Local Bridge /transcribe ล้มเหลว (เกิดข้อผิดพลาด: ${e.message || String(e)})`);
          }

          if (!res.ok) {
              const errData = await res.json().catch(() => ({}));
              throw new Error(errData.detail || `Local Bridge /transcribe Error (${res.status})`);
          }

          const dgData = await res.json();
          deepgramWords = dgData.words || [];

          if (deepgramWords.length === 0) {
              throw new Error("AI ไม่สามารถแกะเนื้อเพลงจากไฟล์เสียงร้องได้");
          }

          // Cache the result
          localStorage.setItem(`ai_lyrics_${videoId}`, JSON.stringify(deepgramWords));
      }
      
      if (!originalLyrics || originalLyrics.length === 0) {
          throw new Error("ไม่พบเนื้อเพลงตั้งต้น (LRCLIB) สำหรับทำ Hybrid Sync");
      }

      // True Hybrid Approach: Align Deepgram times onto LRCLIB text
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
      throw err;
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

