import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Search, Bell } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const SOCKET_URL = 'http://172.168.6.97:5001';

export default function TopBar() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const socket = io(SOCKET_URL, {
      query: { userId: user._id }
    });

    socket.on('connect', () => {
      console.log('TopBar connected to socket server');
    });

    socket.on('notification', (data) => {
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../assets/logo.png')} 
          style={styles.logo} 
          resizeMode="contain"
        />
        <Text style={styles.brandText}>Vynra</Text>
      </View>
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.iconButton}>
          <Bell color="#fff" size={24} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => navigation.navigate('Explore')}
        >
          <Search color="#fff" size={24} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0f0f0f',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 32,
    height: 32,
    marginRight: 8,
  },
  brandText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 16,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ff0000',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  }
});
