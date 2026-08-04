import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import User from '../models/User';
import Video from '../models/Video';

// Load environment variables
dotenv.config();

const R2_BUCKET = process.env.R2_BUCKET_NAME || 'vynra-bucket';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT || '',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const getValidKeysFromDb = async (): Promise<Set<string>> => {
  const validKeys = new Set<string>();

  // Get user avatars and banners
  const users = await User.find({}, 'avatarUrl bannerUrl');
  users.forEach(u => {
    if (u.avatarUrl && u.avatarUrl.includes('r2.dev')) {
      const parts = u.avatarUrl.split('r2.dev/');
      if (parts.length > 1) validKeys.add(parts[1]);
    }
    if (u.bannerUrl && u.bannerUrl.includes('r2.dev')) {
      const parts = u.bannerUrl.split('r2.dev/');
      if (parts.length > 1) validKeys.add(parts[1]);
    }
  });

  // Get video URLs and thumbnails
  const videos = await Video.find({}, 'url thumbnailUrl');
  videos.forEach(v => {
    if (v.url && v.url.includes('r2.dev')) {
      const parts = v.url.split('r2.dev/');
      if (parts.length > 1) validKeys.add(parts[1]);
    }
    if (v.thumbnailUrl && v.thumbnailUrl.includes('r2.dev')) {
      const parts = v.thumbnailUrl.split('r2.dev/');
      if (parts.length > 1) validKeys.add(parts[1]);
    }
  });

  return validKeys;
};

const cleanBucket = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || '');
    console.log('Connected.');

    console.log('Fetching valid keys from DB...');
    const validKeys = await getValidKeysFromDb();
    console.log(`Found ${validKeys.size} valid files in MongoDB.`);

    let continuationToken: string | undefined = undefined;
    let totalScanned = 0;
    let deletedCount = 0;

    console.log('Scanning R2 bucket for orphaned files...');

    do {
      const listCmd: any = new ListObjectsV2Command({
        Bucket: R2_BUCKET,
        ContinuationToken: continuationToken,
      });

      const response: any = await s3Client.send(listCmd);
      const objects = response.Contents || [];
      totalScanned += objects.length;

      const keysToDelete: string[] = [];

      objects.forEach((obj: any) => {
        if (obj.Key && !validKeys.has(obj.Key)) {
          keysToDelete.push(obj.Key);
        }
      });

      if (keysToDelete.length > 0) {
        // Delete in batches of 1000
        const deleteCmd = new DeleteObjectsCommand({
          Bucket: R2_BUCKET,
          Delete: {
            Objects: keysToDelete.map(Key => ({ Key })),
            Quiet: true,
          }
        });

        await s3Client.send(deleteCmd);
        deletedCount += keysToDelete.length;
        console.log(`Deleted ${keysToDelete.length} orphaned files...`);
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    console.log('-----------------------------------');
    console.log(`Cleanup Complete!`);
    console.log(`Total files in R2: ${totalScanned}`);
    console.log(`Orphaned files deleted: ${deletedCount}`);
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

cleanBucket();
