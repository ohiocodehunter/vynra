"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Video } from "@/lib/api";
import { Loader2, BadgeCheck } from "lucide-react";
import styles from "./VideoCard.module.css";

interface VideoCardProps {
  video: Video;
  layout?: "vertical" | "horizontal";
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export default function VideoCard({
  video,
  layout = "vertical",
}: VideoCardProps) {
  const [isNavigating, setIsNavigating] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent standard link behavior
    setIsNavigating(true);
    // Add small delay to show animation before navigating
    setTimeout(() => {
      router.push(`/watch?v=${video._id}`);
    }, 400); // 400ms delay matches the transition
  };

  let hoverTimeout: NodeJS.Timeout;

  const handleMouseEnter = () => {
    hoverTimeout = setTimeout(() => {
      setIsHovered(true);
    }, 400); // Wait 400ms before playing preview like YouTube
  };

  const handleMouseLeave = () => {
    clearTimeout(hoverTimeout);
    setIsHovered(false);
  };

  const isNew = (new Date().getTime() - new Date(video.createdAt).getTime()) < (3 * 24 * 60 * 60 * 1000);

  return (
    <a
      href={`/watch?v=${video._id}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`${styles.videoCard} ${layout === "horizontal" ? styles.horizontal : ""}`}
    >
      <div className={styles.thumbnailContainer}>
        <div
          className={styles.thumbnail}
          style={{ backgroundImage: `url(${video.thumbnailUrl})` }}
        />
        {isNew && <div className={styles.newBadge}>New</div>}
        {isHovered && (
          <video
            src={video.url}
            className={styles.previewVideo}
            autoPlay
            muted
            loop
            playsInline
          />
        )}
        <div className={styles.timestamp}>{formatDuration(video.duration)}</div>

        {/* Loading overlay when clicked */}
        {isNavigating && (
          <div className={styles.videoLoadingOverlay}>
            <Loader2 size={32} className={styles.spinner} />
          </div>
        )}
      </div>
      <div className={styles.videoInfo}>
        {layout === "vertical" && (
          <div className={styles.creatorAvatar}>
            {video.creator?.avatarUrl ? (
              <img src={video.creator.avatarUrl} alt={video.creator.username} className={styles.avatarImage} />
            ) : (
              video.creator?.username?.charAt(0) || "U"
            )}
          </div>
        )}
        <div className={styles.videoDetails}>
          <h3 className={styles.videoTitle}>{video.title}</h3>
          <div className={styles.creatorRow}>
            <p className={styles.videoMetaChannel}>
              {video.creator?.username || "Upload by Dev"}
            </p>
            {/* Mock Verified Icon for premium feel */}
            <BadgeCheck size={14} className={styles.verifiedIcon} />
          </div>
          <p className={styles.videoMetaViews}>
            {video.views >= 1000
              ? Math.floor(video.views / 1000) + "K"
              : video.views}{" "}
            views • 2 days ago
          </p>
        </div>
      </div>
    </a>
  );
}
