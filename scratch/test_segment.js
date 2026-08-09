const segmenter = new Intl.Segmenter('th', { granularity: 'word' });

function segmentWords(text) {
  const segments = Array.from(segmenter.segment(text));
  const words = [];
  for (const seg of segments) {
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
}

console.log(segmentWords("ใจเรายังตรงกัน"));
console.log(segmentWords("never gonna give you up"));
console.log(segmentWords("เธอมีฉัน, ฉันมีใคร"));
