export interface User {
  _id: string;
  username: string;
  email: string;
  channelName?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  description?: string;
  subscribers?: number;
  isVerified?: boolean;
  role?: 'user' | 'admin' | 'moderator';
  accountStatus?: 'active' | 'suspended' | 'banned';
}

export interface Video {
  _id: string;
  title: string;
  description?: string;
  url: string;
  thumbnailUrl: string;
  creator: {
    _id?: string;
    id?: string;
    username: string;
    channelName?: string;
    avatarUrl?: string;
  };
  views: number;
  likes: number;
  dislikes?: number;
  comments?: any[];
  duration: number;
  tags?: string[];
  createdAt: string;
}
