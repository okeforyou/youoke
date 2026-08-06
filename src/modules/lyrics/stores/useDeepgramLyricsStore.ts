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

          const audioRes = await fetch(`${baseUrl}/files/${videoId}/vocals.m4a`);
          if (!audioRes.ok) {
              throw new Error("ไม่พบไฟล์เสียงร้อง (vocals.m4a) สำหรับเพลงนี้ กรุณาให้ระบบประมวลผลเสียงร้องก่อน");
          }
          const audioBlob = await audioRes.blob();

          // Transcribe via Deepgram API directly from browser (direct POC)
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
      
      // POC: Bypass alignment engine and display raw Deepgram words grouped into lines
      const alignedLines = groupDeepgramWordsIntoLines(deepgramWords);
      
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

