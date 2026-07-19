'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import { Wand2, Image as ImageIcon, Download, Loader2, Sliders, Ghost, RefreshCw, AlertCircle } from 'lucide-react'

function RemoveBGTool() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<string | null>(null)
  
  // Customization Options
  const [bgColor, setBgColor] = useState<string>('transparent')
  const [bgImage, setBgImage] = useState<string | null>(null)
  const [edgeBlur, setEdgeBlur] = useState<number>(0)
  const [shadow, setShadow] = useState<number>(0)
  
  // Internal State
  const [subjectImage, setSubjectImage] = useState<HTMLImageElement | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const mainCanvasRef = useRef<HTMLCanvasElement>(null)
  const originalImageRef = useRef<HTMLImageElement | null>(null)

  const handleFilesDrop = (droppedFiles: File[]) => {
    const f = droppedFiles[0]
    setFile(f)
    const url = URL.createObjectURL(f)
    setPreview(url)
    setResult(null)
    setError(null)
    setSubjectImage(null)
    setProgress(0)

    const img = new Image()
    img.src = url
    originalImageRef.current = img
  }

  const handleProcess = async () => {
    if (!file) return
    setIsProcessing(true)
    setError(null)
    setProgress(0)
    
    try {
      const removeBackground = (await import('@imgly/background-removal')).default
      
      const config = {
        progress: (key: string, current: number, total: number) => {
          if (total > 0) {
            setProgress(Math.round((current / total) * 100))
          }
        }
      }

      // Perform local background removal via WASM/ONNX
      const outputBlob = await removeBackground(file, config)
      const outputUrl = URL.createObjectURL(outputBlob)
      
      const img = new Image()
      img.src = outputUrl
      img.onload = () => {
        setSubjectImage(img)
        setIsProcessing(false)
        setProgress(100)
      }
    } catch (e: any) {
      console.error("AI Background Removal failed:", e)
      setError("Local AI Background Removal failed. Error: " + (e.message || "Unknown error"))
      setIsProcessing(false)
      setProgress(0)
    }
  }

  const renderFinal = useCallback(async () => {
    if (!originalImageRef.current || !mainCanvasRef.current || !subjectImage) return
    const img = originalImageRef.current
    const canvas = mainCanvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Ensure canvas dimensions match original image
    canvas.width = img.width
    canvas.height = img.height
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 1. Draw Background (Color or Custom Image)
    if (bgImage) {
      const bImg = new Image()
      bImg.crossOrigin = "anonymous"
      bImg.src = bgImage
      await new Promise((resolve) => { bImg.onload = resolve; })
      ctx.drawImage(bImg, 0, 0, canvas.width, canvas.height)
    } else if (bgColor !== 'transparent') {
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    // 2. Draw Shadow (Under subject)
    if (shadow > 0) {
      ctx.save()
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
      ctx.shadowBlur = shadow
      ctx.shadowOffsetX = shadow / 4
      ctx.shadowOffsetY = shadow / 4
      ctx.drawImage(subjectImage, 0, 0, canvas.width, canvas.height)
      ctx.restore()
    }

    // 3. Draw Cut-out Subject (with optional edge feather blur)
    ctx.save()
    if (edgeBlur > 0) {
      ctx.filter = `blur(${edgeBlur}px)`
    }
    ctx.drawImage(subjectImage, 0, 0, canvas.width, canvas.height)
    ctx.restore()
    
    // 4. Finalize result URL
    setResult(canvas.toDataURL('image/png'))
  }, [bgColor, bgImage, edgeBlur, shadow, subjectImage])

  // Redraw canvas whenever subject, background, or parameters change
  useEffect(() => {
    if (subjectImage) {
      renderFinal()
    }
  }, [subjectImage, bgColor, bgImage, edgeBlur, shadow, renderFinal])

  const handleDownload = () => {
    if (!result) return
    const a = document.createElement('a')
    a.href = result
    a.download = `Docuvate-Removed-BG-${file?.name || 'image'}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      setBgImage(URL.createObjectURL(f))
      setBgColor('custom')
    }
  }

  if (!file) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-black text-center text-gray-800 mb-4 tracking-tight">Pro AI Background Remover</h1>
        <p className="text-center text-gray-500 mb-8 px-4 max-w-2xl mx-auto leading-relaxed">
          High-accuracy subject isolation powered by local ONNX WebAssembly segmentation. 
          Analyze complex edges, add professional shadows, and change background patterns locally.
        </p>
        <Dropzone onFilesDrop={handleFilesDrop} accept="image/*" multiple={false} theme="indigo" label="Select Image to Remove Background" />
      </div>
    )
  }

  return (
    <WorkspaceLayout 
      onProcess={result ? handleDownload : handleProcess} 
      processLabel={result ? "Download Image" : (isProcessing ? `Segmenting... ${progress}%` : "Remove Background")} 
      colorTheme="indigo"
      isProcessing={isProcessing}
      sidebarContent={
        <div className="space-y-6">
          {result && (
            <>
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-indigo-600 mb-2">
                   <Sliders className="w-4 h-4" />
                   <h3 className="font-black text-[10px] uppercase tracking-wider">Adjustment Tools</h3>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Edge Blur</label>
                    <span className="text-[10px] font-bold text-indigo-600">{edgeBlur}px</span>
                  </div>
                  <input type="range" min="0" max="10" step="1" value={edgeBlur} onChange={(e) => setEdgeBlur(parseInt(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Drop Shadow</label>
                    <span className="text-[10px] font-bold text-indigo-600">{shadow}px</span>
                  </div>
                  <input type="range" min="0" max="40" step="2" value={shadow} onChange={(e) => setShadow(parseInt(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                </div>
              </div>

              <div className="bg-indigo-600 p-4 rounded-xl text-white shadow-lg space-y-4">
                <div className="flex items-center gap-2">
                   <Ghost className="w-4 h-4" />
                   <h3 className="font-black text-[10px] uppercase tracking-wider">Background Layer</h3>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {['transparent', '#ffffff', '#000000', '#f3f4f6', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6'].map(c => (
                    <button 
                      key={c} 
                      onClick={() => { setBgColor(c); setBgImage(null); }}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${bgColor === c ? 'border-white scale-110' : 'border-indigo-400 opacity-60 hover:opacity-100'}`}
                      style={{ 
                        backgroundColor: c === 'transparent' ? undefined : c, 
                        backgroundImage: c === 'transparent' ? 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAACpJREFUGFdjZEADJgY0QC6AkgAJAAnIAtkgCSQBWSALJIEkIAtkAwM2BQCz8A8LJ0Y4GAAAAABJRU5ErkJggg==")' : undefined 
                      }}
                      title={c}
                    />
                  ))}
                </div>
                <label className="flex items-center justify-center w-full py-2 bg-indigo-500 hover:bg-indigo-400 rounded-lg cursor-pointer transition-colors text-[10px] font-black uppercase tracking-widest border border-indigo-400">
                  <ImageIcon className="w-3.5 h-3.5 mr-2" /> Upload BG Image
                  <input type="file" className="hidden" accept="image/*" onChange={handleBgImageUpload} />
                </label>
              </div>
            </>
          )}

          <button onClick={() => { setFile(null); setResult(null); setPreview(null); setBgImage(null); setBgColor('transparent'); setError(null); setSubjectImage(null); setProgress(0); }} disabled={isProcessing} className="text-xs text-red-500 font-bold hover:underline w-full text-center py-2.5 bg-red-50 rounded-lg flex items-center justify-center gap-2 border border-dashed border-red-200">
            <RefreshCw className="w-3.5 h-3.5" /> Start New Scan
          </button>
        </div>
      }
    >
      <div className="w-full flex flex-col items-center">
        <div 
          className="relative bg-white p-4 shadow-2xl border-4 border-gray-200 rounded-3xl overflow-hidden max-w-3xl w-full min-h-[400px] flex items-center justify-center transition-all duration-500"
          style={{ 
            backgroundColor: bgColor === 'transparent' ? '#f3f4f6' : (bgColor === 'custom' ? 'transparent' : bgColor),
            backgroundImage: bgColor === 'transparent' ? 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAACpJREFUGFdjZEADJgY0QC6AkgAJAAnIAtkgCSQBWSALJIEkIAtkAwM2BQCz8A8LJ0Y4GAAAAABJRU5ErkJggg==")' : (bgImage ? `url(${bgImage})` : undefined),
            backgroundSize: bgColor === 'transparent' ? 'auto' : 'cover',
            backgroundPosition: 'center'
          }}
        >
          <canvas ref={mainCanvasRef} className={`max-w-full max-h-[70vh] object-contain shadow-2xl ${!result ? 'hidden' : 'animate-in fade-in duration-500'}`} />
          {!result && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview!} alt="Original" className={`block max-w-full h-auto mx-auto transition-all ${isProcessing ? 'opacity-25 blur-md scale-105' : 'opacity-95 shadow-lg rounded-lg'}`} />
          )}
          
          {!result && !isProcessing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
              <button className="bg-indigo-600 text-white px-10 py-5 rounded-full font-black shadow-2xl flex items-center gap-3 cursor-pointer hover:scale-105 active:scale-95 transition-all" onClick={handleProcess}>
                <Wand2 className="w-7 h-7" />
                START AI REMOVAL
              </button>
            </div>
          )}

          {isProcessing && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/30 backdrop-blur-sm">
                <div className="relative flex items-center justify-center w-24 h-24 mb-4">
                  <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                  <span className="font-black text-indigo-950 text-sm">{progress}%</span>
                </div>
                <p className="text-indigo-950 font-black uppercase tracking-widest text-xs text-center bg-white/80 px-6 py-2 rounded-full shadow-md animate-pulse">Running segmentation locally...</p>
             </div>
          )}
        </div>
        
        {result && (
           <div className="mt-8 flex items-center gap-4 bg-white px-8 py-4 rounded-3xl shadow-2xl border border-indigo-50 animate-in slide-in-from-bottom duration-500">
              <div className="flex items-center gap-2 border-r pr-6 border-gray-100">
                 <span className="text-[10px] font-black text-gray-400 uppercase">Status</span>
                 <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100">SUCCESS</span>
              </div>
              <button onClick={handleDownload} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition-colors font-black text-xs uppercase tracking-widest">
                <Download className="w-5 h-5" />
                Export cut-out png
              </button>
           </div>
        )}
        
        {error && (
          <div className="mt-8 max-w-md mx-auto bg-red-50 p-6 rounded-2xl border border-red-100 flex flex-col items-center">
            <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
            <p className="text-xs text-red-800 text-center font-bold mb-4">{error}</p>
            <button onClick={handleProcess} className="bg-red-600 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-wider">Retry Removal</button>
          </div>
        )}
      </div>
    </WorkspaceLayout>
  )
}

const RemoveBackground = dynamic(() => Promise.resolve(RemoveBGTool), {
  ssr: false
})

export default function Page() {
  return (
    <ErrorBoundary>
      <RemoveBackground />
    </ErrorBoundary>
  )
}
