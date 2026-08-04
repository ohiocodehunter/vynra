import { Video } from './api';

const CACHE_NAME = 'vynra-offline-videos';

export async function saveVideoOffline(video: Video, onProgress?: (percent: number) => void): Promise<boolean> {
  try {
    const cache = await caches.open(CACHE_NAME);
    
    // Check if already downloaded
    const existing = await cache.match(video.url);
    if (existing) {
      console.log('Video already saved offline');
      if (onProgress) onProgress(100);
      
      // Also save the metadata
      await saveVideoMetadata(video);
      return true;
    }

    // Fetch the video with progress tracking
    const response = await fetch(video.url);
    if (!response.ok) throw new Error('Failed to fetch video');

    const contentLength = response.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;
    
    let loaded = 0;
    
    if (total === 0 || !response.body) {
      // Fallback if no content-length or body stream
      await cache.put(video.url, response);
      if (onProgress) onProgress(100);
    } else {
      const reader = response.body.getReader();
      const chunks: any[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          loaded += value.length;
          if (onProgress) onProgress(Math.round((loaded / total) * 100));
        }
      }

      const blob = new Blob(chunks, { type: response.headers.get('content-type') || 'video/mp4' });
      const newResponse = new Response(blob, {
        headers: {
          'Content-Type': response.headers.get('content-type') || 'video/mp4',
          'Content-Length': blob.size.toString(),
        }
      });
      await cache.put(video.url, newResponse);
    }

    await saveVideoMetadata(video);
    return true;
  } catch (error) {
    console.error('Failed to download video:', error);
    return false;
  }
}

// Save basic metadata to local storage for listing offline videos later
async function saveVideoMetadata(video: Video) {
  try {
    const stored = localStorage.getItem('vynra_offline_metadata');
    let offlineVideos: Video[] = stored ? JSON.parse(stored) : [];
    
    if (!offlineVideos.find(v => v._id === video._id)) {
      offlineVideos.push(video);
      localStorage.setItem('vynra_offline_metadata', JSON.stringify(offlineVideos));
    }
  } catch (error) {
    console.error('Failed to save metadata', error);
  }
}

export async function removeOfflineVideo(video: Video): Promise<boolean> {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.delete(video.url);
    
    const stored = localStorage.getItem('vynra_offline_metadata');
    if (stored) {
      let offlineVideos: Video[] = JSON.parse(stored);
      offlineVideos = offlineVideos.filter(v => v._id !== video._id);
      localStorage.setItem('vynra_offline_metadata', JSON.stringify(offlineVideos));
    }
    return true;
  } catch (e) {
    console.error('Failed to remove offline video', e);
    return false;
  }
}

export async function isVideoOffline(videoUrl: string): Promise<boolean> {
  if (typeof caches === 'undefined') return false;
  try {
    const cache = await caches.open(CACHE_NAME);
    const match = await cache.match(videoUrl);
    return !!match;
  } catch (e) {
    return false;
  }
}

export function getOfflineVideos(): Video[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('vynra_offline_metadata');
  return stored ? JSON.parse(stored) : [];
}
