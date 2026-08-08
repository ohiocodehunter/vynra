import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, RefreshCw } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';

export default function StudioScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // You can set this in .env (e.g. EXPO_PUBLIC_FRONTEND_URL=https://your-frontend.com)
  const frontendUrl = process.env.EXPO_PUBLIC_FRONTEND_URL || 'https://vynra.ohiocodehunter.com'; 
  const studioUrl = `${frontendUrl}/studio`;

  useEffect(() => {
    const fetchToken = async () => {
      const storedToken = await AsyncStorage.getItem('token');
      setToken(storedToken);
      setIsLoading(false);
    };
    fetchToken();
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
      </SafeAreaView>
    );
  }

  const themeString = isDark ? 'dark' : 'light';

  // Inject token and user to webview localStorage so the user is authenticated in Studio
  // Also enforce mobile viewport metadata and set theme
  const injectedJavaScript = `
    try {
      window.localStorage.setItem('token', '${token || ''}');
      window.localStorage.setItem('user', JSON.stringify(${JSON.stringify(user || {})}));
      
      // Set Theme
      document.documentElement.setAttribute('data-theme', '${themeString}');
      
      // Force mobile viewport meta tag just in case frontend misses it
      var meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1, maximum-scale=1.0, user-scalable=no';
      document.getElementsByTagName('head')[0].appendChild(meta);
    } catch (e) {}
    true;
  `;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Vynra Studio</Text>
      </View>
      <WebView
        source={{ uri: studioUrl }}
        style={{ flex: 1, backgroundColor: colors.background }}
        injectedJavaScriptBeforeContentLoaded={injectedJavaScript}
        // When theme changes dynamically, reload the webview or inject JS to update theme
        // We inject it again if it changes while mounted
        injectedJavaScript={`document.documentElement.setAttribute('data-theme', '${themeString}'); true;`}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error: ', nativeEvent);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
