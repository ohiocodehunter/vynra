import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import client from '../api/client';
import { socket } from '../api/socket';
import { useAuth } from '../context/AuthContext';

export default function ChannelScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { username } = route.params;
  const { user: currentUser } = useAuth();
  
  const [channel, setChannel] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'videos' | 'shorts'>('videos');

  const isOwner = currentUser?.username === username;

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    const fetchChannel = async () => {
      try {
        const response = await client.get(`/users/channel/${username}`);
        setChannel(response.data.user);
        setVideos(response.data.videos);
      } catch (error) {
        console.error('Error fetching channel:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchChannel();
  }, [username]);

  useEffect(() => {
    const checkSub = async () => {
      if (!currentUser || !channel?._id) return;
      try {
        const res = await client.get(`/users/check-subscription/${channel._id}`);
        setIsSubscribed(res.data.isSubscribed);
      } catch (error) {
        console.error('Error checking subscription', error);
      }
    };
    checkSub();
  }, [currentUser, channel?._id]);

  useEffect(() => {
    const handleUserUpdate = (data: any) => {
      if (channel && (channel._id === data.userId || channel.id === data.userId)) {
        setChannel((prev: any) => ({
          ...prev,
          subscribersCount: data.subscribersCount,
          isVerified: data.isVerified
        }));
      }
    };
    socket.on('user_updated', handleUserUpdate);
    return () => {
      socket.off('user_updated', handleUserUpdate);
    };
  }, [channel]);

  const handleSubscribe = async () => {
    if (!currentUser) {
      navigation.navigate('Login' as never);
      return;
    }
    if (!channel?._id) return;
    
    setSubscribing(true);
    try {
      const res = await client.post('/users/subscribe', { channelId: channel._id });
      setIsSubscribed(res.data.subscribed);
    } catch (error) {
      console.error('Error subscribing', error);
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </SafeAreaView>
    );
  }

  if (!channel) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={{color: '#fff'}}>Channel not found</Text>
      </SafeAreaView>
    );
  }

  const renderVideoItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.videoCard}
      onPress={() => navigation.navigate(activeTab === 'shorts' ? 'Shorts' : 'VideoPlayer', { video: item })}
    >
      <Image source={{ uri: item.thumbnailUrl }} style={[styles.thumbnail, activeTab === 'shorts' && { aspectRatio: 9 / 16 }]} />
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.videoStats}>{item.views || 0} views</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color="#fff" size={28} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTab === 'videos' ? videos.filter(v => !v.tags?.includes('shorts')) : videos.filter(v => v.tags?.includes('shorts'))}
        keyExtractor={(item) => item._id}
        numColumns={2}
        key={activeTab} // force re-render columns
        ListHeaderComponent={() => (
          <View style={styles.channelProfileContainer}>
            <Image 
              source={{ uri: channel.bannerUrl || 'https://via.placeholder.com/600x200' }} 
              style={styles.banner} 
            />
            <View style={styles.profileDetails}>
              <Image 
                source={{ uri: channel.avatarUrl || 'https://via.placeholder.com/100' }} 
                style={styles.avatar} 
              />
              <Text style={styles.channelName}>{channel.channelName || channel.username}</Text>
              <Text style={styles.subscribers}>{channel.subscribersCount || 0} subscribers • {videos.length} videos</Text>
              
              <Text style={styles.bio} numberOfLines={2}>{channel.bio || 'No description available.'}</Text>
              
              {!isOwner && (
                <TouchableOpacity 
                  style={[styles.subscribeBtn, isSubscribed && styles.subscribedBtn]}
                  onPress={handleSubscribe}
                  disabled={subscribing}
                >
                  <Text style={[styles.subscribeBtnText, isSubscribed && styles.subscribedText]}>
                    {isSubscribed ? 'Subscribed' : 'Subscribe'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.tabsContainer}>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'videos' && styles.activeTab]}
                onPress={() => setActiveTab('videos')}
              >
                <Text style={[styles.tabText, activeTab === 'videos' && styles.activeTabText]}>Videos</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'shorts' && styles.activeTab]}
                onPress={() => setActiveTab('shorts')}
              >
                <Text style={[styles.tabText, activeTab === 'shorts' && styles.activeTabText]}>Shorts</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        renderItem={renderVideoItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No {activeTab} yet.</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    position: 'absolute',
    top: 40,
    left: 10,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 4,
  },
  backBtn: {
    padding: 4,
  },
  channelProfileContainer: {
    marginBottom: 16,
  },
  banner: {
    width: '100%',
    height: 120,
  },
  profileDetails: {
    alignItems: 'center',
    marginTop: -40,
    paddingHorizontal: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#0f0f0f',
    backgroundColor: '#333',
    marginBottom: 8,
  },
  channelName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subscribers: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 8,
  },
  bio: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  subscribeBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 24,
    marginBottom: 16,
  },
  subscribedBtn: {
    backgroundColor: '#222',
  },
  subscribeBtnText: {
    color: '#0f0f0f',
    fontWeight: 'bold',
    fontSize: 16,
  },
  subscribedText: {
    color: '#fff',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#fff',
  },
  tabText: {
    color: '#888',
    fontWeight: 'bold',
  },
  activeTabText: {
    color: '#fff',
  },
  listContent: {
    paddingBottom: 20,
  },
  videoCard: {
    flex: 1,
    margin: 4,
    maxWidth: '50%',
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 8,
    backgroundColor: '#222',
  },
  videoInfo: {
    paddingVertical: 8,
  },
  videoTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  videoStats: {
    color: '#aaa',
    fontSize: 12,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  }
});
