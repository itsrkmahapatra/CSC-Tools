'use client'
import { useState } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import Tesseract from 'tesseract.js'
import { getPdfPageImages } from '@/lib/pdf-utils'
import { Copy, Download, ScanText, FileText, Check, AlertCircle, Trash2 } from 'lucide-react'

export default function OCRPDF() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [pages, setPages] = useState<{ image: string; text: string }[]>([])
  const [progress, setProgress] = useState(0)
  const [copying, setCopying] = useState(false)

  const handleProcess = async () => {
    if (!file) return
    setIsProcessing(true)
    setPages([])
    
    try {
      let imageUrls: string[] = []
      if (file.type === 'application/pdf') {
        imageUrls = await getPdfPageImages(file)
      } else {
        imageUrls = [URL.createObjectURL(file)]
      }

      const worker = await Tesseract.createWorker('eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100))
          }
        }
      })

      const results = []
      for (let i = 0; i < imageUrls.length; i++) {
        const { data: { text } } = await worker.recognize(imageUrls[i])
        results.push({ image: imageUrls[i], text })
      }
      
      await worker.terminate()
      setPages(results)
    } catch (e) {
      console.error(e)
      alert("Error processing OCR. Ensure the file is a valid image or PDF.")
    } finally {
      setIsProcessing(false)
      setProgress(0)
    }
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopying(true)
    setTimeout(() => setCopying(false), 2000)
  }

  const downloadText = () => {
    const allText = pages.map(p => p.text).join('\n\n--- PAGE BREAK ---\n\n')
    const blob = new Blob([allText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Docuvate-OCR-${file?.name}.txt`
    a.click()
  }

  if (!file) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-black text-center text-gray-800 mb-4 tracking-tight">OCR Scanner</h1>
        <p className="text-center text-gray-500 mb-8 max-w-lg mx-auto">Extract selectable text from scanned PDFs and static images using advanced local browser-based WASM engines.</p>
        <Dropzone onFilesDrop={(files) => setFile(files[0])} accept="image/*,application/pdf" multiple={false} theme="red" label="Select Image or PDF" />
      </div>
    )
  }

  return (
    <WorkspaceLayout 
      onProcess={handleProcess} 
      processLabel={isProcessing ? `Scanning... ${progress}%` : "Extract All Text"} 
      colorTheme="red"
      isProcessing={isProcessing}
      sidebarContent={
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-800 text-xs uppercase tracking-widest flex items-center gap-2 mb-4">
              <ScanText className="w-4 h-4 text-red-500" /> OCR Engine
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                <span>Status</span>
                <span className={isProcessing ? 'text-orange-500' : 'text-green-500'}>{isProcessing ? 'Processing' : 'Idle'}</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                <span>Input</span>
                <span className="text-gray-800">{file.type.split('/')[1].toUpperCase()}</span>
              </div>
            </div>
          </div>
          
          {pages.length > 0 && (
            <div className="space-y-2">
              <button 
                onClick={() => copyToClipboard(pages.map(p => p.text).join('\n\n'))}
                className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 flex items-center justify-center gap-2 transition-all"
              >
                {copying ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copying ? 'Copied!' : 'Copy All Text'}
              </button>
              <button onClick={downloadText} className="w-full py-2.5 bg-white text-gray-700 font-bold rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-2 transition-all shadow-sm">
                <Download className="w-4 h-4" /> Download .TXT
              </button>
            </div>
          )}

          <div className="p-2 space-y-4">
            <div className="flex items-start gap-2 text-[10px] text-gray-400 leading-relaxed bg-gray-50 p-3 rounded-lg border border-dashed">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Scanning multi-page PDFs may take a moment as each page is rasterized before text recognition. All processing is 100% local.</span>
            </div>
            <button onClick={() => { setFile(null); setPages([]) }} className="w-full text-xs font-bold text-red-500 py-2 hover:bg-red-50 rounded-lg transition-all flex items-center justify-center gap-2">
              <Trash2 className="w-3.5 h-3.5" /> Start New Scan
            </button>
          </div>
        </div>
      }
    >
      <div className="max-w-5xl mx-auto w-full space-y-8 p-4">
        {pages.length === 0 && !isProcessing && (
          <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Document Loaded</h3>
            <p className="text-sm text-gray-500 mb-6">Click &quot;Extract All Text&quot; to begin the optical character recognition process.</p>
            <div className="px-4 py-2 bg-gray-100 rounded-lg text-xs font-mono text-gray-600 border">{file.name}</div>
          </div>
        )}

        {isProcessing && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border shadow-sm">
            <div className="w-24 h-24 relative mb-6">
              <div className="absolute inset-0 border-4 border-red-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-red-500 rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center font-black text-red-600">{progress}%</div>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2 tracking-tight">Extracting Text Matrix...</h3>
            <p className="text-sm text-gray-500 animate-pulse">Running Tesseract.js WASM engine locally</p>
          </div>
        )}

        {pages.map((page, idx) => (
          <div key={idx} className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col md:flex-row h-auto md:h-[400px]">
            <div className="w-full md:w-1/3 bg-gray-50 p-4 border-b md:border-b-0 md:border-r border-gray-100 flex items-center justify-center relative">
              <span className="absolute top-4 left-4 bg-black/80 text-white text-[10px] font-black px-2 py-1 rounded shadow-lg uppercase tracking-widest z-10">PAGE {idx + 1}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={page.image} alt={`Page ${idx + 1}`} className="max-w-full max-h-full object-contain shadow-2xl rounded" />
            </div>
            <div className="flex-1 flex flex-col p-6 bg-white relative">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Extracted Results</h4>
                <button onClick={() => copyToClipboard(page.text)} className="p-2 hover:bg-gray-100 rounded-lg transition-all text-gray-400 hover:text-blue-500 group" title="Copy page text">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <textarea 
                readOnly 
                value={page.text} 
                className="flex-grow w-full text-sm text-gray-700 bg-white resize-none outline-none leading-relaxed font-medium" 
                placeholder="Recognition in progress..." 
              />
            </div>
          </div>
        ))}
      </div>
    </WorkspaceLayout>
  )
}
