import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Image, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { ChevronLeft, ListVideo, Play } from 'lucide-react-native';
import client from '../api/client';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from 'react-i18next';

const isShort = (video: any) =>
  video?.tags?.includes('shorts') ||
  video?.aspectRatio === '9:16' ||
  (video?.height && video?.width && video.height > video.width);

export default function PlaylistsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const playlistId = route.params?.playlistId;
  const playlistName = route.params?.playlistName;
  const playlistObj = route.params?.playlist;

  const [playlists, setPlaylists] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Refresh whenever screen comes into focus (e.g. after saving a new video)
  useFocusEffect(
    useCallback(() => {
      if (playlistId) fetchPlaylistVideos();
      else fetchPlaylists();
    }, [playlistId])
  );

  const fetchPlaylists = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const res = await client.get('/playlists');
      setPlaylists(res.data);
    } catch (error) {
      console.error('Error fetching playlists', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchPlaylistVideos = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const res = await client.get('/playlists');
      const playlist = res.data.find((p: any) => p._id === playlistId);
      setVideos(playlist?.videos || []);
    } catch (error) {
      console.error('Error fetching playlist videos', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (playlistId) fetchPlaylistVideos(true);
    else fetchPlaylists(true);
  };

  // ── Playlist list view ─────────────────────────────────────────
  if (!playlistId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft color="#fff" size={26} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('playlists.playlists', 'My Playlists')}</Text>
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#fff" />
        ) : (
          <FlatList
            data={playlists}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
            renderItem={({ item }) => {
              // Pick first video thumbnail as playlist cover
              const firstThumb = item.videos?.[0]?.thumbnailUrl;
              const shortCount = item.videos?.filter(isShort).length || 0;
              const videoCount = (item.videos?.length || 0) - shortCount;

              return (
                <TouchableOpacity
                  style={styles.playlistCard}
                  onPress={() =>
                    navigation.navigate('Playlists', {
                      playlistId: item._id,
                      playlistName: item.name,
                      playlist: item,
                    })
                  }
                  activeOpacity={0.75}
                >
                  {/* Stacked thumbnail */}
                  <View style={styles.thumbWrap}>
                    <View style={styles.thumbBack} />
                    <View style={styles.thumbMid} />
                    {firstThumb ? (
                      <Image source={{ uri: firstThumb }} style={styles.thumbFront} />
                    ) : (
                      <View style={[styles.thumbFront, styles.thumbPlaceholder]}>
                        <ListVideo color="#555" size={24} />
                      </View>
                    )}
                    <View style={styles.thumbCountBadge}>
                      <Play color="#fff" size={8} fill="#fff" />
                      <Text style={styles.thumbCountText}>{item.videos?.length || 0}</Text>
                    </View>
                  </View>

                  <View style={styles.playlistInfo}>
                    <Text style={styles.playlistName} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.playlistMeta}>
                      {videoCount > 0 && (
                        <Text style={styles.metaChip}>🎬 {videoCount} {t('common.videos')}</Text>
                      )}
                      {shortCount > 0 && (
                        <Text style={styles.metaChipShort}>⚡ {shortCount} {t('home.shorts')}</Text>
                      )}
                    </View>
                    {item.createdAt && (
                      <Text style={styles.playlistDate}>
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                      </Text>
                    )}
                  </View>

                  <ChevronLeft color="#555" size={20} style={{ transform: [{ rotate: '180deg' }] }} />
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <ListVideo color="#333" size={56} />
                <Text style={styles.emptyTitle}>{t('playlists.playlistEmpty', 'No playlists yet')}</Text>
                <Text style={styles.emptySubtext}>
                  {t('playlists.saveVideoDesc', 'Tap Save on any video or short to create your first playlist')}
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    );
  }

  // ── Playlist detail view ────────────────────────────────────────
  const buildPlaylistObj = () => ({
    _id: playlistId,
    name: playlistName,
    videos,
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color="#fff" size={26} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{playlistName}</Text>
          {!loading && (
            <Text style={styles.headerSub}>{videos.length} {t('common.videos')}</Text>
          )}
        </View>
        {/* Play all button */}
        {videos.length > 0 && (
          <TouchableOpacity
            style={styles.playAllBtn}
            onPress={() =>
              navigation.navigate('PlaylistPlayer', {
                playlist: buildPlaylistObj(),
                startIndex: 0,
              })
            }
          >
            <Play color="#fff" size={14} fill="#fff" />
            <Text style={styles.playAllText}>{t('playlists.playAll', 'Play All')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#fff" />
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
          renderItem={({ item, index }) => {
            const short = isShort(item);
            return (
              <TouchableOpacity
                style={styles.videoRow}
                onPress={() =>
                  navigation.navigate('PlaylistPlayer', {
                    playlist: buildPlaylistObj(),
                    startIndex: index,
                  })
                }
                activeOpacity={0.75}
              >
                {/* Thumbnail — portrait for shorts, landscape for videos */}
                <View style={short ? styles.shortThumbWrap : styles.videoThumbWrap}>
                  <Image
                    source={{ uri: item.thumbnailUrl || 'https://via.placeholder.com/160x90' }}
                    style={short ? styles.shortThumb : styles.videoThumb}
                    resizeMode="cover"
                  />
                  {short && (
                    <View style={styles.shortBadge}>
                      <Text style={styles.shortBadgeText}>{t('home.shorts')}</Text>
                    </View>
                  )}
                  <View style={styles.indexBadge}>
                    <Text style={styles.indexBadgeText}>{index + 1}</Text>
                  </View>
                </View>

                <View style={styles.videoInfo}>
                  <Text style={styles.videoTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.videoMeta}>{item.creator?.username}</Text>
                  <Text style={styles.videoMeta}>
                    {item.views?.toLocaleString()} {t('common.views')}
                    {item.createdAt
                      ? ` • ${formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}`
                      : ''}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <ListVideo color="#333" size={48} />
              <Text style={styles.emptyTitle}>{t('playlists.playlistEmpty', 'Playlist is empty')}</Text>
              <Text style={styles.emptySubtext}>{t('playlists.saveVideoDesc2', 'Save videos or shorts to this playlist')}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#1a1a1a', gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  headerSub: { color: '#888', fontSize: 12, marginTop: 1 },
  playAllBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#3ea6ff', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  playAllText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  listContent: { padding: 16, gap: 12 },

  // Playlist cards
  playlistCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#1a1a1a', borderRadius: 14, padding: 12,
  },
  thumbWrap: { width: 90, height: 60, position: 'relative' },
  thumbBack: {
    position: 'absolute', bottom: 0, left: 4, right: -4,
    height: 50, backgroundColor: '#2a2a2a', borderRadius: 6,
  },
  thumbMid: {
    position: 'absolute', bottom: 3, left: 2, right: -2,
    height: 50, backgroundColor: '#252525', borderRadius: 6,
  },
  thumbFront: {
    position: 'absolute', bottom: 6, left: 0, right: 0,
    height: 50, borderRadius: 6, overflow: 'hidden',
  },
  thumbPlaceholder: { backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center' },
  thumbCountBadge: {
    position: 'absolute', top: 2, right: -2,
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6,
  },
  thumbCountText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  playlistInfo: { flex: 1, gap: 4 },
  playlistName: { color: '#fff', fontSize: 15, fontWeight: '700' },
  playlistMeta: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  metaChip: { color: '#aaa', fontSize: 12 },
  metaChipShort: { color: '#ff9800', fontSize: 12 },
  playlistDate: { color: '#666', fontSize: 11 },

  // Video rows
  videoRow: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    backgroundColor: '#1a1a1a', borderRadius: 12, overflow: 'hidden', padding: 8,
  },
  videoThumbWrap: { width: 130, height: 76, borderRadius: 8, overflow: 'hidden', position: 'relative' },
  videoThumb: { width: '100%', height: '100%' },
  shortThumbWrap: { width: 52, height: 76, borderRadius: 8, overflow: 'hidden', position: 'relative' },
  shortThumb: { width: '100%', height: '100%' },
  shortBadge: {
    position: 'absolute', top: 3, left: 3,
    backgroundColor: '#ff4444', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4,
  },
  shortBadgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  indexBadge: {
    position: 'absolute', bottom: 3, right: 3,
    backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4,
  },
  indexBadgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  videoInfo: { flex: 1, justifyContent: 'center', paddingVertical: 4, gap: 3 },
  videoTitle: { color: '#fff', fontSize: 13, fontWeight: '600' },
  videoMeta: { color: '#888', fontSize: 11 },

  // Empty state
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  emptySubtext: { color: '#888', fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
});
