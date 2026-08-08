import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme as NavDarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Compass, User, Tv } from 'lucide-react-native';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

import HomeScreen from '../screens/HomeScreen';
import ShortsScreen from '../screens/ShortsScreen';
import ExploreScreen from '../screens/ExploreScreen';
import SubscriptionsScreen from '../screens/SubscriptionsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import StudioScreen from '../screens/StudioScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import SplashAnimatedScreen from '../screens/SplashAnimatedScreen';
import VideoPlayerScreen from '../screens/VideoPlayerScreen';
import ChannelScreen from '../screens/ChannelScreen';
import VideoListScreen from '../screens/VideoListScreen';
import PlaylistsScreen from '../screens/PlaylistsScreen';
import PlaylistPlayerScreen from '../screens/PlaylistPlayerScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'HomeTab') return <Home color={color} size={size} />;
          if (route.name === 'ShortsTab') return <Compass color={color} size={size} />;
          if (route.name === 'SubscriptionsTab') return <Tv color={color} size={size} />;
          if (route.name === 'ProfileTab') return <User color={color} size={size} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ tabBarLabel: t('navigation.home', 'Home') }} />
      <Tab.Screen name="ShortsTab" component={ShortsScreen} options={{ tabBarLabel: t('navigation.shorts', 'Shorts') }} />
      <Tab.Screen name="SubscriptionsTab" component={SubscriptionsScreen} options={{ tabBarLabel: t('navigation.subscriptions', 'Subscriptions') }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ tabBarLabel: t('navigation.you', 'Profile') }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors, isDark } = useTheme();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
      </View>
    );
  }

  const MyTheme = {
    ...NavDarkTheme,
    dark: isDark,
    colors: {
      ...NavDarkTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.border,
      notification: colors.danger,
    },
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <NavigationContainer theme={MyTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
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
            <Stack.Screen name="PlaylistPlayer" component={PlaylistPlayerScreen} />
            <Stack.Screen name="Explore" component={ExploreScreen} />
            <Stack.Screen name="Studio" component={StudioScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
    </View>
  );
}
