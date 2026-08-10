export interface DeepgramWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

export interface LRCLIBLine {
  id?: number;
  time: number;
  text: string;
  duration?: number;
}

export interface AlignedWord {
  word: string;
  start: number;
  end: number;
}

export interface AlignedLine {
  id?: number;
  time: number;
  text: string;
  duration?: number;
  words?: AlignedWord[];
}

interface Edge {
  s1Idx: number;
  s2Idx: number;
}

/**
 * Needleman-Wunsch character sequence alignment
 */
function alignStrings(s1: string, s2: string): Edge[] {
  const matchScore = 2;
  const mismatchScore = -1;
  const gapPenalty = -2;

  const m = s1.length;
  const n = s2.length;

  const scoreMatrix: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) scoreMatrix[i][0] = i * gapPenalty;
  for (let j = 0; j <= n; j++) scoreMatrix[0][j] = j * gapPenalty;

  for (let i = 1; i <= m; i++) {
    const c1 = s1[i - 1].toLowerCase();
    for (let j = 1; j <= n; j++) {
      const c2 = s2[j - 1].toLowerCase();
      const scoreSub = c1 === c2 ? matchScore : mismatchScore;
      scoreMatrix[i][j] = Math.max(
        scoreMatrix[i - 1][j - 1] + scoreSub,
        scoreMatrix[i - 1][j] + gapPenalty,
        scoreMatrix[i][j - 1] + gapPenalty
      );
    }
  }

  let i = m;
  let j = n;
  const alignment: Edge[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const c1 = s1[i - 1].toLowerCase();
      const c2 = s2[j - 1].toLowerCase();
      const scoreSub = c1 === c2 ? matchScore : mismatchScore;
      if (scoreMatrix[i][j] === scoreMatrix[i - 1][j - 1] + scoreSub) {
        alignment.unshift({ s1Idx: i - 1, s2Idx: j - 1 });
        i--;
        j--;
        continue;
      }
    }
    if (i > 0 && (j === 0 || scoreMatrix[i][j] === scoreMatrix[i - 1][j] + gapPenalty)) {
      alignment.unshift({ s1Idx: i - 1, s2Idx: -1 });
      i--;
    } else {
      alignment.unshift({ s1Idx: -1, s2Idx: j - 1 });
      j--;
    }
  }

  return alignment;
}

/**
 * Linearly interpolates character timestamps inside each Deepgram word
 */
interface CharTimestamp {
  char: string;
  start: number;
  end: number;
}

function getCharacterTimestamps(dgWords: DeepgramWord[]): CharTimestamp[] {
  const chars: CharTimestamp[] = [];
  for (const w of dgWords) {
    const wordLen = w.word.length;
    const duration = w.end - w.start;
    const charDuration = duration / Math.max(1, wordLen);
    for (let i = 0; i < wordLen; i++) {
      chars.push({
        char: w.word[i],
        start: w.start + i * charDuration,
        end: w.start + (i + 1) * charDuration
      });
    }
  }
  return chars;
}

/**
 * Word segmenter fallback for Thai
 */
function segmentWords(text: string): string[] {
  if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
    try {
      const segmenter = new (Intl as any).Segmenter('th', { granularity: 'word' });
      const segments = Array.from(segmenter.segment(text));
      const words: string[] = [];
      for (const seg of segments as any[]) {
        if (seg.isWordLike) {
          words.push(seg.segment);
        } else {
          if (words.length > 0) {
            words[words.length - 1] += seg.segment;
          } else {
            words.push(seg.segment);
          }
        }
      }
      return words.filter(w => w.length > 0);
    } catch (e) {}
  }
  // Fallback: split by spaces and keep them attached
  const parts = text.split(/(\s+)/);
  const words: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part.trim().length > 0) {
      words.push(part);
    } else {
      if (words.length > 0) {
        words[words.length - 1] += part;
      }
    }
  }
  return words;
}

/**
 * Align an LRCLIB line with a list of Deepgram words at character level
 */
function alignSingleLine(
  lrclibText: string,
  dgWords: DeepgramWord[],
  lineStartTime: number,
  lineEndTime: number
): AlignedWord[] {
  const lineWords = segmentWords(lrclibText);
  if (lineWords.length === 0) return [];

  // 1. Get character-level timestamps for all Deepgram words in this window
  const dgChars = getCharacterTimestamps(dgWords);
  const dgText = dgChars.map(c => c.char).join('');

  // 2. Perform Needleman-Wunsch character alignment
  const alignment = alignStrings(lrclibText, dgText);

  // 3. Map aligned character timestamps
  const lrcCharTimes = Array.from({ length: lrclibText.length }, (_, idx) => ({
    char: lrclibText[idx],
    start: -1,
    end: -1
  }));

  for (const edge of alignment) {
    if (edge.s1Idx !== -1 && edge.s2Idx !== -1) {
      lrcCharTimes[edge.s1Idx].start = dgChars[edge.s2Idx].start;
      lrcCharTimes[edge.s1Idx].end = dgChars[edge.s2Idx].end;
    }
  }

  // 4. Interpolate missing timestamps (unaligned characters) with speed capping to avoid slow drags
  let lastValEnd = lineStartTime;
  for (let i = 0; i < lrcCharTimes.length; i++) {
    if (lrcCharTimes[i].start === -1) {
      let nextValStart = lineEndTime;
      let nextAnchor = lrcCharTimes.length;
      for (let k = i + 1; k < lrcCharTimes.length; k++) {
        if (lrcCharTimes[k].start !== -1) {
          nextValStart = lrcCharTimes[k].start;
          nextAnchor = k;
          break;
        }
      }

      const gapSize = nextAnchor - i;
      const totalGapTime = Math.max(0, nextValStart - lastValEnd);
      
      // Limit character sweep time to max 0.22 seconds (220ms) to prevent unnatural slow sweeps.
      // Anchor the active sweep window to the end of the gap (before the next word starts)
      // to keep lyrics in sync with actual singing timing.
      const maxCharTime = 0.22;
      const timePerChar = Math.min(maxCharTime, totalGapTime / gapSize);
      const activeDuration = gapSize * timePerChar;
      const activeStart = Math.max(lastValEnd, nextValStart - activeDuration);

      for (let k = i; k < nextAnchor; k++) {
        lrcCharTimes[k].start = activeStart + (k - i) * timePerChar;
        lrcCharTimes[k].end = activeStart + (k - i + 1) * timePerChar;
      }
      i = nextAnchor - 1;
    }
    lastValEnd = lrcCharTimes[i].end;
  }

  // 5. Group characters back into words
  const alignedWords: AlignedWord[] = [];
  let charIdx = 0;

  for (const word of lineWords) {
    const wordStartIdx = lrclibText.indexOf(word, charIdx);
    if (wordStartIdx === -1) {
      alignedWords.push({ word, start: lineStartTime, end: lineEndTime });
      continue;
    }

    const wordEndIdx = wordStartIdx + word.length;
    const wordChars = lrcCharTimes.slice(wordStartIdx, wordEndIdx);
    
    const wordStart = wordChars[0]?.start ?? lineStartTime;
    const wordEnd = wordChars[wordChars.length - 1]?.end ?? lineEndTime;

    alignedWords.push({
      word,
      start: wordStart,
      end: wordEnd
    });

    charIdx = wordEndIdx;
  }

  return alignedWords;
}

/**
 * Calculates Levenshtein-based fuzzy match score
 */
function simpleFuzzyMatch(s1: string, s2: string): number {
  const str1 = s1.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
  const str2 = s2.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');

  if (str1 === str2) return 1.0;
  if (str1.length === 0 || str2.length === 0) return 0.0;

  const m = str1.length;
  const n = str2.length;
  const matrix = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) matrix[i][0] = i;
  for (let j = 0; j <= n; j++) matrix[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return 1.0 - matrix[m][n] / Math.max(m, n);
}

/**
 * Automatically calculates a global offset to shift the entire LRCLIB timeline
 */
function findGlobalOffset(lrclibLines: LRCLIBLine[], dgWords: DeepgramWord[]): number {
  // Find first 3 non-empty lines
  const firstLines = lrclibLines.filter(l => l.text.trim().length > 0).slice(0, 3);
  if (firstLines.length === 0) return 0;
  
  const lrcCombined = firstLines.map(l => l.text).join('').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
  const targetTime = firstLines[0].time;
  
  let bestScore = 0;
  let bestOffset = 0;
  
  // Search only the first 60 seconds of Deepgram transcript for safe intro calculation
  const searchWords = dgWords.filter(w => w.start < 60);
  const targetLength = lrcCombined.length;
  
  if (targetLength === 0) return 0;
  
  for (let startIdx = 0; startIdx < searchWords.length; startIdx++) {
    let currentConcat = "";
    // Dynamically expand the window up to 40 words, but stop if text length exceeds targetLength * 1.5
    for (let endIdx = startIdx; endIdx < Math.min(searchWords.length, startIdx + 40); endIdx++) {
      currentConcat += searchWords[endIdx].word;
      const cleanConcat = currentConcat.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
      
      if (cleanConcat.length > targetLength * 1.5) {
        break;
      }
      
      // Only score if the window contains a reasonable amount of text relative to the target
      if (cleanConcat.length >= targetLength * 0.5) {
        const score = simpleFuzzyMatch(lrcCombined, cleanConcat);
        if (score > bestScore) {
          bestScore = score;
          bestOffset = searchWords[startIdx].start - targetTime;
        }
      }
    }
  }
  
  console.log(`[AI Sync] Global offset match score: ${bestScore.toFixed(2)}, offset: ${bestOffset.toFixed(2)}s`);
  return bestScore >= 0.4 ? bestOffset : 0;
}

/**
 * Deepgram + LRCLIB Hybrid Alignment Engine
 */
export function alignLyrics(deepgramWords: DeepgramWord[], lrclibLines: LRCLIBLine[]): AlignedLine[] {
  if (!deepgramWords || deepgramWords.length === 0) {
    return lrclibLines;
  }

  const validWords = deepgramWords.filter(w => w.confidence >= 0.4);
  const alignedLines: AlignedLine[] = [];
  
  const isSynced = lrclibLines.some(l => l.time > 0);

  if (isSynced) {
    // Calculate global offset to sync the first lines of LRCLIB to the actual audio
    const globalOffset = findGlobalOffset(lrclibLines, validWords);
    console.log(`[AI Sync] Shifting all line timelines by global offset: ${globalOffset.toFixed(2)}s`);

    // Mode 1: Trust LRCLIB line times (shifted by global offset)
    for (let i = 0; i < lrclibLines.length; i++) {
      const line = lrclibLines[i];
      if (!line.text.trim()) {
         alignedLines.push({
           ...line,
           time: Math.max(0, line.time + globalOffset)
         });
         continue;
      }

      const startTime = Math.max(0, line.time + globalOffset);
      let nextTime = startTime + 5;
      if (i + 1 < lrclibLines.length && lrclibLines[i + 1].time > line.time) {
         nextTime = Math.max(0, lrclibLines[i + 1].time + globalOffset);
      }
      const duration = nextTime - startTime;

      // Find deepgram words in this time window (with a 2.0s buffer for safety)
      const windowWords = validWords.filter(w => w.start >= startTime - 2.0 && w.start <= nextTime + 1.5);

      const alignedWords = alignSingleLine(line.text, windowWords, startTime, nextTime);

      alignedLines.push({
          ...line,
          time: startTime,
          duration: duration,
          words: alignedWords
      });
    }
    return alignedLines;
  }

  // Mode 2: Unsynced Lyrics (Plain Text)
  let currentWordIdx = 0;
  for (let i = 0; i < lrclibLines.length; i++) {
    const line = lrclibLines[i];
    if (!line.text.trim()) {
       alignedLines.push({ ...line });
       continue;
      }

    const lineTextClean = line.text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
    let bestMatchScore = 0;
    let bestWindowStart = currentWordIdx;
    let bestWindowEnd = currentWordIdx;
    const windowLimit = Math.min(validWords.length, currentWordIdx + 20);

    for (let start = currentWordIdx; start < windowLimit; start++) {
      let currentConcat = '';
      for (let end = start; end < Math.min(validWords.length, start + 10); end++) {
         currentConcat += validWords[end].word.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
         const score = simpleFuzzyMatch(lineTextClean, currentConcat);
         if (score > bestMatchScore) {
             bestMatchScore = score;
             bestWindowStart = start;
             bestWindowEnd = end;
         }
      }
    }

    if (bestMatchScore >= 0.4) {
       const matchedStart = validWords[bestWindowStart].start;
       const matchedEnd = validWords[bestWindowEnd].end;
       
       const matchedDgWords = validWords.slice(bestWindowStart, bestWindowEnd + 1);
       const alignedWords = alignSingleLine(line.text, matchedDgWords, matchedStart, matchedEnd);

       alignedLines.push({
            ...line,
            time: matchedStart,
            duration: matchedEnd - matchedStart,
            words: alignedWords
       });
        
       currentWordIdx = bestWindowEnd + 1;
       continue;
    }
    alignedLines.push({ ...line });
  }

  // Interpolate missing line times in Mode 2
  let lastAnchorIdx = -1;
  for (let i = 0; i <= alignedLines.length; i++) {
      const isAnchor = i < alignedLines.length ? alignedLines[i].duration !== undefined : true;
      if (isAnchor) {
          const numUnmatched = i - lastAnchorIdx - 1;
          if (numUnmatched > 0) {
              const startAnchorTime = lastAnchorIdx >= 0 ? alignedLines[lastAnchorIdx].time + (alignedLines[lastAnchorIdx].duration || 2) : 0;
              const endAnchorTime = i < alignedLines.length ? alignedLines[i].time : startAnchorTime + (numUnmatched * 3);
              
              const timeAvailable = endAnchorTime - startAnchorTime;
              const timePerLine = Math.max(0.1, timeAvailable / (numUnmatched + 1));
              
              for (let j = 1; j <= numUnmatched; j++) {
                  alignedLines[lastAnchorIdx + j].time = startAnchorTime + (timePerLine * j);
                  alignedLines[lastAnchorIdx + j].duration = timePerLine;
              }
          }
          lastAnchorIdx = i;
      }
  }

  return alignedLines;
}

export function groupDeepgramWordsIntoLines(words: DeepgramWord[]): LRCLIBLine[] {
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

