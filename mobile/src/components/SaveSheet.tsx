import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Modal, Animated, Dimensions,
  TouchableOpacity, FlatList, TextInput, ActivityIndicator, Alert
} from 'react-native';
import { X, Clock, ListPlus, Plus, Check } from 'lucide-react-native';
import client from '../api/client';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.6;

interface SaveSheetProps {
  isVisible: boolean;
  onClose: () => void;
  videoId: string;
}

export default function SaveSheet({ isVisible, onClose, videoId }: SaveSheetProps) {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [creatingNew, setCreatingNew] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [saving, setSaving] = useState(false);

  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchPlaylists = async () => {
    try {
      setLoading(true);
      const res = await client.get('/playlists');
      setPlaylists(res.data);
      // Check which playlists already contain this video
      const ids = res.data
        .filter((p: any) => p.videos?.some((v: any) => (v._id || v) === videoId))
        .map((p: any) => p._id);
      setSavedIds(ids);
    } catch (error) {
      console.error('Error fetching playlists', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isVisible) {
      fetchPlaylists();
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: SHEET_HEIGHT, duration: 250, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
      setTimeout(() => {
        setCreatingNew(false);
        setNewPlaylistName('');
      }, 300);
    }
  }, [isVisible]);

  const handleSaveToWatchLater = async () => {
    try {
      setSaving(true);
      await client.post(`/users/watch-later/${videoId}`);
      Alert.alert('Saved', 'Added to Watch Later');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Could not save to Watch Later');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePlaylist = async (playlist: any) => {
    const alreadySaved = savedIds.includes(playlist._id);
    try {
      if (alreadySaved) {
        await client.post(`/playlists/${playlist._id}/remove`, { videoId });
        setSavedIds(prev => prev.filter(id => id !== playlist._id));
      } else {
        await client.post(`/playlists/${playlist._id}/add`, { videoId });
        setSavedIds(prev => [...prev, playlist._id]);
      }
    } catch (error) {
      console.error('Error toggling playlist', error);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    try {
      setSaving(true);
      // Create the playlist first
      const res = await client.post('/playlists', { name: newPlaylistName.trim() });
      const newPlaylist = res.data;
      // Then add the video to it
      await client.post(`/playlists/${newPlaylist._id}/add`, { videoId });
      setPlaylists(prev => [newPlaylist, ...prev]);
      setSavedIds(prev => [...prev, newPlaylist._id]);
      setCreatingNew(false);
      setNewPlaylistName('');
    } catch (error) {
      Alert.alert('Error', 'Could not create playlist');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={isVisible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity style={styles.backdropTouch} onPress={onClose} activeOpacity={1} />
        </Animated.View>

        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Save to...</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color="#fff" size={22} />
            </TouchableOpacity>
          </View>

          {/* Watch Later */}
          <TouchableOpacity style={styles.option} onPress={handleSaveToWatchLater} disabled={saving}>
            <View style={styles.optionIcon}>
              <Clock color="#fff" size={20} />
            </View>
            <Text style={styles.optionText}>Watch Later</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Create new playlist */}
          {creatingNew ? (
            <View style={styles.createRow}>
              <TextInput
                style={styles.input}
                placeholder="Playlist name..."
                placeholderTextColor="#888"
                value={newPlaylistName}
                onChangeText={setNewPlaylistName}
                autoFocus
              />
              <TouchableOpacity style={styles.createBtn} onPress={handleCreatePlaylist} disabled={saving || !newPlaylistName.trim()}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.createBtnText}>Create</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.option} onPress={() => setCreatingNew(true)}>
              <View style={styles.optionIcon}>
                <ListPlus color="#3ea6ff" size={20} />
              </View>
              <Text style={[styles.optionText, { color: '#3ea6ff' }]}>New playlist</Text>
            </TouchableOpacity>
          )}

          {/* Existing playlists */}
          {loading ? (
            <ActivityIndicator style={styles.loader} color="#fff" />
          ) : (
            <FlatList
              data={playlists}
              keyExtractor={(item) => item._id}
              style={styles.list}
              renderItem={({ item }) => {
                const saved = savedIds.includes(item._id);
                return (
                  <TouchableOpacity style={styles.playlistRow} onPress={() => handleTogglePlaylist(item)}>
                    <View style={[styles.checkbox, saved && styles.checkboxChecked]}>
                      {saved && <Check color="#fff" size={14} />}
                    </View>
                    <Text style={styles.playlistName}>{item.name}</Text>
                    <Text style={styles.playlistCount}>{item.videos?.length || 0} videos</Text>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={<Text style={styles.emptyText}>No playlists yet</Text>}
            />
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  backdropTouch: { flex: 1 },
  sheet: {
    backgroundColor: '#1a1a1a',
    height: SHEET_HEIGHT,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#2a2a2a',
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  closeBtn: { padding: 4 },
  option: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  optionIcon: {
    width: 40, height: 40, borderRadius: 8, backgroundColor: '#2a2a2a',
    alignItems: 'center', justifyContent: 'center',
  },
  optionText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#2a2a2a', marginHorizontal: 16 },
  loader: { padding: 24 },
  list: { flex: 1 },
  playlistRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
    paddingHorizontal: 16, gap: 14,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: '#555',
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: '#3ea6ff', borderColor: '#3ea6ff' },
  playlistName: { color: '#fff', fontSize: 15, flex: 1 },
  playlistCount: { color: '#888', fontSize: 13 },
  emptyText: { color: '#888', textAlign: 'center', padding: 24 },
  createRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 12, gap: 10,
  },
  input: {
    flex: 1, backgroundColor: '#2a2a2a', color: '#fff', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 15,
  },
  createBtn: {
    backgroundColor: '#3ea6ff', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  createBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});
