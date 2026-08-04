import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import client from '../api/client';
import TopBar from '../components/TopBar';
import { formatDistanceToNow } from 'date-fns';
import { socket } from '../api/socket';

export default function SubscriptionsScreen() {
  const [channels, setChannels] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [channelsRes, videosRes] = await Promise.all([
          client.get('/users/subscriptions'),
          client.get('/videos/subscriptions')
        ]);
        
        setChannels(channelsRes.data || []);
        setVideos(videosRes.data || []);
      } catch (error) {
        console.error('Error fetching subscriptions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const handleUserUpdate = (data: any) => {
      setChannels(prev => prev.map(channel => 
        (channel._id === data.userId || channel.id === data.userId) 
          ? { ...channel, isVerified: data.isVerified, subscribersCount: data.subscribersCount } 
          : channel
      ));
    };
    
    socket.on('user_updated', handleUserUpdate);
    return () => {
      socket.off('user_updated', handleUserUpdate);
    };
  }, []);

  const renderVideoItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => navigation.navigate('VideoPlayer', { video: item })}
      activeOpacity={0.8}
    >
      <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} />
      <View style={styles.infoContainer}>
        <Image source={{ uri: item.creator?.avatarUrl || 'https://via.placeholder.com/40' }} style={styles.avatar} />
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.details}>
            {item.creator?.username} • {item.views || 0} views • {item.createdAt ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }) : 'Recently'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TopBar />
      
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(item) => item._id}
          renderItem={renderVideoItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => (
            channels.length > 0 ? (
              <View style={styles.channelsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.channelsScroll}>
                  {channels.map((channel: any) => (
                    <TouchableOpacity 
                      key={channel._id} 
                      style={styles.channelItem}
                      onPress={() => navigation.navigate('Channel', { username: channel.username })}
                    >
                      <Image source={{ uri: channel.avatarUrl || 'https://via.placeholder.com/60' }} style={styles.channelAvatar} />
                      <Text style={styles.channelName} numberOfLines={1}>
                        {channel.channelName || channel.username}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ) : null
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No videos from your subscriptions yet.</Text>
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
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingBottom: 20,
  },
  channelsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    paddingVertical: 12,
    marginBottom: 16,
  },
  channelsScroll: {
    paddingHorizontal: 12,
  },
  channelItem: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 64,
  },
  channelAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#333',
    marginBottom: 6,
    borderWidth: 2,
    borderColor: '#3ea6ff',
  },
  channelName: {
    color: '#aaa',
    fontSize: 12,
    textAlign: 'center',
  },
  card: {
    marginBottom: 20,
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#222',
  },
  infoContainer: {
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
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  details: {
    color: '#aaa',
    fontSize: 14,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
  }
});
