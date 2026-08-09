function simpleFuzzyMatch(s1, s2) {
  const str1 = s1.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
  const str2 = s2.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
  if (str1 === str2) return 1.0;
  if (str1.length === 0 || str2.length === 0) return 0.0;
  const matrix = Array.from({ length: str1.length + 1 }, () => Array(str2.length + 1).fill(0));
  for (let i = 0; i <= str1.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= n; j++) matrix[0][j] = j; // wait, minor bug in test script: n is undefined, should be str2.length. Let's fix.
  return 0; // we will write it cleanly below
}

// Clean simple fuzzy match
function cleanFuzzyMatch(s1, s2) {
  const str1 = s1.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
  const str2 = s2.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
  if (str1 === str2) return 1.0;
  if (str1.length === 0 || str2.length === 0) return 0.0;
  const m = str1.length;
  const n = str2.length;
  const matrix = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
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

function findGlobalOffset(lrclibLines, dgWords) {
  const firstLines = lrclibLines.filter(l => l.text.trim().length > 0).slice(0, 3);
  if (firstLines.length === 0) return 0;
  
  const lrcCombined = firstLines.map(l => l.text).join('').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
  const targetTime = firstLines[0].time;
  
  let bestScore = 0;
  let bestOffset = 0;
  
  // We limit the search to the first 60 seconds of Deepgram words
  const searchWords = dgWords.filter(w => w.start < 60);
  
  for (let startIdx = 0; startIdx < searchWords.length; startIdx++) {
    let currentConcat = "";
    for (let endIdx = startIdx; endIdx < Math.min(searchWords.length, startIdx + 15); endIdx++) {
      currentConcat += searchWords[endIdx].word;
      const cleanConcat = currentConcat.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
      
      const score = cleanFuzzyMatch(lrcCombined, cleanConcat);
      if (score > bestScore) {
        bestScore = score;
        bestOffset = searchWords[startIdx].start - targetTime;
      }
    }
  }
  
  console.log(`Best offset score: ${bestScore}, offset: ${bestOffset}`);
  return bestScore >= 0.4 ? bestOffset : 0;
}

// Let's test
const lrclib = [
  { time: 10.0, text: "เธอมีฉัน" },
  { time: 14.0, text: "ฉันมีใคร" }
];
const dg = [
  { word: "เธอ", start: 12.5, end: 12.8 },
  { word: "มี", start: 12.8, end: 13.0 },
  { word: "ฉัน", start: 13.0, end: 13.3 },
  { word: "ฉัน", start: 16.5, end: 16.8 },
  { word: "มี", start: 16.8, end: 17.0 },
  { word: "ใคร", start: 17.0, end: 17.3 }
];
findGlobalOffset(lrclib, dg);
