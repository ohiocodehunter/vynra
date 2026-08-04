import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, Dimensions, Text, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import apiClient from '../api/client';
import { Video } from '../types';

const { height: WINDOW_HEIGHT, width: WINDOW_WIDTH } = Dimensions.get('window');

// Subtract bottom tab height (approx 50) and handle SafeArea
const SHORTS_HEIGHT = WINDOW_HEIGHT - 50;

import { ThumbsUp, MessageSquare, Share2, MoreVertical } from 'lucide-react-native';

function ShortVideoItem({ item, isActive }: { item: Video, isActive: boolean }) {
  const [likes, setLikes] = useState(item.likes || 0);
  const [userAction, setUserAction] = useState<'like' | 'dislike' | null>(null);

  const player = useVideoPlayer(item.url, player => {
    player.loop = true;
    if (isActive) {
      player.play();
    } else {
      player.pause();
    }
  });

  // Keep player sync'd with active state
  useEffect(() => {
    if (isActive) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, player]);

  const handleLike = async () => {
    try {
      await apiClient.post(`/videos/${item._id}/like`);
      const action = userAction === 'like' ? null : 'like';
      setUserAction(action);
      if (action === 'like') {
        setLikes(prev => prev + 1);
      } else if (userAction === 'like') {
        setLikes(prev => prev - 1);
      }
    } catch (error) {
      console.error('Failed to like video:', error);
    }
  };

  return (
    <View style={[styles.shortContainer, { height: SHORTS_HEIGHT }]}>
      <VideoView
        style={styles.video}
        player={player}
        nativeControls={false}
        contentFit="contain"
      />
      <View style={styles.overlay}>
        <View style={styles.creatorInfo}>
          <Image 
            source={{ uri: item.creator?.avatarUrl || 'https://via.placeholder.com/40' }} 
            style={styles.avatar} 
          />
          <Text style={styles.channelName}>@{item.creator?.username}</Text>
          <TouchableOpacity style={styles.subscribeBtn}>
            <Text style={styles.subscribeBtnText}>Subscribe</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
      </View>
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
          <View style={styles.iconWrapper}>
            <ThumbsUp color={userAction === 'like' ? '#e50914' : '#fff'} size={28} />
          </View>
          <Text style={styles.actionText}>
            {likes >= 1000 ? Math.floor(likes / 1000) + 'K' : likes}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn}>
          <View style={styles.iconWrapper}>
            <MessageSquare color="#fff" size={28} />
          </View>
          <Text style={styles.actionText}>Comment</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn}>
          <View style={styles.iconWrapper}>
            <Share2 color="#fff" size={28} />
          </View>
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionBtn}>
          <View style={styles.iconWrapper}>
            <MoreVertical color="#fff" size={28} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ShortsScreen() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const res = await apiClient.get('/videos?tag=shorts');
      setVideos(res.data);
    } catch (error) {
      console.error('Failed to fetch shorts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchVideos();
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  });

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  });

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={videos}
        keyExtractor={(item) => item._id}
        renderItem={({ item, index }) => (
          <ShortVideoItem item={item} isActive={index === activeIndex} />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={viewabilityConfig.current}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={() => (
          <View style={[styles.loaderContainer, { height: SHORTS_HEIGHT }]}>
            <Text style={{ color: '#888', fontSize: 16 }}>No shorts available</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shortContainer: {
    width: WINDOW_WIDTH,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 80, // Uplifted from bottom
    left: 16,
    right: 80, // Leave room for right side buttons
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: '#333',
  },
  channelName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginRight: 10,
  },
  subscribeBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  subscribeBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12,
  },
  title: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 20,
  },
  actionsContainer: {
    position: 'absolute',
    bottom: 80, // Uplifted
    right: 12,
    alignItems: 'center',
  },
  actionBtn: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  actionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  }
});
