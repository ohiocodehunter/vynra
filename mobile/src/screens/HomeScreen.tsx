import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import apiClient from '../api/client';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import TopBar from '../components/TopBar';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

export default function HomeScreen() {
  const { t } = useTranslation();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();
  const { colors } = useTheme();

  const fetchVideos = async () => {
    try {
      const res = await apiClient.get('/videos');
      setVideos(res.data);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchVideos();
  }, []);

  const feedData = React.useMemo(() => {
    const shorts = videos.filter(v => v.tags?.includes('shorts'));
    const regularVideos = videos.filter(v => !v.tags?.includes('shorts'));
    
    if (shorts.length === 0) {
      return regularVideos.map(v => ({ type: 'regular', id: v._id, video: v }));
    }

    const shortsPairs = [];
    for (let i = 0; i < shorts.length; i += 2) {
      shortsPairs.push(shorts.slice(i, i + 2));
    }

    const feed: any[] = [];
    let shortsPairIndex = 0;
    let regularIndex = 0;

    // Top row of shorts
    if (shortsPairIndex < shortsPairs.length) {
      feed.push({ type: 'shorts_row', id: `shorts_row_${shortsPairIndex}`, shorts: shortsPairs[shortsPairIndex] });
      shortsPairIndex++;
    }

    while (regularIndex < regularVideos.length) {
      for (let i = 0; i < 5 && regularIndex < regularVideos.length; i++) {
        feed.push({ type: 'regular', id: regularVideos[regularIndex]._id, video: regularVideos[regularIndex] });
        regularIndex++;
      }
      
      if (shortsPairIndex < shortsPairs.length) {
        feed.push({ type: 'shorts_row', id: `shorts_row_${shortsPairIndex}`, shorts: shortsPairs[shortsPairIndex] });
        shortsPairIndex++;
      }
    }

    while (shortsPairIndex < shortsPairs.length) {
      feed.push({ type: 'shorts_row', id: `shorts_row_${shortsPairIndex}`, shorts: shortsPairs[shortsPairIndex] });
      shortsPairIndex++;
    }

    return feed;
  }, [videos]);

  const renderItem = ({ item }: { item: any }) => {
    if (item.type === 'shorts_row') {
      return (
        <View style={styles.shortsRowContainer}>
          <Text style={[styles.shortsSectionTitle, { color: colors.text }]}>{t('home.shorts')}</Text>
          <View style={styles.shortsGrid}>
            {item.shorts.map((short: any) => (
              <TouchableOpacity 
                key={short._id} 
                style={styles.shortCard}
                onPress={() => navigation.navigate('ShortsTab', { initialVideoId: short._id })}
                activeOpacity={0.8}
              >
                <Image source={{ uri: short.thumbnailUrl }} style={[styles.shortThumbnail, { backgroundColor: colors.border }]} />
                <Text style={[styles.shortTitle, { color: colors.text }]} numberOfLines={2}>{short.title}</Text>
                <Text style={[styles.shortDetails, { color: colors.textSecondary }]}>{short.views} {t('common.views')}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }

    const video = item.video;
    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => navigation.navigate('VideoPlayer', { video: video })}
        activeOpacity={0.8}
      >
        <Image source={{ uri: video.thumbnailUrl }} style={[styles.thumbnail, { backgroundColor: colors.border }]} />
        <View style={styles.infoContainer}>
          <Image source={{ uri: video.creator?.avatarUrl || 'https://via.placeholder.com/40' }} style={[styles.avatar, { backgroundColor: colors.border }]} />
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>{video.title}</Text>
            <Text style={[styles.details, { color: colors.textSecondary }]}>
              {video.creator?.username} • {video.views} {t('common.views')}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar />
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList 
          data={feedData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingBottom: 20 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { marginBottom: 20 },
  thumbnail: { width: '100%', aspectRatio: 16 / 9 },
  infoContainer: { flexDirection: 'row', padding: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  textContainer: { flex: 1 },
  title: { fontSize: 16, fontWeight: '500', marginBottom: 4 },
  details: { fontSize: 14 },
  shortsRowContainer: { marginVertical: 12, paddingHorizontal: 12 },
  shortsSectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, marginLeft: 4 },
  shortsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  shortCard: { width: (Dimensions.get('window').width - 36) / 2, marginBottom: 8 },
  shortThumbnail: { width: '100%', aspectRatio: 9 / 16, borderRadius: 12 },
  shortTitle: { fontSize: 14, fontWeight: '500', marginTop: 8, lineHeight: 20 },
  shortDetails: { fontSize: 12, marginTop: 4 }
});
