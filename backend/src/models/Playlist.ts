import mongoose, { Document, Schema } from 'mongoose';

export interface IPlaylist extends Document {
  name: string;
  creator: mongoose.Types.ObjectId;
  videos: mongoose.Types.ObjectId[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PlaylistSchema: Schema = new Schema({
  name: { type: String, required: true, trim: true },
  creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  videos: [{ type: Schema.Types.ObjectId, ref: 'Video' }],
  isPublic: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model<IPlaylist>('Playlist', PlaylistSchema);
