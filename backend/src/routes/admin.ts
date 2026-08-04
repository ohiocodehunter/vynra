import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User';
import { adminMiddleware } from '../middlewares/adminMiddleware';

const router = Router();

// Secure Admin Login Route
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password, adminSecret } = req.body;
    
    if (!email || !password || !adminSecret) {
      return res.status(400).json({ error: 'Email, password, and admin secret are required' });
    }

    // 1. Verify User
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 2. Verify Role
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    }

    // 3. Verify Password (Bcrypt)
    const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 4. Verify Admin Secret (SHA-256)
    const providedSecretHash = crypto.createHash('sha256').update(adminSecret).digest('hex');
    
    // Check personal passcode first
    let isAuthorized = false;
    
    if (user.adminPasscodeHash && providedSecretHash === user.adminPasscodeHash) {
      isAuthorized = true;
    } 
    // Fallback to master secret for super admin
    else {
      const storedSecretHash = process.env.ADMIN_SECRET_HASH;
      if (storedSecretHash && providedSecretHash === storedSecretHash) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return res.status(401).json({ error: 'Invalid Admin Secret Key' });
    }
    
    // Create token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '12h' } // Shorter expiry for admin
    );
    
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Server error during admin login' });
  }
});

// Example protected admin route: Get overview stats
router.get('/stats', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const Video = require('../models/Video').default;
    const totalVideos = await Video.countDocuments();
    
    res.json({
      totalUsers,
      totalVideos,
      status: 'healthy'
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching admin stats' });
  }
});

// === USER MANAGEMENT ===

// Get all users
router.get('/users', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching users' });
  }
});

// Update user (verify, modify, moderate)
router.patch('/users/:id', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { isVerified, role, channelName, bio, accountStatus } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let newAdminPin = null;

    if (isVerified !== undefined) user.isVerified = isVerified;
    if (role !== undefined) {
      // If promoting to admin and they don't have a passcode set, generate one
      if (role === 'admin' && user.role !== 'admin') {
        newAdminPin = Math.floor(100000 + Math.random() * 900000).toString();
        user.adminPasscodeHash = crypto.createHash('sha256').update(newAdminPin).digest('hex');
      }
      user.role = role;
    }
    
    if (channelName !== undefined) user.channelName = channelName;
    if (bio !== undefined) user.bio = bio;
    if (accountStatus !== undefined) user.accountStatus = accountStatus;

    await user.save();
    
    // Emit real-time update if socket.io is available
    const io = req.app.get('io');
    if (io) {
      io.emit('user_updated', { 
        userId: user._id.toString(), 
        isVerified: user.isVerified,
        channelName: user.channelName,
        username: user.username,
        accountStatus: user.accountStatus
      });
    }
    
    // Convert to plain object to attach the cleartext PIN
    const userResponse = user.toObject();
    if (newAdminPin) {
      (userResponse as any).newAdminPin = newAdminPin;
    }
    
    res.json(userResponse);
  } catch (error) {
    res.status(500).json({ error: 'Error updating user' });
  }
});

// Delete user (Cascading delete)
router.delete('/users/:id', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Cascading delete: permanently delete all videos belonging to this user
    const Video = require('../models/Video').default;
    const { deleteFileFromR2 } = require('../services/r2');
    
    const userVideos = await Video.find({ creator: req.params.id });
    
    // Delete files from R2
    for (const video of userVideos) {
      try {
        if (video.url && video.url.includes('r2.dev')) {
          const videoFileName = video.url.split('/').pop();
          if (videoFileName) await deleteFileFromR2(`videos/${videoFileName}`);
        }
        if (video.thumbnailUrl && video.thumbnailUrl.includes('r2.dev')) {
          const thumbFileName = video.thumbnailUrl.split('/').pop();
          if (thumbFileName) await deleteFileFromR2(`thumbnails/${thumbFileName}`);
        }
      } catch (err) {
        console.error('Error deleting files from R2 during cascade delete:', err);
      }
    }
    
    await Video.deleteMany({ creator: req.params.id });

    // Delete user avatars/banners if they exist on R2
    try {
      if (user.avatarUrl && user.avatarUrl.includes('r2.dev')) {
        const avatarFileName = user.avatarUrl.split('/').pop();
        if (avatarFileName) await deleteFileFromR2(`avatars/${avatarFileName}`);
      }
      if (user.bannerUrl && user.bannerUrl.includes('r2.dev')) {
        const bannerFileName = user.bannerUrl.split('/').pop();
        if (bannerFileName) await deleteFileFromR2(`banners/${bannerFileName}`);
      }
    } catch (err) {
      console.error('Error deleting user profile images from R2:', err);
    }

    // Finally delete the user
    await User.findByIdAndDelete(req.params.id);
    
    // Emit real-time socket event for user deletion
    const io = req.app.get('io');
    if (io) {
      io.emit('user_deleted', { userId: req.params.id });
    }
    
    res.json({ success: true, message: 'User and all their videos/files were permanently deleted' });
  } catch (error) {
    console.error('Error in user hard delete:', error);
    res.status(500).json({ error: 'Error deleting user' });
  }
});

// === VIDEO MANAGEMENT ===

// Get all videos
router.get('/videos', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const Video = require('../models/Video').default;
    const videos = await Video.find()
      .populate('creator', 'username channelName isVerified')
      .sort({ createdAt: -1 });
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching videos' });
  }
});

// Update video
router.patch('/videos/:id', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const Video = require('../models/Video').default;
    const { title, description, visibility, status } = req.body;
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: 'Video not found' });

    if (title !== undefined) video.title = title;
    if (description !== undefined) video.description = description;
    if (visibility !== undefined) video.visibility = visibility;
    if (status !== undefined) video.status = status;

    await video.save();
    res.json(video);
  } catch (error) {
    res.status(500).json({ error: 'Error updating video' });
  }
});

// Delete video
router.delete('/videos/:id', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const Video = require('../models/Video').default;
    await Video.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Video deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting video' });
  }
});

// === SYSTEM STATS ===

router.get('/system-stats', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const mongoose = require('mongoose');
    const { getR2StorageStats } = require('../services/r2');

    // MongoDB Stats
    const dbStats = await mongoose.connection.db.stats();
    
    // R2 Stats
    const r2Stats = await getR2StorageStats();
    
    res.json({
      mongodb: {
        dbName: dbStats.db,
        collections: dbStats.collections,
        objects: dbStats.objects,
        dataSize: dbStats.dataSize,
        storageSize: dbStats.storageSize,
        indexes: dbStats.indexes,
        indexSize: dbStats.indexSize,
      },
      cloudflareR2: {
        totalFiles: r2Stats.totalFiles,
        storageSize: r2Stats.totalBytes,
      }
    });
  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({ error: 'Failed to fetch system stats' });
  }
});

export default router;
