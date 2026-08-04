import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Video from '../models/Video';

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log('Connected to DB');

    const videos = await Video.find({ duration: { $lt: 65, $gt: 0 } });
    let count = 0;
    
    for (const v of videos) {
      if (!v.tags.includes('shorts')) {
        v.tags.push('shorts');
        await v.save();
        count++;
      }
    }
    console.log(`Updated ${count} videos with 'shorts' tag based on duration.`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
run();
