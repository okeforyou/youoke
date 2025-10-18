import React, { useEffect, useState } from "react";

import { useAds } from "../context/AdsContext";
import { Ad } from "../services/adsServices";

const MINUTES = 1;

const BottomAds: React.FC = () => {
  const { data: _data, error, isLoading } = useAds();
  const [currentAd, setCurrentAd] = useState<Ad | null>(null);

  useEffect(() => {
    const data = _data.bottomAds;
    if (!isLoading && data.length > 0) {
      setCurrentAd(data[Math.floor(Math.random() * data.length)]);

      const interval = setInterval(() => {
        setCurrentAd(data[Math.floor(Math.random() * data.length)]);
      }, MINUTES * 60 * 1000);

      return () => clearInterval(interval); // Cleanup interval on component unmount
    }
  }, [_data, isLoading]);

  if (isLoading) return <div>Loading... Ads</div>;
  if (error) return <div></div>;

  return (
    <div className="flex  items-center max-h-24x bg-gray-100">
      {currentAd && (
        <div
          key={currentAd.linkAdsUrl}
          className="transition-opacity duration-500 ease-in-out p-2"
        >
          <a
            href={currentAd.linkAdsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex"
          >
            {currentAd.imageUrl && (
              <img
                src={currentAd.imageUrl}
                alt={currentAd.text}
                className="max-h-24 object-contain"
              />
            )}
            {currentAd.videoUrl && !currentAd.imageUrl && (
              <video className="max-h-24">
                <source src={currentAd.videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}
            <p className="p-4">{currentAd.text}</p>
          </a>
        </div>
      )}
    </div>
  );
};

export default BottomAds;
