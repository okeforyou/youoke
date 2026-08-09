function alignStrings(s1, s2) {
  const matchScore = 2;
  const mismatchScore = -1;
  const gapPenalty = -2;

  const m = s1.length;
  const n = s2.length;

  const scoreMatrix = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) scoreMatrix[i][0] = i * gapPenalty;
  for (let j = 0; j <= n; j++) scoreMatrix[0][j] = j * gapPenalty;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const scoreSub = s1[i - 1] === s2[j - 1] ? matchScore : mismatchScore;
      scoreMatrix[i][j] = Math.max(
        scoreMatrix[i - 1][j - 1] + scoreSub,
        scoreMatrix[i - 1][j] + gapPenalty,
        scoreMatrix[i][j - 1] + gapPenalty
      );
    }
  }

  let i = m;
  let j = n;
  const alignment = []; // array of { s1Idx, s2Idx }

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const scoreSub = s1[i - 1] === s2[j - 1] ? matchScore : mismatchScore;
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

// Map Deepgram word timestamps to characters
function getCharacterTimestamps(dgWords) {
  const chars = [];
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

function alignLyricsLrcToDg(lrclibText, dgWords, startTime, endTime) {
  const dgChars = getCharacterTimestamps(dgWords);
  const dgText = dgChars.map(c => c.char).join('');
  
  const alignment = alignStrings(lrclibText, dgText);

  // Map LRCLIB characters to timestamps
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

  // Interpolate missing timestamps (unaligned characters)
  let lastValEnd = startTime;
  for (let i = 0; i < lrcCharTimes.length; i++) {
    if (lrcCharTimes[i].start === -1) {
      // Find next valid timestamp
      let nextValStart = endTime;
      let nextAnchor = lrcCharTimes.length;
      for (let k = i + 1; k < lrcCharTimes.length; k++) {
        if (lrcCharTimes[k].start !== -1) {
          nextValStart = lrcCharTimes[k].start;
          nextAnchor = k;
          break;
        }
      }

      // Distribute the gap
      const gapSize = nextAnchor - i;
      const totalGapTime = Math.max(0, nextValStart - lastValEnd);
      const timePerChar = totalGapTime / gapSize;

      for (let k = i; k < nextAnchor; k++) {
        lrcCharTimes[k].start = lastValEnd + (k - i) * timePerChar;
        lrcCharTimes[k].end = lastValEnd + (k - i + 1) * timePerChar;
      }
      i = nextAnchor - 1;
    }
    lastValEnd = lrcCharTimes[i].end;
  }

  return lrcCharTimes;
}

// Test case:
const lrclibText = "ใจเรายังตรงกันอยู่ไหม";
const dgWords = [
  { word: "ใจเรา", start: 1.2, end: 1.6 },
  { word: "ยังตรงกัน", start: 1.6, end: 2.2 },
  { word: "อยุ่ใหม", start: 2.2, end: 2.8 }
];

console.log(alignLyricsLrcToDg(lrclibText, dgWords, 1.0, 3.0));
