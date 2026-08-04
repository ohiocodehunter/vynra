import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Video from '../models/Video';
import ffmpeg from 'fluent-ffmpeg';

dotenv.config();

const getVideoMetadataUrl = (url: string): Promise<{ width: number, height: number }> => {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(url, (err, metadata) => {
      if (err) {
        console.error("FFProbe error for", url, ":", err.message);
        resolve({ width: 0, height: 0 }); // Skip on error
        return;
      }
      const videoStream = metadata?.streams?.find(s => s.codec_type === 'video');
      if (videoStream) {
        let width = videoStream.width || 0;
        let height = videoStream.height || 0;
        const rotation = videoStream.rotation || (videoStream.tags && (videoStream.tags as any).rotate) || 0;
        if (Math.abs(Number(rotation)) === 90 || Math.abs(Number(rotation)) === 270) {
          const temp = width;
          width = height;
          height = temp;
        }
        resolve({ width, height });
      } else {
        resolve({ width: 0, height: 0 });
      }
    });
  });
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log('Connected to DB');

    const videos = await Video.find({ tags: { $ne: 'shorts' } });
    let count = 0;
    
    for (const v of videos) {
      if (v.url) {
        console.log(`Checking ${v.title}...`);
        const { width, height } = await getVideoMetadataUrl(v.url);
        if (width > 0 && height > 0 && width < height) {
          v.tags.push('shorts');
          await v.save();
          console.log(`-> Tagged as shorts! (${width}x${height})`);
          count++;
        } else {
          console.log(`-> Not a short (${width}x${height})`);
        }
      }
    }
    
    console.log(`Updated ${count} vertical videos with 'shorts' tag.`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
run();
