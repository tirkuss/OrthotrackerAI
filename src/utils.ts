/**
 * Resizes an image (given as a Data URL) to a max width and/or height
 * while preserving its aspect ratio (no cropping), and returns a Promise with a compressed JPEG Data URL.
 */
export function resizeImage(
  dataUrl: string,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.75
): Promise<string> {
  return new Promise((resolve) => {
    // If it's not a data URL of an image, or canvas is not supported, resolve original
    if (!dataUrl || !dataUrl.startsWith('data:image')) {
      resolve(dataUrl);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = dataUrl;

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Only resize if exceeds max width/height
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      // Draw full image to canvas (no cropping, keeps full aspect ratio)
      ctx.drawImage(img, 0, 0, width, height);

      try {
        // Output as jpeg format to compress file size significantly
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      } catch (err) {
        console.error('Failed to compress image in canvas:', err);
        resolve(dataUrl);
      }
    };

    img.onerror = (err) => {
      console.error('Image element failed to load data url:', err);
      resolve(dataUrl);
    };
  });
}

/**
 * Reads an image file, resizes it preserving aspect ratio, and responds with a compressed JPEG data URL.
 */
export function compressImageFile(
  file: Blob | File,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.75
): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        resizeImage(dataUrl, maxWidth, maxHeight, quality).then(resolve);
      } else {
        resolve('');
      }
    };
    reader.onerror = () => {
      resolve('');
    };
    reader.readAsDataURL(file);
  });
}
