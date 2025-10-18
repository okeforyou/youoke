import axios from "axios";

export default async function handler(req, res) {
  const { videoId } = req.query;

  try {
    // const response = await axios.get(
    //   `https://${process.env.NEXT_PUBLIC_INVIDIOUS_URL}/api/v1/videos/${videoId}`,
    //   {
    //     params: {
    //       fields: "recommendedVideos",
    //     },
    //     headers: {
    //       "Access-Control-Allow-Origin": "*",
    //     },
    //   }
    // );

    // res.status(200).json(response.data);
    res.status(200).json([]);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch video information" });
  }
}
