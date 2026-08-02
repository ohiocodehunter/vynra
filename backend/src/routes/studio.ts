import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middlewares/authMiddleware';
import Video from '../models/Video';

const router = Router();

// Get studio stats
router.get('/stats', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get all videos for the user
    const videos = await Video.find({ creator: req.user.id });

    // Calculate total views, likes, and watch time (approximation: views * duration / 2)
    let totalViews = 0;
    let totalLikes = 0;
    let totalWatchTimeSeconds = 0;

    videos.forEach(video => {
      totalViews += video.views || 0;
      totalLikes += video.likes || 0;
      totalWatchTimeSeconds += (video.views || 0) * (video.duration || 0);
    });

    const totalWatchTimeHours = (totalWatchTimeSeconds / 3600).toFixed(1);

    // Get top 5 videos by views
    const topVideos = await Video.find({ creator: req.user.id })
      .sort({ views: -1 })
      .limit(5)
      .select('title views thumbnailUrl');

    res.json({
      totalViews,
      totalLikes,
      totalWatchTimeHours,
      totalVideos: videos.length,
      topVideos
    });

  } catch (error) {
    console.error('Error fetching studio stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get creator's videos (for Content page)
router.get('/videos', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Fetch all videos, regardless of visibility or status
    const videos = await Video.find({ creator: req.user.id })
      .sort({ createdAt: -1 });
    
    res.json(videos);
  } catch (error) {
    console.error('Error fetching creator videos:', error);
    res.status(500).json({ error: 'Server error fetching videos' });
  }
});

// Get creator's comments (across all videos)
router.get('/comments', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // First find all videos by this creator
    const videos = await Video.find({ creator: req.user.id }).select('_id');
    const videoIds = videos.map(v => v._id);

    // Now find comments on these videos, populate author and video info
    const Comment = require('../models/Comment').default;
    const comments = await Comment.find({ video: { $in: videoIds } })
      .populate('author', 'username channelName avatarUrl')
      .populate('video', 'title thumbnailUrl')
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (error) {
    console.error('Error fetching creator comments:', error);
    res.status(500).json({ error: 'Server error fetching comments' });
  }
});

// Get creator's subscribers
router.get('/subscribers', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const User = require('../models/User').default;
    // Find users whose subscriptions array contains this creator's ID
    const subscribers = await User.find({ subscriptions: req.user.id })
      .select('username channelName avatarUrl subscribersCount createdAt')
      .sort({ createdAt: -1 });

    res.json(subscribers);
  } catch (error) {
    console.error('Error fetching creator subscribers:', error);
    res.status(500).json({ error: 'Server error fetching subscribers' });
  }
});

export default router;
