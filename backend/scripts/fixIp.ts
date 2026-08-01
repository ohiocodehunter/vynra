import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Video from '../src/models/Video';

dotenv.config();

async function fix() {
  await mongoose.connect(process.env.MONGO_URI!);
  const videos = await Video.find({});
  let count = 0;
  for (const video of videos) {
    let updated = false;
    if (video.url.includes('localhost:5000')) {
      video.url = video.url.replace('localhost:5000', '10.252.145.66:5001');
      updated = true;
    }
    if (video.thumbnailUrl && video.thumbnailUrl.includes('localhost:5000')) {
      video.thumbnailUrl = video.thumbnailUrl.replace('localhost:5000', '10.252.145.66:5001');
      updated = true;
    }
    if (updated) {
      await video.save();
      count++;
    }
  }
  console.log(`Updated ${count} videos to use 10.252.145.66:5001`);
  process.exit(0);
}

fix();
