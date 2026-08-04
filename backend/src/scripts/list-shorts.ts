import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Video from '../models/Video';

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log('Connected to DB');

    const shorts = await Video.find({ tags: 'shorts' });
    console.log(`Found ${shorts.length} shorts`);
    for (const v of shorts) {
      console.log(`- ${v.title} | Status: ${v.status} | Visibility: ${v.visibility} | Tags: ${v.tags}`);
    }
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
run();
