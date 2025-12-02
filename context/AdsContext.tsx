import React, { createContext, useContext, useEffect, useState } from "react";

import { Ad, fetchBottomAds, fetchVideoAds } from "../services/adsServices";
import { useAuth } from "./AuthContext";

interface AdsContextType {
  data: {
    videoAds: Ad[];
    bottomAds: Ad[];
  };
  error: Error | null;
  isLoading: boolean;
}

const AdsContext = createContext<AdsContextType | undefined>(undefined);

export const AdsProvider = ({ children }) => {
  const [data, setData] = useState({
    videoAds: [],
    bottomAds: [],
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const getAds = async () => {
      try {
        const videoAds = (await fetchVideoAds()) || [];
        const bottomAds = (await fetchBottomAds()) || [];

        setData({
          videoAds,
          bottomAds,
        });
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    // Don't show ads for non-logged-in users (especially from share links)
    // if (!user?.uid) getAds();

    // Only show ads if explicitly needed (e.g., free tier logged-in users)
    // For now, disable ads for better UX when joining from share links
    setIsLoading(false);
  }, [!!user?.uid]);

  return (
    <AdsContext.Provider value={{ data, error, isLoading }}>
      {children}
    </AdsContext.Provider>
  );
};

export const useAds = () => useContext(AdsContext);
