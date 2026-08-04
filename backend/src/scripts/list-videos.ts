import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Video from '../models/Video';

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log('Connected to DB');

    const videos = await Video.find({});
    console.log(`Found ${videos.length} videos`);
    for (const v of videos) {
      console.log(`- ${v.title} | Duration: ${v.duration} | Tags: ${v.tags}`);
    }
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
run();
