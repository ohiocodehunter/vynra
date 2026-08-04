import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search } from 'lucide-react-native';
import apiClient from '../api/client';
import { Video, User } from '../types';
import { useNavigation } from '@react-navigation/native';

export default function ExploreScreen() {
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState<Video[]>([]);
  const [channels, setChannels] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<any>();

  const searchVideos = useCallback(async (searchQuery: string) => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      setVideos([]);
      setChannels([]);
      return;
    }
    
    setLoading(true);
    try {
      const [videoResult, channelResult] = await Promise.allSettled([
        apiClient.get(`/videos?q=${encodeURIComponent(trimmedQuery)}`),
        apiClient.get(`/users/search?q=${encodeURIComponent(trimmedQuery)}`)
      ]);
      
      if (videoResult.status === 'fulfilled') {
        setVideos(videoResult.value.data);
      } else {
        setVideos([]);
        console.error('Video search failed', videoResult.reason);
      }

      if (channelResult.status === 'fulfilled') {
        setChannels(channelResult.value.data);
      } else {
        setChannels([]);
        console.error('Channel search failed', channelResult.reason);
      }
    } catch (err) {
      console.error('Failed to search videos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Simple debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      searchVideos(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query, searchVideos]);

  const renderItem = ({ item }: { item: any }) => {
    if (item.type === 'channel') {
      const channel = item.data;
      return (
        <TouchableOpacity 
          style={styles.channelCard}
          onPress={() => navigation.navigate('Channel', { username: channel.username })}
        >
          <Image source={{ uri: channel.avatarUrl || 'https://via.placeholder.com/60' }} style={styles.channelAvatar} />
          <View style={styles.channelInfo}>
            <Text style={styles.channelNameTitle}>{channel.username}</Text>
            <Text style={styles.channelSubscribers}>{channel.subscribersCount || 0} subscribers</Text>
          </View>
        </TouchableOpacity>
      );
    }

    const video = item.data;
    return (
      <TouchableOpacity 
        style={styles.videoCard} 
        onPress={() => navigation.navigate('VideoPlayer', { video })}
      >
        <Image source={{ uri: video.thumbnailUrl }} style={styles.thumbnail} />
        <View style={styles.videoInfo}>
          <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
          <Text style={styles.channelName}>{video.creator?.username || 'Unknown'} • {video.views} views</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const combinedData = [
    ...channels.map(c => ({ id: `channel_${c._id}`, type: 'channel', data: c })),
    ...videos.map(v => ({ id: `video_${v._id}`, type: 'video', data: v }))
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Search color="#888" size={20} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search videos..."
            placeholderTextColor="#888"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color="#fff" />
      ) : (
        <FlatList
          data={combinedData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={
            query ? (
              <Text style={styles.emptyText}>No results found for "{query}"</Text>
            ) : (
              <View style={styles.exploreCategories}>
                <Text style={styles.categoryTitle}>Explore</Text>
                <Text style={styles.categoryDesc}>Search for your favorite videos</Text>
              </View>
            )
          }
          contentContainerStyle={combinedData.length === 0 ? styles.emptyContainer : styles.listContainer}
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  searchBar: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    height: '100%',
  },
  loader: {
    marginTop: 40,
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
  },
  exploreCategories: {
    alignItems: 'center',
  },
  categoryTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  categoryDesc: {
    color: '#888',
    fontSize: 14,
  },
  videoCard: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumbnail: {
    width: 120,
    height: 68,
    backgroundColor: '#222',
  },
  videoInfo: {
    flex: 1,
    padding: 8,
    justifyContent: 'center',
  },
  videoTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  channelName: {
    color: '#888',
    fontSize: 12,
  },
  channelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
  },
  channelAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#333',
    marginRight: 16,
  },
  channelInfo: {
    flex: 1,
  },
  channelNameTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  channelSubscribers: {
    color: '#aaa',
    fontSize: 13,
  }
});
