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
  time: number; // The new aligned start time
  text: string;
  duration?: number;
  words?: AlignedWord[];
}

/**
 * Calculates Normalized Levenshtein Distance (0.0 to 1.0)
 * 1.0 means exact match, 0.0 means completely different.
 */
function fuzzyMatch(s1: string, s2: string): number {
  const str1 = s1.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
  const str2 = s2.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');

  if (str1 === str2) return 1.0;
  if (str1.length === 0 || str2.length === 0) return 0.0;

  const matrix = Array.from({ length: str1.length + 1 }, () => Array(str2.length + 1).fill(0));

  for (let i = 0; i <= str1.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= str2.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= str1.length; i++) {
    for (let j = 1; j <= str2.length; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  const distance = matrix[str1.length][str2.length];
  const maxLength = Math.max(str1.length, str2.length);
  return 1.0 - distance / maxLength;
}

/**
 * Deepgram + LRCLIB Hybrid Alignment Engine
 */
function segmentWords(text: string): string[] {
  if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
    try {
      const segmenter = new (Intl as any).Segmenter('th', { granularity: 'word' });
      return Array.from(segmenter.segment(text))
        .map((s: any) => s.segment)
        .filter(w => w.trim().length > 0);
    } catch (e) {}
  }
  // Fallback: split by spaces and keep them separate
  return text.split(/(\s+)/).filter(w => w.trim().length > 0);
}

/**
 * Deepgram + LRCLIB Hybrid Alignment Engine
 */
export function alignLyrics(deepgramWords: DeepgramWord[], lrclibLines: LRCLIBLine[]): AlignedLine[] {
  if (!deepgramWords || deepgramWords.length === 0) {
    return lrclibLines;
  }

  // Filter out low confidence words to remove instrumental noise
  const validWords = deepgramWords.filter(w => w.confidence >= 0.4);

  const alignedLines: AlignedLine[] = [];
  let currentWordIdx = 0;

  for (let i = 0; i < lrclibLines.length; i++) {
    const line = lrclibLines[i];
    if (!line.text.trim()) {
       alignedLines.push({ ...line });
       continue;
    }

    // Strip spaces and special chars to match against Deepgram words
    const lineTextClean = line.text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
    
    let bestMatchScore = 0;
    let bestWindowStart = currentWordIdx;
    let bestWindowEnd = currentWordIdx;

    // Search window: Look ahead up to 20 words to find the best match for this line
    const MAX_LOOKAHEAD = 20;
    const windowLimit = Math.min(validWords.length, currentWordIdx + MAX_LOOKAHEAD);

    // We try different window sizes (groupings of Deepgram words) to find the one that sounds most like `line.text`
    for (let start = currentWordIdx; start < windowLimit; start++) {
      let currentConcat = '';
      for (let end = start; end < Math.min(validWords.length, start + 10); end++) {
         currentConcat += validWords[end].word.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
         
         const score = fuzzyMatch(lineTextClean, currentConcat);
         if (score > bestMatchScore) {
             bestMatchScore = score;
             bestWindowStart = start;
             bestWindowEnd = end;
         }
      }
    }

    // If we found a decent match (>= 40% similarity for long strings)
    if (bestMatchScore >= 0.4) {
       const matchedStart = validWords[bestWindowStart].start;
       const matchedEnd = validWords[bestWindowEnd].end;
       
       // Only accept if the matched time is not absurdly far from the original LRCLIB time (e.g. > 30s drift is suspicious)
       if (Math.abs(matchedStart - line.time) < 30) {
           // Perform word-level alignment for this matched segment
           const lineWords = segmentWords(line.text);
           const matchedDgWords = validWords.slice(bestWindowStart, bestWindowEnd + 1);

           const alignedWords: AlignedWord[] = [];
           let dgIdx = 0;

           for (let wIdx = 0; wIdx < lineWords.length; wIdx++) {
               const lWord = lineWords[wIdx];
               const lWordClean = lWord.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
               
               let bestWordMatchIdx = -1;
               let bestWordScore = 0;
               
               // Lookahead of 3 words
               for (let k = dgIdx; k < Math.min(matchedDgWords.length, dgIdx + 3); k++) {
                   const dgWordClean = matchedDgWords[k].word.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
                   const score = fuzzyMatch(lWordClean, dgWordClean);
                   if (score > bestWordScore) {
                       bestWordScore = score;
                       bestWordMatchIdx = k;
                   }
               }
               
               if (bestWordScore >= 0.5 && bestWordMatchIdx !== -1) {
                   alignedWords.push({
                       word: lWord,
                       start: matchedDgWords[bestWordMatchIdx].start,
                       end: matchedDgWords[bestWordMatchIdx].end
                   });
                   dgIdx = bestWordMatchIdx + 1;
               } else {
                   alignedWords.push({
                       word: lWord,
                       start: -1,
                       end: -1
                   });
               }
           }

           // Word-level linear interpolation for unaligned words
           for (let wIdx = 0; wIdx < alignedWords.length; wIdx++) {
               if (alignedWords[wIdx].start === -1) {
                   // Find previous anchor
                   let prevTime = matchedStart;
                   for (let k = wIdx - 1; k >= 0; k--) {
                       if (alignedWords[k].end !== -1) {
                           prevTime = alignedWords[k].end;
                           break;
                       }
                   }
                   
                   // Find next anchor
                   let nextTime = matchedEnd;
                   let nextAnchorIdx = alignedWords.length;
                   for (let k = wIdx + 1; k < alignedWords.length; k++) {
                       if (alignedWords[k].start !== -1) {
                           nextTime = alignedWords[k].start;
                           nextAnchorIdx = k;
                           break;
                       }
                   }
                   
                   // Count characters in this unaligned block to distribute duration
                   let segmentCharCount = 0;
                   for (let k = wIdx; k < nextAnchorIdx; k++) {
                       segmentCharCount += alignedWords[k].word.length;
                   }
                   
                   const timeGap = Math.max(0.01, nextTime - prevTime);
                   let currentOffset = 0;
                   for (let k = wIdx; k < nextAnchorIdx; k++) {
                       const wordWeight = alignedWords[k].word.length / Math.max(1, segmentCharCount);
                       const wordDuration = timeGap * wordWeight;
                       alignedWords[k].start = prevTime + currentOffset;
                       alignedWords[k].end = prevTime + currentOffset + wordDuration;
                       currentOffset += wordDuration;
                   }
                   
                   wIdx = nextAnchorIdx - 1;
               }
           }

           alignedLines.push({
               ...line,
               time: matchedStart,
               duration: matchedEnd - matchedStart,
               words: alignedWords
           });
           
           // Move the pointer forward for monotonic windowing
           currentWordIdx = bestWindowEnd + 1;
           continue;
       }
    }

    // Fallback: If no good match was found, use linear interpolation based on previous lines
    // or just keep the original time if it's the first line.
    alignedLines.push({ ...line });
  }

  // Second pass: Interpolate unmatched lines between anchors
  let lastAnchorIdx = -1;
  for (let i = 0; i <= alignedLines.length; i++) {
      const isAnchor = i < alignedLines.length ? alignedLines[i].duration !== undefined && alignedLines[i].duration !== lrclibLines[i].duration : true;
      
      if (isAnchor) {
          const numUnmatched = i - lastAnchorIdx - 1;
          if (numUnmatched > 0) {
              const startAnchorTime = lastAnchorIdx >= 0 ? alignedLines[lastAnchorIdx].time + (alignedLines[lastAnchorIdx].duration || 2) : 0;
              const endAnchorTime = i < alignedLines.length ? alignedLines[i].time : startAnchorTime + (numUnmatched * 3); // 3s per line default if at end
              
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
