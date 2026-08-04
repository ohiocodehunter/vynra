import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Video from '../models/Video';

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log('Connected to DB');

    const result = await Video.updateMany(
      { duration: { $lt: 65, $gt: 0 } },
      { $addToSet: { tags: 'shorts' } }
    );
    console.log(`Updated ${result.modifiedCount} videos with 'shorts' tag.`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
run();
