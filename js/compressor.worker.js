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
 * Renders all pages of a PDF into a new compressed PDF with given Scale and Quality.
 */
async function renderPdfWithParams(pdf, numPages, scale, quality) {
  const newPdf = await PDFLib.PDFDocument.create();
  
  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: scale });
    const canvas = new OffscreenCanvas(Math.max(1, Math.round(viewport.width)), Math.max(1, Math.round(viewport.height)));
    const ctx = canvas.getContext('2d');
    
    await page.render({ canvasContext: ctx, viewport: viewport }).promise;
    
    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: Math.max(0.05, Math.min(0.98, quality)) });
    const imgBuffer = await blob.arrayBuffer();
    const image = await newPdf.embedJpg(imgBuffer);
    const newPage = newPdf.addPage([image.width, image.height]);
    newPage.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  }
  
  return await newPdf.save();
}

self.onmessage = async function(e) {
  const { fileBuffer, targetKB, strictCeiling = true } = e.data;
  const originalBytes = fileBuffer.byteLength;
  const targetBytes = Math.max(5 * 1024, Math.round(targetKB * 1024));
  
  try {
    self.postMessage({ type: "PROGRESS", message: "Analyzing document structure and pages...", percent: 5 });
    
    const pdf = await pdfjsLib.getDocument({ data: fileBuffer }).promise;
    const numPages = pdf.numPages;
    
    if (numPages === 0) {
      throw new Error("The selected PDF document contains no pages.");
    }

    self.postMessage({ 
      type: "PROGRESS", 
      message: `Document loaded (${numPages} page${numPages > 1 ? 's' : ''}). Calibrating target size...`, 
      percent: 10 
    });

    let lowS = 0.15, highS = 1.6;
    let lowQ = 0.08, highQ = 0.95;
    
    let bestBuffer = null;
    let bestSize = 0;
    const maxPasses = 7;
    let pass = 1;

    const targetBytesPerPage = targetBytes / numPages;
    if (targetBytesPerPage < 15000) {
      highS = 0.7;
      highQ = 0.65;
    } else if (targetBytesPerPage < 40000) {
      highS = 1.0;
      highQ = 0.80;
    }

    while (pass <= maxPasses) {
      const currentScale = (lowS + highS) / 2;
      const currentQuality = (lowQ + highQ) / 2;

      const progressPercent = Math.round(15 + ((pass / maxPasses) * 75));
      self.postMessage({ 
        type: "PROGRESS", 
        message: `Pass ${pass}/${maxPasses}: Optimizing resolution (${Math.round(currentScale * 100)}%) & quality (${Math.round(currentQuality * 100)}%)...`, 
        percent: progressPercent 
      });

      const pdfBytes = await renderPdfWithParams(pdf, numPages, currentScale, currentQuality);
      const currentSize = pdfBytes.byteLength;

      if (currentSize <= targetBytes) {
        if (currentSize > bestSize) {
          bestSize = currentSize;
          bestBuffer = pdfBytes;
        }

        if (currentSize >= targetBytes * 0.95) {
          break;
        }

        lowS = currentScale;
        lowQ = Math.min(0.95, currentQuality + 0.05);
      } else {
        highS = currentScale;
        highQ = Math.max(0.08, currentQuality - 0.08);
      }

      pass++;
    }

    if (strictCeiling && bestBuffer && bestSize > targetBytes) {
      self.postMessage({ type: "PROGRESS", message: "Applying fine-tune adjustment for 100% accuracy...", percent: 93 });
      const reductionFactor = Math.max(0.65, Math.sqrt(targetBytes / bestSize) * 0.96);
      const correctiveScale = Math.max(0.15, ((lowS + highS) / 2) * reductionFactor);
      const correctiveQuality = Math.max(0.08, ((lowQ + highQ) / 2) * reductionFactor);
      
      const correctedBytes = await renderPdfWithParams(pdf, numPages, correctiveScale, correctiveQuality);
      if (correctedBytes.byteLength <= targetBytes) {
        bestBuffer = correctedBytes;
        bestSize = correctedBytes.byteLength;
      }
    }

    if (!bestBuffer) {
      self.postMessage({ type: "PROGRESS", message: "Applying extreme compression for minimum possible size...", percent: 95 });
      bestBuffer = await renderPdfWithParams(pdf, numPages, 0.18, 0.10);
      bestSize = bestBuffer.byteLength;
    }

    const finalSizeKB = (bestSize / 1024).toFixed(1);
    const originalSizeKB = (originalBytes / 1024).toFixed(1);
    const reductionPercent = Math.max(0, Math.round(((originalBytes - bestSize) / originalBytes) * 100));

    self.postMessage({ 
      type: "PROGRESS", 
      message: `Complete! Final Size: ${finalSizeKB} KB (${reductionPercent}% reduction)`, 
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
