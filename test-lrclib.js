const title = "Bodyslam - ยาพิษ (Official MV)";
const cleanTitle = title.replace(/(\(|\[).*?(official|mv|lyrics|lyric|audio|video|live).*?(\)|\])/gi, '').trim();

async function search() {
    const res = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(cleanTitle)}`);
    const data = await res.json();
    console.log("Search 'q':", data.length > 0 ? data[0].trackName : "Not found");
    
    // Split by dash
    const parts = cleanTitle.split('-');
    if (parts.length >= 2) {
        const artist = parts[0].trim();
        const track = parts[1].trim();
        const res2 = await fetch(`https://lrclib.net/api/search?track_name=${encodeURIComponent(track)}&artist_name=${encodeURIComponent(artist)}`);
        const data2 = await res2.json();
        console.log("Search 'artist + track':", data2.length > 0 ? data2[0].trackName : "Not found");
    }
}
search();
