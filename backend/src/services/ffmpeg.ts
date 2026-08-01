import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';

export const compressVideo = (inputPath: string, outputPath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        '-c:v libx264',    // Use H.264 codec
        '-crf 28',         // Constant Rate Factor (28 is good compression/quality ratio)
        '-preset fast',    // Encoding speed preset
        '-c:a aac',        // Audio codec
        '-b:a 128k'        // Audio bitrate
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

export const getVideoDuration = (inputPath: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        const duration = metadata.format.duration || 0;
        resolve(duration);
      }
    });
  });
};
