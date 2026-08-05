import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Compass, User, Search, Tv } from 'lucide-react-native';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

import SplashAnimatedScreen from '../screens/SplashAnimatedScreen';
import HomeScreen from '../screens/HomeScreen';
import VideoPlayerScreen from '../screens/VideoPlayerScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import { useAuth } from '../context/AuthContext';

import ShortsScreen from '../screens/ShortsScreen';
import ExploreScreen from '../screens/ExploreScreen';
import SubscriptionsScreen from '../screens/SubscriptionsScreen';

import ProfileScreen from '../screens/ProfileScreen';
import ChannelScreen from '../screens/ChannelScreen';
import PlaylistsScreen from '../screens/PlaylistsScreen';
import VideoListScreen from '../screens/VideoListScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f0f0f',
          borderTopColor: '#222',
        },
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#888',
      }}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen} 
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="ShortsTab" 
        component={ShortsScreen} 
        options={{
          tabBarLabel: 'Shorts',
          tabBarIcon: ({ color, size }) => <Compass color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="SubscriptionsTab" 
        component={SubscriptionsScreen} 
        options={{
          tabBarLabel: 'Subscriptions',
          tabBarIcon: ({ color, size }) => <Tv color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen} 
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f0f0f', justifyContent: 'center', alignItems: 'center' }}>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0f0f0f' }}>
      <NavigationContainer theme={DarkTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0f0f0f' } }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Splash" component={SplashAnimatedScreen} />
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} />
            <Stack.Screen name="Channel" component={ChannelScreen} />
            <Stack.Screen name="VideoList" component={VideoListScreen} />
            <Stack.Screen name="Playlists" component={PlaylistsScreen} />
            <Stack.Screen name="Explore" component={ExploreScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
    </View>
  );
}
