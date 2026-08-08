import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Image, Dimensions, StatusBar, Animated, ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useVideoPlayer, VideoView } from 'expo-video';
import {
  ChevronLeft, ChevronRight, SkipForward, SkipBack,
  ListVideo, Play
} from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from 'react-i18next';

const { width: W, height: H } = Dimensions.get('window');

const isShort = (video: any) =>
  video?.tags?.includes('shorts') ||
  video?.aspectRatio === '9:16' ||
  (video?.height && video?.width && video.height > video.width);

export default function PlaylistPlayerScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const { playlist, startIndex = 0 } = route.params as any;
  const videos: any[] = playlist?.videos || [];

  const [currentIndex, setCurrentIndex] = useState<number>(startIndex);
  const [showQueue, setShowQueue] = useState(false);
  const queueAnim = useRef(new Animated.Value(0)).current;
  const queueRef = useRef<FlatList>(null);

  const currentVideo = videos[currentIndex];
  const short = isShort(currentVideo);

  // ── Single persistent player ──────────────────────────────────
  const player = useVideoPlayer(currentVideo?.url || '', (p) => {
    p.loop = false;
    p.play();
  });

  // When current video changes → replace source asynchronously and play
  useEffect(() => {
    if (!currentVideo?.url) return;
    player.replaceAsync(currentVideo.url).then(() => {
      player.play();
    }).catch(console.error);
  }, [currentIndex]);

  // Auto-advance when video ends
  useEffect(() => {
    const sub = player.addListener('playToEnd', () => {
      setCurrentIndex((prev) => {
        if (prev < videos.length - 1) return prev + 1;
        return prev;
      });
    });
    return () => sub.remove();
  }, [player, videos.length]);

  // Scroll queue to current item
  useEffect(() => {
    if (showQueue) {
      setTimeout(() => {
        queueRef.current?.scrollToIndex({ index: currentIndex, animated: true, viewPosition: 0.3 });
      }, 300);
    }
  }, [currentIndex, showQueue]);

  const goNext = useCallback(() => {
    if (currentIndex < videos.length - 1) setCurrentIndex(currentIndex + 1);
  }, [currentIndex, videos.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  }, [currentIndex]);

  const toggleQueue = () => {
    const toValue = showQueue ? 0 : 1;
    Animated.spring(queueAnim, {
      toValue, useNativeDriver: true, tension: 70, friction: 12,
    }).start();
    setShowQueue(!showQueue);
  };

  if (!currentVideo) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color="#fff" size={26} />
        </TouchableOpacity>
        <Text style={{ color: '#888', textAlign: 'center', marginTop: 60, fontSize: 16 }}>
          {t('playlists.playlistEmpty', 'Playlist is empty')}
        </Text>
      </View>
    );
  }

  const playerHeight = short ? H * 0.6 : H * 0.35;
  const progress = (currentIndex + 1) / videos.length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color="#fff" size={26} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{playlist.name}</Text>
          <Text style={styles.headerSub}>{currentIndex + 1} of {videos.length}</Text>
        </View>
        <TouchableOpacity onPress={toggleQueue} style={styles.queueToggleBtn}>
          <ListVideo color="#fff" size={20} />
        </TouchableOpacity>
      </View>

      {/* ── Video Player ── */}
      <View style={[styles.playerWrap, { height: playerHeight }]}>
        <VideoView
          style={styles.video}
          player={player}
          nativeControls={true}
          contentFit={short ? 'cover' : 'contain'}
        />
        {/* Thin progress bar at bottom of player */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      {/* ── Playback controls ── */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.ctrlBtn, currentIndex === 0 && styles.ctrlBtnDisabled]}
          onPress={goPrev}
          disabled={currentIndex === 0}
        >
          <SkipBack color={currentIndex > 0 ? '#fff' : '#444'} size={24} />
        </TouchableOpacity>

        <View style={styles.ctrlCounter}>
          <Text style={styles.ctrlCounterText}>{currentIndex + 1} / {videos.length}</Text>
        </View>

        <TouchableOpacity
          style={[styles.ctrlBtn, currentIndex >= videos.length - 1 && styles.ctrlBtnDisabled]}
          onPress={goNext}
          disabled={currentIndex >= videos.length - 1}
        >
          <SkipForward color={currentIndex < videos.length - 1 ? '#fff' : '#444'} size={24} />
        </TouchableOpacity>
      </View>

      {/* ── Current video info ── */}
      <View style={styles.videoInfo}>
        {currentVideo.creator?.avatarUrl ? (
          <Image source={{ uri: currentVideo.creator.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: '#333', alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>
              {currentVideo.creator?.username?.[0]?.toUpperCase() || 'U'}
            </Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.videoTitle} numberOfLines={2}>{currentVideo.title}</Text>
          <Text style={styles.videoMeta}>
            {currentVideo.creator?.username}
            {currentVideo.views ? ` • ${currentVideo.views.toLocaleString()} ${t('common.views')}` : ''}
          </Text>
        </View>
        {short && (
          <View style={styles.shortBadge}>
            <Text style={styles.shortBadgeText}>{t('home.shorts')}</Text>
          </View>
        )}
      </View>

      {/* ── Queue sidebar (slide in from right) ── */}
      <Animated.View
        style={[
          styles.queuePanel,
          {
            transform: [{
              translateX: queueAnim.interpolate({
                inputRange: [0, 1], outputRange: [W, 0],
              }),
            }],
          },
        ]}
        pointerEvents={showQueue ? 'auto' : 'none'}
      >
        <View style={styles.queueHeader}>
          <Text style={styles.queueTitle}>{t('playlists.queue', 'Queue')}</Text>
          <TouchableOpacity onPress={toggleQueue}>
            <ChevronRight color="#fff" size={22} />
          </TouchableOpacity>
        </View>
        <FlatList
          ref={queueRef}
          data={videos}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 12, gap: 8 }}
          onScrollToIndexFailed={() => {}}
          renderItem={({ item, index }) => {
            const active = index === currentIndex;
            const s = isShort(item);
            return (
              <TouchableOpacity
                style={[styles.queueItem, active && styles.queueItemActive]}
                onPress={() => { setCurrentIndex(index); setShowQueue(false); }}
                activeOpacity={0.7}
              >
                {/* Thumbnail */}
                <View style={s ? styles.queueShortThumbWrap : styles.queueThumbWrap}>
                  <Image
                    source={{ uri: item.thumbnailUrl || 'https://via.placeholder.com/80x60' }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                  {active && (
                    <View style={styles.queuePlayOverlay}>
                      <Play color="#fff" size={12} fill="#fff" />
                    </View>
                  )}
                  {s && (
                    <View style={styles.queueShortLabel}>
                      <Text style={{ color: '#fff', fontSize: 7, fontWeight: 'bold' }}>S</Text>
                    </View>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.queueItemTitle, active && styles.queueItemTitleActive]}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>
                  <Text style={styles.queueItemMeta}>{item.creator?.username}</Text>
                </View>
                <Text style={styles.queueItemIndex}>{index + 1}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </Animated.View>

      {/* Backdrop tap to close queue */}
      {showQueue && (
        <TouchableOpacity
          style={styles.queueBackdrop}
          onPress={toggleQueue}
          activeOpacity={1}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#1a1a1a', gap: 10,
  },
  backBtn: { padding: 6 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  headerSub: { color: '#888', fontSize: 11, marginTop: 1 },
  queueToggleBtn: {
    backgroundColor: '#1a1a1a', padding: 9, borderRadius: 10,
  },

  // Player
  playerWrap: { width: '100%', backgroundColor: '#000', position: 'relative' },
  video: { width: '100%', height: '100%' },
  progressTrack: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: '#333' },
  progressFill: { height: '100%', backgroundColor: '#3ea6ff' },

  // Controls
  controls: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 24, paddingVertical: 14,
  },
  ctrlBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center',
  },
  ctrlBtnDisabled: { backgroundColor: '#111' },
  ctrlCounter: {
    backgroundColor: '#1a1a1a', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20,
  },
  ctrlCounterText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Video info
  videoInfo: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    marginHorizontal: 16, padding: 14,
    backgroundColor: '#111', borderRadius: 14,
  },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  videoTitle: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  videoMeta: { color: '#888', fontSize: 12 },
  shortBadge: {
    backgroundColor: '#ff4444', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  shortBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  // Queue panel
  queuePanel: {
    position: 'absolute', top: 0, right: 0, bottom: 0, width: W * 0.8,
    backgroundColor: '#0f0f0f', borderLeftWidth: 1, borderLeftColor: '#1a1a1a',
    elevation: 30, zIndex: 50,
    shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 20, shadowOffset: { width: -4, height: 0 },
  },
  queueBackdrop: {
    position: 'absolute', top: 0, left: 0, bottom: 0, right: W * 0.8,
    zIndex: 49,
  },
  queueHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#1a1a1a',
  },
  queueTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  queueItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 10, padding: 6,
  },
  queueItemActive: { backgroundColor: '#1a1a2e' },
  queueThumbWrap: {
    width: 80, height: 50, borderRadius: 6, overflow: 'hidden', position: 'relative',
  },
  queueShortThumbWrap: {
    width: 38, height: 58, borderRadius: 6, overflow: 'hidden', position: 'relative',
  },
  queuePlayOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  queueShortLabel: {
    position: 'absolute', top: 2, left: 2,
    backgroundColor: '#ff4444', width: 13, height: 13, borderRadius: 3,
    alignItems: 'center', justifyContent: 'center',
  },
  queueItemTitle: { color: '#ccc', fontSize: 12, fontWeight: '500' },
  queueItemTitleActive: { color: '#3ea6ff' },
  queueItemMeta: { color: '#666', fontSize: 10, marginTop: 2 },
  queueItemIndex: { color: '#555', fontSize: 11, minWidth: 18, textAlign: 'right' },
});
