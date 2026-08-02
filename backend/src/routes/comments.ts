import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middlewares/authMiddleware';
import Comment from '../models/Comment';
import Video from '../models/Video';

const router = Router();

// Get comments for a video
router.get('/:videoId', async (req: Request, res: Response) => {
  try {
    const comments = await Comment.find({ video: req.params.videoId })
      .populate('author', 'username channelName avatarUrl')
      .sort({ createdAt: -1 });
    
    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Post a comment
router.post('/:videoId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { text, parentCommentId } = req.body;
    
    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Comment text is required' });
    }
    
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Check if video exists
    const video = await Video.findById(req.params.videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    const commentData: any = {
      text: text.trim(),
      author: req.user.id,
      video: req.params.videoId
    };

    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (parentComment) {
        commentData.parentComment = parentCommentId;
      }
    }
    
    const comment = new Comment(commentData);
    await comment.save();
    
    // Create Notification if it's a reply to someone else
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      // Don't notify if user replies to their own comment
      if (parentComment && parentComment.author.toString() !== req.user.id) {
        // We import Notification inside here to avoid circular dependency if any, or just import at top. Let's assume it's imported at top.
        const Notification = require('../models/Notification').default;
        await Notification.create({
          recipient: parentComment.author,
          sender: req.user.id,
          type: 'COMMENT_REPLY',
          video: req.params.videoId,
          comment: comment._id
        });
      }
    }
    
    // Populate author info before returning
    await comment.populate('author', 'username channelName avatarUrl');
    
    res.status(201).json(comment);
  } catch (error) {
    console.error('Error posting comment:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
