import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './en.json';
import hi from './hi.json';
import ja from './ja.json';
import ko from './ko.json';
import zh from './zh.json';
import fr from './fr.json';
import de from './de.json';

const LANGUAGE_KEY = 'app_language';

const languageDetector: any = {
  type: 'languageDetector',
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage) {
        return callback(savedLanguage);
      }
      return callback('en');
    } catch (error) {
      console.log('Error reading language', error);
      return callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lng);
    } catch (error) {
      console.log('Error saving language', error);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4', // Required for React Native
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      ja: { translation: ja },
      ko: { translation: ko },
      zh: { translation: zh },
      fr: { translation: fr },
      de: { translation: de }
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already safes from xss
    },
    react: {
      useSuspense: false,
    }
  });

export default i18n;
