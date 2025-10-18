import axios from "axios";

interface Video {
  videoId: string;
  title: string;
  author: string;
}

// List of User-Agents
const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/537.36",
  "Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.73 Mobile Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/109.0.1518.78",
];

const getRandomUserAgent = () =>
  userAgents[Math.floor(Math.random() * userAgents.length)];

// export default async function handler(req, res) {
//   const { q, type, page, region, fields } = req.query;
//   try {
//     const response = await axios.get(`https://invidious.f5.si/api/v1/search`, {
//       params: { q, type, page, region, fields },
//       headers: {
//         "Access-Control-Allow-Origin": "*",
//       },
//     });
//     res.status(200).json(response.data);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// }

export default async function handler(req, res) {
  const { q, type, page, region, fields } = req.query;
  try {
    if (!q) return res.status(200).json([]);

    const response = await axios.get(
      // `https://nadeko-proxy-fh3uafedt-apirutchaokruas-projects.vercel.app/search?q=${encodeURIComponent(
      //   q as string
      // )}&page=1&date=none&type=video&duration=none&sort=relevance`,
      `${process.env.PROXY_URL}/search?q=${encodeURIComponent(q as string)}`,
      {
        headers: {
          "User-Agent": getRandomUserAgent(), // Use a random User-Agent
        },
        responseType: "text",
      }
    );

    const html = response.data as string; // HTML response
    const videos: Video[] = [];

    // Extracting each video block
    const videoBlocks = html.split('<div class="h-box">').slice(1);

    videoBlocks.forEach((block) => {
      const getMatch = (regex: RegExp) => block.match(regex)?.[1]?.trim() || "";

      const video: Video = {
        videoId: getMatch(/href="\/watch\?v=([^"]+)"/),
        title: getMatch(/<p dir="auto">([^<]+)<\/p>/),
        author: getMatch(/<p class="channel-name"[^>]*>([^<]+)/),
      };

      videos.push(video);
    });

    res.status(200).json(videos.filter((v) => !!v.videoId));
  } catch (error) {
    res.status(500).json({ error: error });
  }
}
