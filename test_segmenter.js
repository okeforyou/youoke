const text = "รักษาเท่าไรกับเหมือนเดิมถึงแม้กำลังจะหายใจเป็นสิ่งของไม่มีชีวิตข้างในบุบสลายอยากจะคิดเยียวยาจนเมื่อฉันได้มาเจอกับเธอ";

const chunkText = (text, maxLength) => {
    if (text.length <= maxLength) return [text];
    
    // Check if Intl.Segmenter is supported
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
        const segmenter = new Intl.Segmenter('th', { granularity: 'word' });
        const segments = Array.from(segmenter.segment(text));
        
        const chunks = [];
        let currentChunk = "";
        
        for (const { segment } of segments) {
            if (currentChunk.length + segment.length > maxLength) {
                if (currentChunk.length > 0) {
                    chunks.push(currentChunk.trim());
                    currentChunk = segment;
                } else {
                    // Single word is longer than maxLength
                    chunks.push(segment.trim());
                    currentChunk = "";
                }
            } else {
                currentChunk += segment;
            }
        }
        if (currentChunk.trim().length > 0) chunks.push(currentChunk.trim());
        return chunks;
    }
    
    // Fallback if no segmenter
    const chunks = [];
    let remaining = text;
    while(remaining.length > 0) {
        chunks.push(remaining.substring(0, maxLength));
        remaining = remaining.substring(maxLength);
    }
    return chunks;
};

console.log(chunkText(text, 35));
