import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  channelName: string;
  email: string;
  passwordHash: string;
  avatarUrl?: string;
  bannerUrl?: string;
  bio?: string;
  region?: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    website?: string;
  };
  subscribersCount: number;
  subscriptions: mongoose.Types.ObjectId[];
  history: { video: mongoose.Types.ObjectId; watchedAt: Date }[];
  watchLater: mongoose.Types.ObjectId[];
  role: 'user' | 'admin';
  isVerified: boolean;
  accountStatus: 'active' | 'suspended' | 'banned';
  adminPasscodeHash?: string;
  usernameLastChanged?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true, trim: true },
  channelName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  avatarUrl: { type: String, default: '' },
  bannerUrl: { type: String, default: '' },
  bio: { type: String, default: '' },
  region: { type: String, default: '' },
  socialLinks: {
    twitter: { type: String, default: '' },
    instagram: { type: String, default: '' },
    website: { type: String, default: '' }
  },
  subscribersCount: { type: Number, default: 0 },
  subscriptions: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  history: [{ 
    video: { type: Schema.Types.ObjectId, ref: 'Video' },
    watchedAt: { type: Date, default: Date.now }
  }],
  watchLater: [{ type: Schema.Types.ObjectId, ref: 'Video' }],
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isVerified: { type: Boolean, default: false },
  accountStatus: { type: String, enum: ['active', 'suspended', 'banned'], default: 'active' },
  adminPasscodeHash: { type: String },
  usernameLastChanged: { type: Date }
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
