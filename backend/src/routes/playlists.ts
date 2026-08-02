import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middlewares/authMiddleware';
import Playlist from '../models/Playlist';
import Video from '../models/Video';

const router = Router();

// Create a new playlist
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, isPublic } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Playlist name is required' });
    }
    
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const playlist = new Playlist({
      name,
      creator: req.user.id,
      isPublic: isPublic !== undefined ? isPublic : true,
      videos: []
    });

    await playlist.save();
    res.status(201).json(playlist);
  } catch (error) {
    console.error('Error creating playlist:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user's playlists
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const playlists = await Playlist.find({ creator: req.user.id })
      .populate({
        path: 'videos',
        populate: {
          path: 'creator',
          select: 'username channelName avatarUrl'
        }
      })
      .sort({ createdAt: -1 });
      
    res.json(playlists);
  } catch (error) {
    console.error('Error fetching playlists:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's playlists
router.get('/user/:username', async (req, res) => {
  try {
    // We actually just want the current logged in user's playlists for saving to playlist,
    // but this route will also be used on the channel page
    // Let's import User model to find user id by username
    const User = require('../models/User').default;
    const user = await User.findOne({ username: { $regex: new RegExp(`^${req.params.username}$`, 'i') } });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if the requester is the owner of the channel
    const token = req.headers.authorization?.split(' ')[1];
    let isOwner = false;
    
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
        if (decoded.id === user._id.toString()) {
          isOwner = true;
        }
      } catch (e) {
        // invalid token, just ignore
      }
    }
    
    const query: any = { creator: user._id };
    // If not owner, only show public playlists
    if (!isOwner) {
      query.isPublic = true;
    }
    
    const playlists = await Playlist.find(query).populate({
      path: 'videos',
      populate: {
        path: 'creator',
        select: 'username channelName avatarUrl'
      }
    }).sort({ createdAt: -1 });
    
    res.json(playlists);
  } catch (error) {
    console.error('Error fetching playlists:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add a video to a playlist
router.post('/:id/add', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { videoId } = req.body;
    
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const playlist = await Playlist.findOne({ _id: req.params.id, creator: req.user.id });
    
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found or unauthorized' });
    }
    
    // Check if video exists
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    // Add if not already present
    if (!playlist.videos.includes(videoId)) {
      playlist.videos.push(videoId);
      await playlist.save();
    }
    
    res.json(playlist);
  } catch (error) {
    console.error('Error adding video to playlist:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove a video from a playlist
router.post('/:id/remove', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { videoId } = req.body;
    
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const playlist = await Playlist.findOne({ _id: req.params.id, creator: req.user.id });
    
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found or unauthorized' });
    }
    
    playlist.videos = playlist.videos.filter(v => v.toString() !== videoId);
    await playlist.save();
    
    res.json(playlist);
  } catch (error) {
    console.error('Error removing video from playlist:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
