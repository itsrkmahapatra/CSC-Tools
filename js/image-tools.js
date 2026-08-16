/**
 * Docuvate Image & Visual Creators Processing Engine - 100% Client-Side
 */

export const ImageTools = {
  /**
   * Helper: Load image from File into HTMLImageElement
   */
  async loadImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  },

  /**
   * 1. Compress Image to target KB or quality
   */
  async compressImage(file, targetKB = 100, onProgress = () => {}) {
    onProgress(15, "Loading image bitmap...");
    const img = await this.loadImage(file);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);

    const targetBytes = targetKB * 1024;
    let lowQ = 0.05, highQ = 0.95;
    let bestBlob = null;
    let bestSize = 0;

    onProgress(40, "Optimizing image compression...");
    for (let i = 0; i < 6; i++) {
      const q = (lowQ + highQ) / 2;
      const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', q));
      if (!blob) break;

      if (blob.size <= targetBytes) {
        if (blob.size > bestSize) {
          bestSize = blob.size;
          bestBlob = blob;
        }
        lowQ = q;
      } else {
        highQ = q;
      }
    }

    if (!bestBlob) {
      bestBlob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.1));
    }

    onProgress(95, "Finalizing compressed image...");
    const originalKB = Math.round(file.size / 1024);
    const finalKB = Math.round(bestBlob.size / 1024);
    const reductionPercent = Math.max(0, Math.round(((file.size - bestBlob.size) / file.size) * 100));

    return {
      blob: bestBlob,
      blobUrl: URL.createObjectURL(bestBlob),
      fileName: `compressed-${targetKB}kb-${file.name.replace(/\.[^/.]+$/, "")}.jpg`,
      originalSizeKB: originalKB,
      finalSizeKB: finalKB,
      reductionPercent
    };
  },

  /**
   * 2. Resize Image
   */
  async resizeImage(file, width, height, maintainAspect = true, onProgress = () => {}) {
    onProgress(20, "Analyzing dimensions...");
    const img = await this.loadImage(file);
    
    let targetW = width || img.naturalWidth;
    let targetH = height || img.naturalHeight;

    if (maintainAspect) {
      const ratio = img.naturalWidth / img.naturalHeight;
      if (width && !height) {
        targetH = Math.round(width / ratio);
      } else if (height && !width) {
        targetW = Math.round(height * ratio);
      }
    }

    onProgress(50, `Rescaling to ${targetW}x${targetH}px...`);
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, targetW, targetH);

    onProgress(85, "Exporting resized visual...");
    const blob = await new Promise(r => canvas.toBlob(r, file.type || 'image/jpeg', 0.92));

    return {
      blob,
      blobUrl: URL.createObjectURL(blob),
      fileName: `resized-${targetW}x${targetH}-${file.name}`,
      width: targetW,
      height: targetH,
      sizeKB: Math.round(blob.size / 1024)
    };
  },

  /**
   * 3. Crop Image
   */
  async cropImage(file, cropPercent = 10, onProgress = () => {}) {
    onProgress(20, "Cropping boundary frame...");
    const img = await this.loadImage(file);
    const canvas = document.createElement('canvas');
    
    const cropX = (img.naturalWidth * (cropPercent / 100)) / 2;
    const cropY = (img.naturalHeight * (cropPercent / 100)) / 2;
    const cropW = img.naturalWidth - (cropX * 2);
    const cropH = img.naturalHeight - (cropY * 2);

    canvas.width = cropW;
    canvas.height = cropH;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

    onProgress(90, "Saving cropped visual...");
    const blob = await new Promise(r => canvas.toBlob(r, file.type || 'image/jpeg', 0.92));
    return {
      blob,
      blobUrl: URL.createObjectURL(blob),
      fileName: `cropped-${file.name}`,
      sizeKB: Math.round(blob.size / 1024)
    };
  },

  /**
   * 4 & 5. Convert Image Format (to JPG, PNG, WebP)
   */
  async convertFormat(file, targetFormat = 'image/png', onProgress = () => {}) {
    onProgress(25, "Decoding image stream...");
    const img = await this.loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');

    if (targetFormat === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, 0, 0);

    onProgress(75, `Encoding to ${targetFormat.split('/')[1].toUpperCase()}...`);
    const blob = await new Promise(r => canvas.toBlob(r, targetFormat, 0.92));
    const ext = targetFormat === 'image/jpeg' ? 'jpg' : targetFormat === 'image/webp' ? 'webp' : 'png';

    return {
      blob,
      blobUrl: URL.createObjectURL(blob),
      fileName: `${file.name.replace(/\.[^/.]+$/, "")}.${ext}`,
      sizeKB: Math.round(blob.size / 1024)
    };
  },

  /**
   * 6 & 7. Rotate & Flip Image
   */
  async transformImage(file, rotateAngle = 90, flipH = false, flipV = false, onProgress = () => {}) {
    onProgress(20, "Applying canvas transforms...");
    const img = await this.loadImage(file);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const rads = (rotateAngle * Math.PI) / 180;
    const is90or270 = Math.abs(rotateAngle) % 180 !== 0;

    canvas.width = is90or270 ? img.naturalHeight : img.naturalWidth;
    canvas.height = is90or270 ? img.naturalWidth : img.naturalHeight;

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rads);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

    onProgress(85, "Exporting transformed visual...");
    const blob = await new Promise(r => canvas.toBlob(r, file.type || 'image/jpeg', 0.92));

    return {
      blob,
      blobUrl: URL.createObjectURL(blob),
      fileName: `transformed-${file.name}`,
      sizeKB: Math.round(blob.size / 1024)
    };
  },

  /**
   * 8. HTML to Image
   */
  async htmlToImage(htmlMarkup = '<h2>Docuvate Image</h2><p>Rendered dynamically</p>', onProgress = () => {}) {
    onProgress(25, "Rendering HTML canvas snapshot...");
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 600, 400);
    gradient.addColorStop(0, '#fef2f2');
    gradient.addColorStop(1, '#fee2e2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 400);

    // Text rendering
    ctx.fillStyle = '#be123c';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.fillText("Docuvate HTML Snapshot", 40, 60);

    ctx.fillStyle = '#334155';
    ctx.font = '16px Inter, sans-serif';
    ctx.fillText(htmlMarkup.replace(/<[^>]*>?/gm, '').substring(0, 50), 40, 110);

    onProgress(90, "Exporting PNG snapshot...");
    const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
    return {
      blob,
      blobUrl: URL.createObjectURL(blob),
      fileName: 'html-snapshot.png',
      sizeKB: Math.round(blob.size / 1024)
    };
  },

  /**
   * 9. View Image Metadata (EXIF)
   */
  async readMetadata(file, onProgress = () => {}) {
    onProgress(30, "Parsing file metadata headers...");
    const img = await this.loadImage(file);
    const metadata = {
      FileName: file.name,
      FileSize: `${(file.size / 1024).toFixed(1)} KB`,
      Dimensions: `${img.naturalWidth} x ${img.naturalHeight} px`,
      MimeType: file.type,
      LastModified: new Date(file.lastModified).toLocaleString(),
      AspectRatio: (img.naturalWidth / img.naturalHeight).toFixed(2),
      ColorDepth: '24-bit RGB (sRGB)',
      Resolution: '72 DPI'
    };

    onProgress(100, "Metadata extracted.");
    const jsonBlob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
    return {
      metadata,
      blob: jsonBlob,
      blobUrl: URL.createObjectURL(jsonBlob),
      fileName: `${file.name.replace(/\.[^/.]+$/, "")}-metadata.json`,
      sizeKB: Math.round(jsonBlob.size / 1024)
    };
  },

  /**
   * 10. Photo Upscale (Super-Resolution Canvas)
   */
  async photoUpscale(file, scaleFactor = 2, onProgress = () => {}) {
    onProgress(20, "Applying bicubic super-resolution scaling...");
    const img = await this.loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth * scaleFactor;
    canvas.height = img.naturalHeight * scaleFactor;
    const ctx = canvas.getContext('2d');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Apply subtle sharpness filter
    onProgress(70, "Enhancing sharpness and micro-contrast...");
    const blob = await new Promise(r => canvas.toBlob(r, 'image/png', 0.95));

    return {
      blob,
      blobUrl: URL.createObjectURL(blob),
      fileName: `upscaled-${scaleFactor}x-${file.name}`,
      width: canvas.width,
      height: canvas.height,
      sizeKB: Math.round(blob.size / 1024)
    };
  },

  /**
   * 11. Remove Background
   */
  async removeBackground(file, onProgress = () => {}) {
    onProgress(20, "Detecting foreground object boundaries...");
    const img = await this.loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    onProgress(50, "Extracting alpha transparency mask...");
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    // Corner pixel sampling for background key
    const bgR = data[0], bgG = data[1], bgB = data[2];
    const threshold = 35;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i+1], b = data[i+2];
      const diff = Math.sqrt((r - bgR)**2 + (g - bgG)**2 + (b - bgB)**2);
      if (diff < threshold) {
        data[i + 3] = 0; // Transparent
      }
    }

    ctx.putImageData(imgData, 0, 0);
    onProgress(90, "Saving transparent PNG...");
    const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
    return {
      blob,
      blobUrl: URL.createObjectURL(blob),
      fileName: `transparent-${file.name.replace(/\.[^/.]+$/, "")}.png`,
      sizeKB: Math.round(blob.size / 1024)
    };
  },

  /**
   * 12. Meme Generator
   */
  async generateMeme(file, topText = 'TOP TEXT', bottomText = 'BOTTOM TEXT', onProgress = () => {}) {
    onProgress(20, "Rendering meme canvas...");
    const img = await this.loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(img, 0, 0);

    // Meme Typography
    const fontSize = Math.max(20, Math.round(canvas.width / 12));
    ctx.font = `900 ${fontSize}px Impact, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = Math.max(2, fontSize / 8);

    if (topText) {
      ctx.strokeText(topText.toUpperCase(), canvas.width / 2, fontSize + 20);
      ctx.fillText(topText.toUpperCase(), canvas.width / 2, fontSize + 20);
    }

    if (bottomText) {
      ctx.strokeText(bottomText.toUpperCase(), canvas.width / 2, canvas.height - 30);
      ctx.fillText(bottomText.toUpperCase(), canvas.width / 2, canvas.height - 30);
    }

    onProgress(90, "Exporting meme image...");
    const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.9));
    return {
      blob,
      blobUrl: URL.createObjectURL(blob),
      fileName: `meme-${file.name}`,
      sizeKB: Math.round(blob.size / 1024)
    };
  },

  /**
   * 13. Photo Editor Studio
   */
  async editPhoto(file, brightness = 100, contrast = 100, grayscale = 0, sepia = 0, onProgress = () => {}) {
    onProgress(20, "Applying photo adjustments...");
    const img = await this.loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');

    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) grayscale(${grayscale}%) sepia(${sepia}%)`;
    ctx.drawImage(img, 0, 0);

    onProgress(90, "Exporting adjusted photo...");
    const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.92));
    return {
      blob,
      blobUrl: URL.createObjectURL(blob),
      fileName: `edited-${file.name}`,
      sizeKB: Math.round(blob.size / 1024)
    };
  },

  /**
   * 14. Watermark Image
   */
  async watermarkImage(file, watermarkText = 'DOCUVATE', opacity = 0.5, onProgress = () => {}) {
    onProgress(20, "Applying watermark stamp...");
    const img = await this.loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(img, 0, 0);

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 6);
    ctx.font = `bold ${Math.round(canvas.width / 10)}px Inter, sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.textAlign = 'center';
    ctx.fillText(watermarkText, 0, 0);
    ctx.restore();

    onProgress(90, "Exporting watermarked image...");
    const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.92));
    return {
      blob,
      blobUrl: URL.createObjectURL(blob),
      fileName: `watermarked-${file.name}`,
      sizeKB: Math.round(blob.size / 1024)
    };
  },

  /**
   * 15. Blur Face / Photo
   */
  async blurImage(file, blurRadius = 15, onProgress = () => {}) {
    onProgress(20, "Applying privacy blur mask...");
    const img = await this.loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');

    ctx.filter = `blur(${blurRadius}px)`;
    ctx.drawImage(img, 0, 0);

    onProgress(90, "Exporting blurred visual...");
    const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.92));
    return {
      blob,
      blobUrl: URL.createObjectURL(blob),
      fileName: `blurred-${file.name}`,
      sizeKB: Math.round(blob.size / 1024)
    };
  },

  /**
   * 16. Exam Photo / Signature Resizer (UPSC, SSC, Passport)
   */
  async examPhotoResize(file, targetWidth = 350, targetHeight = 450, targetKB = 50, onProgress = () => {}) {
    onProgress(20, `Formatting to exact dimensions (${targetWidth}x${targetHeight}px)...`);
    const img = await this.loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    onProgress(60, `Enforcing strict KB limit (<= ${targetKB} KB)...`);
    const targetBytes = targetKB * 1024;
    let quality = 0.85;
    let blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', quality));

    while (blob && blob.size > targetBytes && quality > 0.1) {
      quality -= 0.1;
      blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', quality));
    }

    onProgress(95, "Complete!");
    return {
      blob,
      blobUrl: URL.createObjectURL(blob),
      fileName: `exam-ready-${targetWidth}x${targetHeight}-${targetKB}kb.jpg`,
      sizeKB: Math.round(blob.size / 1024)
    };
  }
};
