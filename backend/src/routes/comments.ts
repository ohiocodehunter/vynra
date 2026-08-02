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
    const { text } = req.body;
    
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
    
    const comment = new Comment({
      text: text.trim(),
      author: req.user.id,
      video: req.params.videoId
    });
    
    await comment.save();
    
    // Populate author info before returning
    await comment.populate('author', 'username channelName avatarUrl');
    
    res.status(201).json(comment);
  } catch (error) {
    console.error('Error posting comment:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
