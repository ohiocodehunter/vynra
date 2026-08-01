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

export default router;
