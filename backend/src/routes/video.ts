import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import Video from '../models/Video';
import User from '../models/User';
import { authMiddleware, optionalAuthMiddleware, activeUserMiddleware, AuthRequest } from '../middlewares/authMiddleware';
import { compressVideo, generateThumbnail, getVideoMetadata } from '../services/ffmpeg';
import { uploadFileToR2 } from '../services/r2';

const router = Router();

// Configure multer for local temporary storage before processing
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/temp');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({ storage });
const uploadSingle = upload.single('video');

// Upload a new video
router.post('/upload', [authMiddleware, activeUserMiddleware], (req: AuthRequest, res: Response, next: NextFunction) => {
  uploadSingle(req, res, (err) => {
    if (err) {
      if (err.message === 'Request aborted') {
        console.warn('Upload aborted by client');
        return res.status(400).json({ error: 'Upload aborted by client' });
      }
      return res.status(500).json({ error: 'Upload error', details: err.message });
    }
    next();
  });
}, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }
    
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { title, description, tags, visibility } = req.body;
    const inputPath = req.file.path;
    const fileId = uuidv4();
    const uploadDir = path.join(__dirname, '../../uploads');
    
    const compressedVideoPath = path.join(uploadDir, `processed_${fileId}.mp4`);
    const thumbnailFolder = path.join(uploadDir, 'thumbnails');
    const thumbnailFilename = `thumb_${fileId}.png`;
    const thumbnailPath = path.join(thumbnailFolder, thumbnailFilename);

    // Initial Database Entry (Processing State)
    const video = new Video({
      title: title || 'Untitled Video',
      description: description || '',
      url: '', // will update after upload
      thumbnailUrl: '', // will update after upload
      creator: req.user.id,
      status: 'processing',
      visibility: visibility || 'public',
      tags: tags ? JSON.parse(tags) : []
    });
    await video.save();

    // Send immediate response so client doesn't hang
    res.status(202).json({ 
      message: 'Video upload started. Processing...', 
      videoId: video._id 
    });

    // --- Background Processing ---
    (async () => {
      try {
        // 1. Get Duration and Metadata
        const metadata = await getVideoMetadata(inputPath);
        video.duration = metadata.duration;

        // Auto-tag as 'shorts' if vertical video (width < height) and under 60 seconds
        if (metadata.width > 0 && metadata.height > 0 && metadata.width < metadata.height) {
          if (!video.tags.includes('shorts')) {
            video.tags.push('shorts');
          }
        }

        // 2. Compress Video
        await compressVideo(inputPath, compressedVideoPath);

        // 3. Generate Thumbnail
        await generateThumbnail(compressedVideoPath, thumbnailFolder, thumbnailFilename);

        // 4. Upload to R2 (or serve locally if no R2 credentials)
        let finalVideoUrl = '';
        let finalThumbUrl = '';

        if (process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY) {
          const videoUrl = await uploadFileToR2(compressedVideoPath, `videos/${fileId}.mp4`, 'video/mp4');
          const thumbUrl = await uploadFileToR2(thumbnailPath, `thumbnails/${fileId}.png`, 'image/png');
          finalVideoUrl = videoUrl || '';
          finalThumbUrl = thumbUrl || '';
          
          // Clean up local processed files if uploaded successfully
          if (videoUrl && thumbUrl) {
            fs.unlinkSync(compressedVideoPath);
            fs.unlinkSync(thumbnailPath);
          }
        } else {
          // Serve locally if no R2
          finalVideoUrl = `${process.env.BACKEND_URL || 'http://localhost:5001'}/uploads/processed_${fileId}.mp4`;
          finalThumbUrl = `${process.env.BACKEND_URL || 'http://localhost:5001'}/uploads/thumbnails/${thumbnailFilename}`;
        }

        // Clean up original temp file
        if (fs.existsSync(inputPath)) {
          fs.unlinkSync(inputPath);
        }

        // 5. Update Database
        video.url = finalVideoUrl;
        video.thumbnailUrl = finalThumbUrl;
        video.status = 'published';
        await video.save();
        
        // 6. Notify Subscribers
        if (video.visibility === 'public') {
          const Notification = require('../models/Notification').default;
          // Find all users who have the creator in their subscriptions array
          const subscribers = await User.find({ subscriptions: video.creator }).select('_id');
          
          if (subscribers.length > 0) {
            const notifications = subscribers.map(sub => ({
              recipient: sub._id,
              sender: video.creator,
              type: 'NEW_VIDEO',
              video: video._id
            }));
            
            // Bulk insert notifications
            await Notification.insertMany(notifications);
          }
        }
        
      } catch (err) {
        console.error('Background processing failed:', err);
        video.status = 'private'; // or error state
        await video.save();
      }
    })();

  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Server error during upload', stack: error.stack });
  }
});

router.get('/', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { q, tag, sort } = req.query;
    let query: any = { status: 'published', visibility: 'public' };
    
    if (q) {
      query.title = { $regex: q as string, $options: 'i' };
    }
    
    if (tag) {
      query.tags = tag;
    }
    
    let sortOption: any = { createdAt: -1 };
    if (sort === 'popular') {
      sortOption = { views: -1 };
    }

    // Recommendation Engine Logic
    let allVideos = await Video.find(query)
      .populate('creator', 'username channelName avatarUrl isVerified')
      .sort(sortOption)
      .limit(100);

    // If user is authenticated, analyze history and re-rank
    if (req.user && !q && !tag && sort !== 'popular') {
      const user = await User.findById(req.user.id).populate('history.video');
      
      if (user && user.history && user.history.length > 0) {
        // Collect tags from watch history
        const tagCounts: { [key: string]: number } = {};
        user.history.forEach((h: any) => {
          if (h.video && h.video.tags) {
            h.video.tags.forEach((t: string) => {
              tagCounts[t] = (tagCounts[t] || 0) + 1;
            });
          }
        });

        // Get top 3 tags
        const topTags = Object.entries(tagCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(t => t[0]);

        if (topTags.length > 0) {
          // Split videos into recommended and others
          const recommendedVideos = allVideos.filter(v => 
            v.tags && v.tags.some(t => topTags.includes(t))
          );
          
          const otherVideos = allVideos.filter(v => 
            !v.tags || !v.tags.some(t => topTags.includes(t))
          );

          // Randomize both groups slightly to keep feed fresh
          const shuffle = (arr: any[]) => arr.sort(() => Math.random() - 0.5);
          
          allVideos = [...shuffle(recommendedVideos), ...shuffle(otherVideos)];
        }
      }
    } else if (!q && !tag && sort !== 'popular') {
       // Just randomize for guests on home page
       allVideos = allVideos.sort(() => Math.random() - 0.5);
    }

    // Set a short-lived cache so repeated page loads are instant
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.json(allVideos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: 'Server error fetching videos', details: error.message });
  }
});

// Get liked videos
router.get('/liked', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const videos = await Video.find({ likedBy: userId, status: 'published', visibility: 'public' })
      .populate('creator', 'username channelName avatarUrl isVerified')
      .sort({ createdAt: -1 });
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching liked videos' });
  }
});

// Get videos from subscribed channels
router.get('/subscriptions', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const videos = await Video.find({
      creator: { $in: user.subscriptions },
      status: 'published',
      visibility: 'public'
    })
      .populate('creator', 'username channelName avatarUrl isVerified')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(videos);
  } catch (error) {
    console.error('Error fetching subscription videos:', error);
    res.status(500).json({ error: 'Server error fetching subscription videos' });
  }
});

// Get a single video by ID
router.get('/:id', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const video = await Video.findById(req.params.id).populate('creator', 'username channelName avatarUrl isVerified subscribersCount');
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Don't increment views if creator is watching their own video
    const isPolling = req.query.polling === 'true';
    if (!isPolling && video.status === 'published' && (!req.user || req.user.id !== video.creator._id.toString())) {
      // Increment views (naive implementation, should use debouncing/redis in prod)
      video.views += 1;
      
      const todayString = new Date().toISOString().split('T')[0];
      const historyEntry = video.viewsHistory?.find(h => h.date === todayString);
      
      if (historyEntry) {
        historyEntry.count += 1;
      } else {
        if (!video.viewsHistory) video.viewsHistory = [];
        video.viewsHistory.push({ date: todayString, count: 1 });
      }
      
      await video.save();
    }
    
    res.json(video);
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({ error: 'Server error fetching video' });
  }
});
// Toggle Like a video
router.post('/:id/like', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = req.user.id;

    // Try to remove like first (if it was already liked)
    let video = await Video.findOneAndUpdate(
      { _id: req.params.id, likedBy: userId },
      { $pull: { likedBy: userId }, $inc: { likes: -1 } },
      { new: true }
    );

    if (!video) {
      // It wasn't liked, so add like
      video = await Video.findOneAndUpdate(
        { _id: req.params.id, likedBy: { $ne: userId } },
        { $push: { likedBy: userId }, $inc: { likes: 1 } },
        { new: true }
      );
      
      if (video) {
        // Also check and remove from dislikedBy if present
        const updatedDislike = await Video.findOneAndUpdate(
          { _id: req.params.id, dislikedBy: userId },
          { $pull: { dislikedBy: userId }, $inc: { dislikes: -1 } },
          { new: true }
        );
        if (updatedDislike) video = updatedDislike;
      }
    }

    if (!video) return res.status(404).json({ error: 'Video not found' });

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('videoInteractionUpdated', { 
        videoId: video._id, 
        likes: video.likes, 
        dislikes: video.dislikes 
      });
    }

    res.json(video);
  } catch (error) {
    console.error('Like error:', error);
    res.status(500).json({ error: 'Server error liking video' });
  }
});

// Toggle Dislike a video
router.post('/:id/dislike', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = req.user.id;

    // Try to remove dislike first
    let video = await Video.findOneAndUpdate(
      { _id: req.params.id, dislikedBy: userId },
      { $pull: { dislikedBy: userId }, $inc: { dislikes: -1 } },
      { new: true }
    );

    if (!video) {
      // It wasn't disliked, so add dislike
      video = await Video.findOneAndUpdate(
        { _id: req.params.id, dislikedBy: { $ne: userId } },
        { $push: { dislikedBy: userId }, $inc: { dislikes: 1 } },
        { new: true }
      );
      
      if (video) {
        // Remove from likedBy if present
        const updatedLike = await Video.findOneAndUpdate(
          { _id: req.params.id, likedBy: userId },
          { $pull: { likedBy: userId }, $inc: { likes: -1 } },
          { new: true }
        );
        if (updatedLike) video = updatedLike;
      }
    }

    if (!video) return res.status(404).json({ error: 'Video not found' });

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('videoInteractionUpdated', { 
        videoId: video._id, 
        likes: video.likes, 
        dislikes: video.dislikes 
      });
    }

    res.json(video);
  } catch (error) {
    console.error('Dislike error:', error);
    res.status(500).json({ error: 'Server error disliking video' });
  }
});

// Update video details (owner only)
router.put('/:id', [authMiddleware, activeUserMiddleware], async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, visibility, category, tags } = req.body;
    
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    if (video.creator.toString() !== req.user?.id) {
      return res.status(403).json({ error: 'Not authorized to update this video' });
    }
    
    if (title) video.title = title;
    if (description !== undefined) video.description = description;
    if (visibility) video.visibility = visibility;
    if (category) video.category = category;
    if (tags) video.tags = tags;
    
    await video.save();
    
    res.json(video);
  } catch (error) {
    console.error('Error updating video:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete video (owner only)
router.delete('/:id', [authMiddleware, activeUserMiddleware], async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: 'Video not found' });

    // Check if the user is the creator
    if (video.creator.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this video' });
    }

    await video.deleteOne();
    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ error: 'Server error deleting video' });
  }
});

export default router;
