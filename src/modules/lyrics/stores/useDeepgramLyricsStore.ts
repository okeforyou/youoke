import { create } from 'zustand';
import { LRCLIBLine, alignLyrics, DeepgramWord, AlignedWord } from '../engines/deepgramAlignEngine';
import { useAIVocalStore, getActiveBridgeBaseUrl } from '../../../stores/useAIVocalStore';

function groupDeepgramWordsIntoLines(words: DeepgramWord[]): LRCLIBLine[] {
  if (!words || words.length === 0) return [];
  
  const lines: any[] = [];
  let currentLineWords: AlignedWord[] = [];
  
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    currentLineWords.push({
      word: w.word,
      start: w.start,
      end: w.end
    });
    
    // Start a new line if:
    // 1. We have accumulated 6 words, OR
    // 2. The next word is starting more than 1.5 seconds after the current word ends
    const nextWord = words[i + 1];
    const isBigGap = nextWord ? (nextWord.start - w.end > 1.5) : false;
    
    if (currentLineWords.length >= 6 || isBigGap || i === words.length - 1) {
      const lineStart = currentLineWords[0].start;
      const lineEnd = currentLineWords[currentLineWords.length - 1].end;
      const lineText = currentLineWords.map(cw => cw.word).join(' ');
      
      lines.push({
        time: lineStart,
        text: lineText,
        duration: lineEnd - lineStart,
        words: [...currentLineWords]
      });
      
      // If there is a long silence gap before the next line (e.g. > 3.0 seconds),
      // insert an instrumental indicator line so the previous lyrics don't freeze on screen.
      if (nextWord && nextWord.start - lineEnd > 3.0) {
        lines.push({
          time: lineEnd + 0.5,
          text: "🎸 (ดนตรี) 🎸",
          duration: nextWord.start - lineEnd - 1.0,
          words: [] // Empty words list so it doesn't sweep, just displays the indicator
        });
      }
      
      currentLineWords = [];
    }
  }
  
  return lines;
}

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

