
import { adminFirestore } from '../src/firebase-admin';
import { Innertube } from 'youtubei.js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function runUpdate() {
    console.log('🚀 Starting Manual Music Cache Update...');

    if (!adminFirestore) {
        console.error('❌ Firebase Admin not initialized. Check your .env.local and service account keys.');
        process.exit(1);
    }

    try {
        // 1. Initialize InnerTube
        console.log('Connecting to InnerTube...');
        const youtube = await Innertube.create();
        console.log('✅ InnerTube Connected.');

        // 2. Fetch Top Charts (Artists)
        console.log('Fetching Music Charts (TH)...');
        let topArtists: any[] = [];
        try {
            const charts = await youtube.music.getCharts('TH');
            const artistsShelf = charts.sections.find((s: any) => 
                s.title?.toString()?.toLowerCase().includes('artist') || 
                s.title?.toString()?.includes('ศิลปิน')
            );
            
            if (artistsShelf && artistsShelf.contents) {
                topArtists = artistsShelf.contents.map((a: any) => ({
                    name: a.title?.toString() || 'Unknown',
                    imageUrl: a.thumbnails?.[0]?.url?.replace('w120-h120', 'w500-h500') || ''
                })).slice(0, 20);
                console.log(`✅ Found ${topArtists.length} artists from Charts.`);
            }
        } catch (e) {
            console.warn('⚠️ Error fetching charts, attempting Explore fallback:', (e as Error).message);
            const explore = await youtube.music.getExplore();
            const chartsShelf = explore.sections.find((s: any) => s.title?.toString()?.includes('Artist') || s.title?.toString()?.includes('ศิลปิน'));
            if (chartsShelf && chartsShelf.contents) {
                topArtists = chartsShelf.contents.map((a: any) => ({
                    name: a.title?.toString() || 'Unknown',
                    imageUrl: (a as any).thumbnails?.[0]?.url || ''
                })).slice(0, 20);
            }
        }

        // 3. Fetch Genre Playlists (Optional/Keep current)
        const GENRES_TO_CACHE = [
            "ลูกทุ่ง", "ลูกกรุง", "เพื่อชีวิต", "คันทรี", "หมอลำ", "อีสาน", "ปักษ์ใต้",
            "ป็อป", "ป็อปร็อก", "ร็อกไทย", "อินดี้ไทย", "รวมเพลงดังมาแรง", "T-Pop"
        ];
        
        const genreData: Record<string, any[]> = {};
        for (const genre of GENRES_TO_CACHE) {
            try {
                process.stdout.write(`🔍 [InnerTube] Scraping: ${genre}... `);
                const search = await youtube.music.search(genre, { type: 'playlist' });
                if (search.playlists && search.playlists.contents.length > 0) {
                    genreData[genre] = search.playlists.contents.map((p: any) => ({
                        playlistId: p.id,
                        title: p.title?.toString() || 'Unknown',
                        thumbnail: (p as any).thumbnails?.[0]?.url || '',
                        author: p.author?.name || 'YouTube Music',
                        videoCount: '20+' 
                    })).slice(0, 10);
                    console.log(`✅ OK.`);
                } else {
                    console.log(`⚠️ Skip.`);
                }
            } catch (e) {
                console.log(`❌ Fail.`);
            }
            await new Promise(r => setTimeout(r, 500));
        }

        const youtubeCacheData = {
            topArtists: topArtists,
            genres: genreData,
            updatedAt: new Date().toISOString(),
            source: 'Manual-Trigger-Script'
        };

        // 4. Update Firestore
        console.log('Saving to Firestore (music_cache/youtube_home)...');
        await adminFirestore.collection('music_cache').doc('youtube_home').set(youtubeCacheData, { merge: true });
        
        console.log('🎉 Update Complete!');
        process.exit(0);

    } catch (error: any) {
        console.error('❌ Update Failed:', error);
        process.exit(1);
    }
}

runUpdate();
