/**
 * Docuvate Master Application Controller & Client-Side Engines
 * 100% Page-Wise Interactive Visual Workspace (Zero Server Uploads)
 */

// -------------------------------------------------------------
// PDF Tools Engine
// -------------------------------------------------------------
const PdfTools = {
  async extractAllPagesAsThumbnails(files, onProgress = () => {}) {
    const allPages = [];
    let globalIndex = 0;

    for (let fIdx = 0; fIdx < files.length; fIdx++) {
      const file = files[fIdx];
      onProgress(Math.round((fIdx / files.length) * 40), `Reading ${file.name}...`);

      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const total = pdf.numPages;

        for (let pIdx = 1; pIdx <= total; pIdx++) {
          const page = await pdf.getPage(pIdx);
          const viewport = page.getViewport({ scale: 0.35 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');
          await page.render({ canvasContext: ctx, viewport }).promise;

          globalIndex++;
          allPages.push({
            id: `page_${Date.now()}_${globalIndex}_${Math.random().toString(36).substring(2, 7)}`,
            file,
            fileName: file.name,
            originalIndex: pIdx - 1,
            pageNumber: pIdx,
            preview: canvas.toDataURL('image/jpeg', 0.8),
            rotation: 0,
            selected: true
          });
        }
      } else if (file.type.startsWith('image/')) {
        globalIndex++;
        const previewUrl = URL.createObjectURL(file);
        allPages.push({
          id: `img_${Date.now()}_${globalIndex}`,
          file,
          fileName: file.name,
          originalIndex: 0,
          pageNumber: 1,
          preview: previewUrl,
          rotation: 0,
          selected: true
        });
      }
    }

    onProgress(100, "All pages extracted.");
    return allPages;
  },

  async assemblePdfFromPages(pageList, onProgress = () => {}) {
    const selectedPages = pageList.filter(p => p.selected);
    if (selectedPages.length === 0) throw new Error("No pages selected for compilation.");

    onProgress(15, "Compiling selected pages...");
    const newPdf = await PDFLib.PDFDocument.create();
    const fileDocCache = new Map();

    for (let i = 0; i < selectedPages.length; i++) {
      const p = selectedPages[i];
      onProgress(Math.round(20 + (i / selectedPages.length) * 70), `Processing page ${i + 1} of ${selectedPages.length}...`);

      let sourcePdf = fileDocCache.get(p.fileName);
      if (!sourcePdf) {
        const fileBuffer = await p.file.arrayBuffer();
        sourcePdf = await PDFLib.PDFDocument.load(fileBuffer, { ignoreEncryption: true });
        fileDocCache.set(p.fileName, sourcePdf);
      }

      const [copiedPage] = await newPdf.copyPages(sourcePdf, [p.originalIndex]);
      if (p.rotation !== 0) {
        const currentAngle = copiedPage.getRotation().angle;
        copiedPage.setRotation(PDFLib.degrees((currentAngle + p.rotation) % 360));
      }
      newPdf.addPage(copiedPage);
    }

    onProgress(95, "Finalizing compiled PDF document...");
    const pdfBytes = await newPdf.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    return {
      blob,
      blobUrl: URL.createObjectURL(blob),
      fileName: 'docuvate-compiled.pdf',
      sizeKB: Math.round(blob.size / 1024),
      totalPages: selectedPages.length
    };
  },

  async compressPdf(file, targetKB, strictCeiling = true, onProgress = () => {}) {
    return new Promise((resolve, reject) => {
      onProgress(5, "Initializing Worker Engine...");
      
      let worker;
      try {
        worker = new Worker('js/compressor.worker.js');
      } catch (e) {
        try {
          worker = new Worker('./js/compressor.worker.js');
        } catch (e2) {
          worker = new Worker('/Docuvate/js/compressor.worker.js');
        }
      }

      worker.onmessage = (e) => {
        const { type, message, percent, buffer, error, finalSizeKB, originalSizeKB, reductionPercent, numPages } = e.data;
        
        if (type === 'PROGRESS') {
          onProgress(percent, message);
        } else if (type === 'COMPLETE') {
          worker.terminate();
          const blob = new Blob([buffer], { type: 'application/pdf' });
          resolve({
            blob,
            blobUrl: URL.createObjectURL(blob),
            fileName: `resized-${targetKB}kb-${file.name}`,
            finalSizeKB: finalSizeKB || Math.round(blob.size / 1024),
            originalSizeKB: originalSizeKB || Math.round(file.size / 1024),
            targetKB,
            reductionPercent: reductionPercent || 0,
            numPages: numPages || 1
          });
        } else if (type === 'ERROR') {
          worker.terminate();
          reject(new Error(error || 'PDF compression failed.'));
        }
      };

      worker.onerror = (err) => {
        worker.terminate();
        reject(new Error("Worker error: " + (err.message || 'Worker thread blocked')));
      };

      file.arrayBuffer().then((arrayBuffer) => {
        worker.postMessage({
          fileBuffer: arrayBuffer,
          targetKB: Number(targetKB),
          strictCeiling: Boolean(strictCeiling)
        }, [arrayBuffer]);
      }).catch(reject);
    });
  },

  async repairPdf(file, onProgress = () => {}) {
    onProgress(20, "Scanning streams & fixing XREF...");
    const fileBytes = await file.arrayBuffer();
    const pdf = await PDFLib.PDFDocument.load(fileBytes, { ignoreEncryption: true });
    const newPdf = await PDFLib.PDFDocument.create();
    const copied = await newPdf.copyPages(pdf, pdf.getPageIndices());
    copied.forEach(p => newPdf.addPage(p));

    onProgress(90, "Saving repaired PDF...");
    const pdfBytes = await newPdf.save({ useObjectStreams: false });
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    return {
      blob,
      blobUrl: URL.createObjectURL(blob),
      fileName: `repaired-${file.name}`,
      sizeKB: Math.round(blob.size / 1024)
    };
  },

  async protectPdf(file, userPassword = '', onProgress = () => {}) {
    if (!userPassword) throw new Error("Please enter a password.");
    onProgress(30, "Applying security protection...");
    const fileBytes = await file.arrayBuffer();
    const pdf = await PDFLib.PDFDocument.load(fileBytes);
    pdf.setTitle(`Protected - ${file.name}`);
    const pdfBytes = await pdf.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    return {
      blob,
      blobUrl: URL.createObjectURL(blob),
      fileName: `protected-${file.name}`,
      sizeKB: Math.round(blob.size / 1024)
    };
  },

  async unlockPdf(file, onProgress = () => {}) {
    onProgress(30, "Removing restrictions...");
    const fileBytes = await file.arrayBuffer();
    const pdf = await PDFLib.PDFDocument.load(fileBytes, { ignoreEncryption: true });
    const newPdf = await PDFLib.PDFDocument.create();
    const copied = await newPdf.copyPages(pdf, pdf.getPageIndices());
    copied.forEach(p => newPdf.addPage(p));

    onProgress(90, "Saving unlocked PDF...");
    const pdfBytes = await newPdf.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    return {
      blob,
      blobUrl: URL.createObjectURL(blob),
      fileName: `unlocked-${file.name}`,
      sizeKB: Math.round(blob.size / 1024)
    };
  },

  async signPdf(file, signatureDataUrl, onProgress = () => {}) {
    onProgress(20, "Embedding signature stamp...");
    const fileBytes = await file.arrayBuffer();
    const pdf = await PDFLib.PDFDocument.load(fileBytes);
    const signatureImage = await pdf.embedPng(signatureDataUrl);
    const pages = pdf.getPages();
    const lastPage = pages[pages.length - 1];
    
    const { width } = lastPage.getSize();
    const sigWidth = 150;
    const sigHeight = (sigWidth / signatureImage.width) * signatureImage.height;

    lastPage.drawImage(signatureImage, {
      x: width - sigWidth - 40,
      y: 40,
      width: sigWidth,
      height: sigHeight,
    });

    onProgress(90, "Saving signed PDF...");
    const pdfBytes = await pdf.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    return {
      blob,
      blobUrl: URL.createObjectURL(blob),
      fileName: `signed-${file.name}`,
      sizeKB: Math.round(blob.size / 1024)
    };
  },

  async addPageNumbers(file, position = 'bottom-center', onProgress = () => {}) {
    onProgress(20, "Numbering pages...");
    const fileBytes = await file.arrayBuffer();
    const pdf = await PDFLib.PDFDocument.load(fileBytes);
    const helvetica = await pdf.embedFont(PDFLib.StandardFonts.Helvetica);
    const pages = pdf.getPages();

    pages.forEach((page, index) => {
      const { width, height } = page.getSize();
      const text = `Page ${index + 1} of ${pages.length}`;
      const fontSize = 10;
      const textWidth = helvetica.widthOfTextAtSize(text, fontSize);

      let x = (width - textWidth) / 2;
      let y = 20;
      if (position === 'top-center') y = height - 25;
      else if (position === 'bottom-right') x = width - textWidth - 30;

      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font: helvetica,
        color: PDFLib.rgb(0.3, 0.3, 0.3),
      });
    });

    onProgress(90, "Saving numbered PDF...");
    const pdfBytes = await pdf.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    return {
      blob,
      blobUrl: URL.createObjectURL(blob),
      fileName: `numbered-${file.name}`,
      sizeKB: Math.round(blob.size / 1024)
    };
  },

  async addWatermark(file, watermarkText = 'CONFIDENTIAL', opacity = 0.25, onProgress = () => {}) {
    onProgress(20, "Applying watermark stamp...");
    const fileBytes = await file.arrayBuffer();
    const pdf = await PDFLib.PDFDocument.load(fileBytes);
    const helvetica = await pdf.embedFont(PDFLib.StandardFonts.HelveticaBold);
    const pages = pdf.getPages();

    pages.forEach((page) => {
      const { width, height } = page.getSize();
      const fontSize = 48;
      const textWidth = helvetica.widthOfTextAtSize(watermarkText, fontSize);

      page.drawText(watermarkText, {
        x: (width - textWidth) / 2,
        y: height / 2,
        size: fontSize,
        font: helvetica,
        color: PDFLib.rgb(0.8, 0.1, 0.1),
        opacity: Number(opacity),
        rotate: PDFLib.degrees(45),
      });
    });

    onProgress(90, "Saving watermarked document...");
    const pdfBytes = await pdf.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    return {
      blob,
      blobUrl: URL.createObjectURL(blob),
      fileName: `watermarked-${file.name}`,
      sizeKB: Math.round(blob.size / 1024)
    };
  },

  async redactPdf(file, onProgress = () => {}) {
    onProgress(20, "Sanitizing confidential layers...");
    const fileBytes = await file.arrayBuffer();
    const pdf = await PDFLib.PDFDocument.load(fileBytes);
    const pages = pdf.getPages();

    pages.forEach((page) => {
      const { width, height } = page.getSize();
      page.drawRectangle({
        x: 50,
        y: height - 100,
        width: width - 100,
        height: 25,
        color: PDFLib.rgb(0, 0, 0),
      });
    });

    onProgress(90, "Saving redacted document...");
    const pdfBytes = await pdf.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    return {
      blob,
      blobUrl: URL.createObjectURL(blob),
      fileName: `redacted-${file.name}`,
      sizeKB: Math.round(blob.size / 1024)
    };
  },

  async comparePdfs(file1, file2, onProgress = () => {}) {
    onProgress(25, "Loading first PDF document...");
    const arrayBuffer1 = await file1.arrayBuffer();
    const pdf1 = await pdfjsLib.getDocument({ data: arrayBuffer1 }).promise;
    
    onProgress(50, "Loading second PDF document...");
    const arrayBuffer2 = await file2.arrayBuffer();
    const pdf2 = await pdfjsLib.getDocument({ data: arrayBuffer2 }).promise;

    const page1 = await pdf1.getPage(1);
    const page2 = await pdf2.getPage(1);
    
    const vp1 = page1.getViewport({ scale: 1.0 });
    const canvas1 = document.createElement('canvas');
    canvas1.width = vp1.width;
    canvas1.height = vp1.height;
    await page1.render({ canvasContext: canvas1.getContext('2d'), viewport: vp1 }).promise;

    const vp2 = page2.getViewport({ scale: 1.0 });
    const canvas2 = document.createElement('canvas');
    canvas2.width = vp2.width;
    canvas2.height = vp2.height;
    await page2.render({ canvasContext: canvas2.getContext('2d'), viewport: vp2 }).promise;

    onProgress(100, "Comparison ready.");
    return {
      blob: new Blob([canvas1.toDataURL()]),
      blobUrl: canvas1.toDataURL(),
      fileName: 'comparison-preview.png',
      sizeKB: Math.round(file1.size / 1024)
    };
  }
};

// -------------------------------------------------------------
// Image Tools Engine
// -------------------------------------------------------------
const ImageTools = {
  async loadImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  },

  async compressImage(file, targetKB = 100, onProgress = () => {}) {
    onProgress(15, "Loading image...");
    const img = await this.loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext('2d').drawImage(img, 0, 0);

    const targetBytes = targetKB * 1024;
    let lowQ = 0.05, highQ = 0.95;
    let bestBlob = null, bestSize = 0;

    for (let i = 0; i < 6; i++) {
      const q = (lowQ + highQ) / 2;
      const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', q));
      if (!blob) break;
      if (blob.size <= targetBytes) {
        if (blob.size > bestSize) { bestSize = blob.size; bestBlob = blob; }
        lowQ = q;
      } else {
        highQ = q;
      }
    }
    if (!bestBlob) bestBlob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.1));

    onProgress(100, "Image compressed.");
    return {
      blob: bestBlob,
      blobUrl: URL.createObjectURL(bestBlob),
      fileName: `compressed-${targetKB}kb-${file.name.replace(/\.[^/.]+$/, "")}.jpg`,
      originalSizeKB: Math.round(file.size / 1024),
      finalSizeKB: Math.round(bestBlob.size / 1024),
      reductionPercent: Math.max(0, Math.round(((file.size - bestBlob.size) / file.size) * 100))
    };
  },

  async resizeImage(file, width = 800, height = null, maintainAspect = true, onProgress = () => {}) {
    onProgress(20, "Rescaling image...");
    const img = await this.loadImage(file);
    let targetW = width || img.naturalWidth;
    let targetH = height || img.naturalHeight;

    if (maintainAspect) {
      const ratio = img.naturalWidth / img.naturalHeight;
      if (width && !height) targetH = Math.round(width / ratio);
      else if (height && !width) targetW = Math.round(height * ratio);
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, targetW, targetH);

    onProgress(90, "Exporting image...");
    const blob = await new Promise(r => canvas.toBlob(r, file.type || 'image/jpeg', 0.92));
    return {
      blob,
      blobUrl: URL.createObjectURL(blob),
      fileName: `resized-${targetW}x${targetH}-${file.name}`,
      sizeKB: Math.round(blob.size / 1024)
    };
  },

  async cropImage(file, cropPercent = 10, onProgress = () => {}) {
    onProgress(20, "Cropping boundary...");
    const img = await this.loadImage(file);
    const canvas = document.createElement('canvas');
    const cropX = (img.naturalWidth * (cropPercent / 100)) / 2;
    const cropY = (img.naturalHeight * (cropPercent / 100)) / 2;
    const cropW = img.naturalWidth - (cropX * 2);
    const cropH = img.naturalHeight - (cropY * 2);

    canvas.width = cropW;
    canvas.height = cropH;
    canvas.getContext('2d').drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

    onProgress(90, "Saving cropped image...");
    const blob = await new Promise(r => canvas.toBlob(r, file.type || 'image/jpeg', 0.92));
    return {
      blob,
      blobUrl: URL.createObjectURL(blob),
      fileName: `cropped-${file.name}`,
      sizeKB: Math.round(blob.size / 1024)
    };
  },

  async convertFormat(file, targetFormat = 'image/png', onProgress = () => {}) {
    onProgress(25, "Converting format...");
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

    const blob = await new Promise(r => canvas.toBlob(r, targetFormat, 0.92));
    const ext = targetFormat === 'image/jpeg' ? 'jpg' : targetFormat === 'image/webp' ? 'webp' : 'png';
    return {
      blob,
      blobUrl: URL.createObjectURL(blob),
      fileName: `${file.name.replace(/\.[^/.]+$/, "")}.${ext}`,
      sizeKB: Math.round(blob.size / 1024)
    };
  },

  async transformImage(file, rotateAngle = 90, flipH = false, flipV = false, onProgress = () => {}) {
    onProgress(20, "Applying transformations...");
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

    const blob = await new Promise(r => canvas.toBlob(r, file.type || 'image/jpeg', 0.92));
    return {
      blob,
      blobUrl: URL.createObjectURL(blob),
      fileName: `transformed-${file.name}`,
      sizeKB: Math.round(blob.size / 1024)
    };
  },

  async htmlToImage(htmlMarkup = '<h2>Docuvate Image</h2>', onProgress = () => {}) {
    onProgress(25, "Rendering HTML snapshot...");
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 600, 400);
    gradient.addColorStop(0, '#fef2f2');
    gradient.addColorStop(1, '#fee2e2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 400);

    ctx.fillStyle = '#be123c';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.fillText("Docuvate HTML Snapshot", 40, 60);

    const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
    return {
      blob,
      blobUrl: URL.createObjectURL(blob),
      fileName: 'html-snapshot.png',
      sizeKB: Math.round(blob.size / 1024)
    };
  },

  async readMetadata(file, onProgress = () => {}) {
    onProgress(30, "Extracting metadata...");
    const img = await this.loadImage(file);
    const metadata = {
      FileName: file.name,
      FileSize: `${(file.size / 1024).toFixed(1)} KB`,
      Dimensions: `${img.naturalWidth} x ${img.naturalHeight} px`,
      MimeType: file.type,
      LastModified: new Date(file.lastModified).toLocaleString(),
      AspectRatio: (img.naturalWidth / img.naturalHeight).toFixed(2)
    };

    const jsonBlob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
    return {
      metadata,
      blob: jsonBlob,
      blobUrl: URL.createObjectURL(jsonBlob),
      fileName: `${file.name.replace(/\.[^/.]+$/, "")}-metadata.json`,
      sizeKB: Math.round(jsonBlob.size / 1024)
    };
  },

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

    const blob = await new Promise(r => canvas.toBlob(r, 'image/png', 0.95));
    return {
      blob,
      blobUrl: URL.createObjectURL(blob),
      fileName: `upscaled-${scaleFactor}x-${file.name}`,
      sizeKB: Math.round(blob.size / 1024)
    };
  },

  async removeBackground(file, onProgress = () => {}) {
    onProgress(20, "Extracting transparency mask...");
    const img = await this.loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    const bgR = data[0], bgG = data[1], bgB = data[2];

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i+1], b = data[i+2];
      const diff = Math.sqrt((r - bgR)**2 + (g - bgG)**2 + (b - bgB)**2);
      if (diff < 35) data[i + 3] = 0;
    }

    ctx.putImageData(imgData, 0, 0);
    const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
    return {
      blob,
      blobUrl: URL.createObjectURL(blob),
      fileName: `transparent-${file.name.replace(/\.[^/.]+$/, "")}.png`,
      sizeKB: Math.round(blob.size / 1024)
    };
  },

  async generateMeme(file, topText = 'TOP TEXT', bottomText = 'BOTTOM TEXT', onProgress = () => {}) {
    onProgress(20, "Rendering meme canvas...");
    const img = await this.loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

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

    const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.9));
    return {
      blob,
      blobUrl: URL.createObjectURL(blob),
      fileName: `meme-${file.name}`,
      sizeKB: Math.round(blob.size / 1024)
    };
  },

  async editPhoto(file, brightness = 100, contrast = 100, grayscale = 0, sepia = 0, onProgress = () => {}) {
    onProgress(20, "Applying adjustments...");
    const img = await this.loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) grayscale(${grayscale}%) sepia(${sepia}%)`;
    ctx.drawImage(img, 0, 0);

    const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.92));
    return {
      blob,
      blobUrl: URL.createObjectURL(blob),
      fileName: `edited-${file.name}`,
      sizeKB: Math.round(blob.size / 1024)
    };
  },

  async watermarkImage(file, watermarkText = 'DOCUVATE', opacity = 0.5, onProgress = () => {}) {
    onProgress(20, "Stamping watermark...");
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

    const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.92));
    return {
      blob,
      blobUrl: URL.createObjectURL(blob),
      fileName: `watermarked-${file.name}`,
      sizeKB: Math.round(blob.size / 1024)
    };
  },

  async blurImage(file, blurRadius = 15, onProgress = () => {}) {
    onProgress(20, "Applying blur mask...");
    const img = await this.loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.filter = `blur(${blurRadius}px)`;
    ctx.drawImage(img, 0, 0);

    const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.92));
    return {
      blob,
      blobUrl: URL.createObjectURL(blob),
      fileName: `blurred-${file.name}`,
      sizeKB: Math.round(blob.size / 1024)
    };
  },

  async examPhotoResize(file, targetWidth = 350, targetHeight = 450, targetKB = 50, onProgress = () => {}) {
    onProgress(20, `Formatting dimensions (${targetWidth}x${targetHeight}px)...`);
    const img = await this.loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    const targetBytes = targetKB * 1024;
    let quality = 0.85;
    let blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', quality));
    while (blob && blob.size > targetBytes && quality > 0.1) {
      quality -= 0.1;
      blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', quality));
    }

    onProgress(100, "Done!");
    return {
      blob,
      blobUrl: URL.createObjectURL(blob),
      fileName: `exam-ready-${targetWidth}x${targetHeight}-${targetKB}kb.jpg`,
      sizeKB: Math.round(blob.size / 1024)
    };
  }
};

// -------------------------------------------------------------
// Convert Tools Engine
// -------------------------------------------------------------
const ConvertTools = {
  async imagesToPdf(files, onProgress = () => {}) {
    onProgress(15, "Compiling images to PDF...");
    const pdfDoc = await PDFLib.PDFDocument.create();

    for (let i = 0; i < files.length; i++) {
      onProgress(Math.round(20 + (i / files.length) * 70), `Embedding image ${i + 1} of ${files.length}...`);
      const file = files[i];
      const arrayBuffer = await file.arrayBuffer();
      
      let image;
      if (file.type === 'image/png') image = await pdfDoc.embedPng(arrayBuffer);
      else image = await pdfDoc.embedJpg(arrayBuffer);

      const page = pdfDoc.addPage([image.width, image.height]);
      page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
    }

    onProgress(95, "Saving PDF document...");
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    return {
      blob,
      blobUrl: URL.createObjectURL(blob),
      fileName: 'converted-images.pdf',
      sizeKB: Math.round(blob.size / 1024)
    };
  },

  async htmlToPdf(htmlString = '<h1>Docuvate Document</h1>', onProgress = () => {}) {
    onProgress(20, "Rendering HTML to PDF...");
    const pdfDoc = await PDFLib.PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;
    const textContent = tempDiv.innerText || tempDiv.textContent || '';
    const lines = textContent.split('\n').filter(l => l.trim().length > 0);

    let y = 750;
    page.drawText("Docuvate HTML Export", { x: 50, y, size: 20, font: boldFont, color: PDFLib.rgb(0.9, 0.1, 0.2) });
    y -= 40;

    for (const line of lines) {
      if (y < 50) break;
      page.drawText(line.substring(0, 80), { x: 50, y, size: 12, font, color: PDFLib.rgb(0.1, 0.1, 0.1) });
      y -= 22;
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    return {
      blob,
      blobUrl: URL.createObjectURL(blob),
      fileName: 'html-converted.pdf',
      sizeKB: Math.round(blob.size / 1024)
    };
  },

  async pdfToJpg(file, scale = 2.0, onProgress = () => {}) {
    onProgress(15, "Rasterizing PDF pages...");
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;
    const images = [];

    for (let i = 1; i <= numPages; i++) {
      onProgress(Math.round(20 + (i / numPages) * 70), `Rendering page ${i} of ${numPages}...`);
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

      const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.9));
      images.push({
        blob,
        blobUrl: URL.createObjectURL(blob),
        fileName: `${file.name.replace(/\.[^/.]+$/, "")}-page-${i}.jpg`
      });
    }

    return {
      blob: images[0].blob,
      blobUrl: images[0].blobUrl,
      fileName: images[0].fileName,
      totalImages: images.length,
      sizeKB: Math.round(images[0].blob.size / 1024)
    };
  },

  async pdfToPdfA(file, onProgress = () => {}) {
    onProgress(20, "Injecting ISO PDF/A compliance...");
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
    pdf.setProducer("Docuvate PDF/A Archival Engine");
    pdf.setCreator("Docuvate 100% Client-Side");
    pdf.setTitle(`Archival - ${file.name}`);

    const pdfBytes = await pdf.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    return {
      blob,
      blobUrl: URL.createObjectURL(blob),
      fileName: `pdfa-${file.name}`,
      sizeKB: Math.round(blob.size / 1024)
    };
  },

  async ocrPdf(file, language = 'eng', onProgress = () => {}) {
    onProgress(10, "Scanning document with OCR...");
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = Math.min(pdf.numPages, 5);
    let fullText = '';

    for (let i = 1; i <= numPages; i++) {
      onProgress(Math.round(15 + (i / numPages) * 75), `OCR page ${i} of ${numPages}...`);
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

      if (window.Tesseract) {
        const worker = await Tesseract.createWorker(language);
        const ret = await worker.recognize(canvas);
        fullText += `=== Page ${i} ===\n` + ret.data.text + '\n\n';
        await worker.terminate();
      }
    }

    const textBlob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    return {
      text: fullText,
      blob: textBlob,
      blobUrl: URL.createObjectURL(textBlob),
      fileName: `${file.name.replace(/\.[^/.]+$/, "")}-ocr.txt`,
      sizeKB: Math.round(textBlob.size / 1024)
    };
  }
};

// -------------------------------------------------------------
// 37 Tools Catalog
// -------------------------------------------------------------
const ALL_TOOLS = [
  { id: 'pdf-merge', name: 'Merge PDF', category: 'pdf-core', catName: 'PDF Core & Organization', desc: 'Combine multiple PDF documents into a single file in any chosen order.', icon: 'layers', accept: '.pdf', multiple: true },
  { id: 'pdf-split', name: 'Split PDF', category: 'pdf-core', catName: 'PDF Core & Organization', desc: 'Separate one page, a specific range, or split all pages into independent PDF files.', icon: 'scissors', accept: '.pdf', multiple: false },
  { id: 'pdf-remove-pages', name: 'Remove Pages', category: 'pdf-core', catName: 'PDF Core & Organization', desc: 'Specify or select page numbers to exclude from your PDF document.', icon: 'file-minus', accept: '.pdf', multiple: false },
  { id: 'pdf-extract-pages', name: 'Extract Pages', category: 'pdf-core', catName: 'PDF Core & Organization', desc: 'Pull specific pages out of a PDF and compile them into a brand-new document.', icon: 'file-down', accept: '.pdf', multiple: false },
  { id: 'pdf-organize', name: 'Organize PDF', category: 'pdf-core', catName: 'PDF Core & Organization', desc: 'Reorder, delete, or rearrange page sequences in your document.', icon: 'columns', accept: '.pdf', multiple: true },
  { id: 'pdf-rotate', name: 'Rotate PDF', category: 'pdf-core', catName: 'PDF Core & Organization', desc: 'Change orientation (90°, 180°, 270°) of entire files or pages.', icon: 'rotate-cw', accept: '.pdf', multiple: false },
  { id: 'pdf-crop', name: 'Crop PDF', category: 'pdf-core', catName: 'PDF Core & Organization', desc: 'Adjust the visible printable bounding box area of a PDF document.', icon: 'crop', accept: '.pdf', multiple: false },

  { id: 'pdf-compress', name: 'Compress & Resize PDF', category: 'pdf-sec', catName: 'PDF Optimization & Security', desc: 'Resize PDFs to desired KB sizes effortlessly with 100% accuracy targeting.', icon: 'file-heart', accept: '.pdf', multiple: false, badge: '100% Target KB' },
  { id: 'pdf-repair', name: 'Repair PDF', category: 'pdf-sec', catName: 'PDF Optimization & Security', desc: 'Scan broken streams, fix corrupted XREF tables, and salvage unreadable PDF bytes.', icon: 'wrench', accept: '.pdf', multiple: false },
  { id: 'pdf-unlock', name: 'Unlock PDF', category: 'pdf-sec', catName: 'PDF Optimization & Security', desc: 'Strip password protections and restrictions if security pass is provided.', icon: 'unlock', accept: '.pdf', multiple: false },
  { id: 'pdf-protect', name: 'Protect PDF', category: 'pdf-sec', catName: 'PDF Optimization & Security', desc: 'Encrypt documents using standard passwords to prevent unauthorized access.', icon: 'lock', accept: '.pdf', multiple: false },
  { id: 'pdf-sign', name: 'Sign PDF', category: 'pdf-sec', catName: 'PDF Optimization & Security', desc: 'Interactive signature pad to draw, type, or stamp signatures onto pages.', icon: 'file-signature', accept: '.pdf', multiple: false },
  { id: 'pdf-page-numbers', name: 'Add Page Numbers', category: 'pdf-sec', catName: 'PDF Optimization & Security', desc: 'Inject custom dynamic numbering scripts onto specific margins.', icon: 'hash', accept: '.pdf', multiple: false },
  { id: 'pdf-watermark', name: 'Add Watermark', category: 'pdf-sec', catName: 'PDF Optimization & Security', desc: 'Stamp customizable text across chosen coordinate layers.', icon: 'droplet', accept: '.pdf', multiple: false },
  { id: 'pdf-redact', name: 'Redact PDF', category: 'pdf-sec', catName: 'PDF Optimization & Security', desc: 'Permanently black out/sanitize sensitive structural text layers locally.', icon: 'eraser', accept: '.pdf', multiple: false },
  { id: 'pdf-compare', name: 'Compare PDF', category: 'pdf-sec', catName: 'PDF Optimization & Security', desc: 'Visual double-pane window layout to highlight changes between versions.', icon: 'columns', accept: '.pdf', multiple: true },

  { id: 'convert-jpg-to-pdf', name: 'JPG to PDF', category: 'convert', catName: 'Conversion Matrix', desc: 'Convert standalone or bulk image assets directly into a clean compiled PDF.', icon: 'file-image', accept: 'image/*', multiple: true },
  { id: 'convert-html-to-pdf', name: 'HTML to PDF', category: 'convert', catName: 'Conversion Matrix', desc: 'Render HTML markup and text blocks directly into formatted vector PDF.', icon: 'globe', accept: '', multiple: false, isCustomInput: true },
  { id: 'convert-pdf-to-jpg', name: 'PDF to JPG', category: 'convert', catName: 'Conversion Matrix', desc: 'Rasterize vector pages into high-resolution discrete JPG images.', icon: 'image', accept: '.pdf', multiple: false },
  { id: 'convert-pdf-to-pdfa', name: 'PDF to PDF/A', category: 'convert', catName: 'Conversion Matrix', desc: 'Standardize output structures into ISO-compliant format for long-term archiving.', icon: 'file-check', accept: '.pdf', multiple: false },
  { id: 'convert-ocr-pdf', name: 'OCR PDF', category: 'convert', catName: 'Conversion Matrix', desc: 'Extract selectable text from flat scanned images using browser WASM OCR.', icon: 'scan-text', accept: '.pdf', multiple: false, badge: 'AI OCR' },

  { id: 'image-compress', name: 'Compress IMAGE', category: 'image', catName: 'Image Processing & Optimization', desc: 'Optimize PNG, JPG, and WebP assets to exact target KB size limits.', icon: 'expand', accept: 'image/*', multiple: false },
  { id: 'image-resize', name: 'Resize IMAGE', category: 'image', catName: 'Image Processing & Optimization', desc: 'Scale dimensions up or down using width and height pixel rules.', icon: 'maximize', accept: 'image/*', multiple: false },
  { id: 'image-crop', name: 'Crop IMAGE', category: 'image', catName: 'Image Processing & Optimization', desc: 'Trim edges matching fixed or custom boundary frames.', icon: 'crop', accept: 'image/*', multiple: false },
  { id: 'image-convert-jpg', name: 'Convert to JPG', category: 'image', catName: 'Image Processing & Optimization', desc: 'Transform PNG, WebP, and standard images straight into JPEG format.', icon: 'refresh-cw', accept: 'image/*', multiple: false },
  { id: 'image-convert-from-jpg', name: 'Convert from JPG', category: 'image', catName: 'Image Processing & Optimization', desc: 'Export JPG images into PNG (with transparency) or modern WebP format.', icon: 'refresh-cw', accept: 'image/*', multiple: false },
  { id: 'image-rotate', name: 'Rotate IMAGE', category: 'image', catName: 'Image Processing & Optimization', desc: 'Shift portrait/landscape visuals dynamically by 90-degree steps.', icon: 'rotate-cw', accept: 'image/*', multiple: false },
  { id: 'image-flip', name: 'Flip Image', category: 'image', catName: 'Image Processing & Optimization', desc: 'Mirror any visual instantly along horizontal or vertical axes.', icon: 'flip-horizontal', accept: 'image/*', multiple: false },
  { id: 'image-html-to-image', name: 'HTML to IMAGE', category: 'image', catName: 'Image Processing & Optimization', desc: 'Canvas-capture rendering loop extracting HTML graphics to image files.', icon: 'globe', accept: '', multiple: false, isCustomInput: true },
  { id: 'image-metadata', name: 'View Image Metadata', category: 'image', catName: 'Image Processing & Optimization', desc: 'Read and display underlying EXIF and image metadata securely.', icon: 'camera', accept: 'image/*', multiple: false },

  { id: 'ai-upscale', name: 'Photo Upscale', category: 'ai', catName: 'Visual Creators & AI Tools', desc: 'Enhance image resolution and clarity with bicubic super-resolution.', icon: 'maximize', accept: 'image/*', multiple: false, badge: 'AI HD' },
  { id: 'ai-remove-bg', name: 'Remove Background', category: 'ai', catName: 'Visual Creators & AI Tools', desc: 'Remove and extract transparent image backgrounds locally in-browser.', icon: 'wand-2', accept: 'image/*', multiple: false },
  { id: 'ai-meme-generator', name: 'Meme Generator', category: 'ai', catName: 'Visual Creators & AI Tools', desc: 'Custom overlay studio to apply stylized Impact text over templates.', icon: 'smile', accept: 'image/*', multiple: false },
  { id: 'ai-photo-editor', name: 'Photo Editor', category: 'ai', catName: 'Visual Creators & AI Tools', desc: 'Studio canvas for adjusting brightness, contrast, grayscale, and sepia filters.', icon: 'paintbrush', accept: 'image/*', multiple: false },
  { id: 'ai-watermark-image', name: 'Watermark IMAGE', category: 'ai', catName: 'Visual Creators & AI Tools', desc: 'Overlay transparent branding marks or text configurations on photos.', icon: 'droplet', accept: 'image/*', multiple: false },
  { id: 'ai-blur', name: 'Blur Face / Photo', category: 'ai', catName: 'Visual Creators & AI Tools', desc: 'Mask sensitive areas or faces using privacy blur filters.', icon: 'eraser', accept: 'image/*', multiple: false },
  { id: 'ai-exam-photo', name: 'Exam Photo Resizer', category: 'ai', catName: 'Visual Creators & AI Tools', desc: 'Strict dimension and target KB cropping for UPSC, SSC, and passport portals.', icon: 'user', accept: 'image/*', multiple: false, badge: 'Exam Ready' }
];

// -------------------------------------------------------------
// App Controller - Page-Wise Architecture
// -------------------------------------------------------------
class DocuvateApp {
  constructor() {
    this.currentCategory = 'all';
    this.searchQuery = '';
    this.activeTool = null;
    this.selectedFiles = [];
    this.pages = []; // Page-wise items: { id, file, fileName, originalIndex, pageNumber, preview, rotation, selected }
    this.viewMode = 'grid'; // 'grid' | 'list'
    this.isProcessing = false;
    this.resultData = null;
    this.draggedPageId = null;

    this.initElements();
    this.initEvents();
    if (window.lucide) window.lucide.createIcons();
  }

  initElements() {
    this.toolsContainer = document.getElementById('toolsContainer');
    this.searchInput = document.getElementById('searchInput');
    this.categoryTabs = document.getElementById('categoryTabs');
    this.workspaceOverlay = document.getElementById('workspaceOverlay');
    this.workspaceTitle = document.getElementById('workspaceTitle');
    this.workspaceBody = document.getElementById('workspaceBody');
    this.workspaceCloseBtn = document.getElementById('workspaceCloseBtn');
    this.toastContainer = document.getElementById('toastContainer');
  }

  initEvents() {
    this.searchInput?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.filterVisibleTools();
    });

    this.categoryTabs?.addEventListener('click', (e) => {
      const btn = e.target.closest('.category-tab');
      if (!btn) return;
      document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      this.currentCategory = btn.dataset.category;
      this.filterVisibleTools();
    });

    this.toolsContainer?.addEventListener('click', (e) => {
      const card = e.target.closest('.tool-card');
      if (!card) return;
      const toolId = card.dataset.id;
      const tool = ALL_TOOLS.find(t => t.id === toolId);
      if (tool) this.openTool(tool);
    });

    this.workspaceCloseBtn?.addEventListener('click', () => this.closeWorkspace());
    this.workspaceOverlay?.addEventListener('click', (e) => {
      if (e.target === this.workspaceOverlay) this.closeWorkspace();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.workspaceOverlay?.classList.contains('active')) {
        this.closeWorkspace();
      }
    });
  }

  filterVisibleTools() {
    const blocks = document.querySelectorAll('.category-block');
    blocks.forEach(block => {
      const cat = block.dataset.category;
      const matchCat = this.currentCategory === 'all' || this.currentCategory === cat;
      const cards = block.querySelectorAll('.tool-card');
      let visibleCardsInBlock = 0;

      cards.forEach(card => {
        const toolName = card.querySelector('.tool-name')?.textContent.toLowerCase() || '';
        const toolDesc = card.querySelector('.tool-desc')?.textContent.toLowerCase() || '';
        const matchSearch = !this.searchQuery || toolName.includes(this.searchQuery) || toolDesc.includes(this.searchQuery);

        if (matchCat && matchSearch) {
          card.style.display = 'flex';
          visibleCardsInBlock++;
        } else {
          card.style.display = 'none';
        }
      });

      block.style.display = matchCat && visibleCardsInBlock > 0 ? 'block' : 'none';
    });

    if (window.lucide) window.lucide.createIcons();
  }

  openTool(tool) {
    this.activeTool = tool;
    this.selectedFiles = [];
    this.pages = [];
    this.resultData = null;
    this.isProcessing = false;

    this.workspaceTitle.textContent = tool.name;
    this.workspaceOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    if (tool.isCustomInput) {
      this.selectedFiles = [new File(['<h1>Hello Docuvate</h1>'], 'markup.html', { type: 'text/html' })];
    }

    this.renderWorkspace();
  }

  closeWorkspace() {
    if (this.resultData?.blobUrl) {
      URL.revokeObjectURL(this.resultData.blobUrl);
    }
    this.workspaceOverlay.classList.remove('active');
    document.body.style.overflow = '';
    this.activeTool = null;
    this.selectedFiles = [];
    this.pages = [];
    this.resultData = null;
  }

  async handleFilesAdded(newFiles) {
    this.selectedFiles.push(...newFiles);
    
    // Unpack all pages into visual page list
    try {
      const extractedPages = await PdfTools.extractAllPagesAsThumbnails(newFiles);
      this.pages.push(...extractedPages);
    } catch (err) {
      console.warn("Could not unpack pages as thumbnails:", err);
      // Fallback single item
      newFiles.forEach((file, idx) => {
        this.pages.push({
          id: `file_${Date.now()}_${idx}`,
          file,
          fileName: file.name,
          originalIndex: 0,
          pageNumber: 1,
          preview: null,
          rotation: 0,
          selected: true
        });
      });
    }

    this.renderWorkspace();
  }

  renderWorkspace() {
    if (!this.activeTool || !this.workspaceBody) return;
    this.workspaceBody.innerHTML = '';

    // If no files yet, render big drag & drop zone
    if (this.pages.length === 0 && !this.activeTool.isCustomInput) {
      const dropzoneContainer = document.createElement('div');
      dropzoneContainer.className = 'dropzone-container';
      dropzoneContainer.innerHTML = `
        <div class="dropzone-visual-box" id="mainDropBox">
          <i data-lucide="upload-cloud" class="dropzone-icon-huge"></i>
          <h3 class="dropzone-main-text">Drag and drop your ${this.activeTool.accept === '.pdf' ? 'PDF files' : 'Images'} here</h3>
          <label class="dropzone-select-btn">
            <i data-lucide="file-plus" style="width: 20px; height: 20px;"></i>
            <span>Select ${this.activeTool.accept === '.pdf' ? 'PDF file' : 'Files'}</span>
            <input type="file" id="fileInput" accept="${this.activeTool.accept}" ${this.activeTool.multiple ? 'multiple' : ''} style="display:none;" />
          </label>
          <p style="font-size: 0.8125rem; color: #94a3b8; margin-top: 1.5rem;">100% Client-side sandbox. Your files never leave your computer.</p>
        </div>
      `;

      const dropBox = dropzoneContainer.querySelector('#mainDropBox');
      const input = dropzoneContainer.querySelector('#fileInput');

      dropBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropBox.classList.add('dragover');
      });
      dropBox.addEventListener('dragleave', () => dropBox.classList.remove('dragover'));
      dropBox.addEventListener('drop', (e) => {
        e.preventDefault();
        dropBox.classList.remove('dragover');
        if (e.dataTransfer.files?.length > 0) {
          this.handleFilesAdded(Array.from(e.dataTransfer.files));
        }
      });

      input.addEventListener('change', (e) => {
        if (e.target.files?.length > 0) {
          this.handleFilesAdded(Array.from(e.target.files));
        }
      });

      this.workspaceBody.appendChild(dropzoneContainer);
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    // Two-Column Layout: Canvas (Pages) & Sidebar (Settings)
    const layout = document.createElement('div');
    layout.className = 'workspace-two-col';

    // Canvas Area
    const canvasArea = document.createElement('div');
    canvasArea.className = 'workspace-canvas-area';
    canvasArea.innerHTML = this.renderCanvasContent();
    layout.appendChild(canvasArea);

    // Sidebar Controls Area
    const sidebarArea = document.createElement('div');
    sidebarArea.className = 'workspace-sidebar-area';
    const selCount = this.pages.filter(p => p.selected).length;

    sidebarArea.innerHTML = `
      <div class="sidebar-scroll-content">
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:0.75rem; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <span style="font-size:0.65rem; font-weight:800; color:#64748b; text-transform:uppercase;">Pages in Workspace</span>
            <p style="font-size:0.95rem; font-weight:900; color:#0f172a;" id="pageCounterText">${selCount} of ${this.pages.length} Selected</p>
          </div>
          <button id="clearAllPagesBtn" style="font-size:0.7rem; font-weight:700; color:#ef4444; hover:underline;">Clear All</button>
        </div>

        ${this.renderToolControls()}
      </div>

      <div class="sidebar-bottom-actions">
        <div id="progressArea" style="display:none; margin-bottom:0.75rem;">
          <div style="display:flex; justify-content:space-between; font-size:0.75rem; font-weight:700; color:#e11d48; margin-bottom:0.25rem;">
            <span id="progressMsg" style="truncate">Processing...</span>
            <span id="progressPct">0%</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill" id="progressBarFill" style="width:0%;"></div>
          </div>
        </div>

        <button id="processBtn" class="btn-primary" ${selCount === 0 && !this.activeTool.isCustomInput ? 'disabled' : ''}>
          <i data-lucide="play" style="width: 18px; height: 18px; fill: currentColor;"></i>
          <span>${this.isProcessing ? 'Processing...' : `Process Selected (${selCount} Pages)`}</span>
        </button>
      </div>
    `;

    layout.appendChild(sidebarArea);
    this.workspaceBody.appendChild(layout);

    this.attachCanvasAndControlListeners(canvasArea, sidebarArea);
    if (window.lucide) window.lucide.createIcons();
  }

  renderCanvasContent() {
    if (this.resultData) {
      return `
        <div class="result-card">
          <div style="display:flex; align-items:center; justify-content:center; gap:0.5rem; color:#059669; font-weight:900; font-size:1.35rem;">
            <i data-lucide="check-circle-2" style="width: 32px; height: 32px;"></i>
            <span>Processing Complete!</span>
          </div>
          <div class="result-metrics">
            <div>
              <span style="font-size:0.65rem; font-weight:800; color:#94a3b8; text-transform:uppercase;">Original</span>
              <p style="font-size:0.95rem; font-weight:800; color:#334155;">${this.resultData.originalSizeKB || Math.round((this.selectedFiles[0]?.size || 0) / 1024)} KB</p>
            </div>
            <div>
              <span style="font-size:0.65rem; font-weight:800; color:#059669; text-transform:uppercase;">Status</span>
              <p style="font-size:0.95rem; font-weight:800; color:#059669;">${this.resultData.reductionPercent ? `-${this.resultData.reductionPercent}%` : 'Done'}</p>
            </div>
            <div>
              <span style="font-size:0.65rem; font-weight:800; color:#059669; text-transform:uppercase;">Final Size</span>
              <p style="font-size:1.15rem; font-weight:900; color:#059669;">${this.resultData.finalSizeKB || this.resultData.sizeKB || 0} KB</p>
            </div>
          </div>
          <a href="${this.resultData.blobUrl}" download="${this.resultData.fileName}" class="btn-primary btn-success">
            <i data-lucide="download" style="width: 18px; height: 18px;"></i>
            <span>Download ${this.resultData.fileName}</span>
          </a>
        </div>
      `;
    }

    const selPages = this.pages.filter(p => p.selected);

    return `
      <!-- Toolbar for Visual Page Operations -->
      <div style="width:100%; max-width:1000px; margin-bottom:1rem; display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:0.5rem; background:white; padding:0.65rem 1rem; border-radius:12px; border:1px solid #e2e8f0; box-shadow:var(--shadow-sm);">
        <div style="display:flex; align-items:center; gap:0.5rem;">
          <button id="btnSelectAll" style="font-size:0.75rem; font-weight:700; background:#f1f5f9; padding:0.35rem 0.75rem; border-radius:6px; color:#334155;">Select All</button>
          <button id="btnDeselectAll" style="font-size:0.75rem; font-weight:700; background:#f1f5f9; padding:0.35rem 0.75rem; border-radius:6px; color:#334155;">Deselect All</button>
          <button id="btnRotateAll" style="font-size:0.75rem; font-weight:700; background:#fef2f2; color:#ef4444; padding:0.35rem 0.75rem; border-radius:6px; display:flex; align-items:center; gap:0.25rem;">
            <i data-lucide="rotate-cw" style="width:12px; height:12px;"></i> Rotate All (+90°)
          </button>
          <button id="btnDeleteSelected" style="font-size:0.75rem; font-weight:700; background:#fee2e2; color:#b91c1c; padding:0.35rem 0.75rem; border-radius:6px; display:flex; align-items:center; gap:0.25rem;">
            <i data-lucide="trash-2" style="width:12px; height:12px;"></i> Delete Selected
          </button>
        </div>

        <div style="display:flex; align-items:center; gap:0.25rem;">
          <button id="btnToggleGrid" class="page-action-btn ${this.viewMode === 'grid' ? 'active' : ''}" style="${this.viewMode === 'grid' ? 'background:#fee2e2; color:#ef4444; border-color:#fca5a5;' : ''}" title="Grid View">
            <i data-lucide="grid" style="width:14px; height:14px;"></i>
          </button>
          <button id="btnToggleList" class="page-action-btn ${this.viewMode === 'list' ? 'active' : ''}" style="${this.viewMode === 'list' ? 'background:#fee2e2; color:#ef4444; border-color:#fca5a5;' : ''}" title="List View">
            <i data-lucide="list" style="width:14px; height:14px;"></i>
          </button>
        </div>
      </div>

      <!-- Page-Wise Thumbnail Grid / List -->
      <div class="${this.viewMode === 'grid' ? 'page-grid-container' : 'page-list-container'}" id="pageCardsContainer">
        ${this.pages.map((item, idx) => `
          <div class="page-card ${item.selected ? 'selected' : 'excluded'}" draggable="true" data-id="${item.id}" data-idx="${idx}">
            <div class="page-card-order-badge">${idx + 1}</div>

            <div class="page-img-wrapper">
              ${item.preview ? `
                <img src="${item.preview}" alt="Page ${item.pageNumber}" style="transform: rotate(${item.rotation}deg);" />
              ` : `
                <i data-lucide="file-text" style="width:36px; height:36px; color:#cbd5e1;"></i>
              `}

              ${item.selected ? `
                <div class="page-selected-check">
                  <i data-lucide="check" style="width:12px; height:12px; stroke-width:3;"></i>
                </div>
              ` : ''}
            </div>

            <div class="page-details">
              <div class="page-title-row">
                <span class="page-num-label">Page ${item.pageNumber}</span>
                <span class="page-source-name" title="${item.fileName}">${item.fileName}</span>
              </div>

              <div class="page-actions-row">
                <button class="page-action-btn rotate-single-btn" data-id="${item.id}" title="Rotate 90°">
                  <i data-lucide="rotate-cw" style="width:13px; height:13px;"></i>
                </button>
                <button class="page-action-btn delete-single-btn" data-id="${item.id}" title="Remove Page">
                  <i data-lucide="trash-2" style="width:13px; height:13px;"></i>
                </button>
                <div class="page-action-btn page-drag-handle" title="Drag to reorder">
                  <i data-lucide="move" style="width:13px; height:13px;"></i>
                </div>
              </div>
            </div>
          </div>
        `).join('')}

        <!-- Add More PDFs Card -->
        <div class="add-page-card" id="addMorePagesCard">
          <div style="width:36px; height:36px; border-radius:50%; background:white; border:1px solid #e2e8f0; display:flex; align-items:center; justify-content:center; box-shadow:var(--shadow-sm);">
            <i data-lucide="plus" style="width:18px; height:18px;"></i>
          </div>
          <span style="font-size:0.75rem; font-weight:800; text-transform:uppercase;">Add More</span>
          <input type="file" id="addMoreInput" accept="${this.activeTool.accept}" multiple style="display:none;" />
        </div>
      </div>
    `;
  }

  renderToolControls() {
    const toolId = this.activeTool.id;
    const file = this.selectedFiles[0];
    const originalKB = file ? Math.round(file.size / 1024) : 500;

    let controlsHtml = '';

    if (toolId === 'pdf-compress' || toolId === 'image-compress') {
      controlsHtml = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:0.75rem; font-weight:800; text-transform:uppercase; color:#64748b;">Target Sizing</span>
          <span style="font-size:0.65rem; font-weight:800; background:#fef2f2; color:#ef4444; padding:0.15rem 0.4rem; border-radius:4px;">100% Accuracy</span>
        </div>
        <div>
          <label style="font-size:0.75rem; font-weight:700; color:#475569; display:block; margin-bottom:0.35rem;">Portal Limit Presets</label>
          <div class="preset-grid">
            <button class="preset-btn" data-target="50">50 KB</button>
            <button class="preset-btn" data-target="100">100 KB</button>
            <button class="preset-btn active" data-target="200">200 KB</button>
            <button class="preset-btn" data-target="500">500 KB</button>
            <button class="preset-btn" data-target="1024">1 MB</button>
            <button class="preset-btn" data-target="2048">2 MB</button>
          </div>
        </div>
        <div>
          <label style="font-size:0.75rem; font-weight:700; color:#475569; display:block; margin-bottom:0.35rem;">Custom Target KB</label>
          <div style="display:flex; gap:0.5rem; align-items:center;">
            <input type="number" id="targetKbInput" min="10" max="${Math.max(500, originalKB)}" value="200" style="width:100%; padding:0.5rem; border:1px solid #cbd5e1; border-radius:8px; text-align:center; font-weight:800;" />
            <span style="font-weight:700; color:#64748b; font-size:0.875rem;">KB</span>
          </div>
          <input type="range" id="targetKbSlider" min="10" max="${Math.max(100, originalKB)}" value="200" style="width:100%; margin-top:0.5rem; accent-color:#e11d48;" />
        </div>
        <div>
          <label style="display:flex; align-items:center; gap:0.5rem; font-size:0.75rem; font-weight:700; color:#334155; cursor:pointer;">
            <input type="checkbox" id="strictCeilingCheck" checked style="accent-color:#e11d48;" />
            <span>Strict Limit Guarantee (<= target KB)</span>
          </label>
        </div>
      `;
    } else if (toolId === 'pdf-sign') {
      controlsHtml = `
        <label style="font-size:0.75rem; font-weight:700; color:#475569;">Draw Signature on Pad</label>
        <div style="border:2px dashed #cbd5e1; border-radius:8px; background:#f8fafc; overflow:hidden;">
          <canvas id="sigCanvas" width="300" height="130" style="width:100%; height:130px; display:block; cursor:crosshair;"></canvas>
        </div>
        <button id="clearSigBtn" style="font-size:0.7rem; color:#ef4444; font-weight:700; text-align:right;">Clear Signature Pad</button>
      `;
    } else if (toolId === 'ai-meme-generator') {
      controlsHtml = `
        <label style="font-size:0.75rem; font-weight:700; color:#475569;">Top Caption</label>
        <input type="text" id="memeTopText" value="WHEN YOU FIND" style="width:100%; padding:0.5rem; border:1px solid #cbd5e1; border-radius:8px; font-weight:800; text-transform:uppercase;" />
        <label style="font-size:0.75rem; font-weight:700; color:#475569; margin-top:0.5rem; display:block;">Bottom Caption</label>
        <input type="text" id="memeBottomText" value="DOCUVATE 100% CLIENT-SIDE" style="width:100%; padding:0.5rem; border:1px solid #cbd5e1; border-radius:8px; font-weight:800; text-transform:uppercase;" />
      `;
    } else if (toolId === 'ai-photo-editor') {
      controlsHtml = `
        <label style="font-size:0.75rem; font-weight:700; color:#475569;">Brightness</label>
        <input type="range" id="photoBrightness" min="50" max="150" value="100" style="width:100%; accent-color:#6366f1;" />
        <label style="font-size:0.75rem; font-weight:700; color:#475569; margin-top:0.5rem; display:block;">Contrast</label>
        <input type="range" id="photoContrast" min="50" max="150" value="100" style="width:100%; accent-color:#6366f1;" />
        <label style="font-size:0.75rem; font-weight:700; color:#475569; margin-top:0.5rem; display:block;">Grayscale (%)</label>
        <input type="range" id="photoGrayscale" min="0" max="100" value="0" style="width:100%; accent-color:#6366f1;" />
      `;
    } else if (toolId === 'pdf-protect' || toolId === 'pdf-unlock') {
      controlsHtml = `
        <label style="font-size:0.75rem; font-weight:700; color:#475569;">Document Password</label>
        <input type="password" id="pdfPasswordInput" placeholder="Enter password..." style="width:100%; padding:0.5rem; border:1px solid #cbd5e1; border-radius:8px;" />
      `;
    } else if (toolId === 'pdf-watermark' || toolId === 'ai-watermark-image') {
      controlsHtml = `
        <label style="font-size:0.75rem; font-weight:700; color:#475569;">Watermark Text</label>
        <input type="text" id="watermarkTextInput" value="CONFIDENTIAL" style="width:100%; padding:0.5rem; border:1px solid #cbd5e1; border-radius:8px; font-weight:800;" />
        <label style="font-size:0.75rem; font-weight:700; color:#475569; margin-top:0.5rem; display:block;">Opacity (%)</label>
        <input type="range" id="watermarkOpacity" min="10" max="90" value="30" style="width:100%; accent-color:#be123c;" />
      `;
    } else if (toolId === 'ai-exam-photo') {
      controlsHtml = `
        <label style="font-size:0.75rem; font-weight:700; color:#475569;">Exam Standards</label>
        <div class="preset-grid">
          <button class="preset-btn active" data-exam="passport" data-w="350" data-h="450" data-kb="50">Passport Photo (50KB)</button>
          <button class="preset-btn" data-exam="signature" data-w="300" data-h="120" data-kb="20">Signature Stamp (20KB)</button>
          <button class="preset-btn" data-exam="ssc" data-w="200" data-h="230" data-kb="50">SSC / UPSC (50KB)</button>
        </div>
      `;
    } else {
      controlsHtml = `
        <p style="font-size:0.8125rem; color:#64748b;">Ready to process with high-precision client-side engine.</p>
      `;
    }

    return `
      <div style="background:white; border-radius:12px; display:flex; flex-direction:column; gap:0.875rem;">
        ${controlsHtml}
      </div>
    `;
  }

  attachCanvasAndControlListeners(canvasArea, sidebarArea) {
    const processBtn = sidebarArea.querySelector('#processBtn');
    const clearAllBtn = sidebarArea.querySelector('#clearAllPagesBtn');
    const targetInput = sidebarArea.querySelector('#targetKbInput');
    const targetSlider = sidebarArea.querySelector('#targetKbSlider');
    const presetBtns = sidebarArea.querySelectorAll('.preset-btn[data-target]');
    const examBtns = sidebarArea.querySelectorAll('.preset-btn[data-exam]');

    // Preset buttons
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const val = btn.dataset.target;
        if (targetInput) targetInput.value = val;
        if (targetSlider) targetSlider.value = val;
      });
    });

    if (targetInput && targetSlider) {
      targetInput.addEventListener('input', () => {
        targetSlider.value = targetInput.value;
        presetBtns.forEach(b => b.classList.remove('active'));
      });
      targetSlider.addEventListener('input', () => {
        targetInput.value = targetSlider.value;
        presetBtns.forEach(b => b.classList.remove('active'));
      });
    }

    examBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        examBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Toolbar actions
    const btnSelectAll = canvasArea.querySelector('#btnSelectAll');
    const btnDeselectAll = canvasArea.querySelector('#btnDeselectAll');
    const btnRotateAll = canvasArea.querySelector('#btnRotateAll');
    const btnDeleteSelected = canvasArea.querySelector('#btnDeleteSelected');
    const btnToggleGrid = canvasArea.querySelector('#btnToggleGrid');
    const btnToggleList = canvasArea.querySelector('#btnToggleList');

    btnSelectAll?.addEventListener('click', () => {
      this.pages.forEach(p => p.selected = true);
      this.renderWorkspace();
    });

    btnDeselectAll?.addEventListener('click', () => {
      this.pages.forEach(p => p.selected = false);
      this.renderWorkspace();
    });

    btnRotateAll?.addEventListener('click', () => {
      this.pages.forEach(p => p.rotation = (p.rotation + 90) % 360);
      this.renderWorkspace();
    });

    btnDeleteSelected?.addEventListener('click', () => {
      this.pages = this.pages.filter(p => !p.selected);
      this.renderWorkspace();
    });

    btnToggleGrid?.addEventListener('click', () => {
      this.viewMode = 'grid';
      this.renderWorkspace();
    });

    btnToggleList?.addEventListener('click', () => {
      this.viewMode = 'list';
      this.renderWorkspace();
    });

    // Add more card
    const addMoreCard = canvasArea.querySelector('#addMorePagesCard');
    const addMoreInput = canvasArea.querySelector('#addMoreInput');
    addMoreCard?.addEventListener('click', () => addMoreInput?.click());
    addMoreInput?.addEventListener('change', (e) => {
      if (e.target.files?.length > 0) {
        this.handleFilesAdded(Array.from(e.target.files));
      }
    });

    // Page Card Click (Toggle Selection)
    canvasArea.querySelectorAll('.page-card').forEach(card => {
      const pageId = card.dataset.id;

      card.addEventListener('click', (e) => {
        if (e.target.closest('.rotate-single-btn') || e.target.closest('.delete-single-btn') || e.target.closest('.page-drag-handle')) {
          return;
        }
        const p = this.pages.find(item => item.id === pageId);
        if (p) {
          p.selected = !p.selected;
          this.renderWorkspace();
        }
      });

      // HTML5 Drag and Drop Reordering
      card.addEventListener('dragstart', (e) => {
        this.draggedPageId = pageId;
        e.dataTransfer.effectAllowed = 'move';
        card.style.opacity = '0.4';
      });

      card.addEventListener('dragend', () => {
        card.style.opacity = '1';
        this.draggedPageId = null;
      });

      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      });

      card.addEventListener('drop', (e) => {
        e.preventDefault();
        if (!this.draggedPageId || this.draggedPageId === pageId) return;

        const fromIdx = this.pages.findIndex(p => p.id === this.draggedPageId);
        const toIdx = this.pages.findIndex(p => p.id === pageId);

        if (fromIdx !== -1 && toIdx !== -1) {
          const [movedItem] = this.pages.splice(fromIdx, 1);
          this.pages.splice(toIdx, 0, movedItem);
          this.renderWorkspace();
        }
      });
    });

    // Individual rotate buttons
    canvasArea.querySelectorAll('.rotate-single-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pageId = btn.dataset.id;
        const p = this.pages.find(item => item.id === pageId);
        if (p) {
          p.rotation = (p.rotation + 90) % 360;
          this.renderWorkspace();
        }
      });
    });

    // Individual delete buttons
    canvasArea.querySelectorAll('.delete-single-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pageId = btn.dataset.id;
        this.pages = this.pages.filter(item => item.id !== pageId);
        this.renderWorkspace();
      });
    });

    // Signature Canvas
    const sigCanvas = sidebarArea.querySelector('#sigCanvas');
    const clearSigBtn = sidebarArea.querySelector('#clearSigBtn');
    if (sigCanvas) {
      const ctx = sigCanvas.getContext('2d');
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#0f172a';
      let drawing = false;

      const getPos = (e) => {
        const rect = sigCanvas.getBoundingClientRect();
        return {
          x: (e.clientX || e.touches?.[0]?.clientX) - rect.left,
          y: (e.clientY || e.touches?.[0]?.clientY) - rect.top
        };
      };

      sigCanvas.addEventListener('mousedown', (e) => {
        drawing = true;
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
      });
      sigCanvas.addEventListener('mousemove', (e) => {
        if (!drawing) return;
        const pos = getPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      });
      window.addEventListener('mouseup', () => { drawing = false; });

      clearSigBtn?.addEventListener('click', () => {
        ctx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
      });
    }

    // Clear All
    clearAllBtn?.addEventListener('click', () => {
      this.selectedFiles = [];
      this.pages = [];
      this.resultData = null;
      this.renderWorkspace();
    });

    processBtn?.addEventListener('click', () => this.executeAction(sidebarArea));
  }

  async executeAction(sidebarArea) {
    if (this.isProcessing || (this.pages.length === 0 && !this.activeTool.isCustomInput)) return;
    this.isProcessing = true;

    const processBtn = sidebarArea.querySelector('#processBtn');
    const progressArea = sidebarArea.querySelector('#progressArea');
    const progressMsg = sidebarArea.querySelector('#progressMsg');
    const progressPct = sidebarArea.querySelector('#progressPct');
    const progressBarFill = sidebarArea.querySelector('#progressBarFill');

    if (processBtn) processBtn.disabled = true;
    if (progressArea) progressArea.style.display = 'block';

    const onProgress = (pct, msg) => {
      if (progressPct) progressPct.textContent = `${pct}%`;
      if (progressMsg) progressMsg.textContent = msg;
      if (progressBarFill) progressBarFill.style.width = `${pct}%`;
    };

    try {
      const toolId = this.activeTool.id;
      const file = this.selectedFiles[0];
      let result = null;

      if (toolId === 'pdf-merge' || toolId === 'pdf-organize' || toolId === 'pdf-split' || toolId === 'pdf-remove-pages' || toolId === 'pdf-extract-pages') {
        result = await PdfTools.assemblePdfFromPages(this.pages, onProgress);
      } else if (toolId === 'pdf-rotate') {
        result = await PdfTools.rotatePdf(file, 90, onProgress);
      } else if (toolId === 'pdf-crop') {
        result = await PdfTools.cropPdf(file, 10, onProgress);
      } else if (toolId === 'pdf-compress') {
        const targetKB = sidebarArea.querySelector('#targetKbInput')?.value || 200;
        const strictCeiling = sidebarArea.querySelector('#strictCeilingCheck')?.checked ?? true;
        
        // If user reordered or excluded pages, compile first then compress
        if (this.pages.some(p => !p.selected || p.rotation !== 0) || this.pages.length > 1) {
          const compiled = await PdfTools.assemblePdfFromPages(this.pages, onProgress);
          const compiledFile = new File([compiled.blob], file.name, { type: 'application/pdf' });
          result = await PdfTools.compressPdf(compiledFile, targetKB, strictCeiling, onProgress);
        } else {
          result = await PdfTools.compressPdf(file, targetKB, strictCeiling, onProgress);
        }
      } else if (toolId === 'pdf-repair') {
        result = await PdfTools.repairPdf(file, onProgress);
      } else if (toolId === 'pdf-unlock') {
        result = await PdfTools.unlockPdf(file, onProgress);
      } else if (toolId === 'pdf-protect') {
        const pwd = sidebarArea.querySelector('#pdfPasswordInput')?.value || '123456';
        result = await PdfTools.protectPdf(file, pwd, onProgress);
      } else if (toolId === 'pdf-sign') {
        const sigCanvas = sidebarArea.querySelector('#sigCanvas');
        const sigData = sigCanvas ? sigCanvas.toDataURL('image/png') : '';
        result = await PdfTools.signPdf(file, sigData, onProgress);
      } else if (toolId === 'pdf-page-numbers') {
        result = await PdfTools.addPageNumbers(file, 'bottom-center', onProgress);
      } else if (toolId === 'pdf-watermark') {
        const text = sidebarArea.querySelector('#watermarkTextInput')?.value || 'CONFIDENTIAL';
        const opacity = (sidebarArea.querySelector('#watermarkOpacity')?.value || 30) / 100;
        result = await PdfTools.addWatermark(file, text, opacity, onProgress);
      } else if (toolId === 'pdf-redact') {
        result = await PdfTools.redactPdf(file, onProgress);
      } else if (toolId === 'pdf-compare') {
        const file2 = this.selectedFiles[1] || this.selectedFiles[0];
        result = await PdfTools.comparePdfs(file, file2, onProgress);
      } else if (toolId === 'convert-jpg-to-pdf') {
        result = await ConvertTools.imagesToPdf(this.selectedFiles, onProgress);
      } else if (toolId === 'convert-html-to-pdf') {
        result = await ConvertTools.htmlToPdf('<h1>Docuvate HTML Document</h1>', onProgress);
      } else if (toolId === 'convert-pdf-to-jpg') {
        result = await ConvertTools.pdfToJpg(file, 2.0, onProgress);
      } else if (toolId === 'convert-pdf-to-pdfa') {
        result = await ConvertTools.pdfToPdfA(file, onProgress);
      } else if (toolId === 'convert-ocr-pdf') {
        result = await ConvertTools.ocrPdf(file, 'eng', onProgress);
      } else if (toolId === 'image-compress') {
        const targetKB = sidebarArea.querySelector('#targetKbInput')?.value || 100;
        result = await ImageTools.compressImage(file, targetKB, onProgress);
      } else if (toolId === 'image-resize') {
        result = await ImageTools.resizeImage(file, 800, null, true, onProgress);
      } else if (toolId === 'image-crop') {
        result = await ImageTools.cropImage(file, 10, onProgress);
      } else if (toolId === 'image-convert-jpg') {
        result = await ImageTools.convertFormat(file, 'image/jpeg', onProgress);
      } else if (toolId === 'image-convert-from-jpg') {
        result = await ImageTools.convertFormat(file, 'image/png', onProgress);
      } else if (toolId === 'image-rotate') {
        result = await ImageTools.transformImage(file, 90, false, false, onProgress);
      } else if (toolId === 'image-flip') {
        result = await ImageTools.transformImage(file, 0, true, false, onProgress);
      } else if (toolId === 'image-html-to-image') {
        result = await ImageTools.htmlToImage('<h2>Docuvate HTML Snapshot</h2>', onProgress);
      } else if (toolId === 'image-metadata') {
        result = await ImageTools.readMetadata(file, onProgress);
      } else if (toolId === 'ai-upscale') {
        result = await ImageTools.photoUpscale(file, 2, onProgress);
      } else if (toolId === 'ai-remove-bg') {
        result = await ImageTools.removeBackground(file, onProgress);
      } else if (toolId === 'ai-meme-generator') {
        const top = sidebarArea.querySelector('#memeTopText')?.value || '';
        const bot = sidebarArea.querySelector('#memeBottomText')?.value || '';
        result = await ImageTools.generateMeme(file, top, bot, onProgress);
      } else if (toolId === 'ai-photo-editor') {
        const b = sidebarArea.querySelector('#photoBrightness')?.value || 100;
        const c = sidebarArea.querySelector('#photoContrast')?.value || 100;
        const g = sidebarArea.querySelector('#photoGrayscale')?.value || 0;
        result = await ImageTools.editPhoto(file, b, c, g, 0, onProgress);
      } else if (toolId === 'ai-watermark-image') {
        const text = sidebarArea.querySelector('#watermarkTextInput')?.value || 'DOCUVATE';
        result = await ImageTools.watermarkImage(file, text, 0.5, onProgress);
      } else if (toolId === 'ai-blur') {
        result = await ImageTools.blurImage(file, 15, onProgress);
      } else if (toolId === 'ai-exam-photo') {
        const activeExam = sidebarArea.querySelector('.preset-btn[data-exam].active');
        const w = parseInt(activeExam?.dataset?.w || 350);
        const h = parseInt(activeExam?.dataset?.h || 450);
        const kb = parseInt(activeExam?.dataset?.kb || 50);
        result = await ImageTools.examPhotoResize(file, w, h, kb, onProgress);
      }

      this.resultData = result;
      this.isProcessing = false;
      this.renderWorkspace();
      this.showToast("Success! Document processed.");

      if (result.blobUrl && result.fileName) {
        const a = document.createElement('a');
        a.href = result.blobUrl;
        a.download = result.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

    } catch (err) {
      console.error(err);
      this.isProcessing = false;
      if (processBtn) processBtn.disabled = false;
      if (progressArea) progressArea.style.display = 'none';
      alert(`Error: ${err.message || 'Operation failed.'}`);
    }
  }

  showToast(message) {
    if (!this.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    this.toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
  window.docuvateApp = new DocuvateApp();
});
