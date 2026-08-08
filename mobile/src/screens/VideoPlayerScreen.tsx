import React from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Image, Share } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ChevronLeft, ThumbsUp, ThumbsDown, Share2, Bookmark, MessageSquare, Play, Pause, Maximize, Minimize } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';
import * as ScreenOrientation from 'expo-screen-orientation';

const formatTime = (seconds: number) => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

import { socket } from '../api/socket';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import CommentsSheet from '../components/CommentsSheet';
import SaveSheet from '../components/SaveSheet';
import { useTranslation } from 'react-i18next';

export default function VideoPlayerScreen() {
  const { t } = useTranslation();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { video } = route.params;

  // We initialize the player conditionally, but hooks must be called unconditionally.
  // So we pass a dummy URL if it's missing, but we will render a different UI.
  const videoSource = video.url || 'https://www.w3schools.com/html/mov_bbb.mp4';
  const player = useVideoPlayer(videoSource, player => {
    player.loop = false;
    if (video.url) {
      player.play();
    } else {
      player.muted = true;
    }
  });

  const { user } = useAuth();
  const [creator, setCreator] = React.useState(video.creator);
  const [isSubscribed, setIsSubscribed] = React.useState(false);
  const [subscribing, setSubscribing] = React.useState(false);
  const [showComments, setShowComments] = React.useState(false);
  const [showSave, setShowSave] = React.useState(false);

  // Action states
  const [likes, setLikes] = React.useState<number>(video.likes || 0);
  const [userAction, setUserAction] = React.useState<'like' | 'dislike' | null>(null);

  // Custom Controls State
  const videoRef = React.useRef<any>(null);
  const [controlsVisible, setControlsVisible] = React.useState(true);
  const controlsTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapRef = React.useRef(0);
  const [videoWidth, setVideoWidth] = React.useState(0);

  const [isPlaying, setIsPlaying] = React.useState(true);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      if (player) {
        setCurrentTime(player.currentTime);
        setDuration(player.duration);
        setIsPlaying(player.playing);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [player]);

  const showControlsTemporarily = () => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (player.playing) setControlsVisible(false);
    }, 3000);
  };

  React.useEffect(() => {
    if (isPlaying) {
      showControlsTemporarily();
    } else {
      setControlsVisible(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    }
  }, [isPlaying]);

  const handleVideoPress = (evt: any) => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_PRESS_DELAY) {
      // Double tap
      const { locationX } = evt.nativeEvent;
      if (videoWidth > 0) {
        if (locationX < videoWidth / 2) {
          player.currentTime = Math.max(0, player.currentTime - 10);
        } else {
          player.currentTime = Math.min(player.duration || 0, player.currentTime + 10);
        }
      }
      lastTapRef.current = 0;
      showControlsTemporarily();
    } else {
      // Single tap
      setControlsVisible(prev => !prev);
      if (!controlsVisible) {
        showControlsTemporarily();
      }
      lastTapRef.current = now;
    }
  };

  React.useEffect(() => {
    const checkInteraction = async () => {
      if (!user) return;
      try {
        const res = await client.get(`/videos/${video._id}`);
        const v = res.data;
        const uid = user._id;
        if (v.likedBy?.includes(uid)) setUserAction('like');
        else if (v.dislikedBy?.includes(uid)) setUserAction('dislike');
        if (typeof v.likes === 'number') setLikes(v.likes);
      } catch {/* silent */}
    };
    checkInteraction();
  }, [video._id, user]);

  React.useEffect(() => {
    const checkSub = async () => {
      if (!user || !creator?._id) return;
      try {
        const res = await client.get(`/users/check-subscription/${creator._id}`);
        setIsSubscribed(res.data.isSubscribed);
      } catch (error: any) { console.error('Error checking subscription', error); }
    };
    checkSub();
  }, [user, creator?._id]);

  React.useEffect(() => {
    const handleUserUpdate = (data: any) => {
      if (creator && (creator._id === data.userId || creator.id === data.userId)) {
        setCreator((prev: any) => ({ ...prev, subscribersCount: data.subscribersCount, isVerified: data.isVerified }));
      }
    };
    socket.on('user_updated', handleUserUpdate);
    return () => { socket.off('user_updated', handleUserUpdate); };
  }, [creator]);

  const handleSubscribe = async () => {
    if (!user) { navigation.navigate('Login' as never); return; }
    if (!creator?._id) return;
    setSubscribing(true);
    try {
      const res = await client.post('/users/subscribe', { channelId: creator._id });
      setIsSubscribed(res.data.subscribed);
    } catch (error) { console.error('Error subscribing', error); }
    finally { setSubscribing(false); }
  };

  const handleLike = async () => {
    if (!user) { navigation.navigate('Login' as never); return; }
    try {
      await client.post(`/videos/${video._id}/like`);
      if (userAction === 'like') { setUserAction(null); setLikes(prev => Math.max(0, prev - 1)); }
      else { setUserAction('like'); setLikes(prev => prev + 1); }
    } catch (error) { console.error('Like error', error); }
  };

  const handleDislike = async () => {
    if (!user) { navigation.navigate('Login' as never); return; }
    try {
      await client.post(`/videos/${video._id}/dislike`);
      if (userAction === 'dislike') { setUserAction(null); }
      else { if (userAction === 'like') setLikes(prev => Math.max(0, prev - 1)); setUserAction('dislike'); }
    } catch (error) { console.error('Dislike error', error); }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Watch "${video.title}" on Vynra!\nhttps://vynra.app/watch?v=${video._id}`,
      });
    } catch (error) { console.error('Share error', error); }
  };

  const formatLikes = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return `${n}`;
  };

  const [isFullScreenMode, setIsFullScreenMode] = React.useState(false);

  const handleFullscreenToggle = async () => {
    if (isFullScreenMode) {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      setIsFullScreenMode(false);
    } else {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      setIsFullScreenMode(true);
    }
  };

  React.useEffect(() => {
    return () => {
      // Ensure we go back to portrait on unmount
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {controlsVisible && !isFullScreenMode && (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ChevronLeft color="#fff" size={28} />
          </TouchableOpacity>
        </View>
      )}
      
      <View 
        style={isFullScreenMode ? styles.fullscreenVideoContainer : styles.videoContainer} 
        onLayout={(e) => setVideoWidth(e.nativeEvent.layout.width)}
      >
        {!video.url ? (
          <View style={[styles.video, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }]}>
            <Text style={{ color: '#fff', fontSize: 16 }}>{video.status === 'processing' ? t('video.processing', 'Video is still processing...') : t('video.unavailable', 'Video URL unavailable')}</Text>
          </View>
        ) : (
          <VideoView 
            ref={videoRef} 
            style={styles.video} 
            player={player} 
            nativeControls={false} 
            contentFit="contain" 
          />
        )}
        
        <TouchableOpacity 
          activeOpacity={1} 
          style={styles.overlayTouch} 
          onPress={video.url ? handleVideoPress : undefined}
          disabled={!video.url}
        >
          {controlsVisible && video.url && (
            <View style={styles.controlsOverlay}>
              <View style={styles.centerControls}>
                <TouchableOpacity 
                  style={styles.playPauseBtn} 
                  onPress={() => {
                    if (player.playing) player.pause();
                    else { player.play(); showControlsTemporarily(); }
                  }}
                >
                  {isPlaying ? <Pause color="#fff" size={48} fill="#fff" /> : <Play color="#fff" size={48} fill="#fff" />}
                </TouchableOpacity>
              </View>

              <View style={styles.bottomControls}>
                <Text style={styles.timeText}>{formatTime(currentTime)} / {formatTime(duration)}</Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }]} />
                </View>
                <TouchableOpacity onPress={handleFullscreenToggle}>
                  {isFullScreenMode ? <Minimize color="#fff" size={24} /> : <Maximize color="#fff" size={24} />}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {!isFullScreenMode && (
        <ScrollView style={styles.detailsContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{video.title}</Text>
        <Text style={styles.stats}>
          {video.views?.toLocaleString()} {t('common.views')} • {video.createdAt ? formatDistanceToNow(new Date(video.createdAt), { addSuffix: true }) : t('common.recently', 'Recently')}
        </Text>

        <View style={styles.creatorRow}>
          <Image source={{ uri: video.creator?.avatarUrl || 'https://via.placeholder.com/40' }} style={styles.avatar} />
          <View style={styles.creatorInfo}>
            <Text style={styles.creatorName}>{creator?.username || t('common.unknown', 'Unknown')}</Text>
            <Text style={styles.subscribers}>{creator?.subscribersCount || 0} {t('channel.subscribers', 'subscribers')}</Text>
          </View>
          {user?._id !== creator?._id && (
            <TouchableOpacity 
              style={[styles.subscribeBtn, isSubscribed && styles.subscribedBtn]}
              onPress={handleSubscribe}
              disabled={subscribing}
            >
              <Text style={[styles.subscribeBtnText, isSubscribed && styles.subscribedText]}>
                {isSubscribed ? t('video.subscribed', 'Subscribed') : t('video.subscribe', 'Subscribe')}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Action buttons */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.actionsRow} contentContainerStyle={{ gap: 10, paddingRight: 16 }}>
          <TouchableOpacity style={[styles.actionBtn, userAction === 'like' && styles.actionBtnActive]} onPress={handleLike}>
            <ThumbsUp color={userAction === 'like' ? '#0f0f0f' : '#fff'} size={18} fill={userAction === 'like' ? '#0f0f0f' : 'none'} />
            <Text style={[styles.actionText, userAction === 'like' && styles.actionTextActive]}>{formatLikes(likes)}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, userAction === 'dislike' && styles.actionBtnActive]} onPress={handleDislike}>
            <ThumbsDown color={userAction === 'dislike' ? '#0f0f0f' : '#fff'} size={18} fill={userAction === 'dislike' ? '#0f0f0f' : 'none'} />
            <Text style={[styles.actionText, userAction === 'dislike' && styles.actionTextActive]}>{t('video.dislike', 'Dislike')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
            <Share2 color="#fff" size={18} />
            <Text style={styles.actionText}>{t('common.share', 'Share')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowSave(true)}>
            <Bookmark color="#fff" size={18} />
            <Text style={styles.actionText}>{t('common.save', 'Save')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowComments(true)}>
            <MessageSquare color="#fff" size={18} />
            <Text style={styles.actionText}>{t('video.comments', 'Comments')}</Text>
          </TouchableOpacity>
        </ScrollView>

        <TouchableOpacity style={styles.commentsPreview} onPress={() => setShowComments(true)}>
          <View style={styles.commentsHeader}>
            <Text style={styles.commentsTitle}>{t('video.comments', 'Comments')}</Text>
            <Text style={styles.commentsCount}>{video.comments?.length || 0}</Text>
          </View>
          <Text style={styles.commentPreviewText}>{video.comments?.[0]?.text || t('video.addComment', 'Add a comment...')}</Text>
        </TouchableOpacity>

        {video.description ? (
          <View style={styles.descriptionBox}>
            <Text style={styles.descriptionText}>{video.description}</Text>
          </View>
        ) : null}
      </ScrollView>
      )}

      <CommentsSheet isVisible={showComments} onClose={() => setShowComments(false)} videoId={video._id} />
      <SaveSheet isVisible={showSave} onClose={() => setShowSave(false)} videoId={video._id} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  header: { position: 'absolute', top: 40, left: 16, zIndex: 10 },
  backButton: { backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 20 },
  videoContainer: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000', zIndex: 1 },
  fullscreenVideoContainer: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: '#000', zIndex: 999 },
  video: { width: '100%', height: '100%' },
  overlayTouch: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
  controlsOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'space-between' },
  centerControls: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  playPauseBtn: { padding: 20 },
  bottomControls: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 20 },
  timeText: { color: '#fff', fontSize: 12, marginRight: 12, width: 75 },
  progressBarBg: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, marginRight: 16 },
  progressBarFill: { height: '100%', backgroundColor: '#ff0000', borderRadius: 2 },
  detailsContainer: { padding: 16 },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  stats: { color: '#aaa', fontSize: 14, marginBottom: 16 },
  creatorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12, backgroundColor: '#333' },
  creatorInfo: { flex: 1 },
  creatorName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  subscribers: { color: '#888', fontSize: 12 },
  subscribeBtn: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  subscribedBtn: { backgroundColor: '#222' },
  subscribeBtnText: { color: '#000', fontWeight: 'bold' },
  subscribedText: { color: '#fff' },
  actionsRow: { flexDirection: 'row', marginBottom: 24 },
  actionBtn: { alignItems: 'center', backgroundColor: '#222', paddingVertical: 9, paddingHorizontal: 16, borderRadius: 20, flexDirection: 'row', gap: 7 },
  actionBtnActive: { backgroundColor: '#fff' },
  actionText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  actionTextActive: { color: '#0f0f0f' },
  commentsPreview: { backgroundColor: '#1a1a1a', padding: 12, borderRadius: 12, marginBottom: 16 },
  commentsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  commentsTitle: { color: '#fff', fontWeight: 'bold', marginRight: 8 },
  commentsCount: { color: '#aaa', fontSize: 12 },
  commentPreviewText: { color: '#fff', fontSize: 14 },
  descriptionBox: { backgroundColor: '#1a1a1a', padding: 12, borderRadius: 12, marginBottom: 40 },
  descriptionText: { color: '#fff', fontSize: 14, lineHeight: 20 },
});
