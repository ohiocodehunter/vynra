import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

// R2 Client configuration
let s3ClientInstance: S3Client | null = null;
const getS3Client = () => {
  if (!s3ClientInstance) {
    s3ClientInstance = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT || '',
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      },
    });
  }
  return s3ClientInstance;
};

export const uploadFileToR2 = async (filePath: string, fileName: string, mimeType: string): Promise<string | null> => {
  try {
    const fileStream = fs.createReadStream(filePath);
    const bucketName = process.env.R2_BUCKET_NAME || 'vynra-bucket';

    const uploadParams = {
      Bucket: bucketName,
      Key: fileName,
      Body: fileStream,
      ContentType: mimeType,
    };

    await getS3Client().send(new PutObjectCommand(uploadParams));
    
    // Return the public URL
    const publicUrl = process.env.R2_PUBLIC_URL || '';
    if (publicUrl) {
      return `${publicUrl}/${fileName}`;
    }
    return `https://${bucketName}.${process.env.R2_ENDPOINT?.split('https://')[1]}/${fileName}`;
  } catch (error) {
    console.error('Error uploading file to R2:', error);
    return null;
  }
};

export const deleteFileFromR2 = async (fileName: string): Promise<boolean> => {
  try {
    const bucketName = process.env.R2_BUCKET_NAME || 'vynra-bucket';
    const deleteParams = {
      Bucket: bucketName,
      Key: fileName,
    };
    
    await getS3Client().send(new DeleteObjectCommand(deleteParams));
    return true;
  } catch (error) {
    console.error('Error deleting file from R2:', error);
    return false;
  }
};

import { ListObjectsV2Command } from '@aws-sdk/client-s3';

export const getR2StorageStats = async () => {
  const bucketName = process.env.R2_BUCKET_NAME || 'vynra-bucket';
  let totalBytes = 0;
  let totalFiles = 0;
  let continuationToken: string | undefined = undefined;
  
  try {
    do {
      const listCmd: any = new ListObjectsV2Command({
        Bucket: bucketName,
        ContinuationToken: continuationToken,
      });
      const response: any = await getS3Client().send(listCmd);
      if (response.Contents) {
        response.Contents.forEach((obj: any) => {
          totalBytes += obj.Size || 0;
          totalFiles += 1;
        });
      }
      continuationToken = response.NextContinuationToken;
    } while (continuationToken);
    
    return { totalBytes, totalFiles };
  } catch (error) {
    console.error('Error getting R2 stats:', error);
    return { totalBytes: 0, totalFiles: 0 };
  }
};
