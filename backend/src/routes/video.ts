import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import Video from '../models/Video';
import { authMiddleware, AuthRequest } from '../middlewares/authMiddleware';
import { compressVideo, generateThumbnail, getVideoDuration } from '../services/ffmpeg';
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

// Upload a new video
router.post('/upload', authMiddleware, upload.single('video'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }
    
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { title, description, tags } = req.body;
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
        // 1. Get Duration
        const duration = await getVideoDuration(inputPath);
        video.duration = duration;

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

// Get all videos (Home feed, Explore, Search)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { q, tag, sort } = req.query;
    let query: any = { status: 'published' };
    
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

    const videos = await Video.find(query)
      .populate('creator', 'username channelName avatarUrl')
      .sort(sortOption)
      .limit(50);
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching videos' });
  }
});

// Get liked videos
router.get('/liked', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const videos = await Video.find({ likedBy: userId, status: 'published' })
      .populate('creator', 'username channelName avatarUrl')
      .sort({ createdAt: -1 });
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching liked videos' });
  }
});

// Get a single video by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const video = await Video.findById(req.params.id).populate('creator', 'username channelName avatarUrl subscribersCount');
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    const isPolling = req.query.polling === 'true';
    if (!isPolling && video.status === 'published') {
      // Increment views (naive implementation, should use debouncing/redis in prod)
      video.views += 1;
      await video.save();
    }
    
    res.json(video);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching video' });
  }
});
// Toggle Like a video
router.post('/:id/like', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: 'Video not found' });

    const userId = req.user.id;
    const hasLiked = video.likedBy.some(id => id.toString() === userId);
    const hasDisliked = video.dislikedBy.some(id => id.toString() === userId);

    if (hasLiked) {
      // Remove like
      video.likedBy = video.likedBy.filter(id => id.toString() !== userId);
      video.likes = Math.max(0, video.likes - 1);
    } else {
      // Add like
      video.likedBy.push(userId as any);
      video.likes += 1;
      
      // Remove dislike if exists
      if (hasDisliked) {
        video.dislikedBy = video.dislikedBy.filter(id => id.toString() !== userId);
        video.dislikes = Math.max(0, video.dislikes - 1);
      }
    }

    await video.save();
    res.json(video);
  } catch (error) {
    res.status(500).json({ error: 'Server error liking video' });
  }
});

// Toggle Dislike a video
router.post('/:id/dislike', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: 'Video not found' });

    const userId = req.user.id;
    const hasLiked = video.likedBy.some(id => id.toString() === userId);
    const hasDisliked = video.dislikedBy.some(id => id.toString() === userId);

    if (hasDisliked) {
      // Remove dislike
      video.dislikedBy = video.dislikedBy.filter(id => id.toString() !== userId);
      video.dislikes = Math.max(0, video.dislikes - 1);
    } else {
      // Add dislike
      video.dislikedBy.push(userId as any);
      video.dislikes += 1;
      
      // Remove like if exists
      if (hasLiked) {
        video.likedBy = video.likedBy.filter(id => id.toString() !== userId);
        video.likes = Math.max(0, video.likes - 1);
      }
    }

    await video.save();
    res.json(video);
  } catch (error) {
    res.status(500).json({ error: 'Server error disliking video' });
  }
});

export default router;
