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
  duration: number; // in seconds
  status: 'processing' | 'published' | 'private';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const VideoSchema: Schema = new Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  url: { type: String, required: true },
  thumbnailUrl: { type: String, required: true },
  creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
  duration: { type: Number, default: 0 },
  status: { type: String, enum: ['processing', 'published', 'private'], default: 'processing' },
  tags: [{ type: String }]
}, { timestamps: true });

export default mongoose.model<IVideo>('Video', VideoSchema);
