import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

// R2 Client configuration
const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT || '',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

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

    await s3Client.send(new PutObjectCommand(uploadParams));
    
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
    
    await s3Client.send(new DeleteObjectCommand(deleteParams));
    return true;
  } catch (error) {
    console.error('Error deleting file from R2:', error);
    return false;
  }
};
