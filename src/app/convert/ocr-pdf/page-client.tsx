'use client'
import { useState } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import Tesseract from 'tesseract.js'
import { getPdfPageImages } from '@/lib/pdf-utils'
import { Copy, Download, ScanText, FileText, Check, AlertCircle, Trash2, Globe, FileCheck } from 'lucide-react'

const LANGUAGES = [
  { code: 'eng', label: 'English' },
  { code: 'spa', label: 'Spanish' },
  { code: 'fra', label: 'French' },
  { code: 'deu', label: 'German' },
  { code: 'hin', label: 'Hindi' },
  { code: 'ara', label: 'Arabic' },
  { code: 'chi_sim', label: 'Chinese (Simplified)' },
  { code: 'jpn', label: 'Japanese' },
]

export default function OCRPDF() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [pages, setPages] = useState<{ image: string; text: string }[]>([])
  const [progress, setProgress] = useState(0)
  const [copying, setCopying] = useState(false)
  
  // OCR Options
  const [ocrLang, setOcrLang] = useState('eng')
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null)

  const handleProcess = async () => {
    if (!file) return
    setIsProcessing(true)
    setPages([])
    setPdfBytes(null)
    
    try {
      let imageUrls: string[] = []
      if (file.type === 'application/pdf') {
        imageUrls = await getPdfPageImages(file)
      } else {
        imageUrls = [URL.createObjectURL(file)]
      }

      // Initialize Tesseract Worker with selected language
      const worker = await Tesseract.createWorker(ocrLang, 1, {
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
      
      // Get Searchable PDF buffer data
      const { data: pdfData } = await worker.getPDF('Docuvate Searchable Document')
      setPdfBytes(new Uint8Array(pdfData))
      
      await worker.terminate()
      setPages(results)
    } catch (e) {
      console.error("OCR process failed:", e)
      alert("Error processing OCR. Please ensure files are valid, and try again.")
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
    a.download = `Docuvate-OCR-${file?.name.split('.')[0] || 'extracted'}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadSearchablePdf = () => {
    if (!pdfBytes) return
    const blob = new Blob([pdfBytes], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Docuvate-Searchable-${file?.name.split('.')[0] || 'document'}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!file) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-black text-center text-gray-800 mb-4 tracking-tight">OCR Scanner Suite</h1>
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
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800 text-xs uppercase tracking-widest flex items-center gap-2">
              <Globe className="w-4 h-4 text-red-500" /> Language Settings
            </h3>
            <div>
              <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">OCR Language</label>
              <select 
                value={ocrLang} 
                onChange={(e) => setOcrLang(e.target.value)}
                className="w-full border rounded-lg p-2 text-sm bg-white shadow-sm focus:ring-2 focus:ring-red-500 outline-none"
                disabled={isProcessing}
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
            <h3 className="font-bold text-gray-800 text-xs uppercase tracking-widest">Status Details</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500 font-bold uppercase">Status</span>
                <span className={isProcessing ? 'text-orange-500 font-bold' : 'text-green-500 font-bold'}>{isProcessing ? 'Processing' : 'Idle'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-bold uppercase">Input File</span>
                <span className="text-gray-800 font-bold truncate max-w-[120px]" title={file.name}>{file.name}</span>
              </div>
            </div>
          </div>
          
          {pages.length > 0 && (
            <div className="space-y-2">
              <button 
                onClick={() => copyToClipboard(pages.map(p => p.text).join('\n\n'))}
                className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {copying ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copying ? 'Copied!' : 'Copy All Text'}
              </button>
              <button onClick={downloadText} className="w-full py-2.5 bg-white text-gray-700 font-bold rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer">
                <Download className="w-4 h-4 text-gray-400" /> Download Text (.TXT)
              </button>
              {pdfBytes && (
                <button onClick={downloadSearchablePdf} className="w-full py-2.5 bg-green-50 text-green-700 border border-green-200 font-bold rounded-lg hover:bg-green-100 flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer">
                  <FileCheck className="w-4 h-4" /> Export Searchable PDF
                </button>
              )}
            </div>
          )}

          <div className="p-2 space-y-4">
            <div className="flex items-start gap-2 text-[10px] text-gray-400 leading-relaxed bg-gray-50 p-3 rounded-lg border border-dashed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Languages other than English will require Tesseract to fetch additional dictionaries on-the-fly. Output indexing is 100% private.</span>
            </div>
            <button onClick={() => { setFile(null); setPages([]); setPdfBytes(null); }} className="w-full text-xs font-bold text-red-500 py-2 hover:bg-red-50 rounded-lg transition-all flex items-center justify-center gap-2 border border-dashed border-red-200">
              <Trash2 className="w-3.5 h-3.5" /> Clear Workspace
            </button>
          </div>
        </div>
      }
    >
      <div className="max-w-5xl mx-auto w-full space-y-8 p-4">
        {pages.length === 0 && !isProcessing && (
          <div className="bg-white p-8 rounded-2xl border border-gray-200 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 border">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Document Loaded</h3>
            <p className="text-sm text-gray-500 mb-6">Select your scanning language and click &quot;Extract All Text&quot; to begin the process.</p>
            <div className="px-4 py-2 bg-gray-100 rounded-lg text-xs font-mono text-gray-600 border truncate max-w-[300px]">{file.name}</div>
          </div>
        )}

        {isProcessing && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border shadow-sm">
            <div className="w-24 h-24 relative mb-6">
              <div className="absolute inset-0 border-4 border-red-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-red-500 rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center font-black text-red-600">{progress}%</div>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2 tracking-tight">Extracting Text & Layout Matrices...</h3>
            <p className="text-sm text-gray-500 animate-pulse">Running Tesseract.js WASM engine locally</p>
          </div>
        )}

        {pages.map((page, idx) => (
          <div key={idx} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden flex flex-col md:flex-row h-auto md:h-[400px]">
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
