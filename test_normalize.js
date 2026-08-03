function normalizeLyrics(lyrics, maxLength = 40) {
    if (!lyrics || lyrics.length === 0) return [];
    
    const result = [];
    
    const chunkText = (text, maxLen) => {
        if (text.length <= maxLen) return [text];
        
        if (typeof Intl !== 'undefined' && Intl.Segmenter) {
            const segmenter = new Intl.Segmenter('th', { granularity: 'word' });
            const segments = Array.from(segmenter.segment(text));
            const chunks = [];
            let currentChunk = "";
            for (const { segment } of segments) {
                if (currentChunk.length + segment.length > maxLen) {
                    if (currentChunk.length > 0) {
                        chunks.push(currentChunk.trim());
                        currentChunk = segment;
                    } else {
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
        
        // Fallback split by space if possible
        const words = text.split(' ');
        if (words.length > 1) {
            const chunks = [];
            let currentChunk = "";
            for (const word of words) {
                if ((currentChunk + " " + word).length > maxLen) {
                    if (currentChunk.length > 0) {
                        chunks.push(currentChunk.trim());
                        currentChunk = word;
                    } else {
                        chunks.push(word);
                        currentChunk = "";
                    }
                } else {
                    currentChunk += (currentChunk.length > 0 ? " " : "") + word;
                }
            }
            if (currentChunk.trim().length > 0) chunks.push(currentChunk.trim());
            return chunks;
        }

        // Hard fallback
        const chunks = [];
        let remaining = text;
        while(remaining.length > 0) {
            chunks.push(remaining.substring(0, maxLen));
            remaining = remaining.substring(maxLen);
        }
        return chunks;
    };

    for (let i = 0; i < lyrics.length; i++) {
        const line = lyrics[i];
        
        if (!line.text || line.text.length <= maxLength) {
            result.push(line);
            continue;
        }

        const chunks = chunkText(line.text, maxLength);
        if (chunks.length === 1) {
            result.push({ time: line.time, text: chunks[0] });
            continue;
        }

        // Calculate time distribution
        const nextTime = i < lyrics.length - 1 ? lyrics[i + 1].time : line.time + (line.text.length * 0.15); // Assume 150ms per char if last line
        const totalDuration = nextTime - line.time;
        const totalChars = line.text.length;
        
        let currentTime = line.time;
        for (const chunk of chunks) {
            result.push({ time: currentTime, text: chunk });
            // Add proportional time based on character count of this chunk
            const chunkDuration = (chunk.length / totalChars) * totalDuration;
            currentTime += chunkDuration;
        }
    }
    
    return result;
}

const input = [
  { time: 0, text: "Intro" },
  { time: 10, text: "รักษาเท่าไรกับเหมือนเดิมไรแม้กำลังจะหายใจเป็นสิ่งของไม่มีชีวิตข้างในบุบสลายจากเกิดจะคิดเยียวยาจนเมื่อฉันได้มาเจอกับเธอ" },
  { time: 25, text: "Outro" }
];

console.log(normalizeLyrics(input, 35));
