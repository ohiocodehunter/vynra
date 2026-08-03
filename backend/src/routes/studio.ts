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

    // Generate date-wise analytics for the past 30 days based on REAL view history
    const viewsHistoryMap = new Map<string, number>();
    const today = new Date();
    
    // Initialize the last 30 days with 0 views
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0]; // YYYY-MM-DD
      viewsHistoryMap.set(dateString, 0);
    }

    // Aggregate real views from videos
    videos.forEach(video => {
      if (video.viewsHistory && Array.isArray(video.viewsHistory)) {
        video.viewsHistory.forEach(record => {
          if (viewsHistoryMap.has(record.date)) {
            viewsHistoryMap.set(record.date, viewsHistoryMap.get(record.date)! + record.count);
          }
        });
      }
    });

    // Format for the frontend chart
    const viewsHistory = Array.from(viewsHistoryMap.entries()).map(([dateStr, count]) => {
      const d = new Date(dateStr);
      return {
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        views: count
      };
    });

    res.json({
      totalViews,
      totalLikes,
      totalWatchTimeHours,
      totalVideos: videos.length,
      topVideos,
      viewsHistory
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

// Submit feedback
router.post('/feedback', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { subject, message } = req.body;
    
    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required' });
    }

    const Feedback = require('../models/Feedback').default;
    const feedback = new Feedback({
      user: req.user.id,
      subject,
      message
    });

    await feedback.save();
    res.status(201).json(feedback);
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: 'Server error submitting feedback' });
  }
});

export default router;
