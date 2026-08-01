'use client';

import { useEffect } from 'react';

export default function GlobalProtection() {
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Block right click on videos
      if (target && target.tagName && target.tagName.toLowerCase() === 'video') {
        e.preventDefault();
        return;
      }
      
      // Also block right click if the target is inside a video container
      // (sometimes custom controls sit on top of the video)
      // Though native download only appears on actual <video> elements.
    };

    // Block keyboard shortcuts like Ctrl+S (Save Page As)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return null;
}
