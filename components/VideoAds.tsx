import React, { useEffect, useRef, useState } from "react";

import { ChevronRightIcon } from "@heroicons/react/24/solid";

import { useAds } from "../context/AdsContext";
import { Ad } from "../services/adsServices";

const VideoAds: React.FC = () => {
  const { data: _data, error, isLoading } = useAds();
  const [currentAd, setCurrentAd] = useState<Ad | null>(null);
  const [showAd, setShowAd] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const data = _data.videoAds;

    if (!isLoading && data.length > 0) {
      const randomAd = data[Math.floor(Math.random() * data.length)];
      setCurrentAd(randomAd);
      setShowAd(true);
    }
  }, [_data, isLoading]);

  useEffect(() => {
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.addEventListener("ended", handleVideoEnded);
        videoRef.current.muted = true;
        videoRef.current.autoplay = true;
        videoRef.current.play().catch((error) => {
          console.error("Autoplay failed:", error);
        });
      }
    }, 700);
  }, [videoRef?.current]);

  const handleVideoEnded = () => {
    setShowAd(false);
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading ads: {error.message}</div>;

  return (
    showAd && (
      <div
        className={`absolute flex h-full inset-0 z-30 items-center justify-center ${
          showAd ? "bg-black bg-opacity-30" : ""
        }`}
        style={{
          width: "100%",
          height: "100%",
          position: "fixed",
          zIndex: 100,
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {currentAd && (
          <div
            key={currentAd.linkAdsUrl}
            className="transition-opacity dsuration-500 ease-in-out relative"
          >
            {!!currentAd.imageUrl && (
              <div
                style={{
                  top: -10,
                  right: -5,
                  zIndex: 20,
                  lineHeight: "1.75rem",
                }}
                className="h-6 w-6 text-2xl block outline-none focus:outline-none float-right bg-white cursor-pointer 
             rounded-full align-middle text-center absolute drop-shadow-md"
                onClick={(e) => {
                  setShowAd(false);
                }}
              >
                ×
              </div>
            )}
            <div
              className="relative  max-w-md mx-auto cursor-pointer"
              onClick={() => window.open(currentAd.linkAdsUrl, "_blank")}
            >
              {currentAd.imageUrl && (
                <img
                  src={currentAd.imageUrl}
                  alt={currentAd.text}
                  className="object-contain h-96 rounded-lg"
                />
              )}
              {currentAd.videoUrl && (
                <video ref={videoRef} controls={false} className="h-96">
                  <source src={currentAd.videoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              )}
              {!currentAd.imageUrl && !currentAd.videoUrl && (
                <p>{currentAd.text}</p>
              )}

              <div
                style={{
                  bottom: 25,
                  zIndex: 20,
                }}
                className="absolute  inset-x-0 flex justify-center"
                onClick={(e) => {
                  setShowAd(false);
                }}
              >
                <div
                  className="text-2xl bg-white cursor-pointer rounded-full  text-center absolute drop-shadow-md p-2 px-4"
                  onClick={(e) => {
                    setShowAd(false);
                  }}
                >
                  ช้อปเลย
                  <span
                    style={{ marginLeft: 12 }}
                    className="h-8 w-8 inline-flex text-white text-2xl bg-black rounded-full align-middle text-center items-center justify-center "
                  >
                    <ChevronRightIcon className="h-6 w-6 " />
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  );
};

export default VideoAds;
