import { collection, getDocs } from "firebase/firestore";

import { database } from "../firebase";

export interface Ad {
  text: string;
  imageUrl?: string;
  videoUrl?: string;
  linkAdsUrl: string;
}

export const fetchVideoAds = async (): Promise<Ad[]> => {
  // Return empty array if Firebase is not configured
  if (!database) {
    console.warn('Firebase not configured, returning empty video ads');
    return [];
  }

  try {
    const adsCollection = collection(database, "videoAds");
    const adsSnapshot = await getDocs(adsCollection);
    return adsSnapshot.docs.map((doc) => doc.data() as Ad);
  } catch (error) {
    console.error('Error fetching video ads:', error);
    return [];
  }
};

export const fetchBottomAds = async (): Promise<Ad[]> => {
  // Return empty array if Firebase is not configured
  if (!database) {
    console.warn('Firebase not configured, returning empty bottom ads');
    return [];
  }

  try {
    const adsCollection = collection(database, "bottomAds");
    const adsSnapshot = await getDocs(adsCollection);
    return adsSnapshot.docs.map((doc) => doc.data() as Ad);
  } catch (error) {
    console.error('Error fetching bottom ads:', error);
    return [];
  }
};
