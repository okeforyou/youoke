
import { NextApiRequest, NextApiResponse } from 'next';
import { Innertube } from 'youtubei.js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const youtube = await Innertube.create();
        const explore = await youtube.music.getExplore();
        
        const sections = explore.sections.map(s => ({
            title: s.title?.toString(),
            type: s.type,
            itemCount: s.contents?.length
        }));

        const chartsShelf = explore.sections.find(s => 
            s.title?.toString()?.toLowerCase().includes('artist') || 
            s.title?.toString()?.includes('ศิลปิน')
        );

        let artists = [];
        if (chartsShelf && chartsShelf.contents) {
            artists = chartsShelf.contents.map(a => ({
                name: a.title?.toString(),
                thumbnail: (a as any).thumbnails?.[0]?.url || (a as any).thumbnail?.[0]?.url || ''
            }));
        }

        // Alternative: Get charts directly if available in this version
        let charts = null;
        try {
            charts = await youtube.music.getCharts('TH');
        } catch (e) {}

        res.status(200).json({
            sections,
            foundArtists: artists,
            charts: charts ? "Found" : "Not Found"
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}
