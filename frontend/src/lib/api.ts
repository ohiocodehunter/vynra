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
  _id?: string;
  id?: string; // Sometimes returned as id from backend
  username: string;
  channelName?: string;
  email?: string;
  avatarUrl: string;
  bannerUrl?: string;
  bio?: string;
  subscribersCount?: number;
  createdAt?: string;
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
  dislikes: number;
  likedBy: string[];
  dislikedBy: string[];
  duration: number;
  createdAt: string;
}

export interface Comment {
  _id: string;
  text: string;
  author: User;
  video: string;
  likes: number;
  dislikes: number;
  createdAt: string;
}

export interface Playlist {
  _id: string;
  name: string;
  creator: string | User;
  videos: Video[];
  isPublic: boolean;
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
  },
  likeVideo: async (id: string): Promise<Video> => {
    const response = await api.post(`/videos/${id}/like`);
    return response.data;
  },
  dislikeVideo: async (id: string): Promise<Video> => {
    const response = await api.post(`/videos/${id}/dislike`);
    return response.data;
  }
};

export const commentService = {
  getComments: async (videoId: string): Promise<Comment[]> => {
    const response = await api.get(`/comments/${videoId}`);
    return response.data;
  },
  postComment: async (videoId: string, text: string): Promise<Comment> => {
    const response = await api.post(`/comments/${videoId}`, { text });
    return response.data;
  }
};

export const playlistService = {
  getUserPlaylists: async (username: string): Promise<Playlist[]> => {
    const response = await api.get(`/playlists/user/${username}`);
    return response.data;
  },
  createPlaylist: async (name: string, isPublic: boolean = true): Promise<Playlist> => {
    const response = await api.post('/playlists', { name, isPublic });
    return response.data;
  },
  addVideoToPlaylist: async (playlistId: string, videoId: string): Promise<Playlist> => {
    const response = await api.post(`/playlists/${playlistId}/add`, { videoId });
    return response.data;
  },
  removeVideoFromPlaylist: async (playlistId: string, videoId: string): Promise<Playlist> => {
    const response = await api.post(`/playlists/${playlistId}/remove`, { videoId });
    return response.data;
  }
};

export const studioService = {
  getStats: async (): Promise<any> => {
    const response = await api.get('/studio/stats');
    return response.data;
  }
};

export default api;
