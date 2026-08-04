import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, Dimensions, Text, ActivityIndicator, Image, TouchableOpacity, TouchableWithoutFeedback, Share, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { useVideoPlayer, VideoView } from 'expo-video';
import apiClient from '../api/client';
import { Video } from '../types';

const { height: WINDOW_HEIGHT, width: WINDOW_WIDTH } = Dimensions.get('window');

// Subtract bottom tab height (approx 50) and handle SafeArea
const SHORTS_HEIGHT = WINDOW_HEIGHT - 50;

import { ThumbsUp, MessageSquare, Share2, MoreVertical } from 'lucide-react-native';

function CommentsModal({ videoId, visible, onClose }: { videoId: string, visible: boolean, onClose: () => void }) {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (visible) {
      fetchComments();
    }
  }, [visible]);

  const fetchComments = async () => {
    try {
      const res = await apiClient.get(`/comments/${videoId}`);
      setComments(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const postComment = async () => {
    if (!text.trim()) return;
    try {
      const res = await apiClient.post(`/comments/${videoId}`, { text });
      setComments([res.data, ...comments]);
      setText('');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView 
          style={styles.modalContent} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Comments</Text>
            <TouchableOpacity onPress={onClose}><Text style={styles.closeText}>Close</Text></TouchableOpacity>
          </View>
          {loading ? <ActivityIndicator style={{marginTop: 20}} color="#fff" /> : (
            <FlatList
              data={comments}
              keyExtractor={item => item._id}
              renderItem={({item}) => (
                <View style={styles.commentItem}>
                  <Text style={styles.commentAuthor}>@{item.author?.username}</Text>
                  <Text style={styles.commentText}>{item.text}</Text>
                </View>
              )}
              ListEmptyComponent={<Text style={{color: '#888', padding: 16}}>No comments yet.</Text>}
            />
          )}
          {user ? (
            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                placeholderTextColor="#888"
                value={text}
                onChangeText={setText}
              />
              <TouchableOpacity onPress={postComment} style={styles.postBtn}>
                <Text style={styles.postBtnText}>Post</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={{color: '#888', padding: 16, textAlign: 'center'}}>Log in to comment</Text>
          )}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function SaveToPlaylistModal({ videoId, visible, onClose }: { videoId: string, visible: boolean, onClose: () => void }) {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (visible && user) {
      fetchPlaylists();
    }
  }, [visible, user]);

  const fetchPlaylists = async () => {
    try {
      const res = await apiClient.get('/playlists');
      setPlaylists(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const toggleSave = async (playlist: any) => {
    try {
      const isSaved = playlist.videos.some((v: any) => v._id === videoId || v === videoId);
      if (isSaved) {
        await apiClient.post(`/playlists/${playlist._id}/remove`, { videoId });
      } else {
        await apiClient.post(`/playlists/${playlist._id}/add`, { videoId });
      }
      fetchPlaylists();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Save to Playlist</Text>
            <TouchableOpacity onPress={onClose}><Text style={styles.closeText}>Close</Text></TouchableOpacity>
          </View>
          {!user ? <Text style={{color: '#888', padding: 16, textAlign: 'center'}}>Log in to save</Text> : (
            <FlatList
              data={playlists}
              keyExtractor={item => item._id}
              renderItem={({item}) => {
                const isSaved = item.videos.some((v: any) => v._id === videoId || v === videoId);
                return (
                  <TouchableOpacity style={styles.playlistItem} onPress={() => toggleSave(item)}>
                    <Text style={styles.playlistName}>{item.name}</Text>
                    <Text style={styles.playlistStatus}>{isSaved ? 'Saved' : 'Save'}</Text>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={<Text style={{color: '#888', padding: 16}}>No playlists found.</Text>}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

function ShortVideoItem({ item, isActive, height }: { item: Video, isActive: boolean, height: number }) {
  const { user } = useAuth();
  const [likes, setLikes] = useState(item.likes || 0);
  const [userAction, setUserAction] = useState<'like' | 'dislike' | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    const videoItem = item as any;
    if (user && videoItem.likedBy && videoItem.likedBy.includes(user._id)) {
      setUserAction('like');
    }
  }, [user, item]);

  useEffect(() => {
    const socketUrl = apiClient.defaults.baseURL?.replace('/api', '') || 'http://10.252.145.66:5001';
    const socket = io(socketUrl);
    
    socket.on('videoInteractionUpdated', (data: any) => {
      if (data.videoId === item._id) {
        setLikes(data.likes);
        // We don't change userAction here because we don't know the remote user's ID
        // The local user's own action is already updated via handleLike's response
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [item._id]);

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
    if (!user || isLiking) return;
    setIsLiking(true);
    
    const prevAction = userAction;
    const prevLikes = likes;
    
    // Optimistic Update
    const newAction = prevAction === 'like' ? null : 'like';
    setUserAction(newAction);
    setLikes(prev => newAction === 'like' ? prev + 1 : prev - 1);
    
    try {
      const res = await apiClient.post(`/videos/${item._id}/like`);
      const updatedVideo = res.data;
      setLikes(updatedVideo.likes);
      if (updatedVideo.likedBy.includes(user._id)) {
        setUserAction('like');
      } else {
        setUserAction(null);
      }
    } catch (error) {
      console.error('Failed to like video:', error);
      // Revert on failure
      setUserAction(prevAction);
      setLikes(prevLikes);
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this short: https://vynra.com/watch/${item._id}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const togglePlayPause = () => {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  return (
    <View style={[styles.shortContainer, { height }]}>
      <TouchableWithoutFeedback onPress={togglePlayPause}>
        <View style={{ width: '100%', height: '100%' }}>
          <VideoView
            style={styles.video}
            player={player}
            nativeControls={false}
            contentFit="contain"
          />
        </View>
      </TouchableWithoutFeedback>
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

        <TouchableOpacity style={styles.actionBtn} onPress={() => setShowComments(true)}>
          <View style={styles.iconWrapper}>
            <MessageSquare color="#fff" size={28} />
          </View>
          <Text style={styles.actionText}>Comment</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
          <View style={styles.iconWrapper}>
            <Share2 color="#fff" size={28} />
          </View>
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionBtn} onPress={() => setShowPlaylist(true)}>
          <View style={styles.iconWrapper}>
            <MoreVertical color="#fff" size={28} />
          </View>
        </TouchableOpacity>
      </View>
      <CommentsModal videoId={item._id} visible={showComments} onClose={() => setShowComments(false)} />
      <SaveToPlaylistModal videoId={item._id} visible={showPlaylist} onClose={() => setShowPlaylist(false)} />
    </View>
  );
}

import { useIsFocused } from '@react-navigation/native';

export default function ShortsScreen({ route }: any) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [containerHeight, setContainerHeight] = useState(SHORTS_HEIGHT);
  const isFocused = useIsFocused();

  const initialVideoId = route?.params?.initialVideoId;

  useEffect(() => {
    fetchVideos();
  }, [initialVideoId]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/videos?tag=shorts');
      let fetchedVideos = res.data;

      if (initialVideoId) {
        const targetIndex = fetchedVideos.findIndex((v: any) => v._id === initialVideoId);
        if (targetIndex > -1) {
          const targetVideo = fetchedVideos.splice(targetIndex, 1)[0];
          fetchedVideos.unshift(targetVideo);
        }
      }

      setVideos(fetchedVideos);
      setActiveIndex(0); // Reset to top
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
    <View 
      style={styles.container}
      onLayout={(e) => setContainerHeight(e.nativeEvent.layout.height)}
    >
      <FlatList
        data={videos}
        keyExtractor={(item) => item._id}
        renderItem={({ item, index }) => (
          <ShortVideoItem 
            item={item} 
            isActive={isFocused && index === activeIndex} 
            height={containerHeight} 
          />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={viewabilityConfig.current}
        refreshing={refreshing}
        onRefresh={onRefresh}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        windowSize={3}
        removeClippedSubviews={true}
        ListEmptyComponent={() => (
          <View style={[styles.loaderContainer, { height: containerHeight }]}>
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
    bottom: 16, // Uplifted from bottom
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
    bottom: 16, // Uplifted
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
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    height: '60%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  closeText: {
    color: '#aaa',
    fontSize: 16
  },
  commentItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  commentAuthor: {
    color: '#aaa',
    fontSize: 13,
    marginBottom: 4
  },
  commentText: {
    color: '#fff',
    fontSize: 15
  },
  commentInputRow: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#333'
  },
  commentInput: {
    flex: 1,
    color: '#fff',
    backgroundColor: '#333',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10
  },
  postBtn: {
    justifyContent: 'center',
    paddingHorizontal: 12
  },
  postBtnText: {
    color: '#3ea6ff',
    fontWeight: 'bold'
  },
  playlistItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  playlistName: {
    color: '#fff',
    fontSize: 16
  },
  playlistStatus: {
    color: '#3ea6ff'
  }
});
