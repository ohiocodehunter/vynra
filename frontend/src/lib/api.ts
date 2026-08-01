import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor for auth tokens
api.interceptors.request.use(
  (config) => {
    // In a real app, you'd get this from a state manager or cookie
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export interface User {
  _id: string;
  username: string;
  avatarUrl: string;
  subscribersCount?: number;
}

export interface Video {
  _id: string;
  title: string;
  description: string;
  url: string;
  thumbnailUrl: string;
  creator: User;
  views: number;
  likes: number;
  duration: number;
  createdAt: string;
}

export const videoService = {
  getAllVideos: async (params?: { q?: string; tag?: string; sort?: string }): Promise<Video[]> => {
    const response = await api.get('/videos', { params });
    return response.data;
  },
  getVideoById: async (id: string): Promise<Video> => {
    const response = await api.get(`/videos/${id}`);
    return response.data;
  }
};

export default api;
