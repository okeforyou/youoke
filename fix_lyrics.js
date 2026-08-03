const processThaiSpaces = (text) => {
    if (!text) return text;
    // Replace spaces between Thai characters. We can just use a simple replacer.
    // Instead of regex, we can process character by character.
    let result = "";
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === ' ') {
            // Check left for Thai char
            let leftThai = false;
            for (let j = i - 1; j >= 0; j--) {
                if (text[j] !== ' ') {
                    if (/^[ก-๙]$/.test(text[j])) leftThai = true;
                    break;
                }
            }
            // Check right for Thai char
            let rightThai = false;
            for (let j = i + 1; j < text.length; j++) {
                if (text[j] !== ' ') {
                    if (/^[ก-๙]$/.test(text[j])) rightThai = true;
                    break;
                }
            }
            if (leftThai && rightThai) {
                continue; // Skip the space
            }
        }
        result += char;
    }
    return result;
};
console.log(processThaiSpaces("ให้ ความ ทรง จำ คอย รั้ง"));
console.log(processThaiSpaces("Hello world ให้ ความ ทรง จำ"));
