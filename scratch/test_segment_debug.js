const segmenter = new Intl.Segmenter('th', { granularity: 'word' });
const segments = Array.from(segmenter.segment("ใจเรายังตรงกัน"));
console.log(segments);
