import type { NextApiRequest, NextApiResponse } from "next";
import { adminFirestore } from "@/firebase-admin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const allowedCharts = [
      { id: 42, name: "Thailand Top 100" },
      { id: 128, name: "อันดับเพลงใหม่" },
      { id: 133, name: "อันดับเพลงมาแรง" },
      { id: 57, name: "THTOP100 2024" }
    ];

    if (adminFirestore) {
      try {
        const cacheDoc = await adminFirestore.collection('system_cache').doc('joox_charts').get();
        if (cacheDoc.exists) {
          const data = cacheDoc.data();
          if (data && data.updatedAt && data.charts && data.charts.length > 0) {
            const cacheAge = new Date().getTime() - new Date(data.updatedAt).getTime();
            // If cache is less than 24 hours old, return it directly to avoid JOOX requests.
            if (cacheAge < 24 * 60 * 60 * 1000) {
              console.log("⚡ Serving JOOX charts from Firestore Cache");
              res.setHeader("Cache-Control", "public, s-maxage=2592000, stale-while-revalidate=86400");
              return res.status(200).json({ status: "success", charts: data.charts });
            }
          }
        }
      } catch (err) {
        console.error("Failed to read Firestore cache:", err);
      }
    }

    const fetchChart = async (chart: {id: number, name: string}) => {
      try {
        const response = await fetch(`https://www.joox.com/th/chart/${chart.id}`, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9,th;q=0.8",
          },
        });

        if (!response.ok) return null;

        const html = await response.text();
        const match = html.match(/<script id="__NEXT_DATA__".*?>(.*?)<\/script>/);
        if (!match || !match[1]) return null;

        const nextData = JSON.parse(match[1]);
        const items = nextData?.props?.pageProps?.trackList?.tracks?.items || [];
        
        const singles = items.map((song: any) => {
          const bestImage =
            song.images?.find((img: any) => img.width === 1000)?.url ||
            song.images?.[0]?.url ||
            "";

          const artistName = (song.artist_list || [])
            .map((a: any) => a.name)
            .join(", ");

          return {
            id: song.id,
            title: song.name,
            artist_name: artistName,
            coverImageURL: bestImage,
          };
        });

        return {
          id: chart.id,
          name: chart.name,
          singles,
        };
      } catch (e) {
        return null;
      }
    };

    const results = await Promise.all(allowedCharts.map(fetchChart));
    const finalCharts = results.filter(c => c !== null);

    // If new data was fetched, cache it to Firestore backend.
    if (finalCharts.length > 0) {
      if (adminFirestore) {
         try {
             const docRef = adminFirestore.collection('system_cache').doc('joox_charts');
             await docRef.set({
                 updatedAt: new Date().toISOString(),
                 charts: finalCharts
             });
             console.log("✅ Cached new JOOX charts to Firestore");
         } catch (err: any) {
             console.error("Failed to cache to Firestore:", err.message);
         }
      }
    }

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=2592000, stale-while-revalidate=86400"
    );
    res.status(200).json({ status: "success", charts: finalCharts });
  } catch (error: any) {
    console.error("Error fetching JOOX charts:", error);
    res.status(500).json({ status: "error", message: error.message, stack: error.stack });
  }
}
