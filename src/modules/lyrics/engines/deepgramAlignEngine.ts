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
  const str1 = s1.toLowerCase().replace(/[\s\W_]+/g, '');
  const str2 = s2.toLowerCase().replace(/[\s\W_]+/g, '');

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
    const lineTextClean = line.text.toLowerCase().replace(/[\s\W_]+/g, '');
    
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
         currentConcat += validWords[end].word.toLowerCase().replace(/[\s\W_]+/g, '');
         
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
           alignedLines.push({
               ...line,
               time: matchedStart,
               duration: matchedEnd - matchedStart
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
