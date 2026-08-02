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

export default router;
