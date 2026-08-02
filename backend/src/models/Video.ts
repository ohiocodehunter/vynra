import mongoose, { Document, Schema } from 'mongoose';

export interface IVideo extends Document {
  title: string;
  description: string;
  url: string; // Cloudflare R2 URL or local URL
  thumbnailUrl: string;
  creator: mongoose.Types.ObjectId;
  views: number;
  likes: number;
  dislikes: number;
  likedBy: mongoose.Types.ObjectId[];
  dislikedBy: mongoose.Types.ObjectId[];
  duration: number; // in seconds
  status: 'processing' | 'published' | 'private';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const VideoSchema: Schema = new Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  url: { type: String, default: '' },
  thumbnailUrl: { type: String, default: '' },
  creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
  likedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  dislikedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  duration: { type: Number, default: 0 },
  status: { type: String, enum: ['processing', 'published', 'private'], default: 'processing' },
  tags: [{ type: String }]
}, { timestamps: true });

export default mongoose.model<IVideo>('Video', VideoSchema);
