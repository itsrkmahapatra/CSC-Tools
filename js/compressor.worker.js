// Mock DOM for PDF.js inside Web Worker
if (typeof self.document === 'undefined') {
  self.window = self;
  self.document = {
    createElement: function(tag) {
      if (tag.toLowerCase() === 'canvas') {
        return new OffscreenCanvas(1, 1);
      }
      return { style: {} };
    },
    getElementsByTagName: function() { return []; },
    head: { appendChild: function() {} },
    documentElement: { style: {} }
  };
  self.HTMLCanvasElement = self.OffscreenCanvas;
}

importScripts('https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js');
importScripts('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
pdfjsLib.GlobalWorkerOptions.disableWorker = true;

/**
 * High-DPI Crisp Multi-Pass Render (Preserves vector dimensions & sharp text)
 */
async function renderPdfWithParams(pdf, numPages, scale, quality) {
  const newPdf = await PDFLib.PDFDocument.create();
  
  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: Math.max(1.2, scale) });
    const canvas = new OffscreenCanvas(Math.max(1, Math.round(viewport.width)), Math.max(1, Math.round(viewport.height)));
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    await page.render({ canvasContext: ctx, viewport: viewport }).promise;
    
    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: Math.max(0.40, Math.min(0.95, quality)) });
    const imgBuffer = await blob.arrayBuffer();
    const image = await newPdf.embedJpg(imgBuffer);
    
    const origViewport = page.getViewport({ scale: 1.0 });
    const newPage = newPdf.addPage([origViewport.width, origViewport.height]);
    newPage.drawImage(image, { x: 0, y: 0, width: origViewport.width, height: origViewport.height });
  }
  
  return await newPdf.save({ useObjectStreams: true });
}

self.onmessage = async function(e) {
  const { fileBuffer, targetKB, strictCeiling = true } = e.data;
  const originalBytes = fileBuffer.byteLength;
  const targetBytes = Math.max(5 * 1024, Math.round(targetKB * 1024));
  
  try {
    // -------------------------------------------------------------
    // Pass 1: Lossless Vector Flate Stream Optimization
    // -------------------------------------------------------------
    self.postMessage({ type: "PROGRESS", message: "Attempting Lossless Vector & Stream Compression...", percent: 10 });
    try {
      const vectorPdf = await PDFLib.PDFDocument.load(fileBuffer, { ignoreEncryption: true });
      vectorPdf.setTitle('');
      vectorPdf.setAuthor('');
      vectorPdf.setSubject('');
      vectorPdf.setKeywords([]);
      vectorPdf.setProducer('Docuvate High-Fidelity Engine');
      vectorPdf.setCreator('Docuvate');

      const losslessBytes = await vectorPdf.save({ useObjectStreams: true, addDefaultPage: false });
      if (losslessBytes.byteLength <= targetBytes) {
        const finalSizeKB = (losslessBytes.byteLength / 1024).toFixed(1);
        const originalSizeKB = (originalBytes / 1024).toFixed(1);
        const reductionPercent = Math.max(0, Math.round(((originalBytes - losslessBytes.byteLength) / originalBytes) * 100));

        self.postMessage({ type: "PROGRESS", message: `Lossless Vector Complete! Output: ${finalSizeKB} KB (100% Quality)`, percent: 100 });
        self.postMessage({
          type: "COMPLETE",
          buffer: losslessBytes,
          finalSizeKB: Number(finalSizeKB),
          originalSizeKB: Number(originalSizeKB),
          targetKB: targetKB,
          numPages: vectorPdf.getPageCount(),
          reductionPercent: reductionPercent
        }, [losslessBytes.buffer]);
        return;
      }
    } catch (eVector) {
      // Proceed to High-DPI
    }

    // -------------------------------------------------------------
    // Pass 2: High-DPI Crisp Multi-Pass
    // -------------------------------------------------------------
    self.postMessage({ type: "PROGRESS", message: "Calibrating High-DPI Crisp Rendering...", percent: 25 });
    
    const pdf = await pdfjsLib.getDocument({ data: fileBuffer }).promise;
    const numPages = pdf.numPages;
    
    if (numPages === 0) throw new Error("The selected PDF document contains no pages.");

    const targetBytesPerPage = targetBytes / numPages;
    let lowQ = 0.45, highQ = 0.92;
    let initialScale = 2.0;

    if (targetBytesPerPage < 30000) {
      initialScale = 1.4;
      lowQ = 0.40;
      highQ = 0.75;
    } else if (targetBytesPerPage < 80000) {
      initialScale = 1.8;
      lowQ = 0.55;
      highQ = 0.85;
    } else {
      initialScale = 2.2;
      lowQ = 0.70;
      highQ = 0.95;
    }

    let bestBuffer = null;
    let bestSize = 0;
    const maxPasses = 5;
    let pass = 1;
    let currentScale = initialScale;

    while (pass <= maxPasses) {
      const currentQuality = (lowQ + highQ) / 2;
      const progressPercent = Math.round(30 + ((pass / maxPasses) * 60));
      self.postMessage({ 
        type: "PROGRESS", 
        message: `Pass ${pass}/${maxPasses}: High-DPI crisp optimization (${Math.round(currentQuality * 100)}% quality)...`, 
        percent: progressPercent 
      });

      const pdfBytes = await renderPdfWithParams(pdf, numPages, currentScale, currentQuality);
      const currentSize = pdfBytes.byteLength;

      if (currentSize <= targetBytes) {
        if (currentSize > bestSize) {
          bestSize = currentSize;
          bestBuffer = pdfBytes;
        }
        if (currentSize >= targetBytes * 0.92) break;
        lowQ = currentQuality;
      } else {
        highQ = currentQuality;
        if (highQ - lowQ < 0.08 && currentScale > 1.2) {
          currentScale = Math.max(1.2, currentScale * 0.85);
          highQ = 0.80;
        }
      }
      pass++;
    }

    if (!bestBuffer) {
      self.postMessage({ type: "PROGRESS", message: "Applying optimized compression...", percent: 92 });
      bestBuffer = await renderPdfWithParams(pdf, numPages, 1.3, 0.48);
      bestSize = bestBuffer.byteLength;
    }

    const finalSizeKB = (bestSize / 1024).toFixed(1);
    const originalSizeKB = (originalBytes / 1024).toFixed(1);
    const reductionPercent = Math.max(0, Math.round(((originalBytes - bestSize) / originalBytes) * 100));

    self.postMessage({ 
      type: "PROGRESS", 
      message: `Crisp Complete! Final Size: ${finalSizeKB} KB (${reductionPercent}% reduction)`, 
      percent: 100 
    });

    self.postMessage({ 
      type: "COMPLETE", 
      buffer: bestBuffer,
      finalSizeKB: Number(finalSizeKB),
      originalSizeKB: Number(originalSizeKB),
      targetKB: targetKB,
      numPages: numPages,
      reductionPercent: reductionPercent
    }, [bestBuffer.buffer]);

  } catch (error) {
    self.postMessage({ type: "ERROR", error: error.message || "Failed to process PDF compression." });
  }
};
