import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';

/**
 * Extract audio track from video as a small AAC file for AI transcription.
 * Uses stream copy (no re-encoding) so it's extremely fast even on Render.
 */
export const extractAudio = (inputPath: string, outputPath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        '-vn',          // No video
        '-c:a aac',     // AAC codec (widely compatible)
        '-b:a 64k',     // Low bitrate - enough for transcription
        '-t 300',       // Max 5 minutes of audio to keep file small
      ])
      .on('end', () => resolve(outputPath))
      .on('error', (err) => {
        console.warn('Audio extraction failed (non-fatal):', err.message);
        reject(err);
      })
      .save(outputPath);
  });
};

export const compressVideo = (inputPath: string, outputPath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        '-c:v libx264',    // Use H.264 codec
        '-crf 28',         // Constant Rate Factor (28 is good compression/quality ratio)
        '-preset fast',    // Encoding speed preset
        '-pix_fmt yuv420p',// Pixel format for broad mobile compatibility
        '-profile:v main', // Main profile for better mobile support
        '-c:a aac',        // Audio codec
        '-b:a 128k',       // Audio bitrate
        '-movflags +faststart' // Move moov atom to start for fast playback and seeking
      ])
      .on('end', () => {
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('Error compressing video:', err);
        reject(err);
      })
      .save(outputPath);
  });
};

export const generateThumbnail = (inputPath: string, outputFolder: string, filename: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Ensure output folder exists
    if (!fs.existsSync(outputFolder)) {
      fs.mkdirSync(outputFolder, { recursive: true });
    }

    const outputPath = path.join(outputFolder, filename);

    ffmpeg(inputPath)
      .on('end', () => {
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('Error generating thumbnail:', err);
        reject(err);
      })
      .screenshots({
        count: 1,
        folder: outputFolder,
        filename: filename,
        timestamps: ['5%'] // Take screenshot at 5% of video length
      });
  });
};

export const getVideoMetadata = (inputPath: string): Promise<{ duration: number, width: number, height: number }> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        const duration = metadata.format.duration || 0;
        let width = 0;
        let height = 0;
        
        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        if (videoStream) {
          width = videoStream.width || 0;
          height = videoStream.height || 0;
          
          // Handle rotation metadata (if video is rotated 90 or 270 degrees, swap width and height)
          const rotation = videoStream.rotation || 
                           (videoStream.tags && (videoStream.tags as any).rotate) || 
                           0;
          
          if (Math.abs(Number(rotation)) === 90 || Math.abs(Number(rotation)) === 270) {
            const temp = width;
            width = height;
            height = temp;
          }
        }
        
        resolve({ duration, width, height });
      }
    });
  });
};
