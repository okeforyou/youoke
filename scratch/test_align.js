// Needleman-Wunsch alignment for strings
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

  // Traceback
  let i = m;
  let j = n;
  const alignment1 = [];
  const alignment2 = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const scoreSub = s1[i - 1] === s2[j - 1] ? matchScore : mismatchScore;
      if (scoreMatrix[i][j] === scoreMatrix[i - 1][j - 1] + scoreSub) {
        alignment1.unshift(i - 1);
        alignment2.unshift(j - 1);
        i--;
        j--;
        continue;
      }
    }
    if (i > 0 && (j === 0 || scoreMatrix[i][j] === scoreMatrix[i - 1][j] + gapPenalty)) {
      alignment1.unshift(i - 1);
      alignment2.unshift(-1);
      i--;
    } else {
      alignment1.unshift(-1);
      alignment2.unshift(j - 1);
      j--;
    }
  }

  return { alignment1, alignment2 };
}

// Test
const lrclib = "ใจเรายังตรงกันอยู่ไหม";
const deepgram = "ใจเรายังตรงกันอยุ่ใหม";
console.log(alignStrings(lrclib, deepgram));
