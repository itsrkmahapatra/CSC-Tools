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
  
  try {
    self.postMessage({ type: "PROGRESS", message: "Auditing resource baseline...", percent: 5 });
    
    // We utilize PDF.js to parse the document tree and extract rendered layers
    const pdf = await pdfjsLib.getDocument({ data: fileBuffer }).promise;
    const numPages = pdf.numPages;
    
    let S = 1.0;
    let Q = 0.85;
    let currentSize = Infinity;
    let bestBuffer = null;
    let iteration = 1;
    
    // Adaptive Binary Search Optimization Loop
    while (true) {
      self.postMessage({ 
        type: "PROGRESS", 
        message: `Iteration ${iteration}: Downsampling at Scale ${(S*100).toFixed(0)}%, Quality ${(Q*100).toFixed(0)}%`, 
        percent: Math.min(95, 10 + (iteration * 10)) 
      });
      
      const newPdf = await PDFLib.PDFDocument.create();
      
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: S });
        
        // 1. Canvas Offscreen Allocation
        const canvas = new OffscreenCanvas(viewport.width, viewport.height);
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("OffscreenCanvas 2D context failed.");
        
        // 2. Downsampling Pipeline
        await page.render({ canvasContext: ctx, viewport: viewport }).promise;
        
        // 3. Lossy Compression Stream
        const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: Q });
        const arrayBuffer = await blob.arrayBuffer();
        
        // 4. Structural Tree Interception (Rebuilding via pdf-lib)
        const image = await newPdf.embedJpg(arrayBuffer);
        const newPage = newPdf.addPage([image.width, image.height]);
        newPage.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
      }
      
      // 5. Evaluation Check
      const pdfBytes = await newPdf.save();
      currentSize = pdfBytes.byteLength;
      bestBuffer = pdfBytes;
      
      if (currentSize <= targetBytes) {
        self.postMessage({ type: "PROGRESS", message: `Optimization threshold achieved! Final Size: ${(currentSize/1024).toFixed(2)} KB`, percent: 100 });
        break;
      }
      
      // Safety degradation limits
      if (S <= 0.25 && Q <= 0.40) {
        self.postMessage({ type: "PROGRESS", message: `Safety floor reached. Best possible size: ${(currentSize/1024).toFixed(2)} KB`, percent: 100 });
        break;
      }
      
      // Adjust parameters systematically for next loop
      S = Math.max(0.25, S * 0.85);
      Q = Math.max(0.40, Q - 0.10);
      iteration++;
    }
    
    self.postMessage({ type: "COMPLETE", buffer: bestBuffer }, [bestBuffer.buffer]);
  } catch (error) {
    self.postMessage({ type: "ERROR", error: error.message || "Worker thread failed." });
  }
};
