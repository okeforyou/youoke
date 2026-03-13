import { scrapeYouTubeSearch } from "../../utils/youtubeScraper";

export default async function handler(req: any, res: any) {
  const { q, long } = req.query;
  if (!q) return res.status(200).json([]);

  // Strategy 1: Direct YouTube scraping (proven to work from Vercel 2026-02-27)
  try {
    const encodedQuery = encodeURIComponent(q as string);
    // sp=EgIYAg%253D%253D is the filter for videos > 20 minutes (Long)
    const longFilter = long === 'true' ? '&sp=EgIYAg%253D%253D' : '';
    const searchUrl = `https://www.youtube.com/results?search_query=${encodedQuery}${longFilter}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(searchUrl,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9,th;q=0.8',
          'Cookie': 'CONSENT=YES+cb.20210328-17-p0.en+FX+417; SOCS=CAESEwgDEgk1NzY3NDIwMzQaAmVuIAEaBgiA_LyaBg;',
        },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (response.ok) {
      const html = await response.text();
      const match = html.match(/var ytInitialData = ({[\s\S]+?});/);
      if (match?.[1]) {
        const ytData = JSON.parse(match[1]);
        const videos: any[] = [];
        const seenIds = new Set<string>();

        const findVideos = (obj: any, depth = 0): void => {
          if (!obj || typeof obj !== 'object' || depth > 10) return;
          if (obj.videoRenderer?.videoId && !seenIds.has(obj.videoRenderer.videoId)) {
            seenIds.add(obj.videoRenderer.videoId);
            const v = obj.videoRenderer;
            videos.push({
              videoId: v.videoId,
              title: v.title?.runs?.[0]?.text || 'Unknown',
              author: v.ownerText?.runs?.[0]?.text || v.shortBylineText?.runs?.[0]?.text || 'Unknown',
              videoThumbnails: [
                { quality: 'maxres', url: `https://i.ytimg.com/vi/${v.videoId}/maxresdefault.jpg`, width: 1280, height: 720 },
                { quality: 'medium', url: `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`, width: 320, height: 180 },
              ],
            });
          }
          if (Array.isArray(obj)) {
            for (const item of obj) findVideos(item, depth + 1);
          } else {
            for (const key of Object.keys(obj)) findVideos(obj[key], depth + 1);
          }
        };
        findVideos(ytData);

        if (videos.length > 0) {
          console.log(`[API/Search] ✅ Direct YouTube: ${videos.length} results for "${q}"`);
          return res.status(200).json(videos);
        }
      }
    }
  } catch (e: any) {
    console.warn(`[API/Search] Direct YouTube failed: ${e.message}`);
  }

  // Strategy 2: Scraper fallback (Invidious race)
  try {
    const results = await scrapeYouTubeSearch(q as string);
    if (results.length > 0) {
      return res.status(200).json(results.map(item => ({
        videoId: item.videoId,
        title: item.title,
        author: item.author || "Unknown",
        videoThumbnails: item.videoThumbnails,
      })));
    }
  } catch (error: any) {
    console.error("[API/Search] Scraper also failed:", error.message);
  }

  return res.status(200).json([]);
}
