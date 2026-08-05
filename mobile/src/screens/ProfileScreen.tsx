import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { LogOut, ChevronRight, Video, Globe, Moon, Settings, History, Clock, ThumbsUp, ListVideo } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<any>();

  const handleMenuPress = (action: string) => {
    Alert.alert('Coming Soon', `${action} settings will be available soon!`);
  };

  const navigateToVideoList = (title: string, endpoint: string) => {
    navigation.navigate('VideoList', { title, endpoint });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {user && (
          <TouchableOpacity 
            style={styles.profileCard} 
            onPress={() => navigation.navigate('Channel', { username: user.username })}
          >
            <Image 
              source={{ uri: user.avatarUrl || 'https://via.placeholder.com/100' }} 
              style={styles.avatar} 
            />
            <View style={styles.profileInfo}>
              <Text style={styles.username}>{user.username}</Text>
              <Text style={styles.email}>{user.email}</Text>
              <Text style={styles.viewChannelText}>View channel</Text>
            </View>
            <ChevronRight color="#888" size={24} />
          </TouchableOpacity>
        )}

        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigateToVideoList('History', '/users/history')}>
            <History color="#fff" size={24} style={styles.menuIcon} />
            <Text style={styles.menuText}>History</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigateToVideoList('Watch Later', '/users/watch-later')}>
            <Clock color="#fff" size={24} style={styles.menuIcon} />
            <Text style={styles.menuText}>Watch Later</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigateToVideoList('Liked Videos', '/videos/liked')}>
            <ThumbsUp color="#fff" size={24} style={styles.menuIcon} />
            <Text style={styles.menuText}>Liked Videos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Playlists')}>
            <ListVideo color="#fff" size={24} style={styles.menuIcon} />
            <Text style={styles.menuText}>Playlists</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('Vynra Studio')}>
            <Video color="#fff" size={24} style={styles.menuIcon} />
            <Text style={styles.menuText}>Vynra Studio</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('Language')}>
            <Globe color="#fff" size={24} style={styles.menuIcon} />
            <Text style={styles.menuText}>Language</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('Theme')}>
            <Moon color="#fff" size={24} style={styles.menuIcon} />
            <Text style={styles.menuText}>Appearance (Dark)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('General Settings')}>
            <Settings color="#fff" size={24} style={styles.menuIcon} />
            <Text style={styles.menuText}>Settings</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={logout}>
            <LogOut color="#ff4444" size={24} style={styles.menuIcon} />
            <Text style={[styles.menuText, { color: '#ff4444' }]}>Log out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingVertical: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1a1a1a',
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    backgroundColor: '#333',
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  email: {
    color: '#888',
    fontSize: 14,
    marginBottom: 4,
  },
  viewChannelText: {
    color: '#3ea6ff',
    fontSize: 14,
    fontWeight: '500',
  },
  menuSection: {
    marginBottom: 24,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#222',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#0f0f0f',
  },
  menuIcon: {
    marginRight: 16,
  },
  menuText: {
    color: '#fff',
    fontSize: 16,
  },
  logoutItem: {
    borderTopWidth: 0,
  }
});
