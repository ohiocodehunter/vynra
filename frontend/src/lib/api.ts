import axios from 'axios';

const api = axios.create({
  baseURL: typeof window !== 'undefined' ? '/api' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor for auth tokens
api.interceptors.request.use(
  (config) => {
    // In a real app, you'd get this from a state manager or cookie
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    // Only set the token if Authorization is not already explicitly set
    if (token && config.headers && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle global errors like 403 for Admin
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the request was to an admin endpoint and we got a 401 or 403
    if (
      typeof window !== 'undefined' &&
      error.response &&
      (error.response.status === 401 || error.response.status === 403) &&
      error.config?.url?.includes('/admin')
    ) {
      localStorage.removeItem('adminToken');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
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
  region?: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    website?: string;
  };
  subscribersCount?: number;
  subscriptions?: string[];
  role?: 'user' | 'admin';
  isVerified?: boolean;
  accountStatus?: 'active' | 'suspended' | 'banned';
  createdAt?: string;
}

export interface Video {
  _id: string;
  title: string;
  description: string;
  url: string;
  thumbnailUrl: string;
  creator: User;
  tags?: string[];
  views: number;
  likes: number;
  dislikes: number;
  likedBy: string[];
  dislikedBy: string[];
  duration: number;
  status?: string;
  visibility?: 'public' | 'private' | 'unlisted';
  createdAt: string;
}

export interface Comment {
  _id: string;
  text: string;
  author: User;
  video: string;
  parentComment?: string;
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
  postComment: async (videoId: string, text: string, parentCommentId?: string): Promise<Comment> => {
    const response = await api.post(`/comments/${videoId}`, { text, parentCommentId });
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
  },
  getCreatorVideos: async (): Promise<Video[]> => {
    const response = await api.get('/studio/videos');
    return response.data;
  },
  getStudioComments: async (): Promise<Comment[]> => {
    const response = await api.get('/studio/comments');
    return response.data;
  },
  getStudioSubscribers: async (): Promise<User[]> => {
    const response = await api.get('/studio/subscribers');
    return response.data;
  },
  sendFeedback: async (data: { subject: string; message: string }) => {
    const response = await api.post('/studio/feedback', data);
    return response.data;
  },
  updateVideo: async (id: string, data: Partial<Video>): Promise<Video> => {
    const response = await api.put(`/videos/${id}`, data);
    return response.data;
  },
  deleteVideo: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/videos/${id}`);
    return response.data;
  }
};

export const userService = {
  subscribeToChannel: async (id: string): Promise<{ success: boolean; subscribersCount: number }> => {
    const response = await api.post(`/users/subscribe/${id}`);
    return response.data;
  },
  unsubscribeFromChannel: async (id: string): Promise<{ success: boolean; subscribersCount: number }> => {
    const response = await api.post(`/users/unsubscribe/${id}`);
    return response.data;
  },
  searchChannels: async (q: string): Promise<User[]> => {
    const response = await api.get('/users/search', { params: { q } });
    return response.data;
  },
  getWatchLaterList: async (): Promise<Video[]> => {
    const response = await api.get('/users/watch-later');
    return response.data;
  },
  toggleWatchLater: async (videoId: string): Promise<{ watchLater: string[] }> => {
    const response = await api.post(`/users/watch-later/${videoId}`);
    return response.data;
  }
};

export interface Notification {
  _id: string;
  recipient: string;
  sender: User;
  type: 'NEW_VIDEO' | 'COMMENT_REPLY';
  video?: Video;
  comment?: Comment;
  isRead: boolean;
  createdAt: string;
}

export const notificationService = {
  getNotifications: async (): Promise<Notification[]> => {
    const response = await api.get('/notifications');
    return response.data;
  },
  markAsRead: async (id: string): Promise<Notification> => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },
  markAllAsRead: async (): Promise<{ success: boolean }> => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  }
};

export const adminService = {
  login: async (credentials: any) => {
    const res = await api.post('/admin/login', credentials);
    return res.data;
  },
  getStats: async () => {
    const adminToken = localStorage.getItem('adminToken');
    const res = await api.get('/admin/stats', { headers: { Authorization: `Bearer ${adminToken}` } });
    return res.data;
  },
  getUsers: async () => {
    const adminToken = localStorage.getItem('adminToken');
    const res = await api.get('/admin/users', { headers: { Authorization: `Bearer ${adminToken}` } });
    return res.data;
  },
  updateUser: async (id: string, data: any) => {
    const adminToken = localStorage.getItem('adminToken');
    const res = await api.patch(`/admin/users/${id}`, data, { headers: { Authorization: `Bearer ${adminToken}` } });
    return res.data;
  },
  deleteUser: async (id: string) => {
    const adminToken = localStorage.getItem('adminToken');
    const res = await api.delete(`/admin/users/${id}`, { headers: { Authorization: `Bearer ${adminToken}` } });
    return res.data;
  },
  getVideos: async () => {
    const adminToken = localStorage.getItem('adminToken');
    const res = await api.get('/admin/videos', { headers: { Authorization: `Bearer ${adminToken}` } });
    return res.data;
  },
  updateVideo: async (id: string, data: any) => {
    const adminToken = localStorage.getItem('adminToken');
    const res = await api.patch(`/admin/videos/${id}`, data, { headers: { Authorization: `Bearer ${adminToken}` } });
    return res.data;
  },
  deleteVideo: async (id: string) => {
    const adminToken = localStorage.getItem('adminToken');
    const res = await api.delete(`/admin/videos/${id}`, { headers: { Authorization: `Bearer ${adminToken}` } });
    return res.data;
  },
  getSystemStats: async () => {
    const adminToken = localStorage.getItem('adminToken');
    const res = await api.get('/admin/system-stats', { headers: { Authorization: `Bearer ${adminToken}` } });
    return res.data;
  }
};

export default api;
