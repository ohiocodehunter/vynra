"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Play, Pause, Volume2, VolumeX, Settings, Maximize, Minimize, 
  PictureInPicture, Subtitles, Check
} from "lucide-react";
import styles from "./ClientVideoPlayer.module.css";

interface ClientVideoPlayerProps {
  url: string;
  poster?: string;
  nextVideoId?: string;
  videoId?: string;
}

export default function ClientVideoPlayer({ url, poster, nextVideoId, videoId }: ClientVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [quality, setQuality] = useState("Auto");
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);
  
  let controlsTimeout: NodeJS.Timeout;

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    clearTimeout(controlsTimeout);
    controlsTimeout = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 2500);
  }, [isPlaying]);

  const handleMouseLeave = () => {
    if (isPlaying) setShowControls(false);
    setShowSettings(false);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    let historyRecorded = false;
    const handlePlay = () => { 
      setIsPlaying(true); 
      handleMouseMove(); 
      if (!historyRecorded && videoId) {
        historyRecorded = true;
        const token = localStorage.getItem('token');
        if (token) {
          fetch(`${(typeof window !== 'undefined' ? '/api' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'))}/users/history/${videoId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          }).catch(console.error);
        }
      }
    };
    const handlePause = () => { setIsPlaying(false); setShowControls(true); };
    
    const handleEnded = () => {
      const isAutoplayEnabled = localStorage.getItem('vynra_autoplay') !== 'false';
      if (isAutoplayEnabled && nextVideoId) {
        router.push(`/watch?v=${nextVideoId}`);
      } else {
        setShowControls(true);
      }
    };

    video.addEventListener("timeupdate", updateTime);
    video.addEventListener("loadedmetadata", updateDuration);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", updateTime);
      video.removeEventListener("loadedmetadata", updateDuration);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
    };
  }, [nextVideoId, router, handleMouseMove]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(err => console.log('Playback error:', err));
      } else {
        videoRef.current.pause();
      }
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pos * duration;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    videoRef.current.muted = nextMuted;
    if (!nextMuted && volume === 0) {
      setVolume(1);
      videoRef.current.volume = 1;
    }
  };

  const toggleFullscreen = () => {
    if (!wrapperRef.current) return;
    if (!document.fullscreenElement) {
      wrapperRef.current.requestFullscreen().catch(err => {
        console.error("Fullscreen error:", err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const togglePiP = async () => {
    try {
      if (videoRef.current !== document.pictureInPictureElement) {
        await videoRef.current?.requestPictureInPicture();
      } else {
        await document.exitPictureInPicture();
      }
    } catch (error) {
      console.error("PiP error:", error);
    }
  };

  const changePlaybackSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) videoRef.current.playbackRate = speed;
    setShowSettings(false);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div 
      className={styles.videoWrapper} 
      ref={wrapperRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={videoRef}
        src={url}
        poster={poster}
        autoPlay
        playsInline
        className={styles.videoElement}
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
      />

      <div className={`${styles.controlsOverlay} ${!showControls && isPlaying ? styles.hidden : ''}`}>
        
        {/* Playback Progress */}
        <div className={styles.progressContainer} onClick={handleProgressClick}>
          <div className={styles.progressBackground}>
            <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
            <div className={styles.progressHandle} style={{ left: `${progressPercent}%` }} />
          </div>
        </div>

        {/* Bottom Control Bar */}
        <div className={styles.controlsBar}>
          <div className={styles.controlsLeft}>
            <button className={styles.controlBtn} onClick={togglePlay}>
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            
            <div className={styles.volumeContainer}>
              <button className={styles.controlBtn} onClick={toggleMute}>
                {isMuted || volume === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}
              </button>
              <input 
                type="range" 
                min="0" max="1" step="0.05" 
                value={isMuted ? 0 : volume} 
                onChange={handleVolumeChange}
                className={styles.volumeSlider}
              />
            </div>

            <span className={styles.timeDisplay}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className={styles.controlsRight}>
            
            {/* Subtitles (CC) Mockup */}
            <button 
              className={`${styles.controlBtn} ${subtitlesEnabled ? styles.activeText : ''}`} 
              onClick={() => setSubtitlesEnabled(!subtitlesEnabled)}
              title="Subtitles / CC"
            >
              <Subtitles size={24} />
              {subtitlesEnabled && <div className={styles.activeUnderline} />}
            </button>

            {/* Settings Menu */}
            <div className={styles.settingsWrapper}>
              <button 
                className={styles.controlBtn} 
                onClick={() => setShowSettings(!showSettings)}
                title="Settings"
              >
                <Settings size={24} className={showSettings ? styles.iconSpin : ''} />
              </button>
              
              {showSettings && (
                <div className={styles.settingsMenu}>
                  <div className={styles.settingsGroup}>
                    <div className={styles.settingsTitle}>Playback Speed</div>
                    <div className={styles.settingsOptions}>
                      {[0.5, 1, 1.5, 2].map(speed => (
                        <button 
                          key={speed} 
                          className={playbackSpeed === speed ? styles.selectedOpt : ''}
                          onClick={() => changePlaybackSpeed(speed)}
                        >
                          {speed === 1 ? 'Normal' : `${speed}x`}
                          {playbackSpeed === speed && <Check size={16} />}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className={styles.settingsDivider} />
                  <div className={styles.settingsGroup}>
                    <div className={styles.settingsTitle}>Quality</div>
                    <div className={styles.settingsOptions}>
                      <button className={styles.selectedOpt} onClick={() => setShowSettings(false)}>
                        Auto (1080p) <Check size={16} />
                      </button>
                      <button onClick={() => setShowSettings(false)}>720p</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Picture in Picture */}
            <button className={styles.controlBtn} onClick={togglePiP} title="Miniplayer (PiP)">
              <PictureInPicture size={24} />
            </button>

            {/* Fullscreen */}
            <button className={styles.controlBtn} onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mock Subtitle Display */}
      {subtitlesEnabled && (
        <div className={styles.mockSubtitle}>
          [Subtitles playing...]
        </div>
      )}
    </div>
  );
}
