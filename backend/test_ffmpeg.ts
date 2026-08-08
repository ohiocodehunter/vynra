import { getVideoMetadata, compressVideo, generateThumbnail } from './src/services/ffmpeg';
import path from 'path';

async function test() {
  const inputPath = path.join(__dirname, 'uploads/temp/748a4d24-ebb9-4815-874e-230b9efa4dde.mp4');
  const compressedPath = path.join(__dirname, 'uploads/test_compressed.mp4');
  const thumbFolder = path.join(__dirname, 'uploads/thumbnails');
  
  try {
    console.log('Testing getVideoMetadata...');
    const meta = await getVideoMetadata(inputPath);
    console.log('Metadata:', meta);
    
    console.log('Testing compressVideo...');
    await compressVideo(inputPath, compressedPath);
    console.log('Compression successful!');
    
    console.log('Testing generateThumbnail...');
    await generateThumbnail(compressedPath, thumbFolder, 'test_thumb.png');
    console.log('Thumbnail generation successful!');
  } catch (err) {
    console.error('Error during test:', err);
  }
}

test();
