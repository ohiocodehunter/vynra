import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import User from '../models/User';
import Video from '../models/Video';
import { authMiddleware, AuthRequest } from '../middlewares/authMiddleware';
import { uploadFileToR2 } from '../services/r2';

const router = Router();

// Setup local storage for profile image uploads before pushing to R2
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

// Get current user profile
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update current user profile
router.put('/me', authMiddleware, upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { username, channelName, bio } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const updateData: any = {};
    if (channelName !== undefined) updateData.channelName = channelName;
    if (bio !== undefined) updateData.bio = bio;

    if (username) {
      const user = await User.findById(userId);
      if (user && user.username !== username) {
        if (user.usernameLastChanged) {
          const daysSinceLastChange = (Date.now() - user.usernameLastChanged.getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceLastChange < 14) {
            return res.status(400).json({ error: `Username can only be changed once every 14 days. You have ${Math.ceil(14 - daysSinceLastChange)} days left.` });
          }
        }
        updateData.username = username;
        updateData.usernameLastChanged = new Date();
      }
    }

    // Handle avatar upload
    if (files && files['avatar'] && files['avatar'][0]) {
      const avatarFile = files['avatar'][0];
      if (process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY) {
        const avatarUrl = await uploadFileToR2(avatarFile.path, `avatars/${uuidv4()}${path.extname(avatarFile.originalname)}`, avatarFile.mimetype);
        if (avatarUrl) {
          updateData.avatarUrl = avatarUrl;
        }
      } else {
        // Fallback to local
        const newPath = path.join(__dirname, '../../uploads/avatars', avatarFile.filename);
        if (!fs.existsSync(path.dirname(newPath))) fs.mkdirSync(path.dirname(newPath), { recursive: true });
        fs.renameSync(avatarFile.path, newPath);
        updateData.avatarUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/uploads/avatars/${avatarFile.filename}`;
      }
    }

    // Handle banner upload
    if (files && files['banner'] && files['banner'][0]) {
      const bannerFile = files['banner'][0];
      if (process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY) {
        const bannerUrl = await uploadFileToR2(bannerFile.path, `banners/${uuidv4()}${path.extname(bannerFile.originalname)}`, bannerFile.mimetype);
        if (bannerUrl) {
          updateData.bannerUrl = bannerUrl;
        }
      } else {
        // Fallback to local
        const newPath = path.join(__dirname, '../../uploads/banners', bannerFile.filename);
        if (!fs.existsSync(path.dirname(newPath))) fs.mkdirSync(path.dirname(newPath), { recursive: true });
        fs.renameSync(bannerFile.path, newPath);
        updateData.bannerUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/uploads/banners/${bannerFile.filename}`;
      }
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true }).select('-passwordHash');
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Server error updating profile' });
  }
});

// Get user profile by username (Public Channel Page)
router.get('/channel/:username', async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({ username: { $regex: new RegExp(`^${req.params.username}$`, 'i') } }).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    // Get their videos
    const videos = await Video.find({ creator: user._id, status: 'published' })
      .sort({ createdAt: -1 })
      .populate('creator', 'username avatarUrl');
      
    res.json({
      user,
      videos
    });
  } catch (error) {
    console.error('Error fetching channel:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Subscribe to a channel
router.post('/subscribe/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const channelId = req.params.id;
    
    if (userId === channelId) return res.status(400).json({ error: 'Cannot subscribe to yourself' });

    const user = await User.findById(userId);
    const channel = await User.findById(channelId);
    
    if (!user || !channel) return res.status(404).json({ error: 'User or channel not found' });

    if (!user.subscriptions.includes(channel._id as any)) {
      user.subscriptions.push(channel._id as any);
      channel.subscribersCount += 1;
      await Promise.all([user.save(), channel.save()]);
    }
    
    res.json({ success: true, subscribersCount: channel.subscribersCount });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Unsubscribe from a channel
router.post('/unsubscribe/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const channelId = req.params.id;

    const user = await User.findById(userId);
    const channel = await User.findById(channelId);
    
    if (!user || !channel) return res.status(404).json({ error: 'User or channel not found' });

    if (user.subscriptions.includes(channel._id as any)) {
      user.subscriptions = user.subscriptions.filter(id => id.toString() !== channelId);
      channel.subscribersCount = Math.max(0, channel.subscribersCount - 1);
      await Promise.all([user.save(), channel.save()]);
    }
    
    res.json({ success: true, subscribersCount: channel.subscribersCount });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user subscriptions
router.get('/subscriptions', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id).populate('subscriptions', 'username channelName avatarUrl');
    res.json(user?.subscriptions || []);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add to history
router.post('/history/:videoId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const videoId = req.params.videoId;
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Remove if already exists so we can push it to the top
    user.history = user.history.filter(h => h.video.toString() !== videoId.toString());
    
    // Add to top
    user.history.unshift({ video: videoId as any, watchedAt: new Date() });
    
    // Limit history size to 100
    if (user.history.length > 100) {
      user.history = user.history.slice(0, 100);
    }
    
    await user.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get history
router.get('/history', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id).populate({
      path: 'history.video',
      populate: { path: 'creator', select: 'username channelName avatarUrl' }
    });
    
    // Filter out deleted videos and remove duplicates (keep most recent)
    const seenVideos = new Set();
    const historyVideos = (user?.history || [])
      .filter(h => h.video) 
      .map(h => ({
        ...((h.video as any).toObject ? (h.video as any).toObject() : h.video),
        watchedAt: h.watchedAt
      }))
      .filter(video => {
        if (seenVideos.has(video._id.toString())) {
          return false;
        }
        seenVideos.add(video._id.toString());
        return true;
      });
      
    res.json(historyVideos);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching history' });
  }
});

// Toggle Watch Later
router.post('/watch-later/:videoId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const videoId = req.params.videoId;
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const exists = user.watchLater.some(id => id.toString() === videoId);
    if (exists) {
      user.watchLater = user.watchLater.filter(id => id.toString() !== videoId);
    } else {
      user.watchLater.unshift(videoId as any);
    }
    
    await user.save();
    res.json({ success: true, added: !exists });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get watch later
router.get('/watch-later', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id).populate({
      path: 'watchLater',
      populate: { path: 'creator', select: 'username channelName avatarUrl' }
    });
    
    const validVideos = user?.watchLater.filter(v => v) || [];
    res.json(validVideos);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Search users (channels)
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      return res.json([]);
    }
    
    // Search by username or channelName (case-insensitive)
    const regex = new RegExp(q, 'i');
    const users = await User.find({
      $or: [{ username: regex }, { channelName: regex }]
    })
    .select('username channelName avatarUrl subscribersCount bio')
    .limit(5); // Only return top 5 channels
    
    res.json(users);
  } catch (error) {
    console.error('Error searching channels:', error);
    res.status(500).json({ error: 'Server error searching channels' });
  }
});

export default router;
