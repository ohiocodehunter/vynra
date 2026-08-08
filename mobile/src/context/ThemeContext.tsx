import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeType = 'light' | 'dark' | 'system';

interface Colors {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  danger: string;
}

interface ThemeContextType {
  themePref: ThemeType;
  isDark: boolean;
  colors: Colors;
  setThemePref: (theme: ThemeType) => void;
}

export const lightColors: Colors = {
  background: '#f2f2f2',
  surface: '#ffffff',
  text: '#000000',
  textSecondary: '#666666',
  border: '#e5e5e5',
  primary: '#3ea6ff',
  danger: '#ff4444',
};

export const darkColors: Colors = {
  background: '#0f0f0f',
  surface: '#1a1a1a',
  text: '#ffffff',
  textSecondary: '#888888',
  border: '#222222',
  primary: '#3ea6ff',
  danger: '#ff4444',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themePref, setThemePrefState] = useState<ThemeType>('system');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await AsyncStorage.getItem('app_theme');
      if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
        setThemePrefState(savedTheme);
      }
      setIsReady(true);
    };
    loadTheme();
  }, []);

  const setThemePref = async (newTheme: ThemeType) => {
    setThemePrefState(newTheme);
    await AsyncStorage.setItem('app_theme', newTheme);
  };

  const isDark = themePref === 'system' ? systemColorScheme === 'dark' : themePref === 'dark';
  const colors = isDark ? darkColors : lightColors;

  if (!isReady) return null;

  return (
    <ThemeContext.Provider value={{ themePref, isDark, colors, setThemePref }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
