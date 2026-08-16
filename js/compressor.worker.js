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
    self.postMessage({ type: "PROGRESS", message: "Analyzing document & attempting lossless vector stream optimization...", percent: 10 });
    
    // -----------------------------------------------------------------
    // STEP 1: Check if Lossless Vector PDF Flate Stream fits target
    // -----------------------------------------------------------------
    try {
      const vectorPdf = await PDFLib.PDFDocument.load(fileBuffer, { ignoreEncryption: true });
      vectorPdf.setTitle('');
      vectorPdf.setAuthor('');
      vectorPdf.setSubject('');
      vectorPdf.setKeywords([]);
      vectorPdf.setProducer('Docuvate High-Fidelity');
      vectorPdf.setCreator('Docuvate');

      const losslessBytes = await vectorPdf.save({ useObjectStreams: true, addDefaultPage: false });
      if (losslessBytes.byteLength <= targetBytes) {
        const finalSizeKB = (losslessBytes.byteLength / 1024).toFixed(1);
        const originalSizeKB = (originalBytes / 1024).toFixed(1);
        const reductionPercent = Math.max(0, Math.round(((originalBytes - losslessBytes.byteLength) / originalBytes) * 100));

        self.postMessage({ type: "PROGRESS", message: `Lossless Vector Complete! Output: ${finalSizeKB} KB (100% Vector Quality)`, percent: 100 });
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
      // Proceed to High-DPI Crisp Sizing
    }

    // -----------------------------------------------------------------
    // STEP 2: High-DPI Crisp Vector-to-Image Dynamic Budget Compression
    // -----------------------------------------------------------------
    self.postMessage({ type: "PROGRESS", message: "Calibrating High-DPI crisp page rendering...", percent: 20 });
    
    const pdf = await pdfjsLib.getDocument({ data: fileBuffer }).promise;
    const numPages = pdf.numPages;
    if (numPages === 0) throw new Error("The selected PDF document contains no pages.");

    // Reserve structural PDF overhead
    const pdfOverheadBytes = Math.round(2048 + (numPages * 512));
    let remainingBudget = Math.max(1024 * numPages, targetBytes - pdfOverheadBytes);

    const newPdf = await PDFLib.PDFDocument.create();

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const origViewport = page.getViewport({ scale: 1.0 });
      const pagesLeft = numPages - i + 1;
      const targetPageBudget = Math.floor(remainingBudget / pagesLeft);

      // High-DPI Scale selection: keep resolution high (1.5x - 2.2x) so text never blurs
      let renderScale = 2.0; // Crisp 150-200 DPI
      if (targetPageBudget < 18000) renderScale = 1.25;
      else if (targetPageBudget < 35000) renderScale = 1.5;
      else if (targetPageBudget < 70000) renderScale = 1.8;

      const viewport = page.getViewport({ scale: renderScale });
      const canvas = new OffscreenCanvas(Math.max(1, Math.round(viewport.width)), Math.max(1, Math.round(viewport.height)));
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Crucial: Fill pure opaque white background to eliminate dark fringes/fuzziness
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({ canvasContext: ctx, viewport }).promise;

      // Binary search for highest quality within page budget
      let lowQ = 0.10, highQ = 0.95;
      let bestBlob = null;
      let bestBlobSize = 0;

      for (let pass = 0; pass < 6; pass++) {
        const q = (lowQ + highQ) / 2;
        const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: q });
        if (!blob) break;

        if (blob.size <= targetPageBudget) {
          if (blob.size > bestBlobSize) {
            bestBlobSize = blob.size;
            bestBlob = blob;
          }
          if (blob.size >= targetPageBudget * 0.94) break;
          lowQ = q;
        } else {
          highQ = q;
        }
      }

      // If budget is extremely strict, scale canvas cleanly with high-bicubic smoothing
      if (!bestBlob || bestBlobSize > targetPageBudget) {
        const testBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.20 });
        if (testBlob && testBlob.size > targetPageBudget) {
          const downRatio = Math.max(0.35, Math.sqrt(targetPageBudget / testBlob.size) * 0.95);
          const miniCanvas = new OffscreenCanvas(Math.max(1, Math.round(canvas.width * downRatio)), Math.max(1, Math.round(canvas.height * downRatio)));
          const miniCtx = miniCanvas.getContext('2d');
          miniCtx.imageSmoothingEnabled = true;
          miniCtx.imageSmoothingQuality = 'high';
          miniCtx.fillStyle = '#ffffff';
          miniCtx.fillRect(0, 0, miniCanvas.width, miniCanvas.height);
          miniCtx.drawImage(canvas, 0, 0, miniCanvas.width, miniCanvas.height);
          bestBlob = await miniCanvas.convertToBlob({ type: 'image/jpeg', quality: 0.70 });
        } else {
          bestBlob = testBlob;
        }
      }

      if (!bestBlob) {
        bestBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.15 });
      }

      // Deduct used bytes from remaining budget for next pages
      remainingBudget -= bestBlob.size;

      const imgBuffer = await bestBlob.arrayBuffer();
      const image = await newPdf.embedJpg(imgBuffer);
      const newPage = newPdf.addPage([origViewport.width, origViewport.height]);
      newPage.drawImage(image, { x: 0, y: 0, width: origViewport.width, height: origViewport.height });

      const pct = Math.round(20 + ((i / numPages) * 75));
      self.postMessage({ 
        type: "PROGRESS", 
        message: `High-DPI optimized page ${i} of ${numPages} (${Math.round(bestBlob.size / 1024)} KB)...`, 
        percent: pct 
      });
    }

    self.postMessage({ type: "PROGRESS", message: "Finalizing and saving optimized PDF...", percent: 96 });
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
