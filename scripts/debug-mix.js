
const YTMusic = require('ytmusic-api');

(async () => {
    try {
        const ytmusic = new (YTMusic.default || YTMusic)();
        await ytmusic.initialize({ GL: 'US', HL: 'en' });

        // This is a common "My Mix" or generated playlist format
        // Or search for a playlist and try to fetch it
        console.log("Searching for 'Thai Hits' playlist...");
        const search = await ytmusic.search('Thai Hits Playlist', 'PLAYLIST');

        if (search.length > 0) {
            const pl = search[0];
            console.log('Found Playlist:', pl.playlistId, pl.name);

            try {
                const data = await ytmusic.getPlaylist(pl.playlistId);
                console.log('Playlist Data Keys:', Object.keys(data));
                if (data.content) console.log('Content Length:', data.content.length);
                else console.log('No CONTENT property.');

                // Print partial JSON to see structure
                console.log(JSON.stringify(data, null, 2).substring(0, 500));
            } catch (e) {
                console.error('getPlaylist Failed:', e.message);

                // Try to see if it's a Mix?
                if (pl.playlistId.startsWith('RD')) {
                    console.log('It is a Radio/Mix ID.');
                }
            }
        } else {
            console.log('No playlist found.');
        }

    } catch (e) {
        console.error("Global Error:", e);
    }
})();
