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
  const targetBytes = Math.max(5 * 1024, Math.round(Number(targetKB) * 1024));
  const targetSizeKB = Number(targetKB);
  
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
      vectorPdf.setProducer('Docuvate');
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
          targetKB: targetSizeKB,
          numPages: vectorPdf.getPageCount(),
          reductionPercent: reductionPercent
        }, [losslessBytes.buffer]);
        return;
      }
    } catch (eVector) {
      // Proceed to High-DPI Crisp Sizing
    }

    // -----------------------------------------------------------------
    // STEP 2: Multi-Pass PDF -> Image -> Strict Budget -> PDF Pipeline
    // -----------------------------------------------------------------
    self.postMessage({ type: "PROGRESS", message: "Calibrating High-DPI crisp page rendering...", percent: 20 });
    
    const pdf = await pdfjsLib.getDocument({ data: fileBuffer }).promise;
    const numPages = pdf.numPages;
    if (numPages === 0) throw new Error("The selected PDF document contains no pages.");

    async function buildPdfWithBudget(availableBytes) {
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
        const canvas = new OffscreenCanvas(Math.max(1, Math.round(viewport.width)), Math.max(1, Math.round(viewport.height)));
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
          const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: q });
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
          const testBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.15 });
          if (testBlob && testBlob.size > pageBudget) {
            const downRatio = Math.max(0.3, Math.sqrt(pageBudget / testBlob.size) * 0.92);
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

        if (!bestBlob) bestBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.10 });

        remaining -= bestBlob.size;
        const imgBuffer = await bestBlob.arrayBuffer();
        const image = await doc.embedJpg(imgBuffer);
        const newPage = doc.addPage([origViewport.width, origViewport.height]);
        newPage.drawImage(image, { x: 0, y: 0, width: origViewport.width, height: origViewport.height });
      }

      return await doc.save({ useObjectStreams: true });
    }

    let pdfBytes = await buildPdfWithBudget(targetBytes);
    let currentSizeKB = Math.round(pdfBytes.byteLength / 1024);

    // -----------------------------------------------------------------
    // STEP 3: Pre-Output Validation & Automatic Re-Processing Loop
    // -----------------------------------------------------------------
    let reprocessPass = 0;
    while (currentSizeKB > targetSizeKB && reprocessPass < 5) {
      reprocessPass++;
      const correctionRatio = Math.min(0.92, (targetSizeKB / currentSizeKB) * 0.94);
      self.postMessage({ 
        type: "PROGRESS", 
        message: `Validation: ${currentSizeKB} KB > ${targetSizeKB} KB. Re-processing pass ${reprocessPass}...`, 
        percent: Math.min(98, 86 + (reprocessPass * 3)) 
      });
      pdfBytes = await buildPdfWithBudget(pdfBytes.byteLength * correctionRatio);
      currentSizeKB = Math.round(pdfBytes.byteLength / 1024);
    }

    if (currentSizeKB > targetSizeKB) {
      pdfBytes = await buildPdfWithBudget(pdfBytes.byteLength * 0.88);
      currentSizeKB = Math.round(pdfBytes.byteLength / 1024);
    }

    const finalSizeKB = (pdfBytes.byteLength / 1024).toFixed(1);
    const originalSizeKB = (originalBytes / 1024).toFixed(1);
    const reductionPercent = Math.max(0, Math.round(((originalBytes - pdfBytes.byteLength) / originalBytes) * 100));

    self.postMessage({ 
      type: "PROGRESS", 
      message: `Validated & Complete! Final Size: ${finalSizeKB} KB (Target: ${targetKB} KB)`, 
      percent: 100 
    });

    self.postMessage({ 
      type: "COMPLETE", 
      buffer: pdfBytes,
      finalSizeKB: Number(finalSizeKB),
      originalSizeKB: Number(originalSizeKB),
      targetKB: targetSizeKB,
      numPages: numPages,
      reductionPercent: reductionPercent
    }, [pdfBytes.buffer]);

  } catch (error) {
    self.postMessage({ type: "ERROR", error: error.message || "Failed to process PDF compression." });
  }
};
