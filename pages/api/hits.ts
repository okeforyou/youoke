// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import type { NextApiRequest, NextApiResponse } from "next";

let cachedData; // Variable to cache the fetched data
let cacheExpiryTime = 12 * 60 * 60 * 1000; //  milliseconds

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    let songList = [];

    // Check if cached data exists and is not expired
    if (cachedData && Date.now() - cachedData.timestamp < cacheExpiryTime) {
      res.status(200).json(cachedData.data);
      return;
    }

    const jooxData = await fetch(`https://www.joox.com/th/chart/128`);
    const data = await jooxData.text();

    try {
      var match = data.match(
        /(?<=<script id="__NEXT_DATA__" type="application\/json">)(.*?)(?=<\/script>)/
      );
      const jsonData = JSON.parse(match[0]);
      songList = jsonData.props.pageProps.trackList.tracks.items;
    } catch (error) {
      return res.status(500).json(error);
    }

    const topics = {
      status: "success",
      singles: songList.map((a) => ({
        title: a.name,
        artist_name: a.artist_list[0].name,
        coverImageURL: a.images[0].url,
      })),
    };

    res.status(200).json(topics);
  } catch (error) {
    res.status(500).json(error);
  }
}
