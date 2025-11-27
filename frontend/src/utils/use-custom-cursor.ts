import { useState, useEffect, useRef } from 'react';

interface Figure {
  id: string;
  image: string;
}

export const useCustomCursor = (figures: Figure[]) => {
  const [equippedCursorId, setEquippedCursorId] = useState<string | null>(null);
  const [cursorCache, setCursorCache] = useState<Map<string, string>>(new Map());
  const processingRef = useRef<boolean>(false);

  // Load from localStorage once and listen for changes
  useEffect(() => {
    const loadCursor = () => {
      const saved = localStorage.getItem('equipped_cursor');
      setEquippedCursorId(saved);
    };

    loadCursor();

    const handleCursorChange = () => {
      loadCursor();
    };

    window.addEventListener('cursor-changed', handleCursorChange);
    return () => window.removeEventListener('cursor-changed', handleCursorChange);
  }, []);

  // Create cursor with higher resolution
  const createCursor = async (imageUrl: string): Promise<string | null> => {
    // Check cache first
    if (cursorCache.has(imageUrl)) {
      return cursorCache.get(imageUrl)!;
    }

    // Prevent multiple processing of same image
    if (processingRef.current) {
      return null;
    }

    processingRef.current = true;

    return new Promise((resolve) => {
      const img = new Image();
      
      const cleanup = () => {
        processingRef.current = false;
      };

      img.onload = () => {
        try {
          // Use higher resolution - browsers support up to 128x128 on most systems
          const maxSize = 48; // Increased from 28 to 48 for better quality
          const aspectRatio = img.width / img.height;
          
          let canvasWidth, canvasHeight;
          let drawWidth, drawHeight;
          
          if (aspectRatio > 1) {
            // Wider than tall
            drawWidth = maxSize;
            drawHeight = maxSize / aspectRatio;
          } else {
            // Taller than wide or square
            drawHeight = maxSize;
            drawWidth = maxSize * aspectRatio;
          }
          
          // Canvas size should be just big enough to contain the image
          canvasWidth = Math.ceil(drawWidth);
          canvasHeight = Math.ceil(drawHeight);
          
          // Ensure minimum size for visibility
          canvasWidth = Math.max(canvasWidth, 24);
          canvasHeight = Math.max(canvasHeight, 24);
          
          // Increased maximum size for better quality
          canvasWidth = Math.min(canvasWidth, 64);
          canvasHeight = Math.min(canvasHeight, 64);

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d', { 
            // High-quality rendering options
            alpha: true,
            desynchronized: false,
            colorSpace: 'srgb'
          });
          
          canvas.width = canvasWidth;
          canvas.height = canvasHeight;

          if (!ctx) {
            cleanup();
            resolve(null);
            return;
          }

          // Enable the highest quality scaling
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Clear canvas with transparency
          ctx.clearRect(0, 0, canvasWidth, canvasHeight);
          
          // Center the image in the canvas
          const x = (canvasWidth - drawWidth) / 2;
          const y = (canvasHeight - drawHeight) / 2;
          
          // Optional: Add a more subtle drop shadow for better contrast
          ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
          ctx.shadowBlur = 2;
          ctx.shadowOffsetX = 1;
          ctx.shadowOffsetY = 1;
          
          // Draw the image with proper aspect ratio and crisp edges
          ctx.drawImage(img, x, y, drawWidth, drawHeight);
          
          // Reset shadow
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          
          // Use maximum quality PNG encoding
          const dataUrl = canvas.toDataURL('image/png', 1.0);
          setCursorCache(prev => new Map(prev).set(imageUrl, dataUrl));
          
          cleanup();
          resolve(dataUrl);
        } catch (error) {
          cleanup();
          resolve(null);
        }
      };
      
      img.onerror = () => {
        cleanup();
        resolve(null);
      };
      
      img.crossOrigin = 'anonymous';
      img.src = imageUrl;
      
      // Timeout to prevent hanging
      setTimeout(() => {
        cleanup();
        resolve(null);
      }, 5000);
    });
  };

  // Apply cursor ONLY when dependencies change
  useEffect(() => {
    const applyCursor = async () => {
      // Remove any existing cursor first
      const existingStyle = document.getElementById('global-custom-cursor');
      if (existingStyle) {
        existingStyle.remove();
      }

      if (!equippedCursorId || figures.length === 0) {
        document.body.style.cursor = 'auto';
        return;
      }

      const figure = figures.find(f => f.id === equippedCursorId);
      if (!figure?.image) {
        document.body.style.cursor = 'auto';
        return;
      }

      try {
        const cursorDataUrl = await createCursor(figure.image);
        
        if (cursorDataUrl) {
          // Use center hotspot - adjusted for larger cursor size
          const cursorStyle = `url("${cursorDataUrl}") 24 24, auto`;
          
          // Apply via CSS with higher specificity and image-rendering optimization
          const style = document.createElement('style');
          style.id = 'global-custom-cursor';
          style.textContent = `
            *, *::before, *::after {
              cursor: ${cursorStyle} !important;
              image-rendering: -webkit-optimize-contrast;
              image-rendering: crisp-edges;
            }
          `;
          document.head.appendChild(style);
        } else {
          document.body.style.cursor = 'auto';
        }
      } catch (error) {
        console.error('Cursor creation failed:', error);
        document.body.style.cursor = 'auto';
      }
    };

    // Debounce to prevent rapid firing
    const timeoutId = setTimeout(applyCursor, 100);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [equippedCursorId, figures]); // Only run when these change

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const style = document.getElementById('global-custom-cursor');
      if (style) {
        style.remove();
      }
    };
  }, []);

  const equipCursor = (figureId: string) => {
    setEquippedCursorId(figureId);
    localStorage.setItem('equipped_cursor', figureId);
    window.dispatchEvent(new CustomEvent('cursor-changed'));
  };

  const unequipCursor = () => {
    setEquippedCursorId(null);
    localStorage.removeItem('equipped_cursor');
    window.dispatchEvent(new CustomEvent('cursor-changed'));
  };

  return { 
    equippedCursorId, 
    equipCursor, 
    unequipCursor 
  };
};