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

self.onmessage = async function(e) {
  const { fileBuffer, targetKB, strictCeiling = true } = e.data;
  const originalBytes = fileBuffer.byteLength;
  const targetBytes = Math.max(5 * 1024, Math.round(targetKB * 1024));
  
  try {
    self.postMessage({ type: "PROGRESS", message: "Analyzing PDF page structures...", percent: 5 });
    
    const pdf = await pdfjsLib.getDocument({ data: fileBuffer }).promise;
    const numPages = pdf.numPages;
    
    if (numPages === 0) throw new Error("The selected PDF document contains no pages.");

    // Reserve budget for PDF structures (XREF table, page catalog, trailer)
    const pdfOverheadBytes = Math.round(2048 + (numPages * 512));
    const availableImageBytes = Math.max(1024 * numPages, targetBytes - pdfOverheadBytes);
    const targetBytesPerPage = Math.floor(availableImageBytes / numPages);

    self.postMessage({ 
      type: "PROGRESS", 
      message: `Allocated ~${Math.round(targetBytesPerPage / 1024)} KB budget per page across ${numPages} page(s)...`, 
      percent: 10 
    });

    const newPdf = await PDFLib.PDFDocument.create();

    // -------------------------------------------------------------
    // PDF -> Page Image -> Per-Page Target KB Compression -> PDF
    // -------------------------------------------------------------
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const origViewport = page.getViewport({ scale: 1.0 });

      let renderScale = 1.8;
      if (targetBytesPerPage < 15000) renderScale = 1.0;
      else if (targetBytesPerPage < 35000) renderScale = 1.3;
      else if (targetBytesPerPage < 75000) renderScale = 1.5;

      const viewport = page.getViewport({ scale: renderScale });
      const canvas = new OffscreenCanvas(Math.max(1, Math.round(viewport.width)), Math.max(1, Math.round(viewport.height)));
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      await page.render({ canvasContext: ctx, viewport }).promise;

      let lowQ = 0.05, highQ = 0.95;
      let bestBlob = null;
      let bestBlobSize = 0;

      for (let pass = 0; pass < 6; pass++) {
        const q = (lowQ + highQ) / 2;
        const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: q });
        if (!blob) break;

        if (blob.size <= targetBytesPerPage) {
          if (blob.size > bestBlobSize) {
            bestBlobSize = blob.size;
            bestBlob = blob;
          }
          if (blob.size >= targetBytesPerPage * 0.94) break;
          lowQ = q;
        } else {
          highQ = q;
        }
      }

      if (!bestBlob || bestBlobSize > targetBytesPerPage) {
        const testBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.15 });
        if (testBlob && testBlob.size > targetBytesPerPage) {
          const downRatio = Math.max(0.25, Math.sqrt(targetBytesPerPage / testBlob.size) * 0.94);
          const miniCanvas = new OffscreenCanvas(Math.max(1, Math.round(canvas.width * downRatio)), Math.max(1, Math.round(canvas.height * downRatio)));
          const miniCtx = miniCanvas.getContext('2d');
          miniCtx.imageSmoothingEnabled = true;
          miniCtx.imageSmoothingQuality = 'high';
          miniCtx.drawImage(canvas, 0, 0, miniCanvas.width, miniCanvas.height);
          bestBlob = await miniCanvas.convertToBlob({ type: 'image/jpeg', quality: 0.70 });
        } else {
          bestBlob = testBlob;
        }
      }

      if (!bestBlob) {
        bestBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.1 });
      }

      const imgBuffer = await bestBlob.arrayBuffer();
      const image = await newPdf.embedJpg(imgBuffer);
      const newPage = newPdf.addPage([origViewport.width, origViewport.height]);
      newPage.drawImage(image, { x: 0, y: 0, width: origViewport.width, height: origViewport.height });

      const pct = Math.round(15 + ((i / numPages) * 75));
      self.postMessage({ 
        type: "PROGRESS", 
        message: `Compressed page ${i} of ${numPages} (${Math.round(bestBlob.size / 1024)} KB)...`, 
        percent: pct 
      });
    }

    self.postMessage({ type: "PROGRESS", message: "Compiling final PDF document...", percent: 95 });
    const pdfBytes = await newPdf.save({ useObjectStreams: true });
    
    const finalSizeKB = (pdfBytes.byteLength / 1024).toFixed(1);
    const originalSizeKB = (originalBytes / 1024).toFixed(1);
    const reductionPercent = Math.max(0, Math.round(((originalBytes - pdfBytes.byteLength) / originalBytes) * 100));

    self.postMessage({ 
      type: "PROGRESS", 
      message: `Complete! Final Size: ${finalSizeKB} KB (Target: ${targetKB} KB)`, 
      percent: 100 
    });

    self.postMessage({ 
      type: "COMPLETE", 
      buffer: pdfBytes,
      finalSizeKB: Number(finalSizeKB),
      originalSizeKB: Number(originalSizeKB),
      targetKB: targetKB,
      numPages: numPages,
      reductionPercent: reductionPercent
    }, [pdfBytes.buffer]);

  } catch (error) {
    self.postMessage({ type: "ERROR", error: error.message || "Failed to process PDF compression." });
  }
};
