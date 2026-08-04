import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (userData: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedUser = await AsyncStorage.getItem('user');
        const token = await AsyncStorage.getItem('token');
        
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }

        if (token) {
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const res = await apiClient.get('/auth/me');
          if (res.data) {
            setUser(res.data);
            await AsyncStorage.setItem('user', JSON.stringify(res.data));
          }
        }
      } catch (error) {
        console.error('Failed to load user auth state:', error);
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        delete apiClient.defaults.headers.common['Authorization'];
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUser();
  }, []);

  const login = async (userData: User, token: string) => {
    setUser(userData);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    await AsyncStorage.setItem('token', token);
  };

  const logout = async () => {
    setUser(null);
    delete apiClient.defaults.headers.common['Authorization'];
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
