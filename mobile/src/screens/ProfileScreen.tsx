import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { LogOut, ChevronRight, Video, Globe, Moon, Settings, History, Clock, ThumbsUp, ListVideo, X, Sun, Monitor } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme, ThemeType } from '../context/ThemeContext';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिंदी (Hindi)' },
  { code: 'ja', name: '日本語 (Japanese)' },
  { code: 'ko', name: '한국어 (Korean)' },
  { code: 'zh', name: '中文 (Chinese)' },
  { code: 'fr', name: 'Français (French)' },
  { code: 'de', name: 'Deutsch (German)' }
];

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<any>();
  const { t, i18n } = useTranslation();
  const { themePref, setThemePref, colors, isDark } = useTheme();
  
  const [isLangModalVisible, setLangModalVisible] = useState(false);
  const [isThemeModalVisible, setThemeModalVisible] = useState(false);

  const handleMenuPress = (action: string) => {
    Alert.alert(t('profile.comingSoon'), t('profile.comingSoonDesc', { action }));
  };

  const navigateToVideoList = (title: string, endpoint: string) => {
    navigation.navigate('VideoList', { title, endpoint });
  };

  const handleLanguageSelect = (code: string) => {
    i18n.changeLanguage(code);
    setLangModalVisible(false);
  };

  const handleThemeSelect = (pref: ThemeType) => {
    setThemePref(pref);
    setThemeModalVisible(false);
  };

  // Dynamic styles based on theme
  const getThemeText = () => {
    if (themePref === 'system') return t('profile.appearance') + ' (System)';
    if (themePref === 'light') return t('profile.appearance') + ' (Light)';
    return t('profile.appearance') + ' (Dark)';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('profile.account')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {user && (
          <TouchableOpacity 
            style={[styles.profileCard, { backgroundColor: colors.surface }]} 
            onPress={() => navigation.navigate('Channel', { username: user.username })}
          >
            <Image 
              source={{ uri: user.avatarUrl || 'https://via.placeholder.com/100' }} 
              style={[styles.avatar, { backgroundColor: colors.border }]} 
            />
            <View style={styles.profileInfo}>
              <Text style={[styles.username, { color: colors.text }]}>{user.username}</Text>
              <Text style={[styles.email, { color: colors.textSecondary }]}>{user.email}</Text>
              <Text style={[styles.viewChannelText, { color: colors.primary }]}>{t('profile.viewChannel')}</Text>
            </View>
            <ChevronRight color={colors.textSecondary} size={24} />
          </TouchableOpacity>
        )}

        <View style={[styles.menuSection, { borderColor: colors.border }]}>
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.background }]} onPress={() => navigateToVideoList('History', '/users/history')}>
            <History color={colors.text} size={24} style={styles.menuIcon} />
            <Text style={[styles.menuText, { color: colors.text }]}>{t('profile.history')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.background }]} onPress={() => navigateToVideoList('Watch Later', '/users/watch-later')}>
            <Clock color={colors.text} size={24} style={styles.menuIcon} />
            <Text style={[styles.menuText, { color: colors.text }]}>{t('profile.watchLater')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.background }]} onPress={() => navigateToVideoList('Liked Videos', '/videos/liked')}>
            <ThumbsUp color={colors.text} size={24} style={styles.menuIcon} />
            <Text style={[styles.menuText, { color: colors.text }]}>{t('profile.likedVideos')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.background }]} onPress={() => navigation.navigate('Playlists')}>
            <ListVideo color={colors.text} size={24} style={styles.menuIcon} />
            <Text style={[styles.menuText, { color: colors.text }]}>{t('profile.playlists')}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.menuSection, { borderColor: colors.border }]}>
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.background }]} onPress={() => navigation.navigate('Studio')}>
            <Video color={colors.text} size={24} style={styles.menuIcon} />
            <Text style={[styles.menuText, { color: colors.text }]}>{t('profile.vynraStudio')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.background }]} onPress={() => setLangModalVisible(true)}>
            <Globe color={colors.text} size={24} style={styles.menuIcon} />
            <Text style={[styles.menuText, { color: colors.text }]}>{t('profile.language')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.background }]} onPress={() => setThemeModalVisible(true)}>
            {themePref === 'light' ? (
              <Sun color={colors.text} size={24} style={styles.menuIcon} />
            ) : themePref === 'dark' ? (
              <Moon color={colors.text} size={24} style={styles.menuIcon} />
            ) : (
              <Monitor color={colors.text} size={24} style={styles.menuIcon} />
            )}
            <Text style={[styles.menuText, { color: colors.text }]}>{getThemeText()}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.background }]} onPress={() => handleMenuPress(t('profile.settings'))}>
            <Settings color={colors.text} size={24} style={styles.menuIcon} />
            <Text style={[styles.menuText, { color: colors.text }]}>{t('profile.settings')}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.menuSection, { borderColor: colors.border }]}>
          <TouchableOpacity style={[styles.menuItem, styles.logoutItem, { backgroundColor: colors.background }]} onPress={logout}>
            <LogOut color={colors.danger} size={24} style={styles.menuIcon} />
            <Text style={[styles.menuText, { color: colors.danger }]}>{t('profile.logout')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Language Modal */}
      <Modal visible={isLangModalVisible} transparent={true} animationType="slide" onRequestClose={() => setLangModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Language</Text>
              <TouchableOpacity onPress={() => setLangModalVisible(false)}>
                <X color={colors.text} size={24} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.langOption, { borderBottomColor: colors.border }, i18n.language === lang.code && { backgroundColor: `${colors.primary}20` }]}
                  onPress={() => handleLanguageSelect(lang.code)}
                >
                  <Text style={[styles.langText, { color: colors.textSecondary }, i18n.language === lang.code && { color: colors.primary, fontWeight: 'bold' }]}>
                    {lang.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Theme Modal */}
      <Modal visible={isThemeModalVisible} transparent={true} animationType="slide" onRequestClose={() => setThemeModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Theme</Text>
              <TouchableOpacity onPress={() => setThemeModalVisible(false)}>
                <X color={colors.text} size={24} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <TouchableOpacity style={[styles.langOption, { borderBottomColor: colors.border }, themePref === 'system' && { backgroundColor: `${colors.primary}20` }]} onPress={() => handleThemeSelect('system')}>
                <Text style={[styles.langText, { color: colors.textSecondary }, themePref === 'system' && { color: colors.primary, fontWeight: 'bold' }]}>System Default</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.langOption, { borderBottomColor: colors.border }, themePref === 'light' && { backgroundColor: `${colors.primary}20` }]} onPress={() => handleThemeSelect('light')}>
                <Text style={[styles.langText, { color: colors.textSecondary }, themePref === 'light' && { color: colors.primary, fontWeight: 'bold' }]}>Light</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.langOption, { borderBottomColor: colors.border }, themePref === 'dark' && { backgroundColor: `${colors.primary}20` }]} onPress={() => handleThemeSelect('dark')}>
                <Text style={[styles.langText, { color: colors.textSecondary }, themePref === 'dark' && { color: colors.primary, fontWeight: 'bold' }]}>Dark</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  scrollContent: { paddingVertical: 16 },
  profileCard: { flexDirection: 'row', alignItems: 'center', padding: 16, marginHorizontal: 16, borderRadius: 12, marginBottom: 24 },
  avatar: { width: 60, height: 60, borderRadius: 30, marginRight: 16 },
  profileInfo: { flex: 1 },
  username: { fontSize: 18, fontWeight: 'bold', marginBottom: 2 },
  email: { fontSize: 14, marginBottom: 4 },
  viewChannelText: { fontSize: 14, fontWeight: '500' },
  menuSection: { marginBottom: 24, borderTopWidth: 1, borderBottomWidth: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  menuIcon: { marginRight: 16 },
  menuText: { fontSize: 16 },
  logoutItem: { borderTopWidth: 0 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  langOption: { paddingVertical: 16, borderBottomWidth: 1 },
  langText: { fontSize: 16 }
});
