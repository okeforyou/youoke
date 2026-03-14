import type { NextApiRequest, NextApiResponse } from "next";
import https from "https";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const url = "https://www.joox.com/th/chart/42";
  
  return new Promise((resolve) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      }
    };

    https.get(url, options, (resp) => {
      let data = '';
      resp.on('data', (chunk) => data += chunk);
      resp.on('end', () => {
        res.status(200).json({
          status: resp.statusCode,
          headers: resp.headers,
          bodySnippet: data.substring(0, 5000),
          nextMatch: !!data.match(/<script id="__NEXT_DATA__".*?>(.*?)<\/script>/)
        });
        resolve(true);
      });
    }).on('error', (e) => {
      res.status(500).json({ error: e.message });
      resolve(true);
    });
  });
}
