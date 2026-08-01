import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  channelName: string;
  email: string;
  passwordHash: string;
  avatarUrl?: string;
  bannerUrl?: string;
  bio?: string;
  subscribersCount: number;
  role: 'user' | 'admin';
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
  subscribersCount: { type: Number, default: 0 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  usernameLastChanged: { type: Date }
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
