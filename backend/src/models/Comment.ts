import mongoose, { Document, Schema } from 'mongoose';

export interface IComment extends Document {
  text: string;
  author: mongoose.Types.ObjectId;
  video: mongoose.Types.ObjectId;
  parentComment?: mongoose.Types.ObjectId;
  likes: number;
  dislikes: number;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema: Schema = new Schema({
  text: { type: String, required: true, trim: true },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  video: { type: Schema.Types.ObjectId, ref: 'Video', required: true },
  parentComment: { type: Schema.Types.ObjectId, ref: 'Comment' },
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model<IComment>('Comment', CommentSchema);
