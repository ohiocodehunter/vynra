import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import client from '../api/client';
import { formatDistanceToNow } from 'date-fns';

export default function VideoListScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { title, endpoint } = route.params;

  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await client.get(endpoint);
        // The backend might return { videos: [...] } or just an array depending on the route
        if (Array.isArray(response.data)) {
          setVideos(response.data);
        } else if (response.data.videos) {
          setVideos(response.data.videos);
        } else {
          setVideos([]);
        }
      } catch (err) {
        console.error(`Error fetching ${title}:`, err);
        setError(`Failed to load ${title}`);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [endpoint]);

  const renderVideoItem = ({ item }: { item: any }) => {
    // Handling cases where the object might be populated or nested
    const video = item.video || item;
    
    if (!video || !video._id) return null;

    return (
      <TouchableOpacity 
        style={styles.videoCard}
        onPress={() => navigation.navigate('VideoPlayer', { video })}
      >
        <Image source={{ uri: video.thumbnailUrl }} style={styles.thumbnail} />
        <View style={styles.videoInfo}>
          <Image source={{ uri: video.creator?.avatarUrl || 'https://via.placeholder.com/40' }} style={styles.avatar} />
          <View style={styles.textDetails}>
            <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
            <Text style={styles.videoStats}>
              {video.creator?.username} • {video.views || 0} views • {video.createdAt ? formatDistanceToNow(new Date(video.createdAt), { addSuffix: true }) : 'Recently'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color="#fff" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(item, index) => (item._id || index).toString()}
          renderItem={renderVideoItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={() => (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>No videos found in {title}.</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backBtn: {
    marginRight: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 16,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  },
  listContent: {
    paddingVertical: 12,
  },
  videoCard: {
    marginBottom: 20,
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#222',
  },
  videoInfo: {
    flexDirection: 'row',
    padding: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#333',
  },
  textDetails: {
    flex: 1,
  },
  videoTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  videoStats: {
    color: '#aaa',
    fontSize: 14,
  }
});
