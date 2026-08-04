import React from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ChevronLeft, ThumbsUp, ThumbsDown, Share2, MessageSquare, PlusCircle } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';

export default function VideoPlayerScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { video } = route.params;

  const player = useVideoPlayer(video.url, player => {
    player.loop = false;
    player.play();
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft color="#fff" size={28} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.videoContainer}>
        <VideoView
          style={styles.video}
          player={player}
          nativeControls={true}
          contentFit="contain"
        />
      </View>

      <ScrollView style={styles.detailsContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{video.title}</Text>
        <Text style={styles.stats}>
          {video.views?.toLocaleString()} views • {video.createdAt ? formatDistanceToNow(new Date(video.createdAt), { addSuffix: true }) : 'Recently'}
        </Text>

        <View style={styles.creatorRow}>
          <Image 
            source={{ uri: video.creator?.avatarUrl || 'https://via.placeholder.com/40' }} 
            style={styles.avatar} 
          />
          <View style={styles.creatorInfo}>
            <Text style={styles.creatorName}>{video.creator?.username || 'Unknown'}</Text>
            <Text style={styles.subscribers}>1.2K subscribers</Text>
          </View>
          <TouchableOpacity style={styles.subscribeBtn}>
            <Text style={styles.subscribeBtnText}>Subscribe</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn}>
            <ThumbsUp color="#fff" size={20} />
            <Text style={styles.actionText}>{video.likes || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <ThumbsDown color="#fff" size={20} />
            <Text style={styles.actionText}>Dislike</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Share2 color="#fff" size={20} />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <PlusCircle color="#fff" size={20} />
            <Text style={styles.actionText}>Save</Text>
          </TouchableOpacity>
        </ScrollView>

        <TouchableOpacity style={styles.commentsPreview}>
          <View style={styles.commentsHeader}>
            <Text style={styles.commentsTitle}>Comments</Text>
            <Text style={styles.commentsCount}>{video.comments?.length || 0}</Text>
          </View>
          <Text style={styles.commentPreviewText}>
            {video.comments?.[0]?.text || "Add a comment..."}
          </Text>
        </TouchableOpacity>

        {video.description ? (
          <View style={styles.descriptionBox}>
            <Text style={styles.descriptionText}>{video.description}</Text>
          </View>
        ) : null}
      </ScrollView>
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
  subscribeBtnText: { color: '#000', fontWeight: 'bold' },
  actionsRow: { flexDirection: 'row', marginBottom: 24, gap: 12 },
  actionBtn: { alignItems: 'center', backgroundColor: '#222', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, flexDirection: 'row', gap: 8 },
  actionText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  commentsPreview: { backgroundColor: '#1a1a1a', padding: 12, borderRadius: 12, marginBottom: 16 },
  commentsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  commentsTitle: { color: '#fff', fontWeight: 'bold', marginRight: 8 },
  commentsCount: { color: '#aaa', fontSize: 12 },
  commentPreviewText: { color: '#fff', fontSize: 14 },
  descriptionBox: { backgroundColor: '#1a1a1a', padding: 12, borderRadius: 12, marginBottom: 40 },
  descriptionText: { color: '#fff', fontSize: 14, lineHeight: 20 }
});
