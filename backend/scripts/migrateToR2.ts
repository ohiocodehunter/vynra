import 'dotenv/config';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import Video from '../src/models/Video';
import { uploadFileToR2 } from '../src/services/r2';
import { v4 as uuidv4 } from 'uuid';

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log('Connected to DB');

    const videos = await Video.find({});
    let count = 0;

    for (const video of videos) {
      if (video.url && (video.url.includes('10.252.145.66') || video.url.includes('localhost'))) {
        console.log(`Migrating video: ${video.title}`);
        
        const urlParts = video.url.split('/');
        const filename = urlParts[urlParts.length - 1];
        const localVideoPath = path.join(__dirname, '../../uploads', filename);

        let finalVideoUrl = video.url;
        let finalThumbUrl = video.thumbnailUrl;

        if (fs.existsSync(localVideoPath)) {
          const fileId = uuidv4();
          console.log(`Uploading video to R2...`);
          const r2VideoUrl = await uploadFileToR2(localVideoPath, `videos/${fileId}.mp4`, 'video/mp4');
          if (r2VideoUrl) finalVideoUrl = r2VideoUrl;
          
          if (video.thumbnailUrl) {
            const thumbParts = video.thumbnailUrl.split('/');
            const thumbName = thumbParts[thumbParts.length - 1];
            const localThumbPath = path.join(__dirname, '../../uploads/thumbnails', thumbName);
            
            if (fs.existsSync(localThumbPath)) {
              console.log(`Uploading thumbnail to R2...`);
              const r2ThumbUrl = await uploadFileToR2(localThumbPath, `thumbnails/${fileId}.png`, 'image/png');
              if (r2ThumbUrl) finalThumbUrl = r2ThumbUrl;
            }
          }
        } else {
          console.log(`Local file not found: ${localVideoPath}`);
        }

        video.url = finalVideoUrl;
        video.thumbnailUrl = finalThumbUrl;
        await video.save();
        console.log(`Updated DB for: ${video.title}`);
        count++;
      }
    }

    console.log(`Successfully migrated ${count} videos to Cloudflare R2!`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
