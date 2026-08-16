/**
 * Docuvate Master Application Controller & Client-Side Engines
 * Universal All-in-One PDF Workstation - Perform multiple operations without re-uploading!
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
      fileName: 'docuvate-document.pdf',
      sizeKB: Math.round(blob.size / 1024),
      totalPages: selectedPages.length
    };
  },

  async compressPdf(file, targetKB, strictCeiling = true, onProgress = () => {}) {
    return new Promise((resolve, reject) => {
      onProgress(5, "Initializing Multi-Pass Compressor...");
      
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

  async cropPdf(file, marginPercent = 10, onProgress = () => {}) {
    onProgress(20, "Adjusting crop boxes...");
    const fileBytes = await file.arrayBuffer();
    const pdf = await PDFLib.PDFDocument.load(fileBytes);
    const pages = pdf.getPages();

    pages.forEach((page) => {
      const { x, y, width, height } = page.getMediaBox();
      const marginX = (width * (marginPercent / 100)) / 2;
      const marginY = (height * (marginPercent / 100)) / 2;
      page.setCropBox(x + marginX, y + marginY, width - (marginX * 2), height - (marginY * 2));
    });

    onProgress(90, "Saving cropped PDF...");
    const pdfBytes = await pdf.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    return {
      blob,
      blobUrl: URL.createObjectURL(blob),
      fileName: `cropped-${file.name}`,
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

  async pdfToJpg(file, scale = 2.0, onProgress = () => {}) {
    onProgress(15, "Rasterizing PDF pages...");
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;
    const zip = new JSZip();

    for (let i = 1; i <= numPages; i++) {
      onProgress(Math.round(20 + (i / numPages) * 70), `Rendering page ${i} of ${numPages}...`);
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport }).promise;

      const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.9));
      zip.file(`page-${i}.jpg`, blob);
    }

    onProgress(95, "Bundling images into ZIP...");
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    return {
      blob: zipBlob,
      blobUrl: URL.createObjectURL(zipBlob),
      fileName: `${file.name.replace(/\.[^/.]+$/, "")}-jpg-images.zip`,
      sizeKB: Math.round(zipBlob.size / 1024)
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
      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport }).promise;

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

  async photoUpscale(file, scaleFactor = 2, onProgress = () => {}) {
    onProgress(20, "Applying super-resolution scaling...");
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
    onProgress(20, "Rendering meme...");
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
// App Controller - Universal PDF Workstation
// -------------------------------------------------------------
class DocuvateApp {
  constructor() {
    this.currentCategory = 'all';
    this.searchQuery = '';
    this.activeTool = null;
    this.selectedFiles = [];
    this.pages = []; // Unified page list
    this.activePdfModule = 'organize'; // 'organize' | 'compress' | 'sign' | 'watermark' | 'numbers' | 'security' | 'convert' | 'repair'
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
      this.openToolById(toolId);
    });

    // Launch Master PDF Studio button
    document.getElementById('launchMasterStudioBtn')?.addEventListener('click', () => {
      this.openMasterPdfStudio();
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

  openMasterPdfStudio(initialModule = 'organize') {
    this.activeTool = {
      id: 'pdf-master-studio',
      name: 'Master PDF Workstation (All-in-One)',
      isPdfStudio: true,
      accept: '.pdf',
      multiple: true
    };
    this.activePdfModule = initialModule;
    this.workspaceTitle.textContent = "Master PDF Workstation";
    this.workspaceOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    this.renderWorkspace();
  }

  openToolById(toolId) {
    // If it is any of the PDF tools, route seamlessly to the Master PDF Workstation with the appropriate active module!
    if (toolId.startsWith('pdf-') || toolId === 'convert-jpg-to-pdf' || toolId === 'convert-pdf-to-jpg' || toolId === 'convert-pdf-to-pdfa' || toolId === 'convert-ocr-pdf') {
      let mod = 'organize';
      if (toolId === 'pdf-compress') mod = 'compress';
      else if (toolId === 'pdf-sign') mod = 'sign';
      else if (toolId === 'pdf-watermark') mod = 'watermark';
      else if (toolId === 'pdf-page-numbers') mod = 'numbers';
      else if (toolId === 'pdf-protect' || toolId === 'pdf-unlock') mod = 'security';
      else if (toolId === 'pdf-repair' || toolId === 'pdf-redact') mod = 'repair';
      else if (toolId.startsWith('convert-')) mod = 'convert';
      
      this.openMasterPdfStudio(mod);
      return;
    }

    // Image/AI tool
    this.activeTool = { id: toolId, name: toolId.replace('-', ' ').toUpperCase(), isPdfStudio: false, accept: 'image/*', multiple: false };
    this.selectedFiles = [];
    this.pages = [];
    this.resultData = null;
    this.isProcessing = false;
    this.workspaceTitle.textContent = this.activeTool.name;
    this.workspaceOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    this.renderWorkspace();
  }

  closeWorkspace() {
    if (this.resultData?.blobUrl) URL.revokeObjectURL(this.resultData.blobUrl);
    this.workspaceOverlay.classList.remove('active');
    document.body.style.overflow = '';
    this.activeTool = null;
    this.selectedFiles = [];
    this.pages = [];
    this.resultData = null;
  }

  async handleFilesAdded(newFiles) {
    this.selectedFiles.push(...newFiles);
    
    // Unpack all pages into the persistent page workspace
    try {
      const extractedPages = await PdfTools.extractAllPagesAsThumbnails(newFiles);
      this.pages.push(...extractedPages);
    } catch (err) {
      console.warn("Could not unpack pages as thumbnails:", err);
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
    if (this.pages.length === 0 && this.selectedFiles.length === 0) {
      const dropzoneContainer = document.createElement('div');
      dropzoneContainer.className = 'dropzone-container';
      dropzoneContainer.innerHTML = `
        <div class="dropzone-visual-box" id="mainDropBox">
          <i data-lucide="upload-cloud" class="dropzone-icon-huge"></i>
          <h3 class="dropzone-main-text">Drag & drop your ${this.activeTool.isPdfStudio ? 'PDF documents' : 'Images'} here</h3>
          <label class="dropzone-select-btn">
            <i data-lucide="file-plus" style="width: 20px; height: 20px;"></i>
            <span>Select ${this.activeTool.isPdfStudio ? 'PDF Files' : 'Files'}</span>
            <input type="file" id="fileInput" accept="${this.activeTool.accept || '.pdf'}" multiple style="display:none;" />
          </label>
          <p style="font-size: 0.8125rem; color: #94a3b8; margin-top: 1.5rem;">
            100% Client-Side Engine. No server uploads. Process, compress, sign, and organize in one place!
          </p>
        </div>
      `;

      const dropBox = dropzoneContainer.querySelector('#mainDropBox');
      const input = dropzoneContainer.querySelector('#fileInput');

      dropBox.addEventListener('dragover', (e) => { e.preventDefault(); dropBox.classList.add('dragover'); });
      dropBox.addEventListener('dragleave', () => dropBox.classList.remove('dragover'));
      dropBox.addEventListener('drop', (e) => {
        e.preventDefault();
        dropBox.classList.remove('dragover');
        if (e.dataTransfer.files?.length > 0) this.handleFilesAdded(Array.from(e.dataTransfer.files));
      });

      input.addEventListener('change', (e) => {
        if (e.target.files?.length > 0) this.handleFilesAdded(Array.from(e.target.files));
      });

      this.workspaceBody.appendChild(dropzoneContainer);
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    // Two-Column Layout
    const layout = document.createElement('div');
    layout.className = 'workspace-two-col';

    // Left Canvas Area (Visual Thumbnail Grid)
    const canvasArea = document.createElement('div');
    canvasArea.className = 'workspace-canvas-area';
    canvasArea.innerHTML = this.renderCanvasContent();
    layout.appendChild(canvasArea);

    // Right Sidebar Controls Area with Unified Module Navigation Tabs
    const sidebarArea = document.createElement('div');
    sidebarArea.className = 'workspace-sidebar-area';
    const selCount = this.pages.filter(p => p.selected).length;

    sidebarArea.innerHTML = `
      ${this.activeTool.isPdfStudio ? `
        <!-- Universal Module Tabs -->
        <div class="universal-module-nav">
          <button class="universal-module-tab ${this.activePdfModule === 'organize' ? 'active' : ''}" data-mod="organize">
            <i data-lucide="layers" style="width:12px; height:12px;"></i> Organize
          </button>
          <button class="universal-module-tab ${this.activePdfModule === 'compress' ? 'active' : ''}" data-mod="compress">
            <i data-lucide="file-heart" style="width:12px; height:12px;"></i> Compress
          </button>
          <button class="universal-module-tab ${this.activePdfModule === 'sign' ? 'active' : ''}" data-mod="sign">
            <i data-lucide="file-signature" style="width:12px; height:12px;"></i> Sign
          </button>
          <button class="universal-module-tab ${this.activePdfModule === 'watermark' ? 'active' : ''}" data-mod="watermark">
            <i data-lucide="droplet" style="width:12px; height:12px;"></i> Watermark
          </button>
          <button class="universal-module-tab ${this.activePdfModule === 'numbers' ? 'active' : ''}" data-mod="numbers">
            <i data-lucide="hash" style="width:12px; height:12px;"></i> Numbering
          </button>
          <button class="universal-module-tab ${this.activePdfModule === 'security' ? 'active' : ''}" data-mod="security">
            <i data-lucide="lock" style="width:12px; height:12px;"></i> Security
          </button>
          <button class="universal-module-tab ${this.activePdfModule === 'convert' ? 'active' : ''}" data-mod="convert">
            <i data-lucide="image" style="width:12px; height:12px;"></i> Convert/OCR
          </button>
          <button class="universal-module-tab ${this.activePdfModule === 'repair' ? 'active' : ''}" data-mod="repair">
            <i data-lucide="wrench" style="width:12px; height:12px;"></i> Repair
          </button>
        </div>
      ` : ''}

      <div class="sidebar-scroll-content">
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:0.65rem 0.875rem; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <span style="font-size:0.65rem; font-weight:800; color:#64748b; text-transform:uppercase;">Active Document</span>
            <p style="font-size:0.9rem; font-weight:900; color:#0f172a;">${selCount} of ${this.pages.length} Pages</p>
          </div>
          <button id="clearAllPagesBtn" style="font-size:0.7rem; font-weight:700; color:#ef4444; hover:underline;">Clear Workspace</button>
        </div>

        ${this.renderActiveModuleControls()}
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

        <button id="processBtn" class="btn-primary" ${selCount === 0 && this.pages.length > 0 ? 'disabled' : ''}>
          <i data-lucide="play" style="width: 18px; height: 18px; fill: currentColor;"></i>
          <span id="processBtnText">Apply & Process Document</span>
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
              <p style="font-size:0.95rem; font-weight:800; color:#059669;">${this.resultData.reductionPercent ? `-${this.resultData.reductionPercent}%` : 'Ready'}</p>
            </div>
            <div>
              <span style="font-size:0.65rem; font-weight:800; color:#059669; text-transform:uppercase;">Output Size</span>
              <p style="font-size:1.15rem; font-weight:900; color:#059669;">${this.resultData.finalSizeKB || this.resultData.sizeKB || 0} KB</p>
            </div>
          </div>
          
          <div style="display:flex; flex-direction:column; gap:0.5rem;">
            <a href="${this.resultData.blobUrl}" download="${this.resultData.fileName}" class="btn-primary btn-success">
              <i data-lucide="download" style="width: 18px; height: 18px;"></i>
              <span>Download ${this.resultData.fileName}</span>
            </a>
            <button id="keepEditingBtn" class="btn-primary" style="background:#0f172a;">
              <i data-lucide="layers" style="width: 18px; height: 18px;"></i>
              <span>Keep Editing in Studio (Do another action)</span>
            </button>
          </div>
        </div>
      `;
    }

    return `
      <!-- Toolbar for Page Operations -->
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

        <!-- Add More Card -->
        <div class="add-page-card" id="addMorePagesCard">
          <div style="width:36px; height:36px; border-radius:50%; background:white; border:1px solid #e2e8f0; display:flex; align-items:center; justify-content:center; box-shadow:var(--shadow-sm);">
            <i data-lucide="plus" style="width:18px; height:18px;"></i>
          </div>
          <span style="font-size:0.75rem; font-weight:800; text-transform:uppercase;">Add More PDFs</span>
          <input type="file" id="addMoreInput" accept=".pdf" multiple style="display:none;" />
        </div>
      </div>
    `;
  }

  renderActiveModuleControls() {
    const mod = this.activePdfModule;
    const file = this.selectedFiles[0];
    const originalKB = file ? Math.round(file.size / 1024) : 500;

    let html = '';

    if (mod === 'compress') {
      html = `
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
    } else if (mod === 'sign') {
      html = `
        <label style="font-size:0.75rem; font-weight:700; color:#475569;">Draw Signature on Pad</label>
        <div style="border:2px dashed #cbd5e1; border-radius:8px; background:#f8fafc; overflow:hidden;">
          <canvas id="sigCanvas" width="300" height="130" style="width:100%; height:130px; display:block; cursor:crosshair;"></canvas>
        </div>
        <button id="clearSigBtn" style="font-size:0.7rem; color:#ef4444; font-weight:700; text-align:right;">Clear Signature Pad</button>
      `;
    } else if (mod === 'watermark') {
      html = `
        <label style="font-size:0.75rem; font-weight:700; color:#475569;">Watermark Text</label>
        <input type="text" id="watermarkTextInput" value="CONFIDENTIAL" style="width:100%; padding:0.5rem; border:1px solid #cbd5e1; border-radius:8px; font-weight:800;" />
        <label style="font-size:0.75rem; font-weight:700; color:#475569; margin-top:0.5rem; display:block;">Opacity (%)</label>
        <input type="range" id="watermarkOpacity" min="10" max="90" value="30" style="width:100%; accent-color:#be123c;" />
      `;
    } else if (mod === 'numbers') {
      html = `
        <label style="font-size:0.75rem; font-weight:700; color:#475569;">Page Number Position</label>
        <div class="preset-grid" style="grid-template-columns: repeat(2, 1fr);">
          <button class="preset-btn active" data-pos="bottom-center">Bottom Center</button>
          <button class="preset-btn" data-pos="bottom-right">Bottom Right</button>
          <button class="preset-btn" data-pos="top-center">Top Center</button>
          <button class="preset-btn" data-pos="top-right">Top Right</button>
        </div>
      `;
    } else if (mod === 'security') {
      html = `
        <label style="font-size:0.75rem; font-weight:700; color:#475569;">Document Password Protection</label>
        <input type="password" id="pdfPasswordInput" placeholder="Enter password..." value="123456" style="width:100%; padding:0.5rem; border:1px solid #cbd5e1; border-radius:8px;" />
        <p style="font-size:0.7rem; color:#94a3b8; margin-top:0.25rem;">Sets AES password encryption locally.</p>
      `;
    } else if (mod === 'convert') {
      html = `
        <label style="font-size:0.75rem; font-weight:700; color:#475569;">Conversion Mode</label>
        <div class="preset-grid" style="grid-template-columns: repeat(2, 1fr);">
          <button class="preset-btn active" data-conv="jpg">PDF to JPG (ZIP)</button>
          <button class="preset-btn" data-conv="ocr">OCR Extract Text</button>
          <button class="preset-btn" data-conv="pdfa">ISO PDF/A</button>
        </div>
      `;
    } else if (mod === 'repair') {
      html = `
        <label style="font-size:0.75rem; font-weight:700; color:#475569;">Repair & Redact Options</label>
        <div class="preset-grid" style="grid-template-columns: repeat(2, 1fr);">
          <button class="preset-btn active" data-repair="xref">Fix XREF Streams</button>
          <button class="preset-btn" data-repair="redact">Redact Header</button>
        </div>
      `;
    } else {
      // organize
      html = `
        <div>
          <label style="font-size:0.75rem; font-weight:800; color:#475569; display:block; margin-bottom:0.35rem; text-transform:uppercase;">Action / Output Mode</label>
          <div class="preset-grid" style="grid-template-columns: repeat(2, 1fr);">
            <button class="preset-btn active" data-export-mode="merge">Save / Merge All</button>
            <button class="preset-btn" data-export-mode="split">Split Individual (ZIP)</button>
            <button class="preset-btn" data-export-mode="extract">Extract Selected</button>
            <button class="preset-btn" data-export-mode="crop">Crop Margins</button>
          </div>
        </div>

        <div id="cropMarginControls" style="display:none; background:#f8fafc; padding:0.65rem; border-radius:8px; border:1px solid #e2e8f0;">
          <label style="font-size:0.75rem; font-weight:700; color:#475569; display:block;">Crop Margins (%)</label>
          <input type="range" id="cropMarginSlider" min="2" max="40" value="10" style="width:100%; margin-top:0.35rem; accent-color:#e11d48;" />
          <span id="cropMarginVal" style="font-size:0.75rem; font-weight:800; color:#e11d48; display:block; text-align:right;">10% Margin</span>
        </div>
      `;
    }

    return `
      <div style="background:white; border-radius:12px; display:flex; flex-direction:column; gap:0.875rem;">
        ${html}
      </div>
    `;
  }

  attachCanvasAndControlListeners(canvasArea, sidebarArea) {
    const processBtn = sidebarArea.querySelector('#processBtn');
    const clearAllBtn = sidebarArea.querySelector('#clearAllPagesBtn');
    const keepEditingBtn = canvasArea.querySelector('#keepEditingBtn');

    // Tab switching inside Universal PDF Studio
    sidebarArea.querySelectorAll('.universal-module-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.activePdfModule = tab.dataset.mod;
        this.renderWorkspace();
      });
    });

    // Preset & Target KB bindings
    const presetBtns = sidebarArea.querySelectorAll('.preset-btn[data-target]');
    const targetInput = sidebarArea.querySelector('#targetKbInput');
    const targetSlider = sidebarArea.querySelector('#targetKbSlider');
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
      targetInput.addEventListener('input', () => { targetSlider.value = targetInput.value; });
      targetSlider.addEventListener('input', () => { targetInput.value = targetSlider.value; });
    }

    // Export mode buttons
    const exportBtns = sidebarArea.querySelectorAll('.preset-btn[data-export-mode]');
    const cropMarginControls = sidebarArea.querySelector('#cropMarginControls');
    const cropMarginSlider = sidebarArea.querySelector('#cropMarginSlider');
    const cropMarginVal = sidebarArea.querySelector('#cropMarginVal');
    exportBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        exportBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.exportMode;
        if (cropMarginControls) cropMarginControls.style.display = mode === 'crop' ? 'block' : 'none';
      });
    });
    if (cropMarginSlider && cropMarginVal) {
      cropMarginSlider.addEventListener('input', () => { cropMarginVal.textContent = `${cropMarginSlider.value}% Margin`; });
    }

    // Position / Conversion / Repair preset buttons
    ['data-pos', 'data-conv', 'data-repair'].forEach(attr => {
      const btns = sidebarArea.querySelectorAll(`.preset-btn[${attr}]`);
      btns.forEach(btn => {
        btn.addEventListener('click', () => {
          btns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        });
      });
    });

    // Toolbar actions
    canvasArea.querySelector('#btnSelectAll')?.addEventListener('click', () => {
      this.pages.forEach(p => p.selected = true);
      this.renderWorkspace();
    });
    canvasArea.querySelector('#btnDeselectAll')?.addEventListener('click', () => {
      this.pages.forEach(p => p.selected = false);
      this.renderWorkspace();
    });
    canvasArea.querySelector('#btnRotateAll')?.addEventListener('click', () => {
      this.pages.forEach(p => p.rotation = (p.rotation + 90) % 360);
      this.renderWorkspace();
    });
    canvasArea.querySelector('#btnDeleteSelected')?.addEventListener('click', () => {
      this.pages = this.pages.filter(p => !p.selected);
      this.renderWorkspace();
    });
    canvasArea.querySelector('#btnToggleGrid')?.addEventListener('click', () => {
      this.viewMode = 'grid';
      this.renderWorkspace();
    });
    canvasArea.querySelector('#btnToggleList')?.addEventListener('click', () => {
      this.viewMode = 'list';
      this.renderWorkspace();
    });

    // Add more card
    const addMoreCard = canvasArea.querySelector('#addMorePagesCard');
    const addMoreInput = canvasArea.querySelector('#addMoreInput');
    addMoreCard?.addEventListener('click', () => addMoreInput?.click());
    addMoreInput?.addEventListener('change', (e) => {
      if (e.target.files?.length > 0) this.handleFilesAdded(Array.from(e.target.files));
    });

    // Page Card Click (Toggle Selection & Reorder)
    canvasArea.querySelectorAll('.page-card').forEach(card => {
      const pageId = card.dataset.id;
      card.addEventListener('click', (e) => {
        if (e.target.closest('.rotate-single-btn') || e.target.closest('.delete-single-btn') || e.target.closest('.page-drag-handle')) return;
        const p = this.pages.find(item => item.id === pageId);
        if (p) {
          p.selected = !p.selected;
          this.renderWorkspace();
        }
      });

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
          const [moved] = this.pages.splice(fromIdx, 1);
          this.pages.splice(toIdx, 0, moved);
          this.renderWorkspace();
        }
      });
    });

    // Single rotate & delete
    canvasArea.querySelectorAll('.rotate-single-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const p = this.pages.find(item => item.id === btn.dataset.id);
        if (p) { p.rotation = (p.rotation + 90) % 360; this.renderWorkspace(); }
      });
    });
    canvasArea.querySelectorAll('.delete-single-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.pages = this.pages.filter(item => item.id !== btn.dataset.id);
        this.renderWorkspace();
      });
    });

    // Signature Pad
    const sigCanvas = sidebarArea.querySelector('#sigCanvas');
    const clearSigBtn = sidebarArea.querySelector('#clearSigBtn');
    if (sigCanvas) {
      const ctx = sigCanvas.getContext('2d');
      ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.strokeStyle = '#0f172a';
      let drawing = false;
      const getPos = (e) => {
        const r = sigCanvas.getBoundingClientRect();
        return { x: (e.clientX || e.touches?.[0]?.clientX) - r.left, y: (e.clientY || e.touches?.[0]?.clientY) - r.top };
      };
      sigCanvas.addEventListener('mousedown', (e) => { drawing = true; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); });
      sigCanvas.addEventListener('mousemove', (e) => { if (!drawing) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); });
      window.addEventListener('mouseup', () => { drawing = false; });
      clearSigBtn?.addEventListener('click', () => ctx.clearRect(0, 0, sigCanvas.width, sigCanvas.height));
    }

    // Clear Workspace
    clearAllBtn?.addEventListener('click', () => {
      this.selectedFiles = [];
      this.pages = [];
      this.resultData = null;
      this.renderWorkspace();
    });

    // Keep Editing in Studio button (Continues without re-uploading!)
    keepEditingBtn?.addEventListener('click', async () => {
      if (!this.resultData?.blob) return;
      const newPdfFile = new File([this.resultData.blob], this.resultData.fileName, { type: 'application/pdf' });
      this.selectedFiles = [newPdfFile];
      this.resultData = null;
      this.pages = [];
      await this.handleFilesAdded([newPdfFile]);
      this.showToast("Loaded output document into studio! You can continue editing without re-uploading.");
    });

    processBtn?.addEventListener('click', () => this.executeAction(sidebarArea));
  }

  async executeAction(sidebarArea) {
    if (this.isProcessing || this.pages.length === 0) return;
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
      const mod = this.activePdfModule;
      let result = null;

      // Always assemble the current customized page sequence
      const compiled = await PdfTools.assemblePdfFromPages(this.pages, onProgress);
      const compiledFile = new File([compiled.blob], compiled.fileName, { type: 'application/pdf' });

      if (mod === 'compress') {
        const targetKB = sidebarArea.querySelector('#targetKbInput')?.value || 200;
        const strictCeiling = sidebarArea.querySelector('#strictCeilingCheck')?.checked ?? true;
        result = await PdfTools.compressPdf(compiledFile, targetKB, strictCeiling, onProgress);
      } else if (mod === 'sign') {
        const sigCanvas = sidebarArea.querySelector('#sigCanvas');
        const sigData = sigCanvas ? sigCanvas.toDataURL('image/png') : '';
        result = await PdfTools.signPdf(compiledFile, sigData, onProgress);
      } else if (mod === 'watermark') {
        const text = sidebarArea.querySelector('#watermarkTextInput')?.value || 'CONFIDENTIAL';
        const opacity = (sidebarArea.querySelector('#watermarkOpacity')?.value || 30) / 100;
        result = await PdfTools.addWatermark(compiledFile, text, opacity, onProgress);
      } else if (mod === 'numbers') {
        const pos = sidebarArea.querySelector('.preset-btn[data-pos].active')?.dataset?.pos || 'bottom-center';
        result = await PdfTools.addPageNumbers(compiledFile, pos, onProgress);
      } else if (mod === 'security') {
        const pwd = sidebarArea.querySelector('#pdfPasswordInput')?.value || '123456';
        result = await PdfTools.protectPdf(compiledFile, pwd, onProgress);
      } else if (mod === 'convert') {
        const convType = sidebarArea.querySelector('.preset-btn[data-conv].active')?.dataset?.conv || 'jpg';
        if (convType === 'ocr') result = await PdfTools.ocrPdf(compiledFile, 'eng', onProgress);
        else if (convType === 'pdfa') result = await PdfTools.pdfToPdfA(compiledFile, onProgress);
        else result = await PdfTools.pdfToJpg(compiledFile, 2.0, onProgress);
      } else if (mod === 'repair') {
        const repairType = sidebarArea.querySelector('.preset-btn[data-repair].active')?.dataset?.repair || 'xref';
        if (repairType === 'redact') result = await PdfTools.redactPdf(compiledFile, onProgress);
        else result = await PdfTools.repairPdf(compiledFile, onProgress);
      } else {
        // organize export mode
        const exportMode = sidebarArea.querySelector('.preset-btn[data-export-mode].active')?.dataset?.exportMode || 'merge';
        if (exportMode === 'crop') {
          const cropMargin = parseInt(sidebarArea.querySelector('#cropMarginSlider')?.value || 10);
          result = await PdfTools.cropPdf(compiledFile, cropMargin, onProgress);
        } else if (exportMode === 'split' && window.JSZip) {
          onProgress(20, "Generating split bundle...");
          const zip = new JSZip();
          const selectedPages = this.pages.filter(p => p.selected);
          for (let i = 0; i < selectedPages.length; i++) {
            const single = await PdfTools.assemblePdfFromPages([selectedPages[i]], () => {});
            zip.file(`page-${selectedPages[i].pageNumber}-${selectedPages[i].fileName}`, single.blob);
          }
          const zipBlob = await zip.generateAsync({ type: 'blob' });
          result = {
            blob: zipBlob,
            blobUrl: URL.createObjectURL(zipBlob),
            fileName: 'split-pages-bundle.zip',
            sizeKB: Math.round(zipBlob.size / 1024),
            totalPages: selectedPages.length
          };
        } else {
          result = compiled;
        }
      }

      this.resultData = result;
      this.isProcessing = false;
      this.renderWorkspace();
      this.showToast("Success! Document processed.");

      if (result.blobUrl && result.fileName && !result.fileName.endsWith('.zip')) {
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
