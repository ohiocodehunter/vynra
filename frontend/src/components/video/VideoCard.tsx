"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Video } from "@/lib/api";
import { Loader2, BadgeCheck } from "lucide-react";
import styles from "./VideoCard.module.css";

interface VideoCardProps {
  video: Video;
  layout?: "vertical" | "horizontal" | "shorts";
  isPriority?: boolean;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

import { socket } from '@/lib/socket';

export default function VideoCard({
  video,
  layout = "vertical",
  isPriority = false,
}: VideoCardProps) {
  const [isNavigating, setIsNavigating] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [creator, setCreator] = useState(video.creator);
  const router = useRouter();

  React.useEffect(() => {
    // Keep local state in sync with prop changes
    setCreator(video.creator);
  }, [video.creator]);

  React.useEffect(() => {
    // Listen for real-time user verification changes
    const handleUserUpdate = (data: any) => {
      if (creator && (creator._id === data.userId || creator.id === data.userId)) {
        setCreator(prev => prev ? {
          ...prev,
          isVerified: data.isVerified,
          username: data.username,
          channelName: data.channelName
        } : prev);
      }
    };
    
    // @ts-ignore
    import('@/lib/socket').then(({ socket }) => {
      socket.on('user_updated', handleUserUpdate);
    });

    return () => {
      // @ts-ignore
      import('@/lib/socket').then(({ socket }) => {
        socket.off('user_updated', handleUserUpdate);
      });
    };
  }, [creator]);

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
      className={`${styles.videoCard} ${layout === "horizontal" ? styles.horizontal : ""} ${layout === "shorts" ? styles.shorts : ""}`}
    >
      <div className={styles.thumbnailContainer}>
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className={styles.thumbnail}
            loading={isPriority ? 'eager' : 'lazy'}
            decoding={isPriority ? 'sync' : 'async'}
            // @ts-ignore – fetchPriority is a valid HTML attribute in React 18+
            fetchPriority={isPriority ? 'high' : 'auto'}
            style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }}
          />
        ) : (
          <div className={styles.thumbnail} style={{ backgroundColor: '#1a1a1a' }} />
        )}
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
            {creator?.avatarUrl ? (
              <img
                src={creator.avatarUrl}
                alt={creator.username}
                className={styles.avatarImage}
                loading="lazy"
                decoding="async"
              />
            ) : (
              creator?.username?.charAt(0) || "U"
            )}
          </div>
        )}
        <div className={styles.videoDetails}>
          <h3 className={styles.videoTitle}>{video.title}</h3>
          <div className={styles.creatorRow}>
            <p className={styles.videoMetaChannel}>
              {creator?.username || "Upload by Dev"}
            </p>
            {creator?.isVerified && (
              <BadgeCheck size={14} className={styles.verifiedIcon} />
            )}
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
