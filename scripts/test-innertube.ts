import YTMusic from 'ytmusic-api';

async function testInnerTube() {
    const ytmusic = new YTMusic();
    await ytmusic.initialize();

    console.log("🚀 Testing InnerTube API (Home Sections)...");
    
    try {
        // In ytmusic-api, we can search or get home.
        // Let's try to search for playlists of a genre to simulate the categories.
        const sections = ["ลูกทุ่ง", "เพลงใหม่", "T-Pop"];
        
        for (const section of sections) {
            console.log(`\n--- Fetching Section: ${section} ---`);
            const results = await ytmusic.getPlaylistSearchSuggestions(section);
            // ytmusic-api doesn't have a direct 'getHome' in the standard version often used, 
            // but we can search for playlists specifically.
            
            const playlists = await ytmusic.searchPlaylists(section);
            console.log(`Found ${playlists.length} playlists for ${section}`);
            if (playlists.length > 0) {
                console.log("Sample Playlist:", {
                    id: playlists[0].playlistId,
                    name: playlists[0].name,
                    author: playlists[0].author,
                });
            }
        }

        console.log("\n✅ Phase 1.1 Success: InnerTube API is responsive.");
    } catch (error) {
        console.error("❌ Phase 1.1 Failed:", error);
    }
}

testInnerTube();
