import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Video from '../models/Video';

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    const videos = await Video.find({});
    for (const v of videos) {
      console.log(`Title: ${v.title} | Tags: ${v.tags} | Duration: ${v.duration}`);
    }
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
run();
