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
  const { fileBuffer, targetKB } = e.data;
  const targetBytes = targetKB * 1024;
  const toleranceLower = targetBytes * 0.98; // Aim for 98-100% of target
  
  try {
    self.postMessage({ type: "PROGRESS", message: "Analyzing document structure...", percent: 5 });
    
    const pdf = await pdfjsLib.getDocument({ data: fileBuffer }).promise;
    const numPages = pdf.numPages;
    
    let lowS = 0.1, highS = 1.0;
    let lowQ = 0.1, highQ = 0.95;
    
    let bestBuffer = null;
    let bestSize = 0;
    let iteration = 1;
    const maxIterations = 8; // Limit attempts to prevent infinite loops

    // Binary search on Scale primarily, keeping Quality high if possible
    while (iteration <= maxIterations) {
      let S = (lowS + highS) / 2;
      let Q = (lowQ + highQ) / 2;

      self.postMessage({ 
        type: "PROGRESS", 
        message: `Optimization Pass ${iteration}/${maxIterations}: Testing Scale ${(S*100).toFixed(0)}%`, 
        percent: Math.min(95, 10 + (iteration * 10)) 
      });
      
      const newPdf = await PDFLib.PDFDocument.create();
      
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: S });
        const canvas = new OffscreenCanvas(viewport.width, viewport.height);
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport: viewport }).promise;
        
        const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: Q });
        const imgBuffer = await blob.arrayBuffer();
        const image = await newPdf.embedJpg(imgBuffer);
        const newPage = newPdf.addPage([image.width, image.height]);
        newPage.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
      }
      
      const pdfBytes = await newPdf.save();
      const currentSize = pdfBytes.byteLength;

      if (currentSize <= targetBytes && currentSize >= toleranceLower) {
        // Perfect hit
        bestBuffer = pdfBytes;
        bestSize = currentSize;
        break;
      }

      if (currentSize > targetBytes) {
        // Too big, decrease scale
        highS = S;
        highQ = Math.max(0.3, Q - 0.05);
      } else {
        // Too small, increase scale
        lowS = S;
        lowQ = Math.min(0.95, Q + 0.05);
        // Keep this as fallback best
        if (currentSize > bestSize) {
          bestSize = currentSize;
          bestBuffer = pdfBytes;
        }
      }
      iteration++;
    }

    if (!bestBuffer) throw new Error("Could not find suitable compression parameters.");
    
    self.postMessage({ type: "PROGRESS", message: `Final Optimization Complete. Size: ${(bestSize/1024).toFixed(2)} KB`, percent: 100 });
    self.postMessage({ type: "COMPLETE", buffer: bestBuffer }, [bestBuffer.buffer]);
  } catch (error) {
    self.postMessage({ type: "ERROR", error: error.message || "Compression engine failed." });
  }
};
