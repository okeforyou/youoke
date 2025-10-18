import { collection, getDocs } from "firebase/firestore";

import { database } from "../firebase";

export interface Ad {
  text: string;
  imageUrl?: string;
  videoUrl?: string;
  linkAdsUrl: string;
}

export const fetchVideoAds = async (): Promise<Ad[]> => {
  const adsCollection = collection(database, "videoAds");
  const adsSnapshot = await getDocs(adsCollection);
  return adsSnapshot.docs.map((doc) => doc.data() as Ad);
};

export const fetchBottomAds = async (): Promise<Ad[]> => {
  const adsCollection = collection(database, "bottomAds");
  const adsSnapshot = await getDocs(adsCollection);
  return adsSnapshot.docs.map((doc) => doc.data() as Ad);
};
