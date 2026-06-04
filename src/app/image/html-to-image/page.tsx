'use client'
import { useState, useRef, useEffect } from 'react'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import html2canvas from 'html2canvas'
import { Globe, Code, Download, RefreshCw, Layers, Monitor, Smartphone, Tablet } from 'lucide-react'

type Viewport = 'desktop' | 'tablet' | 'mobile'

export default function HtmlToImage() {
  const [inputType, setInputType] = useState<'code' | 'url'>('code')
  const [htmlCode, setHtmlCode] = useState('<!DOCTYPE html><html><head><link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet"></head><body class="p-10 bg-gradient-to-br from-teal-400 to-blue-500 min-h-screen flex items-center justify-center"><div class="bg-white/20 backdrop-blur-md p-10 rounded-3xl shadow-2xl border border-white/30 max-w-lg w-full text-center text-white"><h1 class="text-4xl font-black mb-4">Docuvate Snapshot</h1><p class="text-white/80 leading-relaxed mb-8">Isolated iframe rendering ensures that Tailwind, custom fonts, and JS-driven components are captured perfectly in your PNG export.</p><div class="inline-block px-6 py-2 bg-white text-teal-600 rounded-full font-black uppercase text-sm shadow-xl">Premium Export Ready</div></div></body></html>')
  const [url, setUrl] = useState('')
  const [viewport, setViewport] = useState<Viewport>('desktop')
  const [isProcessing, setIsProcessing] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)



  const handleFetchUrl = async () => {
    if (!url) return
    setIsProcessing(true)
    try {
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
      const a = document.createElement('a')
      a.href = imgData
      a.download = 'Docuvate-HTML-Snapshot.png'
      a.click()
    } catch (e) {
      console.error(e)
      alert('Error rendering HTML to Image.')
    } finally {
      setIsProcessing(false)
    }
  }

  const getViewportWidth = () => {
    if (viewport === 'tablet') return '768px'
    if (viewport === 'mobile') return '375px'
    return '100%'
  }

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-120px)] bg-gray-50/50">
      <div className="py-12 bg-white border-b shadow-sm">
        <h1 className="text-4xl font-black text-center text-gray-800 mb-4 tracking-tight">HTML to Image</h1>
        <p className="text-center text-gray-500 max-w-2xl mx-auto">High-fidelity web snapshots. Capture full responsive layouts into high-resolution PNG files locally.</p>
      </div>
      
      <WorkspaceLayout onProcess={handleProcess} processLabel="Download Image" colorTheme="blue" isProcessing={isProcessing} sidebarContent={
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
             <h3 className="font-bold text-gray-800 mb-4 text-xs uppercase tracking-widest flex items-center gap-2">
               <Layers className="w-4 h-4 text-blue-500" /> Input Method
             </h3>
             <div className="grid grid-cols-2 gap-2">
               <button onClick={() => setInputType('code')} className={`py-3 px-2 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 transition-all ${inputType === 'code' ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-inner' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                 <Code className="w-4 h-4" /> Code
               </button>
               <button onClick={() => setInputType('url')} className={`py-3 px-2 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 transition-all ${inputType === 'url' ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-inner' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                 <Globe className="w-4 h-4" /> URL
               </button>
             </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
             <h3 className="font-bold text-gray-800 mb-4 text-xs uppercase tracking-widest flex items-center gap-2">
               <Monitor className="w-4 h-4 text-blue-500" /> Viewport
             </h3>
             <div className="grid grid-cols-3 gap-2">
               <button onClick={() => setViewport('desktop')} title="Desktop" className={`p-2 rounded-lg border flex justify-center transition-all ${viewport === 'desktop' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white text-gray-400'}`}><Monitor className="w-4 h-4" /></button>
               <button onClick={() => setViewport('tablet')} title="Tablet" className={`p-2 rounded-lg border flex justify-center transition-all ${viewport === 'tablet' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white text-gray-400'}`}><Tablet className="w-4 h-4" /></button>
               <button onClick={() => setViewport('mobile')} title="Mobile" className={`p-2 rounded-lg border flex justify-center transition-all ${viewport === 'mobile' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white text-gray-400'}`}><Smartphone className="w-4 h-4" /></button>
             </div>
          </div>

          {inputType === 'url' && (
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Target URL</label>
              <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com" className="w-full border rounded-lg p-2.5 text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" />
              <button onClick={handleFetchUrl} disabled={isProcessing} className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg shadow-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Fetch HTML
              </button>
            </div>
          )}

          <div className="p-2 space-y-4 text-center">
            <button onClick={() => {setHtmlCode(''); setUrl('')}} className="text-xs font-bold text-red-500 hover:underline">Reset All Inputs</button>
          </div>
        </div>
      }>
        <div className="w-full flex flex-col lg:flex-row gap-6 h-[70vh] max-w-7xl mx-auto p-4">
          <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-800 px-4 py-2 flex justify-between items-center">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-white/50">HTML/CSS Editor</span>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
              </div>
            </div>
            <textarea 
              value={htmlCode} 
              onChange={e => setHtmlCode(e.target.value)} 
              className="flex-grow w-full p-6 font-mono text-sm bg-gray-900 text-teal-300 outline-none resize-none"
              spellCheck={false}
              disabled={inputType === 'url' && isProcessing}
            />
          </div>
          
          <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Image Preview</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                <span className="text-[9px] font-bold text-blue-600 uppercase">Live Render</span>
              </div>
            </div>
            <div className="flex-grow bg-gray-100 relative overflow-auto p-4 flex justify-center">
               <div className="bg-white shadow-2xl transition-all h-full overflow-hidden" style={{ width: getViewportWidth() }}>
                 <iframe 
                   ref={iframeRef} 
                   title="Preview" 
                   className="w-full h-full border-none"
                   sandbox="allow-scripts allow-same-origin"
                   srcDoc={htmlCode}
                 />
               </div>
            </div>
          </div>
        </div>
      </WorkspaceLayout>
    </div>
  )
}
