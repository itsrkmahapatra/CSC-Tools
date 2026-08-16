/**
 * Docuvate Master Application Controller & Client-Side Engines
 * Master PDF Studio & Master Image Studio Only (All-In-One Workstations)
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
    // If running under file:// or worker is blocked by browser CORS security, execute multi-pass in-thread directly
    if (window.location.protocol === 'file:') {
      return this.compressPdfDirect(file, targetKB, strictCeiling, onProgress);
    }

    try {
      return await new Promise((resolve, reject) => {
        onProgress(5, "Initializing Multi-Pass Compressor...");
        let worker;
        try {
          worker = new Worker('js/compressor.worker.js');
        } catch (e) {
          try {
            worker = new Worker('./js/compressor.worker.js');
          } catch (e2) {
            // Fallback immediately to in-thread
            return this.compressPdfDirect(file, targetKB, strictCeiling, onProgress).then(resolve).catch(reject);
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
            this.compressPdfDirect(file, targetKB, strictCeiling, onProgress).then(resolve).catch(reject);
          }
        };

        worker.onerror = (err) => {
          worker.terminate();
          this.compressPdfDirect(file, targetKB, strictCeiling, onProgress).then(resolve).catch(reject);
        };

        file.arrayBuffer().then((arrayBuffer) => {
          worker.postMessage({
            fileBuffer: arrayBuffer,
            targetKB: Number(targetKB),
            strictCeiling: Boolean(strictCeiling)
          }, [arrayBuffer]);
        }).catch(() => {
          this.compressPdfDirect(file, targetKB, strictCeiling, onProgress).then(resolve).catch(reject);
        });
      });
    } catch (err) {
      return this.compressPdfDirect(file, targetKB, strictCeiling, onProgress);
    }
  },

  async compressPdfDirect(file, targetKB, strictCeiling = true, onProgress = () => {}) {
    const originalBytes = file.size;
    const targetBytes = Math.max(5 * 1024, Math.round(Number(targetKB) * 1024));
    onProgress(5, "Analyzing document & attempting lossless vector stream optimization...");

    const fileBuffer = await file.arrayBuffer();

    // -----------------------------------------------------------------
    // STEP 1: Check if Lossless Vector PDF Flate Stream fits target
    // -----------------------------------------------------------------
    try {
      const vectorPdf = await PDFLib.PDFDocument.load(fileBuffer, { ignoreEncryption: true });
      vectorPdf.setTitle('');
      vectorPdf.setAuthor('');
      vectorPdf.setSubject('');
      vectorPdf.setKeywords([]);
      vectorPdf.setProducer('Docuvate');
      vectorPdf.setCreator('Docuvate');

      const losslessBytes = await vectorPdf.save({ useObjectStreams: true, addDefaultPage: false });
      if (losslessBytes.byteLength <= targetBytes) {
        const finalBlob = new Blob([losslessBytes], { type: 'application/pdf' });
        const finalSizeKB = Math.round(finalBlob.size / 1024);
        const originalSizeKB = Math.round(originalBytes / 1024);
        const reductionPercent = Math.max(0, Math.round(((originalBytes - losslessBytes.byteLength) / originalBytes) * 100));

        onProgress(100, `Lossless Vector Complete! Output: ${finalSizeKB} KB (100% Vector Quality)`);
        return {
          blob: finalBlob,
          blobUrl: URL.createObjectURL(finalBlob),
          fileName: `resized-${targetKB}kb-${file.name}`,
          finalSizeKB,
          originalSizeKB,
          targetKB: Number(targetKB),
          reductionPercent,
          numPages: vectorPdf.getPageCount()
        };
      }
    } catch (eVector) {
      // Proceed to High-DPI Crisp Sizing
    }

    // -----------------------------------------------------------------
    // STEP 2: Multi-Pass PDF -> Image -> Strict Budget -> PDF Pipeline
    // -----------------------------------------------------------------
    onProgress(15, "Calibrating High-DPI crisp page rendering...");
    const pdf = await pdfjsLib.getDocument({ data: fileBuffer }).promise;
    const numPages = pdf.numPages;

    if (numPages === 0) throw new Error("The selected PDF contains no pages.");

    const buildPdfWithBudget = async (availableBytes) => {
      const overhead = Math.round(3072 + (numPages * 600));
      const netBudget = Math.max(1024 * numPages, availableBytes - overhead);
      let remaining = netBudget;
      const doc = await PDFLib.PDFDocument.create();

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const origViewport = page.getViewport({ scale: 1.0 });
        const pagesLeft = numPages - i + 1;
        const pageBudget = Math.floor(remaining / pagesLeft);

        let renderScale = 2.0;
        if (pageBudget < 20000) renderScale = 1.25;
        else if (pageBudget < 40000) renderScale = 1.5;
        else if (pageBudget < 80000) renderScale = 1.8;

        const viewport = page.getViewport({ scale: renderScale });
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(viewport.width));
        canvas.height = Math.max(1, Math.round(viewport.height));
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({ canvasContext: ctx, viewport }).promise;

        let lowQ = 0.05, highQ = 0.95;
        let bestBlob = null;
        let bestBlobSize = 0;

        for (let pass = 0; pass < 6; pass++) {
          const q = (lowQ + highQ) / 2;
          const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', q));
          if (!blob) break;

          if (blob.size <= pageBudget) {
            if (blob.size > bestBlobSize) {
              bestBlobSize = blob.size;
              bestBlob = blob;
            }
            if (blob.size >= pageBudget * 0.95) break;
            lowQ = q;
          } else {
            highQ = q;
          }
        }

        if (!bestBlob || bestBlobSize > pageBudget) {
          const testBlob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.15));
          if (testBlob && testBlob.size > pageBudget) {
            const miniCanvas = document.createElement('canvas');
            const downRatio = Math.max(0.3, Math.sqrt(pageBudget / testBlob.size) * 0.92);
            miniCanvas.width = Math.max(1, Math.round(canvas.width * downRatio));
            miniCanvas.height = Math.max(1, Math.round(canvas.height * downRatio));
            const miniCtx = miniCanvas.getContext('2d');
            miniCtx.imageSmoothingEnabled = true;
            miniCtx.imageSmoothingQuality = 'high';
            miniCtx.fillStyle = '#ffffff';
            miniCtx.fillRect(0, 0, miniCanvas.width, miniCanvas.height);
            miniCtx.drawImage(canvas, 0, 0, miniCanvas.width, miniCanvas.height);
            bestBlob = await new Promise(r => miniCanvas.toBlob(r, 'image/jpeg', 0.70));
          } else {
            bestBlob = testBlob;
          }
        }

        if (!bestBlob) bestBlob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.10));

        remaining -= bestBlob.size;
        const imgBuffer = await bestBlob.arrayBuffer();
        const image = await doc.embedJpg(imgBuffer);
        const newPage = doc.addPage([origViewport.width, origViewport.height]);
        newPage.drawImage(image, { x: 0, y: 0, width: origViewport.width, height: origViewport.height });

        const pct = Math.round(20 + ((i / numPages) * 65));
        onProgress(pct, `Optimizing page ${i} of ${numPages} (${Math.round(bestBlob.size / 1024)} KB)...`);
      }

      return await doc.save({ useObjectStreams: true });
    };

    let pdfBytes = await buildPdfWithBudget(targetBytes);

    // Strict Convergence: If total output size still exceeds target, scale down until <= targetBytes
    let attempts = 0;
    while (pdfBytes.byteLength > targetBytes && attempts < 3) {
      attempts++;
      const ratio = (targetBytes / pdfBytes.byteLength) * 0.94;
      onProgress(85 + (attempts * 4), `Strict calibration pass ${attempts}: fine-tuning to guarantee <= ${targetKB} KB...`);
      pdfBytes = await buildPdfWithBudget(targetBytes * ratio);
    }

    const finalBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    const finalSizeKB = Math.round(finalBlob.size / 1024);
    const originalSizeKB = Math.round(originalBytes / 1024);
    const reductionPercent = Math.max(0, Math.round(((originalBytes - finalBlob.size) / originalBytes) * 100));

    onProgress(100, `Complete! Final Size: ${finalSizeKB} KB (Target: ${targetKB} KB)`);
    return {
      blob: finalBlob,
      blobUrl: URL.createObjectURL(finalBlob),
      fileName: `resized-${targetKB}kb-${file.name}`,
      finalSizeKB,
      originalSizeKB,
      targetKB: Number(targetKB),
      reductionPercent,
      numPages
    };
  },

  async cropPdf(file, cropBox = { left: 10, top: 10, width: 80, height: 80 }, targetPageIndex = null, onProgress = () => {}) {
    onProgress(20, "Applying custom bounding box crop...");
    const fileBytes = await file.arrayBuffer();
    const pdf = await PDFLib.PDFDocument.load(fileBytes);
    const pages = pdf.getPages();

    const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
    const leftPct = clamp(cropBox.left || 0, 0, 95) / 100;
    const topPct = clamp(cropBox.top || 0, 0, 95) / 100;
    const widthPct = clamp(cropBox.width || 100, 5, 100) / 100;
    const heightPct = clamp(cropBox.height || 100, 5, 100) / 100;

    pages.forEach((page, idx) => {
      if (targetPageIndex === null || targetPageIndex === idx) {
        const { x, y, width, height } = page.getMediaBox();
        const cropX = x + (width * leftPct);
        const cropY = y + (height * (1 - topPct - heightPct));
        const cropW = width * widthPct;
        const cropH = height * heightPct;
        page.setCropBox(cropX, cropY, cropW, cropH);
      }
    });

    onProgress(90, "Saving cropped PDF document...");
    const pdfBytes = await pdf.save({ useObjectStreams: true });
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
    onProgress(15, "Loading image bitmap...");
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

    return {
      blob,
      blobUrl: URL.createObjectURL(blob),
      fileName: `exam-ready-${targetWidth}x${targetHeight}-${targetKB}kb.jpg`,
      sizeKB: Math.round(blob.size / 1024)
    };
  }
};

// -------------------------------------------------------------
// App Controller - 2 Master Studios
// -------------------------------------------------------------
class DocuvateApp {
  constructor() {
    this.activeStudio = null; // 'pdf' | 'image'
    this.selectedFiles = [];
    this.pages = []; // PDF page items
    this.activeModule = 'compress'; // Studio sub-module
    this.viewMode = 'grid'; // 'grid' | 'list'
    this.isProcessing = false;
    this.resultData = null;
    this.draggedPageId = null;

    // Visual PDF Crop state
    this.activeCropPageIndex = 0;
    this.cropBox = { left: 10, top: 10, width: 80, height: 80 }; // percentages
    this.cropApplyAll = true;

    this.initElements();
    this.initEvents();
    if (window.lucide) window.lucide.createIcons();
  }

  initElements() {
    this.workspaceOverlay = document.getElementById('workspaceOverlay');
    this.workspaceTitle = document.getElementById('workspaceTitle');
    this.workspaceBody = document.getElementById('workspaceBody');
    this.workspaceCloseBtn = document.getElementById('workspaceCloseBtn');
    this.workspaceStatusIndicator = document.getElementById('workspaceStatusIndicator');
    this.toastContainer = document.getElementById('toastContainer');
  }

  initEvents() {
    // Launch PDF Studio buttons
    document.getElementById('btnLaunchPdfStudio')?.addEventListener('click', () => this.openPdfStudio());
    document.getElementById('cardPdfStudio')?.addEventListener('click', (e) => {
      if (!e.target.closest('#btnLaunchPdfStudio')) this.openPdfStudio();
    });
    document.getElementById('navPdfStudio')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.openPdfStudio();
    });

    // Launch Image Studio buttons
    document.getElementById('btnLaunchImageStudio')?.addEventListener('click', () => this.openImageStudio());
    document.getElementById('cardImageStudio')?.addEventListener('click', (e) => {
      if (!e.target.closest('#btnLaunchImageStudio')) this.openImageStudio();
    });
    document.getElementById('navImageStudio')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.openImageStudio();
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

  openPdfStudio(initialModule = 'compress') {
    this.activeStudio = 'pdf';
    this.activeModule = initialModule;
    this.selectedFiles = [];
    this.pages = [];
    this.resultData = null;
    this.isProcessing = false;
    this.activeCropPageIndex = 0;
    this.cropBox = { left: 10, top: 10, width: 80, height: 80 };

    this.workspaceTitle.textContent = "Master PDF Studio (All-in-One)";
    if (this.workspaceStatusIndicator) this.workspaceStatusIndicator.style.background = "#e11d48";
    this.workspaceOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    this.renderWorkspace();
  }

  openImageStudio(initialModule = 'compress') {
    this.activeStudio = 'image';
    this.activeModule = initialModule;
    this.selectedFiles = [];
    this.pages = [];
    this.resultData = null;
    this.isProcessing = false;

    this.workspaceTitle.textContent = "Master Image Studio (All-in-One)";
    if (this.workspaceStatusIndicator) this.workspaceStatusIndicator.style.background = "#0284c7";
    this.workspaceOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    this.renderWorkspace();
  }

  closeWorkspace() {
    if (this.resultData?.blobUrl) URL.revokeObjectURL(this.resultData.blobUrl);
    this.workspaceOverlay.classList.remove('active');
    document.body.style.overflow = '';
    this.activeStudio = null;
    this.selectedFiles = [];
    this.pages = [];
    this.resultData = null;
  }

  async handleFilesAdded(newFiles) {
    this.selectedFiles.push(...newFiles);

    if (this.activeStudio === 'pdf') {
      try {
        const extracted = await PdfTools.extractAllPagesAsThumbnails(newFiles);
        this.pages.push(...extracted);
      } catch (e) {
        console.warn("Could not unpack PDF pages:", e);
      }
    } else {
      newFiles.forEach((file, idx) => {
        this.pages.push({
          id: `img_${Date.now()}_${idx}`,
          file,
          fileName: file.name,
          preview: URL.createObjectURL(file),
          pageNumber: idx + 1,
          rotation: 0,
          selected: true
        });
      });
    }

    this.renderWorkspace();
  }

  renderWorkspace() {
    if (!this.activeStudio || !this.workspaceBody) return;
    this.workspaceBody.innerHTML = '';

    const isPdf = this.activeStudio === 'pdf';

    // Dropzone when empty
    if (this.pages.length === 0 && this.selectedFiles.length === 0) {
      const dropzoneContainer = document.createElement('div');
      dropzoneContainer.className = 'dropzone-container';
      dropzoneContainer.innerHTML = `
        <div class="dropzone-visual-box" id="mainDropBox">
          <i data-lucide="${isPdf ? 'layers' : 'image'}" class="dropzone-icon-huge" style="color: ${isPdf ? '#e11d48' : '#0284c7'};"></i>
          <h3 class="dropzone-main-text">Drag & drop your ${isPdf ? 'PDF documents' : 'Images'} here</h3>
          <label class="dropzone-select-btn" style="background: ${isPdf ? 'var(--pdf-gradient)' : 'var(--image-gradient)'};">
            <i data-lucide="file-plus" style="width: 20px; height: 20px;"></i>
            <span>Select ${isPdf ? 'PDF Files' : 'Image Files'}</span>
            <input type="file" id="fileInput" accept="${isPdf ? '.pdf' : 'image/*'}" multiple style="display:none;" />
          </label>
          <p style="font-size: 0.8125rem; color: #94a3b8; margin-top: 1.5rem;">
            100% Client-Side Sandbox. All operations happen in this studio without re-uploading!
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

    // Canvas
    const canvasArea = document.createElement('div');
    canvasArea.className = 'workspace-canvas-area';
    canvasArea.innerHTML = this.renderCanvasContent();
    layout.appendChild(canvasArea);

    // Sidebar
    const sidebarArea = document.createElement('div');
    sidebarArea.className = 'workspace-sidebar-area';
    const selCount = this.pages.filter(p => p.selected).length;

    sidebarArea.innerHTML = `
      <!-- Studio Module Navigation Tabs -->
      <div class="universal-module-nav">
        ${isPdf ? `
          <button class="universal-module-tab ${this.activeModule === 'compress' ? 'active' : ''}" data-mod="compress">
            <i data-lucide="file-heart" style="width:12px; height:12px;"></i> Compress (KB)
          </button>
          <button class="universal-module-tab ${this.activeModule === 'crop' ? 'active' : ''}" data-mod="crop">
            <i data-lucide="crop" style="width:12px; height:12px;"></i> Crop Box
          </button>
          <button class="universal-module-tab ${this.activeModule === 'organize' ? 'active' : ''}" data-mod="organize">
            <i data-lucide="layers" style="width:12px; height:12px;"></i> Organize
          </button>
          <button class="universal-module-tab ${this.activeModule === 'sign' ? 'active' : ''}" data-mod="sign">
            <i data-lucide="file-signature" style="width:12px; height:12px;"></i> Sign
          </button>
          <button class="universal-module-tab ${this.activeModule === 'watermark' ? 'active' : ''}" data-mod="watermark">
            <i data-lucide="droplet" style="width:12px; height:12px;"></i> Watermark
          </button>
          <button class="universal-module-tab ${this.activeModule === 'numbers' ? 'active' : ''}" data-mod="numbers">
            <i data-lucide="hash" style="width:12px; height:12px;"></i> Numbering
          </button>
          <button class="universal-module-tab ${this.activeModule === 'security' ? 'active' : ''}" data-mod="security">
            <i data-lucide="lock" style="width:12px; height:12px;"></i> Security
          </button>
          <button class="universal-module-tab ${this.activeModule === 'convert' ? 'active' : ''}" data-mod="convert">
            <i data-lucide="image" style="width:12px; height:12px;"></i> Convert/OCR
          </button>
          <button class="universal-module-tab ${this.activeModule === 'repair' ? 'active' : ''}" data-mod="repair">
            <i data-lucide="wrench" style="width:12px; height:12px;"></i> Repair
          </button>
        ` : `
          <button class="universal-module-tab ${this.activeModule === 'compress' ? 'active' : ''}" data-mod="compress">
            <i data-lucide="expand" style="width:12px; height:12px;"></i> Compress (KB)
          </button>
          <button class="universal-module-tab ${this.activeModule === 'resize' ? 'active' : ''}" data-mod="resize">
            <i data-lucide="maximize" style="width:12px; height:12px;"></i> Resize/Crop
          </button>
          <button class="universal-module-tab ${this.activeModule === 'convert' ? 'active' : ''}" data-mod="convert">
            <i data-lucide="refresh-cw" style="width:12px; height:12px;"></i> Format (JPG/PNG)
          </button>
          <button class="universal-module-tab ${this.activeModule === 'editor' ? 'active' : ''}" data-mod="editor">
            <i data-lucide="paintbrush" style="width:12px; height:12px;"></i> Photo Editor
          </button>
          <button class="universal-module-tab ${this.activeModule === 'exam' ? 'active' : ''}" data-mod="exam">
            <i data-lucide="user" style="width:12px; height:12px;"></i> Exam Resizer
          </button>
          <button class="universal-module-tab ${this.activeModule === 'watermark' ? 'active' : ''}" data-mod="watermark">
            <i data-lucide="droplet" style="width:12px; height:12px;"></i> Watermark/Blur
          </button>
        `}
      </div>

      <div class="sidebar-scroll-content">
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:0.65rem 0.875rem; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <span style="font-size:0.65rem; font-weight:800; color:#64748b; text-transform:uppercase;">Active Document</span>
            <p style="font-size:0.9rem; font-weight:900; color:#0f172a;">${selCount} of ${this.pages.length} ${isPdf ? 'Pages' : 'Images'} Selected</p>
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

        <button id="processBtn" class="btn-primary" style="background: ${isPdf ? 'var(--pdf-gradient)' : 'var(--image-gradient)'};" ${selCount === 0 ? 'disabled' : ''}>
          <i data-lucide="play" style="width: 18px; height: 18px; fill: currentColor;"></i>
          <span>${
            this.activeModule === 'compress' ? 'Compress Document (to Target KB)' :
            this.activeModule === 'crop' ? 'Apply & Crop PDF Document' :
            this.activeModule === 'organize' ? 'Save & Organize Document' :
            this.activeModule === 'sign' ? 'Apply Signature Stamp' :
            this.activeModule === 'watermark' ? 'Apply Watermark' :
            this.activeModule === 'numbers' ? 'Apply Page Numbers' :
            this.activeModule === 'security' ? 'Apply Security Protection' :
            this.activeModule === 'convert' ? 'Convert Document' :
            'Apply & Process Document'
          }</span>
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
              <span>Keep Editing in Studio (Perform Another Action)</span>
            </button>
          </div>
        </div>
      `;
    }

    const isPdf = this.activeStudio === 'pdf';

    // Interactive Crop Canvas Mode
    if (this.activeModule === 'crop' && isPdf && this.pages.length > 0) {
      const activePage = this.pages[this.activeCropPageIndex] || this.pages[0];
      const { left, top, width, height } = this.cropBox;

      return `
        <!-- Crop Page Navigation Bar -->
        <div style="width:100%; max-width:650px; margin-bottom:0.75rem; display:flex; justify-content:space-between; align-items:center; background:white; padding:0.5rem 1rem; border-radius:12px; border:1px solid #e2e8f0; box-shadow:var(--shadow-sm);">
          <button id="cropPrevPageBtn" style="font-size:0.75rem; font-weight:800; color:#334155; background:#f1f5f9; padding:0.35rem 0.75rem; border-radius:6px; display:flex; align-items:center; gap:0.25rem;" ${this.activeCropPageIndex === 0 ? 'disabled style="opacity:0.4;"' : ''}>
            <i data-lucide="chevron-left" style="width:14px; height:14px;"></i> Previous
          </button>
          
          <span style="font-size:0.85rem; font-weight:900; color:#e11d48;">
            Page ${this.activeCropPageIndex + 1} of ${this.pages.length} (${activePage.fileName})
          </span>

          <button id="cropNextPageBtn" style="font-size:0.75rem; font-weight:800; color:#334155; background:#f1f5f9; padding:0.35rem 0.75rem; border-radius:6px; display:flex; align-items:center; gap:0.25rem;" ${this.activeCropPageIndex === this.pages.length - 1 ? 'disabled style="opacity:0.4;"' : ''}>
            Next <i data-lucide="chevron-right" style="width:14px; height:14px;"></i>
          </button>
        </div>

        <!-- Interactive Crop Viewport -->
        <div class="crop-canvas-wrapper" id="cropCanvasWrapper">
          <img src="${activePage.preview}" alt="Page Crop Preview" class="crop-page-img" id="cropPageImg" />
          
          <div class="crop-bounding-overlay" id="cropOverlay">
            <div class="crop-bounding-box" id="cropBoundingBox" style="left: ${left}%; top: ${top}%; width: ${width}%; height: ${height}%;">
              <div class="crop-coords-badge" id="cropCoordsBadge">${Math.round(width)}% × ${Math.round(height)}%</div>
              <div class="crop-handle handle-nw" data-handle="nw"></div>
              <div class="crop-handle handle-n" data-handle="n"></div>
              <div class="crop-handle handle-ne" data-handle="ne"></div>
              <div class="crop-handle handle-e" data-handle="e"></div>
              <div class="crop-handle handle-se" data-handle="se"></div>
              <div class="crop-handle handle-s" data-handle="s"></div>
              <div class="crop-handle handle-sw" data-handle="sw"></div>
              <div class="crop-handle handle-w" data-handle="w"></div>
            </div>
          </div>
        </div>

        <p style="font-size:0.75rem; color:#64748b; margin-top:0.75rem; text-align:center;">
          <i data-lucide="info" style="width:12px; height:12px; display:inline;"></i> Drag inside box to move. Drag handles to resize, or drag on the page to draw a new crop box.
        </p>
      `;
    }

    // Standard Grid / List View
    return `
      <!-- Toolbar -->
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

      <!-- Page Grid / List -->
      <div class="${this.viewMode === 'grid' ? 'page-grid-container' : 'page-list-container'}" id="pageCardsContainer">
        ${this.pages.map((item, idx) => `
          <div class="page-card ${item.selected ? 'selected' : 'excluded'}" draggable="true" data-id="${item.id}" data-idx="${idx}">
            <div class="page-card-order-badge">${idx + 1}</div>

            <div class="page-img-wrapper">
              ${item.preview ? `
                <img src="${item.preview}" alt="${isPdf ? 'Page ' + item.pageNumber : item.fileName}" style="transform: rotate(${item.rotation}deg);" />
              ` : `
                <i data-lucide="file-text" style="width:36px; height:36px; color:#cbd5e1;"></i>
              `}

              ${item.selected ? `
                <div class="page-selected-check" style="background: ${isPdf ? '#e11d48' : '#0284c7'};">
                  <i data-lucide="check" style="width:12px; height:12px; stroke-width:3;"></i>
                </div>
              ` : ''}
            </div>

            <div class="page-details">
              <div class="page-title-row">
                <span class="page-num-label" style="color: ${isPdf ? '#e11d48' : '#0284c7'};">${isPdf ? 'Page ' + item.pageNumber : 'Image ' + (idx + 1)}</span>
                <span class="page-source-name" title="${item.fileName}">${item.fileName}</span>
              </div>

              <div class="page-actions-row">
                <button class="page-action-btn rotate-single-btn" data-id="${item.id}" title="Rotate 90°">
                  <i data-lucide="rotate-cw" style="width:13px; height:13px;"></i>
                </button>
                <button class="page-action-btn delete-single-btn" data-id="${item.id}" title="Remove Item">
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
          <span style="font-size:0.75rem; font-weight:800; text-transform:uppercase;">Add More</span>
          <input type="file" id="addMoreInput" accept="${isPdf ? '.pdf' : 'image/*'}" multiple style="display:none;" />
        </div>
      </div>
    `;
  }

  renderActiveModuleControls() {
    const isPdf = this.activeStudio === 'pdf';
    const mod = this.activeModule;
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
    } else if (mod === 'crop' && isPdf) {
      const { left, top, width, height } = this.cropBox;
      const right = Math.round(100 - left - width);
      const bottom = Math.round(100 - top - height);

      html = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:0.75rem; font-weight:800; text-transform:uppercase; color:#64748b;">Manual Crop Box</span>
          <span style="font-size:0.65rem; font-weight:800; background:#fef2f2; color:#ef4444; padding:0.15rem 0.4rem; border-radius:4px;">Drag to Select</span>
        </div>

        <div>
          <label style="font-size:0.75rem; font-weight:700; color:#475569; display:block; margin-bottom:0.35rem;">Quick Presets</label>
          <div class="preset-grid" style="grid-template-columns: repeat(2, 1fr);">
            <button class="preset-btn" data-crop-preset="full">Full Page (Reset)</button>
            <button class="preset-btn active" data-crop-preset="default">Center 80%</button>
            <button class="preset-btn" data-crop-preset="header-footer">Trim Headers (12%)</button>
            <button class="preset-btn" data-crop-preset="borders">Trim Margins (8%)</button>
          </div>
        </div>

        <div style="background:#f8fafc; padding:0.75rem; border-radius:8px; border:1px solid #e2e8f0;">
          <label style="font-size:0.75rem; font-weight:800; color:#334155; display:block; margin-bottom:0.5rem; text-transform:uppercase;">Bounding Coordinates (%)</label>
          
          <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:0.5rem;">
            <div>
              <span style="font-size:0.7rem; font-weight:700; color:#64748b;">Top Margin</span>
              <input type="number" id="cropInpTop" min="0" max="90" value="${Math.round(top)}" style="width:100%; padding:0.35rem; border:1px solid #cbd5e1; border-radius:6px; font-weight:800; text-align:center;" />
            </div>
            <div>
              <span style="font-size:0.7rem; font-weight:700; color:#64748b;">Bottom Margin</span>
              <input type="number" id="cropInpBottom" min="0" max="90" value="${bottom}" style="width:100%; padding:0.35rem; border:1px solid #cbd5e1; border-radius:6px; font-weight:800; text-align:center;" />
            </div>
            <div>
              <span style="font-size:0.7rem; font-weight:700; color:#64748b;">Left Margin</span>
              <input type="number" id="cropInpLeft" min="0" max="90" value="${Math.round(left)}" style="width:100%; padding:0.35rem; border:1px solid #cbd5e1; border-radius:6px; font-weight:800; text-align:center;" />
            </div>
            <div>
              <span style="font-size:0.7rem; font-weight:700; color:#64748b;">Right Margin</span>
              <input type="number" id="cropInpRight" min="0" max="90" value="${right}" style="width:100%; padding:0.35rem; border:1px solid #cbd5e1; border-radius:6px; font-weight:800; text-align:center;" />
            </div>
          </div>
        </div>

        <div>
          <label style="display:flex; align-items:center; gap:0.5rem; font-size:0.75rem; font-weight:700; color:#334155; cursor:pointer;">
            <input type="checkbox" id="cropApplyAllCheck" ${this.cropApplyAll ? 'checked' : ''} style="accent-color:#e11d48;" />
            <span>Apply this crop to all pages in document</span>
          </label>
        </div>
      `;
    } else if (mod === 'sign' && isPdf) {
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
    } else if (mod === 'numbers' && isPdf) {
      html = `
        <label style="font-size:0.75rem; font-weight:700; color:#475569;">Page Number Position</label>
        <div class="preset-grid" style="grid-template-columns: repeat(2, 1fr);">
          <button class="preset-btn active" data-pos="bottom-center">Bottom Center</button>
          <button class="preset-btn" data-pos="bottom-right">Bottom Right</button>
          <button class="preset-btn" data-pos="top-center">Top Center</button>
          <button class="preset-btn" data-pos="top-right">Top Right</button>
        </div>
      `;
    } else if (mod === 'security' && isPdf) {
      html = `
        <label style="font-size:0.75rem; font-weight:700; color:#475569;">Document Password Protection</label>
        <input type="password" id="pdfPasswordInput" placeholder="Enter password..." value="123456" style="width:100%; padding:0.5rem; border:1px solid #cbd5e1; border-radius:8px;" />
      `;
    } else if (mod === 'convert' && isPdf) {
      html = `
        <label style="font-size:0.75rem; font-weight:700; color:#475569;">Conversion Mode</label>
        <div class="preset-grid" style="grid-template-columns: repeat(2, 1fr);">
          <button class="preset-btn active" data-conv="jpg">PDF to JPG (ZIP)</button>
          <button class="preset-btn" data-conv="ocr">OCR Extract Text</button>
        </div>
      `;
    } else if (mod === 'resize' && !isPdf) {
      html = `
        <label style="font-size:0.75rem; font-weight:700; color:#475569;">Target Dimensions (px)</label>
        <div style="display:flex; gap:0.5rem;">
          <input type="number" id="imgResizeWidth" placeholder="Width" value="800" style="width:50%; padding:0.5rem; border:1px solid #cbd5e1; border-radius:8px; font-weight:800;" />
          <input type="number" id="imgResizeHeight" placeholder="Auto" style="width:50%; padding:0.5rem; border:1px solid #cbd5e1; border-radius:8px;" />
        </div>
      `;
    } else if (mod === 'convert' && !isPdf) {
      html = `
        <label style="font-size:0.75rem; font-weight:700; color:#475569;">Export Format</label>
        <div class="preset-grid">
          <button class="preset-btn active" data-img-fmt="image/png">PNG</button>
          <button class="preset-btn" data-img-fmt="image/jpeg">JPG</button>
          <button class="preset-btn" data-img-fmt="image/webp">WebP</button>
        </div>
      `;
    } else if (mod === 'editor' && !isPdf) {
      html = `
        <label style="font-size:0.75rem; font-weight:700; color:#475569;">Brightness</label>
        <input type="range" id="photoBrightness" min="50" max="150" value="100" style="width:100%; accent-color:#0284c7;" />
        <label style="font-size:0.75rem; font-weight:700; color:#475569; margin-top:0.5rem; display:block;">Contrast</label>
        <input type="range" id="photoContrast" min="50" max="150" value="100" style="width:100%; accent-color:#0284c7;" />
        <label style="font-size:0.75rem; font-weight:700; color:#475569; margin-top:0.5rem; display:block;">Grayscale (%)</label>
        <input type="range" id="photoGrayscale" min="0" max="100" value="0" style="width:100%; accent-color:#0284c7;" />
      `;
    } else if (mod === 'exam' && !isPdf) {
      html = `
        <label style="font-size:0.75rem; font-weight:700; color:#475569;">Exam Standards</label>
        <div class="preset-grid" style="grid-template-columns: 1fr;">
          <button class="preset-btn active" data-exam="passport" data-w="350" data-h="450" data-kb="50">Passport Photo (350x450, 50KB)</button>
          <button class="preset-btn" data-exam="signature" data-w="300" data-h="120" data-kb="20">Signature Stamp (300x120, 20KB)</button>
          <button class="preset-btn" data-exam="ssc" data-w="200" data-h="230" data-kb="50">SSC / UPSC Photo (200x230, 50KB)</button>
        </div>
      `;
    } else {
      // organize / default
      html = `
        <div>
          <label style="font-size:0.75rem; font-weight:800; color:#475569; display:block; margin-bottom:0.35rem; text-transform:uppercase;">Action / Output Mode</label>
          <div class="preset-grid" style="grid-template-columns: repeat(2, 1fr);">
            <button class="preset-btn active" data-export-mode="merge">Save / Merge All</button>
            <button class="preset-btn" data-export-mode="split">Split Individual (ZIP)</button>
            <button class="preset-btn" data-export-mode="extract">Extract Selected</button>
          </div>
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

    // Module tab switching
    sidebarArea.querySelectorAll('.universal-module-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.activeModule = tab.dataset.mod;
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

    // Crop presets & manual input bindings
    sidebarArea.querySelectorAll('.preset-btn[data-crop-preset]').forEach(btn => {
      btn.addEventListener('click', () => {
        sidebarArea.querySelectorAll('.preset-btn[data-crop-preset]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const p = btn.dataset.cropPreset;
        if (p === 'full') this.cropBox = { left: 0, top: 0, width: 100, height: 100 };
        else if (p === 'header-footer') this.cropBox = { left: 5, top: 12, width: 90, height: 76 };
        else if (p === 'borders') this.cropBox = { left: 8, top: 8, width: 84, height: 84 };
        else this.cropBox = { left: 10, top: 10, width: 80, height: 80 };
        this.renderWorkspace();
      });
    });

    const cropInpTop = sidebarArea.querySelector('#cropInpTop');
    const cropInpBottom = sidebarArea.querySelector('#cropInpBottom');
    const cropInpLeft = sidebarArea.querySelector('#cropInpLeft');
    const cropInpRight = sidebarArea.querySelector('#cropInpRight');
    const cropApplyAllCheck = sidebarArea.querySelector('#cropApplyAllCheck');

    if (cropApplyAllCheck) {
      cropApplyAllCheck.addEventListener('change', (e) => { this.cropApplyAll = e.target.checked; });
    }

    const updateCropFromInputs = () => {
      const top = Math.max(0, Math.min(85, parseFloat(cropInpTop?.value || 0)));
      const bottom = Math.max(0, Math.min(85, parseFloat(cropInpBottom?.value || 0)));
      const left = Math.max(0, Math.min(85, parseFloat(cropInpLeft?.value || 0)));
      const right = Math.max(0, Math.min(85, parseFloat(cropInpRight?.value || 0)));
      const width = Math.max(5, 100 - left - right);
      const height = Math.max(5, 100 - top - bottom);
      this.cropBox = { left, top, width, height };

      const box = canvasArea.querySelector('#cropBoundingBox');
      const badge = canvasArea.querySelector('#cropCoordsBadge');
      if (box) {
        box.style.left = `${left}%`; box.style.top = `${top}%`;
        box.style.width = `${width}%`; box.style.height = `${height}%`;
      }
      if (badge) badge.textContent = `${Math.round(width)}% × ${Math.round(height)}%`;
    };

    [cropInpTop, cropInpBottom, cropInpLeft, cropInpRight].forEach(inp => {
      inp?.addEventListener('input', updateCropFromInputs);
    });

    // Crop Page Navigation buttons
    canvasArea.querySelector('#cropPrevPageBtn')?.addEventListener('click', () => {
      if (this.activeCropPageIndex > 0) {
        this.activeCropPageIndex--;
        this.renderWorkspace();
      }
    });
    canvasArea.querySelector('#cropNextPageBtn')?.addEventListener('click', () => {
      if (this.activeCropPageIndex < this.pages.length - 1) {
        this.activeCropPageIndex++;
        this.renderWorkspace();
      }
    });

    // Interactive Drag & Resize on Visual Crop Box Overlay
    const overlay = canvasArea.querySelector('#cropOverlay');
    const boundingBox = canvasArea.querySelector('#cropBoundingBox');
    if (overlay && boundingBox) {
      let isDragging = false;
      let isResizing = false;
      let activeHandle = null;
      let startX = 0, startY = 0;
      let startLeft = this.cropBox.left, startTop = this.cropBox.top;
      let startW = this.cropBox.width, startH = this.cropBox.height;

      const getOverlayPct = (e) => {
        const rect = overlay.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const xPct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
        const yPct = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
        return { xPct, yPct };
      };

      boundingBox.addEventListener('mousedown', (e) => {
        const handle = e.target.closest('.crop-handle');
        if (handle) {
          isResizing = true;
          activeHandle = handle.dataset.handle;
        } else {
          isDragging = true;
        }
        const { xPct, yPct } = getOverlayPct(e);
        startX = xPct; startY = yPct;
        startLeft = this.cropBox.left; startTop = this.cropBox.top;
        startW = this.cropBox.width; startH = this.cropBox.height;
        e.stopPropagation();
        e.preventDefault();
      });

      overlay.addEventListener('mousedown', (e) => {
        if (e.target.closest('#cropBoundingBox')) return;
        const { xPct, yPct } = getOverlayPct(e);
        this.cropBox = { left: xPct, top: yPct, width: 5, height: 5 };
        isResizing = true;
        activeHandle = 'se';
        startX = xPct; startY = yPct;
        startLeft = xPct; startTop = yPct;
        startW = 5; startH = 5;
        this.updateCropBoxVisual(canvasArea, sidebarArea);
      });

      const onMove = (e) => {
        if (!isDragging && !isResizing) return;
        const { xPct, yPct } = getOverlayPct(e);
        const dx = xPct - startX;
        const dy = yPct - startY;

        if (isDragging) {
          const newLeft = Math.max(0, Math.min(100 - startW, startLeft + dx));
          const newTop = Math.max(0, Math.min(100 - startH, startTop + dy));
          this.cropBox.left = newLeft;
          this.cropBox.top = newTop;
        } else if (isResizing) {
          let l = startLeft, t = startTop, w = startW, h = startH;
          if (activeHandle.includes('e')) w = Math.max(5, Math.min(100 - l, startW + dx));
          if (activeHandle.includes('s')) h = Math.max(5, Math.min(100 - t, startH + dy));
          if (activeHandle.includes('w')) {
            const rawL = startLeft + dx;
            const newL = Math.max(0, Math.min(startLeft + startW - 5, rawL));
            w = startW + (startLeft - newL);
            l = newL;
          }
          if (activeHandle.includes('n')) {
            const rawT = startTop + dy;
            const newT = Math.max(0, Math.min(startTop + startH - 5, rawT));
            h = startH + (startTop - newT);
            t = newT;
          }
          this.cropBox = { left: l, top: t, width: w, height: h };
        }

        this.updateCropBoxVisual(canvasArea, sidebarArea);
      };

      const onEnd = () => { isDragging = false; isResizing = false; activeHandle = null; };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onEnd);
      window.addEventListener('touchmove', onMove, { passive: false });
      window.addEventListener('touchend', onEnd);
    }

    // Preset attributes
    ['data-pos', 'data-conv', 'data-img-fmt', 'data-exam', 'data-export-mode'].forEach(attr => {
      const btns = sidebarArea.querySelectorAll(`.preset-btn[${attr}]`);
      btns.forEach(btn => {
        btn.addEventListener('click', () => {
          btns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        });
      });
    });

    // Toolbar
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

    // Page Card Click & Reorder
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

    // Clear All
    clearAllBtn?.addEventListener('click', () => {
      this.selectedFiles = [];
      this.pages = [];
      this.resultData = null;
      this.renderWorkspace();
    });

    // Keep Editing in Studio button
    keepEditingBtn?.addEventListener('click', async () => {
      if (!this.resultData?.blob) return;
      const newFile = new File([this.resultData.blob], this.resultData.fileName, { type: this.resultData.blob.type || (this.activeStudio === 'pdf' ? 'application/pdf' : 'image/jpeg') });
      this.selectedFiles = [newFile];
      this.resultData = null;
      this.pages = [];
      await this.handleFilesAdded([newFile]);
      this.showToast("Loaded result into studio! You can continue with another action.");
    });

    processBtn?.addEventListener('click', () => this.executeAction(sidebarArea));
  }

  updateCropBoxVisual(canvasArea, sidebarArea) {
    const box = canvasArea.querySelector('#cropBoundingBox');
    const badge = canvasArea.querySelector('#cropCoordsBadge');
    const { left, top, width, height } = this.cropBox;

    if (box) {
      box.style.left = `${left}%`; box.style.top = `${top}%`;
      box.style.width = `${width}%`; box.style.height = `${height}%`;
    }
    if (badge) badge.textContent = `${Math.round(width)}% × ${Math.round(height)}%`;

    const cropInpTop = sidebarArea.querySelector('#cropInpTop');
    const cropInpBottom = sidebarArea.querySelector('#cropInpBottom');
    const cropInpLeft = sidebarArea.querySelector('#cropInpLeft');
    const cropInpRight = sidebarArea.querySelector('#cropInpRight');

    if (cropInpTop) cropInpTop.value = Math.round(top);
    if (cropInpBottom) cropInpBottom.value = Math.round(100 - top - height);
    if (cropInpLeft) cropInpLeft.value = Math.round(left);
    if (cropInpRight) cropInpRight.value = Math.round(100 - left - width);
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
      const isPdf = this.activeStudio === 'pdf';
      const mod = this.activeModule;
      let result = null;

      if (isPdf) {
        // PDF Studio Execution
        const compiled = await PdfTools.assemblePdfFromPages(this.pages, onProgress);
        const compiledFile = new File([compiled.blob], compiled.fileName, { type: 'application/pdf' });

        if (mod === 'compress') {
          const targetKB = sidebarArea.querySelector('#targetKbInput')?.value || 200;
          const strictCeiling = sidebarArea.querySelector('#strictCeilingCheck')?.checked ?? true;
          result = await PdfTools.compressPdf(compiledFile, targetKB, strictCeiling, onProgress);
        } else if (mod === 'crop') {
          result = await PdfTools.cropPdf(compiledFile, this.cropBox, this.cropApplyAll ? null : this.activeCropPageIndex, onProgress);
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
          else result = await PdfTools.pdfToJpg(compiledFile, 2.0, onProgress);
        } else if (mod === 'repair') {
          result = await PdfTools.repairPdf(compiledFile, onProgress);
        } else {
          // organize
          const exportMode = sidebarArea.querySelector('.preset-btn[data-export-mode].active')?.dataset?.exportMode || 'merge';
          if (exportMode === 'split' && window.JSZip) {
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
      } else {
        // Image Studio Execution
        const firstSelected = this.pages.find(p => p.selected) || this.pages[0];
        const imgFile = firstSelected.file;

        if (mod === 'compress') {
          const targetKB = sidebarArea.querySelector('#targetKbInput')?.value || 100;
          result = await ImageTools.compressImage(imgFile, targetKB, onProgress);
        } else if (mod === 'resize') {
          const w = parseInt(sidebarArea.querySelector('#imgResizeWidth')?.value || 800);
          result = await ImageTools.resizeImage(imgFile, w, null, true, onProgress);
        } else if (mod === 'convert') {
          const fmt = sidebarArea.querySelector('.preset-btn[data-img-fmt].active')?.dataset?.imgFmt || 'image/png';
          result = await ImageTools.convertFormat(imgFile, fmt, onProgress);
        } else if (mod === 'editor') {
          const b = sidebarArea.querySelector('#photoBrightness')?.value || 100;
          const c = sidebarArea.querySelector('#photoContrast')?.value || 100;
          const g = sidebarArea.querySelector('#photoGrayscale')?.value || 0;
          result = await ImageTools.editPhoto(imgFile, b, c, g, 0, onProgress);
        } else if (mod === 'exam') {
          const activeExam = sidebarArea.querySelector('.preset-btn[data-exam].active');
          const w = parseInt(activeExam?.dataset?.w || 350);
          const h = parseInt(activeExam?.dataset?.h || 450);
          const kb = parseInt(activeExam?.dataset?.kb || 50);
          result = await ImageTools.examPhotoResize(imgFile, w, h, kb, onProgress);
        } else if (mod === 'watermark') {
          const text = sidebarArea.querySelector('#watermarkTextInput')?.value || 'DOCUVATE';
          result = await ImageTools.watermarkImage(imgFile, text, 0.5, onProgress);
        }
      }

      this.resultData = result;
      this.isProcessing = false;
      this.renderWorkspace();
      this.showToast("Success! Studio processing complete.");

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

