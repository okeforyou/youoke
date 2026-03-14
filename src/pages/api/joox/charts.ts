import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const response = await fetch("https://www.joox.com/th/charts", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,th;q=0.8",
      },
      next: { revalidate: 86400 * 7 } // Fetch revalidation if on App Router, irrelevant for Pages Router but harmless
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch JOOX charts: ${response.status}`);
    }

    const html = await response.text();

    const match = html.match(/<script id="__NEXT_DATA__".*?>(.*?)<\/script>/);
    if (!match || !match[1]) {
      throw new Error("Could not find __NEXT_DATA__ in JOOX HTML");
    }

    const nextData = JSON.parse(match[1]);
    const topChartListNew = nextData?.props?.pageProps?.topChartListNew;

    if (!topChartListNew || !Array.isArray(topChartListNew)) {
      throw new Error("Invalid chart data structure");
    }

    const transformedCharts = topChartListNew.map((chart: any) => {
      const items = chart.track_list?.tracks?.items || [];
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
    });

    const allowedIds = [42, 128, 133, 57];
    const finalCharts = transformedCharts.filter((c: any) =>
      allowedIds.includes(c.id)
    );

    // Cache the response at CDN level for a month, revalidate in background once a day
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=2592000, stale-while-revalidate=86400"
    );
    res.status(200).json({ status: "success", charts: finalCharts });
  } catch (error: any) {
    console.error("Error fetching JOOX charts:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
}
