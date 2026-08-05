import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft, ListVideo } from 'lucide-react-native';
import client from '../api/client';
import { formatDistanceToNow } from 'date-fns';

export default function PlaylistsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const playlistId = route.params?.playlistId;
  const playlistName = route.params?.playlistName;

  const [playlists, setPlaylists] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (playlistId) {
      fetchPlaylistVideos();
    } else {
      fetchPlaylists();
    }
  }, [playlistId]);

  const fetchPlaylists = async () => {
    try {
      setLoading(true);
      const res = await client.get('/playlists');
      setPlaylists(res.data);
    } catch (error) {
      console.error('Error fetching playlists', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlaylistVideos = async () => {
    try {
      setLoading(true);
      // Fetch all playlists and find the matching one
      const res = await client.get('/playlists');
      const playlist = res.data.find((p: any) => p._id === playlistId);
      setVideos(playlist?.videos || []);
    } catch (error) {
      console.error('Error fetching playlist videos', error);
    } finally {
      setLoading(false);
    }
  };

  // Delete not supported by backend yet


  // ── Playlist list view ──────────────────────────────────────────
  if (!playlistId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft color="#fff" size={26} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Playlists</Text>
        </View>

        {loading ? (
          <ActivityIndicator style={styles.loader} color="#fff" />
        ) : (
          <FlatList
            data={playlists}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.playlistCard}
                onPress={() => navigation.navigate('Playlists', { playlistId: item._id, playlistName: item.name })}
              >
                {/* Thumbnail stack */}
                <View style={styles.thumbStack}>
                  {item.thumbnailUrl ? (
                    <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbImg} />
                  ) : (
                    <View style={[styles.thumbImg, styles.thumbPlaceholder]}>
                      <ListVideo color="#555" size={28} />
                    </View>
                  )}
                  <View style={styles.thumbOverlay}>
                    <Text style={styles.thumbCount}>{item.videos?.length || 0}</Text>
                  </View>
                </View>

                <View style={styles.playlistInfo}>
                  <Text style={styles.playlistName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.playlistMeta}>{item.videos?.length || 0} videos</Text>
                  {item.createdAt && (
                    <Text style={styles.playlistDate}>
                      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <ListVideo color="#444" size={48} />
                <Text style={styles.emptyTitle}>No playlists yet</Text>
                <Text style={styles.emptySubtext}>Save a video to create your first playlist</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    );
  }

  // ── Single playlist video list view ────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color="#fff" size={26} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{playlistName}</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color="#fff" />
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.videoRow}
              onPress={() => navigation.navigate('VideoPlayer', { video: item })}
            >
              <Image
                source={{ uri: item.thumbnailUrl || 'https://via.placeholder.com/160x90' }}
                style={styles.videoThumb}
              />
              <View style={styles.videoInfo}>
                <Text style={styles.videoTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.videoMeta}>{item.creator?.username}</Text>
                <Text style={styles.videoMeta}>
                  {item.views?.toLocaleString()} views •{' '}
                  {item.createdAt ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }) : ''}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>This playlist is empty</Text>
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
    flexDirection: 'row', alignItems: 'center', padding: 16,
    borderBottomWidth: 1, borderBottomColor: '#222', gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', flex: 1 },
  loader: { flex: 1, justifyContent: 'center' },
  listContent: { padding: 16, gap: 12 },
  // Playlist card
  playlistCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#1a1a1a', borderRadius: 12, padding: 12,
  },
  thumbStack: { width: 100, height: 60, borderRadius: 8, overflow: 'hidden', position: 'relative' },
  thumbImg: { width: '100%', height: '100%' },
  thumbPlaceholder: { backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center' },
  thumbOverlay: {
    position: 'absolute', bottom: 0, right: 0, left: 0,
    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', paddingVertical: 2,
  },
  thumbCount: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  playlistInfo: { flex: 1 },
  playlistName: { color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 2 },
  playlistMeta: { color: '#888', fontSize: 13 },
  playlistDate: { color: '#666', fontSize: 12, marginTop: 2 },
  deleteBtn: { padding: 8 },
  // Video row
  videoRow: {
    flexDirection: 'row', gap: 12, backgroundColor: '#1a1a1a',
    borderRadius: 12, overflow: 'hidden',
  },
  videoThumb: { width: 140, height: 80 },
  videoInfo: { flex: 1, padding: 10, justifyContent: 'center' },
  videoTitle: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  videoMeta: { color: '#888', fontSize: 12 },
  // Empty state
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 10 },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  emptySubtext: { color: '#888', fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
});
