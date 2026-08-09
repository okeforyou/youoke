function simpleFuzzyMatch(s1, s2) {
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
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return 1.0 - matrix[str1.length][str2.length] / Math.max(str1.length, str2.length);
}

function findGlobalOffset(lrclibLines, dgWords) {
  // Find first 3 non-empty lines
  const firstLines = lrclibLines.filter(l => l.text.trim().length > 0).slice(0, 3);
  if (firstLines.length === 0) return 0;
  
  const lrcCombined = firstLines.map(l => l.text).join('').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
  const targetTime = firstLines[0].time;
  
  let bestScore = 0;
  let bestOffset = 0;
  
  // We limit the search to the first 45 seconds of Deepgram words
  const searchWords = dgWords.filter(w => w.start < 45);
  
  for (let startIdx = 0; startIdx < searchWords.length; startIdx++) {
    let currentConcat = "";
    for (let endIdx = startIdx; endIdx < Math.min(searchWords.length, startIdx + 15); endIdx++) {
      currentConcat += searchWords[endIdx].word;
      const cleanConcat = currentConcat.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
      
      // Calculate match
      const score = simpleFuzzyMatch(lrcCombined, cleanConcat);
      if (score > bestScore) {
        bestScore = score;
        bestOffset = searchWords[startIdx].start - targetTime;
      }
    }
  }
  
  console.log(`Best offset score: ${bestScore}, offset: ${bestOffset}`);
  return bestScore >= 0.5 ? bestOffset : 0;
}

// Test data
const lrclibLines = [
  { time: 10.0, text: "เธอมีฉัน" },
  { time: 14.0, text: "ฉันมีใคร" },
  { time: 18.0, text: "ใจเรายังตรงกันอยู่ไหม" }
];

const dgWords = [
  { word: "ดนตรี", start: 0.5, end: 2.0 },
  { word: "เธอ", start: 12.5, end: 12.8 },
  { word: "มี", start: 12.8, end: 13.0 },
  { word: "ฉัน", start: 13.0, end: 13.3 },
  { word: "ฉัน", start: 16.5, end: 16.8 },
  { word: "มี", start: 16.8, end: 17.0 },
  { word: "ใคร", start: 17.0, end: 17.3 },
  { word: "ใจเรา", start: 20.5, end: 21.0 },
  { word: "ยังตรงกัน", start: 21.0, end: 21.8 },
  { word: "อยู่ไหม", start: 21.8, end: 22.5 }
];

findGlobalOffset(lrclibLines, dgWords);
