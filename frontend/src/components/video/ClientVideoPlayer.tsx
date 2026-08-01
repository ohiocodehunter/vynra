"use client";

import React, { useRef, useState, useEffect } from "react";
import styles from "./ClientVideoPlayer.module.css";

interface ClientVideoPlayerProps {
  url: string;
  poster?: string;
}

export default function ClientVideoPlayer({ url, poster }: ClientVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true); // Since autoPlay is true

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, []);

  return (
    <div className={styles.videoWrapper} onClick={togglePlay}>
      <video
        ref={videoRef}
        src={url}
        poster={poster}
        controls
        autoPlay
        playsInline // Important for mobile browsers so it doesn't auto-fullscreen on iOS immediately if not desired
        className={styles.videoElement}
      />
    </div>
  );
}
