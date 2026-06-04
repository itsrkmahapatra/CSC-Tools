'use client'
import { useState, useRef, useEffect } from 'react'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { Globe, Code, Download, RefreshCw, Layers } from 'lucide-react'

export default function HtmlToPdf() {
  const [inputType, setInputType] = useState<'code' | 'url'>('code')
  const [htmlCode, setHtmlCode] = useState('<!DOCTYPE html><html><head><link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet"></head><body class="p-10 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen flex items-center justify-center"><div class="bg-white p-8 rounded-2xl shadow-2xl border border-indigo-200 max-w-md w-full"><h1 class="text-3xl font-black text-indigo-600 mb-4">Docuvate PDF</h1><p class="text-gray-600 leading-relaxed mb-6">This HTML was rendered using an iframe to ensure all CSS and external assets load correctly before the snapshot.</p><div class="flex justify-between items-center"><span class="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase">Ready to Export</span><div class="h-8 w-8 bg-indigo-500 rounded-lg"></div></div></div></body></html>')
  const [url, setUrl] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)



  const handleFetchUrl = async () => {
    if (!url) return
    setIsProcessing(true)
    try {
      // Using a proxy or direct fetch if CORS allows
      const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`)
      const data = await response.json()
      if (data.contents) {
        setHtmlCode(data.contents)
        setInputType('code')
      }
    } catch (e) {
      console.error(e)
      alert('Error fetching URL. Many sites block direct access. Try pasting the source code manually.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleProcess = async () => {
    const iframe = iframeRef.current
    if (!iframe || !iframe.contentWindow) return
    setIsProcessing(true)
    try {
      const element = iframe.contentWindow.document.documentElement
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true,
        allowTaint: true,
        logging: false,
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      })
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
      pdf.save('Docuvate-HTML-Export.pdf')
    } catch (e) {
      console.error(e)
      alert('Error rendering HTML to PDF. Ensure all assets are CORS-compliant.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-120px)] bg-gray-50/50">
      <div className="py-12 bg-white border-b shadow-sm">
        <h1 className="text-4xl font-black text-center text-gray-800 mb-4 tracking-tight">HTML to PDF</h1>
        <p className="text-center text-gray-500 max-w-2xl mx-auto">Professional vector-standard PDF generation from raw HTML code or live URLs with full CSS support.</p>
      </div>
      
      <WorkspaceLayout onProcess={handleProcess} processLabel="Download PDF" colorTheme="red" isProcessing={isProcessing} sidebarContent={
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
             <h3 className="font-bold text-gray-800 mb-4 text-xs uppercase tracking-widest flex items-center gap-2">
               <Layers className="w-4 h-4 text-red-500" /> Input Method
             </h3>
             <div className="grid grid-cols-2 gap-2">
               <button 
                 onClick={() => setInputType('code')} 
                 className={`py-3 px-2 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 transition-all ${inputType === 'code' ? 'bg-red-50 border-red-500 text-red-700 shadow-inner' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
               >
                 <Code className="w-4 h-4" /> Code
               </button>
               <button 
                 onClick={() => setInputType('url')} 
                 className={`py-3 px-2 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 transition-all ${inputType === 'url' ? 'bg-red-50 border-red-500 text-red-700 shadow-inner' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
               >
                 <Globe className="w-4 h-4" /> URL
               </button>
             </div>
          </div>

          {inputType === 'url' && (
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Target URL</label>
              <div className="relative">
                <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com" className="w-full border rounded-lg p-2.5 text-sm bg-gray-50 focus:ring-2 focus:ring-red-500 outline-none transition-all" />
              </div>
              <button onClick={handleFetchUrl} disabled={isProcessing} className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg shadow-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
                {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Fetch HTML
              </button>
            </div>
          )}

          <div className="p-2 space-y-4">
            <div className="flex items-center gap-2 text-gray-400 text-[10px] font-medium leading-tight bg-gray-50 p-3 rounded-lg border border-dashed">
              <span className="text-lg">💡</span>
              <span>We use an isolated sandbox (iframe) to render your code, ensuring external libraries like Tailwind or Google Fonts work as expected.</span>
            </div>
            <button onClick={() => {setHtmlCode(''); setUrl('')}} className="w-full text-xs font-bold text-red-500 hover:underline">Reset All Inputs</button>
          </div>
        </div>
      }>
        <div className="w-full flex flex-col lg:flex-row gap-6 h-[70vh] max-w-7xl mx-auto p-4">
          <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-800 px-4 py-2 flex justify-between items-center">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Source Editor</span>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
              </div>
            </div>
            <textarea 
              value={htmlCode} 
              onChange={e => setHtmlCode(e.target.value)} 
              className="flex-grow w-full p-6 font-mono text-sm bg-gray-900 text-indigo-300 outline-none resize-none selection:bg-indigo-500/30"
              spellCheck={false}
              disabled={inputType === 'url' && isProcessing}
            />
          </div>
          
          <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Live Document Preview</span>
              <span className="px-2 py-0.5 rounded-md bg-green-100 text-green-700 text-[9px] font-bold">REAL-TIME</span>
            </div>
            <div className="flex-grow bg-white relative overflow-hidden">
               <iframe 
                 ref={iframeRef} 
                 title="Preview" 
                 className="absolute inset-0 w-full h-full border-none"
                 sandbox="allow-scripts allow-same-origin"
                 srcDoc={htmlCode}
               />
            </div>
          </div>
        </div>
      </WorkspaceLayout>
    </div>
  )
}
