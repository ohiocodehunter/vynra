import React from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Image, Share } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ChevronLeft, ThumbsUp, ThumbsDown, Share2, Bookmark, MessageSquare } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';
import { socket } from '../api/socket';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import CommentsSheet from '../components/CommentsSheet';
import SaveSheet from '../components/SaveSheet';

export default function VideoPlayerScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { video } = route.params;

  const player = useVideoPlayer(video.url, player => {
    player.loop = false;
    player.play();
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
      } catch (error) { console.error('Error checking subscription', error); }
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft color="#fff" size={28} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.videoContainer}>
        <VideoView style={styles.video} player={player} nativeControls={true} contentFit="contain" />
      </View>

      <ScrollView style={styles.detailsContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{video.title}</Text>
        <Text style={styles.stats}>
          {video.views?.toLocaleString()} views • {video.createdAt ? formatDistanceToNow(new Date(video.createdAt), { addSuffix: true }) : 'Recently'}
        </Text>

        <View style={styles.creatorRow}>
          <Image source={{ uri: video.creator?.avatarUrl || 'https://via.placeholder.com/40' }} style={styles.avatar} />
          <View style={styles.creatorInfo}>
            <Text style={styles.creatorName}>{creator?.username || 'Unknown'}</Text>
            <Text style={styles.subscribers}>{creator?.subscribersCount || 0} subscribers</Text>
          </View>
          {user?._id !== creator?._id && (
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

        {/* Action buttons */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.actionsRow} contentContainerStyle={{ gap: 10, paddingRight: 16 }}>
          <TouchableOpacity style={[styles.actionBtn, userAction === 'like' && styles.actionBtnActive]} onPress={handleLike}>
            <ThumbsUp color={userAction === 'like' ? '#0f0f0f' : '#fff'} size={18} fill={userAction === 'like' ? '#0f0f0f' : 'none'} />
            <Text style={[styles.actionText, userAction === 'like' && styles.actionTextActive]}>{formatLikes(likes)}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, userAction === 'dislike' && styles.actionBtnActive]} onPress={handleDislike}>
            <ThumbsDown color={userAction === 'dislike' ? '#0f0f0f' : '#fff'} size={18} fill={userAction === 'dislike' ? '#0f0f0f' : 'none'} />
            <Text style={[styles.actionText, userAction === 'dislike' && styles.actionTextActive]}>Dislike</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
            <Share2 color="#fff" size={18} />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowSave(true)}>
            <Bookmark color="#fff" size={18} />
            <Text style={styles.actionText}>Save</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowComments(true)}>
            <MessageSquare color="#fff" size={18} />
            <Text style={styles.actionText}>Comments</Text>
          </TouchableOpacity>
        </ScrollView>

        <TouchableOpacity style={styles.commentsPreview} onPress={() => setShowComments(true)}>
          <View style={styles.commentsHeader}>
            <Text style={styles.commentsTitle}>Comments</Text>
            <Text style={styles.commentsCount}>{video.comments?.length || 0}</Text>
          </View>
          <Text style={styles.commentPreviewText}>{video.comments?.[0]?.text || 'Add a comment...'}</Text>
        </TouchableOpacity>

        {video.description ? (
          <View style={styles.descriptionBox}>
            <Text style={styles.descriptionText}>{video.description}</Text>
          </View>
        ) : null}
      </ScrollView>

      <CommentsSheet isVisible={showComments} onClose={() => setShowComments(false)} videoId={video._id} />
      <SaveSheet isVisible={showSave} onClose={() => setShowSave(false)} videoId={video._id} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  header: { position: 'absolute', top: 40, left: 16, zIndex: 10 },
  backButton: { backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 20 },
  videoContainer: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
  video: { width: '100%', height: '100%' },
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
