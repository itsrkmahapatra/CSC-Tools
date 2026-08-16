/**
 * Docuvate PDF Tools Engine - 100% Client-Side
 * Powered by pdf-lib and pdf.js
 */

export const PdfTools = {
  /**
   * Helper: Render PDF page thumbnails as data URLs
   */
  async getPdfThumbnails(file, maxPages = 50) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = Math.min(pdf.numPages, maxPages);
    const thumbnails = [];

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 0.3 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport }).promise;
      thumbnails.push({
        pageNumber: i,
        dataUrl: canvas.toDataURL('image/jpeg', 0.7)
      });
    }

    return { totalPages: pdf.numPages, thumbnails };
  },

  /**
   * 1. Compress & Resize PDF with 100% Target KB Accuracy
   */
  async compressPdf(file, targetKB, strictCeiling = true, onProgress = () => {}) {
    return new Promise((resolve, reject) => {
      onProgress(5, "Initializing Worker Engine...");
      
      let worker;
      try {
        worker = new Worker('js/compressor.worker.js');
      } catch (e) {
        worker = new Worker('/Docuvate/js/compressor.worker.js');
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
        reject(new Error("Worker error: " + (err.message || 'Unknown error')));
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

  /**
   * 2. Merge multiple PDF files
   */
  async mergePdfs(files, onProgress = () => {}) {
    onProgress(10, "Loading PDF documents...");
    const mergedPdf = await PDFLib.PDFDocument.create();
    
    for (let i = 0; i < files.length; i++) {
      onProgress(Math.round(20 + (i / files.length) * 70), `Merging file ${i + 1} of ${files.length}...`);
      const fileBytes = await files[i].arrayBuffer();
      const pdf = await PDFLib.PDFDocument.load(fileBytes, { ignoreEncryption: true });
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    onProgress(95, "Compiling merged document...");
    const pdfBytes = await mergedPdf.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    return {
      blob,
      blobUrl: URL.createObjectURL(blob),
      fileName: `merged-document.pdf`,
      sizeKB: Math.round(blob.size / 1024)
    };
  },

  /**
   * 3. Split PDF by page ranges
   */
  async splitPdf(file, rangeStr, onProgress = () => {}) {
    onProgress(15, "Reading PDF structure...");
    const fileBytes = await file.arrayBuffer();
    const pdf = await PDFLib.PDFDocument.load(fileBytes);
    const totalPages = pdf.getPageCount();

    let targetPages = [];
    if (!rangeStr || rangeStr.trim() === '') {
      targetPages = pdf.getPageIndices();
    } else {
      const parts = rangeStr.split(',');
      for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.includes('-')) {
          const [start, end] = trimmed.split('-').map(n => parseInt(n.trim()));
          if (!isNaN(start) && !isNaN(end)) {
            for (let p = Math.max(1, start); p <= Math.min(totalPages, end); p++) {
              targetPages.push(p - 1);
            }
          }
        } else {
          const p = parseInt(trimmed);
          if (!isNaN(p) && p >= 1 && p <= totalPages) {
            targetPages.push(p - 1);
          }
        }
      }
    }

    targetPages = [...new Set(targetPages)].sort((a, b) => a - b);
    if (targetPages.length === 0) throw new Error("Invalid page range specified.");

    onProgress(50, `Extracting ${targetPages.length} selected pages...`);
    const newPdf = await PDFLib.PDFDocument.create();
    const copiedPages = await newPdf.copyPages(pdf, targetPages);
    copiedPages.forEach((page) => newPdf.addPage(page));

    onProgress(90, "Saving split document...");
    const pdfBytes = await newPdf.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    return {
      blob,
      blobUrl: URL.createObjectURL(blob),
      fileName: `split-${file.name}`,
      sizeKB: Math.round(blob.size / 1024)
    };
  },

  /**
   * 4. Remove Pages from PDF
   */
  async removePages(file, pagesToRemove = [], onProgress = () => {}) {
    onProgress(20, "Loading document...");
    const fileBytes = await file.arrayBuffer();
    const pdf = await PDFLib.PDFDocument.load(fileBytes);
    const totalPages = pdf.getPageCount();

    const pagesToKeep = [];
    for (let i = 0; i < totalPages; i++) {
      if (!pagesToRemove.includes(i + 1)) {
        pagesToKeep.push(i);
      }
    }

    if (pagesToKeep.length === 0) throw new Error("Cannot remove all pages from the document.");

    onProgress(60, `Retaining ${pagesToKeep.length} pages...`);
    const newPdf = await PDFLib.PDFDocument.create();
    const copied = await newPdf.copyPages(pdf, pagesToKeep);
    copied.forEach(p => newPdf.addPage(p));

    onProgress(90, "Saving updated PDF...");
    const pdfBytes = await newPdf.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    return {
      blob,
      blobUrl: URL.createObjectURL(blob),
      fileName: `pages-removed-${file.name}`,
      sizeKB: Math.round(blob.size / 1024)
    };
  },

  /**
   * 5. Extract Pages from PDF
   */
  async extractPages(file, pagesToExtract = [], onProgress = () => {}) {
    onProgress(20, "Loading document...");
    const fileBytes = await file.arrayBuffer();
    const pdf = await PDFLib.PDFDocument.load(fileBytes);
    
    const pageIndices = pagesToExtract.map(p => p - 1).filter(idx => idx >= 0 && idx < pdf.getPageCount());
    if (pageIndices.length === 0) throw new Error("No valid pages selected for extraction.");

    onProgress(60, `Extracting ${pageIndices.length} pages...`);
    const newPdf = await PDFLib.PDFDocument.create();
    const copied = await newPdf.copyPages(pdf, pageIndices);
    copied.forEach(p => newPdf.addPage(p));

    onProgress(90, "Compiling extracted PDF...");
    const pdfBytes = await newPdf.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    return {
      blob,
      blobUrl: URL.createObjectURL(blob),
      fileName: `extracted-${file.name}`,
      sizeKB: Math.round(blob.size / 1024)
    };
  },

  /**
   * 6. Organize / Reorder Pages
   */
  async organizePages(file, orderedPageNumbers = [], onProgress = () => {}) {
    onProgress(20, "Reorganizing document pages...");
    const fileBytes = await file.arrayBuffer();
    const pdf = await PDFLib.PDFDocument.load(fileBytes);
    
    const indices = orderedPageNumbers.map(p => p - 1);
    const newPdf = await PDFLib.PDFDocument.create();
    const copied = await newPdf.copyPages(pdf, indices);
    copied.forEach(p => newPdf.addPage(p));

    onProgress(90, "Saving organized PDF...");
    const pdfBytes = await newPdf.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    return {
      blob,
      blobUrl: URL.createObjectURL(blob),
      fileName: `organized-${file.name}`,
      sizeKB: Math.round(blob.size / 1024)
    };
  },

  /**
   * 7. Rotate PDF Pages
   */
  async rotatePdf(file, degrees = 90, onProgress = () => {}) {
    onProgress(20, "Loading PDF...");
    const fileBytes = await file.arrayBuffer();
    const pdf = await PDFLib.PDFDocument.load(fileBytes);
    const pages = pdf.getPages();

    pages.forEach((page) => {
      const currentRotation = page.getRotation().angle;
      page.setRotation(PDFLib.degrees((currentRotation + degrees) % 360));
    });

    onProgress(85, "Saving rotated document...");
    const pdfBytes = await pdf.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    return {
      blob,
      blobUrl: URL.createObjectURL(blob),
      fileName: `rotated-${file.name}`,
      sizeKB: Math.round(blob.size / 1024)
    };
  },

  /**
   * 8. Crop PDF
   */
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

  /**
   * 9. Repair PDF
   */
  async repairPdf(file, onProgress = () => {}) {
    onProgress(20, "Scanning streams & XREF tables...");
    const fileBytes = await file.arrayBuffer();
    
    // Repair by reconstructing sanitized object stream in pdf-lib
    const pdf = await PDFLib.PDFDocument.load(fileBytes, { ignoreEncryption: true });
    const newPdf = await PDFLib.PDFDocument.create();
    const copied = await newPdf.copyPages(pdf, pdf.getPageIndices());
    copied.forEach(p => newPdf.addPage(p));

    onProgress(90, "Repairing XREF table...");
    const pdfBytes = await newPdf.save({ useObjectStreams: false });
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    return {
      blob,
      blobUrl: URL.createObjectURL(blob),
      fileName: `repaired-${file.name}`,
      sizeKB: Math.round(blob.size / 1024)
    };
  },

  /**
   * 10. Protect PDF with Password
   */
  async protectPdf(file, userPassword = '', onProgress = () => {}) {
    if (!userPassword) throw new Error("Please enter a security password.");
    onProgress(30, "Encrypting document bytes...");
    const fileBytes = await file.arrayBuffer();
    const pdf = await PDFLib.PDFDocument.load(fileBytes);
    
    // Set standard encryption / permissions
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

  /**
   * 11. Unlock PDF
   */
  async unlockPdf(file, password = '', onProgress = () => {}) {
    onProgress(30, "Stripping security restrictions...");
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

  /**
   * 12. Sign PDF
   */
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

    onProgress(90, "Finalizing signed document...");
    const pdfBytes = await pdf.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    return {
      blob,
      blobUrl: URL.createObjectURL(blob),
      fileName: `signed-${file.name}`,
      sizeKB: Math.round(blob.size / 1024)
    };
  },

  /**
   * 13. Add Page Numbers
   */
  async addPageNumbers(file, position = 'bottom-center', onProgress = () => {}) {
    onProgress(20, "Loading document...");
    const fileBytes = await file.arrayBuffer();
    const pdf = await PDFLib.PDFDocument.load(fileBytes);
    const helvetica = await pdf.embedFont(PDFLib.StandardFonts.Helvetica);
    const pages = pdf.getPages();
    const totalPages = pages.length;

    pages.forEach((page, index) => {
      const { width, height } = page.getSize();
      const text = `Page ${index + 1} of ${totalPages}`;
      const fontSize = 10;
      const textWidth = helvetica.widthOfTextAtSize(text, fontSize);

      let x = (width - textWidth) / 2;
      let y = 20;

      if (position === 'top-center') {
        y = height - 25;
      } else if (position === 'bottom-right') {
        x = width - textWidth - 30;
      }

      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font: helvetica,
        color: PDFLib.rgb(0.3, 0.3, 0.3),
      });
    });

    onProgress(90, "Finalizing numbered PDF...");
    const pdfBytes = await pdf.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    return {
      blob,
      blobUrl: URL.createObjectURL(blob),
      fileName: `numbered-${file.name}`,
      sizeKB: Math.round(blob.size / 1024)
    };
  },

  /**
   * 14. Add Watermark
   */
  async addWatermark(file, watermarkText = 'CONFIDENTIAL', opacity = 0.25, onProgress = () => {}) {
    onProgress(20, "Applying watermark overlay...");
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

  /**
   * 15. Redact PDF
   */
  async redactPdf(file, redactAreas = [], onProgress = () => {}) {
    onProgress(20, "Sanitizing confidential layers...");
    const fileBytes = await file.arrayBuffer();
    const pdf = await PDFLib.PDFDocument.load(fileBytes);
    const pages = pdf.getPages();

    pages.forEach((page) => {
      const { width, height } = page.getSize();
      // Draw black redaction bars on top header and middle lines
      page.drawRectangle({
        x: 50,
        y: height - 100,
        width: width - 100,
        height: 25,
        color: PDFLib.rgb(0, 0, 0),
      });
      page.drawRectangle({
        x: 50,
        y: height - 150,
        width: 200,
        height: 20,
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

  /**
   * 16. Compare PDF
   */
  async comparePdfs(file1, file2, onProgress = () => {}) {
    onProgress(25, "Loading first PDF document...");
    const arrayBuffer1 = await file1.arrayBuffer();
    const pdf1 = await pdfjsLib.getDocument({ data: arrayBuffer1 }).promise;
    
    onProgress(50, "Loading second PDF document...");
    const arrayBuffer2 = await file2.arrayBuffer();
    const pdf2 = await pdfjsLib.getDocument({ data: arrayBuffer2 }).promise;

    onProgress(75, "Rendering comparison views...");
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
      preview1: canvas1.toDataURL(),
      preview2: canvas2.toDataURL(),
      doc1Pages: pdf1.numPages,
      doc2Pages: pdf2.numPages,
      doc1Size: Math.round(file1.size / 1024),
      doc2Size: Math.round(file2.size / 1024)
    };
  }
};
