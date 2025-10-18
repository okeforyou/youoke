// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import axios from 'axios'

import type { NextApiRequest, NextApiResponse } from "next";

//https://www.joox.com/th/artists

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    let artistList = [];
    let artistCategories = [];

    const jooxApi =
      await fetch(`https://api-jooxtt.sanook.com/page/artists?country=th&lang=th&device=desktop&artistsIndex=0&artistsLimit=12&tagIndex=0&tagLimit=6
    `);

    try {
      const jooxApiData = await jooxApi.json();

      artistList = jooxApiData.artistList.artists.items;

      const artistCategoriesData = jooxApiData.artistCategories;

      const artistCategoriesRaw = artistCategoriesData.categories.reduce(
        (acc, cur) => {
          return [...acc, ...cur.tag_list];
        },
        []
      );

      artistCategories = [];

      for (let i = 0; i < artistCategoriesRaw.length; i++) {
        const data = artistCategoriesRaw[i];
        const jooxTagImgData = await axios.get(
          `https://api-jooxtt.sanook.com/openjoox/v1/tag/${data.tag_id}/artists?country=th&lang=th&index=0&num=1`
        );

        const jooxTagImg = jooxTagImgData?.data?.artists?.items;

        artistCategories.push({
          ...data,
          imageUrl: jooxTagImg[0].images[0].url,
        });
      }
    } catch (error) {
      // console.log(error);
      return res.status(500).json(error);
    }

    const artists = {
      status: "success",
      artist: artistList.map((a) => ({
        name: a.name,
        imageUrl: a.images[0].url,
      })),
      artistCategories,
    };

    res.status(200).json(artists);
  } catch (error) {
    res.status(500).json(error);
  }
}
