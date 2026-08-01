import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import User from '../src/models/User';
import Video from '../src/models/Video';
import { generateThumbnail, getVideoDuration } from '../src/services/ffmpeg';
import bcrypt from 'bcryptjs';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/vynra';
const ASSETS_DIR = path.join(__dirname, '../../assets');
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
const THUMBNAILS_DIR = path.join(UPLOADS_DIR, 'thumbnails');

// Mock data
const mockUsers = [
  {
    username: 'ohiocodehunter',
    name: 'Karan OCH',
    email: 'karan@vynra.com',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Karan'
  },
  { username: 'CodeWithArjun', email: 'arjun@example.com', avatarUrl: 'https://i.pravatar.cc/150?u=2' },
  { username: 'DesignHub', email: 'design@example.com', avatarUrl: 'https://i.pravatar.cc/150?u=3' },
  { username: 'FutureTech', email: 'tech@example.com', avatarUrl: 'https://i.pravatar.cc/150?u=4' },
  { username: 'MusicVibes', email: 'music@example.com', avatarUrl: 'https://i.pravatar.cc/150?u=5' }
];

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    // Clear existing
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Video.deleteMany({});

    // Ensure upload dirs exist
    if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    if (!fs.existsSync(THUMBNAILS_DIR)) fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });

    // Seed Users
    console.log('Seeding Users...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);
    
    const createdUsers = [];
    for (const u of mockUsers) {
      const user = new User({ ...u, passwordHash });
      await user.save();
      createdUsers.push(user);
    }
    console.log(`Created ${createdUsers.length} users.`);

    // Helper to process a directory
    async function processDirectory(dirName: string, tags: string[]) {
      const fullPath = path.join(ASSETS_DIR, dirName);
      if (!fs.existsSync(fullPath)) {
        console.log(`Directory ${fullPath} not found. Skipping.`);
        return;
      }

      const files = fs.readdirSync(fullPath).filter(f => f.endsWith('.mp4') || f.endsWith('.mp3'));
      console.log(`Found ${files.length} files in ${dirName}. Processing...`);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const inputPath = path.join(fullPath, file);
        const fileId = uuidv4();
        const ext = path.extname(file);
        const newFileName = `processed_${fileId}${ext}`;
        const destPath = path.join(UPLOADS_DIR, newFileName);
        const thumbName = `thumb_${fileId}.png`;

        // 1. Copy file to uploads (mocking the upload process)
        fs.copyFileSync(inputPath, destPath);

        // 2. Get Duration & Thumbnail
        let duration = 0;
        let finalThumbUrl = '';
        try {
          if (ext === '.mp4') {
            duration = await getVideoDuration(destPath);
            await generateThumbnail(destPath, THUMBNAILS_DIR, thumbName);
            finalThumbUrl = `http://localhost:5000/uploads/thumbnails/${thumbName}`;
          } else {
            finalThumbUrl = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80'; // fallback audio thumb
          }
        } catch (e) {
          console.error(`Error processing media for ${file}:`, e);
        }

        // 3. Assign random creator
        const creator = createdUsers[i % createdUsers.length];

        // 4. Create Video doc
        const video = new Video({
          title: file.replace(/_/g, ' ').replace(ext, ''),
          description: `Enjoy this amazing content from ${creator.username}! Don't forget to like and subscribe.`,
          url: `http://localhost:5000/uploads/${newFileName}`,
          thumbnailUrl: finalThumbUrl,
          creator: creator._id,
          views: Math.floor(Math.random() * 500000),
          likes: Math.floor(Math.random() * 50000),
          duration: duration,
          status: 'published',
          tags: tags
        });

        await video.save();
        console.log(`[${i+1}/${files.length}] Seeded: ${video.title}`);
      }
    }

    // Process both folders
    await processDirectory('video', ['vlog', 'entertainment']);
    await processDirectory('shorts', ['shorts', 'quick', 'funny']);

    console.log('Seeding complete!');
    process.exit(0);

  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();
